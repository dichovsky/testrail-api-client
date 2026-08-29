import { TestRailClientCore } from '../client-core.js';
import { LabelSchema, LabelWriteResponseSchema } from '../schemas.js';
import type { AddLabelPayload, DeleteLabelsPayload, Label, UpdateLabelPayload } from '../schemas.js';
import { TestRailValidationError } from '../errors.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotPaginatedRequestOptions } from './pagination-options.js';

export interface GetLabelsOptions {
    /** Maximum number of labels to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export type GetAllLabelsOptions = PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

/**
 * Stand-alone TestRail Labels API (TestRail 10.5+). Label *reads* embedded in
 * case/test responses are handled by `LabelEmbeddedSchema`; this module manages
 * the label definitions themselves.
 */
export class LabelModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_label/{label_id} */
    async getLabel(labelId: number): Promise<Label> {
        validateId(labelId, 'labelId');
        return this.client.request<Label>({
            method: 'GET',
            endpoint: `get_label/${labelId}`,
            schema: LabelSchema,
        });
    }

    /** @testrail GET get_labels/{project_id} */
    async getLabels(projectId: number, options?: GetLabelsOptions): Promise<Label[]> {
        return unwrapList<Label>('labels', await this.requestLabels(projectId, options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getLabelsPage(projectId: number, options?: GetLabelsOptions): Promise<Page<Label>> {
        return decodePage<Label>('labels', await this.requestLabels(projectId, options, { pageProjection: true }));
    }

    /** Get every label under the configured pagination safety bounds. */
    async getAllLabels(projectId: number, options?: GetAllLabelsOptions): Promise<Label[]> {
        return collectAllPages<Label>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: (request) =>
                this.requestLabels(
                    projectId,
                    {
                        limit: request.limit as number,
                        offset: request.offset as number,
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<Label>('labels', raw)),
        });
    }

    private async requestLabels(
        projectId: number,
        options?: GetLabelsOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_labels/${projectId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        // `get_labels` documents the `{ offset, limit, size, _links, labels: [...] }`
        // pagination wrapper, but the docs are not a reliable guide to which shape a
        // given server sends — see the `listOf` docblock in `./list.js` for the full
        // rationale. Accept both; `unwrapList` normalizes.
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('labels', LabelSchema) : listOf('labels', LabelSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }

    /** @testrail POST add_label/{project_id} */
    async addLabel(projectId: number, payload: AddLabelPayload): Promise<Label> {
        validateId(projectId, 'projectId');
        return this.client.request<Label>({
            method: 'POST',
            endpoint: `add_label/${projectId}`,
            schema: LabelWriteResponseSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_label/{label_id} */
    async updateLabel(labelId: number, payload: UpdateLabelPayload): Promise<Label> {
        validateId(labelId, 'labelId');
        validateId(payload.project_id, 'projectId');
        return this.client.request<Label>({
            method: 'POST',
            endpoint: `update_label/${labelId}`,
            schema: LabelWriteResponseSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_label/{label_id} */
    async deleteLabel(labelId: number): Promise<void> {
        validateId(labelId, 'labelId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_label/${labelId}`,
        });
    }

    /** @testrail POST delete_labels */
    async deleteLabels(payload: DeleteLabelsPayload): Promise<void> {
        if (!Array.isArray(payload.label_ids) || payload.label_ids.length === 0) {
            throw new TestRailValidationError('labelIds must contain at least one positive integer');
        }
        payload.label_ids.forEach((labelId, index) => validateId(labelId, `labelIds[${index}]`));
        await this.client.request<void>({
            method: 'POST',
            endpoint: 'delete_labels',
            body: { kind: 'json', data: payload },
        });
    }
}
