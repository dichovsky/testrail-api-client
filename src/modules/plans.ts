import { TestRailClientCore } from '../client-core.js';
import type { Plan, PlanEntry, Run, GetPlansOptions } from '../types.js';
import {
    PlanSchema,
    PlanEntrySchema,
    RunSchema,
    type AddPlanPayload,
    type UpdatePlanPayload,
    type AddPlanEntryPayload,
    type UpdatePlanEntryPayload,
    type AddRunToPlanEntryPayload,
    type UpdateRunInPlanEntryPayload,
} from '../schemas.js';
import { serializeIdList } from '../utils.js';
import { z } from 'zod';

export class PlanModule {
    constructor(private readonly client: TestRailClientCore) {}

    async getPlan(planId: number): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.requestParsed<Plan>('GET', `get_plan/${planId}`, PlanSchema);
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
        return (
            (
                await this.client.requestParsed<{ plans?: Plan[] }>(
                    'GET',
                    endpoint,
                    z.object({ plans: z.array(PlanSchema).optional() }),
                )
            ).plans ?? []
        );
    }

    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        this.client.validateId(projectId, 'projectId');
        return this.client.requestParsed<Plan>('POST', `add_plan/${projectId}`, PlanSchema, payload);
    }

    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.requestParsed<Plan>('POST', `update_plan/${planId}`, PlanSchema, payload);
    }

    async closePlan(planId: number): Promise<Plan> {
        this.client.validateId(planId, 'planId');
        return this.client.requestParsed<Plan>('POST', `close_plan/${planId}`, PlanSchema);
    }

    async deletePlan(planId: number): Promise<void> {
        this.client.validateId(planId, 'planId');
        await this.client.request<void>('POST', `delete_plan/${planId}`);
    }

    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        this.client.validateId(planId, 'planId');
        return this.client.requestParsed<PlanEntry>('POST', `add_plan_entry/${planId}`, PlanEntrySchema, payload);
    }

    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        this.client.validateId(planId, 'planId');
        this.client.validateEntryId(entryId);
        return this.client.requestParsed<PlanEntry>(
            'POST',
            `update_plan_entry/${planId}/${entryId}`,
            PlanEntrySchema,
            payload,
        );
    }

    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        this.client.validateId(planId, 'planId');
        this.client.validateEntryId(entryId);
        await this.client.request<void>('POST', `delete_plan_entry/${planId}/${entryId}`);
    }

    async addRunToPlanEntry(planId: number, entryId: string, payload: AddRunToPlanEntryPayload): Promise<Run> {
        this.client.validateId(planId, 'planId');
        this.client.validateEntryId(entryId);
        return this.client.requestParsed<Run>('POST', `add_run_to_plan_entry/${planId}/${entryId}`, RunSchema, payload);
    }

    async updateRunInPlanEntry(runId: number, payload: UpdateRunInPlanEntryPayload): Promise<Run> {
        this.client.validateId(runId, 'runId');
        return this.client.requestParsed<Run>('POST', `update_run_in_plan_entry/${runId}`, RunSchema, payload);
    }

    async deleteRunFromPlanEntry(runId: number): Promise<void> {
        this.client.validateId(runId, 'runId');
        await this.client.request<void>('POST', `delete_run_from_plan_entry/${runId}`);
    }
}
