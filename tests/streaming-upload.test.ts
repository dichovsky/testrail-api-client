/**
 * Streaming-upload regression suite for `requestMultipart` (src/client-core.ts).
 *
 * Closes BACKLOG ♻️ "CLI: streaming upload for large files".
 *
 * The previous implementation called `readFileSync(path)` in the CLI and then
 * wrapped the whole `Uint8Array` in a `Blob` — a 200 MB attachment OOM'd Node
 * on default heap settings. The new path:
 *
 *   1. CLI hands the multipart pipeline a `{ path }` descriptor.
 *   2. `requestMultipart` resolves it via `node:fs.openAsBlob`, producing a
 *      file-backed Blob whose `.stream()` reads bytes on demand.
 *   3. `fetch` consumes the FormData via that stream — the file is never
 *      resident in heap as a single Buffer.
 *
 * The invariants this suite locks in are:
 *
 *   - Path descriptors **do** flow through openAsBlob (not buffered upfront)
 *   - Heap growth stays bounded for large files (<20 MB headroom for 50 MB
 *     upload — generous to allow for Vitest harness noise)
 *   - In-memory variants (`Blob`, `Uint8Array`, `File`) still upload
 *   - Upload still does **not** retry — neither network errors nor 5xx
 *   - Abort signal still propagates (timeout aborts the stream)
 *   - File read errors surface as `TestRailApiError`, not unhandled rejections
 *   - Redirect (3xx) still rejected via `assertNotRedirect`
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, createWriteStream, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TestRailClient } from '../src/client.js';
import { TestRailApiError } from '../src/errors.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('node:dns/promises', () => ({
    default: { lookup: vi.fn().mockResolvedValue([{ address: '203.0.113.10', family: 4 }]) },
    lookup: vi.fn().mockResolvedValue([{ address: '203.0.113.10', family: 4 }]),
}));

// Mutable control object for fd-error tests.  `vi.mock` is hoisted so the
// factory captures this reference; individual tests mutate it per-test and
// reset it in afterEach to avoid cross-test pollution.
const closeSyncControl = {
    throwForFd: null as number | null,
    callsWithFd: [] as number[],
};

// Captures the path argument passed to `openAsBlob`. Used by the
// platform-specific fd-rewrite tests (Linux /proc/self/fd, Darwin /dev/fd)
// to pin that the upload pipeline rewrites the path BEFORE calling
// openAsBlob, regardless of whether openAsBlob ultimately resolves on the
// host platform. ESM namespace properties can't be redefined via vi.spyOn,
// so we wrap openAsBlob via vi.mock with a module-level recorder.
const openAsBlobRecorder: { lastPath: string | undefined } = { lastPath: undefined };

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        closeSync: (fd: number) => {
            closeSyncControl.callsWithFd.push(fd);
            if (closeSyncControl.throwForFd !== null && fd === closeSyncControl.throwForFd) {
                const err = Object.assign(new Error('EBADF: bad file descriptor, close'), { code: 'EBADF' });
                throw err;
            }
            return actual.closeSync(fd);
        },
        openAsBlob: (path: string | URL | Buffer, opts?: Parameters<typeof actual.openAsBlob>[1]) => {
            openAsBlobRecorder.lastPath = typeof path === 'string' ? path : String(path);
            return actual.openAsBlob(path, opts);
        },
    };
});

function buildClient(): TestRailClient {
    return new TestRailClient({
        baseUrl: 'https://example.testrail.io',
        email: 't@example.com',
        apiKey: 'k',
        enableCache: false,
    });
}

function mockOk(body: unknown = { attachment_id: 1 }): void {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(body),
        headers: { get: () => null },
    });
}

describe('streaming upload — requestMultipart with { path } descriptor', () => {
    let tmp: string;
    let smallPath: string;

    beforeEach(() => {
        mockFetch.mockReset();
        closeSyncControl.throwForFd = null;
        closeSyncControl.callsWithFd = [];
        openAsBlobRecorder.lastPath = undefined;
        tmp = mkdtempSync(join(tmpdir(), 'tr-streaming-'));
        smallPath = join(tmp, 'small.bin');
        writeFileSync(smallPath, Buffer.from([1, 2, 3, 4, 5]));
    });

    afterEach(() => {
        closeSyncControl.throwForFd = null;
        closeSyncControl.callsWithFd = [];
        rmSync(tmp, { recursive: true, force: true });
    });

    it('uploads a path-descriptor file (FormData body sent, success body parsed)', async () => {
        const client = buildClient();
        mockOk({ attachment_id: 99, name: 'small.bin' });

        const result = await client.attachments.addAttachmentToCase(1, { path: smallPath }, 'small.bin');
        expect(result).toEqual({ attachment_id: 99, name: 'small.bin' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('add_attachment_to_case/1');
        expect(init.method).toBe('POST');
        // FormData is what fetch sets the multipart boundary on; we don't
        // assert Content-Type because fetch (not us) injects it.
        expect(init.body).toBeInstanceOf(globalThis.FormData);
        expect(init.redirect).toBe('manual');
    });

    it('uploads via { path, fd } descriptor on POSIX platforms (covers /dev/fd and /proc/self/fd rewrites)', async () => {
        // Exercises the platform-specific fd-rewrite branches at
        // src/client-core.ts:1058-1072. On Darwin the path is rewritten to
        // /dev/fd/<fd>; on Linux to /proc/self/fd/<fd>. Both POSIX variants
        // verify that requestMultipart accepts the fd and produces a
        // file-backed Blob. On other platforms the fallback closes the fd
        // and uses the original path.
        const client = buildClient();
        mockOk({ attachment_id: 7, name: 'fd-shot.bin' });
        const fd = openSync(smallPath, 'r');
        try {
            const result = await client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 'fd-shot.bin');
            expect(result).toEqual({ attachment_id: 7, name: 'fd-shot.bin' });
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
            expect(init.body).toBeInstanceOf(globalThis.FormData);
        } finally {
            // requestMultipart closes the fd after openAsBlob (POSIX) or
            // before openAsBlob (non-POSIX). Attempt defensive close here
            // in case the test itself needs cleanup; EBADF is expected.
            try {
                closeSync(fd);
            } catch {
                // already closed by requestMultipart — expected on POSIX
            }
        }
    });

    it('does not mutate the input descriptor object (SEC #30 — immutability)', async () => {
        // requestMultipart must never zero file.fd on the caller's object.
        // The caller retains ownership of the descriptor after the upload.
        const client = buildClient();
        mockOk({ attachment_id: 55 });
        const fd = openSync(smallPath, 'r');
        const descriptor = { path: smallPath, fd };
        try {
            await client.attachments.addAttachmentToCase(1, descriptor, 'immut.bin');
            // The descriptor must be unchanged; requestMultipart tracks fd
            // via an internal variable, not by zeroing the input object.
            expect(descriptor.fd).toBe(fd);
            // On POSIX, requestMultipart closes the original fd early (after
            // openAsBlob obtains its own independent file description). Pin
            // the resource-release contract: closeSync must have been called
            // with the original fd on this platform.
            if (process.platform === 'darwin' || process.platform === 'linux') {
                expect(closeSyncControl.callsWithFd).toContain(fd);
            }
        } finally {
            try {
                closeSync(fd);
            } catch {
                // already closed by requestMultipart — expected on POSIX
            }
        }
    });

    it('respects --filename override (renames the multipart part)', async () => {
        const client = buildClient();
        mockOk();
        await client.attachments.addAttachmentToCase(1, { path: smallPath }, 'renamed.bin');

        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        const fd = init.body as globalThis.FormData;
        const part = fd.get('attachment');
        expect(part).toBeInstanceOf(globalThis.Blob);
        // File's `name` is what TestRail receives as filename
        expect((part as globalThis.File).name).toBe('renamed.bin');
    });

    it('forwards optional content-type from descriptor', async () => {
        const client = buildClient();
        mockOk();
        await client.attachments.addAttachmentToCase(1, { path: smallPath, type: 'image/png' }, 'shot.png');

        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        const fd = init.body as globalThis.FormData;
        const part = fd.get('attachment') as globalThis.Blob;
        expect(part.type).toBe('image/png');
    });

    it('surfaces ENOENT as TestRailApiError (Network error), no unhandled rejection', async () => {
        const client = buildClient();
        // No mockFetch — openAsBlob should fail before fetch runs.
        await expect(
            client.attachments.addAttachmentToCase(1, { path: join(tmp, 'does-not-exist.bin') }, 'x.bin'),
        ).rejects.toThrow(TestRailApiError);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('large file (50 MB) uploads with bounded heap growth', async () => {
        // 50 MB is small enough to keep the test fast but large enough that
        // the OLD (Buffer-in-memory) path would visibly bump RSS. We assert
        // < 20 MB growth as a generous bound — Node's GC noise plus Vitest's
        // test harness can move heap by a few MB even with no allocation.
        const bigPath = join(tmp, 'big.bin');
        const ws = createWriteStream(bigPath);
        const chunk = Buffer.alloc(1024 * 1024, 0x42); // 1 MB
        await new Promise<void>((resolve, reject) => {
            let written = 0;
            const writeChunk = (): void => {
                while (written < 50) {
                    const canContinue = ws.write(chunk);
                    written++;
                    if (!canContinue) {
                        ws.once('drain', writeChunk);
                        return;
                    }
                }
                ws.end(() => resolve());
            };
            ws.once('error', reject);
            writeChunk();
        });

        const client = buildClient();
        mockOk();

        if (global.gc) global.gc();
        const before = process.memoryUsage().heapUsed;

        await client.attachments.addAttachmentToCase(1, { path: bigPath }, 'big.bin');

        if (global.gc) global.gc();
        const after = process.memoryUsage().heapUsed;
        const growthMB = (after - before) / 1024 / 1024;

        // The body was provided as a path descriptor — fetch consumed the
        // mocked Response without actually draining the FormData stream,
        // but openAsBlob itself does not buffer. Either way, growth must
        // be << file size.
        expect(growthMB).toBeLessThan(20);
    });

    it('uploads via { path, fd } descriptor on a non-POSIX platform (covers the Linux/Darwin fallback branch)', async () => {
        // Exercises the `else` branch at src/client-core.ts:1063 (neither
        // Darwin nor Linux) — closes the fd defensively and uses the
        // original path. We override process.platform to a non-POSIX value
        // for the duration of this test.
        const origPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
        const fd = openSync(smallPath, 'r');
        try {
            const client = buildClient();
            mockOk({ attachment_id: 8, name: 'fallback.bin' });
            const result = await client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 'fallback.bin');
            expect(result).toEqual({ attachment_id: 8, name: 'fallback.bin' });
        } finally {
            try {
                closeSync(fd);
            } catch {
                // already closed (EBADF) — implementation may have closed it
            }
            Object.defineProperty(process, 'platform', { value: origPlatform, configurable: true });
        }
    });

    it('uploads via { path, fd } descriptor on Linux (covers /proc/self/fd rewrite branch)', async () => {
        // Exercises the `process.platform === 'linux'` true branch at
        // src/client-core.ts:1061. The test environment may be Darwin
        // (where /proc/self/fd does not exist), so we stub process.platform
        // to 'linux' AND use the module-level openAsBlobRecorder to capture
        // the path argument. The tightened contract: regardless of whether
        // openAsBlob ultimately resolves on this platform, the path passed
        // to it MUST be the rewritten /proc/self/fd/<fd> form — never the
        // original path.
        const origPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
        try {
            const client = buildClient();
            mockOk({ attachment_id: 9, name: 'linux-fd.bin' });
            const fd = openSync(smallPath, 'r');
            try {
                try {
                    await client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 'linux-fd.bin');
                } catch (e) {
                    // On non-Linux runners, /proc/self/fd/<fd> doesn't exist
                    // so openAsBlob rejects → surfaces as TestRailApiError.
                    // The rewrite-arg assertion below still pins the contract.
                    expect(e).toBeInstanceOf(TestRailApiError);
                }
                expect(openAsBlobRecorder.lastPath).toBe(`/proc/self/fd/${fd}`);
            } finally {
                try {
                    closeSync(fd);
                } catch {
                    // already closed
                }
            }
        } finally {
            Object.defineProperty(process, 'platform', { value: origPlatform, configurable: true });
        }
    });

    it('uploads via { path, fd } descriptor on Darwin (covers /dev/fd rewrite branch)', async () => {
        // Mirrors the Linux test above for the `process.platform === 'darwin'`
        // true branch at src/client-core.ts:1019-1020. CI runs on Linux (where
        // /dev/fd/<fd> resolves differently, or the host arm is the only one
        // exercised), so without this forced-platform test the Darwin arm is
        // uncovered on Linux CI — the env-dependent gap that drops branch
        // coverage under the 98% gate. We stub process.platform to 'darwin'
        // AND capture the path argument via openAsBlobRecorder. The tightened
        // contract: regardless of whether openAsBlob ultimately resolves on
        // this platform, the path passed to it MUST be the rewritten
        // /dev/fd/<fd> form — never the original path.
        const origPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
        try {
            const client = buildClient();
            mockOk({ attachment_id: 11, name: 'darwin-fd.bin' });
            const fd = openSync(smallPath, 'r');
            try {
                try {
                    await client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 'darwin-fd.bin');
                } catch (e) {
                    // On non-Darwin runners /dev/fd/<fd> may not resolve to the
                    // expected inode, so openAsBlob can reject → surfaces as a
                    // TestRailApiError. The rewrite-arg assertion below still
                    // pins the contract.
                    expect(e).toBeInstanceOf(TestRailApiError);
                }
                expect(openAsBlobRecorder.lastPath).toBe(`/dev/fd/${fd}`);
            } finally {
                try {
                    closeSync(fd);
                } catch {
                    // already closed by requestMultipart on POSIX
                }
            }
        } finally {
            Object.defineProperty(process, 'platform', { value: origPlatform, configurable: true });
        }
    });

    it('rethrows a body-read TestRailApiError from the error path (covers requestMultipart 1108 branch)', async () => {
        // For requestMultipart's error path: a 500 with an oversized body
        // causes the body-read to throw TestRailApiError(0, "Response body too large").
        // The catch must re-throw verbatim rather than swallow into
        // 'Unknown error', so the limit signal reaches the caller.
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            maxJsonResponseBytes: 256,
        });
        // 4 KiB error body — exceeds the 256-byte cap.
        const huge = new Uint8Array(4096);
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            body: new globalThis.ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(huge);
                    controller.close();
                },
            }),
            headers: { get: (): null => null },
        });
        await expect(client.attachments.addAttachmentToCase(1, { path: smallPath }, 'shot.bin')).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
    });

    it('upload does NOT retry on 5xx (retry-disabled invariant)', async () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            // maxRetries irrelevant — uploads never retry — but set to a
            // positive value to ensure a wrong retry implementation would
            // be caught by the call-count assertion below.
            maxRetries: 3,
        });
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            text: async () => 'down',
            headers: { get: () => null },
        });

        await expect(client.attachments.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(
            TestRailApiError,
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('upload does NOT retry on 429 (rate-limit invariant)', async () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            maxRetries: 3,
        });
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            text: async () => 'rl',
            headers: { get: () => null },
        });

        await expect(client.attachments.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(
            TestRailApiError,
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('upload does NOT retry on network error (no idempotency)', async () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            maxRetries: 3,
        });
        mockFetch.mockRejectedValueOnce(new Error('ECONNRESET'));

        await expect(client.attachments.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(
            TestRailApiError,
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('upload rejects 3xx redirect (SSRF guard preserved)', async () => {
        const client = buildClient();
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 302,
            statusText: 'Found',
            headers: {
                get: (h: string) => (h.toLowerCase() === 'location' ? 'http://169.254.169.254/' : null),
            },
            text: async () => '',
        });

        let captured: unknown = null;
        await client.attachments.addAttachmentToCase(1, { path: smallPath }, 's.bin').catch((e: unknown) => {
            captured = e;
        });
        expect(captured).toBeInstanceOf(TestRailApiError);
        const err = captured as TestRailApiError;
        expect(err.status).toBe(302);
        // The "Redirect blocked" detail lives in the structured `response`
        // field (`response.text()` is bypassed for 3xx by assertNotRedirect).
        expect(String(err.response)).toContain('Redirect blocked');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('in-memory Uint8Array path still uploads (backwards compatibility)', async () => {
        const client = buildClient();
        mockOk({ attachment_id: 7 });

        const u8 = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const result = await client.attachments.addAttachmentToCase(1, u8, 'mem.bin');
        expect(result).toEqual({ attachment_id: 7 });

        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(init.body).toBeInstanceOf(globalThis.FormData);
    });

    it('in-memory Blob path still uploads (backwards compatibility)', async () => {
        const client = buildClient();
        mockOk({ attachment_id: 8 });

        const blob = new globalThis.Blob(['hello'], { type: 'text/plain' });
        const result = await client.attachments.addAttachmentToCase(1, blob, 'mem.txt');
        expect(result).toEqual({ attachment_id: 8 });
    });

    it('path-descriptor abort mid-upload surfaces 408 (timeout invariant)', async () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            timeout: 50,
            allowPrivateHosts: true,
        });
        vi.useFakeTimers();
        mockFetch.mockImplementation((_url: string, options: RequestInit) => {
            return new Promise((_resolve, reject) => {
                options.signal?.addEventListener('abort', () => {
                    const err = new Error('aborted');
                    err.name = 'AbortError';
                    reject(err);
                });
            });
        });

        const promise = client.attachments.addAttachmentToCase(1, { path: smallPath }, 's.bin');
        // Attach handler BEFORE advancing timers to avoid unhandled-rejection noise
        const assertion = expect(promise).rejects.toThrow(/Request timeout after 50ms/);
        await vi.runAllTimersAsync();
        await assertion;
        vi.useRealTimers();
    });

    // --- FD-error / cleanup-robustness tests ---
    //
    // These pin the cleanup contract around client-core.ts lines 1140-1148:
    // the finally block calls closeSync(file.fd) inside try/catch, ensuring
    // errors in cleanup never bubble up and never suppress a prior upload error.

    it('FD invalidated before openAsBlob: surfaces TestRailApiError, no unhandled rejection', async () => {
        // Open a real fd, then immediately close it so the fd number is stale.
        // On macOS the upload path becomes /dev/fd/N; openAsBlob on a stale fd
        // throws ERR_INVALID_ARG_VALUE which the catch block wraps as a
        // TestRailApiError(0, 'Network error: ...').
        const fd = openSync(smallPath, 'r');
        closeSync(fd); // fd is now stale — subsequent /dev/fd/N access → error

        const client = buildClient();
        // No mockFetch setup — openAsBlob fails before fetch runs.

        const descriptor = { path: smallPath, fd };

        const errors: unknown[] = [];
        const unhandledHandler = (reason: unknown): void => {
            errors.push(reason);
        };
        process.on('unhandledRejection', unhandledHandler);

        let caught: unknown = null;
        try {
            await client.attachments.addAttachmentToCase(1, descriptor, 's.bin');
        } catch (e) {
            caught = e;
        } finally {
            process.off('unhandledRejection', unhandledHandler);
        }

        expect(caught).toBeInstanceOf(TestRailApiError);
        expect((caught as TestRailApiError).status).toBe(0);
        expect(errors).toHaveLength(0);
        // fetch never reached because openAsBlob failed first
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('closeSync throws EBADF during cleanup: upload still resolves, no unhandled exception', async () => {
        // Simulate a scenario where the fd is closed by an external caller
        // (e.g. GC finalizer / other thread) between upload completion and
        // the finally-block cleanup. closeSync in the finally block catches
        // its own errors, so the upload result must propagate cleanly.
        const fd = openSync(smallPath, 'r');
        // Tell the mocked closeSync to throw EBADF for this specific fd.
        closeSyncControl.throwForFd = fd;

        const client = buildClient();
        mockOk({ attachment_id: 42 });

        const errors: unknown[] = [];
        const unhandledHandler = (reason: unknown): void => {
            errors.push(reason);
        };
        process.on('unhandledRejection', unhandledHandler);

        let result: unknown;
        try {
            result = await client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 's.bin');
        } finally {
            process.off('unhandledRejection', unhandledHandler);
            // Un-arm the mock BEFORE real cleanup — otherwise the mocked
            // closeSync would throw again and the real fd would leak.
            closeSyncControl.throwForFd = null;
            // The mock threw instead of closing; release the real fd here.
            try {
                closeSync(fd);
            } catch {
                /* already stale or reassigned */
            }
        }

        expect(result).toEqual({ attachment_id: 42 });
        expect(errors).toHaveLength(0);
        // Confirm cleanup was attempted — the mock was called with our fd.
        expect(closeSyncControl.callsWithFd).toContain(fd);
    });

    it('abort + EBADF in cleanup: exactly one error surfaces (the 408), no double-throw', async () => {
        // Abort fires mid-upload (timeout) AND the finally-block closeSync
        // throws EBADF. Only the abort error (408 TestRailApiError) should
        // reach the caller; the cleanup error must be swallowed by the
        // try/catch inside finally.
        const fd = openSync(smallPath, 'r');
        closeSyncControl.throwForFd = fd;

        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 't@example.com',
            apiKey: 'k',
            enableCache: false,
            timeout: 50,
            allowPrivateHosts: true,
        });

        vi.useFakeTimers();
        mockFetch.mockImplementation((_url: string, options: RequestInit) => {
            return new Promise((_resolve, reject) => {
                options.signal?.addEventListener('abort', () => {
                    const err = new Error('aborted');
                    err.name = 'AbortError';
                    reject(err);
                });
            });
        });

        const errors: unknown[] = [];
        const unhandledHandler = (reason: unknown): void => {
            errors.push(reason);
        };
        process.on('unhandledRejection', unhandledHandler);

        const promise = client.attachments.addAttachmentToCase(1, { path: smallPath, fd }, 's.bin');
        const assertion = expect(promise).rejects.toThrow(/Request timeout after 50ms/);
        await vi.runAllTimersAsync();

        let assertionError: unknown = null;
        try {
            await assertion;
        } catch (e) {
            assertionError = e;
        } finally {
            process.off('unhandledRejection', unhandledHandler);
            vi.useRealTimers();
            // Un-arm the mock BEFORE real cleanup — otherwise the mocked
            // closeSync would throw again and the real fd would leak.
            closeSyncControl.throwForFd = null;
            try {
                closeSync(fd);
            } catch {
                /* released by mock throw path */
            }
        }

        // The assertion already verified we got the 408 timeout error.
        // Additional checks:
        expect(assertionError).toBeNull(); // the assertion itself passed (didn't rethrow)
        expect(errors).toHaveLength(0); // no unhandled rejections from cleanup
        // Confirm cleanup ran (closeSync was called with our fd) even though it threw EBADF
        expect(closeSyncControl.callsWithFd).toContain(fd);
    });
});
