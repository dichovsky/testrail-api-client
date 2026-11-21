import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient } from '../src/client.js';
import type { TestRailConfig } from '../src/types.js';

// Complete enough to match ProjectSchema: a mismatched response is never cached.
const PROJECT = { id: 1, name: 'old-title', suite_mode: 1, url: 'https://example.test/projects/view/1' };
type WriteResponder = (init: RequestInit | undefined) => Promise<Response>;

describe('GET cache invalidation after a dispatched write', () => {
    const clients: TestRailClient[] = [];

    afterEach(() => {
        clients.forEach((client) => client.destroy());
        clients.length = 0;
        vi.restoreAllMocks();
    });

    /** A client whose GETs succeed and whose writes are answered by `write`. */
    const setup = (
        write: WriteResponder,
        overrides: Partial<TestRailConfig> = {},
    ): { client: TestRailClient; reads: () => number; writes: () => number } => {
        let reads = 0;
        let writes = 0;
        const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
            if (init?.method === 'GET') {
                reads += 1;
                return new Response(JSON.stringify(PROJECT));
            }
            writes += 1;
            return write(init);
        });
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            cacheCleanupInterval: 0,
            allowPrivateHosts: true,
            maxRetries: 0,
            fetch,
            ...overrides,
        });
        clients.push(client);
        return { client, reads: () => reads, writes: () => writes };
    };

    const untilAborted: WriteResponder = (init) =>
        new Promise((_resolve, reject) => {
            init?.signal?.addEventListener(
                'abort',
                () => reject(new globalThis.DOMException('Aborted', 'AbortError')),
                {
                    once: true,
                },
            );
        });

    const resetMidBody = (): globalThis.ReadableStream<Uint8Array> => {
        let pulls = 0;
        return new globalThis.ReadableStream<Uint8Array>({
            pull(controller): void {
                pulls += 1;
                if (pulls === 1) controller.enqueue(new globalThis.TextEncoder().encode('{"id":1,"na'));
                else controller.error(new TypeError('terminated'));
            },
        });
    };

    it.each<[string, WriteResponder, Partial<TestRailConfig>]>([
        ['a successful response', async () => new Response(JSON.stringify(PROJECT)), {}],
        ['a 200 whose body resets', async () => new Response(resetMidBody()), {}],
        ['a 502 response', async () => new Response('bad gateway', { status: 502 }), {}],
        ['a 400 response', async () => new Response('{"error":"invalid"}', { status: 400 }), {}],
        ['a redirect', async () => new Response(null, { status: 302, headers: { location: '/login' } }), {}],
        ['a network error', async () => Promise.reject(new TypeError('fetch failed')), {}],
        ['a header timeout', untilAborted, { timeout: 20 }],
    ])('invalidates once after a dispatched write attempt ends in %s', async (_label, write, overrides) => {
        const { client, reads, writes } = setup(write, overrides);
        await client.projects.getProject(1);
        await client.projects.getProject(1);
        expect(reads()).toBe(1);
        const clearCache = vi.spyOn(client, 'clearCache');

        await client.projects.updateProject(1, { name: 'renamed' }).catch(() => undefined);

        expect(writes()).toBe(1);
        expect(clearCache).toHaveBeenCalledTimes(1);
        // The outcome of a failed write is unknown; the next read must reach
        // the server instead of repeating the pre-write answer.
        await client.projects.getProject(1);
        expect(reads()).toBe(2);
    });

    it('invalidates once per dispatched attempt when a write is retried after a 429', async () => {
        let attempt = 0;
        const { client, reads, writes } = setup(
            async () =>
                (attempt += 1) === 1
                    ? new Response('slow down', { status: 429, headers: { 'retry-after': '0' } })
                    : new Response(JSON.stringify(PROJECT)),
            { maxRetries: 1 },
        );
        vi.spyOn(client as unknown as { getRetryDelay: () => number }, 'getRetryDelay').mockReturnValue(0);
        await client.projects.getProject(1);
        const clearCache = vi.spyOn(client, 'clearCache');

        await client.projects.updateProject(1, { name: 'renamed' });

        expect(writes()).toBe(2);
        // Each attempt reached the server, so each one may have changed state.
        expect(clearCache).toHaveBeenCalledTimes(2);
        await client.projects.getProject(1);
        expect(reads()).toBe(2);
    });

    it('keeps the cache when the local rate limiter rejects the write before dispatch', async () => {
        const { client, reads, writes } = setup(async () => new Response(JSON.stringify(PROJECT)), {
            rateLimiter: { maxRequests: 1, windowMs: 60_000 },
        });
        await client.projects.getProject(1);
        const clearCache = vi.spyOn(client, 'clearCache');

        await expect(client.projects.updateProject(1, { name: 'renamed' })).rejects.toMatchObject({ status: 429 });

        expect(writes()).toBe(0);
        expect(clearCache).not.toHaveBeenCalled();
        await client.projects.getProject(1);
        expect(reads()).toBe(1);
    });

    it('keeps the cache when DNS fails before the write is dispatched', async () => {
        const dnsLookup = vi
            .fn<NonNullable<TestRailConfig['dnsLookup']>>()
            .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
            .mockRejectedValue(new Error('getaddrinfo EAI_AGAIN example.test'));
        const { client, reads, writes } = setup(async () => new Response(JSON.stringify(PROJECT)), {
            allowPrivateHosts: false,
            dnsLookup,
        });
        await client.projects.getProject(1);
        const clearCache = vi.spyOn(client, 'clearCache');

        await expect(client.projects.updateProject(1, { name: 'renamed' })).rejects.toThrow();

        expect(writes()).toBe(0);
        expect(clearCache).not.toHaveBeenCalled();
        await client.projects.getProject(1);
        expect(reads()).toBe(1);
    });

    it('does not invalidate when a read fails', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('down', { status: 500 }));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            cacheCleanupInterval: 0,
            allowPrivateHosts: true,
            maxRetries: 0,
            fetch,
        });
        clients.push(client);
        const clearCache = vi.spyOn(client, 'clearCache');

        await expect(client.projects.getProject(1)).rejects.toMatchObject({ status: 500 });

        expect(clearCache).not.toHaveBeenCalled();
    });
});
