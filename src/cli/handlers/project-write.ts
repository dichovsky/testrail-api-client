import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddProjectPayloadSchema, UpdateProjectPayloadSchema } from '../../schemas.js';
import { runDestructive } from '../run-destructive.js';

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

/**
 * Destructive: deletes a project and everything inside it. Highest blast
 * radius in the destructive surface; the standard `--yes` gate is the only
 * confirmation TestRail itself supports. `--dry-run` wins for preview-
 * without-API. TestRail's `delete_project` does NOT support the `soft=1`
 * server-side preview, so `--soft` is rejected here rather than silently
 * dropped — keeping destructive intent unambiguous.
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 */
export async function handleProjectDelete(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    await runDestructive(
        ctx,
        { action: 'project delete', projectId },
        async () => {
            await ctx.client.deleteProject(projectId);
            ctx.out({ projectId, deleted: true });
        },
        { softUnsupported: true },
    );
}
