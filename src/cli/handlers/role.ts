import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/**
 * `role list` — list every user role defined on the TestRail instance. The
 * endpoint (`GET get_roles`) takes no path or query params; extra positional
 * arguments are rejected fail-fast with `IdParseError` for parity with the
 * other arg-parse failures in the CLI so a typo like `testrail role list 5`
 * surfaces as an error instead of silently ignoring the `5`.
 */
export async function handleRoleList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `role list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.metadata.getRoles());
}
