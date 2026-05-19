import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleSectionGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'section id');
    ctx.out(await ctx.client.getSection(id));
}

export async function handleSectionList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.pathParams[0], 'project id');
    const suiteId = ctx.args.suiteId === undefined ? undefined : parseId(ctx.args.suiteId, '--suite-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.getSections(pid, {
            ...(suiteId !== undefined && { suiteId }),
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
