import { AddCaseFieldPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `case-field` actions in their original relative order:
 *   [0] list — read
 *   [1] add  — write (admin-only)
 */
export const caseFieldActions: readonly ActionSpec[] = [
    {
        resource: 'case-field',
        action: 'list',
        summary: 'List all custom case fields defined on the TestRail instance',
        pathParams: [],
        apiEndpoint: 'GET get_case_fields',
        isWrite: false,
    },
    {
        resource: 'case-field',
        action: 'add',
        summary: 'Create a custom case field (admin-only); no path params, payload-only',
        pathParams: [],
        apiEndpoint: 'POST add_case_field',
        bodySchema: AddCaseFieldPayloadSchema,
        isWrite: true,
    },
];
