import { TestRailClientCore } from '../client-core.js';
import type { Plan, PlanEntry, GetPlansOptions } from '../types.js';
import {
    PlanSchema,
    PlanEntrySchema,
    type AddPlanPayload,
    type UpdatePlanPayload,
    type AddPlanEntryPayload,
    type UpdatePlanEntryPayload,
} from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';

export class PlanModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getPlan(planId: number): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.parse<Plan>(PlanSchema, await this.client.request<unknown>('GET', `get_plan/${planId}`));
    }

    async getPlans(projectId: number, options?: GetPlansOptions): Promise<Plan[]> {
        this.client.validateId(projectId, 'projectId');
        this.client.validatePaginationParams(options?.limit, options?.offset);
        const endpoint = this.client.buildEndpoint(`get_plans/${projectId}`, {
            created_after: options?.created_after,
            created_before: options?.created_before,
            created_by: serializeIdList(options?.created_by),
            is_completed: options?.is_completed,
            milestone_id: serializeIdList(options?.milestone_id),
            limit: options?.limit,
            offset: options?.offset,
        });
        const raw = await this.client.request<unknown>('GET', endpoint);
        return (
            this.client.parse<{ plans?: Plan[] }>(z.object({ plans: z.array(PlanSchema).optional() }), raw).plans ?? []
        );
    }

    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        this.client.validateId(projectId, 'projectId');
        return this.client.parse<Plan>(
            PlanSchema,
            await this.client.request<unknown>('POST', `add_plan/${projectId}`, payload),
        );
    }

    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.parse<Plan>(
            PlanSchema,
            await this.client.request<unknown>('POST', `update_plan/${planId}`, payload),
        );
    }

    async closePlan(planId: number): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.parse<Plan>(PlanSchema, await this.client.request<unknown>('POST', `close_plan/${planId}`));
    }

    async deletePlan(planId: number): Promise<void> {
        this.client.validateId(planId, 'planId');
        await this.client.request<void>('POST', `delete_plan/${planId}`);
    }

    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        this.client.validateId(planId, 'planId');
        return this.client.parse<PlanEntry>(
            PlanEntrySchema,
            await this.client.request<unknown>('POST', `add_plan_entry/${planId}`, payload),
        );
    }

    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        this.client.validateId(planId, 'planId');
        this.client.validateEntryId(entryId);
        return this.client.parse<PlanEntry>(
            PlanEntrySchema,
            await this.client.request<unknown>('POST', `update_plan_entry/${planId}/${entryId}`, payload),
        );
    }

    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        this.client.validateId(planId, 'planId');
        this.client.validateEntryId(entryId);
        await this.client.request<void>('POST', `delete_plan_entry/${planId}/${entryId}`);
    }
}
