import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';

/**
 * Parse a comma-separated `--status-id` flag value into a positive-integer
 * array. Returns `undefined` when the flag was not provided; rejects any
 * malformed entry (non-positive, non-integer, empty token) with the same
 * shape of error `parseId()` would produce, so handler-level error reporting
 * stays uniform with the rest of the CLI surface.
 */
function parseStatusIdList(raw: string | undefined): number[] | undefined {
    if (raw === undefined) return undefined;
    return raw.split(',').map((token) => parseId(token.trim(), '--status-id'));
}

export async function handleTestGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'test id');
    ctx.out(await ctx.client.tests.getTest(id));
}

export async function handleTestList(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const statusIds = parseStatusIdList(ctx.args.statusId);
    ctx.out(
        await ctx.client.tests.getTests(runId, {
            ...(statusIds !== undefined && { status_id: statusIds }),
            ...(limit !== undefined && { limit }),
            ...(offset !== undefined && { offset }),
        }),
    );
}
