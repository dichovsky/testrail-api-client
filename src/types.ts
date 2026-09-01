import type { z, ZodError } from 'zod';
import type { KnownResponse } from './schemas/common.js';
import type {
    AttachmentSchema,
    CaseFieldConfigSchema,
    CaseFieldSchema,
    CaseSchema,
    CaseStatusSchema,
    CaseTypeSchema,
    ConfigurationGroupSchema,
    ConfigurationSchema,
    HistoryChangeSchema,
    HistoryEntrySchema,
    MilestoneSchema,
    PlanEntrySchema,
    PlanSchema,
    PrioritySchema,
    ProjectSchema,
    ReportResultSchema,
    ReportSchema,
    CrossProjectReportSchema,
    ResultFieldConfigSchema,
    ResultFieldSchema,
    ResultSchema,
    RoleSchema,
    RunSchema,
    SectionSchema,
    StatusSchema,
    SuiteSchema,
    TemplateSchema,
    TestSchema,
    UserSchema,
} from './schemas.js';

/** Flat custom fields are supported only on cases, tests, and results. */
type CustomFieldAccess = {
    [key: `custom_${string}`]: unknown;
};

type ResponseWithCustomFields<
    TSchema extends z.ZodObject,
    TKnown extends KnownResponse<TSchema> = KnownResponse<TSchema>,
> = TKnown extends { custom_fields?: infer TCustomFields }
    ? Omit<TKnown, 'custom_fields'> & {
          /**
           * @deprecated TestRail emits response custom fields as flat
           * `custom_*` properties. This container remains for compatibility
           * with older servers and proxies.
           */
          custom_fields?: TCustomFields;
      } & CustomFieldAccess
    : TKnown & CustomFieldAccess;

/**
 * Detail passed to {@link TestRailConfig.onSchemaMismatch} when a response
 * does not conform to its Zod schema.
 *
 * Nothing here is disclosed that the caller does not already receive — but a
 * hook usually *logs*, which moves the data somewhere the API response never
 * went. `endpoint`, `error`, and `data` can all carry personal or project data;
 * see the per-field notes below. In particular, Zod paths can contain
 * response-controlled record/catchall keys, so select only issue codes and
 * replace every path segment before sending them to telemetry.
 */
export interface SchemaMismatch {
    /** HTTP method of the originating request (e.g. `'GET'`). */
    method: string;
    /**
     * API endpoint of the originating request (e.g. `'get_results_for_run/{run_id}'`).
     *
     * **May contain personal data.** Path parameters can identify entities, and
     * query parameters can contain email addresses or other user-provided
     * values. For telemetry, keep only the operation token before the first
     * `/` or `&` rather than logging this value directly.
     */
    endpoint: string;
    /**
     * The Zod failure, listing every offending path.
     *
     * **May contain instance data.** Record/catchall keys can appear as path
     * segments, and issue messages/inputs are not a privacy boundary. Do not log
     * the error or raw issues wholesale.
     */
    error: ZodError;
    /**
     * The raw response body, returned to the caller unchanged.
     *
     * **May contain personal data** — user names and email addresses, result
     * comments, and custom fields all arrive here without redaction. Logging it
     * wholesale copies that into your log sink; select the fields you need.
     *
     * Treat as read-only: this is the same object reference the caller receives,
     * so mutating it in the hook changes what the caller sees. A mismatched GET
     * response is never written to the cache.
     */
    data: unknown;
}

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
    /**
     * Maximum number of retry attempts for failed requests. Must be a whole
     * number (integer) in the range 0–10; fractional or non-finite values are
     * rejected at construction (default: 3).
     */
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
    /**
     * Called when a TestRail **response** fails its Zod schema.
     *
     * Response validation is advisory: a mismatch normally does not throw on
     * its own. The raw body is returned to the caller unchanged and this hook
     * fires with the offending detail. Unset by default, in which case a
     * mismatch is silent. The non-idempotent `addCases` and `updateCases`
     * methods are the exception: after notifying this hook, an unrecognized
     * successful response throws an indeterminate-outcome error rather than
     * returning an empty list that could invite a duplicate retry.
     *
     * The hook is invoked outside any `try`, so **throwing from it propagates to
     * the caller**. That is the supported way to restore the pre-6.0.0
     * fail-closed behavior — useful in CI, where schema drift should break the
     * build, while production stays available:
     *
     * @example
     * // Observe drift without logging path IDs, query values, or response keys
     * onSchemaMismatch: ({ method, endpoint, error }) =>
     *     log.warn({
     *         method,
     *         operation: endpoint.replace(/[\/&].*$/, ''),
     *         issues: error.issues.map(({ code, path }) => ({
     *             code,
     *             path: path.length === 0 ? '$' : `$.${path.map(() => '*').join('.')}`,
     *         })),
     *     })
     *
     * @example
     * // Strict mode, byte-for-byte pre-6.0.0: `handleZodError` (exported from
     * // the package root) converts the ZodError to the TestRailValidationError
     * // that older versions threw, so existing `instanceof` handlers still match.
     * onSchemaMismatch: ({ error }) => { throw handleZodError(error); }
     *
     * @example
     * // Or throw the ZodError as-is, if you prefer the raw issue tree
     * onSchemaMismatch: ({ error }) => { throw error; }
     *
     * A response hook runs after TestRail has answered. For a mutating request,
     * its throw is not evidence that the server-side write failed and can
     * preempt a domain method's downstream response-shape guard. Never retry a
     * write blindly based only on an error thrown by this hook.
     *
     * **The hook must be synchronous.** An `async` function satisfies the `void`
     * return type but cannot restore fail-closed behavior — its throw becomes a
     * rejected promise nobody awaits, so validation silently fails open and the
     * rejection surfaces as an unhandled rejection (fatal on Node >= 15). A hook
     * that returns a thenable is rejected with `TestRailValidationError`. Do
     * async work in a fire-and-forget call inside a synchronous hook.
     * (`typescript-eslint`'s `no-misused-promises` catches this at lint time if
     * you have typed linting enabled; `tsc` alone does not.)
     *
     * **Do not mutate `mismatch.data`.** It is the same object reference the
     * caller receives, so an in-place edit (a redact-before-log pass, say)
     * would alter the returned value. A mismatched GET is never cached.
     *
     * **`endpoint` and `data` can carry personal data**; see
     * {@link SchemaMismatch} before logging either.
     *
     * Applies to responses only. Caller-supplied input — client configuration
     * and CLI write payloads — is validated on a separate path and still fails
     * closed.
     */
    onSchemaMismatch?: (mismatch: SchemaMismatch) => void;
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

export type Case = ResponseWithCustomFields<typeof CaseSchema>;

export type Suite = KnownResponse<typeof SuiteSchema>;

// AddSuitePayload and UpdateSuitePayload now live in `./schemas.ts` as Zod
// schemas (source of truth for runtime validation + inferred TS types).

export type Section = KnownResponse<typeof SectionSchema>;

export type Project = KnownResponse<typeof ProjectSchema>;

export type Plan = KnownResponse<typeof PlanSchema>;

export type PlanEntry = KnownResponse<typeof PlanEntrySchema>;

export type Run = KnownResponse<typeof RunSchema>;

export type Test = ResponseWithCustomFields<typeof TestSchema>;

export type Result = ResponseWithCustomFields<typeof ResultSchema>;

export type Milestone = KnownResponse<typeof MilestoneSchema>;

export type User = KnownResponse<typeof UserSchema>;

export type Status = KnownResponse<typeof StatusSchema>;

export type Priority = KnownResponse<typeof PrioritySchema>;

export type CaseStatus = KnownResponse<typeof CaseStatusSchema>;

export type HistoryChange = KnownResponse<typeof HistoryChangeSchema>;

export type HistoryEntry = KnownResponse<typeof HistoryEntrySchema>;

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
    /** Return only cases of one or more types (from `getCaseTypes()`) */
    typeId?: number | readonly number[];
    /** Return only cases with one or more priorities (from `getPriorities()`) */
    priorityId?: number | readonly number[];
    /** Return only cases using one or more templates (from `getTemplates()`) */
    templateId?: number | readonly number[];
    /** Return only cases linked to one or more milestones */
    milestoneId?: number | readonly number[];
    /** Return only cases created after this Unix timestamp */
    createdAfter?: number;
    /** Return only cases created before this Unix timestamp */
    createdBefore?: number;
    /** Return only cases created by one or more users */
    createdBy?: number | readonly number[];
    /** Return only cases whose title contains this string */
    filter?: string;
    /** Return only cases updated after this Unix timestamp */
    updatedAfter?: number;
    /** Return only cases updated before this Unix timestamp */
    updatedBefore?: number;
    /** Return only cases updated by one or more users */
    updatedBy?: number | readonly number[];
    /** Return only cases assigned one or more labels */
    labelId?: number | readonly number[];
    /**
     * Return only cases linked to external references. A string uses the
     * existing single-value `refs` parameter; an array uses TestRail 10.7+'s
     * repeated `refs[]` parameter. An empty array omits the filter.
     */
    refs?: string | readonly string[];
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
    /** Include runs that belong to test plans as well as standalone runs */
    includePlanRuns?: boolean;
    /** `true` to return only completed runs, `false` for active runs */
    isCompleted?: boolean;
    /** Return only runs linked to any of these milestone IDs */
    milestoneId?: number | readonly number[];
    /** Return only runs matching this reference ID */
    refs?: string;
    /**
     * Legacy reference filter. Sends both `refs` and `refs_filter` so callers
     * remain compatible with current and pre-10.4 TestRail servers.
     * @deprecated use `refs` when TestRail 10.4+ is guaranteed
     */
    refsFilter?: string;
    /** Return only runs for any of these suite IDs */
    suiteId?: number | readonly number[];
    /** Maximum number of runs to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export type ResultFieldConfig = KnownResponse<typeof ResultFieldConfigSchema>;

export type ResultField = KnownResponse<typeof ResultFieldSchema>;

// ── Case Fields & Types ───────────────────────────────────────────────────────

/** Context/options configuration block shared by CaseField entries. */
export type CaseFieldConfig = KnownResponse<typeof CaseFieldConfigSchema>;

/** Custom case field definition returned by get_case_fields. */
export type CaseField = KnownResponse<typeof CaseFieldSchema>;

/** Case type definition returned by get_case_types. */
export type CaseType = KnownResponse<typeof CaseTypeSchema>;

// ── Templates ─────────────────────────────────────────────────────────────────

/** Case template returned by get_templates (requires TestRail 5.2+). */
export type Template = KnownResponse<typeof TemplateSchema>;

// ── Configurations ────────────────────────────────────────────────────────────

/** An individual configuration (e.g. "Windows 10", "Chrome") within a group. */
export type Configuration = KnownResponse<typeof ConfigurationSchema>;

/** A configuration group (e.g. "Operating Systems", "Browsers"). */
export type ConfigurationGroup = KnownResponse<typeof ConfigurationGroupSchema>;

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
    createdAfter?: number;
    /** Only return plans created before this Unix timestamp */
    createdBefore?: number;
    /** Only return plans created by these user IDs */
    createdBy?: number[];
    /** `true` to return only completed plans, `false` for active plans */
    isCompleted?: boolean;
    /** Only return plans with these milestone IDs */
    milestoneId?: number[];
    /** Only return plans matching this reference ID */
    refs?: string;
    /** Maximum number of plans to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `createdAfter` */
    created_after?: number;
    /** @deprecated use `createdBefore` */
    created_before?: number;
    /** @deprecated use `createdBy` */
    created_by?: number[];
    /** @deprecated use `isCompleted` */
    is_completed?: 0 | 1;
    /** @deprecated use `milestoneId` */
    milestone_id?: number[];
}

/**
 * Filter options for `getTests()`.
 */
export interface GetTestsOptions {
    /** Only return tests with these status IDs */
    statusId?: number[];
    /** Only return tests carrying any of these label IDs */
    labelId?: number[];
    /** Maximum number of tests to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `statusId` */
    status_id?: number[];
    /** @deprecated use `labelId` */
    label_id?: number[];
}

/** Filter options shared by `getResults()` and `getResultsForCase()`. */
export interface GetResultsOptions {
    /** Only return results with these status IDs */
    statusId?: number[];
    /** Only return results whose `defects` field contains this string. */
    defectsFilter?: string;
    /** Maximum number of results to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `statusId` */
    status_id?: number[];
    /** @deprecated use `defectsFilter` */
    defects_filter?: string;
}

/**
 * Filter options for `getResultsForRun()`.
 * Date filters accept Unix timestamps (seconds).
 */
export interface GetResultsForRunOptions extends GetResultsOptions {
    /** Only return results created after this Unix timestamp */
    createdAfter?: number;
    /** Only return results created before this Unix timestamp */
    createdBefore?: number;
    /** Only return results created by these user IDs */
    createdBy?: number[];
    /** @deprecated use `createdAfter` */
    created_after?: number;
    /** @deprecated use `createdBefore` */
    created_before?: number;
    /** @deprecated use `createdBy` */
    created_by?: number[];
}

/**
 * Filter options for `getMilestones()`.
 */
export interface GetMilestonesOptions {
    /** `true` to return only completed milestones, `false` for active */
    isCompleted?: boolean;
    /** `true` to return only started milestones, `false` for not started */
    isStarted?: boolean;
    /** Maximum number of milestones to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `isCompleted` */
    is_completed?: 0 | 1;
    /** @deprecated use `isStarted` */
    is_started?: 0 | 1;
}

// ── Roles (TASK-025, requires TestRail 7.3+) ──────────────────────────────────

/** A user role returned by GET /get_roles (TestRail 7.3+) */
export type Role = KnownResponse<typeof RoleSchema>;

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
export type Attachment = KnownResponse<typeof AttachmentSchema>;

/** Test enriched by `get_test` with `with_data=1`. */
export type TestWithData = Test & {
    results: Result[];
    attachments: Attachment[];
};

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
export type Report = KnownResponse<typeof ReportSchema>;

/** Enterprise report template spanning multiple projects. */
export type CrossProjectReport = KnownResponse<typeof CrossProjectReportSchema>;

/**
 * Result returned by GET /run_report/{report_template_id}.
 *
 * SPEC #2.1.16 — fields kept in lockstep with `ReportResultSchema`
 * (`src/schemas.ts`). `report_html` and `report_pdf` are documented
 * response fields per the current doc example; `user_report_url` is
 * not in the current doc but retained as a legacy-compat placeholder.
 */
export type ReportResult = KnownResponse<typeof ReportResultSchema>;
