import { describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { RawCliPaginationArgs } from '../src/cli/flags.js';
import type { Handler, HandlerArgs, HandlerContext } from '../src/cli/handler-context.js';
import { parseCliPagination } from '../src/cli/pagination.js';
import { handleCaseStatusList } from '../src/cli/handlers/case-status.js';
import { handleDatasetList } from '../src/cli/handlers/dataset.js';
import { handleGroupList } from '../src/cli/handlers/group.js';
import { handleLabelList } from '../src/cli/handlers/label.js';
import { handleRoleList } from '../src/cli/handlers/role.js';
import { handleSharedStepHistory, handleSharedStepList } from '../src/cli/handlers/shared-step.js';
import { handleVariableList } from '../src/cli/handlers/variable.js';

type MockMethod = ReturnType<typeof vi.fn>;
type Mode = 'items' | 'page' | 'all';
type InvocationFixture = HandlerArgs & RawCliPaginationArgs;

const itemResult = [{ projection: 'items' }];
const pageResult = { kind: 'envelope', items: [{ projection: 'page' }] };
const allResult = [{ projection: 'all' }];

const controlledFlags: InvocationFixture = {
    pathParams: [],
    limit: '11',
    offset: '4',
};

const allFlags: InvocationFixture = {
    pathParams: [],
    all: true,
    pageSize: '20',
    startOffset: '5',
    maxPages: '3',
    maxItems: '40',
    maxDurationMs: '1000',
    maxBytes: '4096',
};

const safetyFlags: InvocationFixture = {
    pathParams: [],
    all: true,
    maxPages: '3',
    maxItems: '40',
    maxDurationMs: '1000',
    maxBytes: '4096',
};

const controlledAllOptions = {
    pageSize: 20,
    startOffset: 5,
    maxPages: 3,
    maxItems: 40,
    maxDurationMs: 1000,
    maxBytes: 4096,
};

const safetyOptions = {
    maxPages: 3,
    maxItems: 40,
    maxDurationMs: 1000,
    maxBytes: 4096,
};

interface MockMethods {
    readonly sharedSteps: readonly [MockMethod, MockMethod, MockMethod];
    readonly sharedStepHistory: readonly [MockMethod, MockMethod, MockMethod];
    readonly labels: readonly [MockMethod, MockMethod, MockMethod];
    readonly datasets: readonly [MockMethod, MockMethod, MockMethod];
    readonly variables: readonly [MockMethod, MockMethod, MockMethod];
    readonly roles: readonly [MockMethod, MockMethod, MockMethod];
    readonly groups: readonly [MockMethod, MockMethod, MockMethod];
    readonly caseStatuses: readonly [MockMethod, MockMethod, MockMethod];
}

interface Harness {
    readonly client: TestRailClient;
    readonly methods: MockMethods;
}

function operationMocks(): readonly [MockMethod, MockMethod, MockMethod] {
    return [
        vi.fn().mockResolvedValue(itemResult),
        vi.fn().mockResolvedValue(pageResult),
        vi.fn().mockResolvedValue(allResult),
    ];
}

function buildHarness(): Harness {
    const methods: MockMethods = {
        sharedSteps: operationMocks(),
        sharedStepHistory: operationMocks(),
        labels: operationMocks(),
        datasets: operationMocks(),
        variables: operationMocks(),
        roles: operationMocks(),
        groups: operationMocks(),
        caseStatuses: operationMocks(),
    };
    const client = {
        sharedSteps: {
            getSharedSteps: methods.sharedSteps[0],
            getSharedStepsPage: methods.sharedSteps[1],
            getAllSharedSteps: methods.sharedSteps[2],
            getSharedStepHistory: methods.sharedStepHistory[0],
            getSharedStepHistoryPage: methods.sharedStepHistory[1],
            getAllSharedStepHistory: methods.sharedStepHistory[2],
        },
        labels: {
            getLabels: methods.labels[0],
            getLabelsPage: methods.labels[1],
            getAllLabels: methods.labels[2],
        },
        datasets: {
            getDatasets: methods.datasets[0],
            getDatasetsPage: methods.datasets[1],
            getAllDatasets: methods.datasets[2],
        },
        variables: {
            getVariables: methods.variables[0],
            getVariablesPage: methods.variables[1],
            getAllVariables: methods.variables[2],
        },
        metadata: {
            getRoles: methods.roles[0],
            getRolesPage: methods.roles[1],
            getAllRoles: methods.roles[2],
            getCaseStatuses: methods.caseStatuses[0],
            getCaseStatusesPage: methods.caseStatuses[1],
            getAllCaseStatuses: methods.caseStatuses[2],
        },
        users: {
            getGroups: methods.groups[0],
            getGroupsPage: methods.groups[1],
            getAllGroups: methods.groups[2],
        },
    } as unknown as TestRailClient;
    return { client, methods };
}

interface HandlerAdapter {
    readonly name: string;
    readonly handler: Handler;
    readonly methods: readonly [MockMethod, MockMethod, MockMethod];
    readonly args: Readonly<Record<Mode, InvocationFixture>>;
    readonly expectedArgs: Readonly<Record<Mode, readonly unknown[]>>;
}

function splitFixture(fixture: InvocationFixture): {
    readonly args: HandlerArgs;
    readonly paginationArgs: RawCliPaginationArgs;
} {
    const { page, all, limit, offset, pageSize, startOffset, maxPages, maxItems, maxDurationMs, maxBytes, ...args } =
        fixture;
    return {
        args,
        paginationArgs: {
            page,
            all,
            limit,
            offset,
            pageSize,
            startOffset,
            maxPages,
            maxItems,
            maxDurationMs,
            maxBytes,
        },
    };
}

function adapters(harness: Harness): readonly HandlerAdapter[] {
    const controlledPageArgs = { ...controlledFlags, page: true };
    return [
        {
            name: 'shared steps',
            handler: handleSharedStepList,
            methods: harness.methods.sharedSteps,
            args: {
                items: { ...controlledFlags, projectId: '7' },
                page: { ...controlledPageArgs, projectId: '7' },
                all: { ...allFlags, projectId: '7' },
            },
            expectedArgs: {
                items: [7, { limit: 11, offset: 4 }],
                page: [7, { limit: 11, offset: 4 }],
                all: [7, controlledAllOptions],
            },
        },
        {
            name: 'shared-step history',
            handler: handleSharedStepHistory,
            methods: harness.methods.sharedStepHistory,
            args: {
                items: { ...controlledFlags, pathParams: ['7'] },
                page: { pathParams: ['7'], page: true },
                all: { ...safetyFlags, pathParams: ['7'] },
            },
            expectedArgs: {
                items: [7, { limit: 11, offset: 4 }],
                page: [7],
                all: [7, safetyOptions],
            },
        },
        {
            name: 'labels',
            handler: handleLabelList,
            methods: harness.methods.labels,
            args: {
                items: { ...controlledFlags, pathParams: ['7'] },
                page: { ...controlledPageArgs, pathParams: ['7'] },
                all: { ...allFlags, pathParams: ['7'] },
            },
            expectedArgs: {
                items: [7, { limit: 11, offset: 4 }],
                page: [7, { limit: 11, offset: 4 }],
                all: [7, controlledAllOptions],
            },
        },
        {
            name: 'datasets',
            handler: handleDatasetList,
            methods: harness.methods.datasets,
            args: {
                items: { pathParams: ['7'] },
                page: { pathParams: ['7'], page: true },
                all: { ...safetyFlags, pathParams: ['7'] },
            },
            expectedArgs: { items: [7], page: [7], all: [7, safetyOptions] },
        },
        {
            name: 'variables',
            handler: handleVariableList,
            methods: harness.methods.variables,
            args: {
                items: { pathParams: ['7'] },
                page: { pathParams: ['7'], page: true },
                all: { ...safetyFlags, pathParams: ['7'] },
            },
            expectedArgs: { items: [7], page: [7], all: [7, safetyOptions] },
        },
        {
            name: 'roles',
            handler: handleRoleList,
            methods: harness.methods.roles,
            args: {
                items: { pathParams: [] },
                page: { pathParams: [], page: true },
                all: safetyFlags,
            },
            expectedArgs: { items: [], page: [], all: [safetyOptions] },
        },
        {
            name: 'groups',
            handler: handleGroupList,
            methods: harness.methods.groups,
            args: {
                items: { pathParams: [] },
                page: { pathParams: [], page: true },
                all: safetyFlags,
            },
            expectedArgs: { items: [], page: [], all: [safetyOptions] },
        },
        {
            name: 'case statuses',
            handler: handleCaseStatusList,
            methods: harness.methods.caseStatuses,
            args: {
                items: { pathParams: [] },
                page: { pathParams: [], page: true },
                all: safetyFlags,
            },
            expectedArgs: { items: [], page: [], all: [safetyOptions] },
        },
    ];
}

const adapterNames = [
    'shared steps',
    'shared-step history',
    'labels',
    'datasets',
    'variables',
    'roles',
    'groups',
    'case statuses',
] as const;

const modes = ['items', 'page', 'all'] as const;
const cases = adapterNames.flatMap((name) => modes.map((mode) => [name, mode] as const));

describe('secondary pagination CLI handlers', () => {
    it.each(cases)('%s forwards %s mode to exactly one client projection', async (name, mode) => {
        const harness = buildHarness();
        const adapter = adapters(harness).find((candidate) => candidate.name === name);
        if (adapter === undefined) throw new Error(`Missing handler adapter for ${name}`);
        const out = vi.fn();
        const invocation = splitFixture(adapter.args[mode]);
        const ctx: HandlerContext = {
            client: harness.client,
            actionSpec: { resource: 'test', action: 'list' },
            args: invocation.args,
            pagination: parseCliPagination(invocation.paginationArgs),
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        };

        await adapter.handler(ctx);

        const selected = mode === 'items' ? 0 : mode === 'page' ? 1 : 2;
        expect(adapter.methods[selected]).toHaveBeenCalledTimes(1);
        expect(adapter.methods[selected]).toHaveBeenCalledWith(...adapter.expectedArgs[mode]);
        adapter.methods.forEach((method, index) => {
            if (index !== selected) expect(method).not.toHaveBeenCalled();
        });
        expect(out).toHaveBeenCalledWith(mode === 'items' ? itemResult : mode === 'page' ? pageResult : allResult);
    });

    it('shared-step list forwards every documented filter through --all', async () => {
        const harness = buildHarness();
        const invocation = splitFixture({
            ...allFlags,
            projectId: '7',
            createdAfter: '100',
            createdBefore: '200',
            createdBy: '2,3',
            updatedAfter: '300',
            updatedBefore: '400',
            refs: 'TR-42',
        });
        const ctx: HandlerContext = {
            client: harness.client,
            actionSpec: { resource: 'shared-step', action: 'list' },
            args: invocation.args,
            pagination: parseCliPagination(invocation.paginationArgs),
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out: vi.fn(),
        };

        await handleSharedStepList(ctx);

        expect(harness.methods.sharedSteps[2]).toHaveBeenCalledWith(7, {
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [2, 3],
            updatedAfter: 300,
            updatedBefore: 400,
            refs: 'TR-42',
            ...controlledAllOptions,
        });
    });
});
