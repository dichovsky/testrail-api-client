import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleUserGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'user id');
    ctx.out(await ctx.client.getUser(id));
}

export async function handleUserList(ctx: HandlerContext): Promise<void> {
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(await ctx.client.getUsers(limit, offset));
}
