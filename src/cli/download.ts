import type { HandlerContext } from './handler-context.js';
import { resolveOut } from './file-output.js';
import { safeWriteBinary, safeWriteText } from './safe-write.js';

/** Command-specific facts; destination handling and output belong to this module. */
export interface DownloadSpec {
    readonly action: string;
    readonly idFields: Readonly<Record<string, number | string>>;
    /** Called only after destination checks and the dry-run branch. */
    readonly load: () => Promise<string | ArrayBuffer>;
}

/** Validate, preview, fetch, and emit a CLI download without changing its payload kind. */
export async function outputDownload(
    ctx: Pick<HandlerContext, 'args' | 'dryRun' | 'force' | 'out' | 'outPayload'>,
    download: DownloadSpec,
): Promise<void> {
    const resolved = resolveOut(
        { ...(ctx.args.out !== undefined && { outFlag: ctx.args.out }) },
        { force: ctx.force, dryRun: ctx.dryRun },
    );
    if (!resolved.ok) throw new Error(resolved.error);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: download.action,
            ...download.idFields,
            out: resolved.path,
        });
        return;
    }

    const result = await download.load();
    const payload = typeof result === 'string' ? result : new Uint8Array(result);
    const acknowledgement = {
        ...download.idFields,
        out: resolved.path,
        size: typeof payload === 'string' ? Buffer.byteLength(payload, 'utf-8') : payload.byteLength,
    };

    if (resolved.target === 'stdout') {
        ctx.outPayload(payload, acknowledgement);
        return;
    }

    if (typeof payload === 'string') {
        safeWriteText(resolved.path, payload, ctx.force);
    } else {
        safeWriteBinary(resolved.path, payload, ctx.force);
    }
    ctx.out(acknowledgement);
}
