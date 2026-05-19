import { statSync } from 'node:fs';
import { basename } from 'node:path';

/**
 * Raw inputs for the file-source resolver. Parallels `BodyInput` but for
 * binary attachment uploads. Only `fileFlag` is required; `filenameFlag`
 * overrides the basename-derived filename when callers want to rename on
 * upload (e.g. `./out.bin` → `crash-report.bin`).
 */
export interface FileInput {
    fileFlag?: string;
    filenameFlag?: string;
}

/**
 * Resolution outcome. The execute path now returns only the validated
 * `path` (plus a `filename` and `size`); the actual bytes are streamed from
 * disk inside `requestMultipart` via `node:fs.openAsBlob`. Previous versions
 * eagerly returned a `Uint8Array contents` field — this OOM'd the Node
 * process on 200 MB+ uploads. Callers that need the bytes must now read
 * from `path` themselves; only the multipart pipeline consumes
 * `FileResolution` and it has been migrated to the streaming variant.
 */
export type FileResolution =
    | { ok: true; path: string; filename: string; size: number }
    | { ok: false; error: string };

export interface ResolveFileOptions {
    /**
     * Retained for API compatibility but no longer meaningful — both
     * dry-run and execute paths perform a `statSync` only. The bytes are
     * never read into memory by the CLI layer. Leaving the option in place
     * so existing callers (including tests) do not break and so a future
     * regression that wants pre-flight read validation can re-add it
     * without another signature churn.
     */
    read: boolean;
}

/**
 * Resolve a `--file <path>` upload input. Always stats; never reads bytes
 * into memory (uploads stream from disk inside the HTTP pipeline). Filename
 * derives from `basename(path)` unless `filenameFlag` is provided.
 *
 * Rejects with structured `{ ok: false }` for: missing flag, missing file,
 * and non-regular file (directory, fifo, socket, broken symlink). File
 * read failures now surface inside `requestMultipart` as a TestRailApiError
 * with the underlying ENOENT/EACCES message; this matches the symmetry
 * with network errors (both are I/O failures during the upload phase) and
 * eliminates the previous TOCTOU window in which a file could vanish
 * between the CLI's `readFileSync` and the HTTP send.
 */
export function resolveFile(input: FileInput, _opts: ResolveFileOptions): FileResolution {
    if (input.fileFlag === undefined || input.fileFlag === '') {
        return { ok: false, error: '--file <path> required for upload actions.' };
    }
    const path = input.fileFlag;

    let size: number;
    try {
        const stat = statSync(path);
        if (!stat.isFile()) {
            return { ok: false, error: `--file '${path}' is not a regular file.` };
        }
        size = stat.size;
    } catch (e) {
        return {
            ok: false,
            error: `Cannot stat --file '${path}': ${e instanceof Error ? e.message : String(e)}`,
        };
    }

    const filename =
        input.filenameFlag !== undefined && input.filenameFlag !== '' ? input.filenameFlag : basename(path);

    return { ok: true, path, filename, size };
}
