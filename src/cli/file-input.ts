import { openSync, fstatSync, closeSync, constants } from 'node:fs';
import { basename } from 'node:path';
import { MAX_STDIN_UPLOAD_BYTES, STDIN_READ_TIMEOUT_MS } from '../constants.js';

/**
 * Sentinel value for the `--file -` Unix-convention stdin source. When the
 * resolver sees this literal string in `fileFlag`, it reads binary content
 * from `process.stdin` instead of opening a filesystem path.
 *
 * Centralized here so the dispatch (`index.ts`) and the resolver agree on
 * one byte-for-byte comparison; no other call site should hand-roll the
 * `=== '-'` check.
 */
export const STDIN_SENTINEL = '-';

/**
 * Raw inputs for the file-source resolver. Parallels `BodyInput` but for
 * binary attachment uploads. Only `fileFlag` is required; `filenameFlag`
 * overrides the basename-derived filename when callers want to rename on
 * upload (e.g. `./out.bin` → `crash-report.bin`).
 *
 * When `fileFlag === '-'` (`STDIN_SENTINEL`), the resolver reads bytes
 * from `process.stdin`. The default filename in that case is `stdin` —
 * callers are encouraged to pass `--filename` so TestRail stores a sensible
 * value.
 */
export interface FileInput {
    fileFlag?: string;
    filenameFlag?: string;
}

/**
 * Resolution outcome. For filesystem paths, only the validated `path`,
 * `filename`, and `size` are returned — the actual bytes are streamed from
 * disk inside `requestMultipart` via `node:fs.openAsBlob`. For stdin
 * (`source: 'stdin'`), the bytes are eagerly read into `contents` because a
 * pipe cannot be rewound. Dry-run for stdin reports `size: 0` and no
 * `contents` (preview-without-drain).
 */
export type FileResolution =
    | {
          ok: true;
          /** Display path: filesystem path or `'<stdin>'` for the stdin source. */
          path: string;
          filename: string;
          size: number;
          contents?: Uint8Array;
          fd?: number | undefined;
          /** `'file'` for filesystem reads, `'stdin'` for the `--file -` sentinel. */
          source: 'file' | 'stdin';
      }
    | { ok: false; error: string };

export interface ResolveFileOptions {
    /**
     * Retained for API compatibility but no longer meaningful for filesystem
     * paths — the execute path performs a `statSync` only, and bytes are
     * streamed from disk inside the HTTP pipeline. For stdin, `read: true`
     * drains stdin into memory (required for upload); `read: false` skips
     * the drain so dry-run is side-effect-free.
     */
    read: boolean;
}

/**
 * Resolve a `--file <path>` upload input. Async because the stdin source
 * (`--file -`) must drain `process.stdin` to read the upload payload.
 *
 * - Filesystem path: stats first; never reads bytes into memory (streaming
 *   upload pipeline). Filename derives from `basename(path)` unless
 *   `filenameFlag` is provided.
 * - Stdin (`-`): rejects when `process.stdin.isTTY` is true (no piped input);
 *   reads under a byte cap (`MAX_STDIN_UPLOAD_BYTES`) and a wall-clock
 *   deadline (`STDIN_READ_TIMEOUT_MS`) to defend against memory exhaustion
 *   and slowloris-style producers that never EOF. Default filename is
 *   `stdin`; callers should pass `--filename` for a meaningful value.
 *
 * Rejects with structured `{ ok: false }` for: missing flag, missing file,
 * non-regular file (directory, fifo, socket, broken symlink), TTY-attached
 * stdin, stdin exceeding the byte cap, and stdin not closing within the
 * deadline.
 */
export async function resolveFile(input: FileInput, opts: ResolveFileOptions): Promise<FileResolution> {
    if (input.fileFlag === undefined || input.fileFlag === '') {
        return { ok: false, error: '--file <path> required for upload actions.' };
    }

    if (input.fileFlag === STDIN_SENTINEL) {
        return resolveFromStdin(input, opts);
    }

    const path = input.fileFlag;

    let size: number;
    let fd: number | undefined;
    try {
        const flags = constants.O_RDONLY | (constants.O_NOFOLLOW || 0);
        fd = openSync(path, flags);

        const stat = fstatSync(fd);
        if (!stat.isFile()) {
            closeSync(fd);
            return { ok: false, error: `--file '${path}' is not a regular file.` };
        }
        size = stat.size;

        if (!opts.read) {
            closeSync(fd);
            fd = undefined;
        }
    } catch (e) {
        if (fd !== undefined) {
            try {
                closeSync(fd);
            } catch {
                // Ignore close errors
            }
        }
        return {
            ok: false,
            error: `Cannot stat --file '${path}': ${e instanceof Error ? e.message : String(e)}`,
        };
    }

    const filename =
        input.filenameFlag !== undefined && input.filenameFlag !== '' ? input.filenameFlag : basename(path);

    return {
        ok: true,
        path,
        filename,
        size,
        source: 'file',
        ...(fd !== undefined && { fd }),
    };
}

/**
 * Read binary content from `process.stdin` under a byte cap and a wall-clock
 * deadline, then resolve a `FileResolution`. Separated from the filesystem
 * path so the TTY rejection and timeout setup are visible in one place.
 *
 * Dry-run path: returns immediately with size 0 and no contents — draining
 * stdin would consume a pipe that the user expects to be re-runnable.
 */
async function resolveFromStdin(input: FileInput, opts: ResolveFileOptions): Promise<FileResolution> {
    if (process.stdin.isTTY === true) {
        return {
            ok: false,
            error: "--file '-' requires stdin to be piped (e.g. `cat file.bin | testrail attachment add-to-case ...`).",
        };
    }

    const filename = input.filenameFlag !== undefined && input.filenameFlag !== '' ? input.filenameFlag : 'stdin';

    if (!opts.read) {
        // Dry-run: don't drain the pipe (a pipe cannot be rewound, and the
        // user expects --dry-run to be side-effect-free). Report size 0 so
        // the preview is honest about what hasn't been read yet.
        return { ok: true, path: '<stdin>', filename, size: 0, source: 'stdin' };
    }

    let bytes: Uint8Array;
    try {
        bytes = await readStdinBinary(MAX_STDIN_UPLOAD_BYTES, STDIN_READ_TIMEOUT_MS);
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }

    return { ok: true, path: '<stdin>', filename, size: bytes.byteLength, contents: bytes, source: 'stdin' };
}

/**
 * Read `process.stdin` into a Buffer with a byte cap and a wall-clock
 * deadline. Used by the `--file -` upload path; distinct from
 * `readBoundedStdin` (text-only, synchronous, smaller cap for JSON bodies).
 *
 * Strategy:
 * - `for await (chunk of process.stdin)` accumulates Buffer chunks.
 * - An `AbortController` armed with `setTimeout(timeoutMs)` aborts the
 *   stream when the producer dribbles bytes or never EOFs. Without this,
 *   the async iterator would block on the first chunk indefinitely
 *   (the symptom SEC #24 partially fixes for text stdin).
 * - On each chunk, the running total is compared against `maxBytes` BEFORE
 *   the chunk is buffered, so an oversized producer can never allocate
 *   past the cap.
 *
 * Throws `TestRailValidationError`-style `Error` so the caller (resolver)
 * can fold the message into the `{ ok: false }` result without an extra
 * `instanceof` discriminator.
 *
 * @internal exported for unit tests.
 */
export async function readStdinBinary(maxBytes: number, timeoutMs: number): Promise<Uint8Array> {
    let timedOut = false;
    const stream = process.stdin;
    const timer = setTimeout(() => {
        timedOut = true;
        // `destroy(error)` propagates through the async iterator as a
        // throw — this is the only reliable way to cancel a `for await`
        // on a stalled Readable across Node versions (AbortSignal is not
        // wired into the default async iterator before Node 20.10).
        if (typeof (stream as { destroy?: (e?: Error) => void }).destroy === 'function') {
            (stream as { destroy: (e?: Error) => void }).destroy(new Error('stdin read deadline exceeded'));
        }
    }, timeoutMs);
    // `unref()` so a never-firing timer doesn't keep the event loop alive
    // past the natural CLI exit.
    if (typeof timer.unref === 'function') timer.unref();

    const chunks: Buffer[] = [];
    let total = 0;

    try {
        for await (const chunk of stream) {
            // Normalize: Node streams emit Buffer by default but may emit
            // strings (`setEncoding`) or Uint8Array views. Convert all
            // three into Buffer so the byte accounting is consistent.
            let buf: Buffer;
            if (chunk instanceof Buffer) {
                buf = chunk;
            } else if (typeof chunk === 'string') {
                buf = Buffer.from(chunk);
            } else if (chunk instanceof Uint8Array) {
                buf = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
            } else {
                // Defensive: unknown chunk type from a non-standard stream.
                buf = Buffer.from(String(chunk));
            }
            total += buf.byteLength;
            if (total > maxBytes) {
                throw new Error(
                    `--file '-' stdin exceeds maximum ${maxBytes} bytes. Reduce payload size or use --file <path>.`,
                );
            }
            chunks.push(buf);
        }
    } catch (e) {
        if (timedOut) {
            // Attach the underlying cause so the original throw (from
            // `stream.destroy(error)`) remains observable for debugging.
            throw new Error(`--file '-' stdin read timed out after ${timeoutMs}ms (producer did not close the pipe).`, {
                cause: e,
            });
        }
        throw e instanceof Error ? e : new Error(String(e), { cause: e });
    } finally {
        clearTimeout(timer);
    }

    if (timedOut) {
        throw new Error(`--file '-' stdin read timed out after ${timeoutMs}ms (producer did not close the pipe).`);
    }

    const out = Buffer.concat(chunks, total);
    return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
}
