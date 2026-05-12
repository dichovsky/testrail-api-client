import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

export async function handleResultList(ctx: HandlerContext): Promise<void> {
    const rid = parseId(ctx.args.runId, '--run-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    ctx.out(
        await ctx.client.getResultsForRun(rid, {
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
