/**
 * Unit tests for the binary-output resolver (src/cli/file-output.ts).
 *
 * resolveOut enforces the --out-required + no-clobber-without-force +
 * no-symlink-follow contract for `attachment get`. Dry-run is
 * side-effect-free and skips the existence check by design — covered
 * explicitly so future contributors don't accidentally make dry-run a
 * clobber pre-check.
 *
 * Symlink-clobber coverage: a broken/dangling symlink at the --out path
 * must be refused (existsSync returns false for dangling links, which
 * would historically let the network round-trip act as the TOCTOU window
 * for an attacker swapping in a sensitive target). lstatSync catches the
 * link itself, regardless of where it points.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveOut } from '../src/cli/file-output.js';

describe('resolveOut', () => {
    let tmp: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-cli-out-'));
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('rejects missing --out flag', () => {
        const r = resolveOut({}, { force: false, dryRun: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--out <path> required');
    });

    it('rejects empty --out flag', () => {
        const r = resolveOut({ outFlag: '' }, { force: false, dryRun: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('--out <path> required');
    });

    it('accepts a new path', () => {
        const p = join(tmp, 'new.bin');
        const r = resolveOut({ outFlag: p }, { force: false, dryRun: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.path).toBe(p);
    });

    it('refuses to overwrite an existing path without --force', () => {
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'x');
        const r = resolveOut({ outFlag: p }, { force: false, dryRun: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('Refusing to overwrite');
    });

    it('overwrites with --force', () => {
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'x');
        const r = resolveOut({ outFlag: p }, { force: true, dryRun: false });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.path).toBe(p);
    });

    it('dry-run skips clobber check even when path exists', () => {
        const p = join(tmp, 'exists.bin');
        writeFileSync(p, 'x');
        const r = resolveOut({ outFlag: p }, { force: false, dryRun: true });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.path).toBe(p);
    });

    // Symlink TOCTOU defenses --------------------------------------------------

    it('refuses a broken symlink without --force', () => {
        const target = join(tmp, 'does-not-exist');
        const link = join(tmp, 'link.bin');
        symlinkSync(target, link);
        const r = resolveOut({ outFlag: link }, { force: false, dryRun: false });
        expect(r.ok).toBe(false);
        // Broken symlinks must be rejected by the symlink check (not by the
        // "exists" check) so the error mentions the link, not clobber.
        if (!r.ok) expect(r.error).toContain('symbolic link');
    });

    it('refuses a broken symlink even with --force', () => {
        const target = join(tmp, 'does-not-exist');
        const link = join(tmp, 'link.bin');
        symlinkSync(target, link);
        const r = resolveOut({ outFlag: link }, { force: true, dryRun: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('symbolic link');
    });

    it('refuses a symlink pointing at an existing file even with --force', () => {
        const real = join(tmp, 'sensitive.txt');
        writeFileSync(real, 'secret');
        const link = join(tmp, 'link.bin');
        symlinkSync(real, link);
        const r = resolveOut({ outFlag: link }, { force: true, dryRun: false });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('symbolic link');
    });

    it('dry-run does not inspect symlinks (side-effect-free preview)', () => {
        const target = join(tmp, 'does-not-exist');
        const link = join(tmp, 'link.bin');
        symlinkSync(target, link);
        const r = resolveOut({ outFlag: link }, { force: false, dryRun: true });
        expect(r.ok).toBe(true);
    });
});
