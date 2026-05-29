import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

export async function handleVariableList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.variables.getVariables(projectId));
}
