import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

/** `dynamic-filter-field list <project_id>` — list fields available for dynamic filtering. */
export async function handleDynamicFilterFieldList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.metadata.getDynamicFilterFields(projectId));
}
