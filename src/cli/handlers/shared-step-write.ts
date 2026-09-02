import { AddSharedStepPayloadSchema, UpdateSharedStepPayloadSchema } from '../../schemas.js';
import type { HandlerContext } from '../handler-context.js';
import { parseOptionalBoolean } from '../filters.js';
import { parseId } from '../ids.js';
import { createWriteHandler, resolveSoftFlag } from '../write-handler-factory.js';

export const handleSharedStepAdd = createWriteHandler({
    action: 'shared-step add',
    pathParams: ['project_id'],
    bodySchema: AddSharedStepPayloadSchema,
    call: (client, [projectId], body) => client.sharedSteps.addSharedStep(projectId, body),
});

export const handleSharedStepUpdate = createWriteHandler({
    action: 'shared-step update',
    pathParams: ['shared_step_id'],
    bodySchema: UpdateSharedStepPayloadSchema,
    call: (client, [sharedStepId], body) => client.sharedSteps.updateSharedStep(sharedStepId, body),
});

/**
 * Destructive: deletes a shared step. Cases that reference it keep their step
 * content but lose the shared reference (per TestRail's documented behavior).
 * TestRail's `delete_shared_step` has no `soft=1` preview, so `--soft` is
 * rejected.
 */
export async function handleSharedStepDelete(ctx: HandlerContext): Promise<void> {
    const sharedStepId = parseId(ctx.args.pathParams[0], 'shared_step_id');
    const keepInCases = parseOptionalBoolean(ctx.args.keepInCases, '--keep-in-cases');
    resolveSoftFlag(ctx);

    if (ctx.dryRun) {
        ctx.out({
            dryRun: true,
            action: 'shared-step delete',
            sharedStepId,
            keepInCases: keepInCases ?? true,
            destructive: true,
        });
        return;
    }

    if (!ctx.confirmDestructive) {
        throw new Error('Destructive action; pass --yes to confirm.');
    }

    if (keepInCases === undefined) {
        await ctx.client.sharedSteps.deleteSharedStep(sharedStepId);
    } else {
        await ctx.client.sharedSteps.deleteSharedStep(sharedStepId, { keepInCases });
    }
    ctx.out({ sharedStepId, keepInCases: keepInCases ?? true, deleted: true });
}
