import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';
import { parseOptionalBoolean, parseOptionalId, parseOptionalIdList, parseOptionalSingleRef } from '../filters.js';

export async function handleRunGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'run id');
    ctx.out(await ctx.client.runs.getRun(id));
}

export async function handleRunList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const createdAfter = parseOptionalId(ctx.args.createdAfter, '--created-after');
    const createdBefore = parseOptionalId(ctx.args.createdBefore, '--created-before');
    const createdBy = parseOptionalIdList(ctx.args.createdBy, '--created-by');
    const isCompleted = parseOptionalBoolean(ctx.args.isCompleted, '--is-completed');
    const milestoneId = parseOptionalIdList(ctx.args.milestoneId, '--milestone-id');
    const refs = parseOptionalSingleRef(ctx.args.refs);
    const suiteId = parseOptionalIdList(ctx.args.suiteId, '--suite-id');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const filters = {
        ...(createdAfter !== undefined && { createdAfter }),
        ...(createdBefore !== undefined && { createdBefore }),
        ...(createdBy !== undefined && { createdBy }),
        ...(ctx.args.includePlanRuns === true && { includePlanRuns: true }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(milestoneId !== undefined && { milestoneId }),
        ...(refs !== undefined && { refs }),
        ...(suiteId !== undefined && { suiteId }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.runs.getRuns(pid, pageOptions),
        page: () => ctx.client.runs.getRunsPage(pid, pageOptions),
        all: () =>
            ctx.client.runs.getAllRuns(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}
