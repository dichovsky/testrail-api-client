import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddMilestonePayloadSchema, UpdateMilestonePayloadSchema } from '../../schemas.js';

export async function handleMilestoneAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddMilestonePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'milestone add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addMilestone(projectId, body.payload));
}

export async function handleMilestoneUpdate(ctx: HandlerContext): Promise<void> {
    const milestoneId = parseId(ctx.args.pathParams[0], 'milestone_id');
    const body = resolveBody(ctx.bodyInput, UpdateMilestonePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'milestone update',
            milestoneId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateMilestone(milestoneId, body.payload));
}

/**
 * Destructive: deletes a milestone. Gated by `--yes`; `--dry-run` wins for
 * preview-without-API. TestRail's `delete_milestone` does NOT support the
 * `soft=1` server-side preview, so `--soft` is rejected here rather than
 * silently dropped — keeping destructive intent unambiguous.
 */
export async function handleMilestoneDelete(ctx: HandlerContext): Promise<void> {
    const milestoneId = parseId(ctx.args.pathParams[0], 'milestone_id');

    if (ctx.args.soft === true) {
        throw new Error('milestone delete does not support --soft.');
    }

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'milestone delete', milestoneId, destructive: true });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteMilestone(milestoneId);
    ctx.out({ milestoneId, deleted: true });
}
