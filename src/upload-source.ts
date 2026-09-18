import { openAsBlob, closeSync } from 'node:fs';
import { MULTIPART_FIELD_NAME } from './constants.js';
import { bindOperation, observeOperation } from './operation-tracking.js';
import type { BodyShape } from './http-pipeline-types.js';
import type { UploadFileInput, UploadFilePathInput } from './types.js';

/**
 * Owns a multipart upload from descriptor to consumed body.
 *
 * Before this module the lifetime of the caller's file descriptor was spread
 * across four files — the contract stated in prose on `UploadFilePathInput`,
 * the platform mapping and three separate close sites in `client-core.ts`, the
 * stream teardown here, and a `MULTIPART_FIELD_NAME` constant the builder and
 * the wrapper had to agree on by convention. Two consecutive fixes (#275, #282)
 * were both ordering bugs in that spread, and one shipped broken to every CLI
 * upload (#277). Every decision about when the descriptor is opened, handed to
 * the kernel and closed now lives here, and the field name is internal because
 * the same module appends and wraps it.
 *
 * One gap remains, pre-dating this module: the descriptor is captured when the
 * source is created but only released from inside `build()`, so a request that
 * fails before the pipeline reaches `build()` — destroyed client, DNS/SSRF
 * rejection, an already-expired aggregate deadline — leaks it. Harmless for the
 * CLI (process exit closes it) but a long-lived consumer uploading against a
 * flaky host accumulates one per failure. Closing it needs a release hook the
 * pipeline can call from its pre-fetch path, which is tracked as part of ARCH
 * #10 because that work restructures exactly that preamble.
 */

/** Reason surfaced to the encoder when cleanup tears a stream down mid-upload. */
const UPLOAD_ABORTED_MESSAGE = 'Upload aborted before the request completed';

function isFilePathInput(value: unknown): value is UploadFilePathInput {
    return (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof globalThis.Blob) &&
        !(value instanceof Uint8Array) &&
        typeof (value as { path?: unknown }).path === 'string'
    );
}

/**
 * Observe the streams actually consumed by fetch's FormData encoder. The
 * appended File belongs to this FormData; caller-owned Blobs remain untouched.
 * Keep FormData's native boundary, filename escaping, and content length.
 */
export function ownUploadStreams(formData: globalThis.FormData): () => void {
    const file = formData.get(MULTIPART_FIELD_NAME);
    if (!(file instanceof globalThis.Blob)) return () => undefined;
    const originalStream = file.stream.bind(file);
    const active = new Set<() => Promise<void>>();
    let closed = false;

    // `writable`/`configurable` mirror `defineOverride` in client-core.ts: an
    // own override that cannot be redefined turns any second pass over the same
    // entry into `TypeError: Cannot redefine property`.
    Object.defineProperty(file, 'stream', {
        writable: true,
        configurable: true,
        enumerable: false,
        value: bindOperation((): globalThis.ReadableStream<Uint8Array> => {
            if (closed) throw new Error('Upload stream is closed');
            const reader = originalStream().getReader();
            let outputController: globalThis.ReadableStreamDefaultController<Uint8Array> | undefined;
            let finished = false;
            let finish: () => void = () => undefined;
            void observeOperation(
                new Promise<void>((resolve) => {
                    finish = resolve;
                }),
            );
            const complete = (): void => {
                finished = true;
                active.delete(cancel);
                try {
                    reader.releaseLock();
                } catch {
                    /* best-effort release after cancellation */
                }
                finish();
            };
            let cancellation: Promise<void> | undefined;
            const cancel = bindOperation((): Promise<void> => {
                if (cancellation !== undefined) return cancellation;
                // Unreachable on today's call graph, and deliberately kept.
                // Reaching it needs `complete()` to have run without `cancel()`
                // — i.e. `pull` finished the part — and then a cancel anyway;
                // but `complete()` removes this entry from `active` so cleanup
                // skips it, and a stream already closed or errored short-
                // circuits `cancel` per spec. The remaining caller is the
                // platform's FormData encoder, which is external, untyped, and
                // has changed shape across undici versions, so this stays as a
                // re-entrancy guard rather than being deleted on the strength
                // of a trace. Joins the documented unreachable-branch set that
                // the 98% branch floor in vitest.config.ts accounts for.
                if (finished) return Promise.resolve();
                finished = true;
                try {
                    // Error, never close. `close()` is a clean end-of-stream, so
                    // an encoder still reading this part would emit a truncated
                    // file followed by a valid closing boundary — a well-formed
                    // upload of partial bytes that the server stores as though
                    // complete. Erroring rejects the encoder's pending read and
                    // aborts the request body instead. A consumer-initiated
                    // cancel arrives here with the stream already terminated, so
                    // this throws and its reason is irrelevant — hence no
                    // reason plumbing.
                    outputController?.error(new Error(UPLOAD_ABORTED_MESSAGE));
                } catch {
                    // A consumer-initiated cancellation already terminated it.
                }
                try {
                    cancellation = observeOperation(reader.cancel()).then(complete, complete);
                } catch {
                    complete();
                    cancellation = Promise.resolve();
                }
                return cancellation;
            });
            active.add(cancel);

            return new globalThis.ReadableStream<Uint8Array>({
                start(controller): void {
                    outputController = controller;
                },
                pull: bindOperation(async (controller): Promise<void> => {
                    try {
                        const next = await observeOperation(reader.read());
                        if (finished) return;
                        if (next.done) {
                            complete();
                            controller.close();
                        } else {
                            controller.enqueue(next.value);
                        }
                    } catch (error) {
                        if (!finished) {
                            complete();
                            controller.error(error);
                        }
                    }
                }),
                cancel,
            });
        }),
    });

    return () => {
        closed = true;
        // Cancellation is requested promptly, but settlement waits for the
        // underlying cancel AND any outstanding reads, not just this call.
        for (const cancel of active) void cancel();
    };
}

/**
 * Build the streaming-multipart body for one upload.
 *
 * The returned shape's `build()` may be called **at most once**. A second call
 * throws rather than silently producing a degraded body: the first `cleanup()`
 * has already closed the descriptor and cleared the latch, so a rebuild would
 * fall back to `file.path` and read whatever now lives there — losing exactly
 * the TOCTOU protection the descriptor exists to provide. Nothing calls it
 * twice today (a multipart body never retries, which `deriveRetryPolicy` now
 * guarantees by construction rather than by convention), so this is the
 * constraint made explicit, not a live bug.
 */
export function createUploadSource(file: UploadFileInput, filename: string): Extract<BodyShape, { kind: 'formdata' }> {
    // Track the caller-supplied fd locally so we never mutate the input
    // descriptor (SEC #30 — immutability).
    let fd: number | undefined = isFilePathInput(file) ? file.fd : undefined;
    let built = false;

    /**
     * The single close site. Idempotent: clearing `fd` first means a double
     * call, or a call racing the build-failure path, cannot double-close a
     * descriptor number the process may since have reused.
     */
    const releaseDescriptor = (): void => {
        if (fd === undefined) return;
        const releasing = fd;
        fd = undefined;
        try {
            closeSync(releasing);
        } catch {
            // best-effort: the fd may already be closed by the kernel handoff
        }
    };

    /**
     * On POSIX, stream through the descriptor rather than the path so a symlink
     * swap between open and read cannot redirect the upload. Elsewhere there is
     * no `/dev/fd` equivalent, so the path is used and the descriptor is
     * redundant immediately.
     */
    const resolveUploadPath = (input: UploadFilePathInput): string => {
        if (fd === undefined) return input.path;
        if (process.platform === 'darwin') return `/dev/fd/${fd}`;
        if (process.platform === 'linux') return `/proc/self/fd/${fd}`;
        releaseDescriptor();
        return input.path;
    };

    return {
        kind: 'formdata',
        build: async () => {
            if (built) {
                throw new Error(
                    'Upload source already consumed: the descriptor was released after the first build. ' +
                        'Create a new upload source rather than rebuilding this one.',
                );
            }
            built = true;

            try {
                // Built inside the try so file-open failures (ENOENT, EACCES,
                // EISDIR, …) surface as a structured TestRailApiError rather
                // than an unhandled TypeError.
                const formData = new globalThis.FormData();
                let blob: globalThis.Blob;

                if (isFilePathInput(file)) {
                    const opts: { type?: string } = {};
                    if (file.type !== undefined) opts.type = file.type;
                    blob = await openAsBlob(resolveUploadPath(file), opts);

                    // The descriptor deliberately stays open until the body has
                    // been consumed. `openAsBlob` does not read up front — it
                    // returns a Blob that re-opens the path lazily on the first
                    // stream pull, which happens while fetch encodes the
                    // FormData. Closing here (as an earlier version did, to
                    // shrink the concurrent-fd window of SEC #30) left
                    // `/dev/fd/<N>` dangling and killed every descriptor-bearing
                    // upload with `DOMException: The blob could not be read`
                    // (#277). Release is deferred to `cleanup`, so it is still
                    // deterministic.
                } else if (file instanceof globalThis.Blob) {
                    blob = file;
                } else {
                    // Copy binary-like input into a plain Uint8Array to satisfy
                    // BlobPart type constraints.
                    blob = new globalThis.Blob([new Uint8Array(file)]);
                }

                formData.append(MULTIPART_FIELD_NAME, blob, filename);
                const releaseStreams = ownUploadStreams(formData);

                return {
                    body: formData,
                    // Runs from executePipeline's `finally`, i.e. after the body
                    // has been consumed (or the request failed) — the earliest
                    // point the descriptor is genuinely redundant.
                    //
                    // Order matters: tear the streams down first so any in-flight
                    // read aborts against a still-valid descriptor, then release
                    // the descriptor itself.
                    cleanup: () => {
                        releaseStreams();
                        releaseDescriptor();
                    },
                };
            } catch (buildError) {
                // `cleanup` was never handed out, so release here or the
                // descriptor leaks.
                releaseDescriptor();
                throw buildError;
            }
        },
    };
}
