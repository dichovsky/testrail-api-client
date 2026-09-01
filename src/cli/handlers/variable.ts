import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { getPaginationSafetyOptions, outputPaginated } from '../pagination.js';

export async function handleVariableList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    await outputPaginated(ctx, {
        items: () => ctx.client.variables.getVariables(projectId),
        page: () => ctx.client.variables.getVariablesPage(projectId),
        all: () =>
            ctx.client.variables.getAllVariables(projectId, getPaginationSafetyOptions(ctx.pagination ?? ctx.args)),
    });
}
