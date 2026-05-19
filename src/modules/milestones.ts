import { TestRailClientCore } from '../client-core.js';
import type { Milestone, GetMilestonesOptions } from '../types.js';
import type { AddMilestonePayload, UpdateMilestonePayload } from '../schemas.js';
import { MilestoneSchema } from '../schemas.js';
import { z } from 'zod';

export class MilestoneModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_milestone/{milestone_id} */
    async getMilestone(milestoneId: number): Promise<Milestone> {
        this.client.validateId(milestoneId, 'milestoneId');
        return this.client.requestParsed<Milestone>('GET', `get_milestone/${milestoneId}`, MilestoneSchema);
    }

    /** @testrail GET get_milestones/{project_id} */
    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        this.client.validateId(projectId, 'projectId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_milestones/${projectId}`, {
            is_completed: options?.is_completed,
            limit: options?.limit,
            offset: options?.offset,
        });
        return (
            (
                await this.client.requestParsed<{ milestones?: Milestone[] }>(
                    'GET',
                    endpoint,
                    z.object({ milestones: z.array(MilestoneSchema).optional() }),
                )
            ).milestones ?? []
        );
    }

    /** @testrail POST add_milestone/{project_id} */
    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Milestone>('POST', `add_milestone/${projectId}`, MilestoneSchema, payload);
    }

    /** @testrail POST update_milestone/{milestone_id} */
    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        this.client.validateId(milestoneId, 'milestoneId');
        return this.client.requestParsed<Milestone>(
            'POST',
            `update_milestone/${milestoneId}`,
            MilestoneSchema,
            payload,
        );
    }

    /** @testrail POST delete_milestone/{milestone_id} */
    async deleteMilestone(milestoneId: number): Promise<void> {
        this.client.validateId(milestoneId, 'milestoneId');
        await this.client.request<void>('POST', `delete_milestone/${milestoneId}`);
    }
}
