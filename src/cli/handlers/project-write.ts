import { AddProjectPayloadSchema, UpdateProjectPayloadSchema } from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handleProjectAdd = createWriteHandler({
    action: 'project add',
    bodySchema: AddProjectPayloadSchema,
    call: (client, _nums, body) => client.addProject(body),
});

export const handleProjectUpdate = createWriteHandler({
    action: 'project update',
    pathParams: ['project_id'],
    bodySchema: UpdateProjectPayloadSchema,
    call: (client, [projectId], body) => client.updateProject(projectId, body),
});

/**
 * Destructive: deletes a project and everything inside it — the highest blast
 * radius in the destructive surface. TestRail's `delete_project` has no
 * `soft=1` preview, so `--soft` is rejected rather than silently dropped.
 */
export const handleProjectDelete = createDestructiveHandler({
    action: 'project delete',
    pathParams: ['project_id'],
    call: (client, [projectId]) => client.deleteProject(projectId),
});
