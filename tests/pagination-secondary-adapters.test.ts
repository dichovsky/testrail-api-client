import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestRailClient } from '../src/client.js';
import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../src/pagination.js';
import { BASE_CONFIG, mockOk } from './helpers.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

interface ControlledAdapter {
    readonly name: string;
    readonly endpoint: string;
    readonly key: string;
    readonly rows: readonly [Record<string, unknown>, Record<string, unknown>];
    readonly get: (options: { limit: number; offset: number }) => Promise<unknown[]>;
    readonly page: (options: { limit: number; offset: number }) => Promise<unknown>;
    readonly all: (options?: PaginatedRequestOptions) => Promise<unknown[]>;
}

interface EnvelopeOnlyAdapter {
    readonly name: string;
    readonly endpoint: string;
    readonly key: string;
    readonly rows: readonly [Record<string, unknown>, Record<string, unknown>];
    readonly get: () => Promise<unknown[]>;
    readonly page: () => Promise<unknown>;
    readonly all: (options?: PaginationSafetyOptions) => Promise<unknown[]>;
}

function envelope(
    key: string,
    items: readonly Record<string, unknown>[],
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

function requestedUrl(index: number): string {
    const value: unknown = mockFetch.mock.calls[index]?.[0];
    if (typeof value !== 'string') throw new Error(`Expected fetch call ${index} to contain a string URL`);
    return value;
}

describe('secondary pagination module adapters', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = new TestRailClient({ ...BASE_CONFIG, maxRetries: 0 });
    });

    afterEach(() => {
        client.destroy();
    });

    function controlledAdapters(): readonly ControlledAdapter[] {
        return [
            {
                name: 'shared steps',
                endpoint: 'get_shared_steps/7',
                key: 'shared_steps',
                rows: [
                    { id: 1, title: 'Login' },
                    { id: 2, title: 'Logout' },
                ],
                get: (options) => client.sharedSteps.getSharedSteps(7, options),
                page: (options) => client.sharedSteps.getSharedStepsPage(7, options),
                all: (options) => client.sharedSteps.getAllSharedSteps(7, options),
            },
            {
                name: 'labels',
                endpoint: 'get_labels/7',
                key: 'labels',
                rows: [
                    { id: 1, title: 'smoke' },
                    { id: 2, title: 'release' },
                ],
                get: (options) => client.labels.getLabels(7, options),
                page: (options) => client.labels.getLabelsPage(7, options),
                all: (options) => client.labels.getAllLabels(7, options),
            },
        ];
    }

    it.each(['shared steps', 'labels'])('%s separates legacy and strict-page caches', async (name) => {
        const adapter = controlledAdapters().find((candidate) => candidate.name === name);
        if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
        const [first] = adapter.rows;
        const raw = envelope(adapter.key, [first], 4, 17, null);
        mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

        await expect(adapter.get({ limit: 17, offset: 4 })).resolves.toEqual([first]);
        await expect(adapter.page({ limit: 17, offset: 4 })).resolves.toEqual({
            kind: 'envelope',
            items: [first],
            offset: 4,
            limit: 17,
            size: 1,
            _links: { next: null, prev: null },
        });
        await expect(adapter.page({ limit: 17, offset: 4 })).resolves.toMatchObject({
            kind: 'envelope',
            items: [first],
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(requestedUrl(0)).toContain(adapter.endpoint);
        expect(requestedUrl(0)).toContain('&limit=17&offset=4');
    });

    it.each(['shared steps', 'labels'])(
        '%s aggregation rebuilds the known endpoint and keeps pageSize',
        async (name) => {
            const adapter = controlledAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first, second] = adapter.rows;
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(
                        envelope(
                            adapter.key,
                            [first],
                            3,
                            2,
                            'https://attacker.invalid/not-the-endpoint?offset=5&limit=1',
                        ),
                    ),
                )
                .mockResolvedValueOnce(mockOk(envelope(adapter.key, [second], 5, 2, null)));

            await expect(
                adapter.all({
                    pageSize: 2,
                    startOffset: 3,
                    maxPages: 2,
                    maxItems: 10,
                    maxDurationMs: 10_000,
                    maxBytes: 10_000,
                }),
            ).resolves.toEqual([first, second]);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(requestedUrl(0)).toContain(`${adapter.endpoint}&limit=2&offset=3`);
            expect(requestedUrl(1)).toContain(`${adapter.endpoint}&limit=2&offset=5`);
            expect(requestedUrl(1)).not.toContain('attacker.invalid');
        },
    );

    it('shared-step aggregation preserves every list filter across pages', async () => {
        const [first, second] = controlledAdapters()[0]?.rows ?? [];
        if (first === undefined || second === undefined) throw new Error('Missing shared-step rows');
        mockFetch
            .mockResolvedValueOnce(mockOk(envelope('shared_steps', [first], 0, 1, '?offset=1&limit=1')))
            .mockResolvedValueOnce(mockOk(envelope('shared_steps', [second], 1, 1, null)));

        await client.sharedSteps.getAllSharedSteps(7, {
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [2, 3],
            updatedAfter: 300,
            updatedBefore: 400,
            refs: 'TR-42',
            pageSize: 1,
        });

        for (const index of [0, 1]) {
            const requested = new URL(requestedUrl(index));
            expect(Object.fromEntries(requested.searchParams)).toMatchObject({
                created_after: '100',
                created_before: '200',
                created_by: '2,3',
                updated_after: '300',
                updated_before: '400',
                refs: 'TR-42',
            });
        }
    });

    it.each(['shared steps', 'labels'])(
        '%s treats a legacy array as one terminal page with default aggregate bounds',
        async (name) => {
            const adapter = controlledAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first] = adapter.rows;
            mockFetch.mockResolvedValueOnce(mockOk([first]));

            await expect(adapter.all()).resolves.toEqual([first]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(requestedUrl(0)).toContain(`${adapter.endpoint}&limit=250&offset=0`);
        },
    );

    function envelopeOnlyAdapters(): readonly EnvelopeOnlyAdapter[] {
        return [
            {
                name: 'shared-step history',
                endpoint: 'get_shared_step_history/7',
                key: 'step_history',
                rows: [
                    { id: 1, user_id: 3, title: 'First' },
                    { id: 2, user_id: 3, title: 'Second' },
                ],
                get: () => client.sharedSteps.getSharedStepHistory(7),
                page: () => client.sharedSteps.getSharedStepHistoryPage(7),
                all: (options) => client.sharedSteps.getAllSharedStepHistory(7, options),
            },
            {
                name: 'datasets',
                endpoint: 'get_datasets/7',
                key: 'datasets',
                rows: [
                    { id: 1, name: 'Smoke' },
                    { id: 2, name: 'Regression' },
                ],
                get: () => client.datasets.getDatasets(7),
                page: () => client.datasets.getDatasetsPage(7),
                all: (options) => client.datasets.getAllDatasets(7, options),
            },
            {
                name: 'variables',
                endpoint: 'get_variables/7',
                key: 'variables',
                rows: [
                    { id: 1, name: 'browser' },
                    { id: 2, name: 'region' },
                ],
                get: () => client.variables.getVariables(7),
                page: () => client.variables.getVariablesPage(7),
                all: (options) => client.variables.getAllVariables(7, options),
            },
            {
                name: 'roles',
                endpoint: 'get_roles',
                key: 'roles',
                rows: [
                    { id: 1, name: 'Lead', is_default: false },
                    { id: 2, name: 'Tester', is_default: true },
                ],
                get: () => client.metadata.getRoles(),
                page: () => client.metadata.getRolesPage(),
                all: (options) => client.metadata.getAllRoles(options),
            },
            {
                name: 'groups',
                endpoint: 'get_groups',
                key: 'groups',
                rows: [
                    { id: 1, name: 'QA' },
                    { id: 2, name: 'Developers' },
                ],
                get: () => client.users.getGroups(),
                page: () => client.users.getGroupsPage(),
                all: (options) => client.users.getAllGroups(options),
            },
            {
                name: 'case statuses',
                endpoint: 'get_case_statuses',
                key: 'case_statuses',
                rows: [
                    {
                        case_status_id: 1,
                        name: 'Approved',
                        abbreviation: null,
                        is_default: true,
                        is_approved: true,
                    },
                    {
                        case_status_id: 2,
                        name: 'Draft',
                        abbreviation: null,
                        is_default: false,
                        is_approved: false,
                    },
                ],
                get: () => client.metadata.getCaseStatuses(),
                page: () => client.metadata.getCaseStatusesPage(),
                all: (options) => client.metadata.getAllCaseStatuses(options),
            },
        ];
    }

    it.each(['shared-step history', 'datasets', 'variables', 'roles', 'groups', 'case statuses'])(
        '%s separates legacy and strict-page caches for parameter-free reads',
        async (name) => {
            const adapter = envelopeOnlyAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first] = adapter.rows;
            const raw = envelope(adapter.key, [first], 0, 2, null);
            mockFetch.mockResolvedValueOnce(mockOk(raw)).mockResolvedValueOnce(mockOk(raw));

            await expect(adapter.get()).resolves.toEqual([first]);
            await expect(adapter.page()).resolves.toEqual({
                kind: 'envelope',
                items: [first],
                offset: 0,
                limit: 2,
                size: 1,
                _links: { next: null, prev: null },
            });
            await expect(adapter.page()).resolves.toMatchObject({ kind: 'envelope', items: [first] });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(requestedUrl(0)).toContain(adapter.endpoint);
            expect(requestedUrl(0)).not.toContain('&limit=');
            expect(requestedUrl(0)).not.toContain('&offset=');
        },
    );

    it.each(['shared-step history', 'datasets', 'variables', 'roles', 'groups', 'case statuses'])(
        '%s aggregation sends no first-page controls and rebuilds continuation controls',
        async (name) => {
            const adapter = envelopeOnlyAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first, second] = adapter.rows;
            mockFetch
                .mockResolvedValueOnce(
                    mockOk(
                        envelope(
                            adapter.key,
                            [first],
                            0,
                            2,
                            'https://attacker.invalid/not-the-endpoint?offset=2&limit=2',
                        ),
                    ),
                )
                .mockResolvedValueOnce(mockOk(envelope(adapter.key, [second], 2, 2, null)));

            await expect(
                adapter.all({ maxPages: 2, maxItems: 10, maxDurationMs: 10_000, maxBytes: 10_000 }),
            ).resolves.toEqual([first, second]);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(requestedUrl(0)).toContain(adapter.endpoint);
            expect(requestedUrl(0)).not.toContain('&limit=');
            expect(requestedUrl(0)).not.toContain('&offset=');
            expect(requestedUrl(1)).toContain(`${adapter.endpoint}&limit=2&offset=2`);
            expect(requestedUrl(1)).not.toContain('attacker.invalid');
        },
    );

    it.each(['shared-step history', 'datasets', 'variables', 'roles', 'groups', 'case statuses'])(
        '%s treats a legacy array as one terminal response-driven page with default bounds',
        async (name) => {
            const adapter = envelopeOnlyAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first] = adapter.rows;
            mockFetch.mockResolvedValueOnce(mockOk([first]));

            await expect(adapter.all()).resolves.toEqual([first]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(requestedUrl(0)).toContain(adapter.endpoint);
            expect(requestedUrl(0)).not.toContain('&limit=');
            expect(requestedUrl(0)).not.toContain('&offset=');
        },
    );

    it.each(['shared-step history', 'datasets', 'variables', 'roles', 'groups', 'case statuses'])(
        '%s rejects a response-driven aggregate that starts after offset zero',
        async (name) => {
            const adapter = envelopeOnlyAdapters().find((candidate) => candidate.name === name);
            if (adapter === undefined) throw new Error(`Missing adapter for ${name}`);
            const [first] = adapter.rows;
            mockFetch.mockResolvedValueOnce(mockOk(envelope(adapter.key, [first], 5, 2, null)));

            await expect(adapter.all()).rejects.toMatchObject({
                reason: 'invalid_page',
                pagesFetched: 1,
                itemsFetched: 1,
            });

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(requestedUrl(0)).toContain(adapter.endpoint);
            expect(requestedUrl(0)).not.toContain('&limit=');
            expect(requestedUrl(0)).not.toContain('&offset=');
        },
    );
});
