import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import { MAX_PAGINATION_LIMIT } from '../src/constants.js';
import { TestRailValidationError } from '../src/errors.js';
import type { GetAllUsersOptions, GetUsersOptions } from '../src/index.js';
import { createClient, MOCK_CASE, MOCK_RESULT, MOCK_USER, mockErr, mockOk } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_TEST = {
    id: 1,
    case_id: 1,
    status_id: 1,
    run_id: 9,
    title: 'first',
};

const MOCK_ATTACHMENT = { id: 1, name: 'first.txt' };

const AGGREGATE_BOUNDS = {
    pageSize: 2,
    startOffset: 3,
    maxPages: 2,
    maxItems: 10,
    maxDurationMs: 10_000,
    maxBytes: 10_000,
} as const;

function envelope<T>(
    key: string,
    items: readonly T[],
    offset: number,
    limit: number,
    next: string | null,
): Record<string, unknown> {
    return {
        offset,
        limit,
        size: items.length,
        _links: { next, prev: null },
        [key]: items,
    };
}

describe('pagination module adapters', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient();
    });

    afterEach(() => client.destroy());

    describe('global users', () => {
        it.each([
            { name: 'legacy array', raw: [MOCK_USER], expected: [MOCK_USER] },
            { name: 'collection wrapper', raw: { users: [MOCK_USER] }, expected: [MOCK_USER] },
            { name: 'null collection wrapper', raw: { users: null }, expected: [] },
        ])('keeps the one-response $name compatible', async ({ raw, expected }) => {
            mockFetch.mockResolvedValueOnce(mockOk(raw));

            await expect(client.users.getUsers()).resolves.toEqual(expected);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(String(mockFetch.mock.calls[0]?.[0])).toMatch(/\/get_users$/);
        });

        it('forwards global controls and keeps item and strict-page caches separate', async () => {
            const options = Object.freeze({ limit: 2, offset: 4 });
            const raw = envelope('users', [MOCK_USER], 4, 2, null);
            mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

            await expect(client.users.getUsers(undefined, options)).resolves.toEqual([MOCK_USER]);
            await expect(client.users.getUsersPage(options)).resolves.toEqual({
                kind: 'envelope',
                items: [MOCK_USER],
                offset: 4,
                limit: 2,
                size: 1,
                _links: { next: null, prev: null },
            });
            await expect(client.users.getUsersPage(options)).resolves.toMatchObject({ items: [MOCK_USER] });
            await expect(client.users.getUsers(undefined, options)).resolves.toEqual([MOCK_USER]);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            for (const [url] of mockFetch.mock.calls) {
                expect(String(url)).toMatch(/\/get_users&limit=2&offset=4$/);
            }
            expect(options).toEqual({ limit: 2, offset: 4 });
        });

        it('does not reuse a tolerant wrapper as a strict page or cache a rejected page', async () => {
            mockFetch.mockImplementation(() => Promise.resolve(mockOk({ users: [MOCK_USER] })));

            await expect(client.users.getUsers()).resolves.toEqual([MOCK_USER]);
            await expect(client.users.getUsersPage()).rejects.toMatchObject({ reason: 'invalid_page' });
            await expect(client.users.getUsersPage()).rejects.toMatchObject({ reason: 'invalid_page' });

            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('collects more than 250 users with local global requests and immutable controls', async () => {
            const users = Array.from({ length: MAX_PAGINATION_LIMIT + 1 }, (_, index) => ({
                ...MOCK_USER,
                id: index + 1,
            }));
            const startOffset = 3;
            const nextOffset = startOffset + MAX_PAGINATION_LIMIT;
            const options = Object.freeze({
                pageSize: MAX_PAGINATION_LIMIT,
                startOffset,
                maxPages: 2,
                maxItems: users.length,
            });
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(
                        envelope(
                            'users',
                            users.slice(0, MAX_PAGINATION_LIMIT),
                            startOffset,
                            MAX_PAGINATION_LIMIT,
                            `https://attacker.invalid/index.php?/api/v2/get_users/99&offset=${nextOffset}&limit=1`,
                        ),
                    ),
                )
                .mockResolvedValueOnce(
                    mockOk(
                        envelope('users', users.slice(MAX_PAGINATION_LIMIT), nextOffset, MAX_PAGINATION_LIMIT, null),
                    ),
                );

            await expect(client.users.getAllUsers(options)).resolves.toEqual(users);

            expect(mockFetch.mock.calls.map(([url]) => String(url))).toEqual([
                `https://example.testrail.io/index.php?/api/v2/get_users&limit=${MAX_PAGINATION_LIMIT}&offset=${startOffset}`,
                `https://example.testrail.io/index.php?/api/v2/get_users&limit=${MAX_PAGINATION_LIMIT}&offset=${nextOffset}`,
            ]);
            expect(options).toEqual({
                pageSize: MAX_PAGINATION_LIMIT,
                startOffset,
                maxPages: 2,
                maxItems: users.length,
            });
        });

        it('collects fresh users without reading or replacing cached items or pages', async () => {
            const freshUser = { ...MOCK_USER, id: 2 };
            const newestUser = { ...MOCK_USER, id: 3 };
            const controls = { limit: 1, offset: 0 };
            const cachedPage = envelope('users', [MOCK_USER], 0, 1, null);
            mockFetch
                .mockResolvedValueOnce(mockOk(cachedPage))
                .mockResolvedValueOnce(mockOk(cachedPage))
                .mockResolvedValueOnce(mockOk(envelope('users', [freshUser], 0, 1, null)))
                .mockResolvedValueOnce(mockOk(envelope('users', [newestUser], 0, 1, null)));

            await expect(client.users.getUsers(undefined, controls)).resolves.toEqual([MOCK_USER]);
            await expect(client.users.getUsersPage(controls)).resolves.toMatchObject({ items: [MOCK_USER] });
            await expect(client.users.getAllUsers({ pageSize: 1 })).resolves.toEqual([freshUser]);
            await expect(client.users.getAllUsers({ pageSize: 1 })).resolves.toEqual([newestUser]);
            await expect(client.users.getUsers(undefined, controls)).resolves.toEqual([MOCK_USER]);
            await expect(client.users.getUsersPage(controls)).resolves.toMatchObject({ items: [MOCK_USER] });

            expect(mockFetch).toHaveBeenCalledTimes(4);
        });

        it('treats a legacy array as one terminal aggregate page', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([MOCK_USER]));

            await expect(client.users.getAllUsers()).resolves.toEqual([MOCK_USER]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(String(mockFetch.mock.calls[0]?.[0])).toMatch(/\/get_users&limit=250&offset=0$/);
        });

        it('rejects a malformed continuation without returning the first users', async () => {
            mockFetch.mockResolvedValueOnce(
                mockOk(envelope('users', [MOCK_USER], 0, 1, '/api/v2/get_users&offset=1&offset=2')),
            );

            await expect(client.users.getAllUsers({ pageSize: 1 })).rejects.toMatchObject({
                reason: 'invalid_continuation',
                pagesFetched: 1,
                itemsFetched: 1,
            });

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('rejects a later request failure without returning partial users', async () => {
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(envelope('users', [MOCK_USER], 0, 1, '/api/v2/get_users&offset=1&limit=1')),
                )
                .mockResolvedValueOnce(mockErr(400, 'Bad Request'));

            await expect(client.users.getAllUsers({ pageSize: 1 })).rejects.toMatchObject({ status: 400 });

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('enforces the page bound before requesting another users page', async () => {
            mockFetch.mockResolvedValueOnce(
                mockOk(envelope('users', [MOCK_USER], 0, 1, '/api/v2/get_users&offset=1&limit=1')),
            );

            await expect(client.users.getAllUsers({ pageSize: 1, maxPages: 1 })).rejects.toMatchObject({
                reason: 'max_pages',
                pagesFetched: 1,
                itemsFetched: 1,
            });

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it.each([null, 1, '1', true, []].map((options) => ({ options })))(
            'rejects non-object options $options before any global request',
            async ({ options }) => {
                mockFetch.mockImplementation(() => Promise.resolve(mockOk([])));

                await expect(client.users.getUsers(undefined, options as unknown as GetUsersOptions)).rejects.toThrow(
                    TestRailValidationError,
                );
                await expect(client.users.getUsersPage(options as unknown as GetUsersOptions)).rejects.toThrow(
                    TestRailValidationError,
                );
                await expect(client.users.getAllUsers(options as unknown as GetAllUsersOptions)).rejects.toThrow(
                    TestRailValidationError,
                );

                expect(mockFetch).not.toHaveBeenCalled();
            },
        );

        it('keeps the shared maximum page size and rejects invalid controls before fetch', async () => {
            mockFetch.mockImplementation(() => Promise.resolve(mockOk([])));

            await expect(client.users.getUsers(undefined, { limit: MAX_PAGINATION_LIMIT + 1 })).rejects.toThrow(
                TestRailValidationError,
            );
            await expect(client.users.getUsersPage({ offset: -1 })).rejects.toThrow(TestRailValidationError);
            await expect(client.users.getAllUsers({ pageSize: MAX_PAGINATION_LIMIT + 1 })).rejects.toThrow(
                TestRailValidationError,
            );

            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('project users', () => {
        it.each([
            { name: 'legacy array', raw: [MOCK_USER] },
            { name: 'collection wrapper', raw: { users: [MOCK_USER] } },
        ])('preserves the one-response $name', async ({ raw }) => {
            mockFetch.mockResolvedValueOnce(mockOk(raw));

            await expect(client.users.getUsers(14)).resolves.toEqual([MOCK_USER]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(String(mockFetch.mock.calls[0]?.[0])).toMatch(/\/get_users\/14$/);
        });

        it('ignores inconsistent project pagination metadata and never follows its next link', async () => {
            const users = Array.from({ length: 14 }, (_, index) => ({ ...MOCK_USER, id: index + 1 }));
            mockFetch.mockResolvedValueOnce(
                mockOk(envelope('users', users, 0, 1, '/api/v2/get_users/14&offset=1&limit=1')),
            );

            await expect(client.users.getUsers(14)).resolves.toEqual(users);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(String(mockFetch.mock.calls[0]?.[0])).toMatch(/\/get_users\/14$/);
        });

        it('validates project IDs before rejecting unsupported project pagination options', async () => {
            const getUsers = client.users.getUsers.bind(client.users) as unknown as (
                projectId: number,
                options?: unknown,
            ) => Promise<unknown>;
            mockFetch.mockImplementation(() => Promise.resolve(mockOk([])));

            await Promise.all(
                [0, -1, 1.5, Number.NaN].map((projectId) =>
                    expect(getUsers(projectId, {})).rejects.toThrow('projectId must be a positive integer'),
                ),
            );
            await Promise.all(
                [{}, { limit: 1 }, null, 0].map((options) =>
                    expect(getUsers(14, options)).rejects.toThrow(TestRailValidationError),
                ),
            );

            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    it('keeps the legacy case-list projection compatible with a wrapper that has no metadata', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ cases: [MOCK_CASE] }));

        await expect(client.cases.getCases(1)).resolves.toEqual([MOCK_CASE]);
    });

    it('isolates strict page caching from collection-only legacy wrappers', async () => {
        const wrapperOnly = { cases: [MOCK_CASE] };
        mockFetch
            .mockResolvedValueOnce(mockOk(wrapperOnly))
            .mockResolvedValueOnce(mockOk(wrapperOnly))
            .mockResolvedValueOnce(mockOk(wrapperOnly));

        await expect(client.cases.getCases(1)).resolves.toEqual([MOCK_CASE]);
        await expect(client.cases.getCasesPage(1)).rejects.toMatchObject({ reason: 'invalid_page' });
        await expect(client.cases.getCasesPage(1)).rejects.toMatchObject({ reason: 'invalid_page' });

        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('returns an explicit normalized cases page and forwards request controls', async () => {
        mockFetch.mockResolvedValueOnce(mockOk(envelope('cases', [MOCK_CASE], 5, 10, null)));

        await expect(client.cases.getCasesPage(1, { suiteId: 2, limit: 10, offset: 5 })).resolves.toEqual({
            kind: 'envelope',
            items: [MOCK_CASE],
            offset: 5,
            limit: 10,
            size: 1,
            _links: { next: null, prev: null },
        });
        const url = decodeURIComponent(String(mockFetch.mock.calls[0]?.[0]));
        expect(url).toContain('suite_id=2');
        expect(url).toContain('limit=10');
        expect(url).toContain('offset=5');
    });

    it('does not cache an envelope whose server limit exceeds the decoder maximum', async () => {
        const malformed = envelope('cases', [MOCK_CASE], 0, 251, null);
        mockFetch.mockResolvedValueOnce(mockOk(malformed)).mockResolvedValueOnce(mockOk(malformed));

        await expect(client.cases.getCasesPage(1, { limit: 250, offset: 0 })).rejects.toMatchObject({
            reason: 'invalid_page',
        });
        await expect(client.cases.getCasesPage(1, { limit: 250, offset: 0 })).rejects.toMatchObject({
            reason: 'invalid_page',
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('collects cases from authoritative next links while retaining filters and the start offset', async () => {
        const secondCase = { ...MOCK_CASE, id: 2, title: 'second' };
        mockFetch
            .mockResolvedValueOnce(mockOk(envelope('cases', [MOCK_CASE], 5, 1, '/api/v2/get_cases/1?limit=1&offset=6')))
            .mockResolvedValueOnce(mockOk(envelope('cases', [secondCase], 6, 1, null)));

        const options = Object.freeze({
            suiteId: 2,
            pageSize: 1,
            startOffset: 5,
            maxPages: 2,
            maxItems: 10,
            maxDurationMs: 10_000,
            maxBytes: 10_000,
        });
        await expect(client.cases.getAllCases(1, options)).resolves.toEqual([MOCK_CASE, secondCase]);
        expect(options).toEqual({
            suiteId: 2,
            pageSize: 1,
            startOffset: 5,
            maxPages: 2,
            maxItems: 10,
            maxDurationMs: 10_000,
            maxBytes: 10_000,
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const urls = mockFetch.mock.calls.map(([url]) => decodeURIComponent(String(url)));
        expect(urls).toEqual([
            expect.stringContaining('suite_id=2&limit=1&offset=5'),
            expect.stringContaining('suite_id=2&limit=1&offset=6'),
        ]);
    });

    it('decodes the nested case-history page and follows its continuation', async () => {
        const first = { id: 1, user_id: 1, type_id: 1 };
        const second = { id: 2, user_id: 1, type_id: 1 };
        mockFetch
            .mockResolvedValueOnce(
                mockOk([envelope('history', [first], 0, 1, '/api/v2/get_history_for_case/4?offset=1&limit=1')]),
            )
            .mockResolvedValueOnce(mockOk([envelope('history', [second], 1, 1, null)]));

        await expect(
            client.cases.getAllHistoryForCase(4, {
                pageSize: 1,
                startOffset: 0,
                maxPages: 2,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        ).resolves.toEqual([first, second]);
    });

    it('separates legacy and strict-page caches for nested case history', async () => {
        const history = { id: 1, user_id: 1, type_id: 1 };
        const raw = [envelope('history', [history], 4, 2, null)];
        mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

        await expect(client.cases.getHistoryForCase(4, { limit: 2, offset: 4 })).resolves.toEqual([history]);
        await expect(client.cases.getHistoryForCasePage(4, { limit: 2, offset: 4 })).resolves.toEqual({
            kind: 'envelope',
            items: [history],
            offset: 4,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
        });
        await expect(client.cases.getHistoryForCasePage(4, { limit: 2, offset: 4 })).resolves.toMatchObject({
            kind: 'envelope',
            items: [history],
        });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retains test status filters across all component requests', async () => {
        const second = { ...MOCK_TEST, id: 2, title: 'second' };
        mockFetch
            .mockResolvedValueOnce(mockOk(envelope('tests', [MOCK_TEST], 0, 1, '/api/v2/get_tests/9?limit=1&offset=1')))
            .mockResolvedValueOnce(mockOk(envelope('tests', [second], 1, 1, null)));

        await expect(
            client.tests.getAllTests(9, {
                statusId: [1, 5],
                pageSize: 1,
                startOffset: 0,
                maxPages: 2,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        ).resolves.toEqual([MOCK_TEST, second]);
        for (const [url] of mockFetch.mock.calls) {
            expect(decodeURIComponent(String(url))).toContain('status_id=1,5');
        }
    });

    it('separates legacy and strict-page caches for tests', async () => {
        const raw = envelope('tests', [MOCK_TEST], 4, 2, null);
        mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

        await expect(client.tests.getTests(9, { statusId: [1], limit: 2, offset: 4 })).resolves.toEqual([MOCK_TEST]);
        await expect(client.tests.getTestsPage(9, { statusId: [1], limit: 2, offset: 4 })).resolves.toEqual({
            kind: 'envelope',
            items: [MOCK_TEST],
            offset: 4,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
        });
        await expect(client.tests.getTestsPage(9, { statusId: [1], limit: 2, offset: 4 })).resolves.toMatchObject({
            kind: 'envelope',
            items: [MOCK_TEST],
        });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retains documented result filters for getAllResultsForCase', async () => {
        const second = { ...MOCK_RESULT, id: 2 };
        mockFetch
            .mockResolvedValueOnce(
                mockOk(envelope('results', [MOCK_RESULT], 0, 1, '/api/v2/get_results_for_case/2/3?limit=1&offset=1')),
            )
            .mockResolvedValueOnce(mockOk(envelope('results', [second], 1, 1, null)));

        await expect(
            client.results.getAllResultsForCase(2, 3, {
                statusId: [1],
                defectsFilter: 'BUG-1',
                pageSize: 1,
                maxPages: 2,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        ).resolves.toEqual([MOCK_RESULT, second]);
        for (const [url] of mockFetch.mock.calls) {
            const decoded = decodeURIComponent(String(url));
            expect(decoded).toContain('status_id=1');
            expect(decoded).toContain('defects_filter=BUG-1');
        }
    });

    function resultAdapters(): readonly {
        name: string;
        endpoint: string;
        get: () => Promise<unknown[]>;
        page: () => Promise<unknown>;
        all: () => Promise<unknown[]>;
        supportsCreatedFilters: boolean;
    }[] {
        const pageOptions = {
            statusId: [1],
            defectsFilter: 'BUG-1',
            limit: 2,
            offset: 4,
        };
        const allOptions = {
            statusId: [1],
            defectsFilter: 'BUG-1',
            ...AGGREGATE_BOUNDS,
        };
        const runPageOptions = {
            ...pageOptions,
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [7],
        };
        const runAllOptions = {
            ...allOptions,
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [7],
        };
        return [
            {
                name: 'results for test',
                endpoint: 'get_results/8',
                get: () => client.results.getResults(8, pageOptions),
                page: () => client.results.getResultsPage(8, pageOptions),
                all: () => client.results.getAllResults(8, allOptions),
                supportsCreatedFilters: false,
            },
            {
                name: 'results for case',
                endpoint: 'get_results_for_case/8/9',
                get: () => client.results.getResultsForCase(8, 9, pageOptions),
                page: () => client.results.getResultsForCasePage(8, 9, pageOptions),
                all: () => client.results.getAllResultsForCase(8, 9, allOptions),
                supportsCreatedFilters: false,
            },
            {
                name: 'results for run',
                endpoint: 'get_results_for_run/8',
                get: () => client.results.getResultsForRun(8, runPageOptions),
                page: () => client.results.getResultsForRunPage(8, runPageOptions),
                all: () => client.results.getAllResultsForRun(8, runAllOptions),
                supportsCreatedFilters: true,
            },
        ];
    }

    it.each(['results for test', 'results for case', 'results for run'])(
        '%s separates the legacy cache from the strict page cache',
        async (name) => {
            const adapter = resultAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing result adapter for ${name}`);
            const raw = envelope('results', [MOCK_RESULT], 4, 2, null);
            mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

            await expect(adapter.get()).resolves.toEqual([MOCK_RESULT]);
            await expect(adapter.page()).resolves.toEqual({
                kind: 'envelope',
                items: [MOCK_RESULT],
                offset: 4,
                limit: 2,
                size: 1,
                _links: { next: null, prev: null },
            });
            await expect(adapter.page()).resolves.toMatchObject({ kind: 'envelope', items: [MOCK_RESULT] });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            const url = decodeURIComponent(String(mockFetch.mock.calls[0]?.[0]));
            expect(url).toContain(adapter.endpoint);
            expect(url.includes('created_after=100')).toBe(adapter.supportsCreatedFilters);
            expect(url.includes('created_before=200')).toBe(adapter.supportsCreatedFilters);
            expect(url.includes('created_by=7')).toBe(adapter.supportsCreatedFilters);
            expect(url).toContain('status_id=1');
            expect(url).toContain('defects_filter=BUG-1');
        },
    );

    it.each(['results for test', 'results for case', 'results for run'])(
        '%s aggregation retains filters and rebuilds the known endpoint',
        async (name) => {
            const adapter = resultAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing result adapter for ${name}`);
            const second = { ...MOCK_RESULT, id: 2 };
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(
                        envelope(
                            'results',
                            [MOCK_RESULT],
                            3,
                            2,
                            'https://attacker.invalid/not-the-endpoint?offset=5&limit=1',
                        ),
                    ),
                )
                .mockResolvedValueOnce(mockOk(envelope('results', [second], 5, 2, null)));

            await expect(adapter.all()).resolves.toEqual([MOCK_RESULT, second]);

            const urls = mockFetch.mock.calls.map(([url]) => decodeURIComponent(String(url)));
            expect(urls).toHaveLength(2);
            for (const url of urls) {
                expect(url).toContain(adapter.endpoint);
                expect(url.includes('created_by=7')).toBe(adapter.supportsCreatedFilters);
                expect(url).toContain('status_id=1');
                expect(url).toContain('limit=2');
                expect(url).not.toContain('attacker.invalid');
                expect(url).toContain('defects_filter=BUG-1');
            }
            expect(urls[0]).toContain('offset=3');
            expect(urls[1]).toContain('offset=5');
        },
    );

    function attachmentAdapters(): readonly {
        name: string;
        endpoint: string;
        get: () => Promise<unknown[]>;
        page: () => Promise<unknown>;
        all: () => Promise<unknown[]>;
    }[] {
        const pageOptions = { limit: 2, offset: 4 };
        return [
            {
                name: 'case attachments',
                endpoint: 'get_attachments_for_case/8',
                get: () => client.attachments.getAttachmentsForCase(8, pageOptions),
                page: () => client.attachments.getAttachmentsForCasePage(8, pageOptions),
                all: () => client.attachments.getAllAttachmentsForCase(8, AGGREGATE_BOUNDS),
            },
            {
                name: 'run attachments',
                endpoint: 'get_attachments_for_run/8',
                get: () => client.attachments.getAttachmentsForRun(8, pageOptions),
                page: () => client.attachments.getAttachmentsForRunPage(8, pageOptions),
                all: () => client.attachments.getAllAttachmentsForRun(8, AGGREGATE_BOUNDS),
            },
            {
                name: 'plan attachments',
                endpoint: 'get_attachments_for_plan/8',
                get: () => client.attachments.getAttachmentsForPlan(8, pageOptions),
                page: () => client.attachments.getAttachmentsForPlanPage(8, pageOptions),
                all: () => client.attachments.getAllAttachmentsForPlan(8, AGGREGATE_BOUNDS),
            },
        ];
    }

    it.each(['case attachments', 'run attachments', 'plan attachments'])(
        '%s separates the legacy cache from the strict page cache',
        async (name) => {
            const adapter = attachmentAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing attachment adapter for ${name}`);
            const raw = envelope('attachments', [MOCK_ATTACHMENT], 4, 2, null);
            mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

            await expect(adapter.get()).resolves.toEqual([MOCK_ATTACHMENT]);
            await expect(adapter.page()).resolves.toEqual({
                kind: 'envelope',
                items: [MOCK_ATTACHMENT],
                offset: 4,
                limit: 2,
                size: 1,
                _links: { next: null, prev: null },
            });
            await expect(adapter.page()).resolves.toMatchObject({ kind: 'envelope', items: [MOCK_ATTACHMENT] });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(String(mockFetch.mock.calls[0]?.[0])).toContain(adapter.endpoint);
        },
    );

    it.each(['case attachments', 'run attachments', 'plan attachments'])(
        '%s aggregation rebuilds the known endpoint',
        async (name) => {
            const adapter = attachmentAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing attachment adapter for ${name}`);
            const second = { ...MOCK_ATTACHMENT, id: 2, name: 'second.txt' };
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(
                        envelope(
                            'attachments',
                            [MOCK_ATTACHMENT],
                            3,
                            2,
                            'https://attacker.invalid/not-the-endpoint?offset=5&limit=1',
                        ),
                    ),
                )
                .mockResolvedValueOnce(mockOk(envelope('attachments', [second], 5, 2, null)));

            await expect(adapter.all()).resolves.toEqual([MOCK_ATTACHMENT, second]);

            const urls = mockFetch.mock.calls.map(([url]) => String(url));
            expect(urls).toHaveLength(2);
            for (const url of urls) {
                expect(url).toContain(adapter.endpoint);
                expect(url).toContain('limit=2');
                expect(url).not.toContain('attacker.invalid');
            }
            expect(urls[0]).toContain('offset=3');
            expect(urls[1]).toContain('offset=5');
        },
    );

    it('treats legacy arrays as terminal get-all pages with default module options', async () => {
        const history = { id: 1, user_id: 1, type_id: 1 };
        mockFetch
            .mockResolvedValueOnce(mockOk([MOCK_CASE]))
            .mockResolvedValueOnce(mockOk([history]))
            .mockResolvedValueOnce(mockOk([MOCK_TEST]))
            .mockResolvedValueOnce(mockOk([MOCK_RESULT]))
            .mockResolvedValueOnce(mockOk([MOCK_ATTACHMENT]));

        await expect(client.cases.getAllCases(1)).resolves.toEqual([MOCK_CASE]);
        await expect(client.cases.getAllHistoryForCase(1)).resolves.toEqual([history]);
        await expect(client.tests.getAllTests(9)).resolves.toEqual([MOCK_TEST]);
        await expect(client.results.getAllResults(1)).resolves.toEqual([MOCK_RESULT]);
        await expect(client.attachments.getAllAttachmentsForCase(1)).resolves.toEqual([MOCK_ATTACHMENT]);
        expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('adds documented pagination controls and all-page collection to plan attachments', async () => {
        const first = { id: 1, name: 'first.txt' };
        const second = { id: 2, name: 'second.txt' };
        mockFetch
            .mockResolvedValueOnce(
                mockOk(envelope('attachments', [first], 3, 1, '/api/v2/get_attachments_for_plan/8?offset=4&limit=1')),
            )
            .mockResolvedValueOnce(mockOk(envelope('attachments', [second], 4, 1, null)));

        await expect(client.attachments.getAllAttachmentsForPlan(8, { pageSize: 1, startOffset: 3 })).resolves.toEqual([
            first,
            second,
        ]);
        const urls = mockFetch.mock.calls.map(([url]) => String(url));
        expect(urls[0]).toContain('limit=1&offset=3');
        expect(urls[1]).toContain('limit=1&offset=4');
    });
});
