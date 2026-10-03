import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    closeSync,
    constants,
    existsSync,
    fstatSync,
    lstatSync,
    mkdtempSync,
    openSync,
    readFileSync,
    renameSync,
    rmSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { safeWriteBinary, safeWriteText } from '../src/cli/safe-write.js';

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        closeSync: vi.fn(actual.closeSync),
        fstatSync: vi.fn(actual.fstatSync),
        lstatSync: vi.fn(actual.lstatSync),
        openSync: vi.fn(actual.openSync),
        writeFileSync: vi.fn(actual.writeFileSync),
    };
});

describe.skipIf(process.platform === 'win32')('forced download descriptor safety', () => {
    let directory: string;
    let output: string;
    let held: string;
    let sentinel: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-forced-write-'));
        output = join(directory, 'download');
        held = join(directory, 'original');
        sentinel = join(directory, 'sentinel');
        writeFileSync(output, 'old download');
        writeFileSync(sentinel, 'keep sentinel');
    });
    afterEach(() => {
        vi.resetAllMocks();
        rmSync(directory, { recursive: true, force: true });
    });

    function replaceWithLink(): void {
        renameSync(output, held);
        symlinkSync(sentinel, output);
    }

    it('refuses a symlink substituted immediately before open', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        vi.mocked(openSync).mockImplementationOnce((path, flags, mode) => {
            replaceWithLink();
            return actual.openSync(path, flags, mode);
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow(/symbolic link/);
        expect(readFileSync(sentinel, 'utf8')).toBe('keep sentinel');
        expect(readFileSync(held, 'utf8')).toBe('old download');
    });

    it('refuses a symlink followed on a platform without O_NOFOLLOW before truncating its target', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        let opened: number | undefined;
        vi.mocked(openSync).mockImplementationOnce((path, flags, mode) => {
            replaceWithLink();
            if (typeof flags !== 'number') throw new Error('Expected numeric open flags');
            opened = actual.openSync(path, flags & ~constants.O_NOFOLLOW, mode);
            return opened;
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow(/symbolic link/);
        expect(readFileSync(sentinel, 'utf8')).toBe('keep sentinel');
        expect(closeSync).toHaveBeenCalledWith(opened);
        if (opened === undefined) throw new Error('Expected an opened descriptor');
        const descriptor = opened;
        expect(() => actual.fstatSync(descriptor)).toThrow();
    });

    it('writes only the held inode when the path becomes a symlink after validation', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        vi.mocked(lstatSync).mockImplementationOnce((...args) => {
            const result = actual.lstatSync(...args);
            replaceWithLink();
            return result;
        });
        safeWriteBinary(output, new Uint8Array([1, 2, 3]), true);
        expect(readFileSync(sentinel, 'utf8')).toBe('keep sentinel');
        expect(Array.from(readFileSync(held))).toEqual([1, 2, 3]);
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('never creates a dangling link target when O_NOFOLLOW is unavailable', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        const missing = join(directory, 'must-not-be-created');
        unlinkSync(output);
        symlinkSync(missing, output);
        vi.mocked(openSync).mockImplementation((path, flags, mode) => {
            if (typeof flags !== 'number') throw new Error('Expected numeric open flags');
            return actual.openSync(path, flags & ~constants.O_NOFOLLOW, mode);
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow(/symbolic link/);
        expect(existsSync(missing)).toBe(false);
        expect(closeSync).not.toHaveBeenCalled();
    });

    it('does not overwrite a file that appears during exclusive creation', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        unlinkSync(output);
        vi.mocked(openSync).mockImplementation((path, flags, mode) => {
            if (typeof flags === 'number' && (flags & constants.O_CREAT) !== 0) {
                actual.writeFileSync(output, 'concurrent creation');
            }
            return actual.openSync(path, flags, mode);
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow(/EEXIST/);
        expect(readFileSync(output, 'utf8')).toBe('concurrent creation');
        expect(closeSync).not.toHaveBeenCalled();
    });

    it('refuses a different regular inode substituted after open', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        vi.mocked(openSync).mockImplementationOnce((path, flags, mode) => {
            const fd = actual.openSync(path, flags, mode);
            renameSync(output, held);
            actual.writeFileSync(output, 'replacement');
            return fd;
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow(/replaced file/);
        expect(readFileSync(held, 'utf8')).toBe('old download');
        expect(readFileSync(output, 'utf8')).toBe('replacement');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('refuses a non-regular opened file', () => {
        expect(() => safeWriteText('/dev/null', 'downloaded', true)).toThrow(/non-regular/);
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('closes the descriptor when validation fails and retains that failure if closing also fails', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        vi.mocked(fstatSync).mockImplementationOnce(() => {
            throw new Error('stat failed');
        });
        vi.mocked(closeSync).mockImplementationOnce((fd) => {
            actual.closeSync(fd);
            throw new Error('close failed');
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow('stat failed');
        expect(readFileSync(output, 'utf8')).toBe('old download');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('closes the descriptor after a write failure', () => {
        vi.mocked(writeFileSync).mockImplementationOnce(() => {
            throw new Error('write failed');
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow('write failed');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('reports a close failure after an otherwise successful write', async () => {
        const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
        vi.mocked(closeSync).mockImplementationOnce((fd) => {
            actual.closeSync(fd);
            throw new Error('close failed');
        });
        expect(() => safeWriteText(output, 'downloaded', true)).toThrow('close failed');
        expect(readFileSync(output, 'utf8')).toBe('downloaded');
    });
});
