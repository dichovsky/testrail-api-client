import type { TestRailClient } from '../client.js';
import type { CliHandlerArgs } from './flags.js';
import type { ActionSpec } from './metadata/types.js';
import type { CliPaginationParsed } from './pagination.js';

/** Parsed CLI argument bundle passed to every handler. */
export type HandlerArgs = CliHandlerArgs;

/** Raw inputs for the body-source resolver. */
export interface BodyInput {
    dataFlag?: string;
    dataFileFlag?: string;
    readStdin?: () => string;
}

export interface HandlerContext {
    client: TestRailClient;
    /** Resolved metadata entry used for handler execution semantics. */
    actionSpec: Pick<ActionSpec, 'resource' | 'action' | 'softMode'>;
    args: HandlerArgs;
    pagination: CliPaginationParsed;
    bodyInput: BodyInput;
    dryRun: boolean;
    /** True when `--force` permits overwriting an existing output file. */
    force: boolean;
    /** Per-invocation confirmation required for destructive actions. */
    confirmDestructive: boolean;
    out: (data: unknown) => void;
    /** Quiet-aware, sanitized stderr writer with an `Error:` prefix. */
    err?: (message: string) => void;
    /** Quiet-aware raw stderr writer for binary-output acknowledgements. */
    errRaw?: (chunk: string) => void;
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
