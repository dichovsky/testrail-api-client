import type { TestRailClient } from '../client.js';
import type { CliPaginationParsed } from './pagination.js';

/**
 * Parsed CLI argument bundle passed to every handler.
 *
 * `pathParams` is the slice of positional args after `[resource, action]` —
 * read handlers consume `pathParams[0]` (the single id), write handlers may
 * consume multiple (e.g., `result add <run_id> <case_id>` uses [0] and [1]).
 */
export interface HandlerArgs {
    pathParams: readonly string[];
    projectId?: string;
    suiteId?: string;
    sectionId?: string;
    runId?: string;
    caseId?: string;
    typeId?: string;
    priorityId?: string;
    templateId?: string;
    milestoneId?: string;
    createdAfter?: string;
    createdBefore?: string;
    createdBy?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    updatedBy?: string;
    labelId?: string;
    /** Comma-separated external references. TestRail 10.7 list endpoints
     *  serialize multiple values as repeated `refs[]` query parameters. */
    refs?: string;
    /** Case-title substring filter used by `case list`. */
    filter?: string;
    /** Include plan-owned runs in `run list`. */
    includePlanRuns?: boolean;
    /** Boolean list filter encoded as `true|false|1|0`. */
    isCompleted?: string;
    limit?: string;
    offset?: string;
    /** Return a normalized pagination envelope instead of the legacy item array. */
    page?: boolean;
    /** Fetch every page subject to the explicit aggregate safety bounds. */
    all?: boolean;
    /** Per-request page size for `--all`; distinct from the legacy `--limit`. */
    pageSize?: string;
    /** Initial offset for `--all`; distinct from the legacy `--offset`. */
    startOffset?: string;
    maxPages?: string;
    maxItems?: string;
    maxDurationMs?: string;
    maxBytes?: string;
    /** Comma-separated list of status IDs (`--status-id 1,5`). Consumed by
     *  `test list` (filters on TestRail's `status_id` query param) and by
     *  `result list-for-test` / `result list-for-case` (filters by result
     *  status). Parsed into a `number[]` by the handler so invalid tokens
     *  surface as `IdParseError` and not silent drops. */
    statusId?: string;
    /** Substring filter on the result `defects` field (`--defects-filter
     *  JIRA-123`); used by result list-for-test / list-for-case. */
    defectsFilter?: string;
    /** Path to a binary file for attachment upload actions (`--file <path>`). */
    file?: string;
    /** Optional override for the upload filename; otherwise derived from `basename(file)`. */
    filename?: string;
    /** Path to write a binary download to for `attachment get` (`--out <path>`). */
    out?: string;
    /** True when `--soft` is set; adds `soft=1` to `case delete-bulk` for a
     *  server-side preview (TestRail returns affected counts without
     *  deleting). Distinct from `--dry-run` (client-side, no API call). */
    soft?: boolean;
    /** Email address for lookup actions (`user get-by-email --email <addr>`).
     *  Reuses the same `--email` flag that supplies the auth credential — the
     *  flag is consumed twice by design: once by `resolveAuth()` for the HTTP
     *  Basic credential, and once here for the query payload. The handler
     *  requires this to be a non-empty string; format is enforced client-side
     *  by `EMAIL_REGEX` in `src/modules/users.ts` before any network call. */
    email?: string;
    /** Polling interval in seconds for `run watch` (`--interval N`). Bounds
     *  (min 5, max 600) are enforced inside the handler so a typo doesn't
     *  silently flood TestRail's rate budget (5s floor keeps headroom under
     *  the default 100 req/60s sliding window). */
    interval?: string;
    /** Single-poll mode for `run watch` (`--once`). Skips scheduling the next
     *  recursive setTimeout iteration. */
    once?: boolean;
}

/**
 * Raw inputs for the body-source resolver. The handler decides whether to
 * consume any of these (write handlers do; read handlers ignore). When all
 * three are absent for a write action, the resolver emits a "body required"
 * error.
 *
 * `readStdin` is a thunk rather than pre-read contents so stdin is *only*
 * drained when the resolver actually selects it as the body source. Read
 * actions and no-body writes (`run close`) never invoke it — avoiding the
 * "tail -f | testrail run close" hang and the cost of slurping a large
 * redirected stdin that the handler will throw away.
 */
export interface BodyInput {
    dataFlag?: string;
    dataFileFlag?: string;
    readStdin?: () => string;
}

export interface HandlerContext {
    client: TestRailClient;
    args: HandlerArgs;
    pagination?: CliPaginationParsed;
    bodyInput: BodyInput;
    dryRun: boolean;
    /** True when `--force` is set; permits overwriting an existing `--out` file. */
    force: boolean;
    /** True when `--yes` is set; required to execute destructive actions
     *  (e.g. `attachment delete`). When both `--dry-run` and `--yes` are
     *  passed, dry-run wins and the destructive call is not executed. */
    confirmDestructive: boolean;
    out: (data: unknown) => void;
    /** Quiet-aware stderr writer with a sanitized 'Error: ' prefix. Used by
     *  handlers for human-readable warnings (e.g., the `--out -` TTY guard).
     *  Optional so existing handlers and tests that build a minimal ctx
     *  remain valid without a stub. */
    err?: (message: string) => void;
    /** Quiet-aware raw stderr writer (no 'Error:' prefix, caller controls
     *  the exact bytes written). Used by `attachment get --out -` to emit
     *  the JSON ack on stderr so stdout stays pure binary. Optional so
     *  existing handlers and minimal-ctx tests remain valid. */
    errRaw?: (chunk: string) => void;
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
