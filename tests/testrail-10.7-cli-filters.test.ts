import { describe, expect, it, vi } from 'vitest';
import type { TestRailClient } from '../src/client.js';
import type { HandlerArgs, HandlerContext } from '../src/cli/handler-context.js';
import { handleBddList } from '../src/cli/handlers/bdd.js';
import { handleCaseList, handleCaseTitles } from '../src/cli/handlers/case.js';
import { handlePlanList } from '../src/cli/handlers/plan.js';
import { handleRunList } from '../src/cli/handlers/run.js';
import { handleTestList } from '../src/cli/handlers/test.js';

function context(client: object, args: Partial<HandlerArgs>): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    return {
        ctx: {
            client: client as TestRailClient,
            args: { pathParams: [], ...args },
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        },
        out,
    };
}

describe('TestRail 10.7 CLI filters', () => {
    it('forwards the complete case filter set and repeated-reference selection', async () => {
        const getCases = vi.fn().mockResolvedValue([]);
        const { ctx } = context(
            { cases: { getCases } },
            {
                projectId: '7',
                suiteId: '8',
                sectionId: '9',
                typeId: '1,2',
                priorityId: '3,4',
                templateId: '5',
                milestoneId: '6,7',
                createdAfter: '1700000000',
                createdBefore: '1700000100',
                createdBy: '11,12',
                filter: 'login flow',
                updatedAfter: '1700000200',
                updatedBefore: '1700000300',
                updatedBy: '13',
                labelId: '14,15',
                refs: 'REQ-1,REQ-2',
                limit: '25',
                offset: '5',
            },
        );

        await handleCaseList(ctx);

        expect(getCases).toHaveBeenCalledWith(7, {
            suiteId: 8,
            sectionId: 9,
            typeId: [1, 2],
            priorityId: [3, 4],
            templateId: [5],
            milestoneId: [6, 7],
            createdAfter: 1_700_000_000,
            createdBefore: 1_700_000_100,
            createdBy: [11, 12],
            filter: 'login flow',
            updatedAfter: 1_700_000_200,
            updatedBefore: 1_700_000_300,
            updatedBy: [13],
            labelId: [14, 15],
            refs: ['REQ-1', 'REQ-2'],
            limit: 25,
            offset: 5,
        });
    });

    it('preserves BDD filters across --all pagination options', async () => {
        const getAllBdds = vi.fn().mockResolvedValue([]);
        const { ctx } = context(
            { bdd: { getAllBdds } },
            {
                projectId: '7',
                suiteId: '8',
                sectionId: '9',
                labelId: '10,11',
                refs: 'BDD-1,BDD-2',
                all: true,
                pageSize: '20',
                maxPages: '3',
            },
        );

        await handleBddList(ctx);

        expect(getAllBdds).toHaveBeenCalledWith(7, {
            suiteId: 8,
            sectionId: 9,
            labelId: [10, 11],
            refs: ['BDD-1', 'BDD-2'],
            pageSize: 20,
            maxPages: 3,
        });
    });

    it('forwards current run and plan list filters', async () => {
        const getRuns = vi.fn().mockResolvedValue([]);
        const run = context(
            { runs: { getRuns } },
            {
                projectId: '7',
                createdAfter: '100',
                createdBefore: '200',
                createdBy: '1,2',
                includePlanRuns: true,
                isCompleted: 'false',
                milestoneId: '3,4',
                refs: 'REQ-7',
                suiteId: '5,6',
            },
        );
        await handleRunList(run.ctx);
        expect(getRuns).toHaveBeenCalledWith(7, {
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [1, 2],
            includePlanRuns: true,
            isCompleted: false,
            milestoneId: [3, 4],
            refs: 'REQ-7',
            suiteId: [5, 6],
        });

        const getPlans = vi.fn().mockResolvedValue([]);
        const plan = context(
            { plans: { getPlans } },
            {
                projectId: '7',
                createdAfter: '100',
                createdBefore: '200',
                createdBy: '1,2',
                isCompleted: '1',
                milestoneId: '3,4',
                refs: 'PLAN-7',
            },
        );
        await handlePlanList(plan.ctx);
        expect(getPlans).toHaveBeenCalledWith(7, {
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [1, 2],
            isCompleted: true,
            milestoneId: [3, 4],
            refs: 'PLAN-7',
        });
    });

    it('routes comma-separated case IDs to getCaseTitles', async () => {
        const titles = [{ id: 1, title: 'One' }];
        const getCaseTitles = vi.fn().mockResolvedValue(titles);
        const { ctx, out } = context({ cases: { getCaseTitles } }, { pathParams: ['1,2'] });

        await handleCaseTitles(ctx);

        expect(getCaseTitles).toHaveBeenCalledWith([1, 2]);
        expect(out).toHaveBeenCalledWith(titles);

        const missing = context({ cases: { getCaseTitles } }, { pathParams: [] });
        await expect(handleCaseTitles(missing.ctx)).rejects.toThrow(/case_ids/);
    });

    it('rejects malformed refs, ID lists, and boolean filters before a client call', async () => {
        const getCases = vi.fn();
        const badRefs = context({ cases: { getCases } }, { projectId: '7', refs: 'REQ-1,' });
        await expect(handleCaseList(badRefs.ctx)).rejects.toThrow(/--refs/);

        const getRuns = vi.fn();
        const badBoolean = context({ runs: { getRuns } }, { projectId: '7', isCompleted: 'yes' });
        await expect(handleRunList(badBoolean.ctx)).rejects.toThrow(/--is-completed/);

        const emptyBoolean = context({ runs: { getRuns } }, { projectId: '7', isCompleted: '' });
        await expect(handleRunList(emptyBoolean.ctx)).rejects.toThrow(/\(empty\)/);

        const emptyRunRefs = context({ runs: { getRuns } }, { projectId: '7', refs: '' });
        await expect(handleRunList(emptyRunRefs.ctx)).rejects.toThrow(/non-empty references/);

        const getPlans = vi.fn();
        const badIds = context({ plans: { getPlans } }, { projectId: '7', createdBy: '1,0' });
        await expect(handlePlanList(badIds.ctx)).rejects.toThrow(/--created-by/);

        const listPlanRefs = context({ plans: { getPlans } }, { projectId: '7', refs: 'PLAN-1,PLAN-2' });
        await expect(handlePlanList(listPlanRefs.ctx)).rejects.toThrow(/exactly one reference/);

        expect(getCases).not.toHaveBeenCalled();
        expect(getRuns).not.toHaveBeenCalled();
        expect(getPlans).not.toHaveBeenCalled();
    });

    it('preserves a single CLI reference as the legacy scalar form', async () => {
        const getCases = vi.fn().mockResolvedValue([]);
        const { ctx } = context({ cases: { getCases } }, { projectId: '7', refs: 'REQ-1' });

        await handleCaseList(ctx);

        expect(getCases).toHaveBeenCalledWith(7, { refs: 'REQ-1' });
    });

    it('forwards label IDs when listing tests', async () => {
        const getTests = vi.fn().mockResolvedValue([]);
        const { ctx } = context({ tests: { getTests } }, { pathParams: ['42'], labelId: '2,3' });

        await handleTestList(ctx);

        expect(getTests).toHaveBeenCalledWith(42, { label_id: [2, 3] });
    });
});
