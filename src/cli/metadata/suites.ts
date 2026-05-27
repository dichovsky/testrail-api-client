import { AddSuitePayloadSchema, UpdateSuitePayloadSchema } from '../../schemas.js';
import { handleSuiteGet, handleSuiteList } from '../handlers/suite.js';
import { handleSuiteAdd, handleSuiteDelete, handleSuiteUpdate } from '../handlers/suite-write.js';
import type { ActionSpec } from './types.js';

/**
 * `suite` actions in their original relative order:
 *   [0] get    — read
 *   [1] list   — read
 *   [2] add    — write (structural-setup)
 *   [3] update — write (structural-setup)
 *   [4] delete — write (destructive)
 */
export const suiteActions: readonly ActionSpec[] = [
    {
        resource: 'suite',
        action: 'get',
        summary: 'Fetch a single suite by ID',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'GET get_suite/{suite_id}',
        isWrite: false,
        handler: handleSuiteGet,
    },
    {
        resource: 'suite',
        action: 'list',
        summary: 'List suites in a project',
        pathParams: [],
        apiEndpoint: 'GET get_suites/{project_id}',
        isWrite: false,
        handler: handleSuiteList,
    },
    {
        resource: 'suite',
        action: 'add',
        summary: 'Create a new test suite in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_suite/{project_id}',
        bodySchema: AddSuitePayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleSuiteAdd,
    },
    {
        resource: 'suite',
        action: 'update',
        summary: 'Update an existing test suite (partial fields)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST update_suite/{suite_id}',
        bodySchema: UpdateSuitePayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleSuiteUpdate,
    },
    {
        resource: 'suite',
        action: 'delete',
        summary:
            'Delete a suite and everything inside it (sections, cases, runs, plans; requires --yes; --soft for server-side preview)',
        pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }],
        apiEndpoint: 'POST delete_suite/{suite_id}',
        isWrite: true,
        destructive: true,
        handler: handleSuiteDelete,
    },
];
