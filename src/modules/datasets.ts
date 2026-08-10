import { TestRailClientCore } from '../client-core.js';
import { DatasetSchema } from '../schemas.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import { listOf, unwrapList } from './list.js';

export class DatasetModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_dataset/{dataset_id} */
    async getDataset(datasetId: number): Promise<Dataset> {
        validateId(datasetId, 'datasetId');
        return this.client.request<Dataset>({
            method: 'GET',
            endpoint: `get_dataset/${datasetId}`,
            schema: DatasetSchema,
        });
    }

    /** @testrail GET get_datasets/{project_id} */
    async getDatasets(projectId: number): Promise<Dataset[]> {
        validateId(projectId, 'projectId');
        // `get_datasets` documents the `{ offset, limit, size, _links, datasets: [...] }`
        // pagination wrapper, but the docs are not a reliable guide to which shape a
        // given server sends — see the `listOf` docblock in `./list.js` for the full
        // rationale. Accept both; `unwrapList` normalizes.
        const raw = await this.client.request<Dataset[] | { datasets?: Dataset[] }>({
            method: 'GET',
            endpoint: `get_datasets/${projectId}`,
            schema: listOf('datasets', DatasetSchema),
        });
        return unwrapList('datasets', raw);
    }

    /** @testrail POST add_dataset/{project_id} */
    async addDataset(projectId: number, payload: AddDatasetPayload): Promise<Dataset> {
        validateId(projectId, 'projectId');
        return this.client.request<Dataset>({
            method: 'POST',
            endpoint: `add_dataset/${projectId}`,
            schema: DatasetSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_dataset/{dataset_id} */
    async updateDataset(datasetId: number, payload: UpdateDatasetPayload): Promise<Dataset> {
        validateId(datasetId, 'datasetId');
        return this.client.request<Dataset>({
            method: 'POST',
            endpoint: `update_dataset/${datasetId}`,
            schema: DatasetSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_dataset/{dataset_id} */
    async deleteDataset(datasetId: number): Promise<void> {
        validateId(datasetId, 'datasetId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_dataset/${datasetId}`,
        });
    }
}
