import type { HandlerContext } from '../handler-context.js';
import { resolveBody } from '../body.js';
import { AddCaseFieldPayloadSchema } from '../../schemas.js';

/**
 * `case-field add` — create a custom case field (admin-only). No path
 * params; the payload carries `type`, `name`, `label`, and `configs[]`.
 * Dry-run emits the parsed payload plus the action label without hitting
 * the API.
 */
export async function handleCaseFieldAdd(ctx: HandlerContext): Promise<void> {
    const body = resolveBody(ctx.bodyInput, AddCaseFieldPayloadSchema);
    if (!body.ok) throw new Error(body.error);
    if (ctx.dryRun) {
        ctx.out({ dryRun: true, action: 'case-field add', payload: body.payload, source: body.source });
        return;
    }
    ctx.out(await ctx.client.addCaseField(body.payload));
}
