import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddPlanPayloadSchema, UpdatePlanPayloadSchema, AddPlanEntryPayloadSchema } from '../../schemas.js';

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
