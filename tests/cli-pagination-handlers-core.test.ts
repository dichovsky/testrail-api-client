import { describe, expect, it, vi } from 'vitest';
import {
    handleAttachmentListForCase,
    handleAttachmentListForPlan,
    handleAttachmentListForRun,
} from '../src/cli/handlers/attachment.js';
import { handleCaseHistory, handleCaseList } from '../src/cli/handlers/case.js';
import { handleResultList, handleResultListForCase, handleResultListForTest } from '../src/cli/handlers/result.js';
import { handleTestList } from '../src/cli/handlers/test.js';
import type { RawCliPaginationArgs } from '../src/cli/flags.js';
import type { HandlerArgs, HandlerContext } from '../src/cli/handler-context.js';
import { parseCliPagination } from '../src/cli/pagination.js';

type InvocationFixture = Partial<HandlerArgs> & RawCliPaginationArgs;

function context(client: object, fixture: InvocationFixture): { ctx: HandlerContext; out: ReturnType<typeof vi.fn> } {
    const out = vi.fn();
    const {
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
        pathParams = [],
        ...args
    } = fixture;
    const paginationArgs: RawCliPaginationArgs = {
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
    };
    return {
        ctx: {
            client,
            args: { pathParams, ...args },
            pagination: parseCliPagination(paginationArgs),
            bodyInput: {},
            dryRun: false,
            force: false,
            confirmDestructive: false,
            out,
        } as unknown as HandlerContext,
        out,
    };
}

describe('core paginated CLI handlers', () => {
    it('routes case --page to the metadata-preserving method', async () => {
        const page = { kind: 'envelope', items: [], offset: 4, limit: 10, size: 0, _links: { next: null, prev: null } };
        const getCasesPage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { cases: { getCasesPage } },
            {
                projectId: '2',
                suiteId: '3',
                page: true,
                limit: '10',
                offset: '4',
            },
        );

        await handleCaseList(ctx);

        expect(getCasesPage).toHaveBeenCalledWith(2, { suiteId: 3, limit: 10, offset: 4 });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('routes case --all without forwarding one-page controls', async () => {
        const cases = [{ id: 1 }];
        const getAllCases = vi.fn().mockResolvedValue(cases);
        const { ctx, out } = context(
            { cases: { getAllCases } },
            {
                projectId: '2',
                suiteId: '3',
                all: true,
                pageSize: '25',
                startOffset: '5',
                maxDurationMs: '1000',
                maxBytes: '4096',
            },
        );

        await handleCaseList(ctx);

        expect(getAllCases).toHaveBeenCalledWith(2, {
            suiteId: 3,
            pageSize: 25,
            startOffset: 5,
            maxDurationMs: 1000,
            maxBytes: 4096,
        });
        expect(out).toHaveBeenCalledWith(cases);
    });

    it('routes case history --all with aggregate controls', async () => {
        const getAllHistoryForCase = vi.fn().mockResolvedValue([{ id: 1 }]);
        const { ctx, out } = context(
            { cases: { getAllHistoryForCase } },
            {
                pathParams: ['9'],
                all: true,
                pageSize: '20',
                startOffset: '5',
                maxPages: '3',
                maxItems: '50',
            },
        );

        await handleCaseHistory(ctx);

        expect(getAllHistoryForCase).toHaveBeenCalledWith(9, {
            pageSize: 20,
            startOffset: 5,
            maxPages: 3,
            maxItems: 50,
        });
        expect(out).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('routes case history --page with the legacy request controls', async () => {
        const page = { kind: 'envelope', items: [], offset: 8, limit: 4, size: 0, _links: { next: null, prev: null } };
        const getHistoryForCasePage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { cases: { getHistoryForCasePage } },
            {
                pathParams: ['9'],
                page: true,
                limit: '4',
                offset: '8',
            },
        );

        await handleCaseHistory(ctx);

        expect(getHistoryForCasePage).toHaveBeenCalledWith(9, { limit: 4, offset: 8 });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('preserves the legacy case-history projection when no mode is selected', async () => {
        const history = [{ id: 3 }];
        const getHistoryForCase = vi.fn().mockResolvedValue(history);
        const { ctx, out } = context({ cases: { getHistoryForCase } }, { pathParams: ['9'], limit: '2', offset: '6' });

        await handleCaseHistory(ctx);

        expect(getHistoryForCase).toHaveBeenCalledWith(9, { limit: 2, offset: 6 });
        expect(out).toHaveBeenCalledWith(history);
    });

    it('retains test filters in --all mode', async () => {
        const getAllTests = vi.fn().mockResolvedValue([]);
        const { ctx } = context(
            { tests: { getAllTests } },
            {
                pathParams: ['7'],
                all: true,
                statusId: '1,5',
                pageSize: '25',
            },
        );

        await handleTestList(ctx);

        expect(getAllTests).toHaveBeenCalledWith(7, { status_id: [1, 5], pageSize: 25 });
    });

    it('routes test --page while retaining status and one-page controls', async () => {
        const page = { kind: 'envelope', items: [], offset: 6, limit: 3, size: 0, _links: { next: null, prev: null } };
        const getTestsPage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { tests: { getTestsPage } },
            {
                pathParams: ['7'],
                page: true,
                statusId: '1,5',
                limit: '3',
                offset: '6',
            },
        );

        await handleTestList(ctx);

        expect(getTestsPage).toHaveBeenCalledWith(7, { status_id: [1, 5], limit: 3, offset: 6 });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('routes result-for-run --page to the metadata-preserving method', async () => {
        const page = { kind: 'envelope', items: [], offset: 2, limit: 2, size: 0, _links: { next: null, prev: null } };
        const getResultsForRunPage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { results: { getResultsForRunPage } },
            {
                runId: '12',
                page: true,
                createdAfter: '100',
                createdBefore: '200',
                createdBy: '7,8',
                statusId: '1,5',
                defectsFilter: 'BUG-7',
                limit: '2',
                offset: '2',
            },
        );

        await handleResultList(ctx);

        expect(getResultsForRunPage).toHaveBeenCalledWith(12, {
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [7, 8],
            statusId: [1, 5],
            defectsFilter: 'BUG-7',
            limit: 2,
            offset: 2,
        });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('preserves the legacy result-for-run item projection when no mode is selected', async () => {
        const results = [{ id: 3 }];
        const getResultsForRun = vi.fn().mockResolvedValue(results);
        const { ctx, out } = context({ results: { getResultsForRun } }, { runId: '12', limit: '2', offset: '4' });

        await handleResultList(ctx);

        expect(getResultsForRun).toHaveBeenCalledWith(12, { limit: 2, offset: 4 });
        expect(out).toHaveBeenCalledWith(results);
    });

    it.each([
        [{ createdAfter: 'not-a-timestamp' }, /--created-after/],
        [{ createdBy: '7,bad' }, /--created-by/],
        [{ statusId: '1,bad' }, /--status-id/],
    ])('rejects malformed result-for-run filters before a client call', async (args, expected) => {
        const getResultsForRun = vi.fn();
        const { ctx } = context({ results: { getResultsForRun } }, { runId: '12', ...args });

        await expect(handleResultList(ctx)).rejects.toThrow(expected);
        expect(getResultsForRun).not.toHaveBeenCalled();
    });

    it('routes result-for-run --all with every aggregate safety control', async () => {
        const results = [{ id: 4 }];
        const getAllResultsForRun = vi.fn().mockResolvedValue(results);
        const { ctx, out } = context(
            { results: { getAllResultsForRun } },
            {
                runId: '12',
                all: true,
                pageSize: '10',
                startOffset: '20',
                maxPages: '3',
                maxItems: '27',
                maxDurationMs: '1500',
                maxBytes: '8192',
                createdAfter: '100',
                createdBefore: '200',
                createdBy: '7,8',
                statusId: '1,5',
                defectsFilter: 'BUG-7',
            },
        );

        await handleResultList(ctx);

        expect(getAllResultsForRun).toHaveBeenCalledWith(12, {
            pageSize: 10,
            startOffset: 20,
            maxPages: 3,
            maxItems: 27,
            maxDurationMs: 1500,
            maxBytes: 8192,
            createdAfter: 100,
            createdBefore: 200,
            createdBy: [7, 8],
            statusId: [1, 5],
            defectsFilter: 'BUG-7',
        });
        expect(out).toHaveBeenCalledWith(results);
    });

    it('routes result-for-test --page with its filters', async () => {
        const page = { kind: 'legacy-array', items: [], size: 0 };
        const getResultsPage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { results: { getResultsPage } },
            {
                pathParams: ['11'],
                page: true,
                statusId: '5',
                defectsFilter: 'BUG-7',
                limit: '10',
            },
        );

        await handleResultListForTest(ctx);

        expect(getResultsPage).toHaveBeenCalledWith(11, {
            status_id: [5],
            defects_filter: 'BUG-7',
            limit: 10,
        });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('retains result-for-test filters but drops one-page controls in --all mode', async () => {
        const results = [{ id: 5 }];
        const getAllResults = vi.fn().mockResolvedValue(results);
        const { ctx, out } = context(
            { results: { getAllResults } },
            {
                pathParams: ['11'],
                all: true,
                statusId: '1,5',
                defectsFilter: 'BUG-7',
                pageSize: '10',
                startOffset: '30',
            },
        );

        await handleResultListForTest(ctx);

        expect(getAllResults).toHaveBeenCalledWith(11, {
            status_id: [1, 5],
            defects_filter: 'BUG-7',
            pageSize: 10,
            startOffset: 30,
        });
        expect(out).toHaveBeenCalledWith(results);
    });

    it('retains result-for-case filters in --all mode without legacy controls', async () => {
        const getAllResultsForCase = vi.fn().mockResolvedValue([]);
        const { ctx } = context(
            { results: { getAllResultsForCase } },
            {
                pathParams: ['2', '3'],
                all: true,
                statusId: '1',
                defectsFilter: 'BUG-9',
                pageSize: '2',
            },
        );

        await handleResultListForCase(ctx);

        expect(getAllResultsForCase).toHaveBeenCalledWith(2, 3, {
            status_id: [1],
            defects_filter: 'BUG-9',
            pageSize: 2,
        });
    });

    it('routes result-for-case --page with filters and one-page controls', async () => {
        const page = { kind: 'legacy-array', items: [], size: 0 };
        const getResultsForCasePage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { results: { getResultsForCasePage } },
            {
                pathParams: ['2', '3'],
                page: true,
                statusId: '5',
                defectsFilter: 'BUG-9',
                limit: '7',
                offset: '14',
            },
        );

        await handleResultListForCase(ctx);

        expect(getResultsForCasePage).toHaveBeenCalledWith(2, 3, {
            status_id: [5],
            defects_filter: 'BUG-9',
            limit: 7,
            offset: 14,
        });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('routes case attachments through both pagination projections', async () => {
        const page = { kind: 'envelope', items: [], offset: 4, limit: 2, size: 0, _links: { next: null, prev: null } };
        const getAttachmentsForCasePage = vi.fn().mockResolvedValue(page);
        const pageContext = context(
            { attachments: { getAttachmentsForCasePage } },
            { pathParams: ['21'], page: true, limit: '2', offset: '4' },
        );

        await handleAttachmentListForCase(pageContext.ctx);

        expect(getAttachmentsForCasePage).toHaveBeenCalledWith(21, { limit: 2, offset: 4 });
        expect(pageContext.out).toHaveBeenCalledWith(page);

        const attachments = [{ id: 8 }];
        const getAllAttachmentsForCase = vi.fn().mockResolvedValue(attachments);
        const allContext = context(
            { attachments: { getAllAttachmentsForCase } },
            { pathParams: ['21'], all: true, pageSize: '5', maxPages: '3' },
        );

        await handleAttachmentListForCase(allContext.ctx);

        expect(getAllAttachmentsForCase).toHaveBeenCalledWith(21, { pageSize: 5, maxPages: 3 });
        expect(allContext.out).toHaveBeenCalledWith(attachments);
    });

    it('routes run attachments through both pagination projections', async () => {
        const page = { kind: 'legacy-array', items: [], size: 0 };
        const getAttachmentsForRunPage = vi.fn().mockResolvedValue(page);
        const pageContext = context(
            { attachments: { getAttachmentsForRunPage } },
            { pathParams: ['22'], page: true, limit: '3', offset: '6' },
        );

        await handleAttachmentListForRun(pageContext.ctx);

        expect(getAttachmentsForRunPage).toHaveBeenCalledWith(22, { limit: 3, offset: 6 });
        expect(pageContext.out).toHaveBeenCalledWith(page);

        const attachments = [{ id: 9 }];
        const getAllAttachmentsForRun = vi.fn().mockResolvedValue(attachments);
        const allContext = context(
            { attachments: { getAllAttachmentsForRun } },
            { pathParams: ['22'], all: true, startOffset: '7', maxItems: '12' },
        );

        await handleAttachmentListForRun(allContext.ctx);

        expect(getAllAttachmentsForRun).toHaveBeenCalledWith(22, { startOffset: 7, maxItems: 12 });
        expect(allContext.out).toHaveBeenCalledWith(attachments);
    });

    it('routes plan attachments --all to the newly paginated plan endpoint', async () => {
        const getAllAttachmentsForPlan = vi.fn().mockResolvedValue([{ id: 1 }]);
        const { ctx, out } = context(
            { attachments: { getAllAttachmentsForPlan } },
            {
                pathParams: ['8'],
                all: true,
                pageSize: '5',
                maxBytes: '4096',
            },
        );

        await handleAttachmentListForPlan(ctx);

        expect(getAllAttachmentsForPlan).toHaveBeenCalledWith(8, { pageSize: 5, maxBytes: 4096 });
        expect(out).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('routes plan attachments --page with documented request controls', async () => {
        const page = { kind: 'envelope', items: [], offset: 10, limit: 5, size: 0, _links: { next: null, prev: null } };
        const getAttachmentsForPlanPage = vi.fn().mockResolvedValue(page);
        const { ctx, out } = context(
            { attachments: { getAttachmentsForPlanPage } },
            { pathParams: ['8'], page: true, limit: '5', offset: '10' },
        );

        await handleAttachmentListForPlan(ctx);

        expect(getAttachmentsForPlanPage).toHaveBeenCalledWith(8, { limit: 5, offset: 10 });
        expect(out).toHaveBeenCalledWith(page);
    });

    it('preserves plan attachment request controls in legacy item mode', async () => {
        const attachments = [{ id: 10 }];
        const getAttachmentsForPlan = vi.fn().mockResolvedValue(attachments);
        const { ctx, out } = context(
            { attachments: { getAttachmentsForPlan } },
            { pathParams: ['8'], limit: '5', offset: '10' },
        );

        await handleAttachmentListForPlan(ctx);

        expect(getAttachmentsForPlan).toHaveBeenCalledWith(8, { limit: 5, offset: 10 });
        expect(out).toHaveBeenCalledWith(attachments);
    });
});
