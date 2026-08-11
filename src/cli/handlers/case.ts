import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleCaseGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    ctx.out(await ctx.client.cases.getCase(id));
}

export async function handleCaseList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const suiteId = ctx.args.suiteId === undefined ? undefined : parseId(ctx.args.suiteId, '--suite-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const filters = {
        ...(suiteId !== undefined && { suiteId }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.cases.getCases(pid, pageOptions),
        page: () => ctx.client.cases.getCasesPage(pid, pageOptions),
        all: () =>
            ctx.client.cases.getAllCases(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.args),
            }),
    });
}

export async function handleCaseHistory(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'case id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.cases.getHistoryForCase(id, pageOptions),
        page: () => ctx.client.cases.getHistoryForCasePage(id, pageOptions),
        all: () => ctx.client.cases.getAllHistoryForCase(id, getPaginatedRequestOptions(ctx.args)),
    });
}
