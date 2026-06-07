import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleLabelGet(ctx: HandlerContext): Promise<void> {
    const labelId = parseId(ctx.args.pathParams[0], 'label_id');
    ctx.out(await ctx.client.labels.getLabel(labelId));
}

export async function handleLabelList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.labels.getLabels(projectId));
}
