import { AddVariablePayloadSchema, UpdateVariablePayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `variable` actions in their original relative order:
 *   [0] list   — read
 *   [1] add    — write
 *   [2] update — write
 *   [3] delete — write (destructive)
 */
export const variableActions: readonly ActionSpec[] = [
    {
        resource: 'variable',
        action: 'list',
        summary: 'List variables in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_variables/{project_id}',
        isWrite: false,
    },
    {
        resource: 'variable',
        action: 'add',
        summary: 'Create a new variable in a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_variable/{project_id}',
        bodySchema: AddVariablePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'variable',
        action: 'update',
        summary: 'Update an existing variable (rename)',
        pathParams: [{ name: 'variable_id', description: 'TestRail variable ID' }],
        apiEndpoint: 'POST update_variable/{variable_id}',
        bodySchema: UpdateVariablePayloadSchema,
        isWrite: true,
    },
    {
        resource: 'variable',
        action: 'delete',
        summary: 'Delete a variable (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'variable_id', description: 'TestRail variable ID' }],
        apiEndpoint: 'POST delete_variable/{variable_id}',
        isWrite: true,
        destructive: true,
    },
];
