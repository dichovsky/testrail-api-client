import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleSectionGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'section id');
    ctx.out(await ctx.client.sections.getSection(id));
}

export async function handleSectionList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.pathParams[0], 'project id');
    const suiteId = ctx.args.suiteId === undefined ? undefined : parseId(ctx.args.suiteId, '--suite-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const filters = { ...(suiteId !== undefined && { suiteId }) };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.sections.getSections(pid, pageOptions),
        page: () => ctx.client.sections.getSectionsPage(pid, pageOptions),
        all: () =>
            ctx.client.sections.getAllSections(pid, {
                ...filters,
                ...getPaginatedRequestOptions(ctx.args),
            }),
    });
}
