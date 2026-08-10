import { TestRailClientCore } from '../client-core.js';
import type { Milestone, GetMilestonesOptions } from '../types.js';
import type { AddMilestonePayload, UpdateMilestonePayload } from '../schemas.js';
import { MilestoneSchema } from '../schemas.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { listOf, unwrapList } from './list.js';

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
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        const isCompleted =
            options?.isCompleted ?? (options?.is_completed !== undefined ? options.is_completed === 1 : undefined);
        const endpoint = buildEndpoint(`get_milestones/${projectId}`, {
            is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<Milestone[] | { milestones?: Milestone[] }>({
            method: 'GET',
            endpoint,
            schema: listOf('milestones', MilestoneSchema),
        });
        return unwrapList<Milestone>('milestones', raw);
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
