import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient } from '../src/client.js';
import { createClient, mockOk, MOCK_MILESTONE, MOCK_PLAN, MOCK_PROJECT, MOCK_RUN, MOCK_SUITE } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_SECTION = {
    id: 1,
    suite_id: 9,
    name: 'Section',
    display_order: 1,
    depth: 0,
};

function envelope(
    key: string,
    items: readonly Record<string, unknown>[],
    offset: number,
    limit: number,
    next: string | null,
): Record<string, unknown> {
    return {
        [key]: items,
        offset,
        limit,
        size: items.length,
        _links: { next, prev: null },
    };
}

interface AdapterCase {
    readonly name: string;
    readonly key: string;
    readonly path: string;
    readonly filterFragment?: string;
    readonly item: Record<string, unknown>;
    readonly getDefault: (client: TestRailClient) => Promise<unknown>;
    readonly getPage: (client: TestRailClient) => Promise<unknown>;
    readonly getAll: (client: TestRailClient) => Promise<unknown>;
    readonly getAllDefault: (client: TestRailClient) => Promise<unknown>;
}

const adapters: readonly AdapterCase[] = [
    {
        name: 'runs',
        key: 'runs',
        path: 'get_runs/7',
        filterFragment: 'refs=REQ',
        item: MOCK_RUN,
        getDefault: (client) => client.runs.getRuns(7, { refs: 'REQ' }),
        getPage: (client) => client.runs.getRunsPage(7, { refs: 'REQ', limit: 2, offset: 5 }),
        getAll: (client) =>
            client.runs.getAllRuns(7, {
                refs: 'REQ',
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.runs.getAllRuns(7),
    },
    {
        name: 'plans',
        key: 'plans',
        path: 'get_plans/7',
        filterFragment: 'created_after=123',
        item: MOCK_PLAN,
        getDefault: (client) => client.plans.getPlans(7, { createdAfter: 123 }),
        getPage: (client) => client.plans.getPlansPage(7, { createdAfter: 123, limit: 2, offset: 5 }),
        getAll: (client) =>
            client.plans.getAllPlans(7, {
                createdAfter: 123,
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.plans.getAllPlans(7),
    },
    {
        name: 'projects',
        key: 'projects',
        path: 'get_projects',
        filterFragment: 'is_completed=0',
        item: MOCK_PROJECT,
        getDefault: (client) => client.projects.getProjects({ isCompleted: false }),
        getPage: (client) => client.projects.getProjectsPage({ isCompleted: false, limit: 2, offset: 5 }),
        getAll: (client) =>
            client.projects.getAllProjects({
                isCompleted: false,
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.projects.getAllProjects(),
    },
    {
        name: 'sections',
        key: 'sections',
        path: 'get_sections/7',
        filterFragment: 'suite_id=9',
        item: MOCK_SECTION,
        getDefault: (client) => client.sections.getSections(7, { suiteId: 9 }),
        getPage: (client) => client.sections.getSectionsPage(7, { suiteId: 9, limit: 2, offset: 5 }),
        getAll: (client) =>
            client.sections.getAllSections(7, {
                suiteId: 9,
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.sections.getAllSections(7),
    },
    {
        name: 'milestones',
        key: 'milestones',
        path: 'get_milestones/7',
        filterFragment: 'is_started=1',
        item: MOCK_MILESTONE,
        getDefault: (client) => client.milestones.getMilestones(7, { isCompleted: false, isStarted: true }),
        getPage: (client) =>
            client.milestones.getMilestonesPage(7, {
                isCompleted: false,
                isStarted: true,
                limit: 2,
                offset: 5,
            }),
        getAll: (client) =>
            client.milestones.getAllMilestones(7, {
                isCompleted: false,
                isStarted: true,
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.milestones.getAllMilestones(7),
    },
    {
        name: 'suites',
        key: 'suites',
        path: 'get_suites/7',
        item: MOCK_SUITE,
        getDefault: (client) => client.suites.getSuites(7),
        getPage: (client) => client.suites.getSuitesPage(7, { limit: 2, offset: 5 }),
        getAll: (client) =>
            client.suites.getAllSuites(7, {
                pageSize: 1,
                startOffset: 3,
                maxPages: 3,
                maxItems: 10,
                maxDurationMs: 10_000,
                maxBytes: 10_000,
            }),
        getAllDefault: (client) => client.suites.getAllSuites(7),
    },
];

describe.each(adapters)('$name pagination adapter', (adapter) => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient({ maxRetries: 0 });
    });

    afterEach(() => client.destroy());

    it('keeps the existing one-response array contract for wrapper-only responses', async () => {
        mockFetch.mockResolvedValueOnce(mockOk({ [adapter.key]: [adapter.item] }));

        await expect(adapter.getDefault(client)).resolves.toEqual([adapter.item]);
    });

    it('returns one metadata-preserving page', async () => {
        mockFetch.mockResolvedValueOnce(mockOk(envelope(adapter.key, [adapter.item], 5, 2, null)));

        await expect(adapter.getPage(client)).resolves.toEqual({
            kind: 'envelope',
            items: [adapter.item],
            offset: 5,
            limit: 2,
            size: 1,
            _links: { next: null, prev: null },
        });
    });

    it('rebuilds a validated continuation on the known endpoint and retains filters', async () => {
        const secondItem = { ...adapter.item, id: 2 };
        mockFetch
            .mockResolvedValueOnce(
                mockOk(
                    envelope(
                        adapter.key,
                        [adapter.item],
                        3,
                        1,
                        'https://untrusted.invalid/elsewhere?offset=4&limit=99',
                    ),
                ),
            )
            .mockResolvedValueOnce(mockOk(envelope(adapter.key, [secondItem], 4, 1, null)));

        await expect(adapter.getAll(client)).resolves.toEqual([adapter.item, secondItem]);

        const urls = mockFetch.mock.calls.map(([url]) => String(url));
        expect(urls).toHaveLength(2);
        for (const url of urls) {
            expect(url).toContain(adapter.path);
            expect(url).not.toContain('untrusted.invalid');
            expect(url).toContain('limit=1');
            if (adapter.filterFragment !== undefined) {
                expect(url).toContain(adapter.filterFragment);
            }
        }
        expect(urls[0]).toContain('offset=3');
        expect(urls[1]).toContain('offset=4');
        expect(urls[1]).not.toContain('limit=99');
    });

    it('treats a legacy array as one terminal page with default aggregate bounds', async () => {
        mockFetch.mockResolvedValueOnce(mockOk([adapter.item]));

        await expect(adapter.getAllDefault(client)).resolves.toEqual([adapter.item]);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const url = String(mockFetch.mock.calls[0]?.[0]);
        expect(url).toContain(adapter.path);
        expect(url).toContain('limit=250');
        expect(url).toContain('offset=0');
    });
});
