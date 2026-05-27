import { handleResultFieldList } from '../handlers/result-field.js';
import type { ActionSpec } from './types.js';

/**
 * `result-field` actions:
 *   [0] list — read
 */
export const resultFieldActions: readonly ActionSpec[] = [
    {
        resource: 'result-field',
        action: 'list',
        summary: 'List all custom result fields defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_result_fields',
        isWrite: false,
        handler: handleResultFieldList,
    },
];
