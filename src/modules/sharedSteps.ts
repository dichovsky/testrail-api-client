import { TestRailClientCore } from '../client-core.js';
import type { Page, PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';
import type { AddSharedStepPayload, SharedStep, StepHistoryEntry, UpdateSharedStepPayload } from '../schemas.js';
import { SharedStepSchema, StepHistoryEntrySchema } from '../schemas.js';
import { serializeIdFilter } from '../utils.js';
import { validateId } from '../validation.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export interface GetSharedStepsOptions {
    /** Only return shared steps created after this Unix timestamp. */
    createdAfter?: number;
    /** Only return shared steps created before this Unix timestamp. */
    createdBefore?: number;
    /** Only return shared steps created by one or more users. */
    createdBy?: number | readonly number[];
    /** Only return shared steps updated after this Unix timestamp. */
    updatedAfter?: number;
    /** Only return shared steps updated before this Unix timestamp. */
    updatedBefore?: number;
    /** Only return shared steps matching this external reference. */
    refs?: string;
    limit?: number;
    offset?: number;
}

export interface GetSharedStepHistoryOptions {
    limit?: number;
    offset?: number;
}

export type GetAllSharedStepsOptions = Omit<GetSharedStepsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;
export type GetAllSharedStepHistoryOptions = PaginationSafetyOptions;

export interface DeleteSharedStepOptions {
    /** Preserve shared-step contents in referencing cases. TestRail defaults to true. */
    keepInCases?: boolean;
}

export const SHARED_STEPS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetSharedStepsOptions,
    GetAllSharedStepsOptions,
    SharedStep
>({
    operations: ['get_shared_steps'],
    collectionKey: 'shared_steps',
    itemSchema: SharedStepSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        return {
            operation: 'get_shared_steps',
            pathParameters: [projectId],
            query: {
                created_after: options?.createdAfter,
                created_before: options?.createdBefore,
                created_by: serializeIdFilter(options?.createdBy, 'createdBy'),
                updated_after: options?.updatedAfter,
                updated_before: options?.updatedBefore,
                refs: options?.refs,
            },
        };
    },
});

export const SHARED_STEP_HISTORY_PAGINATION = createPaginatedListExecutor<
    { readonly sharedStepId: number },
    GetSharedStepHistoryOptions,
    GetAllSharedStepHistoryOptions,
    StepHistoryEntry
>({
    operations: ['get_shared_step_history'],
    collectionKey: 'step_history',
    itemSchema: StepHistoryEntrySchema,
    response: 'envelope',
    requestControls: false,
    prepare: ({ sharedStepId }) => {
        validateId(sharedStepId, 'sharedStepId');
        return { operation: 'get_shared_step_history', pathParameters: [sharedStepId] };
    },
});

export class SharedStepModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_shared_step/{shared_step_id} */
    async getSharedStep(sharedStepId: number): Promise<SharedStep> {
        validateId(sharedStepId, 'sharedStepId');
        return this.client.request<SharedStep>({
            method: 'GET',
            endpoint: `get_shared_step/${sharedStepId}`,
            schema: SharedStepSchema,
        });
    }

    /** @testrail GET get_shared_steps/{project_id} */
    async getSharedSteps(projectId: number, options?: GetSharedStepsOptions): Promise<SharedStep[]> {
        return SHARED_STEPS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail pagination metadata. */
    async getSharedStepsPage(projectId: number, options?: GetSharedStepsOptions): Promise<Page<SharedStep>> {
        return SHARED_STEPS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every shared step under the configured pagination safety bounds. */
    async getAllSharedSteps(projectId: number, options?: GetAllSharedStepsOptions): Promise<SharedStep[]> {
        return SHARED_STEPS_PAGINATION.all(this.client, { projectId }, options);
    }

    /** @testrail POST add_shared_step/{project_id} */
    async addSharedStep(projectId: number, payload: AddSharedStepPayload): Promise<SharedStep> {
        validateId(projectId, 'projectId');
        return this.client.request<SharedStep>({
            method: 'POST',
            endpoint: `add_shared_step/${projectId}`,
            schema: SharedStepSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_shared_step/{shared_step_id} */
    async updateSharedStep(sharedStepId: number, payload: UpdateSharedStepPayload): Promise<SharedStep> {
        validateId(sharedStepId, 'sharedStepId');
        return this.client.request<SharedStep>({
            method: 'POST',
            endpoint: `update_shared_step/${sharedStepId}`,
            schema: SharedStepSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_shared_step/{shared_step_id} */
    async deleteSharedStep(sharedStepId: number, options?: DeleteSharedStepOptions): Promise<void> {
        validateId(sharedStepId, 'sharedStepId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_shared_step/${sharedStepId}`,
            ...(options?.keepInCases !== undefined && {
                body: { kind: 'json' as const, data: { keep_in_cases: options.keepInCases ? 1 : 0 } },
            }),
        });
    }

    /** @testrail GET get_shared_step_history/{shared_step_id} */
    async getSharedStepHistory(
        sharedStepId: number,
        options?: GetSharedStepHistoryOptions,
    ): Promise<StepHistoryEntry[]> {
        return SHARED_STEP_HISTORY_PAGINATION.items(this.client, { sharedStepId }, options);
    }

    /** Get one history response page without sending undocumented request controls. */
    async getSharedStepHistoryPage(sharedStepId: number): Promise<Page<StepHistoryEntry>> {
        return SHARED_STEP_HISTORY_PAGINATION.page(this.client, { sharedStepId });
    }

    /** Get every history entry under the configured pagination safety bounds. */
    async getAllSharedStepHistory(
        sharedStepId: number,
        options?: GetAllSharedStepHistoryOptions,
    ): Promise<StepHistoryEntry[]> {
        return SHARED_STEP_HISTORY_PAGINATION.all(this.client, { sharedStepId }, options);
    }
}
