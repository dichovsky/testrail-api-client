import { TestRailClientCore } from '../client-core.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../types.js';
import { DatasetSchema } from '../schemas.js';

export class DatasetModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_dataset/{dataset_id} */
    async getDataset(datasetId: number): Promise<Dataset> {
        this.client.validateId(datasetId, 'datasetId');
        return this.client.requestParsed<Dataset>('GET', `get_dataset/${datasetId}`, DatasetSchema);
    }

    /** @testrail GET get_datasets/{project_id} */
    async getDatasets(projectId: number): Promise<Dataset[]> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Dataset[]>('GET', `get_datasets/${projectId}`, DatasetSchema.array());
    }

    /** @testrail POST add_dataset/{project_id} */
    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Dataset>('POST', `add_dataset/${projectId}`, DatasetSchema, payload);
    }

    /** @testrail POST update_dataset/{dataset_id} */
    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        this.client.validateId(datasetId, 'datasetId');
        return this.client.requestParsed<Dataset>('POST', `update_dataset/${datasetId}`, DatasetSchema, payload);
    }

    /** @testrail POST delete_dataset/{dataset_id} */
    async deleteDataset(datasetId: number): Promise<void> {
        this.client.validateId(datasetId, 'datasetId');
        await this.client.request<void>('POST', `delete_dataset/${datasetId}`);
    }
}
