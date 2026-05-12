import type { TestRailClient } from '../client.js';

/**
 * Parsed CLI argument bundle passed to every handler. All fields are optional —
 * each handler reads only what it needs and validates accordingly.
 */
export interface HandlerArgs {
    idArg?: string;
    projectId?: string;
    suiteId?: string;
    runId?: string;
    caseId?: string;
    limit?: string;
    offset?: string;
}

export interface HandlerContext {
    client: TestRailClient;
    args: HandlerArgs;
    out: (data: unknown) => void;
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
