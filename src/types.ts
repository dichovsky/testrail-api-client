import type { LabelEmbedded } from './schemas.js';

/**
 * TestRail API client configuration options
 */
export interface TestRailConfig {
    /** TestRail instance URL (e.g., https://example.testrail.io) */
    baseUrl: string;
    /** TestRail user email for authentication */
    email: string;
    /** TestRail API key or password */
    apiKey: string;
    /** Request timeout in milliseconds (default: 30000ms) */
    timeout?: number;
    /** Maximum number of retry attempts for failed requests (default: 3) */
    maxRetries?: number;
    /** Enable caching for static resources (default: true) */
    enableCache?: boolean;
    /** Cache TTL in milliseconds (default: 300000ms = 5 minutes) */
    cacheTtl?: number;
    /**
     * Cache cleanup interval in milliseconds (default: 60000ms = 1 minute).
     * Set to 0 to disable periodic cleanup.
     */
    cacheCleanupInterval?: number;
    /**
     * Maximum number of entries in the cache (default: 1000).
     * Set to 0 for unlimited (not recommended).
     */
    maxCacheSize?: number;
    /** Rate limiting configuration (default: 100 requests per minute) */
    rateLimiter?: RateLimiterConfig;
    /**
     * Allow HTTP (non-TLS) connections. Credentials are sent in cleartext over HTTP.
     * Only enable in isolated development environments. Default: false.
     */
    allowInsecure?: boolean;
    /**
     * Allow requests to private/loopback/link-local hosts (e.g. localhost, 192.168.x.x).
     * Only enable when TestRail is hosted on a private network. Default: false.
     */
    allowPrivateHosts?: boolean;
    /**
     * Maximum bytes accepted from a JSON, text, or multipart-error response
     * body before the read is aborted with a `TestRailApiError` (SEC #12).
     * Default: 10 MiB. Hard ceiling: 1 GiB.
     *
     * Override only when bulk-export endpoints (large `get_cases`,
     * `get_results`) legitimately exceed the default. Lower values are also
     * permitted — useful in memory-constrained containers.
     */
    maxJsonResponseBytes?: number;
    /**
     * Maximum bytes accepted from a binary response body (`requestBinary`,
     * used for attachment downloads). Default: 100 MiB. Hard ceiling: 1 GiB.
     *
     * Larger attachments need an explicit override and still risk OOM since
     * the whole buffer is materialised in memory.
     */
    maxBinaryResponseBytes?: number;
    /**
     * Wall-clock deadline applied to the response-body read, in milliseconds
     * (SEC #21). When `undefined` (default), the request `timeout` is reused.
     * Set to `0` to disable the deadline (only the byte cap protects, not
     * recommended).
     *
     * Independent of `timeout`, which still applies to the
     * connect/send/response-headers phase.
     */
    bodyTimeout?: number;
    /**
     * Register Node.js process listeners (`exit`, `SIGINT`, `SIGTERM`) that
     * call {@link TestRailClient.destroy} on every active client and, for
     * SIGINT/SIGTERM, terminate the process with the conventional 130/143
     * exit codes. Default: **false**.
     *
     * Set this to `true` only in entry-point processes (CLIs, standalone
     * scripts) that own the process lifecycle. Library consumers — Express
     * servers, daemons, hosts that already manage shutdown — should leave it
     * `false` (the default) so the client does not hijack their own signal
     * handling and does not call `process.exit()` on their behalf. Explicit
     * `destroy()` from the caller is always sufficient for cleanup.
     */
    registerProcessHandlers?: boolean;
    /**
     * Custom `fetch` implementation injected into every HTTP call made by this
     * client. Must have the same signature as `globalThis.fetch`. Defaults to
     * `globalThis.fetch`. Useful for testing (pass a spy or mock) and for
     * environments that require a custom fetch (e.g. proxy agents, undici,
     * node-fetch).
     */
    fetch?: typeof globalThis.fetch;
    /**
     * Custom DNS lookup function used for SSRF host validation (SEC #31).
     * Receives the bare hostname (no brackets for IPv6 literals) and must
     * return the resolved addresses in the same shape as
     * `node:dns/promises lookup(hostname, { all: true })`.
     *
     * Use this to supply static host-to-IP mappings or a custom resolver in
     * environments where the system DNS cannot reach the TestRail hostname
     * (e.g. CI networks with split-horizon DNS). The SSRF private-IP check
     * still runs against the returned addresses — this option does **not**
     * bypass the security validation, only replaces the resolution mechanism.
     *
     * When omitted (default), Node's system resolver is used.
     *
     * @example
     * // Map a corporate hostname to a known public IP for CI validation
     * dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }]
     */
    dnsLookup?: (hostname: string) => Promise<{ address: string; family: number }[]>;
}

export interface UploadFilePathInput {
    path: string;
    type?: string;
    /**
     * Optional open file descriptor to read the upload content from.
     * When provided on POSIX systems (macOS, Linux), the client streams the
     * file via `/dev/fd/<N>` or `/proc/self/fd/<N>` (protecting against TOCTOU
     * symlink swap attacks) and closes the descriptor after `openAsBlob` returns
     * its own independent file description. On non-POSIX systems the descriptor
     * is closed before `openAsBlob` and the original `path` is used directly.
     * In all cases the descriptor is consumed by the upload — callers must not
     * use it after the upload completes.
     *
     * Union contains `| undefined` to remain compatible with TS exactOptionalPropertyTypes.
     */
    fd?: number | undefined;
}

export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput;

export interface Case {
    id: number;
    title: string;
    section_id: number;
    template_id?: number | null;
    type_id?: number | null;
    priority_id?: number | null;
    milestone_id?: number | null;
    refs?: string | null;
    created_by: number;
    created_on: number; // Unix timestamp
    updated_by: number;
    updated_on: number; // Unix timestamp
    estimate?: string | null; // e.g. "5m"
    estimate_forecast?: string | null;
    suite_id: number;
    display_order?: number | null;
    is_deleted?: number | null;
    custom_fields?: Record<string, unknown> | null;
    // Mirror of the `labels` array on `CaseSchema` (SPEC #2.1.3) — uses the
    // shared `LabelEmbedded` shape so a Label object can be carried between
    // `get_case` and `get_test` responses without re-casting. See
    // `LabelEmbeddedSchema` for inner field choices.
    labels?: LabelEmbedded[] | null;
}

export interface Suite {
    id: number;
    name: string;
    description?: string | null;
    project_id: number;
    is_master?: boolean | null;
    is_baseline?: boolean | null;
    is_completed?: boolean | null;
    completed_on?: number | null; // Unix timestamp
    url: string;
}

// AddSuitePayload and UpdateSuitePayload now live in `./schemas.ts` as Zod
// schemas (source of truth for runtime validation + inferred TS types).

export interface Section {
    id: number;
    suite_id: number;
    name: string;
    description?: string | null;
    parent_id?: number | null;
    display_order: number;
    depth: number;
}

export interface Project {
    id: number;
    name: string;
    announcement?: string | null;
    show_announcement?: boolean | null;
    is_completed?: boolean | null;
    completed_on?: number | null; // Unix timestamp
    /** 1=single suite, 2=single suite+baselines, 3=multiple suites */
    suite_mode: number;
    url: string;
    // Mirror of `.nullish()` SPEC #2.1.1 fields on `ProjectSchema` (TestRail 7.3+).
    // Three absent states preserved: omitted (undefined), explicit null, typed value.
    default_role_id?: number | null;
    default_role?: string | null;
    // Per-project group assignment (TestRail 7.3+). Inner object is the union of the
    // `get_project` and `update_project` response item shapes documented by TestRail —
    // see ProjectSchema for the field-level rationale. All inner fields optional+nullable
    // so either form types cleanly without forcing consumers to widen via `as`.
    groups?: Array<{
        id?: number | null;
        role?: string | null;
        role_id?: number | null;
    }> | null;
    // Per-project user assignment (TestRail Enterprise 7.3+). Inner object is the union of
    // the `get_project` (id/global_role*/project_role*) and `update_project`
    // (user_id/role_id) response item shapes — see ProjectSchema.
    users?: Array<{
        id?: number | null;
        user_id?: number | null;
        global_role_id?: number | null;
        global_role?: string | null;
        project_role_id?: number | null;
        project_role?: string | null;
        role_id?: number | null;
    }> | null;
}

export interface Plan {
    id: number;
    name: string;
    description?: string | null;
    milestone_id?: number | null;
    assignedto_id?: number | null;
    is_completed: boolean;
    completed_on?: number | null; // Unix timestamp
    passed_count: number;
    blocked_count: number;
    untested_count: number;
    retest_count: number;
    failed_count: number;
    custom_status1_count?: number | null;
    custom_status2_count?: number | null;
    custom_status3_count?: number | null;
    custom_status4_count?: number | null;
    custom_status5_count?: number | null;
    custom_status6_count?: number | null;
    custom_status7_count?: number | null;
    project_id: number;
    created_on: number; // Unix timestamp
    created_by: number;
    url: string;
    entries?: PlanEntry[] | null;
    // Mirror of SPEC #2.1.6 fields on `PlanSchema`. Per the `get_plan` response-field
    // table: `start_on` / `due_on` are documented as timestamps (ungated); `refs`
    // is "a string of external requirement IDs, separated by commas - requires
    // TestRail 6.3 or later". `?: T | null` yields `T | null | undefined`, matching
    // the schema's `.nullish()`.
    start_on?: number | null;
    due_on?: number | null;
    refs?: string | null;
}

export interface PlanEntry {
    id: string; // GUID
    suite_id: number;
    name: string;
    description?: string | null;
    assignedto_id?: number | null;
    include_all: boolean;
    case_ids?: number[] | null;
    config_ids?: number[] | null;
    runs: Run[];
    // Mirror of SPEC #2.1.6 fields on `PlanEntrySchema`. The TestRail Plans API doc
    // lists `start_on` / `due_on` / `refs` in the `add_plan_entry` request body
    // table (entry-level), and the `get_plan` example shows `refs` in the entry
    // object. `start_on` / `due_on` echo back on responses when set.
    start_on?: number | null;
    due_on?: number | null;
    refs?: string | null;
}

export interface Run {
    id: number;
    suite_id: number;
    name: string;
    description?: string | null;
    milestone_id?: number | null;
    assignedto_id?: number | null;
    include_all: boolean;
    is_completed: boolean;
    completed_on?: number | null; // Unix timestamp
    config?: string | null;
    config_ids?: number[] | null;
    passed_count: number;
    blocked_count: number;
    untested_count: number;
    retest_count: number;
    failed_count: number;
    custom_status1_count?: number | null;
    custom_status2_count?: number | null;
    custom_status3_count?: number | null;
    custom_status4_count?: number | null;
    custom_status5_count?: number | null;
    custom_status6_count?: number | null;
    custom_status7_count?: number | null;
    project_id: number;
    plan_id?: number | null;
    created_on: number; // Unix timestamp
    created_by: number;
    refs?: string | null;
    url: string;
    // Mirror of SPEC #2.1.5 timestamp fields on `RunSchema`. `updated_on` requires
    // TestRail 6.5.2+; `start_on` / `due_on` are ungated but only emit when set.
    // `?: T | null` yields `T | null | undefined`, matching the schema's `.nullish()`
    // (omitted vs explicit null vs typed Unix timestamp).
    start_on?: number | null;
    due_on?: number | null;
    updated_on?: number | null;
    // Mirror of plan-entry context fields. NOT in the documented `get_run` response;
    // emit only when this Run is returned inside a `get_plan` entry, where it carries
    // the parent entry's GUID (string, matching `PlanEntry.id`) and the run's index
    // within that entry. Standalone runs from `get_run` / `get_runs` omit both.
    entry_id?: string | null;
    entry_index?: number | null;
}

export interface Test {
    id: number;
    case_id: number;
    status_id: number;
    assignedto_id?: number | null;
    run_id: number;
    title: string;
    template_id?: number | null;
    type_id?: number | null;
    priority_id?: number | null;
    estimate?: string | null;
    estimate_forecast?: string | null;
    refs?: string | null;
    milestone_id?: number | null;
    custom_fields?: Record<string, unknown> | null;
    // Mirror of the `labels` array on `TestSchema` (SPEC #2.1.7) — uses the
    // shared `LabelEmbedded` shape so a Label object can be carried between
    // `get_test` and `get_case` responses without re-casting. See
    // `LabelEmbeddedSchema` for inner field choices.
    labels?: LabelEmbedded[] | null;
}

export interface Result {
    id: number;
    test_id: number;
    /** e.g., 1=Passed */
    status_id: number;
    comment?: string | null;
    version?: string | null;
    elapsed?: string | null; // e.g. "5m 30s"
    defects?: string | null;
    assignedto_id?: number | null;
    created_by?: number | null;
    created_on?: number | null; // Unix timestamp
    custom_fields?: Record<string, unknown> | null;
}

export interface Milestone {
    id: number;
    name: string;
    description?: string | null;
    start_on?: number | null; // Unix timestamp
    started_on?: number | null; // Unix timestamp
    is_completed: boolean;
    completed_on?: number | null; // Unix timestamp
    due_on?: number | null; // Unix timestamp
    project_id: number;
    parent_id?: number | null;
    refs?: string | null;
    url: string;
    milestones?: Milestone[] | null;
    // Mirror of SPEC #2.1.9 `is_started` on `MilestoneSchema`. TestRail 5.3+ —
    // older servers omit the key entirely. Plain `boolean | undefined` (no
    // `| null`) — matches the schema's `.optional()` choice and the
    // documented "this is a plain boolean" contract. See schemas.ts for the
    // sibling-asymmetry rationale vs `is_completed`.
    is_started?: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role_id?: number | null;
    role?: string | null;
    // Mirror of the `.nullish()` 7.3+ fields on `UserSchema`. `?:` plus `| null` yields the
    // same `T | null | undefined` shape that `z.infer<typeof UserSchema>` produces, with
    // three distinct absent states preserved at the type level:
    //   - omitted (resolves to `undefined`): older TestRail servers (≤7.2), reduced
    //     `get_current_user` response shape.
    //   - explicit `null`: TestRail emits null for unset/unknown values.
    //   - typed value: TestRail 7.3+ Professional response.
    email_notifications?: boolean | null;
    is_admin?: boolean | null;
    group_ids?: number[] | null;
    mfa_required?: boolean | null;
    // Enterprise-only mirror (TestRail Enterprise 7.3+). Professional instances never
    // emit these keys, so the `undefined` case is dominant for non-Enterprise traffic.
    sso_enabled?: boolean | null;
    assigned_projects?: number[] | null;
}

export interface Status {
    id: number;
    name: string;
    label: string;
    color_dark: number;
    color_medium: number;
    color_bright: number;
    is_system: boolean;
    is_untested: boolean;
    is_final: boolean;
}

export interface Priority {
    id: number;
    name: string;
    short_name: string;
    is_default: boolean;
    priority: number; // weight/level
}

export interface CaseStatus {
    case_status_id: number;
    name: string;
    abbreviation: string;
    is_default: boolean;
    is_approved: boolean;
    is_untested: boolean;
}

export interface HistoryChange {
    field?: string | null;
    type_id?: number | null;
    old_text?: string | null;
    new_text?: string | null;
    // Mirror of SPEC #2.1.13 fields on `HistoryChangeSchema`. See schemas.ts
    // for the per-variant rationale of `old_value` / `new_value`. The union
    // here matches the Zod inferred type and lets callers `switch (typeof v)`
    // to narrow at use site (vs the previous `unknown` which forced explicit
    // runtime checks).
    label?: string | null;
    options?: unknown[] | null;
    old_value?: string | number | boolean | unknown[] | null;
    new_value?: string | number | boolean | unknown[] | null;
}

export interface HistoryEntry {
    id: number;
    user_id: number;
    type_id: number;
    /** Present on case-history entries */
    timestamp?: number | null;
    /** Present on shared-step-history entries */
    created_on?: number | null;
    changes?: HistoryChange[] | null;
}

// AddCasePayload and UpdateCasePayload now live in `./schemas.ts` as Zod
// schemas (source of truth for runtime validation + inferred TS types).

/**
 * Options for delete endpoints that support TestRail's `soft=1` server-side
 * preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`,
 * `delete_suite`). `delete_milestone` and `delete_project` do not accept
 * `soft`; passing this option to those endpoints would be a no-op
 * server-side, so the CLI rejects it instead to keep destructive intent
 * unambiguous.
 *
 * Distinct from a client-side `--dry-run` which short-circuits before any
 * API call; `soft=1` *does* hit the API and TestRail returns counts of
 * affected entities (see {@link SoftDeletePreview} in `./schemas.ts`).
 */
export interface SoftDeleteOptions {
    /** When true, request a server-side preview instead of a hard delete. */
    soft?: boolean;
}

/**
 * Filter options for `getCases()`.
 * All date filters accept Unix timestamps (seconds since epoch).
 */
export interface GetCasesOptions {
    /** Return only cases belonging to this suite */
    suiteId?: number;
    /** Return only cases in this section */
    sectionId?: number;
    /** Return only cases of this type (from `getCaseTypes()`) */
    typeId?: number;
    /** Return only cases with this priority (from `getPriorities()`) */
    priorityId?: number;
    /** Return only cases using this template (from `getTemplates()`) */
    templateId?: number;
    /** Return only cases linked to this milestone */
    milestoneId?: number;
    /** Return only cases created after this Unix timestamp */
    createdAfter?: number;
    /** Return only cases created before this Unix timestamp */
    createdBefore?: number;
    /** Return only cases updated after this Unix timestamp */
    updatedAfter?: number;
    /** Return only cases updated before this Unix timestamp */
    updatedBefore?: number;
    /** Maximum number of cases to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

// AddPlanPayload, UpdatePlanPayload, AddPlanEntryPayload,
// UpdatePlanEntryPayload, and PlanEntryRunPayload now live in `./schemas.ts`
// as Zod schemas. AddRunPayload, UpdateRunPayload, AddResultPayload,
// AddResultsForCasesPayload, and AddResultForCasePayload also live there
// (source of truth for runtime validation + inferred TS types).

// AddSectionPayload, UpdateSectionPayload, AddMilestonePayload, and
// UpdateMilestonePayload now live in `./schemas.ts` as Zod schemas (source of
// truth for runtime validation + inferred TS types).

export interface GetRunsOptions {
    /** Return only runs created after this Unix timestamp */
    createdAfter?: number;
    /** Return only runs created before this Unix timestamp */
    createdBefore?: number;
    /** Return only runs created by these user IDs (comma-separated list accepted by the API) */
    createdBy?: number[];
    /** `true` to return only completed runs, `false` for active runs */
    isCompleted?: boolean;
    /** Return only runs linked to this milestone ID */
    milestoneId?: number;
    /** Return only runs whose refs field contains this string */
    refsFilter?: string;
    /** Return only runs for this suite ID */
    suiteId?: number;
    /** Maximum number of runs to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface ResultFieldConfig {
    context: {
        is_global: boolean;
        project_ids: number[];
    };
    options: {
        is_required: boolean;
        default_value: string;
        items?: string | null;
        format?: string | null;
        rows?: string | null;
    };
}

export interface ResultField {
    id: number;
    /** System-level name, e.g. "custom_defects" */
    system_name: string;
    /** Human-readable label */
    label: string;
    /** Short name used as the key in result payloads */
    name: string;
    /** Field type identifier (1=String, 2=Integer, 3=Text, 5=Checkbox, 6=Dropdown, …) */
    type_id: number;
    display_order: number;
    /** One or more context/options configurations */
    configs: ResultFieldConfig[];
    is_active: boolean;
    include_all: boolean;
    template_ids: number[];
    description?: string | null;
}

// ── Case Fields & Types ───────────────────────────────────────────────────────

/** Context/options configuration block shared by CaseField entries */
export interface CaseFieldConfig {
    context: {
        is_global: boolean;
        project_ids: number[];
    };
    options: {
        is_required: boolean;
        default_value: string;
        items?: string | null;
        format?: string | null;
        rows?: string | null;
    };
}

/** Custom case field definition returned by get_case_fields */
export interface CaseField {
    id: number;
    /** System-level name, e.g. "custom_steps" */
    system_name: string;
    /** Human-readable label */
    label: string;
    /** Short name used as the key in case payloads */
    name: string;
    /** Field type identifier (1=String, 2=Integer, 3=Text, 5=Checkbox, 6=Dropdown, …) */
    type_id: number;
    display_order: number;
    /** One or more context/options configurations */
    configs: CaseFieldConfig[];
    is_active: boolean;
    include_all: boolean;
    template_ids: number[];
    description?: string | null;
}

/** Case type definition returned by get_case_types */
export interface CaseType {
    id: number;
    name: string;
    is_default: boolean;
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** Case template returned by get_templates (requires TestRail 5.2+) */
export interface Template {
    id: number;
    name: string;
    is_default: boolean;
}

// ── Configurations ────────────────────────────────────────────────────────────

/** An individual configuration (e.g. "Windows 10", "Chrome") within a group */
export interface Configuration {
    id: number;
    name: string;
    group_id: number;
}

/** A configuration group (e.g. "Operating Systems", "Browsers") */
export interface ConfigurationGroup {
    id: number;
    name: string;
    project_id: number;
    configs: Configuration[];
}

// AddConfigurationGroupPayload, UpdateConfigurationGroupPayload,
// AddConfigurationPayload, and UpdateConfigurationPayload now live in
// `./schemas.ts` as Zod schemas (source of truth for runtime validation +
// inferred TS types).

export interface CacheEntry<T> {
    data: T;
    expiry: number; // Unix timestamp in ms
}

export interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
}

// AddProjectPayload and UpdateProjectPayload now live in `./schemas.ts` as Zod
// schemas (source of truth for runtime validation + inferred TS types).

/**
 * Filter options for `getPlans()`.
 * All date filters accept Unix timestamps (seconds).
 */
export interface GetPlansOptions {
    /** Only return plans created after this Unix timestamp */
    created_after?: number;
    /** Only return plans created before this Unix timestamp */
    created_before?: number;
    /** Only return plans created by these user IDs */
    created_by?: number[];
    /** Filter by completion status: 1 = completed, 0 = active */
    is_completed?: 0 | 1;
    /** Only return plans with these milestone IDs */
    milestone_id?: number[];
    /** Maximum number of plans to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getTests()`.
 */
export interface GetTestsOptions {
    /** Only return tests with these status IDs */
    status_id?: number[];
    /** Maximum number of tests to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`.
 * All date filters accept Unix timestamps (seconds).
 */
export interface GetResultsOptions {
    /** Only return results created after this Unix timestamp */
    created_after?: number;
    /** Only return results created before this Unix timestamp */
    created_before?: number;
    /** Only return results created by these user IDs */
    created_by?: number[];
    /** Only return results with these status IDs */
    status_id?: number[];
    /** Only return results whose `defects` field contains this string
     *  (TestRail's `defects_filter` query param; e.g., a JIRA key like
     *  `JIRA-123`). Passed through verbatim. Honored by `getResults()` and
     *  `getResultsForCase()` only; `getResultsForRun()` ignores it for
     *  backwards compatibility with the existing `result list` CLI shape. */
    defects_filter?: string;
    /** Maximum number of results to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Filter options for `getMilestones()`.
 */
export interface GetMilestonesOptions {
    /** Filter by completion status: 1 = completed, 0 = active */
    is_completed?: 0 | 1;
    /** Maximum number of milestones to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

// ── Roles (TASK-025, requires TestRail 7.3+) ──────────────────────────────────

/** A user role returned by GET /get_roles (TestRail 7.3+) */
export interface Role {
    /** Unique role ID */
    id: number;
    /** Display name of the role */
    name: string;
    /** Whether this is the default role assigned to new users */
    is_default: boolean;
}

// ── Groups (TASK-026, requires TestRail 7.5+) ─────────────────────────────────
// `Group`, `AddGroupPayload`, and `UpdateGroupPayload` now live in
// `./schemas.ts` as Zod schemas (source of truth for runtime validation +
// inferred TS types). Mirrors the variable/shared-step/milestone payload
// migration precedent.

// ── Attachments (TASK-027) ────────────────────────────────────────────────────

/**
 * An attachment metadata record returned by attachment list and upload endpoints.
 *
 * SPEC #2.1.14 — mirror of `AttachmentSchema` (see `src/schemas.ts` for the
 * full rationale). TestRail emits three+ response shapes through the same
 * `Attachment` type:
 *  - upload-POST: only `attachment_id`.
 *  - legacy list (`get_attachments_for_case` / `_test`): `id`, `name`,
 *    `size`, `created_on`, `project_id`, `case_id`, `user_id`, `result_id`.
 *  - plan/run list: adds `entity_attachments_id`, `icon_name`; `case_id`
 *    may be `null`.
 *  - cloud TestRail 7.1+: `id` becomes a UUID string and `entity_id` becomes
 *    a string; the response gains `client_id`, `entity_type`, `data_id`,
 *    `filetype`, `legacy_id`, `is_image`, `icon`.
 *
 * Every field is optional/nullable so a single type covers the union; consume
 * the field appropriate for the endpoint you called.
 */
export interface Attachment {
    /** Upload-POST response: the ID of the attachment uploaded to TestRail. Absent on list responses. */
    attachment_id?: number | null;
    /** Primary key on list responses: integer pre-7.1, UUID string on cloud 7.1+. */
    id?: number | string | null;
    /** Original filename / display name. Absent on the upload-POST response. */
    name?: string | null;
    /** Filename returned by the API (when available). */
    filename?: string | null;
    /** File extension/type label (cloud 7.1+). */
    filetype?: string | null;
    /** File size in bytes. */
    size?: number | null;
    /** Unix timestamp when the attachment was created. */
    created_on?: number | null;
    /**
     * Legacy / non-documented uploader ID. The documented field is `user_id`;
     * `created_by` is retained for backward compatibility with existing callers.
     */
    created_by?: number | null;
    /** ID of the user who uploaded the attachment (documented field). */
    user_id?: number | null;
    /** ID of the project the attachment was uploaded against. */
    project_id?: number | null;
    /** ID of the case the attachment belongs to. `null` for plan-level attachments. */
    case_id?: number | null;
    /** Test result ID the attachment belongs to (may be `null`). */
    result_id?: number | null;
    /**
     * ID of the entity the attachment belongs to. Integer on older endpoints,
     * string (e.g. `"3"`) on cloud TestRail 7.1+.
     */
    entity_id?: number | string | null;
    /** Plan/run-list field: the attachment record's own ID (separate from the file ID). */
    entity_attachments_id?: number | null;
    /** Entity kind label on cloud 7.1+ (e.g. `"case"`). */
    entity_type?: string | null;
    /** Plan/run-list field: name of the icon used within the TestRail UI. */
    icon_name?: string | null;
    /** Cloud 7.1+ tenant ID. */
    client_id?: number | null;
    /** Cloud 7.1+ underlying data record UUID. */
    data_id?: string | null;
    /** Cloud 7.1+ legacy/migration ID (0 when none). */
    legacy_id?: number | null;
    /** Cloud 7.1+ flag for whether the attachment is renderable as an image. */
    is_image?: boolean | null;
    /** Cloud 7.1+ icon identifier string. */
    icon?: string | null;
}

// ── Shared Steps (TASK-028, requires TestRail 7.0+) ───────────────────────────
// `SharedStep` + write payloads (`AddSharedStepPayload` / `UpdateSharedStepPayload`)
// live in `src/schemas.ts` as Zod-derived types — source of truth for both the
// CLI `--data` validator and the programmatic client. Matches the AddCase /
// AddPlan / AddMilestone payload-migration precedent.

// ── Variables (TASK-029) ──────────────────────────────────────────────────────
// `Variable`, `AddVariablePayload`, and `UpdateVariablePayload` now live in
// `./schemas.ts` as Zod schemas (source of truth for runtime validation +
// inferred TS types).

// ── Datasets (TASK-030) ───────────────────────────────────────────────────────
// `Dataset`, `AddDatasetPayload`, and `UpdateDatasetPayload` now live in
// `./schemas.ts` as Zod schemas (source of truth for runtime validation +
// inferred TS types). Mirrors the Variables migration precedent (P1).

// ── Reports (TASK-031) ────────────────────────────────────────────────────────

/**
 * A report template returned by GET /get_reports/{project_id}.
 *
 * SPEC #2.1.16 — fields kept in lockstep with `ReportSchema`
 * (`src/schemas.ts`). The six `notify_*` system fields are documented
 * as always-included in the response but modelled as optional+nullable
 * here for defensive back-compat with older TestRail versions and to
 * match `notify_link_recipients`, which the doc example shows as
 * `null`. `is_shared` is not in the current doc field table; it
 * remains as a forward-compat placeholder.
 */
export interface Report {
    /** Unique report template ID */
    id: number;
    /** Display name of the report */
    name: string;
    /** Description of the report */
    description?: string | null;
    /** Indicates whether the author should be notified once the report has been executed */
    notify_user?: boolean | null;
    /** Indicates whether emails with links to the report should be sent */
    notify_link?: boolean | null;
    /** List of users to whom the report should be sent */
    notify_link_recipients?: string | null;
    /** Indicates whether the report should be emailed as an attachment */
    notify_attachment?: boolean | null;
    /** Indicates whether the attachment should be emailed in HTML format, if notify_attachment is true */
    notify_attachment_html_format?: boolean | null;
    /** Indicates whether the attachment should be emailed in PDF format, if notify_attachment is true */
    notify_attachment_pdf_format?: boolean | null;
    /** Whether the report is shared with other users (not in current doc; forward-compat) */
    is_shared?: boolean | null;
}

/**
 * Result returned by GET /run_report/{report_template_id}.
 *
 * SPEC #2.1.16 — fields kept in lockstep with `ReportResultSchema`
 * (`src/schemas.ts`). `report_html` and `report_pdf` are documented
 * response fields per the current doc example; `user_report_url` is
 * not in the current doc but retained as a legacy-compat placeholder.
 */
export interface ReportResult {
    /** URL to the generated report view */
    report_url: string;
    /** URL to fetch the report HTML (TestRail 5.7+, may be omitted on older servers) */
    report_html?: string | null;
    /** URL to fetch the report PDF (TestRail 5.7+, may be omitted on older servers) */
    report_pdf?: string | null;
    /** URL to the generated report user interface (legacy field; not in current doc) */
    user_report_url?: string | null;
}
