import { AddCaseFieldPayloadSchema } from '../../schemas.js';
import { handleCaseFieldList } from '../handlers/case-field.js';
import { handleCaseFieldAdd } from '../handlers/case-field-write.js';
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
        handler: handleCaseFieldList,
    },
    {
        resource: 'case-field',
        action: 'add',
        summary: 'Create a custom case field (admin-only); no path params, payload-only',
        pathParams: [],
        apiEndpoint: 'POST add_case_field',
        bodySchema: AddCaseFieldPayloadSchema,
        helpExample: `--data '{"type":"String","name":"foo","label":"Foo","configs":[{"context":{"is_global":true,"project_ids":[]},"options":{"is_required":false,"default_value":""}}]}' (admin-only)`,
        isWrite: true,
        handler: handleCaseFieldAdd,
    },
];
