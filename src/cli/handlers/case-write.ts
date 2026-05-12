import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddCasePayloadSchema, UpdateCasePayloadSchema } from '../../schemas.js';

export async function handleCaseAdd(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const body = resolveBody(ctx.bodyInput, AddCasePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'case add', sectionId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addCase(sectionId, body.payload));
}

export async function handleCaseUpdate(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const body = resolveBody(ctx.bodyInput, UpdateCasePayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'case update', caseId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.updateCase(caseId, body.payload));
}
