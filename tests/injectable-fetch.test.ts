import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient } from '../src/client.js';
import { TestRailApiError, TestRailValidationError } from '../src/errors.js';

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
        mockDnsLookup.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
    });

    it('uses the provided fetch instead of globalThis.fetch for JSON requests', async () => {
        const customFetch = vi.fn().mockResolvedValue(okJson(MOCK_PROJECT));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.projects.getProject(1);
        expect(customFetch).toHaveBeenCalledTimes(1);
        client.destroy();
    });

    it('does NOT call globalThis.fetch when a custom fetch is injected', async () => {
        const globalSpy = vi.spyOn(globalThis, 'fetch');
        const customFetch = vi.fn().mockResolvedValue(okJson(MOCK_PROJECT));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.projects.getProject(1);
        expect(globalSpy).not.toHaveBeenCalled();
        globalSpy.mockRestore();
        client.destroy();
    });

    it('falls back to globalThis.fetch when config.fetch is absent', async () => {
        const globalSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(okJson({ ...MOCK_PROJECT, id: 2, name: 'P2' }));
        const client = new TestRailClient({ ...BASE_CONFIG });
        try {
            await client.projects.getProject(2);
            expect(globalSpy).toHaveBeenCalledTimes(1);
        } finally {
            globalSpy.mockRestore();
            client.destroy();
        }
    });

    it('passes URL and init to the custom fetch', async () => {
        const customFetch = vi.fn().mockResolvedValue(okJson({ ...MOCK_PROJECT, id: 3, name: 'P3' }));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.projects.getProject(3);
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
        await client.suites.addSuite(1, { name: 'Suite' });
        const [, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        client.destroy();
    });

    it('uses the custom fetch for binary (requestBinary) requests', async () => {
        const binaryBody = new Uint8Array([1, 2, 3]).buffer;
        const binaryResponse = new Response(binaryBody, { status: 200 });
        const customFetch = vi.fn().mockResolvedValue(binaryResponse);
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        await client.attachments.getAttachment(42);
        expect(customFetch).toHaveBeenCalledTimes(1);
        const [url, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('get_attachment/42');
        expect(init.method).toBe('GET');
        client.destroy();
    });

    it('uses the custom fetch for requestText (getBdd) requests', async () => {
        const bddText = 'Feature: Login\n  Scenario: Valid credentials\n    Given I am on the login page';
        const textResponse = new Response(bddText, { status: 200, headers: { 'Content-Type': 'text/plain' } });
        const customFetch = vi.fn().mockResolvedValue(textResponse);
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        const result = await client.bdd.getBdd(7);
        expect(customFetch).toHaveBeenCalledTimes(1);
        const [url] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('get_bdd/7');
        expect(result).toBe(bddText);
        client.destroy();
    });

    it('uses the custom fetch for requestMultipart (addAttachmentToCase) requests', async () => {
        const attachmentResponse = okJson({ attachment_id: 99 });
        const customFetch = vi.fn().mockResolvedValue(attachmentResponse);
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch });
        const blob = new globalThis.Blob(['hello'], { type: 'text/plain' });
        await client.attachments.addAttachmentToCase(1, blob, 'hello.txt');
        expect(customFetch).toHaveBeenCalledTimes(1);
        const [url, init] = customFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('add_attachment_to_case/1');
        expect(init.method).toBe('POST');
        client.destroy();
    });

    it('rejects a non-function config.fetch with TestRailValidationError', () => {
        expect(
            () => new TestRailClient({ ...BASE_CONFIG, fetch: 'not-a-function' as unknown as typeof globalThis.fetch }),
        ).toThrow(TestRailValidationError);
    });

    it('custom fetch network errors surface as a rejected promise', async () => {
        const customFetch = vi.fn().mockRejectedValue(new TypeError('Network failure'));
        const client = new TestRailClient({ ...BASE_CONFIG, fetch: customFetch, maxRetries: 0 });
        const error = await client.projects.getProject(1).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(TestRailApiError);
        expect((error as TestRailApiError).message).toContain('Network failure');
        client.destroy();
    });
});
