import { TestRailClientCore } from '../client-core.js';
import { DatasetSchema } from '../schemas.js';
import type { Dataset, AddDatasetPayload, UpdateDatasetPayload } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginationRequest, PaginationSafetyOptions } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';

export type GetAllDatasetsOptions = PaginationSafetyOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs'>> & {
    pageProjection?: boolean;
};

interface DatasetPaginationControls {
    limit?: number;
    offset?: number;
}

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
        return unwrapList<Dataset>('datasets', await this.requestDatasets(projectId));
    }

    /** Get one response page without sending undocumented request controls. */
    async getDatasetsPage(projectId: number): Promise<Page<Dataset>> {
        return decodePage<Dataset>(
            'datasets',
            await this.requestDatasets(projectId, undefined, { pageProjection: true }),
        );
    }

    /** Get every dataset under the configured pagination safety bounds. */
    async getAllDatasets(projectId: number, options?: GetAllDatasetsOptions): Promise<Dataset[]> {
        return collectAllPages<Dataset>({
            ...(options ?? {}),
            requestControls: false,
            fetchPage: (request) =>
                this.requestDatasets(
                    projectId,
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                    },
                ).then((raw) => decodePage<Dataset>('datasets', raw)),
        });
    }

    private async requestDatasets(
        projectId: number,
        pagination?: DatasetPaginationControls,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(pagination?.limit, pagination?.offset);
        const endpoint = buildEndpoint(`get_datasets/${projectId}`, {
            limit: pagination?.limit,
            offset: pagination?.offset,
        });
        // `get_datasets` documents the `{ offset, limit, size, _links, datasets: [...] }`
        // pagination wrapper, but the docs are not a reliable guide to which shape a
        // given server sends — see the `listOf` docblock in `./list.js` for the full
        // rationale. Accept both; `unwrapList` normalizes.
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('datasets', DatasetSchema) : listOf('datasets', DatasetSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
        });
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
