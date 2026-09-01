import type { HandlerContext } from '../handler-context.js';
import { parseOptionalBoolean } from '../filters.js';
import { parseId } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleProjectGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'project id');
    ctx.out(await ctx.client.projects.getProject(id));
}

export async function handleProjectList(ctx: HandlerContext): Promise<void> {
    const isCompleted = parseOptionalBoolean(ctx.args.isCompleted, '--is-completed');
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const filters = {
        ...(isCompleted !== undefined && { isCompleted }),
    };
    const pageOptions = {
        ...filters,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.projects.getProjects(pageOptions),
        page: () => ctx.client.projects.getProjectsPage(pageOptions),
        all: () =>
            ctx.client.projects.getAllProjects({
                ...filters,
                ...getPaginatedRequestOptions(ctx.pagination),
            }),
    });
}
