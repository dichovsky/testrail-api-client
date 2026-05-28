import { AddSharedStepPayloadSchema, UpdateSharedStepPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleSharedStepAdd = createWriteHandler({
    action: 'shared-step add',
    pathParams: ['project_id'],
    bodySchema: AddSharedStepPayloadSchema,
    call: (client, [projectId], body) => client.addSharedStep(projectId, body),
});

export const handleSharedStepUpdate = createWriteHandler({
    action: 'shared-step update',
    pathParams: ['shared_step_id'],
    bodySchema: UpdateSharedStepPayloadSchema,
    call: (client, [sharedStepId], body) => client.updateSharedStep(sharedStepId, body),
});

/**
 * Destructive: deletes a shared step. Cases that reference it keep their step
 * content but lose the shared reference (per TestRail's documented behavior).
 * TestRail's `delete_shared_step` has no `soft=1` preview, so `--soft` is
 * rejected.
 */
export const handleSharedStepDelete = createDestructiveHandler({
    action: 'shared-step delete',
    pathParams: ['shared_step_id'],
    call: (client, [sharedStepId]) => client.deleteSharedStep(sharedStepId),
});
