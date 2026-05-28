import { AddRunPayloadSchema, UpdateRunPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `run` actions in their original relative order:
 *   [0] get    — read
 *   [1] list   — read
 *   [2] watch  — read
 *   [3] add    — write
 *   [4] update — write
 *   [5] close  — write (destructive)
 *   [6] delete — write (destructive)
 */
export const runActions: readonly ActionSpec[] = [
    {
        resource: 'run',
        action: 'get',
        summary: 'Fetch a single run by ID',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'list',
        summary: 'List runs in a project (paginated)',
        pathParams: [],
        apiEndpoint: 'GET get_runs/{project_id}',
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'watch',
        summary:
            'Poll get_run/{run_id} on an interval and emit diffs until is_completed=true (--interval N [5-600s, default 30]; --once for single poll)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'GET get_run/{run_id}',
        isWrite: false,
    },
    {
        resource: 'run',
        action: 'add',
        summary: 'Create a new test run in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_run/{project_id}',
        bodySchema: AddRunPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'update',
        summary: 'Update an existing test run (all fields optional)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST update_run/{run_id}',
        bodySchema: UpdateRunPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'run',
        action: 'close',
        summary: 'Close a test run permanently — irreversible (no body; requires --yes)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST close_run/{run_id}',
        isWrite: true,
        destructive: true,
    },
    {
        resource: 'run',
        action: 'delete',
        summary:
            'Delete a test run and all associated results (requires --yes; --soft for server-side preview without deletion)',
        pathParams: [{ name: 'run_id', description: 'TestRail run ID' }],
        apiEndpoint: 'POST delete_run/{run_id}',
        isWrite: true,
        destructive: true,
    },
];
