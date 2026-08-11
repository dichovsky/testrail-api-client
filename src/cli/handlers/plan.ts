import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handlePlanGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'plan_id');
    ctx.out(await ctx.client.plans.getPlan(id));
}

export async function handlePlanList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.plans.getPlans(pid, pageOptions),
        page: () => ctx.client.plans.getPlansPage(pid, pageOptions),
        all: () => ctx.client.plans.getAllPlans(pid, getPaginatedRequestOptions(ctx.args)),
    });
}
