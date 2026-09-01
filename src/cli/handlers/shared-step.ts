import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, getPaginationSafetyOptions, outputPaginated } from '../pagination.js';

export async function handleSharedStepGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    ctx.out(await ctx.client.sharedSteps.getSharedStep(id));
}

export async function handleSharedStepList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = ctx.pagination?.limit ?? optInt(ctx.args.limit);
    const offset = ctx.pagination?.offset ?? optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    const hasRequestControls = limit !== undefined || offset !== undefined;
    await outputPaginated(ctx, {
        items: () =>
            hasRequestControls
                ? ctx.client.sharedSteps.getSharedSteps(pid, pageOptions)
                : ctx.client.sharedSteps.getSharedSteps(pid),
        page: () => ctx.client.sharedSteps.getSharedStepsPage(pid, pageOptions),
        all: () =>
            ctx.client.sharedSteps.getAllSharedSteps(pid, getPaginatedRequestOptions(ctx.pagination ?? ctx.args)),
    });
}

export async function handleSharedStepHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    const limit = ctx.pagination?.limit ?? optInt(ctx.args.limit);
    const offset = ctx.pagination?.offset ?? optInt(ctx.args.offset);
    const legacyOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.sharedSteps.getSharedStepHistory(id, legacyOptions),
        page: () => ctx.client.sharedSteps.getSharedStepHistoryPage(id),
        all: () =>
            ctx.client.sharedSteps.getAllSharedStepHistory(id, getPaginationSafetyOptions(ctx.pagination ?? ctx.args)),
    });
}
