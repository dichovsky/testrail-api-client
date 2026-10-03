import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    closeSync,
    existsSync,
    fstatSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveBody } from '../src/cli/body.js';
import { resolveFile } from '../src/cli/file-input.js';
import { safeWriteText } from '../src/cli/safe-write.js';
import { AddCasePayloadSchema } from '../src/schemas.js';

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        constants: { ...actual.constants, O_NOFOLLOW: undefined, O_NONBLOCK: undefined },
        closeSync: vi.fn(actual.closeSync),
    };
});

describe('file operations without optional POSIX open flags', () => {
    let directory: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'testrail-file-platform-'));
    });
    afterEach(() => {
        vi.resetAllMocks();
        rmSync(directory, { recursive: true, force: true });
    });

    it('reads a regular JSON input and closes its descriptor', () => {
        const path = join(directory, 'payload.json');
        writeFileSync(path, '{"title":"Portable input"}');
        expect(resolveBody({ dataFileFlag: path }, AddCasePayloadSchema)).toEqual({
            ok: true,
            payload: { title: 'Portable input' },
            source: 'file',
        });
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])('preserves upload descriptor ownership when read is %s', async (read) => {
        const path = join(directory, 'upload.bin');
        writeFileSync(path, 'file bytes');
        const result = await resolveFile({ fileFlag: path }, { read });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        expect(result.size).toBe(10);
        expect(result.contents).toBeUndefined();
        if (read) {
            const fd = result.fd;
            if (fd === undefined) throw new Error('Upload must own a descriptor');
            expect(closeSync).not.toHaveBeenCalled();
            try {
                expect(fstatSync(fd).isFile()).toBe(true);
            } finally {
                closeSync(fd);
            }
        } else {
            expect(result.fd).toBeUndefined();
            expect(closeSync).toHaveBeenCalledTimes(1);
        }
    });

    it('overwrites an existing regular download through its held descriptor', () => {
        const path = join(directory, 'download.txt');
        writeFileSync(path, 'longer original content');
        safeWriteText(path, 'new', true);
        expect(readFileSync(path, 'utf8')).toBe('new');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it('creates a new download exclusively', () => {
        const path = join(directory, 'new.txt');
        safeWriteText(path, 'new', true);
        expect(readFileSync(path, 'utf8')).toBe('new');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it.skipIf(process.platform === 'win32')('rejects a followed output symlink before modifying its target', () => {
        const target = join(directory, 'sentinel.txt');
        const link = join(directory, 'download.txt');
        writeFileSync(target, 'keep sentinel');
        symlinkSync(target, link);
        expect(() => safeWriteText(link, 'replace sentinel', true)).toThrow(/symbolic link/);
        expect(readFileSync(target, 'utf8')).toBe('keep sentinel');
        expect(closeSync).toHaveBeenCalledTimes(1);
    });

    it.skipIf(process.platform === 'win32')('rejects a dangling output symlink without creating its target', () => {
        const target = join(directory, 'missing.txt');
        const link = join(directory, 'download.txt');
        symlinkSync(target, link);
        expect(() => safeWriteText(link, 'new', true)).toThrow(/symbolic link/);
        expect(existsSync(target)).toBe(false);
        expect(closeSync).not.toHaveBeenCalled();
    });
});
