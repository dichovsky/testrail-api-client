import { handlePriorityList } from '../handlers/priority.js';
import type { ActionSpec } from './types.js';

/**
 * `priority` actions:
 *   [0] list — read
 */
export const priorityActions = [
    {
        resource: 'priority',
        action: 'list',
        summary: 'List all case priorities defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_priorities',
        isWrite: false,
        handler: handlePriorityList,
    },
] as const satisfies readonly ActionSpec[];
