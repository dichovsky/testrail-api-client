/**
 * EAGAIN / error-path coverage for `readBoundedStdin` (src/cli/stdin.ts).
 *
 * The happy-path + cap tests in cli-helpers.test.ts read a real fd, so they
 * cannot exercise the `catch` arm that handles a `readSync` rejection. This
 * file isolates a `vi.mock('node:fs')` that drives `readSync` to throw, so
 * both branches of the catch are covered:
 *
 *   - `code === 'EAGAIN'` → no data yet on a non-blocking descriptor: wait and
 *     retry until data, EOF, or the deadline. Never end-of-input.
 *   - any other code      → rethrow so the caller surfaces the failure.
 *
 * The mock is file-scoped (hoisted) and must not leak into the real-fd suite,
 * hence a separate file rather than a `describe` block in cli-helpers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STDIN_READ_TIMEOUT_MS, STDIN_RETRY_INTERVAL_MS } from '../src/constants.js';

const readSyncMock = vi.fn();

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return { ...actual, readSync: readSyncMock };
});

const { readBoundedStdin } = await import('../src/cli/stdin.js');

const eagain = (): never => {
    throw Object.assign(new Error('EAGAIN: resource temporarily unavailable, read'), { code: 'EAGAIN' });
};
const deliver =
    (text: string) =>
    (_fd: number, buf: Buffer): number =>
        buf.write(text, 0, 'utf-8');

describe('readBoundedStdin — readSync error paths', () => {
    /** Virtual clock: the retry wait advances it, so no test sleeps for real. */
    let now: number;
    let wait: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        readSyncMock.mockReset();
        now = 1_000_000;
        vi.spyOn(Date, 'now').mockImplementation(() => now);
        wait = vi.spyOn(Atomics, 'wait').mockImplementation((_cell, _index, _value, timeout) => {
            now += timeout ?? 0;
            return 'timed-out';
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('treats EAGAIN as "no data yet" and keeps reading until EOF', () => {
        // The producer is slower than the reader: a chunk, a gap, the rest,
        // then EOF. Returning at the gap would hand the caller a truncated
        // body that looks complete.
        readSyncMock.mockImplementationOnce(deliver('{"title":'));
        readSyncMock.mockImplementationOnce(eagain);
        readSyncMock.mockImplementationOnce(deliver('"late"}'));
        readSyncMock.mockImplementationOnce(() => 0);

        expect(readBoundedStdin(1024, 0)).toBe('{"title":"late"}');
        expect(readSyncMock).toHaveBeenCalledTimes(4);
        expect(wait).toHaveBeenCalledExactlyOnceWith(expect.any(Int32Array), 0, 0, STDIN_RETRY_INTERVAL_MS);
    });

    it('waits for a producer that has written nothing yet instead of returning an empty string', () => {
        readSyncMock.mockImplementationOnce(eagain);
        readSyncMock.mockImplementationOnce(eagain);
        readSyncMock.mockImplementationOnce(deliver('late-key'));
        readSyncMock.mockImplementationOnce(() => 0);

        expect(readBoundedStdin(1024, 0)).toBe('late-key');
        expect(wait).toHaveBeenCalledTimes(2);
    });

    it('fails once the deadline passes rather than returning the bytes read so far', () => {
        readSyncMock.mockImplementationOnce(deliver('partial payload'));
        readSyncMock.mockImplementation(eagain);

        expect(() => readBoundedStdin(1024, 0)).toThrow(
            `stdin read timed out after ${STDIN_READ_TIMEOUT_MS}ms (producer did not close the pipe).`,
        );
        // Bounded by the deadline, not by a retry count.
        expect(now - 1_000_000).toBe(STDIN_READ_TIMEOUT_MS);
        expect(wait).toHaveBeenCalledTimes(STDIN_READ_TIMEOUT_MS / STDIN_RETRY_INTERVAL_MS);
    });

    it('rethrows when readSync throws a non-EAGAIN error', () => {
        readSyncMock.mockImplementationOnce(() => {
            throw Object.assign(new Error('EIO: i/o error, read'), { code: 'EIO' });
        });

        expect(() => readBoundedStdin(1024, 0)).toThrow(/EIO/);
    });

    it('rethrows when readSync throws an error with no code (undefined code branch)', () => {
        readSyncMock.mockImplementationOnce(() => {
            throw new Error('unexpected failure with no code');
        });

        expect(() => readBoundedStdin(1024, 0)).toThrow(/unexpected failure/);
    });
});
