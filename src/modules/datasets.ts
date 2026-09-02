import { TestRailClientCore } from '../client-core.js';
import { DatasetSchema } from '../schemas.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import type { Page, PaginationSafetyOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllDatasetsOptions = PaginationSafetyOptions;

interface DatasetPaginationControls {
    limit?: number;
    offset?: number;
}

export const DATASETS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    DatasetPaginationControls,
    GetAllDatasetsOptions,
    Dataset
>({
    operations: ['get_datasets'],
    collectionKey: 'datasets',
    itemSchema: DatasetSchema,
    response: 'envelope',
    requestControls: false,
    prepare: ({ projectId }) => {
        validateId(projectId, 'projectId');
        return {
            operation: 'get_datasets',
            pathParameters: [projectId],
        };
    },
});

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
        return DATASETS_PAGINATION.items(this.client, { projectId });
    }

    /** Get one response page without sending undocumented request controls. */
    async getDatasetsPage(projectId: number): Promise<Page<Dataset>> {
        return DATASETS_PAGINATION.page(this.client, { projectId });
    }

    /** Get every dataset under the configured pagination safety bounds. */
    async getAllDatasets(projectId: number, options?: GetAllDatasetsOptions): Promise<Dataset[]> {
        return DATASETS_PAGINATION.all(this.client, { projectId }, options);
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
