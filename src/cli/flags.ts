/**
 * Single source of truth for the CLI's parseArgs options table and the
 * post-parse strict-validation set. Extracted from index.ts so unit tests
 * can lock the invariant (KNOWN_FLAGS === Object.keys(CLI_OPTIONS))
 * without triggering the module-level main() that index.ts runs on import.
 *
 * Adding a flag requires editing exactly this file:
 *   1. Add the entry to CLI_OPTIONS.
 *   2. KNOWN_FLAGS is derived from Object.keys(CLI_OPTIONS); no second edit.
 *   3. Add the matching pull-out in src/cli/index.ts (the HandlerArgs /
 *      auth wiring) and a HELP line.
 *
 * The post-parse validation pass (CTF audit finding #10) rejects any flag
 * not in KNOWN_FLAGS. parseArgs runs with `strict: false` for defensive
 * future-Node tolerance; the strict gate replaces that with a controlled
 * rejection that catches typos like `--dryrun` (missing hyphen) which
 * would otherwise silently bypass the gate the user intended (e.g.,
 * dry-run-vs-execute on a destructive action).
 */
export const CLI_OPTIONS = {
    'base-url': { type: 'string' as const },
    email: { type: 'string' as const },
    // CTF #11: --api-key (string) removed in v3.0 — exposed credentials
    // via /proc/<pid>/cmdline, shell history, CI step logs, container
    // audit trails, and crash dumps. Use TESTRAIL_API_KEY env var or
    // pipe the key on stdin with --api-key-stdin.
    'api-key-stdin': { type: 'boolean' as const, default: false },
    format: { type: 'string' as const, default: 'json' },
    quiet: { type: 'boolean' as const, default: false },
    help: { type: 'boolean' as const, default: false },
    version: { type: 'boolean' as const, default: false },
    'project-id': { type: 'string' as const },
    'suite-id': { type: 'string' as const },
    'run-id': { type: 'string' as const },
    'case-id': { type: 'string' as const },
    limit: { type: 'string' as const },
    offset: { type: 'string' as const },
    data: { type: 'string' as const },
    'data-file': { type: 'string' as const },
    'dry-run': { type: 'boolean' as const, default: false },
    global: { type: 'boolean' as const, default: false },
    force: { type: 'boolean' as const, default: false },
    'print-path': { type: 'boolean' as const, default: false },
    file: { type: 'string' as const },
    filename: { type: 'string' as const },
    out: { type: 'string' as const },
    yes: { type: 'boolean' as const, default: false },
    soft: { type: 'boolean' as const, default: false },
};

export const KNOWN_FLAGS: ReadonlySet<string> = new Set(Object.keys(CLI_OPTIONS));
