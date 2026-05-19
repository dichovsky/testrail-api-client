import type { HandlerContext } from '../handler-context.js';

/**
 * `status list` — list every result status defined on the TestRail
 * instance (Passed, Blocked, Failed, plus any custom statuses). The
 * endpoint (`GET get_statuses`) takes no path or query params; extra
 * positional arguments are rejected fail-fast.
 */
export async function handleStatusList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new Error(
            `status list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.getStatuses());
}
