import { TestRailClientCore } from '../client-core.js';
import type { Milestone, GetMilestonesOptions } from '../types.js';
import type { AddMilestonePayload, UpdateMilestonePayload } from '../schemas.js';
import { MilestoneSchema } from '../schemas.js';
import { validateId } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllMilestonesOptions = Omit<GetMilestonesOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

export const MILESTONES_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetMilestonesOptions,
    GetAllMilestonesOptions,
    Milestone
>({
    operations: ['get_milestones'],
    collectionKey: 'milestones',
    itemSchema: MilestoneSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        const isCompleted =
            options?.isCompleted ?? (options?.is_completed !== undefined ? options.is_completed === 1 : undefined);
        const isStarted =
            options?.isStarted ?? (options?.is_started !== undefined ? options.is_started === 1 : undefined);
        return {
            operation: 'get_milestones',
            pathParameters: [projectId],
            query: {
                is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
                is_started: isStarted !== undefined ? (isStarted ? 1 : 0) : undefined,
            },
        };
    },
});

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
        return MILESTONES_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getMilestonesPage(projectId: number, options?: GetMilestonesOptions): Promise<Page<Milestone>> {
        return MILESTONES_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every milestone under the configured pagination safety bounds. */
    async getAllMilestones(projectId: number, options?: GetAllMilestonesOptions): Promise<Milestone[]> {
        return MILESTONES_PAGINATION.all(this.client, { projectId }, options);
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
