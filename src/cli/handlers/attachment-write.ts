import type { HandlerContext } from '../handler-context.js';
import { parseId, parseEntryId, parseAttachmentId } from '../ids.js';
import { resolveFile } from '../file-input.js';

/**
 * Resolved file ready for upload. Returned by `setupUpload` only on the
 * execute path; the dry-run path returns `null` after emitting a preview to
 * stdout, signaling the caller to short-circuit.
 *
 * For filesystem sources: `path` is forwarded to the multipart pipeline which
 * streams bytes from disk via `node:fs.openAsBlob` — the CLI never buffers
 * the file in memory, keeping heap usage flat regardless of attachment size.
 *
 * For stdin (`source: 'stdin'`): `contents` holds the drained bytes. A pipe
 * cannot be `openAsBlob`'d (it's not a real filesystem path) so the bytes
 * must be passed in-memory. The 100 MiB cap (`MAX_STDIN_UPLOAD_BYTES`) keeps
 * this safe.
 */
interface ResolvedUpload {
    filename: string;
    /** Filesystem path for `source: 'file'` uploads (streamed via openAsBlob). */
    path: string;
    /** Drained bytes for `source: 'stdin'` uploads. Undefined for file sources. */
    contents?: Uint8Array;
    fd?: number | undefined;
    source: 'file' | 'stdin';
}

/**
 * Shared upload setup: stat the `--file` input, emit the dry-run preview
 * when applicable, otherwise return the resolved path and filename. Returns
 * `null` after handling the dry-run path so callers can early-return
 * without re-checking `ctx.dryRun`.
 *
 * Async because `resolveFile` may drain `process.stdin` for `--file -`
 * (PR3a). The wall-clock deadline and byte cap live inside `resolveFile` so
 * every call site inherits the same SEC #24 protection without duplicating
 * the AbortController plumbing. For filesystem paths the `read` flag is a
 * no-op — bytes stream from disk inside the HTTP pipeline so the CLI never
 * buffers the file in memory (OOM guard for 50 MB+ uploads).
 */
async function setupUpload(
    ctx: HandlerContext,
    action: string,
    // Values are usually numeric path IDs, but the plan-entry id is a GUID
    // string (see addAttachmentToPlanEntry); the map only feeds the dry-run preview.
    idFields: Record<string, number | string>,
): Promise<ResolvedUpload | null> {
    const resolved = await resolveFile(
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
            // Source surfaced for stdin uploads so dry-run callers can spot
            // that no real preview-size is available (a pipe cannot be
            // statted without draining it).
            ...(resolved.source === 'stdin' && { source: 'stdin' }),
        });
        return null;
    }

    return {
        filename: resolved.filename,
        path: resolved.path,
        source: resolved.source,
        ...(resolved.fd !== undefined && { fd: resolved.fd }),
        ...(resolved.contents !== undefined && { contents: resolved.contents }),
    };
}

/**
 * Resolve the actual upload payload for an API call. For filesystem sources,
 * returns `{ path, fd }` so the multipart pipeline can stream bytes from disk via
 * `node:fs.openAsBlob`. For stdin sources, returns the drained `Uint8Array`
 * (a pipe cannot be `openAsBlob`'d — it must be passed in-memory).
 */
function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array {
    if (upload.source === 'stdin' && upload.contents !== undefined) {
        return upload.contents;
    }
    return { path: upload.path, fd: upload.fd };
}

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
