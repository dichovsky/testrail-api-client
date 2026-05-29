import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

/**
 * `configuration list <project_id>` — returns the project's full configuration
 * group hierarchy in one call: every group with its nested `configs[]`. There
 * is no separate "list configs in a group" endpoint upstream; TestRail returns
 * the entire tree from `get_configs/{project_id}` and the caller drills down
 * client-side.
 */
export async function handleConfigurationList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.configurations.getConfigurations(projectId));
}
