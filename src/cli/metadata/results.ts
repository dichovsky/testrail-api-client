import { AddResultPayloadSchema, AddResultsForCasesPayloadSchema, AddResultsPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `result` actions in their original relative order:
 *   [0] list              — read
 *   [1] list-for-test     — read
 *   [2] list-for-case     — read
 *   [3] add               — write
 *   [4] add-bulk          — write
 *   [5] add-bulk-by-test  — write
 *   [6] add-by-test       — write
 */
export const resultActions: readonly ActionSpec[] = [
    {
        resource: 'result',
        action: 'list',
        summary: 'List results for a run (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_results_for_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list-for-test',
        summary: 'List results for a single test (paginated; --status-id / --defects-filter supported)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_results/{test_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'list-for-case',
        summary: 'List results for a case within a run (paginated; --status-id / --defects-filter supported)',
        pathParams: [
            { name: 'run_id', description: 'TestRail run ID' },
            { name: 'case_id', description: 'TestRail case ID' },
        ],
        apiEndpoint: 'GET get_results_for_case/{run_id}/{case_id}',
        isWrite: false,
    },
    {
        resource: 'result',
        action: 'add',
        summary: 'Record a single result for a case in a run',
        pathParams: [
            { name: 'run_id', description: 'TestRail run ID' },
            { name: 'case_id', description: 'TestRail case ID' },
        ],
        apiEndpoint: 'POST add_result_for_case/{run_id}/{case_id}',
        bodySchema: AddResultPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk',
        summary: 'Record multiple results for cases in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_results_for_cases/{run_id}',
        bodySchema: AddResultsForCasesPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-bulk-by-test',
        summary: 'Record multiple results for tests (by test_id) in one API call',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST add_results/{run_id}',
        bodySchema: AddResultsPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'result',
        action: 'add-by-test',
        summary: 'Add a single test result by test ID',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'POST add_result/{test_id}',
        bodySchema: AddResultPayloadSchema,
        isWrite: true,
    },
];
