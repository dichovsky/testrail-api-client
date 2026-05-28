import { AddMilestonePayloadSchema, UpdateMilestonePayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `milestone` actions in their original relative order:
 *   [0] get    — read
 *   [1] list   — read
 *   [2] add    — write (structural-setup)
 *   [3] update — write (structural-setup)
 *   [4] delete — write (destructive)
 */
export const milestoneActions: readonly ActionSpec[] = [
    {
        resource: 'milestone',
        action: 'get',
        summary: 'Fetch a single milestone by ID',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'GET get_milestone/{milestone_id}',
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'list',
        summary: 'List milestones in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_milestones/{project_id}',
        isWrite: false,
    },
    {
        resource: 'milestone',
        action: 'add',
        summary: 'Create a new milestone in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_milestone/{project_id}',
        bodySchema: AddMilestonePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'milestone',
        action: 'update',
        summary: 'Update an existing milestone (partial fields, including is_completed/is_started toggles)',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'POST update_milestone/{milestone_id}',
        bodySchema: UpdateMilestonePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'milestone',
        action: 'delete',
        summary: 'Delete a milestone (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'milestone_id', description: 'TestRail milestone ID' }],
        apiEndpoint: 'POST delete_milestone/{milestone_id}',
        isWrite: true,
        destructive: true,
    },
];
