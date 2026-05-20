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
import { mkdtempSync, writeFileSync, rmSync, createWriteStream } from 'node:fs';
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
        tmp = mkdtempSync(join(tmpdir(), 'tr-streaming-'));
        smallPath = join(tmp, 'small.bin');
        writeFileSync(smallPath, Buffer.from([1, 2, 3, 4, 5]));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('uploads a path-descriptor file (FormData body sent, success body parsed)', async () => {
        const client = buildClient();
        mockOk({ attachment_id: 99, name: 'small.bin' });

        const result = await client.addAttachmentToCase(1, { path: smallPath }, 'small.bin');
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

    it('respects --filename override (renames the multipart part)', async () => {
        const client = buildClient();
        mockOk();
        await client.addAttachmentToCase(1, { path: smallPath }, 'renamed.bin');

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
        await client.addAttachmentToCase(1, { path: smallPath, type: 'image/png' }, 'shot.png');

        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        const fd = init.body as globalThis.FormData;
        const part = fd.get('attachment') as globalThis.Blob;
        expect(part.type).toBe('image/png');
    });

    it('surfaces ENOENT as TestRailApiError (Network error), no unhandled rejection', async () => {
        const client = buildClient();
        // No mockFetch — openAsBlob should fail before fetch runs.
        await expect(client.addAttachmentToCase(1, { path: join(tmp, 'does-not-exist.bin') }, 'x.bin')).rejects.toThrow(
            TestRailApiError,
        );
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

        await client.addAttachmentToCase(1, { path: bigPath }, 'big.bin');

        if (global.gc) global.gc();
        const after = process.memoryUsage().heapUsed;
        const growthMB = (after - before) / 1024 / 1024;

        // The body was provided as a path descriptor — fetch consumed the
        // mocked Response without actually draining the FormData stream,
        // but openAsBlob itself does not buffer. Either way, growth must
        // be << file size.
        expect(growthMB).toBeLessThan(20);
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

        await expect(client.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(TestRailApiError);
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

        await expect(client.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(TestRailApiError);
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

        await expect(client.addAttachmentToCase(1, { path: smallPath }, 's.bin')).rejects.toThrow(TestRailApiError);
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
        await client.addAttachmentToCase(1, { path: smallPath }, 's.bin').catch((e: unknown) => {
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
        const result = await client.addAttachmentToCase(1, u8, 'mem.bin');
        expect(result).toEqual({ attachment_id: 7 });

        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(init.body).toBeInstanceOf(globalThis.FormData);
    });

    it('in-memory Blob path still uploads (backwards compatibility)', async () => {
        const client = buildClient();
        mockOk({ attachment_id: 8 });

        const blob = new globalThis.Blob(['hello'], { type: 'text/plain' });
        const result = await client.addAttachmentToCase(1, blob, 'mem.txt');
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

        const promise = client.addAttachmentToCase(1, { path: smallPath }, 's.bin');
        // Attach handler BEFORE advancing timers to avoid unhandled-rejection noise
        const assertion = expect(promise).rejects.toThrow(/Request timeout after 50ms/);
        await vi.runAllTimersAsync();
        await assertion;
        vi.useRealTimers();
    });
});
