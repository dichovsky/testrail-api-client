import { AddMilestonePayloadSchema, UpdateMilestonePayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleMilestoneAdd = createWriteHandler({
    action: 'milestone add',
    pathParams: ['project_id'],
    bodySchema: AddMilestonePayloadSchema,
    call: (client, [projectId], body) => client.milestones.addMilestone(projectId, body),
});

export const handleMilestoneUpdate = createWriteHandler({
    action: 'milestone update',
    pathParams: ['milestone_id'],
    bodySchema: UpdateMilestonePayloadSchema,
    call: (client, [milestoneId], body) => client.milestones.updateMilestone(milestoneId, body),
});

/**
 * Destructive: deletes a milestone. TestRail's `delete_milestone` has no
 * `soft=1` preview, so `--soft` is rejected.
 */
export const handleMilestoneDelete = createDestructiveHandler({
    action: 'milestone delete',
    pathParams: ['milestone_id'],
    call: (client, [milestoneId]) => client.milestones.deleteMilestone(milestoneId),
});
