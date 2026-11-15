import { readSync } from 'node:fs';

/** Input capabilities supplied by the executable or an in-process caller. */
export interface CliStdin {
    /** True only for an interactive terminal. */
    readonly isTTY: boolean;
    readonly read: (maxBytes: number) => string;
    readonly readBinary: (maxBytes: number, timeoutMs: number) => Promise<Uint8Array>;
}

/** A binary input that can be interrupted when its read deadline expires. */
export interface BinaryInputStream extends AsyncIterable<unknown> {
    destroy(error?: Error): void;
}

/**
 * Read stdin (or any file descriptor) into a UTF-8 string with a hard
 * byte cap. Replaces `readFileSync(0, 'utf-8')` which has no upper
 * bound — a pipe larger than container memory OOM-kills the process.
 *
 * Strategy: pull in 64 KiB chunks via `readSync` and accumulate. If
 * the total exceeds `maxBytes`, throw immediately (no further reads,
 * no buffering of the overflow). EOF is the `readSync` returning 0.
 *
 * The thrown Error is generic — callers (e.g. main() in index.ts and
 * resolveBody in body.ts) format it into a structured stderr message
 * with the appropriate context (which input source overflowed).
 *
 * CTF audit #24. See also `MAX_STDIN_BYTES` in src/constants.ts.
 *
 * **Scope (what this fixes):** memory-exhaustion DoS from a producer
 * that pipes a multi-GB payload. The cap is enforced before the
 * accumulated bytes exceed `maxBytes`, so the process never allocates
 * past the cap.
 *
 * **Out of scope (what this does NOT fix):** a producer that holds
 * the pipe open without ever sending more than `maxBytes` (e.g.
 * `tail -f`, a FIFO writer that never closes, a slow trickle).
 * `readSync` is a blocking syscall; without a wall-clock deadline the
 * CLI will block on the first chunk indefinitely. Adding an async
 * stream reader with `AbortController` is tracked as a follow-up in
 * `BACKLOG.md` — it requires switching `BodyInput.readStdin` from
 * `() => string` to `() => Promise<string>` and an async resolver
 * path, a larger refactor than the v3.0 release was scoped for.
 *
 * @param maxBytes Hard cap on accumulated bytes. Throws if exceeded.
 * @param fd Explicit file descriptor to read from.
 *
 * @internal exported for unit tests; production callers should
 *   import from one of the call-site modules instead.
 */
export function readBoundedStdin(maxBytes: number, fd: number): string {
    const CHUNK_SIZE = 64 * 1024;
    const buf = Buffer.alloc(CHUNK_SIZE);
    const chunks: Buffer[] = [];
    let total = 0;
    for (;;) {
        let bytesRead: number;
        try {
            bytesRead = readSync(fd, buf, 0, CHUNK_SIZE, null);
        } catch (e: unknown) {
            // EAGAIN on non-blocking stdin: no data ready right now. Node
            // defaults stdin to blocking, so this is rare in practice, but
            // when it does occur we stop reading cleanly and return what was
            // accumulated rather than crashing. Any other error is a real
            // failure and is rethrown so the caller surfaces it.
            const code = (e as { code?: string }).code;
            if (code === 'EAGAIN') break;
            throw e;
        }
        if (bytesRead === 0) break;
        total += bytesRead;
        if (total > maxBytes) {
            throw new Error(
                `Input exceeds maximum ${maxBytes} bytes. Reduce payload size or split into multiple requests.`,
            );
        }
        chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
    }
    return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Read the supplied stream into a Buffer with a byte cap and a wall-clock
 * deadline. Used by the `--file -` upload path; distinct from
 * `readBoundedStdin` (text-only, synchronous, smaller cap for JSON bodies).
 *
 * Strategy:
 * - `for await (chunk of stream)` accumulates Buffer chunks.
 * - A `setTimeout(timeoutMs)` timer destroys the
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
export async function readStdinBinary(
    stream: BinaryInputStream,
    maxBytes: number,
    timeoutMs: number,
): Promise<Uint8Array> {
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        // `destroy(error)` propagates through the async iterator as a
        // throw — this is the only reliable way to cancel a `for await`
        // on a stalled Readable across Node versions (AbortSignal is not
        // wired into the default async iterator before Node 20.10).
        stream.destroy(new Error('stdin read deadline exceeded'));
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
