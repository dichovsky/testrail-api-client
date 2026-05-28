import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import {
    AddCasePayloadSchema,
    AddCasesBulkPayloadSchema,
    UpdateCasePayloadSchema,
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
} from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleCaseAdd = createWriteHandler({
    action: 'case add',
    pathParams: ['section_id'],
    bodySchema: AddCasePayloadSchema,
    call: (client, [sectionId], body) => client.addCase(sectionId, body),
});

/**
 * Bulk-create cases under a section in one API call (TestRail 7.5+). The body
 * is a JSON **array** of case payloads. A non-array body is rejected by Zod.
 * Server-version errors (TestRail < 7.5) are rethrown inside the module as a
 * clearer "TestRail 7.5+ required" message.
 */
export const handleCaseAddBulk = createWriteHandler({
    action: 'case add-bulk',
    pathParams: ['section_id'],
    bodySchema: AddCasesBulkPayloadSchema,
    previewExtras: (body) => ({ count: body.length }),
    call: (client, [sectionId], body) => client.addCases(sectionId, body),
});

export const handleCaseUpdate = createWriteHandler({
    action: 'case update',
    pathParams: ['case_id'],
    bodySchema: UpdateCasePayloadSchema,
    call: (client, [caseId], body) => client.updateCase(caseId, body),
});

export const handleCaseUpdateBulk = createWriteHandler({
    action: 'case update-bulk',
    pathParams: ['suite_id'],
    bodySchema: UpdateCasesPayloadSchema,
    call: (client, [suiteId], body) => client.updateCases(suiteId, body),
});

export const handleCaseCopyToSection = createWriteHandler({
    action: 'case copy-to-section',
    pathParams: ['section_id'],
    bodySchema: CopyCasesToSectionPayloadSchema,
    call: (client, [sectionId], body) => client.copyCasesToSection(sectionId, body),
});

export const handleCaseMoveToSection = createWriteHandler({
    action: 'case move-to-section',
    pathParams: ['section_id'],
    bodySchema: MoveCasesToSectionPayloadSchema,
    call: (client, [sectionId], body) => client.moveCasesToSection(sectionId, body),
    formatOutput: ([sectionId]) => ({ sectionId, moved: true }),
});

/**
 * Destructive: deletes a single case. `--soft` invokes TestRail's server-side
 * preview (`soft=1`).
 */
export const handleCaseDelete = createDestructiveHandler({
    action: 'case delete',
    pathParams: ['case_id'],
    softMode: 'optional',
    call: (client, [caseId], _entry, soft) => client.deleteCase(caseId, { soft }),
});

/**
 * Destructive bulk delete. Hand-written rather than factory-built: it is the
 * only destructive action that combines a JSON body, a required `--project-id`
 * flag, and the soft-preview branch. `--soft` adds TestRail's server-side
 * preview (`soft=1`); `--dry-run` short-circuits before any API call.
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
