import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleCaseGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    ctx.out(await ctx.client.getCase(id));
}

export async function handleCaseList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const suiteId = optInt(ctx.args.suiteId);
    ctx.out(await ctx.client.getCases(pid, suiteId !== undefined ? { suiteId } : undefined));
}
