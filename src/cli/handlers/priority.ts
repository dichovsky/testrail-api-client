import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/**
 * `priority list` — list every case priority defined on the TestRail
 * instance. The endpoint (`GET get_priorities`) takes no path or query
 * params; extra positional arguments are rejected fail-fast with
 * `IdParseError` for parity with the other arg-parse failures in the CLI so
 * a typo like `testrail priority list 5` surfaces as an error instead of
 * silently ignoring the `5`.
 */
export async function handlePriorityList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `priority list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.metadata.getPriorities());
}
