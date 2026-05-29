import { TestRailClientCore } from '../client-core.js';
import type { ConfigurationGroup, Configuration } from '../types.js';
import { validateId } from '../validation.js';
import {
    ConfigurationGroupSchema,
    ConfigurationSchema,
    type AddConfigurationGroupPayload,
    type UpdateConfigurationGroupPayload,
    type AddConfigurationPayload,
    type UpdateConfigurationPayload,
} from '../schemas.js';
import { z } from 'zod';

export class ConfigurationModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_configs/{project_id} */
    async getConfigurations(projectId: number): Promise<ConfigurationGroup[]> {
        validateId(projectId, 'projectId');
        return this.client.request<ConfigurationGroup[]>({
            method: 'GET',
            endpoint: `get_configs/${projectId}`,
            schema: z.array(ConfigurationGroupSchema),
        });
    }

    /** @testrail POST add_config_group/{project_id} */
    async addConfigurationGroup(projectId: number, payload: AddConfigurationGroupPayload): Promise<ConfigurationGroup> {
        validateId(projectId, 'projectId');
        return this.client.request<ConfigurationGroup>({
            method: 'POST',
            endpoint: `add_config_group/${projectId}`,
            schema: ConfigurationGroupSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_config_group/{config_group_id} */
    async updateConfigurationGroup(
        configGroupId: number,
        payload: UpdateConfigurationGroupPayload,
    ): Promise<ConfigurationGroup> {
        validateId(configGroupId, 'configGroupId');
        return this.client.request<ConfigurationGroup>({
            method: 'POST',
            endpoint: `update_config_group/${configGroupId}`,
            schema: ConfigurationGroupSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_config_group/{config_group_id} */
    async deleteConfigurationGroup(configGroupId: number): Promise<void> {
        validateId(configGroupId, 'configGroupId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_config_group/${configGroupId}`,
        });
    }

    /** @testrail POST add_config/{config_group_id} */
    async addConfiguration(configGroupId: number, payload: AddConfigurationPayload): Promise<Configuration> {
        validateId(configGroupId, 'configGroupId');
        return this.client.request<Configuration>({
            method: 'POST',
            endpoint: `add_config/${configGroupId}`,
            schema: ConfigurationSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_config/{config_id} */
    async updateConfiguration(configId: number, payload: UpdateConfigurationPayload): Promise<Configuration> {
        validateId(configId, 'configId');
        return this.client.request<Configuration>({
            method: 'POST',
            endpoint: `update_config/${configId}`,
            schema: ConfigurationSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_config/{config_id} */
    async deleteConfiguration(configId: number): Promise<void> {
        validateId(configId, 'configId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_config/${configId}`,
        });
    }
}
