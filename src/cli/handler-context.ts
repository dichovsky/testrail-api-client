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
}

/**
 * Raw inputs for the body-source resolver. The handler decides whether to
 * consume any of these (write handlers do; read handlers ignore). When all
 * three are absent for a write action, the resolver emits a "body required"
 * error.
 */
export interface BodyInput {
    dataFlag?: string;
    dataFileFlag?: string;
    /** Stdin contents when piped (auto-detected via !process.stdin.isTTY). */
    stdin?: string;
}

export interface HandlerContext {
    client: TestRailClient;
    args: HandlerArgs;
    bodyInput: BodyInput;
    dryRun: boolean;
    out: (data: unknown) => void;
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
