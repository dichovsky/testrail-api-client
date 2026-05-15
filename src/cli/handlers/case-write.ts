import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import {
    AddCasePayloadSchema,
    UpdateCasePayloadSchema,
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
} from '../../schemas.js';

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

export async function handleCaseUpdateBulk(ctx: HandlerContext): Promise<void> {
    const suiteId = parseId(ctx.args.pathParams[0], 'suite_id');
    const body = resolveBody(ctx.bodyInput, UpdateCasesPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'case update-bulk',
            suiteId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateCases(suiteId, body.payload));
}

/**
 * Destructive: bulk-deletes cases. Gated by `--yes`. `--soft` adds TestRail's
 * server-side preview (`soft=1`) — distinct from `--dry-run` which short-
 * circuits before any API call. When both `--dry-run` and `--yes` are
 * passed, dry-run wins (no API call) and emits a preview with
 * `destructive: true` so callers can spot it in audit output.
 */
export async function handleCaseDeleteBulk(ctx: HandlerContext): Promise<void> {
    const suiteId = parseId(ctx.args.pathParams[0], 'suite_id');
    const projectIdRaw = ctx.args.projectId;
    if (projectIdRaw === undefined) {
        throw new Error('case delete-bulk requires --project-id <id>');
    }
    const projectId = parseId(projectIdRaw, '--project-id');
    const body = resolveBody(ctx.bodyInput, DeleteCasesPayloadSchema);
    if (!body.ok) throw new Error(body.error);

    const soft = ctx.args.soft === true;

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'case delete-bulk',
            suiteId,
            projectId,
            soft,
            destructive: true,
            payload: body.payload,
            source: body.source,
        });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    if (soft) {
        const preview = await ctx.client.deleteCases(suiteId, projectId, body.payload, { soft: true });
        ctx.out({ suiteId, projectId, soft: true, deleted: false, preview });
        return;
    }
    await ctx.client.deleteCases(suiteId, projectId, body.payload, { soft: false });
    ctx.out({ suiteId, projectId, soft: false, deleted: true });
}

export async function handleCaseCopyToSection(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const body = resolveBody(ctx.bodyInput, CopyCasesToSectionPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'case copy-to-section',
            sectionId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.copyCasesToSection(sectionId, body.payload));
}

export async function handleCaseMoveToSection(ctx: HandlerContext): Promise<void> {
    const sectionId = parseId(ctx.args.pathParams[0], 'section_id');
    const body = resolveBody(ctx.bodyInput, MoveCasesToSectionPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'case move-to-section',
            sectionId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    await ctx.client.moveCasesToSection(sectionId, body.payload);
    ctx.out({ sectionId, moved: true });
}
