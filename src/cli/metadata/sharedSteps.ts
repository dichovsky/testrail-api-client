import { AddSharedStepPayloadSchema, UpdateSharedStepPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `shared-step` actions in their original relative order:
 *   [0] get     — read
 *   [1] list    — read
 *   [2] history — read
 *   [3] add     — write (TestRail 7.0+)
 *   [4] update  — write (TestRail 7.0+)
 *   [5] delete  — write (destructive; TestRail 7.0+)
 */
export const sharedStepActions: readonly ActionSpec[] = [
    {
        resource: 'shared-step',
        action: 'get',
        summary: 'Fetch a single shared step by ID',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'GET get_shared_step/{shared_step_id}',
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'list',
        summary: 'List shared steps in a project',
        pathParams: [],
        apiEndpoint: 'GET get_shared_steps/{project_id}',
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'history',
        summary: 'List revision history for a shared step (paginated)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'GET get_shared_step_history/{shared_step_id}',
        isWrite: false,
    },
    {
        resource: 'shared-step',
        action: 'add',
        summary: 'Create a new shared step set in a project (TestRail 7.0+)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_shared_step/{project_id}',
        bodySchema: AddSharedStepPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'shared-step',
        action: 'update',
        summary: 'Update an existing shared step set (partial fields; TestRail 7.0+)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'POST update_shared_step/{shared_step_id}',
        bodySchema: UpdateSharedStepPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'shared-step',
        action: 'delete',
        summary:
            'Delete a shared step set — referencing cases keep their content but lose the step-set link (requires --yes; --soft NOT supported by TestRail; TestRail 7.0+)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'POST delete_shared_step/{shared_step_id}',
        isWrite: true,
        destructive: true,
    },
];
