import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleSharedStepGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    ctx.out(await ctx.client.getSharedStep(id));
}

export async function handleSharedStepList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    ctx.out(await ctx.client.getSharedSteps(pid));
}

export async function handleSharedStepHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.getSharedStepHistory(id, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
