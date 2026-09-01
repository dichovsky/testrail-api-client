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
 *      auth wiring) and document it in CLI_OPTION_DOCUMENTATION below.
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
    'user-email': { type: 'string' as const },
    // CTF #11: --api-key (string) removed in v3.0 — exposed credentials
    // via /proc/<pid>/cmdline, shell history, CI step logs, container
    // audit trails, and crash dumps. Use TESTRAIL_API_KEY env var or
    // pipe the key on stdin with --api-key-stdin.
    'api-key-stdin': { type: 'boolean' as const, default: false },
    format: { type: 'string' as const, default: 'json' },
    // Request timeout in milliseconds, mapped straight to `config.timeout`
    // (SDK unit). Overrides the TESTRAIL_TIMEOUT env var, which overrides the
    // 30s default. A present-but-invalid value is rejected (parseId → exit 1);
    // out-of-range is rejected by the client constructor's validateTimeout.
    timeout: { type: 'string' as const },
    'strict-responses': { type: 'boolean' as const, default: false },
    quiet: { type: 'boolean' as const, default: false },
    help: { type: 'boolean' as const, default: false },
    version: { type: 'boolean' as const, default: false },
    'project-id': { type: 'string' as const },
    'suite-id': { type: 'string' as const },
    'section-id': { type: 'string' as const },
    'run-id': { type: 'string' as const },
    'type-id': { type: 'string' as const },
    'priority-id': { type: 'string' as const },
    'template-id': { type: 'string' as const },
    'milestone-id': { type: 'string' as const },
    'created-after': { type: 'string' as const },
    'created-before': { type: 'string' as const },
    'created-by': { type: 'string' as const },
    'updated-after': { type: 'string' as const },
    'updated-before': { type: 'string' as const },
    'updated-by': { type: 'string' as const },
    'label-id': { type: 'string' as const },
    refs: { type: 'string' as const },
    filter: { type: 'string' as const },
    'include-plan-runs': { type: 'boolean' as const, default: false },
    'is-completed': { type: 'string' as const },
    'is-started': { type: 'string' as const },
    'with-data': { type: 'string' as const },
    limit: { type: 'string' as const },
    offset: { type: 'string' as const },
    page: { type: 'boolean' as const, default: false },
    all: { type: 'boolean' as const, default: false },
    'page-size': { type: 'string' as const },
    'start-offset': { type: 'string' as const },
    'max-pages': { type: 'string' as const },
    'max-items': { type: 'string' as const },
    'max-duration-ms': { type: 'string' as const },
    'max-bytes': { type: 'string' as const },
    'status-id': { type: 'string' as const },
    'defects-filter': { type: 'string' as const },
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
    'keep-in-cases': { type: 'string' as const },
    // `run watch` polling controls. `--interval <seconds>` (default 30, min 5,
    // max 600) sets the recursive-setTimeout delay between `get_run/{run_id}`
    // polls; the floor protects the TestRail default rate budget
    // (100 req/60s = ~0.6s/req — a 5s minimum interval still leaves headroom
    // for other concurrent client traffic). `--once` polls a single time and
    // exits without scheduling the next iteration; useful for one-shot status
    // checks in CI scripts that want the watcher's diff/render output without
    // a long-running process.
    interval: { type: 'string' as const },
    once: { type: 'boolean' as const, default: false },
};

export type CliOptionName = keyof typeof CLI_OPTIONS;

export interface CliOptionDocumentationEntry {
    /** Placeholder shown after the flag, omitted for boolean switches. */
    readonly value?: string;
    /** Commands for which the option has an effect. */
    readonly scope: string;
    /** Agent-facing behavior, constraints, and defaults. */
    readonly description: string;
}

/**
 * Canonical documentation for every accepted CLI option.
 *
 * The `Record<CliOptionName, ...>` constraint makes option documentation a
 * compile-time invariant: adding or removing a key in `CLI_OPTIONS` requires
 * the same change here. Both `testrail --help` and the generated bundled skill
 * render this registry, so their option inventories cannot drift apart.
 */
export const CLI_OPTION_DOCUMENTATION: Readonly<Record<CliOptionName, CliOptionDocumentationEntry>> = {
    'base-url': {
        value: '<url>',
        scope: 'All API commands',
        description: 'TestRail base URL; overrides TESTRAIL_BASE_URL.',
    },
    email: {
        value: '<email>',
        scope: 'All API commands',
        description: 'Authentication email; overrides TESTRAIL_EMAIL. It is not the user lookup filter.',
    },
    'user-email': {
        value: '<email>',
        scope: 'user get-by-email',
        description: 'Email address of the user to look up without changing the authentication identity.',
    },
    'api-key-stdin': {
        scope: 'All API commands',
        description:
            'Read one API key from piped stdin. It cannot share stdin with a JSON body or --file -; prefer TESTRAIL_API_KEY.',
    },
    format: {
        value: '<json|table|yaml|csv>',
        scope: 'Commands that emit structured output',
        description: 'Select output format; default json. Binary/text --out files are not reformatted.',
    },
    timeout: {
        value: '<ms>',
        scope: 'All API commands',
        description: 'Request timeout in milliseconds; overrides TESTRAIL_TIMEOUT. Default 30000, maximum 300000.',
    },
    'strict-responses': {
        scope: 'All API commands',
        description: 'Fail on the first response-schema mismatch instead of emitting advisory warnings.',
    },
    quiet: {
        scope: 'All commands',
        description: 'Suppress normal output and advisory warnings; rely on the exit code.',
    },
    help: {
        scope: 'Top level',
        description: 'Print CLI help and exit.',
    },
    version: {
        scope: 'Top level',
        description: 'Print the package CLI version and exit.',
    },
    'project-id': {
        value: '<id>',
        scope: 'case, suite, run, plan, milestone, shared-step, user, and bdd lists; case delete-bulk',
        description: 'Select the TestRail project for actions whose endpoint does not carry project_id positionally.',
    },
    'suite-id': {
        value: '<ids>',
        scope: 'case, section, bdd, and run list actions',
        description: 'Filter by suite. run list accepts comma-separated IDs; other consumers require one ID.',
    },
    'section-id': {
        value: '<id>',
        scope: 'case list; bdd list',
        description: 'Filter results to one section.',
    },
    'run-id': {
        value: '<id>',
        scope: 'result list',
        description: 'Select the run whose results should be listed.',
    },
    'type-id': {
        value: '<ids>',
        scope: 'case list',
        description: 'Filter by comma-separated case type IDs.',
    },
    'priority-id': {
        value: '<ids>',
        scope: 'case list',
        description: 'Filter by comma-separated priority IDs.',
    },
    'template-id': {
        value: '<ids>',
        scope: 'case list',
        description: 'Filter by comma-separated template IDs.',
    },
    'milestone-id': {
        value: '<ids>',
        scope: 'case, run, and plan list actions',
        description: 'Filter by comma-separated milestone IDs.',
    },
    'created-after': {
        value: '<timestamp>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Return entities created after this Unix timestamp.',
    },
    'created-before': {
        value: '<timestamp>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Return entities created before this Unix timestamp.',
    },
    'created-by': {
        value: '<ids>',
        scope: 'case, run, plan, and shared-step lists; result list',
        description: 'Filter by comma-separated creator user IDs.',
    },
    'updated-after': {
        value: '<timestamp>',
        scope: 'case list; shared-step list',
        description: 'Return entities updated after this Unix timestamp.',
    },
    'updated-before': {
        value: '<timestamp>',
        scope: 'case list; shared-step list',
        description: 'Return entities updated before this Unix timestamp.',
    },
    'updated-by': {
        value: '<ids>',
        scope: 'case list',
        description: 'Filter by comma-separated updater user IDs.',
    },
    'label-id': {
        value: '<ids>',
        scope: 'case, bdd, and test list actions',
        description: 'Filter by comma-separated label IDs.',
    },
    refs: {
        value: '<refs>',
        scope: 'case, bdd, run, plan, and shared-step list actions',
        description:
            'Filter by references. case and bdd lists accept comma-separated TestRail 10.7 refs; run, plan, and shared-step lists accept one reference.',
    },
    filter: {
        value: '<text>',
        scope: 'case list',
        description: 'Filter by case-title substring.',
    },
    'include-plan-runs': {
        scope: 'run list',
        description: 'Include runs owned by test plans.',
    },
    'is-completed': {
        value: '<true|false|1|0>',
        scope: 'project, run, plan, and milestone list actions',
        description: 'Filter by completion state.',
    },
    'is-started': {
        value: '<true|false|1|0>',
        scope: 'milestone list',
        description: 'Filter milestones by started state.',
    },
    'with-data': {
        value: '<0|1>',
        scope: 'test get',
        description: 'Request the enriched test projection with 1, or the ordinary response with 0.',
    },
    limit: {
        value: '<n>',
        scope: 'Supported list actions in default or --page mode',
        description: 'Maximum items requested from one response; incompatible with --all.',
    },
    offset: {
        value: '<n>',
        scope: 'Supported list actions in default or --page mode',
        description: 'Zero-based response offset; incompatible with --all.',
    },
    page: {
        scope: 'Registered paginated list actions',
        description: 'Return one strict page envelope with items and pagination metadata; incompatible with --all.',
    },
    all: {
        scope: 'Registered paginated list actions',
        description:
            'Follow validated continuations and return one bounded item array; incompatible with --page/--limit/--offset.',
    },
    'page-size': {
        value: '<n>',
        scope: '--all on request-controlled paginated actions',
        description: 'Per-request page size; default and maximum 250.',
    },
    'start-offset': {
        value: '<n>',
        scope: '--all on request-controlled paginated actions',
        description: 'Initial aggregate offset; default 0.',
    },
    'max-pages': {
        value: '<n>',
        scope: '--all',
        description: 'Maximum pages fetched; default 100.',
    },
    'max-items': {
        value: '<n>',
        scope: '--all',
        description: 'Maximum accumulated items; default 25000.',
    },
    'max-duration-ms': {
        value: '<ms>',
        scope: '--all',
        description: 'Aggregate wall-clock deadline; default and maximum 300000.',
    },
    'max-bytes': {
        value: '<bytes>',
        scope: '--all',
        description: 'Maximum serialized aggregate size; default 104857600, hard maximum 1073741824.',
    },
    'status-id': {
        value: '<ids>',
        scope: 'test list; result list/list-for-test/list-for-case',
        description: 'Filter by comma-separated TestRail status IDs.',
    },
    'defects-filter': {
        value: '<text>',
        scope: 'result list/list-for-test/list-for-case',
        description: 'Filter results whose defects field contains the supplied substring.',
    },
    data: {
        value: '<json>',
        scope: 'Body-bearing write actions',
        description:
            'Provide an inline JSON body. Exactly one of --data, --data-file, or piped JSON stdin is required.',
    },
    'data-file': {
        value: '<path>',
        scope: 'Body-bearing write actions',
        description: 'Read the JSON body from a file; useful for large payloads and secrets.',
    },
    'dry-run': {
        scope: 'Write actions; run watch',
        description: 'Validate and preview locally without an API call. It bypasses destructive confirmation gates.',
    },
    global: {
        scope: 'install-skill; uninstall-skill',
        description: 'Use the user-level skill directory instead of the current project.',
    },
    force: {
        scope: 'File-output actions; install-skill',
        description: 'Overwrite an existing output file or installed SKILL.md.',
    },
    'print-path': {
        scope: 'install-skill',
        description: 'Print the bundled SKILL.md path and exit without installing.',
    },
    file: {
        value: '<path|->',
        scope: 'Attachment uploads; bdd add/update',
        description: "Read upload content from a file, or from piped stdin with '-'.",
    },
    filename: {
        value: '<name>',
        scope: 'File-input actions',
        description: 'Override the uploaded filename; defaults to the local basename or stdin.',
    },
    out: {
        value: '<path|->',
        scope: 'attachment get; bdd get',
        description: "Write downloaded bytes/text to a file, or stream them to stdout with '-'.",
    },
    yes: {
        scope: 'Destructive actions',
        description: 'Per-invocation confirmation; real destructive calls also require TESTRAIL_ALLOW_DESTRUCTIVE=1.',
    },
    soft: {
        scope: 'case delete/delete-bulk; run, section, and suite delete',
        description:
            'Request TestRail server-side deletion preview. It still calls the API and requires both destructive gates.',
    },
    'keep-in-cases': {
        value: '<true|false|1|0>',
        scope: 'shared-step delete',
        description:
            'Choose whether deleted shared-step content remains in referencing cases; TestRail defaults to true.',
    },
    interval: {
        value: '<seconds>',
        scope: 'run watch',
        description: 'Polling interval; default 30, minimum 5, maximum 600.',
    },
    once: {
        scope: 'run watch',
        description: 'Poll once and exit instead of waiting for completion.',
    },
};

export const KNOWN_FLAGS: ReadonlySet<string> = new Set(Object.keys(CLI_OPTIONS));
