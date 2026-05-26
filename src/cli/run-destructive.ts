import type { HandlerContext } from './handler-context.js';

/**
 * Canonical protocol for no-soft destructive CLI actions (Pattern B):
 *   dryRun  → emit preview + return (no API call)
 *   soft unsupported (opts.softUnsupported) + soft flag → throw  [opt-in]
 *   !yes    → throw
 *   execute()
 *
 * For handlers where the API supports `?soft=1`: handle the soft path
 * (early API call + return) BEFORE calling runDestructive, so this helper
 * only sees the non-soft destructive path.
 */
export async function runDestructive(
    ctx: HandlerContext,
    preview: Record<string, unknown>,
    execute: () => Promise<void>,
    opts?: { softUnsupported?: boolean },
): Promise<void> {
    if (ctx.dryRun) {
        ctx.out({ ...preview, dryRun: true, destructive: true });
        return;
    }
    if (opts?.softUnsupported === true && ctx.args.soft === true) {
        const action = typeof preview['action'] === 'string' ? preview['action'] : 'this action';
        throw new Error(`${action} does not support --soft.`);
    }
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }
    await execute();
}
