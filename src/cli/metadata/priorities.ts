import { handlePriorityList } from '../handlers/priority.js';
import { defineActions } from './types.js';

/**
 * `priority` actions:
 *   [0] list — read
 */
export const priorityActions = defineActions([
    {
        resource: 'priority',
        action: 'list',
        summary: 'List all case priorities defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_priorities',
        isWrite: false,
        handler: handlePriorityList,
    },
]);
