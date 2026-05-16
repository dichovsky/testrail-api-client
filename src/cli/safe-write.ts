import { lstatSync, writeFileSync } from 'node:fs';

/**
 * Writes `data` to `path` while defending against symlink-clobber TOCTOU
 * attacks. `resolveOut()` performs an initial lstat check, but the actual
 * write happens after a network round-trip — wide enough for an attacker
 * to plant a symlink in between. This helper closes that window:
 *
 *   - **!force**: writes with the `wx` (O_CREAT | O_EXCL) flag, which the
 *     kernel atomically refuses if **any** entry (regular file, symlink,
 *     directory) exists at the path.
 *   - **force**: re-runs `lstatSync` immediately before the write to reject
 *     symlinks that appeared during the network round-trip; then writes
 *     with the `w` flag. The residual TOCTOU window between this final
 *     lstat and the open is microseconds, vs the seconds-wide pre-write
 *     window covered by the original bug.
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

    try {
        const stat = lstatSync(path);
        if (stat.isSymbolicLink()) {
            throw new Error(`Refusing to write through symbolic link '${path}'.`);
        }
    } catch (err) {
        if ((err as { code?: string }).code !== 'ENOENT') {
            throw err;
        }
    }

    writeFileSync(path, data, { flag: 'w', ...(encoding !== undefined && { encoding }) });
}

export function safeWriteBinary(path: string, bytes: Uint8Array, force: boolean): void {
    safeWrite(path, bytes, force);
}

export function safeWriteText(path: string, text: string, force: boolean): void {
    safeWrite(path, text, force, 'utf-8');
}
