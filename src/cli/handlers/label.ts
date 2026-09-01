import type { HandlerContext } from '../handler-context.js';
import { parseId, optInt } from '../ids.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

export async function handleLabelGet(ctx: HandlerContext): Promise<void> {
    const labelId = parseId(ctx.args.pathParams[0], 'label_id');
    ctx.out(await ctx.client.labels.getLabel(labelId));
}

export async function handleLabelList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const limit = ctx.pagination?.limit ?? optInt(ctx.args.limit);
    const offset = ctx.pagination?.offset ?? optInt(ctx.args.offset);
    const pageOptions = {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
    const hasRequestControls = limit !== undefined || offset !== undefined;
    await outputPaginated(ctx, {
        items: () =>
            hasRequestControls
                ? ctx.client.labels.getLabels(projectId, pageOptions)
                : ctx.client.labels.getLabels(projectId),
        page: () => ctx.client.labels.getLabelsPage(projectId, pageOptions),
        all: () => ctx.client.labels.getAllLabels(projectId, getPaginatedRequestOptions(ctx.pagination ?? ctx.args)),
    });
}
