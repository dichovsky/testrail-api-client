import { TestRailClientCore } from '../client-core.js';
import { LabelSchema, LabelWriteResponseSchema } from '../schemas.js';
import type { AddLabelPayload, DeleteLabelsPayload, Label, UpdateLabelPayload } from '../schemas.js';
import { validateId, validateIdList } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetLabelsOptions {
    /** Maximum number of labels to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export type GetAllLabelsOptions = PaginatedRequestOptions;

export const LABELS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetLabelsOptions,
    GetAllLabelsOptions,
    Label
>({
    operations: ['get_labels'],
    collectionKey: 'labels',
    itemSchema: LabelSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }) => {
        validateId(projectId, 'projectId');
        return { operation: 'get_labels', pathParameters: [projectId] };
    },
});

/**
 * Entity drift remains advisory: a mismatch returns the raw body, so the
 * `{ label }` transform of `LabelWriteResponseSchema` never runs. Normalize the
 * structural wrapper here as well. A flat label carries `id` and is unchanged.
 */
function unwrapLabelWrite(raw: unknown): Label {
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && !('id' in raw)) {
        const label = (raw as Record<string, unknown>)['label'];
        if (typeof label === 'object' && label !== null && !Array.isArray(label)) return label as Label;
    }
    return raw as Label;
}

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
        return LABELS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getLabelsPage(projectId: number, options?: GetLabelsOptions): Promise<Page<Label>> {
        return LABELS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every label under the configured pagination safety bounds. */
    async getAllLabels(projectId: number, options?: GetAllLabelsOptions): Promise<Label[]> {
        return LABELS_PAGINATION.all(this.client, { projectId }, options);
    }

    /** @testrail POST add_label/{project_id} */
    async addLabel(projectId: number, payload: AddLabelPayload): Promise<Label> {
        validateId(projectId, 'projectId');
        const response = await this.client.request<unknown>({
            method: 'POST',
            endpoint: `add_label/${projectId}`,
            schema: LabelWriteResponseSchema,
            body: { kind: 'json', data: payload },
        });
        return unwrapLabelWrite(response);
    }

    /** @testrail POST update_label/{label_id} */
    async updateLabel(labelId: number, payload: UpdateLabelPayload): Promise<Label> {
        validateId(labelId, 'labelId');
        validateId(payload.project_id, 'projectId');
        const response = await this.client.request<unknown>({
            method: 'POST',
            endpoint: `update_label/${labelId}`,
            schema: LabelWriteResponseSchema,
            body: { kind: 'json', data: payload },
        });
        return unwrapLabelWrite(response);
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
        validateIdList(payload.label_ids, 'labelIds');
        await this.client.request<void>({
            method: 'POST',
            endpoint: 'delete_labels',
            body: { kind: 'json', data: payload },
        });
    }
}
