/**
 * Unit tests for the binary-file input resolver (src/cli/file-input.ts).
 *
 * resolveFile mirrors resolveBody's resolution-tuple shape; tests assert the
 * shape contract end-to-end (missing flag → typed error, missing file → typed
 * error, both `read` modes stat-only — the bytes are no longer read into the
 * CLI heap because the multipart pipeline streams them from disk — and
 * --filename override wins over basename).
 *
 * PR3a additions: `--file -` stdin sentinel. The resolver becomes async so
 * the stdin source can drain `process.stdin` under an `AbortController`
 * deadline. Tests stub `process.stdin` with a `Readable.from()` to feed
 * known bytes; the TTY check is exercised by toggling `process.stdin.isTTY`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { resolveFile, readStdinBinary } from '../src/cli/file-input.js';

describe('resolveFile', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-file-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('rejects missing --file flag', async () => {
        const r = await resolveFile({}, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--file <path> required');
    });

    it('rejects empty --file flag', async () => {
        const r = await resolveFile({ fileFlag: '' }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--file <path> required');
    });

    it('rejects nonexistent path', async () => {
        const r = await resolveFile({ fileFlag: join(tmp, 'missing.bin') }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('Cannot stat --file');
    });

    it('rejects a directory', async () => {
        const sub = join(tmp, 'sub');
        mkdirSync(sub);
        const r = await resolveFile({ fileFlag: sub }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('not a regular file');
    });

    it('rejects a symbolic link', async () => {
        const target = join(tmp, 'target.bin');
        writeFileSync(target, Buffer.from('content'));
        const sym = join(tmp, 'symlink.bin');
        try {
            symlinkSync(target, sym);
        } catch {
            // Windows fallback or permission issues: skip
            return;
        }

        const r = await resolveFile({ fileFlag: sym }, { read: false });
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('Cannot stat --file');
        }
    });

    it('stat-only mode returns path/filename/size without contents (source=file)', async () => {
        const p = join(tmp, 'foo.png');
        writeFileSync(p, Buffer.from([1, 2, 3, 4, 5]));
        const r = await resolveFile({ fileFlag: p }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.path).toBe(p);
            expect(r.filename).toBe('foo.png');
            expect(r.size).toBe(5);
            expect(r.contents).toBeUndefined();
            expect(r.source).toBe('file');
        }
    });

    it('read mode also returns stat-only (file streamed lazily by HTTP pipeline)', async () => {
        // For filesystem paths, both `read: true` and `read: false` stat-only.
        // The `read` flag is retained for API compatibility but no longer loads
        // bytes into memory — uploads stream from disk via `node:fs.openAsBlob`
        // inside `requestMultipart`. `source` is still set to 'file'.
        const p = join(tmp, 'bar.bin');
        const bytes = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
        writeFileSync(p, bytes);
        const r = await resolveFile({ fileFlag: p }, { read: true });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.path).toBe(p);
            expect(r.size).toBe(4);
            expect(r.source).toBe('file');
        } else {
            expect.fail('expected ok=true');
        }
    });

    it('--filename overrides basename', async () => {
        const p = join(tmp, 'out.bin');
        writeFileSync(p, Buffer.from('x'));
        const r = await resolveFile({ fileFlag: p, filenameFlag: 'crash-report.bin' }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.filename).toBe('crash-report.bin');
    });

    it('empty --filename falls back to basename', async () => {
        const p = join(tmp, 'kept.png');
        writeFileSync(p, Buffer.from('x'));
        const r = await resolveFile({ fileFlag: p, filenameFlag: '' }, { read: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.filename).toBe('kept.png');
    });

    // ── --file '-' (stdin) ────────────────────────────────────────────────

    describe("--file '-' (stdin)", () => {
        const ORIG_STDIN = process.stdin;
        const ORIG_IS_TTY = process.stdin.isTTY;

        afterEach(() => {
            // Restore real stdin after each test. Object.defineProperty so we
            // can replace the read-only `process.stdin` for the test window.
            Object.defineProperty(process, 'stdin', {
                value: ORIG_STDIN,
                configurable: true,
                writable: false,
            });
            (process.stdin as { isTTY?: boolean }).isTTY = ORIG_IS_TTY;
        });

        function stubStdin(bytes: Uint8Array | string): void {
            const readable = Readable.from(typeof bytes === 'string' ? Buffer.from(bytes) : Buffer.from(bytes));
            (readable as { isTTY?: boolean }).isTTY = false;
            Object.defineProperty(process, 'stdin', {
                value: readable,
                configurable: true,
                writable: false,
            });
        }

        it('rejects stdin when isTTY=true', async () => {
            (process.stdin as { isTTY?: boolean }).isTTY = true;
            const r = await resolveFile({ fileFlag: '-' }, { read: true });
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.error).toContain('stdin to be piped');
        });

        it('stat-only (dry-run) returns size 0 without draining stdin', async () => {
            stubStdin('should-not-be-read');
            const r = await resolveFile({ fileFlag: '-' }, { read: false });
            expect(r.ok).toBe(true);
            if (r.ok) {
                expect(r.path).toBe('<stdin>');
                expect(r.filename).toBe('stdin');
                expect(r.size).toBe(0);
                expect(r.contents).toBeUndefined();
                expect(r.source).toBe('stdin');
            }
        });

        it('read mode drains stdin and returns matching Uint8Array', async () => {
            const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            stubStdin(payload);
            const r = await resolveFile({ fileFlag: '-' }, { read: true });
            expect(r.ok).toBe(true);
            if (r.ok && r.contents !== undefined) {
                expect(r.path).toBe('<stdin>');
                expect(r.filename).toBe('stdin');
                expect(r.size).toBe(8);
                expect(Array.from(r.contents)).toEqual(Array.from(payload));
                expect(r.source).toBe('stdin');
            } else {
                expect.fail('expected ok with contents');
            }
        });

        it('--filename overrides default stdin filename', async () => {
            stubStdin('x');
            const r = await resolveFile({ fileFlag: '-', filenameFlag: 'crash.png' }, { read: true });
            expect(r.ok).toBe(true);
            if (r.ok) expect(r.filename).toBe('crash.png');
        });

        it('rejects stdin payload exceeding the byte cap', async () => {
            // readStdinBinary is the smaller surface and avoids the resolver-
            // level filename plumbing — exercise it directly with a tiny cap.
            const tinyCap = 4;
            const tooBig = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            stubStdin(tooBig);
            await expect(readStdinBinary(tinyCap, 5000)).rejects.toThrow(/exceeds maximum/);
        });

        it('rejects when stdin does not close before the wall-clock deadline', async () => {
            // A Readable that never pushes EOF — the for-await loop will
            // block indefinitely without the timer. Use a tiny 50ms
            // deadline to keep the test fast.
            const stalled = new Readable({
                read() {
                    /* never push, never end */
                },
            });
            (stalled as { isTTY?: boolean }).isTTY = false;
            Object.defineProperty(process, 'stdin', {
                value: stalled,
                configurable: true,
                writable: false,
            });
            await expect(readStdinBinary(1024, 50)).rejects.toThrow(/timed out/);
        });

        it('converts non-Buffer chunks (string/ArrayBuffer) into Buffer', async () => {
            // Some streams emit strings (when encoding is set) or Uint8Array
            // chunks. The reader normalizes both into Buffer before summing
            // byte lengths.
            const stream = Readable.from(['ab', 'cd']);
            (stream as { isTTY?: boolean }).isTTY = false;
            Object.defineProperty(process, 'stdin', {
                value: stream,
                configurable: true,
                writable: false,
            });
            const bytes = await readStdinBinary(1024, 5000);
            expect(bytes.byteLength).toBe(4);
            expect(Buffer.from(bytes).toString('utf-8')).toBe('abcd');
        });

        it('converts Uint8Array (non-Buffer) chunks into Buffer', async () => {
            // Exercises the `chunk instanceof Uint8Array` true branch with a
            // chunk that is NOT a Buffer. Buffer is a Uint8Array subclass, so
            // Node typically yields Buffer; we wire up a hand-rolled async
            // iterable so the values arrive as plain Uint8Arrays without
            // Node's Readable.from() coercion.
            const arr1 = new Uint8Array([1, 2, 3]);
            const arr2 = new Uint8Array([4, 5]);
            const iterable: AsyncIterable<unknown> = {
                async *[Symbol.asyncIterator](): AsyncGenerator<unknown> {
                    yield arr1;
                    yield arr2;
                },
            };
            // Stub process.stdin directly with the hand-rolled async iterable
            // so the for-await loop in readStdinBinary sees the raw values.
            Object.defineProperty(process, 'stdin', {
                value: { ...iterable, isTTY: false, destroy: (): void => undefined },
                configurable: true,
                writable: false,
            });
            const bytes = await readStdinBinary(1024, 5000);
            expect(bytes.byteLength).toBe(5);
            expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5]);
        });

        it('falls back to String(chunk) for unknown chunk types (defensive)', async () => {
            // Exercises the `else { buf = Buffer.from(String(chunk)) }` arm.
            // Hand-rolled async iterable so the number value bypasses
            // Node's Readable.from() Buffer coercion.
            const iterable: AsyncIterable<unknown> = {
                async *[Symbol.asyncIterator](): AsyncGenerator<unknown> {
                    yield 42; // String(42) === '42' → 2 bytes
                },
            };
            Object.defineProperty(process, 'stdin', {
                value: { ...iterable, isTTY: false, destroy: (): void => undefined },
                configurable: true,
                writable: false,
            });
            const bytes = await readStdinBinary(1024, 5000);
            expect(Buffer.from(bytes).toString('utf-8')).toBe('42');
        });
    });

    describe('resolveFile stdin error coercion', () => {
        it('surfaces an Error thrown by stdin reading as structured ok:false (Error branch at line 169)', async () => {
            // Exercises the `e instanceof Error ? e.message : String(e)` true
            // branch in resolveFromStdin's catch handler.
            const iterable: AsyncIterable<unknown> = {
                // eslint-disable-next-line require-yield
                async *[Symbol.asyncIterator](): AsyncGenerator<unknown> {
                    throw new Error('mid-iteration Error');
                },
            };
            Object.defineProperty(process, 'stdin', {
                value: { ...iterable, isTTY: false, destroy: (): void => undefined },
                configurable: true,
                writable: false,
            });
            const r = await resolveFile({ fileFlag: '-' }, { read: true });
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.error).toContain('mid-iteration Error');
        });
    });

    describe('readStdinBinary error coercion', () => {
        it('wraps a non-Error thrown inside the for-await loop into an Error (covers cond-expr:1)', async () => {
            // Exercises the `e instanceof Error ? e : new Error(String(e), { cause: e })`
            // false branch. Hand-rolled async iterable that throws a plain
            // string inside the iterator's body.
            const iterable: AsyncIterable<unknown> = {
                async *[Symbol.asyncIterator](): AsyncGenerator<unknown> {
                    yield Buffer.from('hi'); // first chunk
                    // eslint-disable-next-line @typescript-eslint/only-throw-error
                    throw 'plain-string-inner-failure';
                },
            };
            Object.defineProperty(process, 'stdin', {
                value: { ...iterable, isTTY: false, destroy: (): void => undefined },
                configurable: true,
                writable: false,
            });
            await expect(readStdinBinary(1024, 5000)).rejects.toThrow(/plain-string-inner-failure/);
        });
    });

    describe('readStdinBinary helper', () => {
        // Belt-and-suspenders: timer setup is idempotent across abort paths.
        // Use a fake-timers approach to verify the timer is cleared on the
        // happy path so no never-firing timer keeps the process alive.
        it('clears its timer on the happy-path EOF', async () => {
            const spy = vi.spyOn(globalThis, 'clearTimeout');
            const stream = Readable.from(Buffer.from('ok'));
            (stream as { isTTY?: boolean }).isTTY = false;
            Object.defineProperty(process, 'stdin', {
                value: stream,
                configurable: true,
                writable: false,
            });
            await readStdinBinary(1024, 5000);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
});
