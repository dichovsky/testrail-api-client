import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { safeWriteBinary } from '../safe-write.js';
import { safeJsonStringify } from '../output.js';

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
 * Download an attachment to a local file or stdout. Binary contents are
 * written to `--out <path>`; the JSON ack on stdout includes attachmentId,
 * out path, and byte count so callers can confirm a successful write without
 * re-reading the file.
 *
 * When `--out -` is passed, raw bytes stream to `process.stdout` and the
 * JSON ack is rerouted to stderr (so the binary payload on stdout stays
 * uncontaminated for downstream tools like `hexdump`, `xxd`, or another
 * `testrail` pipeline). A TTY check on stdout emits a warning (not a hard
 * block) — some users intentionally pipe binary to `hexdump`.
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

    if (resolved.target === 'stdout') {
        // TTY warning: terminals interpret binary as escape sequences, which
        // can corrupt the user's session. Don't block (BACKLOG explicitly
        // allows piping to `xxd`/`hexdump` when stdout *is* a TTY) — just
        // warn. err() respects --quiet so this is suppressible.
        if (process.stdout.isTTY === true) {
            ctx.err?.('--out - is writing binary to a TTY; pipe to a tool like xxd or redirect to a file.');
        }
        process.stdout.write(bytes);
        // Route the JSON ack to stderr so the stdout stream is pure binary.
        // Honor --quiet by checking ctx.err (the createOutput err() helper
        // already gates on --quiet); fall back to direct stderr only when
        // ctx.err is absent (defensive for handlers wired with a minimal ctx).
        const ack = {
            attachmentId,
            out: '<stdout>',
            size: bytes.byteLength,
        };
        if (ctx.errRaw !== undefined) {
            ctx.errRaw(`${safeJsonStringify(ack)}\n`);
        }
        return;
    }

    safeWriteBinary(resolved.path, bytes, ctx.force);
    ctx.out({
        attachmentId,
        out: resolved.path,
        size: bytes.byteLength,
    });
}
