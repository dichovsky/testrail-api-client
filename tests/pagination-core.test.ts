import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readBodyWithLimits } from '../src/body-reader.js';
import { TestRailClient } from '../src/client.js';
import { handleZodError, TestRailApiError, TestRailPaginationError, TestRailValidationError } from '../src/errors.js';
import { listOf, listOfNested, unwrapList, unwrapNestedList } from '../src/modules/list.js';
import {
    collectAllPages,
    decodeNestedPage,
    decodePage,
    parsePaginationContinuation,
    type CollectAllPagesOptions,
    type Page,
    type PaginationRequest,
} from '../src/pagination.js';
import { sleep } from '../src/utils.js';

const ItemSchema = z.object({ id: z.number() });

function envelope<T>(items: T[], offset: number, next: string | null, limit = 2): Page<T> {
    return {
        kind: 'envelope',
        items,
        offset,
        limit,
        size: items.length,
        _links: { next, prev: null },
    };
}

describe('strict list and page decoding', () => {
    it('preserves envelope metadata while the legacy list projection returns rows', () => {
        const raw = {
            offset: 0,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
            items: [{ id: 1 }],
        };
        const parsed = listOf('items', ItemSchema).parse(raw);
        expect(parsed).toEqual(raw);
        expect(unwrapList<{ id: number }>('items', parsed)).toEqual([{ id: 1 }]);
    });

    it('rejects envelope limits above the decoder maximum during advisory validation', () => {
        const raw = {
            offset: 0,
            limit: 251,
            size: 0,
            _links: { next: null, prev: null },
            items: [],
        };

        expect(listOf('items', ItemSchema).safeParse(raw).success).toBe(false);
        expect(() => decodePage('items', raw)).toThrow(TestRailPaginationError);
    });

    it('enforces the response limit without treating size as a completeness signal', () => {
        const staleSize = {
            offset: 0,
            limit: 2,
            size: 2,
            _links: { next: null, prev: null },
            items: [{ id: 1 }],
        };
        expect(listOf('items', ItemSchema).safeParse(staleSize).success).toBe(true);
        expect(decodePage<{ id: number }>('items', staleSize)).toMatchObject({
            kind: 'envelope',
            items: [{ id: 1 }],
            size: 2,
        });

        const sizeAboveLimit = { ...staleSize, size: 3 };
        expect(listOf('items', ItemSchema).safeParse(sizeAboveLimit).success).toBe(false);
        expect(() => decodePage('items', sizeAboveLimit)).toThrow(TestRailPaginationError);

        const collectionAboveLimit = { ...staleSize, limit: 1, size: 1, items: [{ id: 1 }, { id: 2 }] };
        expect(listOf('items', ItemSchema).safeParse(collectionAboveLimit).success).toBe(false);
        expect(() => decodePage('items', collectionAboveLimit)).toThrow(TestRailPaginationError);
    });

    it('keeps explicit null as empty but classifies malformed outer list structures as API errors', () => {
        expect(unwrapList('items', { items: null })).toEqual([]);

        const malformed = { items: 'private-row-value', customer_email: 'person@example.test' };
        let caught: unknown;
        try {
            unwrapList('items', malformed);
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(TestRailApiError);
        expect(caught).toMatchObject({
            status: 200,
            statusText: 'Unexpected list response structure',
        });
        expect((caught as TestRailApiError).response).toBe(malformed);
        expect((caught as Error).message).toBe('TestRail API error: 200 Unexpected list response structure');
        expect((caught as Error).message).not.toContain('private-row-value');
        expect((caught as Error).message).not.toContain('person@example.test');

        expect(() => unwrapList('items', { error: 'not a list' })).toThrow(TestRailApiError);
        expect(() => unwrapList('items', null)).toThrow(TestRailApiError);
    });

    it('preserves advisory row drift inside a structurally valid collection', () => {
        const drifted = { id: 'server-drift' };
        expect(listOf('items', ItemSchema).safeParse({ items: [drifted] }).success).toBe(false);
        expect(unwrapList('items', { items: [drifted] })).toEqual([drifted]);
    });

    it('accepts exactly one nested history envelope and rejects mixed/multiple wrappers', () => {
        const valid = [{ history: [{ id: 1 }], offset: 0, limit: 1, size: 1, _links: { next: null, prev: null } }];
        expect(listOfNested('history', ItemSchema).parse(valid)).toEqual(valid);
        expect(unwrapNestedList('history', valid)).toEqual([{ id: 1 }]);
        expect(() => unwrapNestedList('history', [valid[0], valid[0]])).toThrow(TestRailApiError);
        expect(() => unwrapNestedList('history', [valid[0], { id: 2 }])).toThrow(TestRailApiError);
    });

    it('normalizes envelopes and legacy arrays without inventing legacy offsets', () => {
        expect(decodePage<number>('items', [1, 2])).toEqual({ kind: 'legacy-array', items: [1, 2], size: 2 });
        expect(
            decodePage<number>('items', {
                items: [1],
                offset: 5,
                limit: 2,
                size: 1,
                _links: { next: null, prev: 'previous-link' },
            }),
        ).toEqual({ ...envelope([1], 5, null), _links: { next: null, prev: 'previous-link' } });
        expect(
            decodeNestedPage<number>('items', [
                { items: [1], offset: 0, limit: 2, size: 1, _links: { next: null, prev: null } },
            ]),
        ).toEqual(envelope([1], 0, null));
    });

    it.each([
        { offset: 0, limit: 2, size: 0, _links: { next: null, prev: null } },
        { items: 'oops', offset: 0, limit: 2, size: 0, _links: { next: null, prev: null } },
        { items: [], offset: -1, limit: 2, size: 0, _links: { next: null, prev: null } },
        { items: [], offset: 0, limit: 251, size: 0, _links: { next: null, prev: null } },
        { items: [], offset: 0, limit: 2, size: -1, _links: { next: null, prev: null } },
        { items: [], offset: 0, limit: 2, size: 0, _links: { next: 1, prev: null } },
        { items: [], offset: 0, limit: 2, size: 0, _links: { next: null, prev: 1 } },
        { items: [], offset: 0, limit: 2, size: 0 },
    ])('rejects malformed page metadata: %j', (raw) => {
        expect(() => decodePage('items', raw)).toThrow(TestRailPaginationError);
    });

    it('accepts null collections and rejects invalid outer page shapes', () => {
        expect(
            decodePage('items', {
                items: null,
                offset: 0,
                limit: 2,
                size: 0,
                _links: { next: null, prev: null },
            }),
        ).toEqual(envelope([], 0, null));
        expect(() => decodePage('', [])).toThrow(TestRailValidationError);
        expect(() => decodePage('items', 42)).toThrow(TestRailPaginationError);
    });

    it('supports nested non-array and legacy-array variants', () => {
        expect(
            decodeNestedPage('items', {
                items: [1],
                offset: 0,
                limit: 2,
                size: 1,
                _links: { next: null, prev: null },
            }),
        ).toEqual(envelope([1], 0, null));
        expect(decodeNestedPage('items', [{ id: 1 }])).toEqual({
            kind: 'legacy-array',
            items: [{ id: 1 }],
            size: 1,
        });
        const wrapper = {
            items: [1],
            offset: 0,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
        };
        expect(() => decodeNestedPage('items', [wrapper, wrapper])).toThrow(TestRailPaginationError);
    });

    it('rejects nested pagination metadata with a missing or misspelled collection', () => {
        const misspelled = {
            itmes: [],
            offset: 0,
            limit: 2,
            size: 0,
            _links: { next: null, prev: null },
        };

        expect(() => unwrapNestedList('items', [misspelled])).toThrow(TestRailApiError);
        expect(() => decodeNestedPage('items', [misspelled])).toThrow(TestRailPaginationError);

        const partial = { itmes: [], offset: 0, limit: 2, size: 0 };
        expect(() => unwrapNestedList('items', [partial])).toThrow(TestRailApiError);
        expect(() => decodeNestedPage('items', [partial])).toThrow(TestRailPaginationError);
    });

    it('keeps isolated metadata-like future fields advisory on legacy nested rows', () => {
        const legacyRows = [
            { id: 1, offset: 7 },
            { id: 2, size: 42 },
            { id: 3, _links: { self: 'x' } },
        ];

        expect(unwrapNestedList('items', legacyRows)).toEqual(legacyRows);
        expect(decodeNestedPage('items', legacyRows)).toEqual({
            kind: 'legacy-array',
            items: legacyRows,
            size: 3,
        });
    });
});

describe('continuation validation', () => {
    it('extracts only offset and limit from an otherwise untrusted URL', () => {
        expect(
            parsePaginationContinuation('https://attacker.invalid/private/path?secret=x&offset=250&limit=100'),
        ).toEqual({ offset: 250, limit: 100 });
    });

    it('accepts TestRail path-style continuation controls', () => {
        expect(parsePaginationContinuation('/api/v2/get_cases/1&limit=250&offset=250')).toEqual({
            offset: 250,
            limit: 250,
        });
        expect(parsePaginationContinuation('/api/v2/get_cases/1&offset=250')).toEqual({
            offset: 250,
            limit: undefined,
        });
    });

    it.each([
        '',
        'http://[',
        '/index.php?/api/v2/get_cases/1&limit=2',
        '/index.php?/api/v2/get_cases/1&offset=1&offset=2',
        '/index.php?/api/v2/get_cases/1&offset=-1',
        '/index.php?/api/v2/get_cases/1&offset=9007199254740992',
        '/index.php?/api/v2/get_cases/1&offset=2&limit=0',
        '/index.php?/api/v2/get_cases/1&offset=2&limit=251',
        '/index.php?/api/v2/get_cases/1&offset=2&limit=1&limit=2',
        '/api/v2/get_cases/1&offset=250?offset=500',
        '/api/v2/get_cases/1&limit=250',
        '/api/v2/get_cases/1&offset=0250',
        '/api/v2/get_cases/1&offset=250&limit=0250',
    ])('rejects malformed continuation %j', (next) => {
        expect(() => parsePaginationContinuation(next)).toThrow(TestRailPaginationError);
    });

    it('allows a continuation without a limit', () => {
        expect(parsePaginationContinuation('?offset=250')).toEqual({ offset: 250, limit: undefined });
    });
});

describe('bounded sequential collection', () => {
    it('treats next as authoritative for short and full pages', async () => {
        const requests: PaginationRequest[] = [];
        const pages: Page<number>[] = [envelope([1], 5, '/api/v2/get_x&limit=2&offset=7'), envelope([2, 3], 7, null)];
        const result = await collectAllPages({
            pageSize: 2,
            startOffset: 5,
            fetchPage: (request) => {
                requests.push(request);
                const page = pages.shift();
                if (page === undefined) throw new Error('unexpected fetch');
                return Promise.resolve(page);
            },
        });

        expect(result).toEqual([1, 2, 3]);
        expect(requests).toEqual([
            expect.objectContaining({ offset: 5, limit: 2, bypassCache: true }),
            expect.objectContaining({ offset: 7, limit: 2, bypassCache: true }),
        ]);
    });

    it('treats a legacy array as one terminal page', async () => {
        const fetchPage = vi.fn().mockResolvedValue({ kind: 'legacy-array', items: [1, 2], size: 2 });
        await expect(collectAllPages({ fetchPage })).resolves.toEqual([1, 2]);
        expect(fetchPage).toHaveBeenCalledOnce();
    });

    it('uses continuation controls for response-driven endpoints', async () => {
        const requests: PaginationRequest[] = [];
        const pages: Page<number>[] = [envelope([1], 0, '?offset=2&limit=7'), envelope([2], 2, null, 7)];
        await expect(
            collectAllPages({
                requestControls: false,
                fetchPage: (request) => {
                    requests.push(request);
                    const page = pages.shift();
                    if (page === undefined) throw new Error('unexpected fetch');
                    return Promise.resolve(page);
                },
            }),
        ).resolves.toEqual([1, 2]);
        expect(requests).toEqual([
            expect.objectContaining({ offset: undefined, limit: undefined }),
            expect.objectContaining({ offset: 2, limit: 7 }),
        ]);
    });

    it('passes one fixed absolute deadline through every page request', async () => {
        let clock = 1_000;
        const requests: PaginationRequest[] = [];
        const pages = [envelope([1], 0, '?offset=1&limit=1', 1), envelope([2], 1, null, 1)];

        await expect(
            collectAllPages({
                pageSize: 1,
                maxDurationMs: 100,
                now: () => clock,
                fetchPage: (request) => {
                    requests.push(request);
                    clock += 10;
                    const page = pages.shift();
                    if (page === undefined) throw new Error('unexpected fetch');
                    return Promise.resolve(page);
                },
            }),
        ).resolves.toEqual([1, 2]);

        expect(requests).toEqual([
            expect.objectContaining({ deadlineAt: 1_100, remainingTimeMs: 100 }),
            expect.objectContaining({ deadlineAt: 1_100, remainingTimeMs: 90 }),
        ]);
    });

    it('rejects a nonzero initial envelope offset for response-driven endpoints', async () => {
        const requests: PaginationRequest[] = [];
        await expect(
            collectAllPages({
                requestControls: false,
                fetchPage: (request) => {
                    requests.push(request);
                    return Promise.resolve(envelope([1], 5, null));
                },
            }),
        ).rejects.toMatchObject({ reason: 'invalid_page', pagesFetched: 1, itemsFetched: 1 });
        expect(requests).toEqual([expect.objectContaining({ offset: undefined, limit: undefined, bypassCache: true })]);
    });

    it('rejects a second-page failure without returning the first page', async () => {
        const upstream = new Error('second page failed');
        let calls = 0;
        const result = collectAllPages({
            fetchPage: () => {
                calls += 1;
                return calls === 1 ? Promise.resolve(envelope([1], 0, '?offset=2&limit=2')) : Promise.reject(upstream);
            },
        });

        await expect(result).rejects.toBe(upstream);
        expect(calls).toBe(2);
    });

    it('lets terminal pages succeed exactly at every count/byte boundary', async () => {
        const items = [1, 2];
        const maxBytes = new globalThis.TextEncoder().encode(JSON.stringify(items)).byteLength;
        await expect(
            collectAllPages({
                maxPages: 1,
                maxItems: 2,
                maxBytes,
                fetchPage: () => Promise.resolve(envelope(items, 0, null)),
            }),
        ).resolves.toEqual(items);
    });

    it.each([
        {
            reason: 'max_pages',
            options: { maxPages: 1 },
            page: envelope([1], 0, '?offset=2&limit=2'),
        },
        {
            reason: 'max_items',
            options: { maxItems: 1 },
            page: envelope([1], 0, '?offset=2&limit=2'),
        },
        {
            reason: 'max_bytes',
            options: { maxBytes: 1 },
            page: envelope([1], 0, null),
        },
        {
            reason: 'non_progress',
            options: {},
            page: envelope([1], 0, '?offset=0&limit=2'),
        },
    ] as const)('fails with $reason and never retains partial entities', async ({ reason, options, page }) => {
        const sentinel = 'must-not-appear-on-error';
        const error = await collectAllPages({
            ...options,
            fetchPage: () => Promise.resolve({ ...page, items: [sentinel] }),
        }).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(TestRailPaginationError);
        expect((error as TestRailPaginationError).reason).toBe(reason);
        expect(JSON.stringify(error)).not.toContain(sentinel);
    });

    it('converts aggregate deadline expiry while fetching into max_duration', async () => {
        let clock = 0;
        const error = await collectAllPages({
            maxDurationMs: 10,
            now: () => clock,
            fetchPage: () => {
                clock = 10;
                return Promise.reject(new Error('late failure'));
            },
        }).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(TestRailPaginationError);
        expect((error as TestRailPaginationError).reason).toBe('max_duration');
    });

    it('rejects an aggregate whose deadline is exhausted before its first request', async () => {
        const now = vi.fn().mockReturnValueOnce(0).mockReturnValue(10);
        const fetchPage = vi.fn();
        await expect(collectAllPages({ maxDurationMs: 10, now, fetchPage })).rejects.toMatchObject({
            reason: 'max_duration',
            pagesFetched: 0,
            itemsFetched: 0,
        });
        expect(fetchPage).not.toHaveBeenCalled();
    });

    it('rejects a page that arrives after the aggregate deadline', async () => {
        let clock = 0;
        await expect(
            collectAllPages({
                maxDurationMs: 10,
                now: () => clock,
                fetchPage: () => {
                    clock = 11;
                    return Promise.resolve(envelope([1], 0, null));
                },
            }),
        ).rejects.toMatchObject({ reason: 'max_duration', pagesFetched: 1, itemsFetched: 1 });
    });

    it('rejects a terminal page when serialization exhausts the aggregate deadline', async () => {
        const now = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(9).mockReturnValue(10);
        await expect(
            collectAllPages({
                maxDurationMs: 10,
                now,
                fetchPage: () => Promise.resolve(envelope([1], 0, null)),
            }),
        ).rejects.toMatchObject({ reason: 'max_duration', pagesFetched: 1, itemsFetched: 1 });
    });

    it('rechecks the deadline after copying terminal page items', async () => {
        const now = vi
            .fn()
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(9)
            .mockReturnValueOnce(9)
            .mockReturnValue(10);
        await expect(
            collectAllPages({
                maxDurationMs: 10,
                now,
                fetchPage: () => Promise.resolve(envelope([1], 0, null)),
            }),
        ).rejects.toMatchObject({ reason: 'max_duration', pagesFetched: 1, itemsFetched: 1 });
    });

    it('reports item overflow on a terminal page and byte exhaustion before a continuation', async () => {
        await expect(
            collectAllPages({
                maxItems: 1,
                fetchPage: () => Promise.resolve(envelope([1, 2], 0, null)),
            }),
        ).rejects.toMatchObject({ reason: 'max_items', pagesFetched: 1, itemsFetched: 2 });

        const emptyPageBytes = new globalThis.TextEncoder().encode('[]').byteLength;
        await expect(
            collectAllPages({
                maxBytes: emptyPageBytes,
                fetchPage: () => Promise.resolve(envelope([], 0, '?offset=2&limit=2')),
            }),
        ).rejects.toMatchObject({ reason: 'max_bytes', pagesFetched: 1, itemsFetched: 0 });
    });

    it('rejects response offsets that do not match the requested continuation', async () => {
        let calls = 0;
        await expect(
            collectAllPages({
                fetchPage: () => {
                    calls += 1;
                    return Promise.resolve(
                        calls === 1 ? envelope([1], 0, '?offset=2&limit=2') : envelope([2], 3, null),
                    );
                },
            }),
        ).rejects.toMatchObject({ reason: 'invalid_page', pagesFetched: 2, itemsFetched: 2 });
    });

    it('rejects a continuation that starts inside the current page span', async () => {
        const fetchPage = vi.fn().mockResolvedValue(envelope([1, 2], 0, '?offset=1&limit=2'));

        await expect(collectAllPages({ pageSize: 2, fetchPage })).rejects.toMatchObject({
            reason: 'non_progress',
            pagesFetched: 1,
            itemsFetched: 2,
        });
        expect(fetchPage).toHaveBeenCalledOnce();
    });

    it('classifies unserializable page items as an invalid page', async () => {
        const cyclic: Record<string, unknown> = {};
        cyclic['self'] = cyclic;
        await expect(
            collectAllPages({ fetchPage: () => Promise.resolve(envelope([cyclic], 0, null)) }),
        ).rejects.toMatchObject({ reason: 'invalid_page', pagesFetched: 1, itemsFetched: 1 });
    });

    it('reports a known item overflow before attempting page serialization', async () => {
        const cyclic: Record<string, unknown> = {};
        cyclic['self'] = cyclic;

        await expect(
            collectAllPages({
                maxItems: 1,
                fetchPage: () => Promise.resolve(envelope([cyclic, cyclic], 0, null)),
            }),
        ).rejects.toMatchObject({ reason: 'max_items', pagesFetched: 1, itemsFetched: 2 });
    });

    it('rebases a decoder failure to the successfully collected progress', async () => {
        let calls = 0;
        const error = await collectAllPages({
            fetchPage: () => {
                calls += 1;
                if (calls === 1) return Promise.resolve(envelope([1], 0, '?offset=2&limit=2'));
                return Promise.resolve().then(() => decodePage<number>('items', { items: [] }));
            },
        }).catch((caught: unknown) => caught);

        expect(error).toMatchObject({ reason: 'invalid_page', pagesFetched: 1, itemsFetched: 1 });
        expect((error as Error).message).toBe(
            'TestRail Validation Error: Pagination envelope offset must be a non-negative safe integer',
        );
    });

    it('rebases an invalid-page item counter even when its page counter already matches', async () => {
        await expect(
            collectAllPages({
                fetchPage: () => Promise.reject(new TestRailPaginationError('invalid_page', 'bad page', 0, 1)),
            }),
        ).rejects.toMatchObject({ reason: 'invalid_page', pagesFetched: 0, itemsFetched: 0 });
    });

    it('validates every bound before issuing a request', async () => {
        const fetchPage = vi.fn();
        await expect(collectAllPages({ pageSize: 0, fetchPage })).rejects.toThrow(TestRailValidationError);
        await expect(collectAllPages({ startOffset: -1, fetchPage })).rejects.toThrow(TestRailValidationError);
        await expect(collectAllPages({ maxPages: 0, fetchPage })).rejects.toThrow(TestRailValidationError);
        await expect(collectAllPages({ maxItems: 0, fetchPage })).rejects.toThrow(TestRailValidationError);
        await expect(collectAllPages({ maxDurationMs: 300_001, fetchPage })).rejects.toThrow(TestRailValidationError);
        await expect(collectAllPages({ maxBytes: 1024 * 1024 * 1024 + 1, fetchPage })).rejects.toThrow(
            TestRailValidationError,
        );
        expect(fetchPage).not.toHaveBeenCalled();
    });

    it.each(['pageSize', 'startOffset', 'maxPages', 'maxItems', 'maxDurationMs', 'maxBytes'] as const)(
        'rejects an explicit null %s instead of applying a default',
        async (field) => {
            const fetchPage = vi.fn();
            const options = { [field]: null, fetchPage } as unknown as CollectAllPagesOptions<number>;

            await expect(collectAllPages(options)).rejects.toThrow(TestRailValidationError);
            expect(fetchPage).not.toHaveBeenCalled();
        },
    );
});

describe('request hooks used by pagination adapters', () => {
    const clients: TestRailClient[] = [];

    afterEach(() => {
        clients.splice(0).forEach((client) => client.destroy());
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('bypasses cache reads, writes, and normal pending-key participation', async () => {
        let id = 0;
        const fetch = vi.fn().mockImplementation(() =>
            Promise.resolve(
                new Response(JSON.stringify({ id: (id += 1) }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            ),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);

        const spec = { method: 'GET' as const, endpoint: 'get_x', schema: ItemSchema };
        await expect(client.request<{ id: number }>(spec)).resolves.toEqual({ id: 1 });
        await expect(client.request<{ id: number }>(spec)).resolves.toEqual({ id: 1 });
        await expect(client.request<{ id: number }>({ ...spec, bypassCache: true })).resolves.toEqual({ id: 2 });
        await expect(client.request<{ id: number }>(spec)).resolves.toEqual({ id: 1 });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not coalesce concurrent bypassed requests', async () => {
        const resolvers: Array<(response: Response) => void> = [];
        const fetch = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    resolvers.push(resolve);
                }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);

        const spec = { method: 'GET' as const, endpoint: 'get_x', schema: ItemSchema, bypassCache: true };
        const first = client.request<{ id: number }>(spec);
        const second = client.request<{ id: number }>(spec);
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        resolvers[0]?.(new Response('{"id":1}', { status: 200 }));
        resolvers[1]?.(new Response('{"id":2}', { status: 200 }));
        await expect(Promise.all([first, second])).resolves.toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('clips an aggregate request below a looser configured timeout', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn().mockImplementation(() => new Promise<Response>(() => undefined));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 1_000,
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);

        const pending = client.request({
            method: 'GET',
            endpoint: 'get_x',
            bypassCache: true,
            remainingTimeMs: 20,
        });
        const assertion = expect(pending).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(21);
        await assertion;
        expect(fetch).toHaveBeenCalledOnce();
    });

    it('fails when the aggregate deadline expires before DNS admission completes', async () => {
        const fetch = vi.fn();
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(10);

        await expect(
            client.request({ method: 'GET', endpoint: 'get_x', bypassCache: true, remainingTimeMs: 10 }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('deadline-races a custom DNS lookup that never settles', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const fetch = vi.fn();
        const dnsLookup = vi.fn().mockImplementation(() => new Promise<never>(() => undefined));
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            enableCache: false,
            dnsLookup,
            fetch,
        });
        clients.push(client);
        const baselineTimers = vi.getTimerCount();
        const pending = client.request({
            method: 'GET',
            endpoint: 'get_x',
            bypassCache: true,
            remainingTimeMs: 10,
        });
        const assertion = expect(pending).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });

        await vi.advanceTimersByTimeAsync(10);
        await assertion;
        expect(dnsLookup).toHaveBeenCalledOnce();
        expect(fetch).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(baselineTimers);
    });

    it('fails if the aggregate expires between DNS admission and fetch setup', async () => {
        const fetch = vi.fn();
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(10);

        await expect(
            client.request({ method: 'GET', endpoint: 'get_x', bypassCache: true, remainingTimeMs: 10 }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('fails if headers arrive only after the aggregate body budget is exhausted', async () => {
        let clock = 0;
        const fetch = vi.fn().mockImplementation(() =>
            Promise.resolve().then(() => {
                clock = 10;
                return new Response('{"id":1}', { status: 200 });
            }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);
        vi.spyOn(Date, 'now').mockImplementation(() => clock);

        await expect(
            client.request({ method: 'GET', endpoint: 'get_x', bypassCache: true, remainingTimeMs: 10 }),
        ).rejects.toMatchObject({ status: 408, statusText: 'Aggregate request deadline exceeded' });
    });

    it('aborts the underlying fetch when the aggregate deadline wrapper wins the race', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        let requestSignal: NonNullable<Parameters<typeof globalThis.fetch>[1]>['signal'];
        const fetch = vi.fn().mockImplementation((...args: Parameters<typeof globalThis.fetch>) => {
            const init = args[1];
            requestSignal = init?.signal instanceof globalThis.AbortSignal ? init.signal : undefined;
            vi.setSystemTime(5);
            return new Promise<Response>((_resolve, reject) => {
                requestSignal?.addEventListener('abort', () => {
                    reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
                });
            });
        });
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            timeout: 1_000,
            allowPrivateHosts: true,
            fetch,
        });
        clients.push(client);

        const pending = client.request({
            method: 'GET',
            endpoint: 'get_x',
            bypassCache: true,
            remainingTimeMs: 20,
        });
        const assertion = expect(pending).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });
        await vi.advanceTimersByTimeAsync(15);
        await assertion;
        expect(requestSignal?.aborted).toBe(true);
    });

    it('clears a retry-delay timer when the aggregate deadline wins', async () => {
        vi.useFakeTimers();
        const fetch = vi.fn().mockResolvedValue(
            new Response('slow down', {
                status: 429,
                statusText: 'Too Many Requests',
                headers: { 'Retry-After': '1' },
            }),
        );
        const client = new TestRailClient({
            baseUrl: 'https://example.test',
            email: 'agent@example.test',
            apiKey: 'key',
            allowPrivateHosts: true,
            enableCache: false,
            maxRetries: 1,
            fetch,
        });
        clients.push(client);
        const baselineTimers = vi.getTimerCount();
        const pending = client.request({
            method: 'GET',
            endpoint: 'get_x',
            bypassCache: true,
            remainingTimeMs: 100,
        });
        const assertion = expect(pending).rejects.toMatchObject({
            status: 408,
            statusText: 'Aggregate request deadline exceeded',
        });

        await vi.advanceTimersByTimeAsync(0);
        expect(fetch).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBeGreaterThan(baselineTimers);
        await vi.advanceTimersByTimeAsync(100);
        await assertion;
        expect(vi.getTimerCount()).toBe(baselineTimers);
    });

    it('does not schedule a delay for an already-aborted sleep signal', async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        controller.abort();

        await expect(sleep(1_000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('core fallback and error utilities', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('enforces the body deadline for non-streaming response fallbacks', async () => {
        vi.useFakeTimers();
        const response = {
            body: null,
            arrayBuffer: () => new Promise<ArrayBuffer>(() => undefined),
        } as unknown as Response;
        const pending = readBodyWithLimits(response, { maxBytes: 100, deadlineMs: 10 });
        const assertion = expect(pending).rejects.toMatchObject({
            status: 0,
            statusText: 'Body read timeout',
        });
        await vi.advanceTimersByTimeAsync(10);
        await assertion;
    });

    it('still reports an oversized stream when best-effort cancellation rejects', async () => {
        const reader = {
            read: vi.fn().mockResolvedValue({ done: false, value: new Uint8Array(2) }),
            cancel: vi.fn().mockRejectedValue(new Error('cancel failed')),
            releaseLock: vi.fn(),
        };
        const response = {
            body: { getReader: () => reader },
        } as unknown as Response;

        await expect(readBodyWithLimits(response, { maxBytes: 1, deadlineMs: 0 })).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        expect(reader.cancel).toHaveBeenCalledOnce();
    });

    it('reports an oversized stream promptly when cancellation never settles', async () => {
        vi.useFakeTimers();
        const reader = {
            read: vi.fn().mockResolvedValue({ done: false, value: new Uint8Array(2) }),
            cancel: vi.fn().mockImplementation(() => new Promise<void>(() => undefined)),
            releaseLock: vi.fn(),
        };
        const response = {
            body: { getReader: () => reader },
        } as unknown as Response;
        const outcome = readBodyWithLimits(response, { maxBytes: 1, deadlineMs: 1_000 }).then(
            () => ({ kind: 'resolved' as const }),
            (error: unknown) => ({ kind: 'rejected' as const, error }),
        );
        const promptGuard = new Promise<{ kind: 'hung' }>((resolve) => {
            setTimeout(() => resolve({ kind: 'hung' }), 1);
        });
        const raced = Promise.race([outcome, promptGuard]);

        await vi.advanceTimersByTimeAsync(1);
        await expect(raced).resolves.toMatchObject({
            kind: 'rejected',
            error: { status: 0, statusText: 'Response body too large' },
        });
        expect(reader.cancel).toHaveBeenCalledOnce();
        expect(reader.releaseLock).toHaveBeenCalledOnce();
    });

    it('keeps a synchronous cancellation throw from replacing the size error', async () => {
        const reader = {
            read: vi.fn().mockResolvedValue({ done: false, value: new Uint8Array(2) }),
            cancel: vi.fn().mockImplementation(() => {
                throw new Error('synchronous cancel failure');
            }),
            releaseLock: vi.fn(),
        };
        const response = {
            body: { getReader: () => reader },
        } as unknown as Response;

        await expect(readBodyWithLimits(response, { maxBytes: 1, deadlineMs: 0 })).rejects.toMatchObject({
            status: 0,
            statusText: 'Response body too large',
        });
        expect(reader.cancel).toHaveBeenCalledOnce();
    });

    it('still reports a stream deadline when cancellation itself rejects', async () => {
        vi.useFakeTimers();
        let resolveRead: ((result: { done: true; value: undefined }) => void) | undefined;
        const reader = {
            read: vi.fn().mockImplementation(
                () =>
                    new Promise<{ done: true; value: undefined }>((resolve) => {
                        resolveRead = resolve;
                    }),
            ),
            cancel: vi.fn().mockImplementation(() => {
                resolveRead?.({ done: true, value: undefined });
                return Promise.reject(new Error('cancel failed'));
            }),
            releaseLock: vi.fn(),
        };
        const response = {
            body: { getReader: () => reader },
        } as unknown as Response;
        const pending = readBodyWithLimits(response, { maxBytes: 10, deadlineMs: 5 });
        const assertion = expect(pending).rejects.toMatchObject({ status: 0, statusText: 'Body read timeout' });
        await vi.advanceTimersByTimeAsync(5);
        await assertion;
        expect(reader.cancel).toHaveBeenCalledOnce();
    });

    it('enforces the stream deadline when read and cancellation never settle', async () => {
        vi.useFakeTimers();
        const reader = {
            read: vi.fn().mockImplementation(() => new Promise<never>(() => undefined)),
            cancel: vi.fn().mockImplementation(() => new Promise<void>(() => undefined)),
            releaseLock: vi.fn(),
        };
        const response = {
            body: { getReader: () => reader },
        } as unknown as Response;
        const pending = readBodyWithLimits(response, { maxBytes: 10, deadlineMs: 5 });
        const assertion = expect(pending).rejects.toMatchObject({ status: 0, statusText: 'Body read timeout' });

        await vi.advanceTimersByTimeAsync(5);
        await assertion;
        expect(reader.cancel).toHaveBeenCalledOnce();
        expect(reader.releaseLock).toHaveBeenCalledOnce();
    });

    it('converts a Zod issue into a validation error with formatted details', () => {
        const result = ItemSchema.safeParse({ id: 'wrong' });
        if (result.success) throw new Error('fixture unexpectedly matched');
        const error = handleZodError(result.error);
        expect(error).toBeInstanceOf(TestRailValidationError);
        expect(error.details).toEqual(result.error.format());
    });

    it('keeps API timeout errors distinguishable from pagination validation errors', () => {
        expect(new TestRailApiError(408, 'timeout')).not.toBeInstanceOf(TestRailPaginationError);
    });
});
