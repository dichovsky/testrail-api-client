import { TestRailClientCore } from '../client-core.js';
import type { SharedStep, AddSharedStepPayload, UpdateSharedStepPayload, StepHistoryEntry } from '../schemas.js';
import { SharedStepSchema, StepHistoryEntrySchema } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { serializeIdFilter } from '../utils.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest, PaginationSafetyOptions } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import {
    snapshotOptionFields,
    snapshotPaginatedRequestOptions,
    snapshotPaginationSafetyOptions,
} from './pagination-options.js';

export interface GetSharedStepsOptions {
    /** Only return shared steps created after this Unix timestamp */
    createdAfter?: number;
    /** Only return shared steps created before this Unix timestamp */
    createdBefore?: number;
    /** Only return shared steps created by one or more users */
    createdBy?: number | readonly number[];
    /** Only return shared steps updated after this Unix timestamp */
    updatedAfter?: number;
    /** Only return shared steps updated before this Unix timestamp */
    updatedBefore?: number;
    /** Only return shared steps matching this external reference */
    refs?: string;
    /** Maximum number of shared steps to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export interface GetSharedStepHistoryOptions {
    /** Maximum number of history entries to return */
    limit?: number;
    /** Pagination offset */
    offset?: number;
}

export type GetAllSharedStepsOptions = Omit<GetSharedStepsOptions, 'limit' | 'offset'> & PaginatedRequestOptions;
export type GetAllSharedStepHistoryOptions = PaginationSafetyOptions;

export interface DeleteSharedStepOptions {
    /**
     * Preserve the step contents in cases that reference the shared step.
     * TestRail defaults this to `true`; set it to `false` to remove those
     * steps from every referencing case as well.
     */
    keepInCases?: boolean;
}

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

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
        return unwrapList<SharedStep>('shared_steps', await this.requestSharedSteps(projectId, options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getSharedStepsPage(projectId: number, options?: GetSharedStepsOptions): Promise<Page<SharedStep>> {
        return decodePage<SharedStep>(
            'shared_steps',
            await this.requestSharedSteps(projectId, options, { pageProjection: true }),
        );
    }

    /** Get every shared step under the configured pagination safety bounds. */
    async getAllSharedSteps(projectId: number, options?: GetAllSharedStepsOptions): Promise<SharedStep[]> {
        const filters = snapshotOptionFields(options, [
            'createdAfter',
            'createdBefore',
            'createdBy',
            'updatedAfter',
            'updatedBefore',
            'refs',
        ]);
        return collectAllPages<SharedStep>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: (request) =>
                this.requestSharedSteps(
                    projectId,
                    {
                        ...filters,
                        limit: request.limit as number,
                        offset: request.offset as number,
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<SharedStep>('shared_steps', raw)),
        });
    }

    private async requestSharedSteps(
        projectId: number,
        options?: GetSharedStepsOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_shared_steps/${projectId}`, {
            created_after: options?.createdAfter,
            created_before: options?.createdBefore,
            created_by: serializeIdFilter(options?.createdBy, 'createdBy'),
            updated_after: options?.updatedAfter,
            updated_before: options?.updatedBefore,
            refs: options?.refs,
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection
                ? pageOf('shared_steps', SharedStepSchema)
                : listOf('shared_steps', SharedStepSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
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
        return unwrapList<StepHistoryEntry>('step_history', await this.requestSharedStepHistory(sharedStepId, options));
    }

    /** Get one history response page without sending undocumented request controls. */
    async getSharedStepHistoryPage(sharedStepId: number): Promise<Page<StepHistoryEntry>> {
        return decodePage<StepHistoryEntry>(
            'step_history',
            await this.requestSharedStepHistory(sharedStepId, undefined, { pageProjection: true }),
        );
    }

    /** Get every history entry under the configured pagination safety bounds. */
    async getAllSharedStepHistory(
        sharedStepId: number,
        options?: GetAllSharedStepHistoryOptions,
    ): Promise<StepHistoryEntry[]> {
        return collectAllPages<StepHistoryEntry>({
            ...snapshotPaginationSafetyOptions(options),
            requestControls: false,
            fetchPage: (request) =>
                this.requestSharedStepHistory(
                    sharedStepId,
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                        deadlineAt: request.deadlineAt,
                    },
                ).then((raw) => decodePage<StepHistoryEntry>('step_history', raw)),
        });
    }

    private async requestSharedStepHistory(
        sharedStepId: number,
        options?: GetSharedStepHistoryOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(sharedStepId, 'sharedStepId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_shared_step_history/${sharedStepId}`, {
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            // SPEC #1.7 — entries live under `step_history` (NOT `history`). Live-instance
            // audit: the endpoint actually returns a BARE top-level array, not the wrapper.
            // Accept both shapes (mirrors getSharedSteps) and unwrap.
            schema: pageProjection
                ? pageOf('step_history', StepHistoryEntrySchema)
                : listOf('step_history', StepHistoryEntrySchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }
}
