import type { HandlerContext } from '../handler-context.js';

export async function handleCaseStatusList(ctx: HandlerContext): Promise<void> {
    ctx.out(await ctx.client.getCaseStatuses());
}
