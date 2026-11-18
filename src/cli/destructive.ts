import type { HandlerContext } from './handler-context.js';

type DestructiveContext = Pick<HandlerContext, 'args' | 'actionSpec' | 'dryRun' | 'confirmDestructive' | 'out'>;

/** Command-specific output and a lazy SDK call, supplied after input validation. */
export interface DestructiveExecution<Result> {
    readonly preview: (soft: boolean) => unknown;
    readonly call: (soft: boolean) => Promise<Result>;
    readonly formatResult: (result: Result, soft: boolean) => unknown;
}

/** Resolve metadata-owned soft support while preserving dry-run precedence. */
function resolveSoftFlag(ctx: DestructiveContext): boolean {
    const requested = ctx.args.soft === true;
    const supported = ctx.actionSpec.softMode === 'optional';
    if (requested && !supported && !ctx.dryRun) {
        throw new Error(`${ctx.actionSpec.resource} ${ctx.actionSpec.action} does not support --soft.`);
    }
    return requested && supported;
}

/** Preview locally or require confirmation before executing and reporting success. */
export async function executeDestructive<Result>(
    ctx: DestructiveContext,
    execution: DestructiveExecution<Result>,
): Promise<void> {
    const soft = resolveSoftFlag(ctx);
    if (ctx.dryRun) {
        ctx.out(execution.preview(soft));
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    const result = await execution.call(soft);
    ctx.out(execution.formatResult(result, soft));
}
