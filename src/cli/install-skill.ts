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

import {
    existsSync,
    mkdirSync,
    lstatSync,
    openSync,
    closeSync,
    renameSync,
    unlinkSync,
    readFileSync,
    writeFileSync,
    constants,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeForTerminal } from './sanitize.js';

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
 * skill ships in `<packageRoot>/skill/SKILL.md`. Two `..` segments climb
 * from `dist/cli/` (the handler's dirname) to the package root, then
 * `skill/SKILL.md` reaches the bundled file.
 */
export function getBundledSkillPath(metaUrl: string): string {
    return resolve(dirname(fileURLToPath(metaUrl)), '..', '..', 'skill', 'SKILL.md');
}

export function runInstallSkill(opts: InstallSkillOptions, metaUrl: string): number {
    // Match the rest of the CLI's --quiet semantics (createOutput in
    // output.ts): when quiet, suppress both stdout success messages AND
    // stderr errors. Callers rely on exit code 0/1 only.
    const writeErr = (message: string): void => {
        // CTF #16: sanitize before writing to stderr. Error messages may
        // interpolate paths derived from opts.cwdOverride / opts.homeOverride
        // or filesystem error.message strings, which can carry control chars
        // from attacker-controlled environment variables (HOME, CWD).
        if (!opts.quiet) process.stderr.write(`Error: ${sanitizeForTerminal(message)}\n`);
    };

    const source = opts.sourceOverride ?? getBundledSkillPath(metaUrl);

    if (opts.printPath) {
        if (!opts.quiet) process.stdout.write(`${source}\n`);
        return 0;
    }

    if (!existsSync(source)) {
        writeErr(`bundled SKILL.md not found at ${source}`);
        return 1;
    }

    const targetRoot = opts.global ? (opts.homeOverride ?? homedir()) : (opts.cwdOverride ?? process.cwd());
    const target = join(targetRoot, '.claude', 'skills', 'testrail-cli', 'SKILL.md');

    let targetExists = false;
    try {
        lstatSync(target);
        targetExists = true;
    } catch {
        // Target does not exist
    }

    if (targetExists && !opts.force) {
        writeErr(`SKILL.md already exists at ${target}. Re-run with --force to overwrite.`);
        return 1;
    }

    let tempPath: string | undefined;
    try {
        const dir = dirname(target);
        mkdirSync(dir, { recursive: true, mode: 0o755 });

        // Create a secure sibling temp file first.
        tempPath = join(dir, `SKILL.md.tmp.${Math.random().toString(36).substring(2, 9)}`);
        const fd = openSync(tempPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW);

        try {
            const content = readFileSync(source);
            writeFileSync(fd, content);
        } finally {
            closeSync(fd);
        }

        // Verify the temp path is a regular file before atomic swap
        const tempStat = lstatSync(tempPath);
        if (tempStat.isSymbolicLink() || !tempStat.isFile()) {
            throw new Error('temporary file is not a regular file');
        }

        // Place the file at the target. On POSIX, Node's renameSync delegates to
        // rename(2), which atomically replaces any existing directory entry
        // (including symlinks) without a prior unlink — no TOCTOU window.
        // On Windows, renameSync overwrites regular files but may throw on
        // existing directories or symlinks depending on the OS version.
        renameSync(tempPath, target);
        tempPath = undefined;
        /* v8 ignore start -- defensive: triggered only by filesystem failures
           (permission denied, full disk, etc.) that are flaky to simulate in
           CI. The error path is exercised manually if invoked under an
           unwritable HOME. */
    } catch (e: unknown) {
        if (tempPath !== undefined) {
            try {
                unlinkSync(tempPath);
            } catch {
                // Best-effort cleanup
            }
        }
        writeErr(`failed to install skill: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
    }
    /* v8 ignore stop */

    if (!opts.quiet) {
        process.stdout.write(`Installed testrail-cli skill → ${target}\n`);
    }
    return 0;
}
