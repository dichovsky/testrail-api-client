import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

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
    const filters = { ...(statusIds !== undefined && { status_id: statusIds }) };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.tests.getTests(runId, pageOptions),
        page: () => ctx.client.tests.getTestsPage(runId, pageOptions),
        all: () =>
            ctx.client.tests.getAllTests(runId, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.args),
            }),
    });
}
