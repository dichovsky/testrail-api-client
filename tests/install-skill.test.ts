/**
 * Unit tests for src/cli/install-skill.ts.
 *
 * Each test uses a tmpdir-rooted "home" and "project" via `cwdOverride` /
 * `homeOverride` so we never touch the real ~/.claude or ./.claude
 * folders during the test run. `sourceOverride` points at a synthetic
 * SKILL.md so we don't depend on the package's actual bundled file.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    mkdtempSync,
    writeFileSync,
    readFileSync,
    existsSync,
    rmSync,
    symlinkSync,
    lstatSync,
    mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInstallSkill, getBundledSkillPath } from '../src/cli/install-skill.js';

const SKILL_CONTENT = '---\nname: testrail-cli\nversion: 2.1.0\n---\n# Skill\n';

describe('runInstallSkill', () => {
    let tmp: string;
    let source: string;
    let stdoutSpy: ReturnType<typeof vi.spyOn>;
    let stderrSpy: ReturnType<typeof vi.spyOn>;
    let stdoutChunks: string[];
    let stderrChunks: string[];

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-install-'));
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

    it('installs the skill into ./.claude/skills/testrail-cli/SKILL.md (project default)', () => {
        const project = join(tmp, 'proj');
        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: false,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        expect(existsSync(target)).toBe(true);
        expect(readFileSync(target, 'utf-8')).toBe(SKILL_CONTENT);
        expect(stdoutChunks.join('')).toContain('Installed testrail-cli skill');
    });

    it('installs into ~/.claude/skills/testrail-cli/SKILL.md when --global is set', () => {
        const home = join(tmp, 'home');
        const code = runInstallSkill(
            {
                global: true,
                force: false,
                printPath: false,
                quiet: false,
                sourceOverride: source,
                homeOverride: home,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);
        expect(existsSync(join(home, '.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(true);
    });

    it('refuses to overwrite an existing file without --force', () => {
        const project = join(tmp, 'proj');
        // First install
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
        stderrChunks.length = 0;
        // Second install without --force
        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: false,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('already exists');
        expect(stderrChunks.join('')).toContain('--force');
    });

    it('--force overwrites an existing file', () => {
        const project = join(tmp, 'proj');
        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
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
        // Mutate the source to verify the second install actually wrote new content
        writeFileSync(source, 'updated content', 'utf-8');
        const code = runInstallSkill(
            { global: false, force: true, printPath: false, quiet: true, sourceOverride: source, cwdOverride: project },
            'file:///irrelevant',
        );
        expect(code).toBe(0);
        expect(readFileSync(target, 'utf-8')).toBe('updated content');
    });

    it('--print-path emits the bundled path and does not write any file', () => {
        const project = join(tmp, 'proj');
        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: true,
                quiet: false,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);
        expect(stdoutChunks.join('')).toContain(source);
        expect(existsSync(join(project, '.claude'))).toBe(false);
    });

    it('falls back to process.cwd() when cwdOverride is undefined (project default)', () => {
        // Exercises the `opts.cwdOverride ?? process.cwd()` nullish-coalesce
        // false branch. We stub process.cwd() to a sandboxed tmp so the real
        // working directory is never touched.
        const sandbox = join(tmp, 'sandbox-cwd');
        const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(sandbox);
        try {
            const code = runInstallSkill(
                {
                    global: false,
                    force: false,
                    printPath: false,
                    quiet: true,
                    sourceOverride: source,
                    // cwdOverride deliberately omitted — must fall back to process.cwd().
                },
                'file:///irrelevant',
            );
            expect(code).toBe(0);
            expect(existsSync(join(sandbox, '.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(true);
        } finally {
            cwdSpy.mockRestore();
        }
    });

    it('--print-path with --quiet suppresses stdout entirely (exit 0, no output)', () => {
        // Exercises the `if (!opts.quiet)` false branch on the print-path
        // return: a script that only cares about exit code can opt out of
        // the printed path. Pairs with the install/uninstall --quiet
        // semantics (silence on success, exit code carries the signal).
        const project = join(tmp, 'proj');
        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: true,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);
        expect(stdoutChunks.join('')).toBe('');
    });

    it('--quiet suppresses the "Installed" success message but still installs', () => {
        const project = join(tmp, 'proj');
        const code = runInstallSkill(
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
        expect(code).toBe(0);
        expect(stdoutChunks.join('')).toBe('');
        expect(existsSync(join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(true);
    });

    it('--quiet suppresses the refuse-overwrite error (exit code 1 still distinguishes)', () => {
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
        stderrChunks.length = 0;
        const code = runInstallSkill(
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
        // Same scenario as the refuse-overwrite test, but with --quiet:
        // exit code still 1, but no stderr output (matches createOutput's
        // --quiet semantics in src/cli/output.ts).
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toBe('');
    });

    it('exits 1 with a clear message when the bundled source is missing', () => {
        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: false,
                sourceOverride: join(tmp, 'does-not-exist.md'),
                cwdOverride: join(tmp, 'proj'),
            },
            'file:///irrelevant',
        );
        expect(code).toBe(1);
        expect(stderrChunks.join('')).toContain('bundled SKILL.md not found');
    });

    it('refuses to clobber target via a symlink (breaks link and creates regular file)', () => {
        const project = join(tmp, 'proj');
        const skillDir = join(project, '.claude', 'skills', 'testrail-cli');
        mkdirSync(skillDir, { recursive: true });

        const target = join(skillDir, 'SKILL.md');
        const decoy = join(tmp, 'decoy-sensitive-file.txt');
        const decoyContent = 'sensitive system configuration';
        writeFileSync(decoy, decoyContent, 'utf-8');

        // Create symlink at target pointing to decoy
        symlinkSync(decoy, target);

        // Run install without force -> should refuse overwrite
        let code = runInstallSkill(
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
        expect(code).toBe(1);
        expect(lstatSync(target).isSymbolicLink()).toBe(true);
        expect(readFileSync(decoy, 'utf-8')).toBe(decoyContent); // Decoy untouched

        // Run install WITH force -> should break symlink and write standard regular file without overwriting decoy
        code = runInstallSkill(
            {
                global: false,
                force: true,
                printPath: false,
                quiet: true,
                sourceOverride: source,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);

        // Target is now a regular file, not a symlink
        expect(lstatSync(target).isSymbolicLink()).toBe(false);
        expect(lstatSync(target).isFile()).toBe(true);
        expect(readFileSync(target, 'utf-8')).toBe(SKILL_CONTENT);

        // Crucially, the decoy file was NOT followed/clobbered!
        expect(readFileSync(decoy, 'utf-8')).toBe(decoyContent);
    });
});

describe('getBundledSkillPath', () => {
    it('resolves two directories up from the handler file plus skill/SKILL.md', () => {
        const fakeUrl = 'file:///tmp/pkg/dist/cli/install-skill.js';
        const result = getBundledSkillPath(fakeUrl);
        expect(result).toBe(join('/tmp/pkg', 'skill', 'SKILL.md'));
    });
});
