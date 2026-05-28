import type { ActionSpec } from './types.js';

/**
 * `attachment` actions in their original relative order:
 *   [0]  list-for-case          — read
 *   [1]  list-for-run           — read
 *   [2]  list-for-test          — read
 *   [3]  list-for-plan          — read
 *   [4]  list-for-plan-entry    — read
 *   [5]  get                    — read (binary download to --out)
 *   [6]  add-to-case            — write (file input)
 *   [7]  add-to-result          — write (file input)
 *   [8]  add-to-run             — write (file input)
 *   [9]  add-to-plan            — write (file input)
 *   [10] add-to-plan-entry      — write (file input)
 *   [11] delete                 — write (destructive)
 */
export const attachmentActions: readonly ActionSpec[] = [
    {
        resource: 'attachment',
        action: 'list-for-case',
        summary: 'List attachments on a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'GET get_attachments_for_case/{case_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-run',
        summary: 'List attachments on a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_attachments_for_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-test',
        summary: 'List attachments on a test (run instance of a case)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_attachments_for_test/{test_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-plan',
        summary: 'List attachments on a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'GET get_attachments_for_plan/{plan_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'list-for-plan-entry',
        summary: 'List attachments on a plan entry',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID' },
        ],
        apiEndpoint: 'GET get_attachments_for_plan_entry/{plan_id}/{entry_id}',
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'get',
        summary: 'Download an attachment by ID to --out <path>',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        apiEndpoint: 'GET get_attachment/{attachment_id}',
        fileOutput: true,
        isWrite: false,
    },
    {
        resource: 'attachment',
        action: 'add-to-case',
        summary: 'Upload an attachment to a test case',
        pathParams: [{ name: 'case_id', description: 'TestRail case ID' }],
        apiEndpoint: 'POST add_attachment_to_case/{case_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-result',
        summary: 'Upload an attachment to a test result',
        pathParams: [{ name: 'result_id', description: 'TestRail result ID' }],
        apiEndpoint: 'POST add_attachment_to_result/{result_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-run',
        summary: 'Upload an attachment to a test run',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_attachment_to_run/{run_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-plan',
        summary: 'Upload an attachment to a test plan',
        pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }],
        apiEndpoint: 'POST add_attachment_to_plan/{plan_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'add-to-plan-entry',
        summary: 'Upload an attachment to a plan entry',
        pathParams: [
            { name: 'plan_id', description: 'TestRail plan ID' },
            { name: 'entry_id', description: 'TestRail plan entry ID' },
        ],
        apiEndpoint: 'POST add_attachment_to_plan_entry/{plan_id}/{entry_id}',
        fileInput: true,
        isWrite: true,
    },
    {
        resource: 'attachment',
        action: 'delete',
        summary: 'Delete an attachment by ID (requires --yes)',
        pathParams: [{ name: 'attachment_id', description: 'TestRail attachment ID' }],
        apiEndpoint: 'POST delete_attachment/{attachment_id}',
        isWrite: true,
        destructive: true,
    },
];
