import type { HandlerContext } from '../handler-context.js';
import type { GetResultsOptions } from '../../types.js';
import { parseId, parseIdList } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleResultList(ctx: HandlerContext): Promise<void> {
    const rid = parseId(ctx.args.runId, '--run-id');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.results.getResultsForRun(rid, pageOptions),
        page: () => ctx.client.results.getResultsForRunPage(rid, pageOptions),
        all: () => ctx.client.results.getAllResultsForRun(rid, getPaginatedRequestOptions(ctx.pagination)),
    });
}

/**
 * Build the shared `GetResultsOptions` bag from CLI args. Used by both
 * `result list-for-test` and `result list-for-case` so flag shape stays
 * uniform across the two per-id read endpoints.
 *
 * `status_id` and `defects_filter` are TestRail filters supported by
 * `get_results` and `get_results_for_case` (per the upstream API docs);
 * `result list` (the bulk-by-run endpoint) does not accept them and keeps its
 * limit/offset-only shape unchanged for backwards compatibility.
 */
function buildResultOptions(ctx: HandlerContext): GetResultsOptions {
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const statusId = parseIdList(ctx.args.statusId, '--status-id');
    const defectsFilter = ctx.args.defectsFilter;
    return {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(statusId !== undefined && { status_id: statusId }),
        ...(defectsFilter !== undefined && { defects_filter: defectsFilter }),
    };
}

export async function handleResultListForTest(ctx: HandlerContext): Promise<void> {
    const testId = parseId(ctx.args.pathParams[0], 'test id');
    const pageOptions = buildResultOptions(ctx);
    const filters = {
        ...(pageOptions.status_id !== undefined && { status_id: pageOptions.status_id }),
        ...(pageOptions.defects_filter !== undefined && { defects_filter: pageOptions.defects_filter }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.results.getResults(testId, pageOptions),
        page: () => ctx.client.results.getResultsPage(testId, pageOptions),
        all: () =>
            ctx.client.results.getAllResults(testId, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}

export async function handleResultListForCase(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run id');
    const caseId = parseId(ctx.args.pathParams[1], 'case id');
    const pageOptions = buildResultOptions(ctx);
    const filters = {
        ...(pageOptions.status_id !== undefined && { status_id: pageOptions.status_id }),
        ...(pageOptions.defects_filter !== undefined && { defects_filter: pageOptions.defects_filter }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.results.getResultsForCase(runId, caseId, pageOptions),
        page: () => ctx.client.results.getResultsForCasePage(runId, caseId, pageOptions),
        all: () =>
            ctx.client.results.getAllResultsForCase(runId, caseId, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}
