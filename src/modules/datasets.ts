import { TestRailClientCore } from '../client-core.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../types.js';
import { DatasetSchema } from '../schemas.js';

export class DatasetModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getDataset(datasetId: number): Promise<Dataset> {
        this.client.validateId(datasetId, 'datasetId');
        return this.client.parse<Dataset>(
            DatasetSchema,
            await this.client.request<unknown>('GET', `get_dataset/${datasetId}`),
        );
    }

    async getDatasets(projectId: number): Promise<Dataset[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Dataset[]>(
            DatasetSchema.array(),
            await this.client.request<unknown>('GET', `get_datasets/${projectId}`),
        );
    }

    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Dataset>(
            DatasetSchema,
            await this.client.request<unknown>('POST', `add_dataset/${projectId}`, payload),
        );
    }

    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        this.client.validateId(datasetId, 'datasetId');
        return this.client.parse<Dataset>(
            DatasetSchema,
            await this.client.request<unknown>('POST', `update_dataset/${datasetId}`, payload),
        );
    }

    async deleteDataset(datasetId: number): Promise<void> {
        this.client.validateId(datasetId, 'datasetId');
        await this.client.request<void>('POST', `delete_dataset/${datasetId}`);
    }
}
