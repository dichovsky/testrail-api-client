import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddSharedStepPayloadSchema, UpdateSharedStepPayloadSchema } from '../../schemas.js';

export async function handleSharedStepAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddSharedStepPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'shared-step add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addSharedStep(projectId, body.payload));
}

export async function handleSharedStepUpdate(ctx: HandlerContext): Promise<void> {
    const sharedStepId = parseId(ctx.args.pathParams[0], 'shared_step_id');
    const body = resolveBody(ctx.bodyInput, UpdateSharedStepPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'shared-step update',
            sharedStepId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateSharedStep(sharedStepId, body.payload));
}

/**
 * Destructive: deletes a shared step. The deletion does NOT delete the test
 * cases that reference this shared step — those cases lose their reference to
 * the step set but remain intact (per TestRail's documented behavior for
 * `delete_shared_step`). Gated by `--yes`; `--dry-run` wins for
 * preview-without-API. TestRail does NOT support `?soft=1` on
 * `delete_shared_step` — there's no server-side preview; the only safety net
 * is the client-side `--dry-run`. Mirrors `handleMilestoneDelete` /
 * `handlePlanDelete` (no-`--soft` deletes).
 *
 * Gate order: parseId → `--dry-run` (wins, returns preview without API call)
 * → `--soft` reject → `--yes` gate → API call. Putting `--dry-run` ahead of
 * the `--soft` rejection lets `--dry-run --soft` short-circuit to a preview
 * (intent is "show me what would happen" — `--soft` is irrelevant since no
 * request is made).
 */
export async function handleSharedStepDelete(ctx: HandlerContext): Promise<void> {
    const sharedStepId = parseId(ctx.args.pathParams[0], 'shared_step_id');
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'shared-step delete', sharedStepId, destructive: true });
        return;
    }
    if (ctx.args.soft === true) {
        throw new Error('shared-step delete does not support --soft.');
    }
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }
    await ctx.client.deleteSharedStep(sharedStepId);
    ctx.out({ sharedStepId, deleted: true });
}
