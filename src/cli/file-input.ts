import { readFileSync, statSync } from 'node:fs';
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
 * Resolution outcome. `contents` is populated only when `opts.read` is true
 * (execute path); the dry-run path stops after stat to keep dry-run cheap
 * for large files (TestRail accepts up to 256 MB).
 */
export type FileResolution =
    | { ok: true; path: string; filename: string; size: number; contents?: Uint8Array }
    | { ok: false; error: string };

export interface ResolveFileOptions {
    /** True for execute path (reads bytes into Uint8Array); false for dry-run (stat only). */
    read: boolean;
}

/**
 * Resolve a `--file <path>` upload input. Always stats first; reads bytes
 * only when `opts.read` is true. Filename derives from `basename(path)`
 * unless `filenameFlag` is provided.
 *
 * Rejects with structured `{ ok: false }` for: missing flag, missing file,
 * non-regular file (directory, fifo, socket, broken symlink), and unreadable
 * file contents when reading is requested.
 */
export function resolveFile(input: FileInput, opts: ResolveFileOptions): FileResolution {
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

    if (!opts.read) {
        return { ok: true, path, filename, size };
    }

    let contents: Uint8Array;
    try {
        const buf = readFileSync(path);
        contents = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch (e) {
        return {
            ok: false,
            error: `Cannot read --file '${path}': ${e instanceof Error ? e.message : String(e)}`,
        };
    }

    return { ok: true, path, filename, size, contents };
}
