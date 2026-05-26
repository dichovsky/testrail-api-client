/**
 * Unit tests for safeWriteBinary / safeWriteText (src/cli/safe-write.ts).
 *
 * These helpers close the TOCTOU window between resolveOut() and the actual
 * write — resolveOut runs BEFORE the network round-trip, so an attacker has
 * seconds to plant a symlink. safeWrite* enforces the no-follow-symlink rule
 * a second time, immediately before the write syscall.
 *
 * Tested behaviors:
 *   - !force: uses O_EXCL (`wx`) so any path that appeared mid-flight is
 *     refused atomically.
 *   - force: lstats again and refuses symlinks; regular existing files are
 *     overwritten as expected.
 *   - Encoding: text helper writes UTF-8, byte length matches.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { safeWriteBinary, safeWriteText } from '../src/cli/safe-write.js';

describe('safeWriteBinary', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-safe-write-bin-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('writes to a new path without force', () => {
        const p = join(tmp, 'new.bin');
        safeWriteBinary(p, new Uint8Array([1, 2, 3, 4]), false);
        expect(Array.from(readFileSync(p))).toEqual([1, 2, 3, 4]);
    });

    it('refuses an existing path without force (atomic EEXIST)', () => {
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'original');
        expect(() => safeWriteBinary(p, new Uint8Array([0xff]), false)).toThrow();
        // Original content must be intact — wx is atomic, no partial write.
        expect(readFileSync(p, 'utf-8')).toBe('original');
    });

    it('refuses a symlink that appeared between resolveOut and write (force)', () => {
        const real = join(tmp, 'sensitive.txt');
        writeFileSync(real, 'secret');
        const link = join(tmp, 'out.bin');
        symlinkSync(real, link);
        expect(() => safeWriteBinary(link, new Uint8Array([0xff]), true)).toThrow(/symbolic link/);
        // Symlink target must not have been overwritten.
        expect(readFileSync(real, 'utf-8')).toBe('secret');
    });

    it('refuses a broken symlink even with force', () => {
        const link = join(tmp, 'out.bin');
        symlinkSync(join(tmp, 'nowhere'), link);
        expect(() => safeWriteBinary(link, new Uint8Array([0xff]), true)).toThrow(/symbolic link/);
        // The link target was never created — confirm no file was written through it.
        expect(existsSync(join(tmp, 'nowhere'))).toBe(false);
    });

    it('overwrites a regular existing file with force', () => {
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'original');
        safeWriteBinary(p, new Uint8Array([0x42]), true);
        expect(Array.from(readFileSync(p))).toEqual([0x42]);
    });

    it('writes successfully when target does not exist (force + ENOENT short-circuits the lstat check)', () => {
        // Exercises the swallow path of the lstat-error handler in
        // src/cli/safe-write.ts: lstatSync throws ENOENT, the catch
        // evaluates `code !== 'ENOENT'` to FALSE, the error is swallowed,
        // and the write proceeds. Without this test the ENOENT-tolerant
        // code path would be unverified.
        const p = join(tmp, 'fresh.bin');
        expect(existsSync(p)).toBe(false);
        safeWriteBinary(p, new Uint8Array([0xab, 0xcd]), true);
        expect(Array.from(readFileSync(p))).toEqual([0xab, 0xcd]);
    });
});

describe('safeWriteText', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-safe-write-text-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('writes UTF-8 text to a new path without force', () => {
        const p = join(tmp, 'new.txt');
        safeWriteText(p, 'héllo', false);
        expect(readFileSync(p, 'utf-8')).toBe('héllo');
    });

    it('refuses an existing path without force', () => {
        const p = join(tmp, 'exists.txt');
        writeFileSync(p, 'original', 'utf-8');
        expect(() => safeWriteText(p, 'new', false)).toThrow();
        expect(readFileSync(p, 'utf-8')).toBe('original');
    });

    it('refuses a symlink even with force', () => {
        const real = join(tmp, 'sensitive.txt');
        writeFileSync(real, 'secret', 'utf-8');
        const link = join(tmp, 'out.txt');
        symlinkSync(real, link);
        expect(() => safeWriteText(link, 'pwned', true)).toThrow(/symbolic link/);
        expect(readFileSync(real, 'utf-8')).toBe('secret');
    });

    it('overwrites a regular existing file with force', () => {
        const p = join(tmp, 'exists.txt');
        writeFileSync(p, 'original', 'utf-8');
        safeWriteText(p, 'replaced', true);
        expect(readFileSync(p, 'utf-8')).toBe('replaced');
    });
});
