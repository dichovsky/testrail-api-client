import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleProjectGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'project id');
    ctx.out(await ctx.client.projects.getProject(id));
}

export async function handleProjectList(ctx: HandlerContext): Promise<void> {
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(await ctx.client.projects.getProjects(limit, offset));
}
