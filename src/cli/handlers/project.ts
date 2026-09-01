import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleProjectGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'project id');
    ctx.out(await ctx.client.projects.getProject(id));
}

export async function handleProjectList(ctx: HandlerContext): Promise<void> {
    const limit = ctx.pagination.limit;
    const offset = ctx.pagination.offset;
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.projects.getProjects(limit, offset),
        page: () => ctx.client.projects.getProjectsPage(pageOptions),
        all: () => ctx.client.projects.getAllProjects(getPaginatedRequestOptions(ctx.pagination)),
    });
}
