/**
 * Stray positional arguments on the meta commands.
 *
 * `install-skill` and `uninstall-skill` dispatched on the first positional and
 * ignored the rest, so `install-skill ./elsewhere --force` overwrote the skill
 * in the current directory and never created `./elsewhere`, and
 * `uninstall-skill junk` uninstalled. Resource actions already refuse the same
 * mistake; the meta commands must too, before they touch the disk.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli/index.js';

interface CliResult {
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
}

async function run(argv: readonly string[]): Promise<CliResult> {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const exitCode = await runCli({
        argv,
        env: {},
        stdout: (chunk) => void stdout.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')),
        stderr: (chunk) => void stderr.push(chunk),
        stdoutIsTTY: false,
        stdin: {
            isTTY: true,
            read: () => {
                throw new Error('a meta command must not read stdin');
            },
            readBinary: () => Promise.reject(new Error('a meta command must not read stdin')),
        },
        createClient: () => {
            throw new Error('a meta command must not build a client');
        },
        platform: process.platform,
        lifetime: { onExit: () => undefined, offExit: () => undefined },
    });
    return { exitCode, stdout: stdout.join(''), stderr: stderr.join('') };
}

describe('meta commands refuse stray positional arguments', () => {
    let sandbox: string;
    let home: string;
    let cwd: MockInstance<() => string>;
    let installedSkill: string;

    beforeEach(() => {
        // The commands resolve their target from the working directory, or from
        // the home directory under `--global`. Both point at a sandbox, so a
        // regression cannot write into, or delete from, the checkout the suite
        // runs in or the developer's own `~/.claude/skills`.
        sandbox = mkdtempSync(join(tmpdir(), 'testrail-cli-meta-'));
        home = join(sandbox, 'home');
        mkdirSync(home);
        cwd = vi.spyOn(process, 'cwd').mockReturnValue(sandbox);
        vi.stubEnv('HOME', home);
        vi.stubEnv('USERPROFILE', home);
        // Fail here, before any command runs, if the redirection did not take.
        expect(homedir()).toBe(home);
        installedSkill = join(sandbox, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
    });

    afterEach(() => {
        cwd.mockRestore();
        vi.unstubAllEnvs();
        rmSync(sandbox, { recursive: true, force: true });
    });

    it.each([
        [
            ['install-skill', './elsewhere', '--force'],
            `'install-skill' takes no positional arguments (got 1: "./elsewhere").`,
        ],
        [['install-skill', './elsewhere'], `'install-skill' takes no positional arguments (got 1: "./elsewhere").`],
        [['install-skill', 'a', 'b', '--global'], `'install-skill' takes no positional arguments (got 2: "a", "b").`],
        [['install-skill', 'junk', '--print-path'], `'install-skill' takes no positional arguments (got 1: "junk").`],
    ])('%j installs nothing', async (argv, message) => {
        const result = await run(argv);

        expect(result.stderr).toBe(`Error: ${message}\n`);
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe('');
        expect(existsSync(join(sandbox, '.claude'))).toBe(false);
        expect(existsSync(join(home, '.claude'))).toBe(false);
        expect(existsSync(join(sandbox, 'elsewhere'))).toBe(false);
    });

    it.each([
        [['uninstall-skill', 'junk'], `'uninstall-skill' takes no positional arguments (got 1: "junk").`],
        [
            ['uninstall-skill', './elsewhere', 'x'],
            `'uninstall-skill' takes no positional arguments (got 2: "./elsewhere", "x").`,
        ],
    ])('%j removes nothing', async (argv, message) => {
        mkdirSync(join(sandbox, '.claude', 'skills', 'testrail-cli'), { recursive: true });
        writeFileSync(installedSkill, 'installed skill body\n');

        const result = await run(argv);

        expect(result.stderr).toBe(`Error: ${message}\n`);
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe('');
        expect(readFileSync(installedSkill, 'utf8')).toBe('installed skill body\n');
    });

    it('neutralizes control characters in the reflected positional', async () => {
        const result = await run(['uninstall-skill', '\u001b]0;evil\u0007']);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(`'uninstall-skill' takes no positional arguments (got 1: `);
        expect(result.stderr).not.toContain('\u001b');
        expect(result.stderr).not.toContain('\u0007');
    });

    it('--quiet suppresses the refusal message but not the exit code', async () => {
        const result = await run(['install-skill', './elsewhere', '--quiet']);

        expect(result).toEqual({ exitCode: 1, stdout: '', stderr: '' });
        expect(existsSync(join(sandbox, '.claude'))).toBe(false);
    });

    it('still runs both commands when no positional follows', async () => {
        const installed = await run(['install-skill']);
        expect(installed.stderr).toBe('');
        expect(installed.exitCode).toBe(0);
        expect(existsSync(installedSkill)).toBe(true);

        const removed = await run(['uninstall-skill']);
        expect(removed.stderr).toBe('');
        expect(removed.exitCode).toBe(0);
        expect(existsSync(installedSkill)).toBe(false);
    });
});
