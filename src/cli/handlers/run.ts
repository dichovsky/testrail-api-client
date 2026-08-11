import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleRunGet(ctx: HandlerContext): Promise<void> {
    const id = parseId(ctx.args.pathParams[0], 'run id');
    ctx.out(await ctx.client.runs.getRun(id));
}

export async function handleRunList(ctx: HandlerContext): Promise<void> {
    const pid = parseId(ctx.args.projectId, '--project-id');
    const limit = optInt(ctx.args.limit);
    const offset = optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    await outputPaginated(ctx, {
        items: () => ctx.client.runs.getRuns(pid, pageOptions),
        page: () => ctx.client.runs.getRunsPage(pid, pageOptions),
        all: () => ctx.client.runs.getAllRuns(pid, getPaginatedRequestOptions(ctx.args)),
    });
}
