import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleRunGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'run id');
    ctx.out(await ctx.client.getRun(id));
}

export async function handleRunList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.getRuns(pid, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
