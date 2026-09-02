import { AddSharedStepPayloadSchema, UpdateSharedStepPayloadSchema } from '../../schemas.js';
import { handleSharedStepGet, handleSharedStepList, handleSharedStepHistory } from '../handlers/shared-step.js';
import { handleSharedStepAdd, handleSharedStepUpdate, handleSharedStepDelete } from '../handlers/shared-step-write.js';
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
        handler: handleSharedStepGet,
    },
    {
        resource: 'shared-step',
        action: 'list',
        summary: 'List shared steps in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_shared_steps/{project_id}',
        pagination: { response: 'envelope', requestControls: true, collectionKey: 'shared_steps' },
        flags: [
            { name: 'project-id', required: true },
            { name: 'created-after' },
            { name: 'created-before' },
            { name: 'created-by' },
            { name: 'updated-after' },
            { name: 'updated-before' },
            { name: 'refs' },
        ],
        isWrite: false,
        handler: handleSharedStepList,
    },
    {
        resource: 'shared-step',
        action: 'history',
        summary: 'List revision history for a shared step (pagination envelope)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'GET get_shared_step_history/{shared_step_id}',
        pagination: { response: 'envelope', requestControls: false, collectionKey: 'step_history' },
        // Legacy items mode accepted these controls before page/all projections
        // were added. Page/all remain response-driven and never send them.
        flags: [{ name: 'limit' }, { name: 'offset' }],
        isWrite: false,
        handler: handleSharedStepHistory,
    },
    {
        resource: 'shared-step',
        action: 'add',
        summary: 'Create a new shared step set in a project (TestRail 7.0+)',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_shared_step/{project_id}',
        bodySchema: AddSharedStepPayloadSchema,
        helpExample: `--data '{"title":"..."}'  (TestRail 7.0+)`,
        isWrite: true,
        handler: handleSharedStepAdd,
    },
    {
        resource: 'shared-step',
        action: 'update',
        summary: 'Update an existing shared step set (partial fields; TestRail 7.0+)',
        pathParams: [{ name: 'shared_step_id', description: 'TestRail shared step ID' }],
        apiEndpoint: 'POST update_shared_step/{shared_step_id}',
        bodySchema: UpdateSharedStepPayloadSchema,
        helpExample: `--data '{"title":"..."}'  (TestRail 7.0+)`,
        isWrite: true,
        handler: handleSharedStepUpdate,
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
        flags: [{ name: 'keep-in-cases' }],
        helpExample: '(no body; --soft NOT supported by TestRail; TestRail 7.0+)',
        handler: handleSharedStepDelete,
    },
];
