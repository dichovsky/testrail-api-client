import type { HandlerContext } from '../handler-context.js';
import { parseId } from '../ids.js';
import { resolveBody } from '../body.js';
import type { BodyResolution } from '../body.js';
import { AddDatasetPayloadSchema, UpdateDatasetPayloadSchema } from '../../schemas.js';
import type { UpdateDatasetPayload } from '../../schemas.js';

export async function handleDatasetAdd(ctx: HandlerContext): Promise<void> {
    const projectId = parseId(ctx.args.pathParams[0], 'project_id');
    const body = resolveBody(ctx.bodyInput, AddDatasetPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'dataset add',
            projectId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.addDataset(projectId, body.payload));
}

/**
 * Update a dataset. `UpdateDatasetPayloadSchema` makes every field optional
 * (rename-only at the moment), so an absent body is a legitimate no-op
 * forwarded to TestRail. Rather than rejecting with the generic
 * `Body required` message, default `--data` / `--data-file` / stdin
 * being all unset to `{}` — the agent gets the same outcome as if it had
 * typed `--data '{}'` explicitly. When a body IS supplied it still flows
 * through `resolveBody` so JSON parse errors and Zod validation failures
 * surface unchanged. Source label flips to `'default'` so dry-run output
 * still makes the input mechanism explicit.
 */
export async function handleDatasetUpdate(ctx: HandlerContext): Promise<void> {
    const datasetId = parseId(ctx.args.pathParams[0], 'dataset_id');
    const noBody =
        ctx.bodyInput.dataFlag === undefined &&
        ctx.bodyInput.dataFileFlag === undefined &&
        ctx.bodyInput.readStdin === undefined;
    const body: BodyResolution<UpdateDatasetPayload> = noBody
        ? { ok: true, payload: {}, source: 'default' }
        : resolveBody(ctx.bodyInput, UpdateDatasetPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'dataset update',
            datasetId,
            payload: body.payload,
            source: body.source,
        });
        return;
    }
    ctx.out(await ctx.client.updateDataset(datasetId, body.payload));
}

/**
 * Destructive: deletes a dataset. Gated by `--yes`; `--dry-run` wins for
 * preview-without-API. TestRail's `delete_dataset` does NOT support the
 * `soft=1` server-side preview, so `--soft` is rejected — keeping
 * destructive intent unambiguous (mirrors the `variable delete` /
 * `milestone delete` / `project delete` pattern).
 *
 * Check order (canonical, matches the variable/plan destructive pattern):
 *   parseId → `--dry-run` (wins) → `--soft` reject → `--yes` gate.
 * Putting `--dry-run` first means a caller previewing a destructive op
 * never trips the `--soft` rejection — preview is always a no-op against
 * the network, regardless of other intent flags.
 */
export async function handleDatasetDelete(ctx: HandlerContext): Promise<void> {
    const datasetId = parseId(ctx.args.pathParams[0], 'dataset_id');

    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'dataset delete', datasetId, destructive: true });
        return;
    }

    if (ctx.args.soft === true) {
        throw new Error('dataset delete does not support --soft.');
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    await ctx.client.deleteDataset(datasetId);
    ctx.out({ datasetId, deleted: true });
}
