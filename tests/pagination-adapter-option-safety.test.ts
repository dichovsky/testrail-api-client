import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../src/pagination.js';
import { snapshotPaginatedRequestOptions, snapshotPaginationSafetyOptions } from '../src/modules/pagination-options.js';
import { createClient, mockOk } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BOUNDS = {
    pageSize: 1,
    startOffset: 0,
    maxPages: 2,
    maxItems: 10,
    maxDurationMs: 10_000,
    maxBytes: 10_000,
} as const;

function envelope(key: string, offset: number, next: string | null): Record<string, unknown> {
    return {
        [key]: [],
        offset,
        limit: 1,
        size: 0,
        _links: { next, prev: null },
    };
}

function requestedUrls(): string[] {
    return mockFetch.mock.calls.map(([url]) => decodeURIComponent(String(url)));
}

type WiderControlledOptions = PaginatedRequestOptions & {
    readonly requestControls: false;
    readonly now: () => number;
    readonly fetchPage: () => Promise<never>;
};

type WiderSafetyOptions = PaginationSafetyOptions & {
    readonly pageSize: number;
    readonly startOffset: number;
    readonly requestControls: true;
    readonly now: () => number;
    readonly fetchPage: () => Promise<never>;
};

const poisonedControlledOptions: WiderControlledOptions = {
    pageSize: 7,
    startOffset: 4,
    maxPages: 2,
    maxItems: 10,
    maxDurationMs: 10_000,
    maxBytes: 10_000,
    requestControls: false,
    now: () => Date.now() + 60_000,
    fetchPage: () => Promise.reject(new Error('injected fetchPage must not run')),
};

const poisonedSafetyOptions: WiderSafetyOptions = {
    pageSize: 7,
    startOffset: 4,
    maxPages: 2,
    maxItems: 10,
    maxDurationMs: 10_000,
    maxBytes: 10_000,
    requestControls: true,
    now: () => Date.now() + 60_000,
    fetchPage: () => Promise.reject(new Error('injected fetchPage must not run')),
};

interface ControlledAdapter {
    readonly name: string;
    readonly endpoint: string;
    readonly all: (client: TestRailClient, options: WiderControlledOptions) => Promise<unknown[]>;
}

const controlledAdapters: readonly ControlledAdapter[] = [
    {
        name: 'case attachments',
        endpoint: 'get_attachments_for_case/1',
        all: (client, options) => client.attachments.getAllAttachmentsForCase(1, options),
    },
    {
        name: 'run attachments',
        endpoint: 'get_attachments_for_run/1',
        all: (client, options) => client.attachments.getAllAttachmentsForRun(1, options),
    },
    {
        name: 'plan attachments',
        endpoint: 'get_attachments_for_plan/1',
        all: (client, options) => client.attachments.getAllAttachmentsForPlan(1, options),
    },
    { name: 'cases', endpoint: 'get_cases/1', all: (client, options) => client.cases.getAllCases(1, options) },
    {
        name: 'case history',
        endpoint: 'get_history_for_case/1',
        all: (client, options) => client.cases.getAllHistoryForCase(1, options),
    },
    { name: 'labels', endpoint: 'get_labels/1', all: (client, options) => client.labels.getAllLabels(1, options) },
    {
        name: 'milestones',
        endpoint: 'get_milestones/1',
        all: (client, options) => client.milestones.getAllMilestones(1, options),
    },
    { name: 'plans', endpoint: 'get_plans/1', all: (client, options) => client.plans.getAllPlans(1, options) },
    { name: 'projects', endpoint: 'get_projects', all: (client, options) => client.projects.getAllProjects(options) },
    { name: 'results', endpoint: 'get_results/1', all: (client, options) => client.results.getAllResults(1, options) },
    {
        name: 'case results',
        endpoint: 'get_results_for_case/1/1',
        all: (client, options) => client.results.getAllResultsForCase(1, 1, options),
    },
    {
        name: 'run results',
        endpoint: 'get_results_for_run/1',
        all: (client, options) => client.results.getAllResultsForRun(1, options),
    },
    { name: 'runs', endpoint: 'get_runs/1', all: (client, options) => client.runs.getAllRuns(1, options) },
    {
        name: 'sections',
        endpoint: 'get_sections/1',
        all: (client, options) => client.sections.getAllSections(1, options),
    },
    {
        name: 'shared steps',
        endpoint: 'get_shared_steps/1',
        all: (client, options) => client.sharedSteps.getAllSharedSteps(1, options),
    },
    { name: 'suites', endpoint: 'get_suites/1', all: (client, options) => client.suites.getAllSuites(1, options) },
    { name: 'tests', endpoint: 'get_tests/1', all: (client, options) => client.tests.getAllTests(1, options) },
];

interface ResponseDrivenAdapter {
    readonly name: string;
    readonly endpoint: string;
    readonly all: (client: TestRailClient, options: WiderSafetyOptions) => Promise<unknown[]>;
}

const responseDrivenAdapters: readonly ResponseDrivenAdapter[] = [
    {
        name: 'case statuses',
        endpoint: 'get_case_statuses',
        all: (client, options) => client.metadata.getAllCaseStatuses(options),
    },
    {
        name: 'datasets',
        endpoint: 'get_datasets/1',
        all: (client, options) => client.datasets.getAllDatasets(1, options),
    },
    { name: 'groups', endpoint: 'get_groups', all: (client, options) => client.users.getAllGroups(options) },
    { name: 'roles', endpoint: 'get_roles', all: (client, options) => client.metadata.getAllRoles(options) },
    {
        name: 'shared-step history',
        endpoint: 'get_shared_step_history/1',
        all: (client, options) => client.sharedSteps.getAllSharedStepHistory(1, options),
    },
    {
        name: 'variables',
        endpoint: 'get_variables/1',
        all: (client, options) => client.variables.getAllVariables(1, options),
    },
];

describe('aggregate adapter option isolation', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient({ maxRetries: 0 });
    });

    afterEach(() => client.destroy());

    it('whitelists public pagination fields from wider structurally typed objects', () => {
        expect(snapshotPaginatedRequestOptions(poisonedControlledOptions)).toEqual({
            pageSize: 7,
            startOffset: 4,
            maxPages: 2,
            maxItems: 10,
            maxDurationMs: 10_000,
            maxBytes: 10_000,
        });
        expect(snapshotPaginationSafetyOptions(poisonedSafetyOptions)).toEqual({
            maxPages: 2,
            maxItems: 10,
            maxDurationMs: 10_000,
            maxBytes: 10_000,
        });
    });

    it.each(controlledAdapters)(
        '$name rejects injected request-control mode and uses public controls',
        async (adapter) => {
            mockFetch.mockResolvedValueOnce(mockOk([]));

            await expect(adapter.all(client, poisonedControlledOptions)).resolves.toEqual([]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url] = requestedUrls();
            expect(url).toContain(adapter.endpoint);
            expect(url).toContain('limit=7');
            expect(url).toContain('offset=4');
        },
    );

    it.each(responseDrivenAdapters)(
        '$name rejects injected request controls and omits them initially',
        async (adapter) => {
            mockFetch.mockResolvedValueOnce(mockOk([]));

            await expect(adapter.all(client, poisonedSafetyOptions)).resolves.toEqual([]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url] = requestedUrls();
            expect(url).toContain(adapter.endpoint);
            expect(url).not.toContain('limit=');
            expect(url).not.toContain('offset=');
        },
    );
});

interface FilterSnapshot {
    readonly promise: Promise<unknown[]>;
    readonly mutate: () => void;
    readonly expected: readonly string[];
    readonly rejected: readonly string[];
}

interface FilterAdapter {
    readonly name: string;
    readonly key: string;
    readonly endpoint: string;
    readonly start: (client: TestRailClient) => FilterSnapshot;
}

const filterAdapters: readonly FilterAdapter[] = [
    {
        name: 'cases',
        key: 'cases',
        endpoint: 'get_cases/1',
        start: (client) => {
            const options = { suiteId: 1, ...BOUNDS };
            return {
                promise: client.cases.getAllCases(1, options),
                mutate: () => {
                    options.suiteId = 2;
                },
                expected: ['suite_id=1'],
                rejected: ['suite_id=2'],
            };
        },
    },
    {
        name: 'runs',
        key: 'runs',
        endpoint: 'get_runs/1',
        start: (client) => {
            const options = { refsFilter: 'A', createdBy: [1], ...BOUNDS };
            return {
                promise: client.runs.getAllRuns(1, options),
                mutate: () => {
                    options.refsFilter = 'B';
                    options.createdBy.push(2);
                },
                expected: ['refs_filter=A', 'created_by=1'],
                rejected: ['refs_filter=B', 'created_by=1,2'],
            };
        },
    },
    {
        name: 'plans',
        key: 'plans',
        endpoint: 'get_plans/1',
        start: (client) => {
            const options = { createdAfter: 10, createdBy: [1], milestoneId: [2], ...BOUNDS };
            return {
                promise: client.plans.getAllPlans(1, options),
                mutate: () => {
                    options.createdAfter = 20;
                    options.createdBy.push(3);
                    options.milestoneId.push(4);
                },
                expected: ['created_after=10', 'created_by=1', 'milestone_id=2'],
                rejected: ['created_after=20', 'created_by=1,3', 'milestone_id=2,4'],
            };
        },
    },
    {
        name: 'milestones',
        key: 'milestones',
        endpoint: 'get_milestones/1',
        start: (client) => {
            const options = { isCompleted: false, ...BOUNDS };
            return {
                promise: client.milestones.getAllMilestones(1, options),
                mutate: () => {
                    options.isCompleted = true;
                },
                expected: ['is_completed=0'],
                rejected: ['is_completed=1'],
            };
        },
    },
    {
        name: 'sections',
        key: 'sections',
        endpoint: 'get_sections/1',
        start: (client) => {
            const options = { suiteId: 1, ...BOUNDS };
            return {
                promise: client.sections.getAllSections(1, options),
                mutate: () => {
                    options.suiteId = 2;
                },
                expected: ['suite_id=1'],
                rejected: ['suite_id=2'],
            };
        },
    },
    {
        name: 'tests',
        key: 'tests',
        endpoint: 'get_tests/1',
        start: (client) => {
            const options = { statusId: [1], ...BOUNDS };
            return {
                promise: client.tests.getAllTests(1, options),
                mutate: () => options.statusId.push(2),
                expected: ['status_id=1'],
                rejected: ['status_id=1,2'],
            };
        },
    },
    {
        name: 'results',
        key: 'results',
        endpoint: 'get_results_for_case/1/1',
        start: (client) => {
            const options = { createdBy: [1], statusId: [2], defectsFilter: 'A', ...BOUNDS };
            return {
                promise: client.results.getAllResultsForCase(1, 1, options),
                mutate: () => {
                    options.createdBy.push(3);
                    options.statusId.push(4);
                    options.defectsFilter = 'B';
                },
                expected: ['created_by=1', 'status_id=2', 'defects_filter=A'],
                rejected: ['created_by=1,3', 'status_id=2,4', 'defects_filter=B'],
            };
        },
    },
];

describe.each(filterAdapters)('$name aggregate filter snapshots', (adapter) => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient({ maxRetries: 0 });
    });

    afterEach(() => client.destroy());

    it('keeps scalar and array filters stable when the caller mutates its options during page one', async () => {
        let resolveFirst!: (response: Response) => void;
        const firstResponse = new Promise<Response>((resolve) => {
            resolveFirst = resolve;
        });
        mockFetch.mockReturnValueOnce(firstResponse).mockResolvedValueOnce(mockOk(envelope(adapter.key, 1, null)));

        const snapshot = adapter.start(client);
        await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
        snapshot.mutate();
        resolveFirst(mockOk(envelope(adapter.key, 0, `?offset=1&limit=1`)));

        await expect(snapshot.promise).resolves.toEqual([]);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        const urls = requestedUrls();
        for (const url of urls) {
            expect(url).toContain(adapter.endpoint);
            for (const fragment of snapshot.expected) expect(url).toContain(fragment);
            for (const fragment of snapshot.rejected) expect(url).not.toContain(fragment);
        }
    });
});
