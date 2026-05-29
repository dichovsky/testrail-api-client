import type { HandlerContext } from '../handler-context.js';
import type { GetResultsOptions } from '../../types.js';
import { parseId, optInt, parseIdList } from '../ids.js';

export async function handleResultList(ctx: HandlerContext): Promise<void> {
    const rid = parseId(ctx.args.runId, '--run-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.results.getResultsForRun(rid, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
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
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
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
    ctx.out(await ctx.client.results.getResults(testId, buildResultOptions(ctx)));
}

export async function handleResultListForCase(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run id');
    const caseId = parseId(ctx.args.pathParams[1], 'case id');
    ctx.out(await ctx.client.results.getResultsForCase(runId, caseId, buildResultOptions(ctx)));
}
