import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailApiError, TestRailValidationError } from '../src/client.js';
import { readBodyWithLimits, readBodyAsText } from '../src/body-reader.js';
import {
    DEFAULT_MAX_JSON_RESPONSE_BYTES,
    DEFAULT_MAX_BINARY_RESPONSE_BYTES,
    MAX_RESPONSE_BYTES_LIMIT,
} from '../src/constants.js';

const { mockDnsLookup } = vi.hoisted(() => ({
    mockDnsLookup: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
    lookup: mockDnsLookup,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return {
        ...actual,
        sleep: vi.fn().mockResolvedValue(undefined),
    };
});

beforeEach(() => {
    vi.resetAllMocks();
    mockDnsLookup.mockResolvedValue([]);
});

/**
 * Builds a fetch-shaped response whose body streams the supplied chunks in
 * order. `delayMs` between chunks simulates a slow upstream — used for the
 * SEC #21 slowloris-on-body deadline test.
 */
function streamingResponse(
    chunks: Uint8Array[],
    init: { status?: number; statusText?: string; delayMs?: number } = {},
): Response {
    const { status = 200, statusText = 'OK', delayMs = 0 } = init;
    const delay = (): Promise<void> =>
        delayMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();
    const body = new globalThis.ReadableStream<Uint8Array>({
        // Fold the chunks into a sequential promise chain so the inter-chunk
        // delay is awaited without an `await` lexically inside a loop. Each
        // link optionally sleeps `delayMs` then enqueues its chunk, preserving
        // the exact sequential timing the SEC #21 slowloris deadline test
        // relies on. `controller` is contextually typed by the stream source.
        start(controller) {
            return chunks
                .reduce(
                    (chain, chunk) =>
                        chain.then(() =>
                            delay().then(() => {
                                controller.enqueue(chunk);
                            }),
                        ),
                    Promise.resolve(),
                )
                .then(() => {
                    controller.close();
                });
        },
    });
    return new Response(body, { status, statusText });
}

/**
 * Builds a fetch-shaped response whose body never closes — simulates the
 * pathological slowloris case where the server holds the socket open
 * indefinitely after streaming a small head.
 */
function neverClosingResponse(initialChunk: Uint8Array, status = 200): Response {
    const body = new globalThis.ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(initialChunk);
            // Never call controller.close()
        },
    });
    return new Response(body, { status, statusText: 'OK' });
}

describe('readBodyWithLimits (SEC #12 / SEC #21)', () => {
    it('returns full body when under the byte cap', async () => {
        const res = streamingResponse([new Uint8Array([1, 2, 3, 4, 5])]);
        const out = await readBodyWithLimits(res, { maxBytes: 100, deadlineMs: 1000 });
        expect(Array.from(out)).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns body when total exactly equals the cap (off-by-one guard)', async () => {
        const data = new Uint8Array(10).fill(7);
        const res = streamingResponse([data]);
        const out = await readBodyWithLimits(res, { maxBytes: 10, deadlineMs: 1000 });
        expect(out.byteLength).toBe(10);
    });

    it('throws TestRailApiError when a single chunk exceeds the cap', async () => {
        const data = new Uint8Array(20);
        const res = streamingResponse([data]);
        await expect(readBodyWithLimits(res, { maxBytes: 10, deadlineMs: 1000 })).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
    });

    it('throws TestRailApiError when accumulated chunks exceed the cap', async () => {
        const res = streamingResponse([
            new Uint8Array(5),
            new Uint8Array(5),
            new Uint8Array(5), // total 15 > 10
        ]);
        await expect(readBodyWithLimits(res, { maxBytes: 10, deadlineMs: 1000 })).rejects.toBeInstanceOf(
            TestRailApiError,
        );
    });

    it('throws Body read timeout when deadline elapses (SEC #21 slowloris)', async () => {
        const res = neverClosingResponse(new Uint8Array([1, 2, 3]));
        await expect(readBodyWithLimits(res, { maxBytes: 1000, deadlineMs: 30 })).rejects.toMatchObject({
            status: 0,
            statusText: 'Body read timeout',
        });
    });

    it('ignores the deadline when deadlineMs is 0 (cap-only mode)', async () => {
        // With deadlineMs=0 the timer is not armed; we still finish quickly
        // because the stream closes on its own.
        const res = streamingResponse([new Uint8Array([1, 2])]);
        const out = await readBodyWithLimits(res, { maxBytes: 100, deadlineMs: 0 });
        expect(out.byteLength).toBe(2);
    });

    it('returns an empty Uint8Array when response.body is null', async () => {
        const res = new Response(null, { status: 204, statusText: 'No Content' });
        const out = await readBodyWithLimits(res, { maxBytes: 100, deadlineMs: 1000 });
        expect(out.byteLength).toBe(0);
    });

    it('falls back to arrayBuffer() when body has no getReader (mock path)', async () => {
        const fakeResponse = {
            body: {}, // truthy but no getReader
            arrayBuffer: async () => new Uint8Array([9, 8, 7]).buffer,
        } as unknown as Response;
        const out = await readBodyWithLimits(fakeResponse, { maxBytes: 100, deadlineMs: 1000 });
        expect(Array.from(out)).toEqual([9, 8, 7]);
    });

    it('falls back to text() when neither stream nor arrayBuffer is exposed', async () => {
        const fakeResponse = {
            body: undefined,
            text: async () => 'hi',
        } as unknown as Response;
        const out = await readBodyWithLimits(fakeResponse, { maxBytes: 100, deadlineMs: 1000 });
        expect(new globalThis.TextDecoder().decode(out)).toBe('hi');
    });

    it('enforces the cap on the fallback (post-read) path too', async () => {
        const big = 'x'.repeat(50);
        const fakeResponse = {
            body: null,
            text: async () => big,
        } as unknown as Response;
        await expect(readBodyWithLimits(fakeResponse, { maxBytes: 10, deadlineMs: 0 })).rejects.toBeInstanceOf(
            TestRailApiError,
        );
    });

    it('enforces the cap on the arrayBuffer fallback path (oversized binary response)', async () => {
        // Targets the `bytes.byteLength > maxBytes` branch inside the
        // arrayBuffer fallback. Without this test the byte-cap protection
        // on Response-like mocks would be unverified.
        const big = new Uint8Array(50).buffer;
        const fakeResponse = {
            body: {}, // truthy but no getReader -> dispatch to fallback
            arrayBuffer: async () => big,
        } as unknown as Response;
        await expect(readBodyWithLimits(fakeResponse, { maxBytes: 10, deadlineMs: 0 })).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
    });

    it('returns an empty Uint8Array when neither arrayBuffer nor text is exposed (defensive)', async () => {
        // Targets the trailing `return new Uint8Array(0)` after both fallback
        // probes fail. Used so a malformed mock cannot crash the reader.
        const fakeResponse = {
            body: undefined,
        } as unknown as Response;
        const out = await readBodyWithLimits(fakeResponse, { maxBytes: 100, deadlineMs: 0 });
        expect(out.byteLength).toBe(0);
    });

    it('rethrows a TestRailApiError from the error-path body read in requestText (covers `bodyErr instanceof TestRailApiError` true branch)', async () => {
        // For the requestText() error path: a 500 with an oversized body
        // causes the body-read itself to throw TestRailApiError(0, "...too large").
        // That error should be re-thrown verbatim rather than swallowed
        // into "Unknown error", so the limit signal reaches the caller.
        const huge = new globalThis.TextEncoder().encode('e'.repeat(4096));
        const res = streamingResponse([huge], { status: 500, statusText: 'Server Error' });
        mockFetch.mockResolvedValueOnce(res);
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'api-key',
            maxJsonResponseBytes: 256,
            maxRetries: 0,
            allowPrivateHosts: true,
        });
        await expect(client.bdd.getBdd(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('rethrows a TestRailApiError from the error-path body read in requestBinary (covers same branch)', async () => {
        const huge = new globalThis.TextEncoder().encode('e'.repeat(4096));
        const res = streamingResponse([huge], { status: 500, statusText: 'Server Error' });
        mockFetch.mockResolvedValueOnce(res);
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'api-key',
            maxJsonResponseBytes: 256,
            maxRetries: 0,
            allowPrivateHosts: true,
        });
        await expect(client.attachments.getAttachment(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('swallows a non-TestRailApiError body-read failure in requestText into "Unknown error" (covers fallback branch)', async () => {
        // When the body-read throws a plain Error (not TestRailApiError),
        // the catch falls through and sets errorText='Unknown error', then
        // rethrows the original HTTP error verbatim. We synthesize this by
        // mocking a Response whose text() throws a plain Error.
        const fakeRes = {
            ok: false,
            status: 500,
            statusText: 'Server Error',
            body: null,
            text: async (): Promise<string> => {
                throw new Error('reader exploded');
            },
            headers: { get: (): null => null },
        } as unknown as Response;
        mockFetch.mockResolvedValueOnce(fakeRes);
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'api-key',
            maxRetries: 0,
            allowPrivateHosts: true,
        });
        await expect(client.bdd.getBdd(1)).rejects.toMatchObject({
            status: 500,
            statusText: 'Server Error',
            response: 'Unknown error',
        });
        client.destroy();
    });

    it('swallows a non-TestRailApiError body-read failure in requestBinary into "Unknown error"', async () => {
        const fakeRes = {
            ok: false,
            status: 500,
            statusText: 'Server Error',
            body: null,
            text: async (): Promise<string> => {
                throw new Error('reader exploded');
            },
            headers: { get: (): null => null },
        } as unknown as Response;
        mockFetch.mockResolvedValueOnce(fakeRes);
        const client = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'api-key',
            maxRetries: 0,
            allowPrivateHosts: true,
        });
        await expect(client.attachments.getAttachment(1)).rejects.toMatchObject({
            status: 500,
            statusText: 'Server Error',
            response: 'Unknown error',
        });
        client.destroy();
    });

    it('ignores reader chunks where value is undefined (defensive against non-conformant streams)', async () => {
        // A Web Streams reader is allowed to emit { done: false, value: undefined }
        // (the polyfill in some runtimes does this on backpressure). The reader
        // must treat this as a no-op and continue, never throwing on the
        // `value.byteLength` access. We synthesize a custom reader to drive
        // this path because the standard ReadableStream constructor cannot
        // emit such chunks via controller.enqueue.
        let callCount = 0;
        const fakeReader = {
            read: async () => {
                callCount += 1;
                if (callCount === 1) return { done: false, value: undefined };
                if (callCount === 2) return { done: false, value: new Uint8Array([1, 2, 3]) };
                return { done: true, value: undefined };
            },
            releaseLock: () => undefined,
            cancel: async () => undefined,
        };
        const fakeResponse = {
            body: { getReader: () => fakeReader },
        } as unknown as Response;
        const out = await readBodyWithLimits(fakeResponse, { maxBytes: 100, deadlineMs: 0 });
        expect(Array.from(out)).toEqual([1, 2, 3]);
        expect(callCount).toBe(3);
    });
});

describe('readBodyAsText', () => {
    it('decodes the streamed body as UTF-8', async () => {
        const res = streamingResponse([new globalThis.TextEncoder().encode('héllo')]);
        const out = await readBodyAsText(res, { maxBytes: 100, deadlineMs: 1000 });
        expect(out).toBe('héllo');
    });
});

describe('TestRailConfig response-body limits — validation', () => {
    const baseConfig = {
        baseUrl: 'https://example.testrail.io',
        email: 'test@example.com',
        apiKey: 'api-key',
    };

    it('accepts a valid maxJsonResponseBytes', () => {
        expect(() => new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 1024 })).not.toThrow();
    });

    it('rejects maxJsonResponseBytes <= 0', () => {
        expect(() => new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 0 })).toThrow(TestRailValidationError);
        expect(() => new TestRailClient({ ...baseConfig, maxJsonResponseBytes: -1 })).toThrow(TestRailValidationError);
    });

    it('rejects maxJsonResponseBytes above the 1 GiB ceiling', () => {
        expect(() => new TestRailClient({ ...baseConfig, maxJsonResponseBytes: MAX_RESPONSE_BYTES_LIMIT + 1 })).toThrow(
            TestRailValidationError,
        );
    });

    it('rejects non-integer maxJsonResponseBytes', () => {
        expect(() => new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 1.5 })).toThrow(TestRailValidationError);
    });

    it('rejects maxBinaryResponseBytes outside bounds', () => {
        expect(() => new TestRailClient({ ...baseConfig, maxBinaryResponseBytes: 0 })).toThrow(TestRailValidationError);
        expect(
            () => new TestRailClient({ ...baseConfig, maxBinaryResponseBytes: MAX_RESPONSE_BYTES_LIMIT + 1 }),
        ).toThrow(TestRailValidationError);
    });

    it('accepts bodyTimeout = 0 (no body deadline)', () => {
        expect(() => new TestRailClient({ ...baseConfig, bodyTimeout: 0 })).not.toThrow();
    });

    it('rejects negative bodyTimeout', () => {
        expect(() => new TestRailClient({ ...baseConfig, bodyTimeout: -1 })).toThrow(TestRailValidationError);
    });

    it('rejects bodyTimeout above 5 minutes', () => {
        expect(() => new TestRailClient({ ...baseConfig, bodyTimeout: 5 * 60 * 1000 + 1 })).toThrow(
            TestRailValidationError,
        );
    });
});

describe('TestRailClient — body-limit enforcement across fetch sites', () => {
    const baseConfig = {
        baseUrl: 'https://public.testrail.example',
        email: 'test@example.com',
        apiKey: 'api-key',
        allowPrivateHosts: true,
        // Keep retries off so an oversized body surfaces immediately as a
        // single TestRailApiError instead of being retried.
        maxRetries: 0,
    };

    it('request(): rejects oversized JSON response (SEC #12)', async () => {
        const huge = new globalThis.TextEncoder().encode(JSON.stringify({ data: 'x'.repeat(2048) }));
        mockFetch.mockResolvedValueOnce(streamingResponse([huge]));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 256 });
        await expect(client.projects.getProject(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('request(): succeeds when body is under the configured cap', async () => {
        const body = new globalThis.TextEncoder().encode(
            JSON.stringify({ id: 1, name: 'Project', suite_mode: 1, url: 'https://x' }),
        );
        mockFetch.mockResolvedValueOnce(streamingResponse([body]));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 1024 });
        const project = await client.projects.getProject(1);
        expect(project.id).toBe(1);
        client.destroy();
    });

    it('requestBinary(): rejects oversized attachment download', async () => {
        const huge = new Uint8Array(2048);
        mockFetch.mockResolvedValueOnce(streamingResponse([huge]));
        const client = new TestRailClient({ ...baseConfig, maxBinaryResponseBytes: 512 });
        await expect(client.attachments.getAttachment(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('requestBinary(): allows downloads under the binary cap', async () => {
        const data = new Uint8Array([1, 2, 3, 4]);
        mockFetch.mockResolvedValueOnce(streamingResponse([data]));
        const client = new TestRailClient({ ...baseConfig });
        const buf = await client.attachments.getAttachment(1);
        expect(new Uint8Array(buf)).toEqual(data);
        client.destroy();
    });

    it('requestBinary(): binary cap is independent of JSON cap', async () => {
        // 50 KB binary download with the JSON cap set very low — only the
        // binary cap should apply, so the download succeeds.
        const data = new Uint8Array(50 * 1024);
        mockFetch.mockResolvedValueOnce(streamingResponse([data]));
        const client = new TestRailClient({
            ...baseConfig,
            maxJsonResponseBytes: 1024,
            maxBinaryResponseBytes: 1024 * 1024,
        });
        const buf = await client.attachments.getAttachment(1);
        expect(buf.byteLength).toBe(50 * 1024);
        client.destroy();
    });

    it('requestText(): rejects oversized text response', async () => {
        const huge = new globalThis.TextEncoder().encode('x'.repeat(2048));
        mockFetch.mockResolvedValueOnce(streamingResponse([huge]));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 256 });
        await expect(client.bdd.getBdd(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('requestText(): returns the body when under the cap', async () => {
        const text = 'Feature: x';
        mockFetch.mockResolvedValueOnce(streamingResponse([new globalThis.TextEncoder().encode(text)]));
        const client = new TestRailClient({ ...baseConfig });
        const out = await client.bdd.getBdd(1);
        expect(out).toBe(text);
        client.destroy();
    });

    it('error path: oversized error body surfaces as TestRailApiError(0, "Response body too large")', async () => {
        // Server returns 500 with a 4 KiB error payload — the cap fires on the
        // body read and surfaces immediately as a limit error. The HTTP 500 is
        // not swallowed into an 'Unknown error' because that would allow the
        // retry logic to re-run the body read up to (maxRetries+1) more times.
        const huge = new globalThis.TextEncoder().encode('e'.repeat(4096));
        mockFetch.mockResolvedValueOnce(streamingResponse([huge], { status: 500, statusText: 'Server Error' }));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 256 });
        await expect(client.projects.getProject(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('error path: body-read cap on a retriable error response does not retry', async () => {
        // GET + 5xx normally retries, but when the error-body read itself hits
        // the cap the TestRailApiError is re-thrown before the retry branch,
        // so fetch is called exactly once.
        const huge = new globalThis.TextEncoder().encode('e'.repeat(4096));
        mockFetch.mockResolvedValue(streamingResponse([huge], { status: 503, statusText: 'Service Unavailable' }));
        const client = new TestRailClient({ ...baseConfig, maxRetries: 3, maxJsonResponseBytes: 256 });
        await expect(client.projects.getProject(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        client.destroy();
    });

    it('error path: body-read timeout on a retriable error response does not retry', async () => {
        // A never-closing 503 response — the body deadline fires before the
        // response body arrives, the TestRailApiError is re-thrown before the
        // retry branch, so fetch is called exactly once.
        mockFetch.mockResolvedValue(neverClosingResponse(new Uint8Array([1]), 503));
        const client = new TestRailClient({
            ...baseConfig,
            maxRetries: 3,
            bodyTimeout: 20,
            timeout: 60_000,
        });
        await expect(client.projects.getProject(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Body read timeout',
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        client.destroy();
    });

    it('bodyTimeout: aborts a slowloris response that never closes', async () => {
        mockFetch.mockResolvedValueOnce(neverClosingResponse(new Uint8Array([1])));
        const client = new TestRailClient({
            ...baseConfig,
            bodyTimeout: 20,
            // Disable the header timeout so it cannot fire first.
            timeout: 60_000,
        });
        await expect(client.projects.getProject(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Body read timeout',
        });
        client.destroy();
    });
});

describe('Defaults — sanity checks on shipped values', () => {
    it('JSON default cap matches the documented 10 MiB', () => {
        expect(DEFAULT_MAX_JSON_RESPONSE_BYTES).toBe(10 * 1024 * 1024);
    });

    it('Binary default cap matches the documented 100 MiB', () => {
        expect(DEFAULT_MAX_BINARY_RESPONSE_BYTES).toBe(100 * 1024 * 1024);
    });

    it('Hard ceiling is 1 GiB', () => {
        expect(MAX_RESPONSE_BYTES_LIMIT).toBe(1024 * 1024 * 1024);
    });
});
