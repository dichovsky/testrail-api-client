import {
    AddCasePayloadSchema,
    AddCasesBulkPayloadSchema,
    UpdateCasePayloadSchema,
    UpdateCasesPayloadSchema,
    DeleteCasesPayloadSchema,
    CopyCasesToSectionPayloadSchema,
    MoveCasesToSectionPayloadSchema,
} from '../../schemas.js';
import { handleCaseGet, handleCaseList, handleCaseHistory } from '../handlers/case.js';
import {
    handleCaseAdd,
    handleCaseAddBulk,
    handleCaseUpdate,
    handleCaseUpdateBulk,
    handleCaseDelete,
    handleCaseDeleteBulk,
    handleCaseCopyToSection,
    handleCaseMoveToSection,
} from '../handlers/case-write.js';
import type { ActionSpec } from './types.js';

/**
 * `case` actions in their original relative order:
 *   [0] get             — read
 *   [1] list            — read
 *   [2] history         — read
 *   [3] add             — write
 *   [4] add-bulk        — write
 *   [5] update          — write
 *   [6] update-bulk     — write
 *   [7] delete          — write (destructive)
 *   [8] delete-bulk     — write (destructive)
 *   [9] copy-to-section — write
 *   [10] move-to-section — write
 */
export const caseActions: readonly ActionSpec[] = [
    {
        resource: 'case',
        action: 'get',
        summary: 'Fetch a single test case by ID',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_case/{case_id}',
        isWrite: false,
        handler: handleCaseGet,
    },
    {
        resource: 'case',
        action: 'list',
        summary: 'List cases in a project (optionally filtered by suite)',
        pathParams: [],
        apiEndpoint: 'GET get_cases/{project_id}',
        isWrite: false,
        handler: handleCaseList,
    },
    {
        resource: 'case',
        action: 'history',
        summary: 'List edit history for a test case (paginated; TestRail 7.5+)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_history_for_case/{case_id}',
        isWrite: false,
        handler: handleCaseHistory,
    },
    {
        resource: 'case',
        action: 'add',
        summary: 'Create a new test case under a section',
        pathParams: [{ name: 'section_id', description: 'Section to create the case under' }],
        apiEndpoint: 'POST add_case/{section_id}',
        bodySchema: AddCasePayloadSchema,
        helpExample: `--data '{"title":"..."}'`,
        isWrite: true,
        handler: handleCaseAdd,
    },
    {
        resource: 'case',
        action: 'add-bulk',
        summary:
            'Bulk-create cases under a section in one API call (TestRail 7.5+); body is a JSON array of case payloads',
        pathParams: [{ name: 'section_id', description: 'Section to create the cases under' }],
        apiEndpoint: 'POST add_cases/{section_id}',
        bodySchema: AddCasesBulkPayloadSchema,
        helpExample: `--data '[{"title":"..."},{"title":"..."}]'  (TestRail 7.5+; body is a JSON array)`,
        isWrite: true,
        handler: handleCaseAddBulk,
    },
    {
        resource: 'case',
        action: 'update',
        summary: 'Update an existing test case (partial fields)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST update_case/{case_id}',
        bodySchema: UpdateCasePayloadSchema,
        helpExample: `--data '{"title":"..."}'`,
        isWrite: true,
        handler: handleCaseUpdate,
    },
    {
        resource: 'case',
        action: 'update-bulk',
        summary: 'Bulk-update many cases in a suite with the same field values',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST update_cases/{suite_id}',
        bodySchema: UpdateCasesPayloadSchema,
        helpExample: `--data '{"case_ids":[1,2],"priority_id":3}'`,
        isWrite: true,
        handler: handleCaseUpdateBulk,
    },
    {
        resource: 'case',
        action: 'delete',
        summary:
            'Delete a single test case (requires --yes; --soft for server-side preview that returns affected counts without deleting)',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST delete_case/{case_id}',
        isWrite: true,
        destructive: true,
        handler: handleCaseDelete,
    },
    {
        resource: 'case',
        action: 'delete-bulk',
        summary:
            'Bulk-delete cases in a suite (requires --project-id and --yes; --soft for server-side preview without deletion)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST delete_cases/{suite_id}',
        bodySchema: DeleteCasesPayloadSchema,
        helpExample: `--project-id <id> [--soft] --data '{"case_ids":[1,2]}'`,
        isWrite: true,
        destructive: true,
        handler: handleCaseDeleteBulk,
    },
    {
        resource: 'case',
        action: 'copy-to-section',
        summary: 'Copy cases into a target section (returns the new case copies)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        apiEndpoint: 'POST copy_cases_to_section/{section_id}',
        bodySchema: CopyCasesToSectionPayloadSchema,
        helpExample: `--data '{"case_ids":[1,2]}'`,
        isWrite: true,
        handler: handleCaseCopyToSection,
    },
    {
        resource: 'case',
        action: 'move-to-section',
        summary: 'Move cases into a target section (suite_id required in body)',
        pathParams: [{ name: 'section_id', description: 'Destination section ID' }],
        apiEndpoint: 'POST move_cases_to_section/{section_id}',
        bodySchema: MoveCasesToSectionPayloadSchema,
        helpExample: `--data '{"case_ids":[1,2],"suite_id":3}'`,
        isWrite: true,
        handler: handleCaseMoveToSection,
    },
];
