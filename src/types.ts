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
           * `custom_*` properties. This container stays for compatibility
           * with older servers and proxies.
           */
          custom_fields?: TCustomFields;
      } & CustomFieldAccess
    : TKnown & CustomFieldAccess;

/**
 * Detail passed to {@link TestRailConfig.onSchemaMismatch} when a response
 * does not match its Zod schema.
 *
 * This detail contains no data that the caller does not already receive. But
 * a hook usually *logs* the detail, and thus moves the data to a location where
 * the API response never went. `endpoint`, `error`, and `data` can all carry
 * personal or project data. See the per-field notes below. In particular, Zod
 * paths can contain response-controlled record/catchall keys. Before you send
 * issue data to telemetry, select only the issue codes. Also replace each path
 * segment.
 */
export interface SchemaMismatch {
    /** HTTP method of the originating request (e.g. `'GET'`). */
    method: string;
    /**
     * API endpoint of the originating request (e.g. `'get_results_for_run/{run_id}'`).
     *
     * **Can contain personal data.** Path parameters can identify entities, and
     * query parameters can contain email addresses or other user-supplied
     * values. For telemetry, keep only the operation token before the first
     * `/` or `&`. Do not log this value directly.
     */
    endpoint: string;
    /**
     * The Zod failure, with a list of all offending paths.
     *
     * **Can contain instance data.** Record/catchall keys can appear as path
     * segments, and issue messages/inputs are not a privacy boundary. Do not log
     * the error or raw issues wholesale.
     */
    error: ZodError;
    /**
     * The raw response body, returned to the caller unchanged.
     *
     * **Can contain personal data.** User names and email addresses, result
     * comments, and custom fields all arrive here without redaction. If you log
     * this value wholesale, you copy that data into your log sink. Select the
     * fields that you need.
     *
     * Treat this value as read-only. It is the same object reference that the
     * caller receives. Thus, if the hook mutates it, the caller sees the change.
     * The client never writes a mismatched GET response to the cache.
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
    /**
     * Per-attempt timeout in milliseconds (default: 30000ms, maximum 5
     * minutes).
     *
     * The timeout includes DNS resolution and the connect/send/response-headers
     * phase, because `dns.lookup` has no deadline of its own. If the timeout
     * did not include DNS resolution, the call would have no time limit. Thus,
     * with a short timeout and a slow resolver, the call can fail before the
     * client sends any request. A separate option,
     * {@link TestRailConfig.bodyTimeout}, limits the response body.
     */
    timeout?: number;
    /**
     * Maximum number of retry attempts for failed requests (default: 3). The
     * value must be a whole number (integer) in the range 0–10. The constructor
     * rejects fractional or non-finite values.
     */
    maxRetries?: number;
    /** Enable caching for static resources (default: true) */
    enableCache?: boolean;
    /** Cache TTL in milliseconds (default: 300000ms = 5 minutes) */
    cacheTtl?: number;
    /**
     * Cache cleanup interval in milliseconds. The value must be an integer from
     * 0 through 2,147,483,647. A value of 0 disables periodic cleanup. Default:
     * 60,000.
     */
    cacheCleanupInterval?: number;
    /**
     * Maximum number of entries in the cache (default: 1000).
     * Set the value to 0 for an unlimited cache (not recommended).
     */
    maxCacheSize?: number;
    /** Rate limiting configuration (default: 100 requests per minute) */
    rateLimiter?: RateLimiterConfig;
    /**
     * Allow HTTP (non-TLS) connections. Enable this option only in isolated
     * development environments. HTTP sends credentials in cleartext. Default:
     * false.
     */
    allowInsecure?: boolean;
    /**
     * Allow requests to private/loopback/link-local hosts (e.g. localhost, 192.168.x.x).
     * Enable this option only when the TestRail server is on a private network.
     * Default: false.
     */
    allowPrivateHosts?: boolean;
    /**
     * Maximum number of bytes that the client accepts from a JSON, text, or
     * multipart-error response body (SEC #12). Above this limit, the client
     * aborts the read with a `TestRailApiError`. Default: 10 MiB. Hard ceiling:
     * 1 GiB.
     *
     * Override only when bulk-export endpoints (large `get_cases`,
     * `get_results`) legitimately exceed the default. Lower values are also
     * permitted. They are useful in memory-constrained containers.
     */
    maxJsonResponseBytes?: number;
    /**
     * Maximum number of bytes that the client accepts from a binary response
     * body (`request({ responseKind: 'binary' })`, used for attachment
     * downloads). Default: 100 MiB. Hard ceiling: 1 GiB.
     *
     * Larger attachments need an explicit override. They can still cause OOM,
     * because the client keeps the whole buffer in memory.
     */
    maxBinaryResponseBytes?: number;
    /**
     * Wall-clock deadline applied to the response-body read, in milliseconds
     * (SEC #21). When the value is `undefined` (default), the client uses the
     * request `timeout`. Set the value to `0` to disable the deadline (not
     * recommended). Then only the byte cap protects the read.
     *
     * This deadline is independent of `timeout`. `timeout` applies to DNS
     * resolution and the connect/send/response-headers phase.
     */
    bodyTimeout?: number;
    /**
     * Register Node.js process listeners for `exit`, `SIGINT`, and `SIGTERM`.
     * The listeners call {@link TestRailClient.destroy} on each active client.
     * For SIGINT/SIGTERM, the listeners also terminate the process with the
     * standard 130/143 exit codes. Default: **false**.
     *
     * Set this option to `true` only in entry-point processes (CLIs, standalone
     * scripts) that own the process lifecycle. SDK consumers, for example
     * Express servers, daemons, and hosts that already manage shutdown, should
     * keep it `false` (the default). Then the client does not hijack their own
     * signal handling, and does not call `process.exit()` for them. Explicit
     * `destroy()` from the caller is always sufficient for cleanup.
     */
    registerProcessHandlers?: boolean;
    /**
     * Custom `fetch` implementation that this client uses for all its HTTP
     * requests. The function must have the same signature as
     * `globalThis.fetch`. The default is `globalThis.fetch`. This option is
     * useful for testing or for trusted custom transports.
     *
     * With private-host protection enabled, requests include Node fetch's
     * `dispatcher` extension to bind connections to validated DNS addresses.
     * A custom transport must use that dispatcher or apply equivalent
     * destination checks itself. The transport must also use `signal` and
     * manual redirects. Transports that ignore the extension (including some
     * fetch polyfills or proxy wrappers) do not get DNS pinning from this
     * client.
     */
    fetch?: typeof globalThis.fetch;
    /**
     * Custom DNS lookup function for SSRF host validation and DNS pinning
     * (SEC #31). The client ignores this function when `allowPrivateHosts` is
     * enabled. The function receives the bare hostname (no brackets for IPv6
     * literals). It must return the resolved addresses in the same shape as
     * `node:dns/promises lookup(hostname, { all: true })`.
     * Each result must contain a valid IP literal and its matching numeric
     * family (`4` or `6`). The client rejects omitted, zero, and mismatched
     * families before dispatch, even if other records in the answer are valid.
     *
     * Use this option when the system DNS cannot reach the TestRail hostname
     * (e.g. CI networks with split-horizon DNS). The option can supply static
     * host-to-IP mappings or a custom resolver. The SSRF private-IP check
     * still runs on the returned addresses. This option does **not** bypass
     * the security validation. It only replaces the resolution mechanism.
     * Native fetch connects to the addresses in the validated answer snapshot.
     * It keeps the configured hostname for the Host header and TLS certificate
     * verification.
     *
     * When you omit this option (default), the client uses the Node system
     * resolver. Resolution runs before each upstream fetch attempt, including
     * retries. Cache hits and callers that join an in-flight request do not
     * call the function again.
     *
     * @example
     * // Map a corporate hostname to an approved public address
     * dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }]
     */
    dnsLookup?: (hostname: string) => Promise<{ address: string; family: number }[]>;
    /**
     * Called when a TestRail **response** fails its Zod schema.
     *
     * Response validation is advisory: a mismatch normally does not throw on
     * its own. The client returns the raw body to the caller unchanged, and
     * calls this hook with the offending detail. The hook is unset by default.
     * Without a hook, a mismatch is silent.
     *
     * The non-idempotent `addCases` and `updateCases` methods do not follow
     * this rule. After these methods call this hook, an unrecognized successful
     * response causes an indeterminate-outcome error. The methods do not return
     * an empty list, because an empty list can cause a duplicate retry.
     *
     * The client calls the hook outside any `try`. Thus, **an error that the
     * hook throws propagates to the caller**. Such a throw is the supported way
     * to restore the pre-6.0.0 fail-closed behavior. This behavior is useful in
     * CI, where a schema mismatch should break the build, while production
     * stays available:
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
     * a throw from the hook is not evidence that the server-side write failed.
     * The throw can also preempt the downstream response-shape guard of a
     * domain method. Never retry a write blindly only because of an error that
     * this hook throws.
     *
     * **The hook must be synchronous.** An `async` function satisfies the `void`
     * return type but cannot restore fail-closed behavior. Its throw becomes a
     * rejected promise that no code awaits. Thus, validation silently fails
     * open, and the rejection becomes an unhandled rejection (fatal on
     * Node >= 15). If a hook returns a thenable, the client throws
     * `TestRailValidationError`. Do async work in a fire-and-forget call inside
     * a synchronous hook. (If type-aware linting is enabled, the
     * `no-misused-promises` rule of `typescript-eslint` and of oxlint finds an
     * `async` hook at lint time. `tsc` alone does not.)
     *
     * **Do not mutate `mismatch.data`.** It is the same object reference that
     * the caller receives. Thus, an in-place edit (for example, a
     * redact-before-log pass) would change the returned value. The client
     * never caches a mismatched GET response.
     *
     * **`endpoint` and `data` can carry personal data.** Read
     * {@link SchemaMismatch} before you log either value.
     *
     * This hook applies to responses only. Caller-supplied input (client
     * configuration and CLI write payloads) has a separate validation path,
     * which still fails closed.
     */
    onSchemaMismatch?: (mismatch: SchemaMismatch) => void;
}

export interface UploadFilePathInput {
    path: string;
    type?: string;
    /**
     * Optional open file descriptor to read the upload content from.
     *
     * On POSIX (macOS, Linux), the upload streams through `/dev/fd/<N>` or
     * `/proc/self/fd/<N>` and does not open `path` again. Thus, a symlink swap
     * between your open and our read cannot redirect the upload. Other
     * platforms have no such mapping, and the client uses `path` directly.
     *
     * **The upload takes ownership of the descriptor when you call its SDK
     * method.** Ownership also applies when the call fails because of invalid
     * IDs, invalid request options, or a destroyed client. The client releases
     * the descriptor on these failures. On POSIX, the descriptor stays open
     * while the upload needs it. Other platforms close the descriptor when they
     * prepare the upload, because they use the path directly.
     * Do not close or reuse the descriptor yourself. Open a separate descriptor
     * for each upload.
     *
     * A timeout can arrive before transport work settles. Use
     * `trackOperation().settled` when you must wait for all associated cleanup.
     *
     * The union contains `| undefined` to stay compatible with TS
     * exactOptionalPropertyTypes.
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
 * `soft`. On those endpoints, this option would be a no-op on the server.
 * Thus, the CLI rejects the option, so that the destructive intent stays
 * unambiguous.
 *
 * Soft mode is different from a client-side `--dry-run`, which stops before
 * any API call. `soft=1` *does* send a request to the API, and TestRail
 * returns counts of affected entities (see {@link SoftDeletePreview} in
 * `./schemas.ts`).
 */
export interface SoftDeleteOptions {
    /** When true, request a server-side preview, not a hard delete. */
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
     * existing single-value `refs` parameter. An array uses the repeated
     * `refs[]` parameter of TestRail 10.7+. For an empty array, the request
     * does not include the filter.
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
    createdBy?: number | readonly number[];
    /** Include runs that belong to test plans as well as standalone runs */
    includePlanRuns?: boolean;
    /** `true` to return only completed runs, `false` for active runs */
    isCompleted?: boolean;
    /** Return only runs linked to any of these milestone IDs */
    milestoneId?: number | readonly number[];
    /** Return only runs matching this reference ID */
    refs?: string;
    /**
     * Legacy reference filter. The client sends both `refs` and `refs_filter`,
     * so that callers stay compatible with current and pre-10.4 TestRail
     * servers.
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
    createdBy?: number | readonly number[];
    /** `true` to return only completed plans, `false` for active plans */
    isCompleted?: boolean;
    /** Only return plans with these milestone IDs */
    milestoneId?: number | readonly number[];
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
    created_by?: number | readonly number[];
    /** @deprecated use `isCompleted` */
    is_completed?: 0 | 1;
    /** @deprecated use `milestoneId` */
    milestone_id?: number | readonly number[];
}

/**
 * Filter options for `getTests()`.
 */
export interface GetTestsOptions {
    /** Only return tests with these status IDs */
    statusId?: number | readonly number[];
    /** Only return tests carrying any of these label IDs */
    labelId?: number | readonly number[];
    /** Maximum number of tests to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `statusId` */
    status_id?: number | readonly number[];
    /** @deprecated use `labelId` */
    label_id?: number | readonly number[];
}

/** Filter options shared by `getResults()` and `getResultsForCase()`. */
export interface GetResultsOptions {
    /** Only return results with these status IDs */
    statusId?: number | readonly number[];
    /** Only return results whose `defects` field contains this string. */
    defectsFilter?: string;
    /** Maximum number of results to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** @deprecated use `statusId` */
    status_id?: number | readonly number[];
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
    createdBy?: number | readonly number[];
    /** @deprecated use `createdAfter` */
    created_after?: number;
    /** @deprecated use `createdBefore` */
    created_before?: number;
    /** @deprecated use `createdBy` */
    created_by?: number | readonly number[];
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
 * SPEC #2.1.14: this type mirrors `AttachmentSchema` (see `src/schemas.ts` for
 * the full rationale). TestRail emits three+ response shapes through the same
 * `Attachment` type:
 *  - upload-POST: only `attachment_id`.
 *  - legacy list (`get_attachments_for_case` / `_test`): `id`, `name`,
 *    `size`, `created_on`, `project_id`, `case_id`, `user_id`, `result_id`.
 *  - plan/run list: adds `entity_attachments_id`, `icon_name`. `case_id`
 *    can be `null`.
 *  - cloud TestRail 7.1+: `id` becomes a UUID string and `entity_id` becomes
 *    a string. The response also contains `client_id`, `entity_type`,
 *    `data_id`, `filetype`, `legacy_id`, `is_image`, `icon`.
 *
 * Each field is optional/nullable, so that a single type can describe the full
 * union. Use the field that is applicable to the endpoint that you called.
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
 * SPEC #2.1.16: the fields of this type must stay the same as `ReportSchema`
 * (`src/schemas.ts`). The TestRail documentation shows the six `notify_*`
 * system fields as always included in the response. This type models them
 * as optional and nullable, for defensive back-compat with older TestRail
 * versions. The optional and nullable model also matches
 * `notify_link_recipients`, which the doc example shows as `null`.
 * `is_shared` is not in the current doc field table. It stays as a
 * forward-compat placeholder.
 */
export type Report = KnownResponse<typeof ReportSchema>;

/** Enterprise report template spanning multiple projects. */
export type CrossProjectReport = KnownResponse<typeof CrossProjectReportSchema>;

/**
 * Result returned by GET /run_report/{report_template_id}.
 *
 * SPEC #2.1.16: the fields of this type must stay the same as `ReportResultSchema`
 * (`src/schemas.ts`). `report_html` and `report_pdf` are documented
 * response fields, as the current doc example shows. `user_report_url` is
 * not in the current doc, but this type keeps it as a legacy-compat
 * placeholder.
 */
export type ReportResult = KnownResponse<typeof ReportResultSchema>;
