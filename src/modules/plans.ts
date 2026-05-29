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
import { validateId, validateEntryId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';

export class PlanModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_plan/{plan_id} */
    async getPlan(planId: number): Promise<Plan> {
        validateId(planId, 'planId');
        return this.client.request<Plan>({ method: 'GET', endpoint: `get_plan/${planId}`, schema: PlanSchema });
    }

    /** @testrail GET get_plans/{project_id} */
    async getPlans(projectId: number, options?: GetPlansOptions): Promise<Plan[]> {
        validateId(projectId, 'projectId');
        validatePaginationParams(options?.limit, options?.offset);
        const endpoint = buildEndpoint(`get_plans/${projectId}`, {
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
                await this.client.request<{ plans?: Plan[] }>({
                    method: 'GET',
                    endpoint,
                    // SPEC #1.5 — TestRail can return `{ plans: null }` for empty list wrappers;
                    // `.nullish()` accepts both null and omitted (observed behavior, PR #130).
                    schema: z.object({ plans: z.array(PlanSchema).nullish() }),
                })
            ).plans ?? []
        );
    }

    /** @testrail POST add_plan/{project_id} */
    async addPlan(projectId: number, payload: AddPlanPayload): Promise<Plan> {
        validateId(projectId, 'projectId');
        return this.client.request<Plan>({
            method: 'POST',
            endpoint: `add_plan/${projectId}`,
            schema: PlanSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_plan/{plan_id} */
    async updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan> {
        validateId(planId, 'planId');
        return this.client.request<Plan>({
            method: 'POST',
            endpoint: `update_plan/${planId}`,
            schema: PlanSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST close_plan/{plan_id} */
    async closePlan(planId: number): Promise<Plan> {
        validateId(planId, 'planId');
        return this.client.request<Plan>({
            method: 'POST',
            endpoint: `close_plan/${planId}`,
            schema: PlanSchema,
        });
    }

    /** @testrail POST delete_plan/{plan_id} */
    async deletePlan(planId: number): Promise<void> {
        validateId(planId, 'planId');
        await this.client.request<void>({ method: 'POST', endpoint: `delete_plan/${planId}` });
    }

    /** @testrail POST add_plan_entry/{plan_id} */
    async addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry> {
        validateId(planId, 'planId');
        return this.client.request<PlanEntry>({
            method: 'POST',
            endpoint: `add_plan_entry/${planId}`,
            schema: PlanEntrySchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_plan_entry/{plan_id}/{entry_id} */
    async updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry> {
        validateId(planId, 'planId');
        validateEntryId(entryId);
        return this.client.request<PlanEntry>({
            method: 'POST',
            endpoint: `update_plan_entry/${planId}/${entryId}`,
            schema: PlanEntrySchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_plan_entry/{plan_id}/{entry_id} */
    async deletePlanEntry(planId: number, entryId: string): Promise<void> {
        validateId(planId, 'planId');
        validateEntryId(entryId);
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_plan_entry/${planId}/${entryId}`,
        });
    }

    /** @testrail POST add_run_to_plan_entry/{plan_id}/{entry_id} */
    async addRunToPlanEntry(planId: number, entryId: string, payload: AddRunToPlanEntryPayload): Promise<Run> {
        validateId(planId, 'planId');
        validateEntryId(entryId);
        return this.client.request<Run>({
            method: 'POST',
            endpoint: `add_run_to_plan_entry/${planId}/${entryId}`,
            schema: RunSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_run_in_plan_entry/{run_id} */
    async updateRunInPlanEntry(runId: number, payload: UpdateRunInPlanEntryPayload): Promise<Run> {
        validateId(runId, 'runId');
        return this.client.request<Run>({
            method: 'POST',
            endpoint: `update_run_in_plan_entry/${runId}`,
            schema: RunSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST delete_run_from_plan_entry/{run_id} */
    async deleteRunFromPlanEntry(runId: number): Promise<void> {
        validateId(runId, 'runId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_run_from_plan_entry/${runId}`,
        });
    }
}
