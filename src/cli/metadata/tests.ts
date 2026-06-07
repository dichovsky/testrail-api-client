import { UpdateTestLabelsPayloadSchema, UpdateTestsLabelsPayloadSchema } from '../../schemas.js';
import { handleTestGet, handleTestList } from '../handlers/test.js';
import { handleTestUpdate, handleTestUpdateBulk } from '../handlers/test-write.js';
import type { ActionSpec } from './types.js';

/**
 * `test` actions in their original relative order:
 *   [0] get               — read
 *   [1] list              — read
 *   [2] update-labels      — write (single test; TestRail Labels API, 2025)
 *   [3] update-labels-bulk — write (many tests, same labels; no path param)
 *
 * `update-labels*` are label-only mutations (NOT general test updates). They
 * map to TestRail's `update_test` / `update_tests`; the CLI action names spell
 * out the label-only scope so users don't expect a full `test update`.
 */
export const testActions: readonly ActionSpec[] = [
    {
        resource: 'test',
        action: 'get',
        summary: 'Fetch a single test (run instance of a case) by ID',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'GET get_test/{test_id}',
        isWrite: false,
        handler: handleTestGet,
    },
    {
        resource: 'test',
        action: 'list',
        summary: 'List tests in a run (optionally filtered by status, paginated)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_tests/{run_id}',
        isWrite: false,
        handler: handleTestList,
    },
    {
        resource: 'test',
        action: 'update-labels',
        summary: 'Set the labels on a single test (label-only; IDs or titles)',
        pathParams: [{ name: 'test_id', description: 'TestRail test ID' }],
        apiEndpoint: 'POST update_test/{test_id}',
        bodySchema: UpdateTestLabelsPayloadSchema,
        helpExample: `--data '{"labels":[1,"regression"]}'`,
        isWrite: true,
        handler: handleTestUpdate,
    },
    {
        resource: 'test',
        action: 'update-labels-bulk',
        summary: 'Apply the same labels to many tests at once (no path param; IDs in body)',
        pathParams: [],
        apiEndpoint: 'POST update_tests',
        bodySchema: UpdateTestsLabelsPayloadSchema,
        helpExample: `--data '{"test_ids":[1,2,3],"labels":[1,"regression"]}'  (no path param)`,
        isWrite: true,
        handler: handleTestUpdateBulk,
    },
];
