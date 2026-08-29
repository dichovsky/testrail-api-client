import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';
import { parseOptionalBoolean, parseOptionalId, parseOptionalIdList } from '../filters.js';

export async function handlePlanGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'plan_id');
    ctx.out(await ctx.client.plans.getPlan(id));
}

export async function handlePlanList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const createdAfter = parseOptionalId(ctx.args.createdAfter, '--created-after');
    const createdBefore = parseOptionalId(ctx.args.createdBefore, '--created-before');
    const createdBy = parseOptionalIdList(ctx.args.createdBy, '--created-by');
    const isCompleted = parseOptionalBoolean(ctx.args.isCompleted, '--is-completed');
    const milestoneId = parseOptionalIdList(ctx.args.milestoneId, '--milestone-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const filters = {
        ...(createdAfter !== undefined && { createdAfter }),
        ...(createdBefore !== undefined && { createdBefore }),
        ...(createdBy !== undefined && { createdBy }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(milestoneId !== undefined && { milestoneId }),
        ...(ctx.args.refs !== undefined && { refs: ctx.args.refs }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.plans.getPlans(pid, pageOptions),
        page: () => ctx.client.plans.getPlansPage(pid, pageOptions),
        all: () =>
            ctx.client.plans.getAllPlans(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.args),
            }),
    });
}
