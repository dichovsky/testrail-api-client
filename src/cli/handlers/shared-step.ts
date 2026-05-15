import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleSharedStepGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'shared step id');
    ctx.out(await ctx.client.getSharedStep(id));
}

export async function handleSharedStepList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    ctx.out(await ctx.client.getSharedSteps(pid));
}
