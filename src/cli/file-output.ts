import { existsSync } from 'node:fs';

/**
 * Raw input for the binary-download output resolver. Only `outFlag`; no
 * filename override (the user already specified the destination path).
 */
export interface FileOutput {
    outFlag?: string;
}

export type OutputResolution = { ok: true; path: string } | { ok: false; error: string };

export interface ResolveOutOptions {
    /** When false, an existing path at `outFlag` is rejected to prevent clobber. */
    force: boolean;
    /** When true, no precondition checks are performed; the path is echoed for the dry-run output. */
    dryRun: boolean;
}

/**
 * Resolve a `--out <path>` binary-download output target. Validates flag
 * presence; refuses to overwrite an existing file unless `--force`. In
 * dry-run, no filesystem precondition is checked — dry-run is meant to be
 * side-effect-free and not act as a clobber pre-check (the real run enforces
 * the no-clobber rule).
 */
export function resolveOut(input: FileOutput, opts: ResolveOutOptions): OutputResolution {
    if (input.outFlag === undefined || input.outFlag === '') {
        return { ok: false, error: '--out <path> required for binary download.' };
    }
    const path = input.outFlag;

    if (!opts.dryRun && !opts.force && existsSync(path)) {
        return {
            ok: false,
            error: `Refusing to overwrite '${path}'; pass --force to overwrite.`,
        };
    }

    return { ok: true, path };
}
