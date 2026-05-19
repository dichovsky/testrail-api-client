import type { TestRailClient } from '../client.js';

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
    runId?: string;
    caseId?: string;
    limit?: string;
    offset?: string;
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
    bodyInput: BodyInput;
    dryRun: boolean;
    /** True when `--force` is set; permits overwriting an existing `--out` file. */
    force: boolean;
    /** True when `--yes` is set; required to execute destructive actions
     *  (e.g. `attachment delete`). When both `--dry-run` and `--yes` are
     *  passed, dry-run wins and the destructive call is not executed. */
    confirmDestructive: boolean;
    out: (data: unknown) => void;
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
