import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleDatasetGet(ctx: HandlerContext): Promise<void> {
    const datasetId = parseId(ctx.args.pathParams[0], 'dataset_id');
    ctx.out(await ctx.client.datasets.getDataset(datasetId));
}

export async function handleDatasetList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.datasets.getDatasets(projectId));
}
