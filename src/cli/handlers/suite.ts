import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleSuiteGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'suite id');
    ctx.out(await ctx.client.getSuite(id));
}

export async function handleSuiteList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    ctx.out(await ctx.client.getSuites(pid));
}
