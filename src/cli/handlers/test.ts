import type { HandlerContext } from '../handler-context.js';
import { IdParseError, parseId } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';
import { parseOptionalIdList } from '../filters.js';

export async function handleTestGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'test id');
    const withData = ctx.args.withData;
    if (withData !== undefined && withData !== '0' && withData !== '1') {
        throw new IdParseError(`--with-data must be 0 or 1 (got: ${withData === '' ? '(empty)' : withData})`);
    }
    ctx.out(await (withData === undefined ? ctx.client.tests.getTest(id) : ctx.client.tests.getTest(id, { withData })));
}

export async function handleTestList(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run id');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const statusIds = parseOptionalIdList(ctx.args.statusId, '--status-id');
    const labelIds = parseOptionalIdList(ctx.args.labelId, '--label-id');
    const filters = {
        ...(statusIds !== undefined && { status_id: statusIds }),
        ...(labelIds !== undefined && { label_id: labelIds }),
    };
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
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}
