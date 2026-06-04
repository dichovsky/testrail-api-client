/**
 * Unit tests for src/cli/uninstall-skill.ts.
 *
 * Mirror structure of install-skill.test.ts: each test uses a tmpdir-rooted
 * "home" and "project" via `cwdOverride` / `homeOverride` so the real
 * ~/.claude and ./.claude folders are never touched.
 *
 * Coverage focus:
 *   - happy paths (project default, --global)
 *   - missing file (not previously installed)
 *   - --quiet semantics
 *   - install + uninstall round-trip
 *   - TOCTOU defenses: refuses to unlink symlinks, refuses non-files
 *   - empty parent dir cleanup
 *   - non-empty parent dir preserved (sibling skill survives)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInstallSkill } from '../src/cli/install-skill.js';
import { getInstallTarget, runUninstallSkill } from '../src/cli/uninstall-skill.js';

const SKILL_CONTENT = '---\nname: testrail-cli\nversion: 2.1.0\n---\n# Skill\n';

describe('runUninstallSkill', () => {
    let tmp: string;
    let source: string;
    let stdoutSpy: ReturnType<typeof vi.spyOn>;
    let stderrSpy: ReturnType<typeof vi.spyOn>;
    let stdoutChunks: string[];
    let stderrChunks: string[];

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-uninstall-'));
        source = join(tmp, 'bundled-SKILL.md');
        writeFileSync(source, SKILL_CONTENT, 'utf-8');
        stdoutChunks = [];
        stderrChunks = [];
        stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            stdoutChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
        stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrChunks.push(typeof chunk === 'string' ? chunk : String(chunk));
            return true;
        });
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('removes a project-scoped installed skill (default mode)', () => {
        const project = join(tmp, 'proj');
        // Install first
        runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        expect(existsSync(target)).toBe(true);

        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        expect(code).toBe(0);
        expect(existsSync(target)).toBe(false);
        expect(stdoutChunks.join('')).toContain('Uninstalled testrail-cli skill');
        // Empty parent dir cleaned up
        expect(existsSync(join(project, '.claude', 'skills', 'testrail-cli'))).toBe(false);
    });

    it('removes a global-scoped installed skill when --global is set', () => {
        const home = join(tmp, 'home');
        runInstallSkill(
            { global: true, force: false, printPath: false, quiet: true, sourceOverride: source, homeOverride: home },
            'file:///irrelevant',
        );
        const target = join(home, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        expect(existsSync(target)).toBe(true);

        const code = runUninstallSkill({ global: true, quiet: false, homeOverride: home });
        expect(code).toBe(0);
        expect(existsSync(target)).toBe(false);
    });

    it('exits 1 with a clear message when no skill is installed', () => {
        const project = join(tmp, 'proj');
        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('not found');
        expect(stderrChunks.join('')).toContain('Nothing to uninstall');
    });

    it('--quiet suppresses the success message but still removes the file', () => {
        const project = join(tmp, 'proj');
        runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        const code = runUninstallSkill({ global: false, quiet: true, cwdOverride: project });
        expect(code).toBe(0);
        expect(stdoutChunks.join('')).toBe('');
        expect(existsSync(join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(false);
    });

    it('--quiet suppresses the not-found error (exit code 1 still distinguishes)', () => {
        const project = join(tmp, 'proj');
        const code = runUninstallSkill({ global: false, quiet: true, cwdOverride: project });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toBe('');
    });

    it('install + uninstall round-trip leaves no trace', () => {
        const project = join(tmp, 'proj');
        const installed = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(installed).toBe(0);
        const uninstalled = runUninstallSkill({ global: false, quiet: true, cwdOverride: project });
        expect(uninstalled).toBe(0);
        // Re-running uninstall must produce a clean error, not a crash.
        const again = runUninstallSkill({ global: false, quiet: true, cwdOverride: project });
        expect(again).toBe(1);
    });

    it('refuses to remove a symlink at the install target (TOCTOU defense)', () => {
        const project = join(tmp, 'proj');
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        mkdirSync(join(project, '.claude', 'skills', 'testrail-cli'), { recursive: true });
        // Sensitive bystander file we want to prove is NOT touched.
        const bystander = join(tmp, 'sensitive.txt');
        writeFileSync(bystander, 'do not delete me', 'utf-8');
        symlinkSync(bystander, target);

        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('symlink');
        // Bystander still on disk.
        expect(existsSync(bystander)).toBe(true);
        // Symlink itself still present — uninstall must not unlink either.
        expect(existsSync(target)).toBe(true);
    });

    it('refuses to remove a dangling symlink with a symlink-specific message (not "nothing to uninstall")', () => {
        const project = join(tmp, 'proj');
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        mkdirSync(join(project, '.claude', 'skills', 'testrail-cli'), { recursive: true });
        // Dangling symlink: its target does not exist. existsSync follows the
        // link and returns false, so a symlink-following existence gate would
        // misreport this as "nothing to uninstall" and leave the link on disk.
        // The documented TOCTOU posture lstats the target and refuses it.
        symlinkSync(join(tmp, 'no-such-target'), target);

        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        expect(code).toBe(1);
        // A symlink is detected and refused with a clear message — NOT silently
        // misreported as "SKILL.md not found. Nothing to uninstall.".
        expect(stderrChunks.join('')).toContain('symlink');
        expect(stderrChunks.join('')).not.toContain('not found');
        // The dangling symlink is left in place (lstat sees it; existsSync can't).
        expect(lstatSync(target).isSymbolicLink()).toBe(true);
    });

    it('refuses to remove a directory at the install target path', () => {
        const project = join(tmp, 'proj');
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        // Plant a directory where the file would live.
        mkdirSync(target, { recursive: true });

        const code = runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('not a regular file');
        expect(existsSync(target)).toBe(true);
    });

    it('preserves the parent directory when sibling files exist', () => {
        const project = join(tmp, 'proj');
        runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        const parent = join(project, '.claude', 'skills', 'testrail-cli');
        // Drop a hand-managed sibling next to the SKILL.md — uninstall
        // should remove the skill but leave the directory + sibling intact.
        const sibling = join(parent, 'NOTES.md');
        writeFileSync(sibling, 'hand-written notes', 'utf-8');

        const code = runUninstallSkill({ global: false, quiet: true, cwdOverride: project });
        expect(code).toBe(0);
        expect(existsSync(join(parent, 'SKILL.md'))).toBe(false);
        expect(existsSync(sibling)).toBe(true);
        expect(existsSync(parent)).toBe(true);
        // Sanity: only the sibling remains.
        expect(readdirSync(parent)).toEqual(['NOTES.md']);
    });

    it('mentions .continue / AGENTS.md as NOT touched and does not mention .cursor', () => {
        const project = join(tmp, 'proj');
        runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        runUninstallSkill({ global: false, quiet: false, cwdOverride: project });
        const out = stdoutChunks.join('');
        expect(out).not.toContain('.cursor/rules/testrail.mdc');
        expect(out).toContain('.continue/rules/testrail.md');
        expect(out).toContain('AGENTS.md');
        expect(out).toContain('separate lifecycle');
    });
});

describe('getInstallTarget', () => {
    it('returns the project-scoped path when global is false', () => {
        const target = getInstallTarget({ global: false, cwdOverride: '/tmp/proj' });
        expect(target).toBe(join('/tmp/proj', '.claude', 'skills', 'testrail-cli', 'SKILL.md'));
    });

    it('returns the home-scoped path when global is true', () => {
        const target = getInstallTarget({ global: true, homeOverride: '/tmp/home' });
        expect(target).toBe(join('/tmp/home', '.claude', 'skills', 'testrail-cli', 'SKILL.md'));
    });

    it('falls back to process.cwd() when cwdOverride is undefined', () => {
        // Exercises the `opts.cwdOverride ?? process.cwd()` false branch.
        const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/tmp/stub-cwd');
        try {
            const target = getInstallTarget({ global: false });
            expect(target).toBe(join('/tmp/stub-cwd', '.claude', 'skills', 'testrail-cli', 'SKILL.md'));
        } finally {
            cwdSpy.mockRestore();
        }
    });

    it('falls back to homedir() when homeOverride is undefined (returns a non-empty real path)', () => {
        // Exercises the `opts.homeOverride ?? homedir()` false branch. We
        // can't stub homedir easily (frozen module export), so we assert
        // only the stable suffix (`.claude/skills/testrail-cli/SKILL.md`)
        // — the homedir prefix is whatever os.homedir() returns and is
        // not directly verified.
        const target = getInstallTarget({ global: true });
        expect(target).toContain('.claude');
        expect(target.endsWith(join('.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(true);
    });
});
