import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { parseOptionalId, parseOptionalIdList, parseOptionalSingleRef } from '../filters.js';
import { getPaginatedRequestOptions, getPaginationSafetyOptions, outputPaginated } from '../pagination.js';

export async function handleSharedStepGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    ctx.out(await ctx.client.sharedSteps.getSharedStep(id));
}

export async function handleSharedStepList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const createdAfter = parseOptionalId(ctx.args.createdAfter, '--created-after');
    const createdBefore = parseOptionalId(ctx.args.createdBefore, '--created-before');
    const createdBy = parseOptionalIdList(ctx.args.createdBy, '--created-by');
    const updatedAfter = parseOptionalId(ctx.args.updatedAfter, '--updated-after');
    const updatedBefore = parseOptionalId(ctx.args.updatedBefore, '--updated-before');
    const refs = parseOptionalSingleRef(ctx.args.refs);
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const filters = {
        ...(createdAfter !== undefined && { createdAfter }),
        ...(createdBefore !== undefined && { createdBefore }),
        ...(createdBy !== undefined && { createdBy }),
        ...(updatedAfter !== undefined && { updatedAfter }),
        ...(updatedBefore !== undefined && { updatedBefore }),
        ...(refs !== undefined && { refs }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.sharedSteps.getSharedSteps(pid, pageOptions),
        page: () => ctx.client.sharedSteps.getSharedStepsPage(pid, pageOptions),
        all: () =>
            ctx.client.sharedSteps.getAllSharedSteps(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}

export async function handleSharedStepHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const legacyOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.sharedSteps.getSharedStepHistory(id, legacyOptions),
        page: () => ctx.client.sharedSteps.getSharedStepHistoryPage(id),
        all: () => ctx.client.sharedSteps.getAllSharedStepHistory(id, getPaginationSafetyOptions(ctx.pagination)),
    });
}
