/**
 * Filesystem-failure coverage for install-skill.ts and uninstall-skill.ts.
 *
 * The happy-path suites (install-skill.test.ts / uninstall-skill.test.ts) run
 * against a real tmpdir, so they cannot reach the `catch` arms that handle a
 * mid-operation filesystem error (rename/lstat/unlink throwing after the
 * surrounding checks passed). Those are TOCTOU-shaped races in production; here
 * we drive them deterministically with a file-scoped `vi.mock('node:fs')` that
 * makes a single chosen call throw. Kept in its own file so the mock never
 * leaks into the real-fs suites.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Per-call throw controls. The factory is hoisted, so it captures these
// references; each test arms the relevant flag and resets in beforeEach.
const fsControl = vi.hoisted(() => ({
    throwOnRename: false,
    throwOnUnlinkTemp: false,
    throwOnLstat: false,
    throwOnUnlinkTarget: false,
    // When true, the armed throw is a bare string instead of an Error, so the
    // handlers' `e instanceof Error ? e.message : String(e)` false arm runs.
    throwNonError: false,
}));

// Throw an Error (with a `code`) or a bare string, per fsControl.throwNonError.
// The string form exercises the non-Error branch of the handlers' message
// extraction.
function raise(code: string, msg: string): never {
    if (fsControl.throwNonError) {
        // Throw a non-Error to exercise the handlers' String(e) arm. Typed
        // `unknown` so this is an intentional non-Error throw.
        const nonError: unknown = `${code}: ${msg}`;
        throw nonError;
    }
    throw Object.assign(new Error(`${code}: ${msg}`), { code });
}

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        renameSync: (...args: Parameters<typeof actual.renameSync>) => {
            if (fsControl.throwOnRename) raise('EACCES', 'permission denied, rename');
            return actual.renameSync(...args);
        },
        unlinkSync: (...args: Parameters<typeof actual.unlinkSync>) => {
            const p = String(args[0]);
            // The temp-file cleanup unlink (install) and the target unlink
            // (uninstall) hit the same mock; disambiguate by path suffix.
            if (fsControl.throwOnUnlinkTemp && p.includes('SKILL.md.tmp.')) {
                throw Object.assign(new Error('ENOENT: temp already gone, unlink'), { code: 'ENOENT' });
            }
            if (fsControl.throwOnUnlinkTarget && p.endsWith('SKILL.md'))
                raise('EPERM', 'operation not permitted, unlink');
            return actual.unlinkSync(...args);
        },
        lstatSync: ((...args: Parameters<typeof actual.lstatSync>) => {
            if (fsControl.throwOnLstat && String(args[0]).endsWith('SKILL.md'))
                raise('EACCES', 'permission denied, lstat');
            return actual.lstatSync(...args);
        }) as typeof actual.lstatSync,
    };
});

const { runInstallSkill } = await import('../src/cli/install-skill.js');
const { runUninstallSkill } = await import('../src/cli/uninstall-skill.js');

const SKILL_CONTENT = '---\nname: testrail-cli\n---\n# Skill\n';

describe('install-skill — filesystem-failure catch', () => {
    let tmp: string;
    let source: string;
    let stderrChunks: string[];
    let spyErr: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fsControl.throwOnRename = false;
        fsControl.throwOnUnlinkTemp = false;
        fsControl.throwOnLstat = false;
        fsControl.throwOnUnlinkTarget = false;
        fsControl.throwNonError = false;
        tmp = mkdtempSync(join(tmpdir(), 'tr-fsfail-install-'));
        source = join(tmp, 'bundled-SKILL.md');
        writeFileSync(source, SKILL_CONTENT, 'utf-8');
        stderrChunks = [];
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
    });

    function run(quiet = false): number {
        return runInstallSkill(
            { global: false, force: false, printPath: false, quiet, sourceOverride: source, cwdOverride: tmp },
            'file:///irrelevant',
        );
    }

    it('exits 1 with a structured error when renameSync throws (temp cleaned up)', () => {
        fsControl.throwOnRename = true;
        const code = run();
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('failed to install skill');
        expect(stderrChunks.join('')).toContain('EACCES');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('still exits 1 when the temp-file cleanup unlink also throws (inner catch swallows it)', () => {
        // rename fails (so tempPath !== undefined branch is taken) AND the
        // best-effort unlink of the temp file fails too — the inner try/catch
        // must swallow the unlink error and still surface the original failure.
        fsControl.throwOnRename = true;
        fsControl.throwOnUnlinkTemp = true;
        const code = run();
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('failed to install skill');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('honors --quiet on the failure path (exit 1, no stderr)', () => {
        fsControl.throwOnRename = true;
        const code = run(true);
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toBe('');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('stringifies a non-Error rejection from the fs layer (String(e) fallback arm)', () => {
        // The catch's `e instanceof Error ? e.message : String(e)` false arm:
        // a bare-string throw must be stringified rather than `.message`-read.
        fsControl.throwOnRename = true;
        fsControl.throwNonError = true;
        const code = run();
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('failed to install skill');
        expect(stderrChunks.join('')).toContain('EACCES');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });
});

describe('uninstall-skill — filesystem-failure catches', () => {
    let tmp: string;
    let source: string;
    let stderrChunks: string[];
    let spyErr: ReturnType<typeof vi.spyOn>;

    function install(): void {
        runInstallSkill(
            { global: false, force: false, printPath: false, quiet: true, sourceOverride: source, cwdOverride: tmp },
            'file:///irrelevant',
        );
    }

    beforeEach(() => {
        fsControl.throwOnRename = false;
        fsControl.throwOnUnlinkTemp = false;
        fsControl.throwOnLstat = false;
        fsControl.throwOnUnlinkTarget = false;
        fsControl.throwNonError = false;
        tmp = mkdtempSync(join(tmpdir(), 'tr-fsfail-uninstall-'));
        source = join(tmp, 'bundled-SKILL.md');
        writeFileSync(source, SKILL_CONTENT, 'utf-8');
        stderrChunks = [];
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        spyErr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
    });

    it('exits 1 with "cannot stat" when lstatSync throws after existsSync passed', () => {
        install();
        fsControl.throwOnLstat = true;
        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: tmp });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('cannot stat');
        expect(stderrChunks.join('')).toContain('EACCES');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('exits 1 with "failed to remove" when unlinkSync throws after lstat said regular file', () => {
        install();
        fsControl.throwOnUnlinkTarget = true;
        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: tmp });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('failed to remove');
        expect(stderrChunks.join('')).toContain('EPERM');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('stringifies a non-Error lstat rejection (cannot-stat String(e) fallback arm)', () => {
        install();
        fsControl.throwOnLstat = true;
        fsControl.throwNonError = true;
        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: tmp });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('cannot stat');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('stringifies a non-Error unlink rejection (failed-to-remove String(e) fallback arm)', () => {
        install();
        fsControl.throwOnUnlinkTarget = true;
        fsControl.throwNonError = true;
        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: tmp });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('failed to remove');
        spyErr.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });
});
