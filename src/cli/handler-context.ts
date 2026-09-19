import type { TestRailClient } from '../client.js';
import type { CliHandlerArgs } from './flags.js';
import type { ActionSpec } from './metadata/types.js';
import type { Output } from './output.js';
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
    /**
     * The resolved metadata entry. The whole spec, not a projection of it:
     * `runCli` always passed the full object and only the type narrowed it, so
     * the `Pick` described the caller's generosity rather than the handler's
     * needs — and a handler that wanted one more field had to be given a
     * parallel channel for it instead.
     */
    actionSpec: ActionSpec;
    args: HandlerArgs;
    pagination: CliPaginationParsed;
    bodyInput: BodyInput;
    dryRun: boolean;
    /** True when `--force` permits overwriting an existing output file. */
    force: boolean;
    /** Per-invocation confirmation required for destructive actions. */
    confirmDestructive: boolean;
    /**
     * The writer set from `src/cli/output.ts`, spread in whole. Non-optional:
     * a handler that cannot rely on being handed a writer reaches for
     * `process.stderr` instead, which is how `run watch`'s status line ended
     * up reading `--quiet` out of `process.argv` and the download ack ended up
     * bypassing the runtime entirely.
     */
    out: Output['out'];
    outRaw: Output['outRaw'];
    outPayload: Output['outPayload'];
    err: Output['err'];
    errRaw: Output['errRaw'];
}

export type Handler = (ctx: HandlerContext) => Promise<void>;
