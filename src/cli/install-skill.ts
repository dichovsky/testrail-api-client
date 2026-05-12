/**
 * `testrail install-skill` — copy the bundled SKILL.md from this package's
 * own `skill/` directory into a Claude Code skills folder so the agent can
 * auto-load it.
 *
 * Defaults: project-scoped install (`./.claude/skills/testrail-cli/`).
 * Pass `--global` for `~/.claude/skills/testrail-cli/`. Pass `--force` to
 * overwrite an existing file. Pass `--print-path` to print the bundled
 * source path without installing (useful for vendoring / scripting).
 *
 * This is a meta-command — it operates on the user's filesystem, not on
 * TestRail — so it sits outside the normal `resource:action` dispatch.
 * Invoked directly from `index.ts` when positionals[0] === 'install-skill'.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface InstallSkillOptions {
    global: boolean;
    force: boolean;
    printPath: boolean;
    quiet: boolean;
    /** Override for tests; resolved from import.meta.url otherwise. */
    sourceOverride?: string;
    /** Override target root for tests; otherwise `homedir()` or `process.cwd()`. */
    cwdOverride?: string;
    homeOverride?: string;
}

/**
 * Resolves the bundled `skill/SKILL.md` path. At runtime, the compiled
 * handler lives at `<packageRoot>/dist/cli/install-skill.js`; the bundled
 * skill ships in `<packageRoot>/skill/SKILL.md`. Three `..` segments climb
 * from `dist/cli/` to the package root.
 */
export function getBundledSkillPath(metaUrl: string): string {
    return resolve(dirname(fileURLToPath(metaUrl)), '..', '..', 'skill', 'SKILL.md');
}

export function runInstallSkill(opts: InstallSkillOptions, metaUrl: string): number {
    const source = opts.sourceOverride ?? getBundledSkillPath(metaUrl);

    if (opts.printPath) {
        process.stdout.write(`${source}\n`);
        return 0;
    }

    if (!existsSync(source)) {
        process.stderr.write(`Error: bundled SKILL.md not found at ${source}\n`);
        return 1;
    }

    const targetRoot = opts.global ? (opts.homeOverride ?? homedir()) : (opts.cwdOverride ?? process.cwd());
    const target = join(targetRoot, '.claude', 'skills', 'testrail-cli', 'SKILL.md');

    if (existsSync(target) && !opts.force) {
        process.stderr.write(`Error: SKILL.md already exists at ${target}. Re-run with --force to overwrite.\n`);
        return 1;
    }

    try {
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(source, target);
        /* v8 ignore start -- defensive: triggered only by filesystem failures
           (permission denied, full disk, etc.) that are flaky to simulate in
           CI. The error path is exercised manually if invoked under an
           unwritable HOME. */
    } catch (e: unknown) {
        process.stderr.write(`Error: failed to install skill: ${e instanceof Error ? e.message : String(e)}\n`);
        return 1;
    }
    /* v8 ignore stop */

    if (!opts.quiet) {
        process.stdout.write(`Installed testrail-cli skill → ${target}\n`);
    }
    return 0;
}
