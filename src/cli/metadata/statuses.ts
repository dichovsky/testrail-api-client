import { handleStatusList } from '../handlers/status.js';
import type { ActionSpec } from './types.js';

/**
 * `status` actions:
 *   [0] list — read (result statuses)
 */
export const statusActions = [
    {
        resource: 'status',
        action: 'list',
        summary: 'List all result statuses defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_statuses',
        isWrite: false,
        handler: handleStatusList,
    },
] as const satisfies readonly ActionSpec[];
