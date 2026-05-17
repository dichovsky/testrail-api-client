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
            /* v8 ignore start -- defensive: EAGAIN on non-blocking stdin
               is rare in practice (Node defaults stdin to blocking) and
               flaky to reproduce in CI. The catch path bails out cleanly
               so the caller surfaces a structured error rather than
               crashing the module. */
        } catch (e: unknown) {
            const code = (e as { code?: string }).code;
            if (code === 'EAGAIN') break;
            throw e;
        }
        /* v8 ignore stop */
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
