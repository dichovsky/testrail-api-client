/**
 * Unit tests for the binary-output resolver (src/cli/file-output.ts).
 *
 * resolveOut enforces the --out-required + no-clobber-without-force contract
 * for `attachment get`. Dry-run is side-effect-free and skips the existence
 * check by design — covered explicitly so future contributors don't
 * accidentally make dry-run a clobber pre-check.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
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
});
