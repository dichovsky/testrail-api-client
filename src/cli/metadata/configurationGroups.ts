import { AddConfigurationGroupPayloadSchema, UpdateConfigurationGroupPayloadSchema } from '../../schemas.js';
import type { ActionSpec } from './types.js';

/**
 * `configuration-group` actions in their original relative order:
 *   [0] add    — write
 *   [1] update — write
 *   [2] delete — write (destructive)
 *
 * Configuration groups own the leaf `configuration` entries — see
 * `./configurations.ts` for the leaf CRUD. The pair is intentionally
 * split because the path-param contract is asymmetric (group add takes a
 * `project_id`; config add takes a `config_group_id`).
 */
export const configurationGroupActions: readonly ActionSpec[] = [
    {
        resource: 'configuration-group',
        action: 'add',
        summary: 'Create a new configuration group in a project (e.g. "Browsers")',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'POST add_config_group/{project_id}',
        bodySchema: AddConfigurationGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration-group',
        action: 'update',
        summary: 'Update a configuration group (rename)',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST update_config_group/{config_group_id}',
        bodySchema: UpdateConfigurationGroupPayloadSchema,
        isWrite: true,
    },
    {
        resource: 'configuration-group',
        action: 'delete',
        summary:
            'Delete a configuration group and every config in it (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST delete_config_group/{config_group_id}',
        isWrite: true,
        destructive: true,
    },
];
