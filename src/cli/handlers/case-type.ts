import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/**
 * `case-type list` — list every case type defined on the TestRail instance
 * (e.g. Functional, Smoke, Regression). The endpoint (`GET get_case_types`)
 * takes no path or query params; extra positional arguments are rejected
 * fail-fast with `IdParseError` for parity with the other arg-parse failures
 * in the CLI so a typo like `testrail case-type list 5` surfaces as an error
 * instead of silently ignoring the `5`.
 */
export async function handleCaseTypeList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `case-type list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.getCaseTypes());
}
