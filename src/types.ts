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
}

export interface UploadFilePathInput {
    path: string;
    type?: string;
    /**
     * Optional open file descriptor to read the upload content from.
     * When provided on POSIX systems (macOS, Linux), the client will stream the
     * file content directly from this descriptor (protecting against TOCTOU symlink
     * swap attacks) and will automatically close the descriptor after upload.
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
}

export interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role_id?: number | null;
    role?: string | null;
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

// ── User Management (TASK-024, requires TestRail 7.3+) ────────────────────────

/** Payload for creating a new user via POST /add_user (TestRail 7.3+) */
export interface AddUserPayload {
    /** User's email address */
    email: string;
    /** User's full name */
    name: string;
    /** Whether the user account is active (default: true) */
    is_active?: boolean;
    /** Role ID to assign to the user */
    role_id?: number;
    /** Password for the new user */
    password?: string;
}

/** Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+) */
export interface UpdateUserPayload {
    /** User's email address */
    email?: string;
    /** User's full name */
    name?: string;
    /** Whether the user account is active */
    is_active?: boolean;
    /** Role ID to assign to the user */
    role_id?: number;
    /** New password for the user */
    password?: string;
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

/** An attachment metadata record returned by attachment list and upload endpoints */
export interface Attachment {
    /** Unique attachment ID */
    attachment_id: number;
    /** Original filename */
    name: string;
    /** Filename returned by the API (when available) */
    filename?: string | null;
    /** File size in bytes */
    size?: number | null;
    /** Unix timestamp when the attachment was created */
    created_on?: number | null;
    /** ID of the user who created the attachment */
    created_by?: number | null;
    /** Numeric ID of the entity this attachment belongs to */
    entity_id?: number | null;
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

/** A report template returned by GET /get_reports/{project_id} */
export interface Report {
    /** Unique report template ID */
    id: number;
    /** Display name of the report */
    name: string;
    /** Description of the report */
    description?: string | null;
    /** Whether the report is shared with other users */
    is_shared?: boolean | null;
}

/** Result returned by GET /run_report/{report_template_id} */
export interface ReportResult {
    /** URL to the generated HTML report */
    report_url: string;
    /** URL to the generated report user interface */
    user_report_url?: string | null;
}
