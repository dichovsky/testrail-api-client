import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/**
 * `case-field list` — list every custom case field defined on the TestRail
 * instance. The endpoint (`GET get_case_fields`) takes no path or query
 * params; any extra positional argument is rejected fail-fast so a typo
 * like `testrail case-field list 5` surfaces as an error instead of
 * silently ignoring the `5`. We throw `IdParseError` (not plain `Error`)
 * for parity with every other arg-parse failure in the CLI — `main()`
 * recognises the class and exits 1 with the same code path.
 */
export async function handleCaseFieldList(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `case-field list takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.metadata.getCaseFields());
}
