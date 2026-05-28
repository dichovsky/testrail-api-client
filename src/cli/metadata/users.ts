import { UserAddPayloadSchema, UserUpdatePayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `user` actions in their original relative order:
 *   [0] get          — read
 *   [1] list         — read
 *   [2] get-by-email — read
 *   [3] get-current  — read
 *   [4] add          — write (TestRail 7.3+)
 *   [5] update       — write (TestRail 7.3+)
 */
export const userActions: readonly ActionSpec[] = [
    {
        resource: 'user',
        action: 'get',
        summary: 'Fetch a single user by ID',
        pathParams: [{ name: 'user_id', description: 'TestRail user ID' }],
        apiEndpoint: 'GET get_user/{user_id}',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'list',
        summary: 'List users (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_users',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get-by-email',
        summary: 'Look up a single user by email address',
        pathParams: [],
        apiEndpoint: 'GET get_user_by_email',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'get-current',
        summary: 'Fetch the user identified by the auth credential (TestRail 6.6+; no positional args)',
        pathParams: [],
        apiEndpoint: 'GET get_current_user',
        isWrite: false,
    },
    {
        resource: 'user',
        action: 'add',
        summary: 'Create a new user (no path param, payload-only; TestRail 7.3+)',
        pathParams: [],
        apiEndpoint: 'POST add_user',
        bodySchema: UserAddPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'user',
        action: 'update',
        summary: 'Update an existing user (partial fields; TestRail 7.3+)',
        pathParams: [{ name: 'user_id', description: 'TestRail user ID' }],
        apiEndpoint: 'POST update_user/{user_id}',
        bodySchema: UserUpdatePayloadSchema,
        isWrite: true,
    },
];
