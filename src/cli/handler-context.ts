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
    /** Comma-separated list of status IDs (`--status-id 1,5`) consumed by
     *  `test list` to filter on TestRail's `status_id` query param. Parsed
     *  into a `number[]` by the handler so invalid tokens surface as
     *  `IdParseError` and not silent drops. */
    statusId?: string;
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
