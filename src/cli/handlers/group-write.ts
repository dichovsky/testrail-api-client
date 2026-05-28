import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddGroupPayloadSchema, UpdateGroupPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

/**
 * `group add` — create a new user group (TestRail 7.5+). Hand-written rather
 * than factory-built because it actively rejects positional arguments (the
 * group is identified entirely by the JSON body, not a path param). The
 * dispatcher's path-param-count check covers the CLI path, but this guard also
 * protects direct callers.
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
 * `group update <group_id>` — partial update; an empty `{}` body is accepted
 * (TestRail returns the unchanged group).
 */
export const handleGroupUpdate = createWriteHandler({
    action: 'group update',
    pathParams: ['group_id'],
    bodySchema: UpdateGroupPayloadSchema,
    call: (client, [groupId], body) => client.updateGroup(groupId, body),
});

/**
 * Destructive: deletes a user group. TestRail's `delete_group` has no `soft=1`
 * preview, so `--soft` is rejected. Deleting a group removes its membership
 * claims but not the users themselves.
 */
export const handleGroupDelete = createDestructiveHandler({
    action: 'group delete',
    pathParams: ['group_id'],
    call: (client, [groupId]) => client.deleteGroup(groupId),
});
