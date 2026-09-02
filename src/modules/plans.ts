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
import { validateId, validateEntryId } from '../validation.js';
import type { Page, PaginatedRequestOptions } from '../pagination.js';
import { createPaginatedListExecutor } from './paginated-list.js';

export type GetAllPlansOptions = Omit<GetPlansOptions, 'limit' | 'offset'> & PaginatedRequestOptions;

export const PLANS_PAGINATION = createPaginatedListExecutor<
    { readonly projectId: number },
    GetPlansOptions,
    GetAllPlansOptions,
    Plan
>({
    operations: ['get_plans'],
    collectionKey: 'plans',
    itemSchema: PlanSchema,
    response: 'envelope',
    requestControls: true,
    prepare: ({ projectId }, options) => {
        validateId(projectId, 'projectId');
        const createdAfter = options?.createdAfter ?? options?.created_after;
        const createdBefore = options?.createdBefore ?? options?.created_before;
        const createdBy = options?.createdBy ?? options?.created_by;
        const milestoneId = options?.milestoneId ?? options?.milestone_id;
        if (createdBy !== undefined) createdBy.forEach((userId) => validateId(userId, 'createdBy'));
        if (milestoneId !== undefined) milestoneId.forEach((id) => validateId(id, 'milestoneId'));
        const isCompleted =
            options?.isCompleted ?? (options?.is_completed !== undefined ? options.is_completed === 1 : undefined);
        return {
            operation: 'get_plans',
            pathParameters: [projectId],
            query: {
                created_after: createdAfter,
                created_before: createdBefore,
                created_by: serializeIdList(createdBy),
                is_completed: isCompleted !== undefined ? (isCompleted ? 1 : 0) : undefined,
                milestone_id: serializeIdList(milestoneId),
                refs: options?.refs,
            },
        };
    },
});

export class PlanModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_plan/{plan_id} */
    async getPlan(planId: number): Promise<Plan> {
        validateId(planId, 'planId');
        return this.client.request<Plan>({ method: 'GET', endpoint: `get_plan/${planId}`, schema: PlanSchema });
    }

    /** @testrail GET get_plans/{project_id} */
    async getPlans(projectId: number, options?: GetPlansOptions): Promise<Plan[]> {
        return PLANS_PAGINATION.items(this.client, { projectId }, options);
    }

    /** Get one response page, preserving TestRail's pagination metadata when present. */
    async getPlansPage(projectId: number, options?: GetPlansOptions): Promise<Page<Plan>> {
        return PLANS_PAGINATION.page(this.client, { projectId }, options);
    }

    /** Get every plan under the configured pagination safety bounds. */
    async getAllPlans(projectId: number, options?: GetAllPlansOptions): Promise<Plan[]> {
        return PLANS_PAGINATION.all(this.client, { projectId }, options);
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
