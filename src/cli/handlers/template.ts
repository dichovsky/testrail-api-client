import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';

/**
 * `template list <project_id>` — list every case template available in
 * the given project. The endpoint (`GET get_templates/{project_id}`)
 * takes one path-bound positive integer; `parseId()` rejects 0, -1,
 * floats, hex, scientific notation, and empty input before any network
 * call leaves the process.
 */
export async function handleTemplateList(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    ctx.out(await ctx.client.metadata.getTemplates(projectId));
}
