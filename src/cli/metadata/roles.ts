import { handleRoleList } from '../handlers/role.js';
import { defineActions } from './types.js';

/**
 * `role` actions:
 *   [0] list — read
 */
export const roleActions = defineActions([
    {
        resource: 'role',
        action: 'list',
        summary: 'List all user roles defined on the TestRail instance (pagination envelope)',
        pathParams: [],
        apiEndpoint: 'GET get_roles',
        isWrite: false,
        handler: handleRoleList,
    },
]);
