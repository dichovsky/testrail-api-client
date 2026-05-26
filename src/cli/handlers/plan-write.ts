import type { HandlerContext } from '../handler-context.js';
import { parseId, parseEntryId } from '../ids.js';
import { resolveBody } from '../body.js';
import {
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
    AddPlanEntryPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
} from '../../schemas.js';
import { runDestructive } from '../run-destructive.js';

export async function handlePlanAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddPlanPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'plan add', projectId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addPlan(projectId, body.payload));
}

export async function handlePlanUpdate(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const body = resolveBody(ctx.bodyInput, UpdatePlanPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'plan update', planId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.updatePlan(planId, body.payload));
}

export async function handlePlanAddEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const body = resolveBody(ctx.bodyInput, AddPlanEntryPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'plan add-entry', planId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addPlanEntry(planId, body.payload));
}

export async function handlePlanAddRunToEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseEntryId(ctx.args.pathParams[1], 'entry_id');
    const body = resolveBody(ctx.bodyInput, AddRunToPlanEntryPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'plan add-run-to-entry',
            planId,
            entryId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addRunToPlanEntry(planId, entryId, body.payload));
}

export async function handlePlanUpdateEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseEntryId(ctx.args.pathParams[1], 'entry_id');
    const body = resolveBody(ctx.bodyInput, UpdatePlanEntryPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'plan update-entry',
            planId,
            entryId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updatePlanEntry(planId, entryId, body.payload));
}

export async function handlePlanUpdateRunInEntry(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const body = resolveBody(ctx.bodyInput, UpdateRunInPlanEntryPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'plan update-run-in-entry',
            runId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateRunInPlanEntry(runId, body.payload));
}

/**
 * Destructive: closes a plan. TestRail offers no `open_plan` endpoint —
 * once closed, the plan accepts no new entries/runs and existing runs in
 * the plan can no longer receive results. Gated by `--yes`; if `--dry-run`
 * is also passed, dry-run wins (no API call) and emits a preview with
 * `destructive: true`. Mirrors `handleRunClose`.
 *
 * No body is taken — any `--data` / `--data-file` / stdin supplied for
 * this action is silently ignored, matching the no-body close pattern
 * locked in by `run close`.
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 */
export async function handlePlanClose(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    await runDestructive(
        ctx,
        { action: 'plan close', planId },
        async () => {
            ctx.out(await ctx.client.closePlan(planId));
        },
        { softUnsupported: true },
    );
}

/**
 * Destructive: deletes a plan and all of its entries and associated runs.
 * Gated by `--yes`; `--dry-run` wins for preview-without-API. TestRail does
 * NOT support `?soft=1` on `delete_plan` — there's no server-side preview;
 * the only safety net is the client-side `--dry-run`. Mirrors
 * `handleMilestoneDelete` / `handleProjectDelete` (no-`--soft` deletes).
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 */
export async function handlePlanDelete(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    await runDestructive(
        ctx,
        { action: 'plan delete', planId },
        async () => {
            await ctx.client.deletePlan(planId);
            ctx.out({ planId, deleted: true });
        },
        { softUnsupported: true },
    );
}

/**
 * Destructive: deletes a single plan entry (which removes every run in
 * that entry). `entry_id` is a UUID-style string (not a number); it's
 * validated against the non-empty-string rule via `parseEntryId` before
 * the destructive gate is even checked. Gated by `--yes`; `--dry-run`
 * wins for preview-without-API. No `--soft` support upstream.
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 */
export async function handlePlanDeleteEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseEntryId(ctx.args.pathParams[1], 'entry_id');
    await runDestructive(
        ctx,
        { action: 'plan delete-entry', planId, entryId },
        async () => {
            await ctx.client.deletePlanEntry(planId, entryId);
            ctx.out({ planId, entryId, deleted: true });
        },
        { softUnsupported: true },
    );
}

/**
 * Destructive: deletes a single run from its plan entry. Takes only the
 * `run_id` (numeric) — the entry/plan are looked up server-side. Gated
 * by `--yes`; `--dry-run` wins for preview-without-API. No `--soft`
 * support upstream.
 *
 * Gate order (Pattern B): parseId → dryRun (wins) → soft reject → yes gate → API.
 */
export async function handlePlanDeleteRunFromEntry(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    await runDestructive(
        ctx,
        { action: 'plan delete-run-from-entry', runId },
        async () => {
            await ctx.client.deleteRunFromPlanEntry(runId);
            ctx.out({ runId, deleted: true });
        },
        { softUnsupported: true },
    );
}
