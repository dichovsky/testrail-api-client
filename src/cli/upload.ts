import type { HandlerContext } from './handler-context.js';
import { resolveFile } from './file-input.js';

/** A validated file/stdin source ready for the multipart request pipeline. */
export interface ResolvedUpload {
    filename: string;
    path: string;
    contents?: Uint8Array;
    fd?: number | undefined;
    source: 'file' | 'stdin';
}

/**
 * Resolve a CLI upload source and emit the common dry-run preview. Files stay
 * descriptor-backed for streaming; stdin is drained under resolveFile's byte
 * and wall-clock limits. A handled dry run returns null.
 */
export async function setupUpload(
    ctx: HandlerContext,
    action: string,
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

/** Convert a resolved source into the SDK's streaming-or-buffer upload input. */
export function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array {
    if (upload.source === 'stdin' && upload.contents !== undefined) {
        return upload.contents;
    }
    return { path: upload.path, fd: upload.fd };
}
