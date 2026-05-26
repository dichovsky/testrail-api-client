import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient } from '../src/client.js';

const BASE_CONFIG = {
    baseUrl: 'https://example.testrail.io',
    email: 'test@example.com',
    apiKey: 'test-api-key',
};

function okJson<T>(data: T): Response {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

const MOCK_PROJECT = {
    id: 1,
    name: 'P1',
    suite_mode: 1,
    url: 'https://example.testrail.io/projects/view/1',
};

const { mockDnsLookup } = vi.hoisted(() => ({ mockDnsLookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: mockDnsLookup }));

describe('injectable fetch adapter (ARCH #14)', () => {
    beforeEach(() => {
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([]);
    });

    it('uses the provided fetch instead of globalThis.fetch for JSON requests', async () => {
        const customFetch = vi.fn().mockResolvedValue(okJson(MOCK_PROJECT));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.getProject(1);
        expect(customFetch).toHaveBeenCalledTimes(1);
        client.destroy();
    });

    it('does NOT call globalThis.fetch when a custom fetch is injected', async () => {
        const globalSpy = vi.spyOn(globalThis, 'fetch');
        const customFetch = vi.fn().mockResolvedValue(okJson(MOCK_PROJECT));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.getProject(1);
        expect(globalSpy).not.toHaveBeenCalled();
        globalSpy.mockRestore();
        client.destroy();
    });

    it('falls back to globalThis.fetch when config.fetch is absent', async () => {
        const globalSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(okJson({ ...MOCK_PROJECT, id: 2, name: 'P2' }));
        const client = new TestRailClient({ ...BASE_CONFIG });
        await client.getProject(2);
        expect(globalSpy).toHaveBeenCalledTimes(1);
        globalSpy.mockRestore();
        client.destroy();
    });

    it('passes URL and init to the custom fetch', async () => {
        const customFetch = vi.fn().mockResolvedValue(okJson({ ...MOCK_PROJECT, id: 3, name: 'P3' }));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.getProject(3);
        const [url, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/index.php?/api/v2/get_project/3');
        expect(init.method).toBe('GET');
        expect(typeof init.headers).toBe('object');
        client.destroy();
    });

    it('uses the custom fetch for POST (write) requests', async () => {
        const customFetch = vi
            .fn()
            .mockResolvedValue(
                okJson({ id: 5, name: 'Suite', project_id: 1, url: 'https://example.testrail.io/suites/view/5' }),
            );
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.addSuite(1, { name: 'Suite' });
        const [, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        client.destroy();
    });

    it('uses the custom fetch for binary (requestBinary) requests', async () => {
        const binaryBody = new Uint8Array([1, 2, 3]).buffer;
        const binaryResponse = new Response(binaryBody, { status: 200 });
        const customFetch = vi.fn().mockResolvedValue(binaryResponse);
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.getAttachment(42);
        expect(customFetch).toHaveBeenCalledTimes(1);
        const [url, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('get_attachment/42');
        expect(init.method).toBe('GET');
        client.destroy();
    });

    it('custom fetch errors propagate as TestRailApiError via the normal retry path', async () => {
        const customFetch = vi.fn().mockRejectedValue(new TypeError('Network failure'));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch, maxRetries: 0 });
        await expect(client.getProject(1)).rejects.toThrow('Network failure');
        client.destroy();
    });
});
