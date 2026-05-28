import { z } from 'zod';
import { zObject } from './common.js';

// ── Run Schema ────────────────────────────────────────────────────────────────

export const RunSchema = zObject({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    milestone_id: z.number().nullish(),
    assignedto_id: z.number().nullish(),
    include_all: z.boolean(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
    config: z.string().nullish(),
    config_ids: z.array(z.number()).nullish(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    custom_status1_count: z.number().nullish(),
    custom_status2_count: z.number().nullish(),
    custom_status3_count: z.number().nullish(),
    custom_status4_count: z.number().nullish(),
    custom_status5_count: z.number().nullish(),
    custom_status6_count: z.number().nullish(),
    custom_status7_count: z.number().nullish(),
    project_id: z.number(),
    plan_id: z.number().nullish(),
    created_on: z.number(),
    created_by: z.number(),
    refs: z.string().nullish(),
    url: z.string(),
    // SPEC #2.1.5 — TestRail timestamp fields. `updated_on` requires TestRail 6.5.2+;
    // `start_on` / `due_on` are ungated in the docs but emit only when set. `.nullish()`
    // per field — the inferred type is `number | null | undefined` (omitted vs explicit
    // null vs typed Unix timestamp).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    updated_on: z.number().nullish(),
    // Plan-entry context fields. NOT documented on the `get_run` response in the
    // current TestRail API reference; observed on runs returned inside `get_plan`
    // entries where each run carries the parent entry's GUID (string, matching
    // `PlanEntrySchema.id`) and the run's index within that entry. Standalone runs
    // returned by `get_run` / `get_runs` omit both keys. `.nullish()` is the only
    // safe modelling.
    entry_id: z.string().nullish(),
    entry_index: z.number().nullish(),
});

export type Run = z.infer<typeof RunSchema>;

// ── Run write payloads ────────────────────────────────────────────────────────

export const AddRunPayloadSchema = zObject({
    name: z.string(),
    suite_id: z.number().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>;

export const UpdateRunPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>;
