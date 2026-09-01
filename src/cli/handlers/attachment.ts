import type { HandlerContext } from '../handler-context.js';
import { parseId, parseEntryId, parseAttachmentId, optInt } from '../ids.js';
import { resolveOut } from '../file-output.js';
import { safeWriteBinary } from '../safe-write.js';
import { emitStdoutAck } from '../output.js';
import { getPaginatedRequestOptions, outputPaginated } from '../pagination.js';

/**
 * Build the `{ limit?, offset? }` options object for the per-resource
 * attachment-list endpoints. Mirrors the `case list` / `run list` /
 * `result list` pagination convention. Both flags are optional; either one
 * can be set independently. In the backward-compatible default mode,
 * malformed values are omitted by `optInt`; explicit `--page`/`--all` modes
 * validate their numeric controls strictly before handler dispatch.
 */
function paginationFromCtx(ctx: HandlerContext): { limit?: number; offset?: number } {
    const limit = ctx.pagination?.limit ?? optInt(ctx.args.limit);
    const offset = ctx.pagination?.offset ?? optInt(ctx.args.offset);
    return {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
    };
}

export async function handleAttachmentListForCase(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const pageOptions = paginationFromCtx(ctx);
    await outputPaginated(ctx, {
        items: () => ctx.client.attachments.getAttachmentsForCase(caseId, pageOptions),
        page: () => ctx.client.attachments.getAttachmentsForCasePage(caseId, pageOptions),
        all: () =>
            ctx.client.attachments.getAllAttachmentsForCase(
                caseId,
                getPaginatedRequestOptions(ctx.pagination ?? ctx.args),
            ),
    });
}

export async function handleAttachmentListForRun(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const pageOptions = paginationFromCtx(ctx);
    await outputPaginated(ctx, {
        items: () => ctx.client.attachments.getAttachmentsForRun(runId, pageOptions),
        page: () => ctx.client.attachments.getAttachmentsForRunPage(runId, pageOptions),
        all: () =>
            ctx.client.attachments.getAllAttachmentsForRun(
                runId,
                getPaginatedRequestOptions(ctx.pagination ?? ctx.args),
            ),
    });
}

export async function handleAttachmentListForTest(ctx: HandlerContext): Promise<void> {
    const testId = parseId(ctx.args.pathParams[0], 'test_id');
    ctx.out(await ctx.client.attachments.getAttachmentsForTest(testId, paginationFromCtx(ctx)));
}

export async function handleAttachmentListForPlan(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const pageOptions = paginationFromCtx(ctx);
    const hasRequestControls = pageOptions.limit !== undefined || pageOptions.offset !== undefined;
    await outputPaginated(ctx, {
        items: () =>
            hasRequestControls
                ? ctx.client.attachments.getAttachmentsForPlan(planId, pageOptions)
                : ctx.client.attachments.getAttachmentsForPlan(planId),
        page: () => ctx.client.attachments.getAttachmentsForPlanPage(planId, pageOptions),
        all: () =>
            ctx.client.attachments.getAllAttachmentsForPlan(
                planId,
                getPaginatedRequestOptions(ctx.pagination ?? ctx.args),
            ),
    });
}

export async function handleAttachmentListForPlanEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseEntryId(ctx.args.pathParams[1], 'entry_id');
    ctx.out(await ctx.client.attachments.getAttachmentsForPlanEntry(planId, entryId));
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
    const attachmentId = parseAttachmentId(ctx.args.pathParams[0], 'attachment_id');
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

    const buf = await ctx.client.attachments.getAttachment(attachmentId);
    const bytes = new Uint8Array(buf);

    if (resolved.target === 'stdout') {
        // TTY warning: terminals interpret binary as escape sequences, which
        // can corrupt the user's session. Don't block (BACKLOG explicitly
        // allows piping to `xxd`/`hexdump` when stdout *is* a TTY) — just
        // warn. err() respects --quiet so this is suppressible.
        if (process.stdout.isTTY === true) {
            ctx.err?.('--out - is writing binary to a TTY; pipe to a tool like xxd or redirect to a file.');
        }
        // Route the JSON ack to stderr so the stdout stream stays pure binary.
        emitStdoutAck(bytes, { attachmentId, out: '<stdout>', size: bytes.byteLength }, ctx.errRaw);
        return;
    }

    safeWriteBinary(resolved.path, bytes, ctx.force);
    ctx.out({
        attachmentId,
        out: resolved.path,
        size: bytes.byteLength,
    });
}
