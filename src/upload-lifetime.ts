import { MULTIPART_FIELD_NAME } from './constants.js';
import { bindOperation, observeOperation } from './operation-tracking.js';

/** Reason surfaced to the encoder when cleanup tears a stream down mid-upload. */
const UPLOAD_ABORTED_MESSAGE = 'Upload aborted before the request completed';

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
