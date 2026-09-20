/**
 * `testrail uninstall-skill` — remove the bundled SKILL.md previously
 * installed by `testrail install-skill`. Symmetric reverse of
 * install-skill.
 *
 * Defaults: project-scoped removal (`./.claude/skills/testrail-cli/`).
 * Pass `--global` to remove from `~/.claude/skills/testrail-cli/`.
 *
 * Scope: this command ONLY removes the skill file (and its enclosing
 * `testrail-cli` directory if empty after removal). It deliberately does
 * NOT touch `.continue/rules/testrail.md` or `AGENTS.md` — those
 * artifacts have an independent lifecycle (they are regenerated from
 * `src/cli/metadata.ts` and live alongside other agent-tool
 * configuration). Users who want to fully decouple from this package
 * can delete those files manually.
 *
 * TOCTOU posture (mirrors install-skill safety patterns):
 *   1. `lstat` (NOT `stat`) the target so a symlink is detected without
 *      following it.
 *   2. Refuse to unlink if the target is a symlink — installs only ever
 *      produce regular files via `copyFileSync`, so a symlink at the
 *      target path indicates either tampering or unrelated content.
 *   3. Refuse to unlink anything that is not a regular file.
 *   4. After unlinking the SKILL.md, attempt to remove the parent
 *      `testrail-cli/` directory ONLY if empty; do not touch
 *      `.claude/skills/` or higher.
 *
 * Related backlog: SEC #5 (TOCTOU symlink-clobber on install target) is a
 * separate concern affecting `install-skill`; this command is built to
 * not introduce a parallel hazard but does not fix the existing one.
 *
 * Like `install-skill`, this is a meta-command — it operates on the
 * user's filesystem, not on TestRail — so it sits outside the normal
 * `resource:action` dispatch.
 */

import { lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Output } from './output.js';

export interface UninstallSkillOptions {
    global: boolean;
    /**
     * Where this command's output goes. Both writers are already `--quiet`
     * aware, so this meta-command no longer carries its own copy of that rule —
     * `createOutput` is the single place it is decided.
     */
    output: Pick<Output, 'outRaw' | 'err'>;
    /** Override target root for tests; otherwise `homedir()` or `process.cwd()`. */
    cwdOverride?: string;
    homeOverride?: string;
}

/**
 * Compute the canonical install target for a given option set. Exposed
 * for tests + symmetry with install-skill (so anyone debugging the pair
 * can ask "where would install put it?" and "where would uninstall
 * look?" from the same surface).
 */
/**
 * Names of the reference files this package bundles — the only entries under
 * an installed `reference/` that `install-skill` could have written, and so
 * the only ones this command may remove.
 *
 * Resolved from this module's own location, mirroring `getBundledSkillPath`:
 * at runtime the handler sits at `<packageRoot>/dist/cli/uninstall-skill.js`,
 * two `..` segments from the package root. An unreadable or absent bundle
 * yields an empty set, which removes nothing — the conservative direction.
 */
function bundledReferenceNames(): readonly string[] {
    try {
        const referenceDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skill', 'reference');
        return readdirSync(referenceDir, { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name);
    } catch {
        // No bundled reference set to match against; delete nothing.
        return [];
    }
}

export function getInstallTarget(opts: Pick<UninstallSkillOptions, 'global' | 'cwdOverride' | 'homeOverride'>): string {
    const targetRoot = opts.global ? (opts.homeOverride ?? homedir()) : (opts.cwdOverride ?? process.cwd());
    return join(targetRoot, '.claude', 'skills', 'testrail-cli', 'SKILL.md');
}

export function runUninstallSkill(opts: UninstallSkillOptions): number {
    // Mirrors install-skill: `err` sanitizes before writing, and both writers
    // already honor --quiet.
    const writeErr = opts.output.err;
    const writeOut = (message: string): void => opts.output.outRaw(`${message}\n`);

    const target = getInstallTarget(opts);

    // TOCTOU-aware: lstat (NOT existsSync) so a symlink at the target path is
    // detected without following it. existsSync follows symlinks and returns
    // false for a dangling symlink, which would misreport a broken symlink as
    // "nothing to uninstall" while leaving it on disk (same rationale as the
    // file-output.ts clobber check). install-skill writes a regular file via
    // copyFileSync; anything else here is either user-managed unrelated
    // content (a hand-symlinked dev copy) or an attempted attack — we refuse
    // to unlink either way and surface a clear message so the user can resolve
    // manually.
    let stat: ReturnType<typeof lstatSync>;
    try {
        stat = lstatSync(target);
    } catch (e: unknown) {
        // ENOENT: nothing exists at the path (skill was never installed) — the
        // ordinary "not previously installed" case. Any other error (e.g. an
        // unreadable parent directory) surfaces as a structured stat failure.
        if ((e as { code?: string }).code === 'ENOENT') {
            writeErr(`SKILL.md not found at ${target}. Nothing to uninstall.`);
            return 1;
        }
        writeErr(`cannot stat ${target}: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
    }

    if (stat.isSymbolicLink()) {
        writeErr(
            `Refusing to remove ${target}: target is a symlink, not a regular file. install-skill only ever writes regular files; remove this manually if intentional.`,
        );
        return 1;
    }
    if (!stat.isFile()) {
        writeErr(`Refusing to remove ${target}: target is not a regular file.`);
        return 1;
    }

    try {
        unlinkSync(target);
    } catch (e: unknown) {
        // unlink can fail between the lstat check and here (permission revoked,
        // file removed by another process). Surface a structured error.
        writeErr(`failed to remove ${target}: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
    }

    // install-skill also writes `reference/`, so leaving it behind would make
    // the enclosing directory non-empty forever and strand files the user
    // asked to remove.
    //
    // The same symlink discipline the SKILL.md removal applies to `target`
    // applies here, and for the same reason: `lstatSync` describes the link
    // itself, so a symlink planted at `reference/` fails `isDirectory()` and we
    // never enumerate what it points at. Using `statSync` — or skipping the
    // check, as the first version of this cleanup did — makes `readdirSync`
    // follow the link and `unlinkSync` delete every regular file in whatever
    // directory it targets.
    //
    // Entries *inside* a real `reference/` need no extra guard: a `Dirent` from
    // `readdirSync(..., { withFileTypes: true })` reports the entry's own type,
    // so `entry.isFile()` is already false for a symlink.
    //
    // Every failure here is non-fatal — the SKILL.md removal has succeeded.
    const parent = dirname(target);
    const referenceDir = join(parent, 'reference');
    try {
        if (lstatSync(referenceDir).isDirectory()) {
            // Only files this package bundles are removed. The uninstaller's
            // established contract is to leave hand-managed content alone (see
            // the sibling-skill case in tests/uninstall-skill.test.ts), and a
            // blanket sweep of `reference/` would silently delete a file the
            // user added or edited there.
            const owned = new Set(bundledReferenceNames());
            for (const entry of readdirSync(referenceDir, { withFileTypes: true })) {
                if (entry.isFile() && owned.has(entry.name)) {
                    unlinkSync(join(referenceDir, entry.name));
                }
            }
            // Succeeds only when nothing unowned was left behind.
            rmdirSync(referenceDir);
        }
    } catch {
        // No reference directory, something in it is not ours to remove, or a
        // non-empty directory after preserving unowned files. The body is gone
        // either way; the parent cleanup below simply finds it non-empty.
    }

    // Best-effort cleanup of the enclosing testrail-cli/ directory if
    // empty. We deliberately stop here — never touch .claude/skills/ or
    // higher, since other skills may live there. Errors here are
    // non-fatal (the file removal already succeeded).
    try {
        const entries = readdirSync(parent);
        if (entries.length === 0) {
            rmdirSync(parent);
        }
    } catch {
        // Ignore — the file removal succeeded; an inability to clean up
        // the empty parent dir is cosmetic.
    }

    writeOut(`Uninstalled testrail-cli skill ← ${target}`);
    writeOut(
        'Note: .continue/rules/testrail.md and AGENTS.md are NOT touched (separate lifecycle); remove manually if desired.',
    );
    return 0;
}
