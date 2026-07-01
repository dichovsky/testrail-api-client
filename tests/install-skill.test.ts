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
    statSync,
    mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInstallSkill, getBundledSkillPath } from '../src/cli/install-skill.js';

const SKILL_CONTENT = '---\nname: testrail-cli\nversion: 2.1.0\n---\n# Skill\n';

// Repo root, resolved the same way tests/generate-codemap.test.ts does it,
// so the "real bundled skill" describe block below can locate the actual
// `skill/SKILL.md` and `package.json` on disk (as opposed to the synthetic
// SKILL_CONTENT fixture used by every other test in this file).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

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

    it('falls back to homedir() when homeOverride is undefined (--global default with HOME env redirect)', () => {
        // Exercises the `opts.homeOverride ?? homedir()` nullish-coalesce
        // false branch. node:os.homedir() reads HOME (POSIX) or USERPROFILE
        // (Windows). Redirect HOME to a sandboxed tmp so the real home
        // directory is never touched.
        const sandbox = join(tmp, 'sandbox-home');
        const origHome = process.env['HOME'];
        const origUserProfile = process.env['USERPROFILE'];
        process.env['HOME'] = sandbox;
        process.env['USERPROFILE'] = sandbox;
        try {
            const code = runInstallSkill(
                {
                    global: true,
                    force: false,
                    printPath: false,
                    quiet: true,
                    sourceOverride: source,
                    // homeOverride deliberately omitted — must fall back to homedir().
                },
                'file:///irrelevant',
            );
            expect(code).toBe(0);
            expect(existsSync(join(sandbox, '.claude', 'skills', 'testrail-cli', 'SKILL.md'))).toBe(true);
        } finally {
            if (origHome !== undefined) process.env['HOME'] = origHome;
            else delete process.env['HOME'];
            if (origUserProfile !== undefined) process.env['USERPROFILE'] = origUserProfile;
            else delete process.env['USERPROFILE'];
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

    it('SEC #19: created directory is not group/other-writable on POSIX', () => {
        // Exercises the `mkdirSync(dir, { recursive: true, mode: 0o755 })` fix.
        // Without an explicit mode the directory inherits the process umask;
        // under a permissive umask (e.g. 0o000) the dir becomes world-writable.
        // The exact mode is umask-filtered, so we assert the security property
        // (group/other write bits absent) rather than a fixed octal value.
        const project = join(tmp, 'proj-mode');
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
        const skillDir = join(project, '.claude', 'skills', 'testrail-cli');
        if (process.platform !== 'win32') {
            const dirStat = statSync(skillDir);
            // Assert the security property (not world-writable) rather than
            // the exact mode — mkdirSync honors the explicit 0o755 mode, but
            // different test runner umasks would filter that to 0o700 etc. The
            // invariant we need is that group/other write bits are never set.
            expect(dirStat.mode & 0o002).toBe(0); // not world-writable
            expect(dirStat.mode & 0o020).toBe(0); // not group-writable
        }
    });

    it('SEC #5: --force replaces a symlink at the target path with a regular file', () => {
        // Verifies that --force replaces an existing symlink with a regular file
        // (the installed skill content) and that the file the symlink previously
        // pointed to is left untouched.
        //
        // Note on ESM spy limitations: vi.spyOn cannot intercept named ESM
        // imports (module namespace is not configurable), so we verify the
        // outcome directly via the filesystem rather than asserting the absence
        // of a particular syscall sequence.
        const project = join(tmp, 'proj-symlink-replace');
        const skillDir = join(project, '.claude', 'skills', 'testrail-cli');
        mkdirSync(skillDir, { recursive: true });

        const linkTarget = join(tmp, 'some-other-file.txt');
        writeFileSync(linkTarget, 'original', 'utf-8');
        const symlinkPath = join(skillDir, 'SKILL.md');
        symlinkSync(linkTarget, symlinkPath);

        // Install with --force should succeed (replacing the symlink)
        const result = runInstallSkill(
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
        expect(result).toBe(0);

        // The path must now be a regular file, not a symlink
        const stat = lstatSync(symlinkPath);
        expect(stat.isSymbolicLink()).toBe(false);
        expect(stat.isFile()).toBe(true);
        expect(readFileSync(symlinkPath, 'utf-8')).toBe(SKILL_CONTENT);

        // The original file the symlink pointed to must be untouched.
        expect(readFileSync(linkTarget, 'utf-8')).toBe('original');
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

describe('runInstallSkill — real bundled skill/SKILL.md', () => {
    // Unlike every test above (which installs a synthetic SKILL_CONTENT
    // fixture), this exercises the actual repo file at skill/SKILL.md by
    // passing its real on-disk path as sourceOverride — getBundledSkillPath()
    // itself is not called here since it resolves relative to the compiled
    // dist/cli/install-skill.js location, which doesn't match this test
    // file's location under tests/.
    let tmp: string;
    let stdoutSpy: ReturnType<typeof vi.spyOn>;
    let stderrSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'tr-install-real-'));
        stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
        rmSync(tmp, { recursive: true, force: true });
    });

    it('installs the real skill/SKILL.md with valid frontmatter whose version matches package.json', () => {
        const realSkillPath = join(REPO_ROOT, 'skill', 'SKILL.md');
        const project = join(tmp, 'proj');

        const code = runInstallSkill(
            {
                global: false,
                force: false,
                printPath: false,
                quiet: true,
                sourceOverride: realSkillPath,
                cwdOverride: project,
            },
            'file:///irrelevant',
        );
        expect(code).toBe(0);

        const target = join(project, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
        const installed = readFileSync(target, 'utf-8');

        // Lightweight manual frontmatter parse: split on the `---` delimiter
        // lines and read `key: value` pairs from the block between them —
        // no YAML dependency needed for this shape.
        const lines = installed.split('\n');
        expect(lines[0]).toBe('---');
        const closingIndex = lines.indexOf('---', 1);
        expect(closingIndex).toBeGreaterThan(0);

        const frontmatter: Record<string, string> = {};
        for (const line of lines.slice(1, closingIndex)) {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex === -1) continue;
            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            frontmatter[key] = value;
        }

        for (const requiredKey of ['name', 'description', 'version', 'license', 'homepage']) {
            expect(frontmatter[requiredKey]).toBeTruthy();
        }

        const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8')) as { version: string };
        expect(frontmatter['version']).toBe(pkg.version);
    });
});

describe('getBundledSkillPath', () => {
    it('resolves two directories up from the handler file plus skill/SKILL.md', () => {
        const fakeUrl = 'file:///tmp/pkg/dist/cli/install-skill.js';
        const result = getBundledSkillPath(fakeUrl);
        expect(result).toBe(join('/tmp/pkg', 'skill', 'SKILL.md'));
    });
});
