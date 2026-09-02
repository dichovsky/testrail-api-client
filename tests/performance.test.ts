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

    const mockProject = (id: number) => ({
        id,
        name: `Project ${id}`,
        suite_mode: 1,
        url: `https://example.testrail.io/projects/view/${id}`,
    });

    it('should enforce cache size limit', async () => {
        const mockResponse = (data: unknown) =>
            ({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(data)),
            }) as Response;

        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(1)));

        // First request - should be cached
        await client.projects.getProject(1);

        // Second request - should be cached
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(2)));
        await client.projects.getProject(2);

        // Third request - should evict the oldest entry (Project 1)
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(3)));
        await client.projects.getProject(3);

        // Project 2 remains cached; project 1 was the LRU entry and refetches.
        await expect(client.projects.getProject(2)).resolves.toEqual(mockProject(2));
        expect(fetch).toHaveBeenCalledTimes(3);
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(1)));
        await expect(client.projects.getProject(1)).resolves.toEqual(mockProject(1));
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should implement LRU eviction behavior', async () => {
        const mockResponse = (data: unknown) =>
            ({
                ok: true,
                text: () => Promise.resolve(JSON.stringify(data)),
            }) as Response;

        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(1)));

        // First request - should be cached
        await client.projects.getProject(1);

        // Second request - should be cached
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(2)));
        await client.projects.getProject(2);

        // Access project 1 again to mark it as recently used
        await client.projects.getProject(1); // Should come from cache

        // Add project 3 - should evict project 2 (least recently used), not project 1
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(3)));
        await client.projects.getProject(3);

        await client.projects.getProject(1);
        expect(fetch).toHaveBeenCalledTimes(3); // recently touched project 1 survived
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse(mockProject(2)));
        await client.projects.getProject(2);
        expect(fetch).toHaveBeenCalledTimes(4); // project 2 was evicted
    });

    it('should warn when maxCacheSize is 0 and enableCache is not explicitly set', () => {
        // Exercises the `config.enableCache ?? true` branch when enableCache is omitted
        const warnSpy = vi.spyOn(process, 'emitWarning').mockImplementation(() => undefined);
        try {
            const unlimitedClient = new TestRailClient({
                baseUrl: 'https://example.testrail.io',
                email: 'test@example.com',
                apiKey: 'api-key',
                maxCacheSize: 0,
                // enableCache intentionally omitted → defaults to true via ?? true
            });
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('maxCacheSize is set to 0'));
            unlimitedClient.destroy();
        } finally {
            warnSpy.mockRestore();
        }
    });
});
