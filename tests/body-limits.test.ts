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
    const body = new globalThis.ReadableStream<Uint8Array>({
        async start(controller) {
            for (const chunk of chunks) {
                if (delayMs > 0) {
                    // eslint-disable-next-line no-await-in-loop -- sequential delay between chunks is the point of this helper
                    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
                }
                controller.enqueue(chunk);
            }
            controller.close();
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
        await expect(client.getProject(1)).rejects.toMatchObject({
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
        const project = await client.getProject(1);
        expect(project.id).toBe(1);
        client.destroy();
    });

    it('requestBinary(): rejects oversized attachment download', async () => {
        const huge = new Uint8Array(2048);
        mockFetch.mockResolvedValueOnce(streamingResponse([huge]));
        const client = new TestRailClient({ ...baseConfig, maxBinaryResponseBytes: 512 });
        await expect(client.getAttachment(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('requestBinary(): allows downloads under the binary cap', async () => {
        const data = new Uint8Array([1, 2, 3, 4]);
        mockFetch.mockResolvedValueOnce(streamingResponse([data]));
        const client = new TestRailClient({ ...baseConfig });
        const buf = await client.getAttachment(1);
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
        const buf = await client.getAttachment(1);
        expect(buf.byteLength).toBe(50 * 1024);
        client.destroy();
    });

    it('requestText(): rejects oversized text response', async () => {
        const huge = new globalThis.TextEncoder().encode('x'.repeat(2048));
        mockFetch.mockResolvedValueOnce(streamingResponse([huge]));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 256 });
        await expect(client.getBdd(1)).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        client.destroy();
    });

    it('requestText(): returns the body when under the cap', async () => {
        const text = 'Feature: x';
        mockFetch.mockResolvedValueOnce(streamingResponse([new globalThis.TextEncoder().encode(text)]));
        const client = new TestRailClient({ ...baseConfig });
        const out = await client.getBdd(1);
        expect(out).toBe(text);
        client.destroy();
    });

    it('error path: oversized error body collapses to "Unknown error" without OOM (request)', async () => {
        // Server returns 500 with a 4 KiB error payload — the cap fires on the
        // body read, the fallback substitutes "Unknown error", and the user
        // still sees a 500 error rather than a memory blow-up.
        const huge = new globalThis.TextEncoder().encode('e'.repeat(4096));
        mockFetch.mockResolvedValueOnce(streamingResponse([huge], { status: 500, statusText: 'Server Error' }));
        const client = new TestRailClient({ ...baseConfig, maxJsonResponseBytes: 256 });
        await expect(client.getProject(1)).rejects.toMatchObject({
            status: 500,
            statusText: 'Server Error',
            response: 'Unknown error',
        });
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
        await expect(client.getProject(1)).rejects.toMatchObject({
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
