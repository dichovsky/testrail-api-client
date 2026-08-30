import type { HandlerContext } from '../handler-context.js';
import { parseId, parseEntryId, parseAttachmentId } from '../ids.js';
import { setupUpload, uploadPayload } from '../upload.js';

export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const upload = await setupUpload(ctx, 'attachment add-to-case', { caseId });
    if (upload === null) return;
    ctx.out(await ctx.client.attachments.addAttachmentToCase(caseId, uploadPayload(upload), upload.filename));
}

export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void> {
    const resultId = parseId(ctx.args.pathParams[0], 'result_id');
    const upload = await setupUpload(ctx, 'attachment add-to-result', { resultId });
    if (upload === null) return;
    ctx.out(await ctx.client.attachments.addAttachmentToResult(resultId, uploadPayload(upload), upload.filename));
}

export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const upload = await setupUpload(ctx, 'attachment add-to-run', { runId });
    if (upload === null) return;
    ctx.out(await ctx.client.attachments.addAttachmentToRun(runId, uploadPayload(upload), upload.filename));
}

export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const upload = await setupUpload(ctx, 'attachment add-to-plan', { planId });
    if (upload === null) return;
    ctx.out(await ctx.client.attachments.addAttachmentToPlan(planId, uploadPayload(upload), upload.filename));
}

export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseEntryId(ctx.args.pathParams[1], 'entry_id');
    const upload = await setupUpload(ctx, 'attachment add-to-plan-entry', { planId, entryId });
    if (upload === null) return;
    ctx.out(
        await ctx.client.attachments.addAttachmentToPlanEntry(planId, entryId, uploadPayload(upload), upload.filename),
    );
}

/**
 * Destructive: deletes the attachment permanently. TestRail's
 * `delete_attachment` has no `soft=1` preview, so `--soft` is rejected.
 *
 * Hand-written rather than factory-created because `attachment_id` accepts
 * both positive integers (older/Cloud) and UUID strings (TestRail 7.1+);
 * `createDestructiveHandler` uses `parseId` (integer-only) for all path
 * params and cannot express this mixed type without bending the factory.
 */
export async function handleAttachmentDelete(ctx: HandlerContext): Promise<void> {
    const attachmentId = parseAttachmentId(ctx.args.pathParams[0], 'attachment_id');

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'attachment delete',
            attachmentId,
            destructive: true,
        });
        return;
    }

    if (ctx.args.soft === true) {
        throw new Error('attachment delete does not support --soft.');
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.attachments.deleteAttachment(attachmentId);
    ctx.out({ attachmentId, deleted: true });
}
