import { handleCaseStatusList } from '../handlers/case-status.js';
import { defineActions } from './types.js';

/**
 * `case-status` actions:
 *   [0] list — read (TestRail Enterprise 7.3+)
 */
export const caseStatusActions = defineActions([
    {
        resource: 'case-status',
        action: 'list',
        summary: 'List case-level lifecycle statuses (pagination envelope; TestRail Enterprise 7.3+)',
        pathParams: [],
        apiEndpoint: 'GET get_case_statuses',
        isWrite: false,
        handler: handleCaseStatusList,
    },
]);
