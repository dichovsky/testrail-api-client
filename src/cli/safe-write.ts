import { closeSync, constants, fstatSync, ftruncateSync, lstatSync, openSync, writeFileSync } from 'node:fs';

/**
 * Writes `data` to `path` while defending against symlink-clobber TOCTOU
 * attacks. `resolveOut()` performs an initial lstat check, but the actual
 * write happens after a network round-trip — wide enough for an attacker
 * to plant a symlink in between. This helper closes that window:
 *
 *   - **!force**: writes with the `wx` (O_CREAT | O_EXCL) flag, which the
 *     kernel atomically refuses if **any** entry (regular file, symlink,
 *     directory) exists at the path.
 *   - **force**: opens without truncation, rejects symlinks and non-regular
 *     files, then truncates and writes through the validated descriptor.
 *     O_NOFOLLOW rejects symlinks at open where supported; checking the
 *     descriptor against lstat also protects platforms without that flag.
 *     Replacing the path after validation cannot redirect descriptor writes.
 *
 * The text/binary distinction is just the encoding argument forwarded to
 * `writeFileSync` — both share the same atomicity/symlink guarantees.
 */
type WriteEncoding = 'utf-8';

function safeWrite(path: string, data: Uint8Array | string, force: boolean, encoding?: WriteEncoding): void {
    if (!force) {
        writeFileSync(path, data, { flag: 'wx', ...(encoding !== undefined && { encoding }) });
        return;
    }

    let fd: number | undefined;
    try {
        try {
            // No O_TRUNC: inspecting the opened inode must precede modifying it.
            // O_NONBLOCK lets fstat reject a FIFO without waiting for a reader.
            const flags = constants.O_WRONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0);
            try {
                fd = openSync(path, flags);
            } catch (error) {
                if ((error as { code?: string }).code !== 'ENOENT') throw error;
                // Exclusive creation also refuses dangling links on platforms
                // without O_NOFOLLOW, instead of creating their target files.
                fd = openSync(path, flags | constants.O_CREAT | constants.O_EXCL);
            }
        } catch (error) {
            const code = (error as { code?: string }).code;
            if (code === 'ELOOP' || (code === 'EEXIST' && lstatSync(path).isSymbolicLink())) {
                throw new Error(`Refusing to write through symbolic link '${path}'.`, { cause: error });
            }
            throw error;
        }
        const opened = fstatSync(fd);
        const current = lstatSync(path);
        if (current.isSymbolicLink()) {
            throw new Error(`Refusing to write through symbolic link '${path}'.`);
        }
        if (!opened.isFile() || !current.isFile() || opened.dev !== current.dev || opened.ino !== current.ino) {
            throw new Error(`Refusing to write to a non-regular or replaced file '${path}'.`);
        }
        ftruncateSync(fd);
        writeFileSync(fd, data, encoding === undefined ? undefined : { encoding });
    } catch (error) {
        if (fd !== undefined) {
            try {
                closeSync(fd);
            } catch {
                // Keep the validation/write failure as the primary error.
            }
        }
        throw error;
    }
    closeSync(fd);
}

export function safeWriteBinary(path: string, bytes: Uint8Array, force: boolean): void {
    safeWrite(path, bytes, force);
}

export function safeWriteText(path: string, text: string, force: boolean): void {
    safeWrite(path, text, force, 'utf-8');
}
