import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveFile } from '../file-input.js';

/**
 * Resolved file ready for upload. Returned by `setupUpload` only on the
 * execute path; the dry-run path returns `null` after emitting a preview to
 * stdout, signaling the caller to short-circuit.
 *
 * `path` is forwarded to the multipart pipeline which streams bytes from
 * disk via `node:fs.openAsBlob` — the CLI never buffers the file in memory,
 * keeping heap usage flat regardless of attachment size (200 MB+ supported
 * on Node's default heap).
 */
interface ResolvedUpload {
    filename: string;
    path: string;
}

/**
 * Shared upload setup: stat the `--file` input, emit the dry-run preview
 * when applicable, otherwise return the resolved path and filename. Returns
 * `null` after handling the dry-run path so callers can early-return
 * without re-checking `ctx.dryRun`.
 *
 * The `read` flag passed to `resolveFile` is now a no-op — both code paths
 * stat only and never load the file into memory. The CLI used to call
 * `readFileSync(path)` here, which OOM'd Node on 50 MB+ uploads.
 */
function setupUpload(ctx: HandlerContext, action: string, idFields: Record<string, number>): ResolvedUpload | null {
    const resolved = resolveFile(
        {
            ...(ctx.args.file !== undefined && { fileFlag: ctx.args.file }),
            ...(ctx.args.filename !== undefined && { filenameFlag: ctx.args.filename }),
        },
        { read: !ctx.dryRun },
    );
    if (!resolved.ok) throw new Error(resolved.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action,
            ...idFields,
            file: resolved.path,
            filename: resolved.filename,
            size: resolved.size,
        });
        return null;
    }

    return { filename: resolved.filename, path: resolved.path };
}

export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void> {
    const caseId = parseId(ctx.args.pathParams[0], 'case_id');
    const upload = setupUpload(ctx, 'attachment add-to-case', { caseId });
    if (upload === null) return;
    ctx.out(await ctx.client.addAttachmentToCase(caseId, { path: upload.path }, upload.filename));
}

export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void> {
    const resultId = parseId(ctx.args.pathParams[0], 'result_id');
    const upload = setupUpload(ctx, 'attachment add-to-result', { resultId });
    if (upload === null) return;
    ctx.out(await ctx.client.addAttachmentToResult(resultId, { path: upload.path }, upload.filename));
}

export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    const upload = setupUpload(ctx, 'attachment add-to-run', { runId });
    if (upload === null) return;
    ctx.out(await ctx.client.addAttachmentToRun(runId, { path: upload.path }, upload.filename));
}

export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const upload = setupUpload(ctx, 'attachment add-to-plan', { planId });
    if (upload === null) return;
    ctx.out(await ctx.client.addAttachmentToPlan(planId, { path: upload.path }, upload.filename));
}

export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void> {
    const planId = parseId(ctx.args.pathParams[0], 'plan_id');
    const entryId = parseId(ctx.args.pathParams[1], 'entry_id');
    const upload = setupUpload(ctx, 'attachment add-to-plan-entry', { planId, entryId });
    if (upload === null) return;
    ctx.out(
        await ctx.client.addAttachmentToPlanEntry(planId, entryId, { path: upload.path }, upload.filename),
    );
}

/**
 * Destructive: deletes the attachment permanently. Gated by `--yes`; if
 * `--dry-run` is also passed, dry-run wins (no API call) and emits a preview
 * with `destructive: true` so callers can spot it in audit output.
 */
export async function handleAttachmentDelete(ctx: HandlerContext): Promise<void> {
    const attachmentId = parseId(ctx.args.pathParams[0], 'attachment_id');

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'attachment delete',
            attachmentId,
            destructive: true,
        });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteAttachment(attachmentId);
    ctx.out({ attachmentId, deleted: true });
}
