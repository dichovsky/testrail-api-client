import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { UserAddPayloadSchema, UserUpdatePayloadSchema } from '../../schemas.js';

/**
 * `user add` — create a new TestRail user (TestRail 7.3+).
 *
 * Requires `name`, `email`, and `password` in the JSON body. Pass the body via
 * `--data-file <path>` or stdin pipe to avoid leaking the password through
 * shell history. `--dry-run` previews the validated payload without issuing
 * any API call.
 */
export async function handleUserAdd(ctx: HandlerContext): Promise<void> {
    const body = resolveBody(ctx.bodyInput, UserAddPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'user add', payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addUser(body.payload));
}

/**
 * `user update <user_id>` — update an existing TestRail user (TestRail 7.3+).
 *
 * All body fields are optional (PATCH semantics). `--dry-run` previews the
 * validated payload without issuing any API call.
 */
export async function handleUserUpdate(ctx: HandlerContext): Promise<void> {
    const userId = parseId(ctx.args.pathParams[0], 'user_id');
    const body = resolveBody(ctx.bodyInput, UserUpdatePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'user update',
            userId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateUser(userId, body.payload));
}
