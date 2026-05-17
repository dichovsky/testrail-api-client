import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { safeWriteBinary } from '../safe-write.js';

export async function handleAttachmentListForCase(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    ctx.out(await ctx.client.getAttachmentsForCase(caseId));
}

export async function handleAttachmentListForRun(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    ctx.out(await ctx.client.getAttachmentsForRun(runId));
}

export async function handleAttachmentListForTest(ctx: HandlerContext): Promise<void> {
    const testId = parseId(ctx.args.pathParams[0], 'test_id');
    ctx.out(await ctx.client.getAttachmentsForTest(testId));
}

export async function handleAttachmentListForPlan(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    ctx.out(await ctx.client.getAttachmentsForPlan(planId));
}

export async function handleAttachmentListForPlanEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseId(ctx.args.pathParams[1], 'entry_id');
    ctx.out(await ctx.client.getAttachmentsForPlanEntry(planId, entryId));
}

/**
 * Download an attachment to a local file. Binary contents are written to
 * `--out <path>`; the JSON ack on stdout includes attachmentId, out path,
 * and byte count so callers can confirm a successful write without re-reading
 * the file.
 */
export async function handleAttachmentGet(ctx: HandlerContext): Promise<void> {
    const attachmentId = parseId(ctx.args.pathParams[0], 'attachment_id');
    const resolved = resolveOut(
        { ...(ctx.args.out !== undefined && { outFlag: ctx.args.out }) },
        { force: ctx.force, dryRun: ctx.dryRun },
    );
    if (!resolved.ok) throw new Error(resolved.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'attachment get',
            attachmentId,
            out: resolved.path,
        });
        return;
    }

    const buf = await ctx.client.getAttachment(attachmentId);
    const bytes = new Uint8Array(buf);
    safeWriteBinary(resolved.path, bytes, ctx.force);
    ctx.out({
        attachmentId,
        out: resolved.path,
        size: bytes.byteLength,
    });
}
