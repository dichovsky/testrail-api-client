import { readSync } from 'node:fs';

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
 * @param fd File descriptor to read from. Defaults to 0 (stdin).
 *
 * @internal exported for unit tests; production callers should
 *   import from one of the call-site modules instead.
 */
export function readBoundedStdin(maxBytes: number, fd = 0): string {
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
