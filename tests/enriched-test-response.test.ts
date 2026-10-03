import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient, TestRailApiError } from '../src/index.js';
import { BASE_CONFIG, mockOk } from './helpers.js';

const clients: TestRailClient[] = [];
const test = { id: 1, case_id: 2, status_id: 1, run_id: 3, title: 'Test' };

afterEach(() => {
    for (const client of clients) client.destroy();
    clients.length = 0;
});

function setup(
    raw: unknown,
    onSchemaMismatch = vi.fn(),
): {
    client: TestRailClient;
    fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;
    onSchemaMismatch: ReturnType<typeof vi.fn>;
} {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => Promise.resolve(mockOk(raw)));
    const client = new TestRailClient({ ...BASE_CONFIG, fetch, onSchemaMismatch });
    clients.push(client);
    return { client, fetch, onSchemaMismatch };
}

describe('enriched test response normalization', () => {
    it.each([
        { results: null, attachments: null },
        {},
        { results: null, attachments: [{ id: 4, name: 'evidence.txt' }] },
        { results: [{ id: 5, test_id: 1, status_id: null }], attachments: null },
    ])('normalizes allowed collections despite advisory entity drift: %j', async (collections) => {
        const driftedTest = { ...test, title: null };
        const { client, onSchemaMismatch, fetch } = setup({ test: driftedTest, ...collections });

        await expect(client.tests.getTest(1, { withData: '1' })).resolves.toEqual({
            ...driftedTest,
            results: collections.results ?? [],
            attachments: collections.attachments ?? [],
        });
        expect(onSchemaMismatch).toHaveBeenCalledOnce();
        // A successfully normalized but schema-invalid response stays out of
        // the validated cache and must be observed again on the next request.
        await client.tests.getTest(1, { withData: '1' });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(onSchemaMismatch).toHaveBeenCalledTimes(2);
    });

    it('preserves drifted collection rows without mutating the mismatch payload', async () => {
        const raw = { test, results: [{ id: 5, status_id: 'future-status' }], attachments: null };
        const { client, onSchemaMismatch } = setup(raw);
        const result = await client.tests.getTest(1, { withData: '1' });

        expect(result).toEqual({ ...test, results: raw.results, attachments: [] });
        expect(onSchemaMismatch).toHaveBeenCalledWith(expect.objectContaining({ data: raw }));
    });

    it.each([
        null,
        false,
        [],
        {},
        { test: null },
        { test: [] },
        { test: 'invalid' },
        { test, results: {} },
        { test, results: false },
        { test, attachments: 'invalid' },
    ])('rejects malformed outer structure with an API error: %j', async (raw) => {
        const { client, onSchemaMismatch } = setup(raw);
        const response = client.tests.getTest(1, { withData: '1' });

        await expect(response).rejects.toBeInstanceOf(TestRailApiError);
        await expect(response).rejects.toMatchObject({
            status: 200,
            statusText: 'Unexpected enriched test response structure',
            response: raw,
        });
        expect(onSchemaMismatch).toHaveBeenCalledOnce();
    });

    it('propagates a throwing mismatch hook before structural normalization', async () => {
        const hookError = new Error('Strict response policy');
        const onSchemaMismatch = vi.fn(() => {
            throw hookError;
        });
        const { client } = setup({ test: null, results: null }, onSchemaMismatch);

        await expect(client.tests.getTest(1, { withData: '1' })).rejects.toBe(hookError);
    });
});
