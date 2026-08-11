import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleSuiteGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'suite id');
    ctx.out(await ctx.client.suites.getSuite(id));
}

export async function handleSuiteList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    const hasRequestControls = limit !== undefined || offset !== undefined;
    await outputPaginated(ctx, {
        items: () =>
            hasRequestControls ? ctx.client.suites.getSuites(pid, pageOptions) : ctx.client.suites.getSuites(pid),
        page: () => ctx.client.suites.getSuitesPage(pid, pageOptions),
        all: () => ctx.client.suites.getAllSuites(pid, getPaginatedRequestOptions(ctx.args)),
    });
}
