/**
 * EAGAIN / error-path coverage for `readBoundedStdin` (src/cli/stdin.ts).
 *
 * The happy-path + cap tests in cli-helpers.test.ts read a real fd, so they
 * cannot exercise the `catch` arm that handles a `readSync` rejection. This
 * file isolates a `vi.mock('node:fs')` that drives `readSync` to throw, so
 * both branches of the catch are covered:
 *
 *   - `code === 'EAGAIN'` → stop reading and return what was accumulated.
 *   - any other code      → rethrow so the caller surfaces the failure.
 *
 * The mock is file-scoped (hoisted) and must not leak into the real-fd suite,
 * hence a separate file rather than a `describe` block in cli-helpers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const readSyncMock = vi.fn();

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return { ...actual, readSync: readSyncMock };
});

const { readBoundedStdin } = await import('../src/cli/stdin.js');

describe('readBoundedStdin — readSync error paths', () => {
    beforeEach(() => {
        readSyncMock.mockReset();
    });

    it('stops cleanly and returns accumulated bytes when readSync throws EAGAIN', () => {
        // First read delivers a chunk; the second read raises EAGAIN (the
        // non-blocking-stdin signal). The function must break out of the loop
        // and return the bytes read so far rather than crashing.
        readSyncMock.mockImplementationOnce((_fd: number, buf: Buffer) => {
            buf.write('partial payload', 0, 'utf-8');
            return Buffer.byteLength('partial payload');
        });
        readSyncMock.mockImplementationOnce(() => {
            throw Object.assign(new Error('EAGAIN: resource temporarily unavailable, read'), { code: 'EAGAIN' });
        });

        const result = readBoundedStdin(1024, 0);
        expect(result).toBe('partial payload');
        expect(readSyncMock).toHaveBeenCalledTimes(2);
    });

    it('breaks immediately when the very first read throws EAGAIN (empty result)', () => {
        readSyncMock.mockImplementationOnce(() => {
            throw Object.assign(new Error('EAGAIN'), { code: 'EAGAIN' });
        });

        const result = readBoundedStdin(1024, 0);
        expect(result).toBe('');
        expect(readSyncMock).toHaveBeenCalledTimes(1);
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
