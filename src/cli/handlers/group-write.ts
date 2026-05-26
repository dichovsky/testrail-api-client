import type { HandlerContext } from '../handler-context.js';
import { parseId, IdParseError } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddGroupPayloadSchema, UpdateGroupPayloadSchema } from '../../schemas.js';
import { runDestructive } from '../run-destructive.js';

/**
 * `group add` — create a new user group (TestRail 7.5+). No path param;
 * the entire payload (name + optional user_ids) travels in the JSON body.
 * Mirrors the `project add` / `case-field add` no-path-param write shape.
 */
export async function handleGroupAdd(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `group add takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    const body = resolveBody(ctx.bodyInput, AddGroupPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'group add',
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addGroup(body.payload));
}

/**
 * `group update <group_id>` — partial update of an existing group. Empty
 * body (`{}`) is accepted; TestRail itself returns the unchanged group in
 * that case (mirrors `variable update` / `section update`).
 */
export async function handleGroupUpdate(ctx: HandlerContext): Promise<void> {
    const groupId = parseId(ctx.args.pathParams[0], 'group_id');
    const body = resolveBody(ctx.bodyInput, UpdateGroupPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'group update',
            groupId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateGroup(groupId, body.payload));
}

/**
 * Destructive: deletes a user group. Gated by `--yes`; `--dry-run` wins for
 * preview-without-API. TestRail's `delete_group` does NOT support the
 * `soft=1` server-side preview, so `--soft` is rejected here rather than
 * silently dropped — keeping destructive intent unambiguous.
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 *
 * Cascade caveat: deleting a group removes its membership claims but does
 * NOT delete the users themselves (TestRail keeps users at the instance
 * level; groups are a many-to-many bag).
 */
export async function handleGroupDelete(ctx: HandlerContext): Promise<void> {
    const groupId = parseId(ctx.args.pathParams[0], 'group_id');
    await runDestructive(
        ctx,
        { action: 'group delete', groupId },
        async () => {
            await ctx.client.deleteGroup(groupId);
            ctx.out({ groupId, deleted: true });
        },
        { softUnsupported: true },
    );
}
