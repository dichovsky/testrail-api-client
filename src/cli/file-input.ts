import { openSync, fstatSync, closeSync, constants } from 'node:fs';
import { basename } from 'node:path';
import { MAX_STDIN_UPLOAD_BYTES, STDIN_READ_TIMEOUT_MS } from '../constants.js';
import type { CliStdin } from './stdin.js';

/**
 * Sentinel value for the `--file -` Unix-convention stdin source. When the
 * resolver sees this literal string in `fileFlag`, it reads binary content
 * from the supplied stdin instead of opening a filesystem path.
 *
 * Centralized here so the dispatch (`index.ts`) and the resolver agree on
 * one byte-for-byte comparison; no other call site should hand-roll the
 * `=== '-'` check.
 */
const STDIN_SENTINEL = '-';

/**
 * Raw inputs for the file-source resolver. Parallels `BodyInput` but for
 * binary attachment uploads. Only `fileFlag` is required; `filenameFlag`
 * overrides the basename-derived filename when callers want to rename on
 * upload (e.g. `./out.bin` → `crash-report.bin`).
 *
 * When `fileFlag === '-'` (`STDIN_SENTINEL`), the resolver reads bytes
 * from the supplied stdin. The default filename in that case is `stdin` —
 * callers are encouraged to pass `--filename` so TestRail stores a sensible
 * value.
 */
export interface FileInput {
    fileFlag?: string;
    filenameFlag?: string;
}

/**
 * Resolution outcome. Filesystem inputs include their validated path,
 * filename, size, and an opened descriptor for execution. The request
 * pipeline streams the file through `node:fs.openAsBlob`. For stdin
 * (`source: 'stdin'`), the bytes are eagerly read into `contents` because a
 * pipe cannot be rewound. Dry-run for stdin reports `size: 0` and no
 * `contents` (preview-without-drain).
 */
export type FileResolution =
    | {
          ok: true;
          /** Display path: filesystem path or `'<stdin>'` for the stdin source. */
          path: string;
          filename: string;
          size: number;
          contents?: Uint8Array;
          fd?: number | undefined;
          /** `'file'` for filesystem reads, `'stdin'` for the `--file -` sentinel. */
          source: 'file' | 'stdin';
      }
    | { ok: false; error: string };

export interface ResolveFileOptions {
    /**
     * Keep the opened file descriptor for execution when true. For stdin,
     * true drains the supplied input; false previews without consuming it.
     */
    read: boolean;
}

/**
 * Resolve a `--file <path>` upload input. Async because the stdin source
 * (`--file -`) must drain the supplied stdin to read the upload payload.
 *
 * - Filesystem path: stats first; never reads bytes into memory (streaming
 *   upload pipeline). Filename derives from `basename(path)` unless
 *   `filenameFlag` is provided.
 * - Stdin (`-`): rejects when `stdin.isTTY` is true (no piped input);
 *   reads under a byte cap (`MAX_STDIN_UPLOAD_BYTES`) and a wall-clock
 *   deadline (`STDIN_READ_TIMEOUT_MS`) to defend against memory exhaustion
 *   and slowloris-style producers that never EOF. Default filename is
 *   `stdin`; callers should pass `--filename` for a meaningful value.
 *
 * Rejects with structured `{ ok: false }` for: missing flag, missing file,
 * non-regular file (directory, fifo, socket, broken symlink), TTY-attached
 * stdin, stdin exceeding the byte cap, and stdin not closing within the
 * deadline.
 */
export async function resolveFile(
    input: FileInput,
    opts: ResolveFileOptions,
    stdin: Pick<CliStdin, 'isTTY' | 'readBinary'>,
): Promise<FileResolution> {
    if (input.fileFlag === undefined || input.fileFlag === '') {
        return { ok: false, error: '--file <path> required for upload actions.' };
    }

    if (input.fileFlag === STDIN_SENTINEL) {
        return resolveFromStdin(input, opts, stdin);
    }

    const path = input.fileFlag;

    let size: number;
    let fd: number | undefined;
    try {
        // Open FIFOs without waiting for a writer so fstat can reject them.
        // Nonblocking mode does not alter regular-file reads.
        const flags = constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0);
        fd = openSync(path, flags);

        const stat = fstatSync(fd);
        if (!stat.isFile()) {
            closeSync(fd);
            return { ok: false, error: `--file '${path}' is not a regular file.` };
        }
        size = stat.size;

        if (!opts.read) {
            closeSync(fd);
            fd = undefined;
        }
    } catch (e) {
        if (fd !== undefined) {
            try {
                closeSync(fd);
            } catch {
                // Ignore close errors
            }
        }
        return {
            ok: false,
            error: `Cannot stat --file '${path}': ${e instanceof Error ? e.message : String(e)}`,
        };
    }

    const filename =
        input.filenameFlag !== undefined && input.filenameFlag !== '' ? input.filenameFlag : basename(path);

    return {
        ok: true,
        path,
        filename,
        size,
        source: 'file',
        ...(fd !== undefined && { fd }),
    };
}

/**
 * Read binary content from the supplied stdin under a byte cap and a wall-clock
 * deadline, then resolve a `FileResolution`. Separated from the filesystem
 * path so the TTY rejection and timeout setup are visible in one place.
 *
 * Dry-run path: returns immediately with size 0 and no contents — draining
 * stdin would consume a pipe that the user expects to be re-runnable.
 */
async function resolveFromStdin(
    input: FileInput,
    opts: ResolveFileOptions,
    stdin: Pick<CliStdin, 'isTTY' | 'readBinary'>,
): Promise<FileResolution> {
    if (stdin.isTTY) {
        return {
            ok: false,
            error: "--file '-' requires stdin to be piped (e.g. `cat file.bin | testrail attachment add-to-case ...`).",
        };
    }

    const filename = input.filenameFlag !== undefined && input.filenameFlag !== '' ? input.filenameFlag : 'stdin';

    if (!opts.read) {
        // Dry-run: don't drain the pipe (a pipe cannot be rewound, and the
        // user expects --dry-run to be side-effect-free). Report size 0 so
        // the preview is honest about what hasn't been read yet.
        return { ok: true, path: '<stdin>', filename, size: 0, source: 'stdin' };
    }

    let bytes: Uint8Array;
    try {
        bytes = await stdin.readBinary(MAX_STDIN_UPLOAD_BYTES, STDIN_READ_TIMEOUT_MS);
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }

    return { ok: true, path: '<stdin>', filename, size: bytes.byteLength, contents: bytes, source: 'stdin' };
}
