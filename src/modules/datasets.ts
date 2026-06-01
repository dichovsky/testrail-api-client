import { TestRailClientCore } from '../client-core.js';
import { DatasetSchema } from '../schemas.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../schemas.js';
import { validateId } from '../validation.js';
import { z } from 'zod';

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
        // `get_datasets` is a TestRail bulk-API endpoint: it returns the
        // `{ offset, limit, size, _links, datasets: [...] }` pagination wrapper
        // (standard for every bulk endpoint since TestRail 6.7), never a bare
        // array. Parse the wrapper (not `z.array(DatasetSchema)`, which rejects
        // the object) and return `datasets ?? []`. `.nullish()` accepts both an
        // omitted key and `null` for an empty list. Mirrors `variables.getVariables()`.
        return (
            (
                await this.client.request<{ datasets?: Dataset[] }>({
                    method: 'GET',
                    endpoint: `get_datasets/${projectId}`,
                    schema: z.object({ datasets: z.array(DatasetSchema).nullish() }),
                })
            ).datasets ?? []
        );
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
