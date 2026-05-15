import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddProjectPayloadSchema, UpdateProjectPayloadSchema } from '../../schemas.js';

export async function handleProjectAdd(ctx: HandlerContext): Promise<void> {
    const body = resolveBody(ctx.bodyInput, AddProjectPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'project add', payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addProject(body.payload));
}

export async function handleProjectUpdate(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, UpdateProjectPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'project update',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateProject(projectId, body.payload));
}
