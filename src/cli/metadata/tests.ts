import type { ActionSpec } from './types.js';

/**
 * `test` actions in their original relative order:
 *   [0] get  — read
 *   [1] list — read
 */
export const testActions: readonly ActionSpec[] = [
    {
        resource: 'test',
        action: 'get',
        summary: 'Fetch a single test (run instance of a case) by ID',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_test/{test_id}',
        isWrite: false,
    },
    {
        resource: 'test',
        action: 'list',
        summary: 'List tests in a run (optionally filtered by status, paginated)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_tests/{run_id}',
        isWrite: false,
    },
];
