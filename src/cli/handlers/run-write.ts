import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import { AddRunPayloadSchema } from '../../schemas.js';

export async function handleRunAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddRunPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'run add', projectId, payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addRun(projectId, body.payload));
}

/**
 * Close a run. Unlike the other write actions this takes no body — just a
 * single `run_id` path param. POST has no payload, so the body-source
 * resolver is not consulted; any `--data` / `--data-file` / stdin supplied
 * for this action is silently ignored.
 *
 * Destructive: closing a run is irreversible (TestRail offers no `open_run`
 * endpoint). Gated by `--yes`; if `--dry-run` is also passed, dry-run wins
 * (no API call) and emits a preview with `destructive: true` so callers can
 * spot it in audit output. Mirrors `handleAttachmentDelete` / `handleCaseDeleteBulk`.
 */
export async function handleRunClose(ctx: HandlerContext): Promise<void> {
    const runId = parseId(ctx.args.pathParams[0], 'run_id');
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'run close', runId, destructive: true });
        return;
    }
    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }
    ctx.out(await ctx.client.closeRun(runId));
}
