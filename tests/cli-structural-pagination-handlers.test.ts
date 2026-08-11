import { describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { Handler, HandlerArgs, HandlerContext } from '../src/cli/handler-context.js';
import { handleMilestoneList } from '../src/cli/handlers/milestone.js';
import { handlePlanList } from '../src/cli/handlers/plan.js';
import { handleProjectList } from '../src/cli/handlers/project.js';
import { handleRunList } from '../src/cli/handlers/run.js';
import { handleSectionList } from '../src/cli/handlers/section.js';
import { handleSuiteList } from '../src/cli/handlers/suite.js';

type MockFunction = ReturnType<typeof vi.fn>;

interface MockOperations {
    readonly items: MockFunction;
    readonly page: MockFunction;
    readonly all: MockFunction;
}

interface MockClient {
    readonly runs: {
        readonly getRuns: MockFunction;
        readonly getRunsPage: MockFunction;
        readonly getAllRuns: MockFunction;
    };
    readonly plans: {
        readonly getPlans: MockFunction;
        readonly getPlansPage: MockFunction;
        readonly getAllPlans: MockFunction;
    };
    readonly projects: {
        readonly getProjects: MockFunction;
        readonly getProjectsPage: MockFunction;
        readonly getAllProjects: MockFunction;
    };
    readonly sections: {
        readonly getSections: MockFunction;
        readonly getSectionsPage: MockFunction;
        readonly getAllSections: MockFunction;
    };
    readonly milestones: {
        readonly getMilestones: MockFunction;
        readonly getMilestonesPage: MockFunction;
        readonly getAllMilestones: MockFunction;
    };
    readonly suites: {
        readonly getSuites: MockFunction;
        readonly getSuitesPage: MockFunction;
        readonly getAllSuites: MockFunction;
    };
}

function operations(name: string): MockOperations {
    return {
        items: vi.fn().mockResolvedValue([`${name}-items`]),
        page: vi.fn().mockResolvedValue({ kind: 'envelope', marker: `${name}-page` }),
        all: vi.fn().mockResolvedValue([`${name}-all`]),
    };
}

function buildClient(): MockClient {
    const runs = operations('runs');
    const plans = operations('plans');
    const projects = operations('projects');
    const sections = operations('sections');
    const milestones = operations('milestones');
    const suites = operations('suites');
    return {
        runs: { getRuns: runs.items, getRunsPage: runs.page, getAllRuns: runs.all },
        plans: { getPlans: plans.items, getPlansPage: plans.page, getAllPlans: plans.all },
        projects: { getProjects: projects.items, getProjectsPage: projects.page, getAllProjects: projects.all },
        sections: {
            getSections: sections.items,
            getSectionsPage: sections.page,
            getAllSections: sections.all,
        },
        milestones: {
            getMilestones: milestones.items,
            getMilestonesPage: milestones.page,
            getAllMilestones: milestones.all,
        },
        suites: { getSuites: suites.items, getSuitesPage: suites.page, getAllSuites: suites.all },
    };
}

function buildContext(client: MockClient, args: HandlerArgs): { ctx: HandlerContext; out: MockFunction } {
    const out = vi.fn();
    return {
        ctx: {
            client: client as unknown as TestRailClient,
            args,
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        },
        out,
    };
}

const aggregateFlags = {
    pageSize: '25',
    startOffset: '5',
    maxPages: '3',
    maxItems: '60',
    maxDurationMs: '1000',
    maxBytes: '4096',
} as const;

const aggregateOptions = {
    pageSize: 25,
    startOffset: 5,
    maxPages: 3,
    maxItems: 60,
    maxDurationMs: 1000,
    maxBytes: 4096,
};

interface HandlerCase {
    readonly name: string;
    readonly handler: Handler;
    readonly legacyArgs: HandlerArgs;
    readonly allArgs: HandlerArgs;
    readonly expectedItemsArgs: readonly unknown[];
    readonly expectedPageArgs: readonly unknown[];
    readonly expectedAllArgs: readonly unknown[];
    readonly getOperations: (client: MockClient) => MockOperations;
}

const handlers: readonly HandlerCase[] = [
    {
        name: 'run list',
        handler: handleRunList,
        legacyArgs: { pathParams: [], projectId: '7', limit: '10', offset: '20' },
        allArgs: { pathParams: [], projectId: '7', all: true, ...aggregateFlags },
        expectedItemsArgs: [7, { limit: 10, offset: 20 }],
        expectedPageArgs: [7, { limit: 10, offset: 20 }],
        expectedAllArgs: [7, aggregateOptions],
        getOperations: (client) => ({
            items: client.runs.getRuns,
            page: client.runs.getRunsPage,
            all: client.runs.getAllRuns,
        }),
    },
    {
        name: 'plan list',
        handler: handlePlanList,
        legacyArgs: { pathParams: [], projectId: '7', limit: '10', offset: '20' },
        allArgs: { pathParams: [], projectId: '7', all: true, ...aggregateFlags },
        expectedItemsArgs: [7, { limit: 10, offset: 20 }],
        expectedPageArgs: [7, { limit: 10, offset: 20 }],
        expectedAllArgs: [7, aggregateOptions],
        getOperations: (client) => ({
            items: client.plans.getPlans,
            page: client.plans.getPlansPage,
            all: client.plans.getAllPlans,
        }),
    },
    {
        name: 'project list',
        handler: handleProjectList,
        legacyArgs: { pathParams: [], limit: '10', offset: '20' },
        allArgs: { pathParams: [], all: true, ...aggregateFlags },
        expectedItemsArgs: [10, 20],
        expectedPageArgs: [{ limit: 10, offset: 20 }],
        expectedAllArgs: [aggregateOptions],
        getOperations: (client) => ({
            items: client.projects.getProjects,
            page: client.projects.getProjectsPage,
            all: client.projects.getAllProjects,
        }),
    },
    {
        name: 'section list',
        handler: handleSectionList,
        legacyArgs: { pathParams: ['7'], suiteId: '9', limit: '10', offset: '20' },
        allArgs: { pathParams: ['7'], suiteId: '9', all: true, ...aggregateFlags },
        expectedItemsArgs: [7, { suiteId: 9, limit: 10, offset: 20 }],
        expectedPageArgs: [7, { suiteId: 9, limit: 10, offset: 20 }],
        expectedAllArgs: [7, { suiteId: 9, ...aggregateOptions }],
        getOperations: (client) => ({
            items: client.sections.getSections,
            page: client.sections.getSectionsPage,
            all: client.sections.getAllSections,
        }),
    },
    {
        name: 'milestone list',
        handler: handleMilestoneList,
        legacyArgs: { pathParams: [], projectId: '7', limit: '10', offset: '20' },
        allArgs: { pathParams: [], projectId: '7', all: true, ...aggregateFlags },
        expectedItemsArgs: [7, { limit: 10, offset: 20 }],
        expectedPageArgs: [7, { limit: 10, offset: 20 }],
        expectedAllArgs: [7, aggregateOptions],
        getOperations: (client) => ({
            items: client.milestones.getMilestones,
            page: client.milestones.getMilestonesPage,
            all: client.milestones.getAllMilestones,
        }),
    },
    {
        name: 'suite list',
        handler: handleSuiteList,
        legacyArgs: { pathParams: [], projectId: '7', limit: '10', offset: '20' },
        allArgs: { pathParams: [], projectId: '7', all: true, ...aggregateFlags },
        expectedItemsArgs: [7, { limit: 10, offset: 20 }],
        expectedPageArgs: [7, { limit: 10, offset: 20 }],
        expectedAllArgs: [7, aggregateOptions],
        getOperations: (client) => ({
            items: client.suites.getSuites,
            page: client.suites.getSuitesPage,
            all: client.suites.getAllSuites,
        }),
    },
];

describe.each(handlers)('$name pagination modes', (entry) => {
    it('keeps the default item-array call and legacy controls', async () => {
        const client = buildClient();
        const operations = entry.getOperations(client);
        const { ctx, out } = buildContext(client, entry.legacyArgs);

        await entry.handler(ctx);

        expect(operations.items.mock.calls).toEqual([entry.expectedItemsArgs]);
        expect(operations.page).not.toHaveBeenCalled();
        expect(operations.all).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith([`${entry.name.split(' ')[0]}s-items`]);
    });

    it('uses the page projection with existing limit and offset controls', async () => {
        const client = buildClient();
        const operations = entry.getOperations(client);
        const { ctx, out } = buildContext(client, { ...entry.legacyArgs, page: true });

        await entry.handler(ctx);

        expect(operations.items).not.toHaveBeenCalled();
        expect(operations.page.mock.calls).toEqual([entry.expectedPageArgs]);
        expect(operations.all).not.toHaveBeenCalled();
        expect(out).toHaveBeenCalledWith(expect.objectContaining({ kind: 'envelope' }));
    });

    it('uses the aggregate projection with parsed bounds and retained filters', async () => {
        const client = buildClient();
        const operations = entry.getOperations(client);
        const { ctx, out } = buildContext(client, entry.allArgs);

        await entry.handler(ctx);

        expect(operations.items).not.toHaveBeenCalled();
        expect(operations.page).not.toHaveBeenCalled();
        expect(operations.all.mock.calls).toEqual([entry.expectedAllArgs]);
        expect(out).toHaveBeenCalledWith([`${entry.name.split(' ')[0]}s-all`]);
    });
});
