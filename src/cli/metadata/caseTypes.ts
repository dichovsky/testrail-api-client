import { handleCaseTypeList } from '../handlers/case-type.js';
import { defineActions } from './types.js';

/**
 * `case-type` actions:
 *   [0] list — read
 */
export const caseTypeActions = defineActions([
    {
        resource: 'case-type',
        action: 'list',
        summary: 'List all case types defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_case_types',
        isWrite: false,
        handler: handleCaseTypeList,
    },
]);
