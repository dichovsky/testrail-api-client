import {
    AddPlanPayloadSchema,
    UpdatePlanPayloadSchema,
    AddPlanEntryPayloadSchema,
    AddRunToPlanEntryPayloadSchema,
    UpdatePlanEntryPayloadSchema,
    UpdateRunInPlanEntryPayloadSchema,
} from '../../schemas.js';
import { createWriteHandler, createDestructiveHandler } from '../write-handler-factory.js';

export const handlePlanAdd = createWriteHandler({
    action: 'plan add',
    pathParams: ['project_id'],
    bodySchema: AddPlanPayloadSchema,
    call: (client, [projectId], body) => client.plans.addPlan(projectId, body),
});

export const handlePlanUpdate = createWriteHandler({
    action: 'plan update',
    pathParams: ['plan_id'],
    bodySchema: UpdatePlanPayloadSchema,
    call: (client, [planId], body) => client.plans.updatePlan(planId, body),
});

export const handlePlanAddEntry = createWriteHandler({
    action: 'plan add-entry',
    pathParams: ['plan_id'],
    bodySchema: AddPlanEntryPayloadSchema,
    call: (client, [planId], body) => client.plans.addPlanEntry(planId, body),
});

export const handlePlanAddRunToEntry = createWriteHandler({
    action: 'plan add-run-to-entry',
    pathParams: ['plan_id'],
    entryParam: 'entry_id',
    bodySchema: AddRunToPlanEntryPayloadSchema,
    call: (client, [planId], body, entryId) => client.plans.addRunToPlanEntry(planId, entryId, body),
});

export const handlePlanUpdateEntry = createWriteHandler({
    action: 'plan update-entry',
    pathParams: ['plan_id'],
    entryParam: 'entry_id',
    bodySchema: UpdatePlanEntryPayloadSchema,
    call: (client, [planId], body, entryId) => client.plans.updatePlanEntry(planId, entryId, body),
});

export const handlePlanUpdateRunInEntry = createWriteHandler({
    action: 'plan update-run-in-entry',
    pathParams: ['run_id'],
    bodySchema: UpdateRunInPlanEntryPayloadSchema,
    call: (client, [runId], body) => client.plans.updateRunInPlanEntry(runId, body),
});

/**
 * Destructive: closes a plan. TestRail has no `open_plan` — once closed, the
 * plan accepts no new entries/runs. Takes no body; returns the closed plan.
 */
export const handlePlanClose = createDestructiveHandler({
    action: 'plan close',
    pathParams: ['plan_id'],
    kind: 'close',
    call: (client, [planId]) => client.plans.closePlan(planId),
});

/**
 * Destructive: deletes a plan and all of its entries and associated runs.
 * TestRail's `delete_plan` has no `soft=1` preview, so `--soft` is rejected.
 */
export const handlePlanDelete = createDestructiveHandler({
    action: 'plan delete',
    pathParams: ['plan_id'],
    call: (client, [planId]) => client.plans.deletePlan(planId),
});

/**
 * Destructive: deletes a single plan entry (and every run in it). `entry_id`
 * is a UUID string validated via `parseEntryId`. No `--soft` support upstream.
 */
export const handlePlanDeleteEntry = createDestructiveHandler({
    action: 'plan delete-entry',
    pathParams: ['plan_id'],
    entryParam: 'entry_id',
    call: (client, [planId], entryId) => client.plans.deletePlanEntry(planId, entryId),
});

/**
 * Destructive: deletes a single run from its plan entry. Takes only the
 * numeric `run_id` — the entry/plan are looked up server-side. No `--soft`.
 */
export const handlePlanDeleteRunFromEntry = createDestructiveHandler({
    action: 'plan delete-run-from-entry',
    pathParams: ['run_id'],
    call: (client, [runId]) => client.plans.deleteRunFromPlanEntry(runId),
});
