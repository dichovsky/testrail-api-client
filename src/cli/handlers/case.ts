import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleCaseGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    ctx.out(await ctx.client.cases.getCase(id));
}

export async function handleCaseList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const suiteId = optInt(ctx.args.suiteId);
    ctx.out(await ctx.client.cases.getCases(pid, suiteId !== undefined ? { suiteId } : undefined));
}

export async function handleCaseHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.cases.getHistoryForCase(id, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
