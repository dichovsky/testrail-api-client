import { handleCaseStatusList } from '../handlers/case-status.js';
import type { ActionSpec } from './types.js';

/**
 * `case-status` actions:
 *   [0] list — read (TestRail 7.5+)
 */
export const caseStatusActions: readonly ActionSpec[] = [
    {
        resource: 'case-status',
        action: 'list',
        summary: 'List case-level lifecycle statuses (pagination envelope; TestRail 7.5+)',
        pathParams: [],
        apiEndpoint: 'GET get_case_statuses',
        pagination: { response: 'envelope', requestControls: false, collectionKey: 'case_statuses' },
        isWrite: false,
        handler: handleCaseStatusList,
    },
];
