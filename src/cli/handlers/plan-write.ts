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
