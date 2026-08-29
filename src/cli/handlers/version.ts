import type { HandlerContext } from '../handler-context.js';
import { IdParseError } from '../ids.js';

/** `version get` — return the installed TestRail version. */
export async function handleVersionGet(ctx: HandlerContext): Promise<void> {
    if (ctx.args.pathParams.length > 0) {
        throw new IdParseError(
            `version get takes no positional arguments (got: ${ctx.args.pathParams.length} extra). Run --help for usage.`,
        );
    }
    ctx.out(await ctx.client.metadata.getVersion());
}
