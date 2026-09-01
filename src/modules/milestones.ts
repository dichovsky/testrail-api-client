import { TestRailClientCore } from '../client-core.js';
import type { Milestone, GetMilestonesOptions } from '../types.js';
import type { AddMilestonePayload, UpdateMilestonePayload } from '../schemas.js';
import { MilestoneSchema } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginatedRequestOptions, PaginationRequest } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';
import { snapshotOptionFields, snapshotPaginatedRequestOptions } from './pagination-options.js';

export type GetAllMilestonesOptions = Omit<GetMilestonesOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    pageProjection?: boolean;
};

export class MilestoneModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_milestone/{milestone_id} */
    async getMilestone(milestoneId: number): Promise<Milestone> {
        validateId(milestoneId, 'milestoneId');
        return this.client.request<Milestone>({
            method: 'GET',
            endpoint: `get_milestone/${milestoneId}`,
            schema: MilestoneSchema,
        });
    }

    /** @testrail GET get_milestones/{project_id} */
    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        return unwrapList<Milestone>('milestones', await this.requestMilestones(projectId, options));
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getMilestonesPage(projectId: number, options?: GetMilestonesOptions): Promise<Page<Milestone>> {
        return decodePage<Milestone>(
            'milestones',
            await this.requestMilestones(projectId, options, { pageProjection: true }),
        );
    }

    /** Get every milestone under the configured pagination safety bounds. */
    async getAllMilestones(projectId: number, options?: GetAllMilestonesOptions): Promise<Milestone[]> {
        const filters = snapshotOptionFields(options, ['isCompleted', 'isStarted', 'is_completed', 'is_started']);
        return collectAllPages<Milestone>({
            ...snapshotPaginatedRequestOptions(options),
            requestControls: true,
            fetchPage: async (request) => {
                const pageOptions: GetMilestonesOptions = {
                    ...filters,
                    limit: request.limit as number,
                    offset: request.offset as number,
                };
                const raw = await this.requestMilestones(projectId, pageOptions, {
                    bypassCache: request.bypassCache,
                    remainingTimeMs: request.remainingTimeMs,
                    deadlineAt: request.deadlineAt,
                });
                return decodePage<Milestone>('milestones', raw);
            },
        });
    }

    private async requestMilestones(
        projectId: number,
        options?: GetMilestonesOptions,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        const isCompleted =
            options?.isCompleted ?? (options?.is_completed !== undefined ? options.is_completed === 1 : undefined);
        const isStarted =
            options?.isStarted ?? (options?.is_started !== undefined ? options.is_started === 1 : undefined);
        const endpoint = buildEndpoint(`get_milestones/${projectId}`, {
            is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
            is_started: isStarted !== undefined ? (isStarted ? 1 : 0) : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('milestones', MilestoneSchema) : listOf('milestones', MilestoneSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
            ...(controls?.deadlineAt !== undefined && { deadlineAt: controls.deadlineAt }),
        });
    }

    /** @testrail POST add_milestone/{project_id} */
    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        validateId(projectId, 'projectId');
        return this.client.request<Milestone>({
            method: 'POST',
            endpoint: `add_milestone/${projectId}`,
            schema: MilestoneSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_milestone/{milestone_id} */
    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        validateId(milestoneId, 'milestoneId');
        return this.client.request<Milestone>({
            method: 'POST',
            endpoint: `update_milestone/${milestoneId}`,
            schema: MilestoneSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_milestone/{milestone_id} */
    async deleteMilestone(milestoneId: number): Promise<void> {
        validateId(milestoneId, 'milestoneId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_milestone/${milestoneId}`,
        });
    }
}
