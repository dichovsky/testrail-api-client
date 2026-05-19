import { lstatSync } from 'node:fs';

/**
 * Sentinel value for the `--out -` Unix-convention stdout target. When the
 * resolver sees this literal string in `outFlag`, the handler writes the
 * payload to `process.stdout.write()` instead of opening a filesystem path.
 * The accompanying JSON ack is redirected to stderr so the binary stream
 * remains uncontaminated.
 */
export const STDOUT_SENTINEL = '-';

/**
 * Raw input for the binary-download output resolver. Only `outFlag`; no
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
 * Resolve a `--out <path>` binary-download output target. Validates flag
 * presence; refuses to overwrite an existing file unless `--force`. Always
 * refuses to write through a symbolic link (even with `--force`) — the
 * target file is never followed, eliminating a TOCTOU symlink-clobber where
 * an attacker plants a broken symlink to a sensitive file during the
 * network round-trip.
 *
 * `--out -` (`STDOUT_SENTINEL`) bypasses filesystem checks entirely — the
 * destination is `process.stdout`, no path is opened, and there's no
 * clobber/symlink concern. The handler is responsible for routing the JSON
 * ack to stderr when this target is selected.
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
