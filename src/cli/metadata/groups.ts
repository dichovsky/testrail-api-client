import { AddGroupPayloadSchema, UpdateGroupPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `group` actions in their original relative order (all TestRail 7.5+):
 *   [0] get    — read
 *   [1] list   — read
 *   [2] add    — write
 *   [3] update — write
 *   [4] delete — write (destructive)
 *
 * User groups are an instance-level resource (not project-scoped). The
 * CRUD shape mirrors `variable`: `add` takes no path param (payload-only),
 * `update`/`delete` take a single `group_id`. Disjoint from
 * `configuration-group` (project-scoped, owns nested configs).
 */
export const groupActions: readonly ActionSpec[] = [
    {
        resource: 'group',
        action: 'get',
        summary: 'Fetch a single user group by ID (TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'GET get_group/{group_id}',
        isWrite: false,
    },
    {
        resource: 'group',
        action: 'list',
        summary: 'List all user groups on the instance (TestRail 7.5+; no path params)',
        pathParams: [],
        apiEndpoint: 'GET get_groups',
        isWrite: false,
    },
    {
        resource: 'group',
        action: 'add',
        summary: 'Create a new user group (no path params, payload-only; TestRail 7.5+)',
        pathParams: [],
        apiEndpoint: 'POST add_group',
        bodySchema: AddGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'group',
        action: 'update',
        summary: 'Update an existing user group (partial fields; TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'POST update_group/{group_id}',
        bodySchema: UpdateGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'group',
        action: 'delete',
        summary: 'Delete a user group (requires --yes; --soft NOT supported by TestRail; TestRail 7.5+)',
        pathParams: [{ name: 'group_id', description: 'TestRail group ID' }],
        apiEndpoint: 'POST delete_group/{group_id}',
        isWrite: true,
        destructive: true,
    },
];
