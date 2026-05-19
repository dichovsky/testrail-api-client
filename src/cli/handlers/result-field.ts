import type { HandlerContext } from '../handler-context.js';

/**
 * `result-field list` — list every custom result field defined on the
 * TestRail instance. The endpoint (`GET get_result_fields`) takes no path
 * or query params; extra positional arguments are rejected fail-fast.
 */
export async function handleResultFieldList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new Error(
            `result-field list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.getResultFields());
}
