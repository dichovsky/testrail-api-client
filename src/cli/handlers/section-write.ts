import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddSectionPayloadSchema, MoveSectionPayloadSchema, UpdateSectionPayloadSchema } from '../../schemas.js';

export async function handleSectionAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddSectionPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'section add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addSection(projectId, body.payload));
}

export async function handleSectionUpdate(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const body = resolveBody(ctx.bodyInput, UpdateSectionPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'section update',
            sectionId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateSection(sectionId, body.payload));
}

/**
 * Move a section to a new parent and/or position (TestRail 6.5.2+).
 *
 * Body shape (both fields optional + nullable):
 *   { "parent_id": <number|null>, "after_id": <number|null> }
 *
 * `null` is meaningful — it explicitly moves to root / top — and must reach
 * the API as `null`, not be elided. `resolveBody()` + Zod preserve that
 * distinction, and the client request serializer (JSON.stringify) does the
 * same. The endpoint returns no body, so on success we emit a minimal
 * confirmation envelope.
 */
export async function handleSectionMove(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const body = resolveBody(ctx.bodyInput, MoveSectionPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'section move',
            sectionId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    await ctx.client.moveSection(sectionId, body.payload);
    ctx.out({ sectionId, moved: true });
}
