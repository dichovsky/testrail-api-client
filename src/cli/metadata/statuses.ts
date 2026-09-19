import { handleStatusList } from '../handlers/status.js';
import { defineActions } from './types.js';

/**
 * `status` actions:
 *   [0] list — read (result statuses)
 */
export const statusActions = defineActions([
    {
        resource: 'status',
        action: 'list',
        summary: 'List all result statuses defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_statuses',
        isWrite: false,
        handler: handleStatusList,
    },
]);
