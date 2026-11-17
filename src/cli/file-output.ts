import { lstatSync } from 'node:fs';
import type { HandlerContext } from './handler-context.js';
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

/**
 * Sentinel value for the `--out -` Unix-convention stdout target. When the
 * resolver sees this literal string in `outFlag`, the handler writes the
 * payload through the output module's `outPayload` instead of opening a
 * filesystem path.
 * The accompanying JSON ack is redirected to stderr so the binary stream
 * remains uncontaminated.
 */
export const STDOUT_SENTINEL = '-';

/**
 * Raw input for the download destination resolver. Only `outFlag`; no
 * filename override (the user already specified the destination path).
 */
export interface FileOutput {
    outFlag?: string;
}

export type OutputResolution = { ok: true; path: string; target: 'file' | 'stdout' } | { ok: false; error: string };

export interface ResolveOutOptions {
    /** When false, an existing path at `outFlag` is rejected to prevent clobber. */
    force: boolean;
    /** When true, no precondition checks are performed; the path is echoed for the dry-run output. */
    dryRun: boolean;
}

/**
 * Resolve a `--out <path>` download target. Validates flag
 * presence; refuses to overwrite an existing file unless `--force`. Always
 * refuses to write through a symbolic link (even with `--force`) — the
 * target file is never followed, eliminating a TOCTOU symlink-clobber where
 * an attacker plants a broken symlink to a sensitive file during the
 * network round-trip.
 *
 * `--out -` (`STDOUT_SENTINEL`) bypasses filesystem checks entirely — the
 * destination is stdout, no path is opened, and there's no
 * clobber/symlink concern. `outputDownload()` delegates the payload and JSON
 * ack routing to the output module when this target is selected.
 *
 * In dry-run, no filesystem precondition is checked — dry-run is meant to
 * be side-effect-free and not act as a clobber pre-check (the real run
 * enforces the no-clobber + no-symlink rule).
 */
export function resolveOut(input: FileOutput, opts: ResolveOutOptions): OutputResolution {
    if (input.outFlag === undefined || input.outFlag === '') {
        return { ok: false, error: '--out <path> required for binary download.' };
    }
    const path = input.outFlag;

    if (path === STDOUT_SENTINEL) {
        return { ok: true, path: '<stdout>', target: 'stdout' };
    }

    if (opts.dryRun) {
        return { ok: true, path, target: 'file' };
    }

    // lstatSync (not existsSync) so a broken symlink doesn't slip past the
    // clobber check — existsSync follows symlinks and returns false for a
    // dangling target, letting the subsequent write follow the link and
    // overwrite an attacker-chosen file.
    let stat: ReturnType<typeof lstatSync>;
    try {
        stat = lstatSync(path);
    } catch (err) {
        if ((err as { code?: string }).code === 'ENOENT') {
            return { ok: true, path, target: 'file' };
        }
        return {
            ok: false,
            error: `Cannot stat '${path}': ${(err as Error).message}`,
        };
    }

    if (stat.isSymbolicLink()) {
        return {
            ok: false,
            error: `Refusing to write through symbolic link '${path}'.`,
        };
    }

    if (!opts.force) {
        return {
            ok: false,
            error: `Refusing to overwrite '${path}'; pass --force to overwrite.`,
        };
    }

    return { ok: true, path, target: 'file' };
}
