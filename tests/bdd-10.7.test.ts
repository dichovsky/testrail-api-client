import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient } from '../src/client.js';
import { BASE_CONFIG, mockOk } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function envelope(
    bdd: readonly Record<string, unknown>[],
    offset: number,
    limit: number,
    next: string | null,
): Record<string, unknown> {
    return { offset, limit, size: bdd.length, _links: { next, prev: null }, bdd };
}

function requestedUrl(index = 0): string {
    const value: unknown = mockFetch.mock.calls[index]?.[0];
    if (typeof value !== 'string') throw new Error(`Expected fetch call ${index} to contain a string URL`);
    return value;
}

describe('TestRail 10.7 bulk BDD API', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = new TestRailClient({ ...BASE_CONFIG, maxRetries: 0 });
    });

    afterEach(() => {
        client.destroy();
    });

    it('unwraps the bdd envelope and encodes documented filters, including repeated refs[]', async () => {
        const rows = [{ arbitrary_future_field: true }];
        mockFetch.mockResolvedValueOnce(mockOk(envelope(rows, 6, 25, null)));

        await expect(
            client.bdd.getBdds(9, {
                suiteId: 2,
                sectionId: 3,
                labelId: [4, 5],
                refs: ['ENG-101', 'A&B'],
                limit: 25,
                offset: 6,
            }),
        ).resolves.toEqual(rows);

        expect(requestedUrl()).toContain('get_bdds/9');
        expect(requestedUrl()).toContain('&suite_id=2&section_id=3&label_id=4%2C5');
        expect(requestedUrl()).toContain('&refs%5B%5D=ENG-101&refs%5B%5D=A%26B');
        expect(requestedUrl()).toContain('&limit=25&offset=6');
    });

    it('keeps the legacy scalar refs query parameter', async () => {
        mockFetch.mockResolvedValueOnce(mockOk(envelope([], 0, 250, null)));
        await client.bdd.getBdds(9, { refs: 'ENG-101' });

        expect(requestedUrl()).toContain('&refs=ENG-101');
        expect(requestedUrl()).not.toContain('refs%5B%5D');
    });

    it('accepts omitted options, scalar labels, and empty label/ref lists', async () => {
        mockFetch
            .mockResolvedValueOnce(mockOk(envelope([], 0, 250, null)))
            .mockResolvedValueOnce(mockOk(envelope([], 0, 250, null)))
            .mockResolvedValueOnce(mockOk(envelope([], 0, 250, null)));

        await client.bdd.getBdds(9);
        await client.bdd.getBdds(9, { labelId: 4 });
        await client.bdd.getBdds(10, { labelId: [], refs: [] });

        expect(requestedUrl(0)).not.toContain('label_id=');
        expect(requestedUrl(1)).toContain('label_id=4');
        expect(requestedUrl(2)).not.toContain('label_id=');
        expect(requestedUrl(2)).not.toContain('refs%5B%5D');
    });

    it('preserves page metadata and aggregates continuations through the known endpoint', async () => {
        const first = { name: 'first.feature' };
        const second = { name: 'second.feature' };
        mockFetch.mockResolvedValueOnce(mockOk(envelope([first], 4, 2, null)));

        await expect(client.bdd.getBddsPage(9, { limit: 2, offset: 4 })).resolves.toEqual({
            kind: 'envelope',
            items: [first],
            offset: 4,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
        });

        mockFetch
            .mockResolvedValueOnce(mockOk(envelope([first], 0, 2, 'https://untrusted.invalid/path?offset=2&limit=1')))
            .mockResolvedValueOnce(mockOk(envelope([second], 2, 2, null)));

        await expect(client.bdd.getAllBdds(9, { suiteId: 7, pageSize: 2 })).resolves.toEqual([first, second]);
        expect(requestedUrl(1)).toContain('get_bdds/9&suite_id=7&limit=2&offset=0');
        expect(requestedUrl(2)).toContain('get_bdds/9&suite_id=7&limit=2&offset=2');
        expect(requestedUrl(2)).not.toContain('untrusted.invalid');
    });

    it.each([
        ['projectId', () => client.bdd.getBdds(0)],
        ['suiteId', () => client.bdd.getBdds(1, { suiteId: 0 })],
        ['sectionId', () => client.bdd.getBdds(1, { sectionId: -1 })],
        ['labelId[1]', () => client.bdd.getBdds(1, { labelId: [1, 0] })],
    ])('rejects invalid %s before a network call', async (field, call) => {
        await expect(call()).rejects.toThrow(`${field} must be a positive integer`);
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
