import { handleRoleList } from '../handlers/role.js';
import type { ActionSpec } from './types.js';

/**
 * `role` actions:
 *   [0] list — read
 */
export const roleActions: readonly ActionSpec[] = [
    {
        resource: 'role',
        action: 'list',
        summary: 'List all user roles defined on the TestRail instance (pagination envelope)',
        pathParams: [],
        apiEndpoint: 'GET get_roles',
        pagination: { response: 'envelope', requestControls: false, collectionKey: 'roles' },
        isWrite: false,
        handler: handleRoleList,
    },
];
