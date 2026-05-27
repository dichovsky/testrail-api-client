import { AddConfigurationPayloadSchema, UpdateConfigurationPayloadSchema } from '../../schemas.js';
import { handleConfigurationList } from '../handlers/configuration.js';
import {
    handleConfigurationAdd,
    handleConfigurationDelete,
    handleConfigurationUpdate,
} from '../handlers/configuration-write.js';
import type { ActionSpec } from './types.js';

/**
 * `configuration` actions in their original relative order:
 *   [0] list   — read (returns config groups + nested configs as a tree)
 *   [1] add    — write (creates a leaf config inside a group)
 *   [2] update — write
 *   [3] delete — write (destructive)
 *
 * TestRail models test-environment matrices as a two-level tree:
 *   project → config_groups[] (e.g. "Browsers") → configs[] (e.g. "Chrome").
 * `get_configs/{project_id}` returns the entire tree in one call; there
 * is no separate "list configs in a group" endpoint upstream. Group and
 * config CRUD are split into two CLI resources (`configuration` and
 * `configuration-group`) because the path-param contract is asymmetric.
 */
export const configurationActions: readonly ActionSpec[] = [
    {
        resource: 'configuration',
        action: 'list',
        summary: 'List configuration groups (with nested configs) for a project',
        pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],
        apiEndpoint: 'GET get_configs/{project_id}',
        isWrite: false,
        handler: handleConfigurationList,
    },
    {
        resource: 'configuration',
        action: 'add',
        summary: 'Create a new configuration (leaf) inside a configuration group (e.g. "Chrome")',
        pathParams: [{ name: 'config_group_id', description: 'TestRail config group ID' }],
        apiEndpoint: 'POST add_config/{config_group_id}',
        bodySchema: AddConfigurationPayloadSchema,
        helpExample: `--data '{"name":"Chrome"}'`,
        isWrite: true,
        handler: handleConfigurationAdd,
    },
    {
        resource: 'configuration',
        action: 'update',
        summary: 'Update a single configuration (rename)',
        pathParams: [{ name: 'config_id', description: 'TestRail config ID' }],
        apiEndpoint: 'POST update_config/{config_id}',
        bodySchema: UpdateConfigurationPayloadSchema,
        helpExample: `--data '{"name":"..."}'`,
        isWrite: true,
        handler: handleConfigurationUpdate,
    },
    {
        resource: 'configuration',
        action: 'delete',
        summary: 'Delete a single configuration (requires --yes; --soft NOT supported by TestRail)',
        pathParams: [{ name: 'config_id', description: 'TestRail config ID' }],
        apiEndpoint: 'POST delete_config/{config_id}',
        isWrite: true,
        destructive: true,
        helpExample: '(no body; --soft NOT supported)',
        handler: handleConfigurationDelete,
    },
];
