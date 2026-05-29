import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handlePlanGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'plan_id');
    ctx.out(await ctx.client.plans.getPlan(id));
}

export async function handlePlanList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.plans.getPlans(pid, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
