import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/**
 * `case-status list` — list every case status defined on the TestRail
 * instance. The endpoint (`GET get_case_statuses`) takes no path or query
 * params; extra positional arguments are rejected fail-fast with
 * `IdParseError` for parity with the other no-arg metadata handlers
 * (case-field / result-field / status / template). This retroactive
 * tightening eliminates the previous two-tier behaviour where
 * `case-status list 5` silently ignored the `5`.
 */
export async function handleCaseStatusList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `case-status list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.getCaseStatuses());
}
