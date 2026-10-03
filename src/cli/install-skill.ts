/**
 * `testrail install-skill` — copy the bundled SKILL.md and the `reference/`
 * files it links to from this package's own `skill/` directory into a Claude
 * Code skills folder so the agent can auto-load it.
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
    mkdtempSync,
    cpSync,
    rmSync,
    lstatSync,
    openSync,
    closeSync,
    readdirSync,
    renameSync,
    unlinkSync,
    readFileSync,
    writeFileSync,
    constants,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Output } from './output.js';

export interface InstallSkillOptions {
    global: boolean;
    force: boolean;
    printPath: boolean;
    /**
     * Where this command's output goes. Both writers are already `--quiet`
     * aware, so the meta-command no longer carries its own copy of that rule —
     * `createOutput` is the single place it is decided.
     */
    output: Pick<Output, 'outRaw' | 'err'>;
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
    // CTF #16: `err` sanitizes before writing. Error messages interpolate paths
    // derived from opts.cwdOverride / opts.homeOverride or filesystem
    // error.message strings, which can carry control chars from
    // attacker-controlled environment variables (HOME, CWD).
    const writeErr = opts.output.err;

    const source = opts.sourceOverride ?? getBundledSkillPath(metaUrl);

    if (opts.printPath) {
        opts.output.outRaw(`${source}\n`);
        return 0;
    }

    if (!existsSync(source)) {
        writeErr(`bundled SKILL.md not found at ${source}`);
        return 1;
    }

    const targetRoot = opts.global ? (opts.homeOverride ?? homedir()) : (opts.cwdOverride ?? process.cwd());
    const target = join(targetRoot, '.claude', 'skills', 'testrail-cli', 'SKILL.md');

    // SKILL.md points at `./reference/*` for the detail it deliberately keeps
    // out of its body. Installing the body alone leaves every one of those
    // pointers dangling at the install location, which is worse than having no
    // reference at all: the agent is told a file exists and then cannot read it.
    const skillRoot = dirname(source);

    try {
        // Inside the try: listReferenceFiles rethrows anything that is not a
        // missing directory, and that has to surface as a clean "failed to
        // install skill" with exit 1 rather than an unhandled stack trace.
        const referenceSources = listReferenceFiles(skillRoot);
        const dir = dirname(target);
        requireRealDirectory(dir);
        if (referenceSources.length > 0) requireRealDirectory(join(dir, 'reference'));
        for (const destination of [target, ...referenceSources.map((name) => join(dir, 'reference', name))]) {
            const existing = lstatSync(destination, { throwIfNoEntry: false });
            if (existing === undefined) continue;
            if (!opts.force) {
                throw new Error(
                    `${basename(destination)} already exists at ${destination}. Re-run with --force to overwrite.`,
                );
            }
            if (!existing.isFile() && !existing.isSymbolicLink()) {
                throw new Error(`${destination} is not a file; refusing to overwrite it`);
            }
        }
        installDirectory(source, dir, referenceSources);

        const extra = referenceSources.length > 0 ? ` (+${referenceSources.length} reference)` : '';
        opts.output.outRaw(`Installed testrail-cli skill → ${target}${extra}\n`);
        return 0;
    } catch (e: unknown) {
        writeErr(`failed to install skill: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
    }
}

/**
 * Prepare the complete new tree before touching the installed directory.
 * Directory replacement needs two renames on supported platforms, leaving a
 * brief absent-path interval. Failed publication restores the previous tree;
 * failed rollback retains its backup and reports where to recover it.
 */
function installDirectory(source: string, target: string, references: readonly string[]): void {
    const parent = dirname(target);
    mkdirSync(parent, { recursive: true, mode: 0o755 });
    const workspace = mkdtempSync(join(parent, '.testrail-cli-install-'));
    const staged = join(workspace, 'new');
    const backup = join(workspace, 'previous');
    let preserveBackup = false;
    try {
        const existing = lstatSync(target, { throwIfNoEntry: false });
        if (existing === undefined) {
            mkdirSync(staged, { mode: 0o755 });
        } else {
            // Preserve user-managed files without following their symlinks.
            cpSync(target, staged, { recursive: true, dereference: false, verbatimSymlinks: true });
        }
        requireRealDirectory(staged);
        if (references.length > 0) {
            const referenceDir = join(staged, 'reference');
            requireRealDirectory(referenceDir);
            mkdirSync(referenceDir, { recursive: true, mode: 0o755 });
            for (const name of references) {
                installFile(join(dirname(source), 'reference', name), join(referenceDir, name));
            }
        }
        installFile(source, join(staged, 'SKILL.md'));
        if (existing !== undefined) renameSync(target, backup);
        try {
            renameSync(staged, target);
        } catch (error: unknown) {
            if (existing !== undefined) {
                try {
                    renameSync(backup, target);
                } catch (rollbackError: unknown) {
                    preserveBackup = true;
                    throw new AggregateError(
                        [error, rollbackError],
                        `Installation rollback failed; previous skill retained at ${backup}`,
                        { cause: rollbackError },
                    );
                }
            }
            throw error;
        }
    } finally {
        if (!preserveBackup) {
            try {
                rmSync(workspace, { recursive: true, force: true });
            } catch {
                // Publication/rollback already settled. Cleanup must not turn a
                // successfully installed tree into a reported failed update.
            }
        }
    }
}

/**
 * The bundled reference file names, or an empty list when the package ships
 * none. A missing directory is not an error — the reference set is allowed to
 * be empty, and an install must not fail because of it.
 *
 * One level deep only: the bundled layout is flat, and a recursive copy would
 * be machinery for a shape that does not exist.
 */
function listReferenceFiles(skillRoot: string): readonly string[] {
    try {
        return readdirSync(join(skillRoot, 'reference'), { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
            .sort();
    } catch (e: unknown) {
        // Only a missing directory means "this package bundles no reference".
        // Treating every failure that way would let a permission error or a
        // `reference` that is somehow not a directory install SKILL.md alone
        // and report success — recreating the dangling-pointer bug this whole
        // change exists to fix, silently.
        if ((e as { code?: string }).code === 'ENOENT') return [];
        throw e;
    }
}

/**
 * Refuses to write through anything at `path` that is not a real directory.
 *
 * `mkdirSync(path, { recursive: true })` treats an existing symlink-to-directory
 * as already satisfied, so without this the reference files would be renamed
 * into whatever that link targets — the install-side twin of the symlink hole
 * the uninstall cleanup had. `lstatSync` describes the link itself, so a
 * symlink fails `isDirectory()`; `statSync` here would reintroduce the bug.
 */
function requireRealDirectory(path: string): void {
    // `throwIfNoEntry: false` yields undefined for the ordinary absent case
    // (mkdir creates it below) while still throwing on a permission or I/O
    // failure, so no catch is needed and none of this is unreachable.
    const stat = lstatSync(path, { throwIfNoEntry: false });
    if (stat !== undefined && !stat.isDirectory()) {
        throw new Error(`${path} exists and is not a directory; refusing to write through it`);
    }
}

/**
 * Copies one bundled file to `target` through a sibling temp file and an
 * atomic rename.
 *
 * `O_EXCL | O_NOFOLLOW` means the temp file cannot be pre-created or aimed
 * elsewhere through a symlink. On POSIX `renameSync` delegates to rename(2),
 * which replaces any existing directory entry — including a symlink — without
 * a prior unlink, so there is no TOCTOU window. On Windows it overwrites
 * regular files but may throw on an existing directory or symlink.
 *
 * Throws on any filesystem failure, after removing the temp file best-effort
 * so a failed install leaves no stray sibling.
 */
function installFile(source: string, target: string): void {
    // Derived from the target's own name, not a bare `.tmp.*`: the failure
    // -injection mock in tests/skill-fs-failure.test.ts arms on the
    // `SKILL.md.tmp.` prefix, so a generic name silently disarms it and leaves
    // the cleanup path in the `finally` below untested. Deriving the prefix
    // also names which file a stray temp belongs to.
    let tempPath: string | undefined = join(
        dirname(target),
        `${basename(target)}.tmp.${Math.random().toString(36).substring(2, 9)}`,
    );
    try {
        const fd = openSync(tempPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW);
        try {
            writeFileSync(fd, readFileSync(source));
        } finally {
            closeSync(fd);
        }

        const tempStat = lstatSync(tempPath);
        if (tempStat.isSymbolicLink() || !tempStat.isFile()) {
            throw new Error('temporary file is not a regular file');
        }

        renameSync(tempPath, target);
        tempPath = undefined;
    } finally {
        if (tempPath !== undefined) {
            try {
                unlinkSync(tempPath);
            } catch {
                // Best-effort cleanup; the original failure is the one to surface.
            }
        }
    }
}
