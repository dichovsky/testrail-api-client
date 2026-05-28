import {
    AddConfigurationGroupPayloadSchema,
    UpdateConfigurationGroupPayloadSchema,
    AddConfigurationPayloadSchema,
    UpdateConfigurationPayloadSchema,
} from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

// ── Config group CRUD ────────────────────────────────────────────────────────
// `configuration-group` is a separate CLI resource from `configuration`: groups
// live at the project level and own a `configs[]` array, while configs are
// addressed by their own `config_id` and never appear standalone.

export const handleConfigurationGroupAdd = createWriteHandler({
    action: 'configuration-group add',
    pathParams: ['project_id'],
    bodySchema: AddConfigurationGroupPayloadSchema,
    call: (client, [projectId], body) => client.addConfigurationGroup(projectId, body),
});

export const handleConfigurationGroupUpdate = createWriteHandler({
    action: 'configuration-group update',
    pathParams: ['config_group_id'],
    bodySchema: UpdateConfigurationGroupPayloadSchema,
    call: (client, [configGroupId], body) => client.updateConfigurationGroup(configGroupId, body),
});

/**
 * Destructive: deletes a configuration group and every config inside it.
 * TestRail's `delete_config_group` has no `soft=1` preview, so `--soft` is
 * rejected. Cascade caveat: deleting a group invalidates every plan entry that
 * references one of its configs.
 */
export const handleConfigurationGroupDelete = createDestructiveHandler({
    action: 'configuration-group delete',
    pathParams: ['config_group_id'],
    call: (client, [configGroupId]) => client.deleteConfigurationGroup(configGroupId),
});

// ── Config (leaf) CRUD ───────────────────────────────────────────────────────

export const handleConfigurationAdd = createWriteHandler({
    action: 'configuration add',
    pathParams: ['config_group_id'],
    bodySchema: AddConfigurationPayloadSchema,
    call: (client, [configGroupId], body) => client.addConfiguration(configGroupId, body),
});

export const handleConfigurationUpdate = createWriteHandler({
    action: 'configuration update',
    pathParams: ['config_id'],
    bodySchema: UpdateConfigurationPayloadSchema,
    call: (client, [configId], body) => client.updateConfiguration(configId, body),
});

/**
 * Destructive: deletes a single configuration (leaf). TestRail's
 * `delete_config` has no `soft=1` preview, so `--soft` is rejected. Removing a
 * config strips it from any plan entries that referenced it.
 */
export const handleConfigurationDelete = createDestructiveHandler({
    action: 'configuration delete',
    pathParams: ['config_id'],
    call: (client, [configId]) => client.deleteConfiguration(configId),
});
