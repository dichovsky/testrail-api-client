import type { HandlerContext } from '../handler-context.js';
import { parseId, IdParseError } from '../ids.js';

/**
 * `group get <group_id>` — fetch a single user group by ID. Mirrors the
 * other single-id read handlers (`user get`, `milestone get`, etc.); the
 * positive-integer gate in `parseId()` rejects 0/-1/floats/hex/scientific
 * notation/empty before any network call.
 */
export async function handleGroupGet(ctx: HandlerContext): Promise<void> {
    const groupId = parseId(ctx.args.pathParams[0], 'group_id');
    ctx.out(await ctx.client.users.getGroup(groupId));
}

/**
 * `group list` — list every user group on the TestRail instance
 * (TestRail 7.5+). The endpoint (`GET get_groups`) takes no path or query
 * params; extra positional arguments are rejected fail-fast with
 * `IdParseError` for parity with the other arg-parse failures in the CLI
 * (mirrors `status list`, `case-field list`, etc.).
 */
export async function handleGroupList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `group list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.users.getGroups());
}
