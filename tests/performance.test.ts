import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestRailClient } from '../src/client.js';

describe('TestRailClient Performance & Memory', () => {
    const config = {
        baseUrl: 'https://example.testrail.io',
        email: 'test@example.com',
        apiKey: 'api-key',
        enableCache: true,
        maxCacheSize: 2, // Small cache size for testing
    };

    let client: TestRailClient;

    beforeEach(() => {
        client = new TestRailClient(config);
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        client.destroy();
        vi.restoreAllMocks();
    });

    it('should enforce cache size limit', async () => {
        const mockResponse = (data: unknown) =>
            ({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(data)),
            }) as Response;

        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 1 }));

        // First request - should be cached
        await client.getProject(1);

        // Second request - should be cached
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 2 }));
        await client.getProject(2);

        // Check if both are in cache (private access for test)
        const cache = (client as unknown as { cache: Map<string, unknown> }).cache;
        expect(cache.size).toBe(2);

        // Third request - should evict the oldest entry (Project 1)
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 3 }));
        await client.getProject(3);

        expect(cache.size).toBe(2);
        expect(cache.has('GET:get_project/1')).toBe(false);
        expect(cache.has('GET:get_project/2')).toBe(true);
        expect(cache.has('GET:get_project/3')).toBe(true);
    });

    it('should implement LRU eviction behavior', async () => {
        const mockResponse = (data: unknown) =>
            ({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(data)),
            }) as Response;

        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 1 }));

        // First request - should be cached
        await client.getProject(1);

        // Second request - should be cached
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 2 }));
        await client.getProject(2);

        const cache = (client as unknown as { cache: Map<string, unknown> }).cache;
        expect(cache.size).toBe(2);

        // Access project 1 again to mark it as recently used
        await client.getProject(1); // Should come from cache

        // Add project 3 - should evict project 2 (least recently used), not project 1
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({ id: 3 }));
        await client.getProject(3);

        expect(cache.size).toBe(2);
        expect(cache.has('GET:get_project/1')).toBe(true); // Recently accessed
        expect(cache.has('GET:get_project/2')).toBe(false); // Evicted
        expect(cache.has('GET:get_project/3')).toBe(true); // New
    });

    it('should allow disabling cache size limit with 0', () => {
        const unlimitedClient = new TestRailClient({
            ...config,
            maxCacheSize: 0,
        });
        expect((unlimitedClient as unknown as { maxCacheSize: number }).maxCacheSize).toBe(0);
        unlimitedClient.destroy();
    });

    it('should use default cache size if not provided', () => {
        const defaultClient = new TestRailClient({
            baseUrl: 'https://example.testrail.io',
            email: 'test@example.com',
            apiKey: 'api-key',
        });
        expect((defaultClient as unknown as { maxCacheSize: number }).maxCacheSize).toBe(1000);
        defaultClient.destroy();
    });
});
