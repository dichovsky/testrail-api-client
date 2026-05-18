import { TestRailClientCore } from '../client-core.js';
import type {
    ConfigurationGroup,
    Configuration,
    AddConfigurationGroupPayload,
    UpdateConfigurationGroupPayload,
    AddConfigurationPayload,
    UpdateConfigurationPayload,
} from '../types.js';
import { ConfigurationGroupSchema, ConfigurationSchema } from '../schemas.js';
import { z } from 'zod';

export class ConfigurationModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getConfigurations(projectId: number): Promise<ConfigurationGroup[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<ConfigurationGroup[]>(
            'GET',
            `get_configs/${projectId}`,
            z.array(ConfigurationGroupSchema),
        );
    }

    async addConfigurationGroup(projectId: number, payload: AddConfigurationGroupPayload): Promise<ConfigurationGroup> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<ConfigurationGroup>(
            'POST',
            `add_config_group/${projectId}`,
            ConfigurationGroupSchema,
            payload,
        );
    }

    async updateConfigurationGroup(
        configGroupId: number,
        payload: UpdateConfigurationGroupPayload,
    ): Promise<ConfigurationGroup> {
        this.client.validateId(configGroupId, 'configGroupId');
        return this.client.requestParsed<ConfigurationGroup>(
            'POST',
            `update_config_group/${configGroupId}`,
            ConfigurationGroupSchema,
            payload,
        );
    }

    async deleteConfigurationGroup(configGroupId: number): Promise<void> {
        this.client.validateId(configGroupId, 'configGroupId');
        await this.client.request<void>('POST', `delete_config_group/${configGroupId}`);
    }

    async addConfiguration(configGroupId: number, payload: AddConfigurationPayload): Promise<Configuration> {
        this.client.validateId(configGroupId, 'configGroupId');
        return this.client.requestParsed<Configuration>(
            'POST',
            `add_config/${configGroupId}`,
            ConfigurationSchema,
            payload,
        );
    }

    async updateConfiguration(configId: number, payload: UpdateConfigurationPayload): Promise<Configuration> {
        this.client.validateId(configId, 'configId');
        return this.client.requestParsed<Configuration>(
            'POST',
            `update_config/${configId}`,
            ConfigurationSchema,
            payload,
        );
    }

    async deleteConfiguration(configId: number): Promise<void> {
        this.client.validateId(configId, 'configId');
        await this.client.request<void>('POST', `delete_config/${configId}`);
    }
}
