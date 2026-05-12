import { TestRailClientCore } from '../client-core.js';
import type { Milestone, GetMilestonesOptions, AddMilestonePayload, UpdateMilestonePayload } from '../types.js';
import { MilestoneSchema } from '../schemas.js';
import { z } from 'zod';

export class MilestoneModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getMilestone(milestoneId: number): Promise<Milestone> {
        this.client.validateId(milestoneId, 'milestoneId');
        return this.client.parse<Milestone>(
            MilestoneSchema,
            await this.client.request<unknown>('GET', `get_milestone/${milestoneId}`),
        );
    }

    async getMilestones(projectId: number, options?: GetMilestonesOptions): Promise<Milestone[]> {
        this.client.validateId(projectId, 'projectId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_milestones/${projectId}`, {
            is_completed: options?.is_completed,
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ milestones?: Milestone[] }>(
                z.object({ milestones: z.array(MilestoneSchema).optional() }),
                raw,
            ).milestones ?? []
        );
    }

    async addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Milestone>(
            MilestoneSchema,
            await this.client.request<unknown>('POST', `add_milestone/${projectId}`, payload),
        );
    }

    async updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone> {
        this.client.validateId(milestoneId, 'milestoneId');
        return this.client.parse<Milestone>(
            MilestoneSchema,
            await this.client.request<unknown>('POST', `update_milestone/${milestoneId}`, payload),
        );
    }

    async deleteMilestone(milestoneId: number): Promise<void> {
        this.client.validateId(milestoneId, 'milestoneId');
        await this.client.request<void>('POST', `delete_milestone/${milestoneId}`);
    }
}
