import { z } from 'zod';
import { zObject } from './common.js';
import { RunSchema } from './runs.js';

// ── Plan Entry & Plan Schemas ─────────────────────────────────────────────────

export const PlanEntrySchema = zObject({
    id: z.string(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    assignedto_id: z.number().nullish(),
    include_all: z.boolean(),
    case_ids: z.array(z.number()).nullish(),
    config_ids: z.array(z.number()).nullish(),
    runs: z.array(RunSchema),
    // SPEC #2.1.6 — TestRail Plans API doc lists `start_on` / `due_on` / `refs` in the
    // `add_plan_entry` request body table (entry-level), and the `get_plan` example
    // shows `refs` in the entry object. `start_on` / `due_on` echo back on responses
    // when set. `.nullish()` per field: inferred type is `T | null | undefined`
    // (omitted vs explicit null vs typed value).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    refs: z.string().nullish(),
});

export type PlanEntry = z.infer<typeof PlanEntrySchema>;

export const PlanSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    milestone_id: z.number().nullish(),
    assignedto_id: z.number().nullish(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
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
    created_on: z.number(),
    created_by: z.number(),
    url: z.string(),
    // Live-instance audit (R-EXTRA): observed on `get_plan` / `get_plans` but
    // unmodeled. `is_archived` was a boolean; `archived_on` was `null` (epoch
    // when set, by analogy to `completed_on`). Both `.nullish()`.
    is_archived: z.boolean().nullish(),
    archived_on: z.number().nullish(),
    entries: z.array(PlanEntrySchema).nullish(),
    // SPEC #2.1.6 — Per the `get_plan` response-field table: `start_on` / `due_on`
    // are documented as timestamps (ungated); `refs` is "a string of external
    // requirement IDs, separated by commas - requires TestRail 6.3 or later".
    // Note: the doc's get_plan response *example* uses the non-canonical key
    // `due_date` (an upstream doc inconsistency); the field table is authoritative
    // and uses `due_on`, matching the `add_plan` request body. `.nullish()` per
    // field — inferred type is `T | null | undefined` (omitted vs explicit null
    // vs typed value).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    refs: z.string().nullish(),
});

export type Plan = z.infer<typeof PlanSchema>;

// ── Plan write payloads ───────────────────────────────────────────────────────
// Plans nest entries, and entries nest runs. The run shape inside a plan entry
// is intentionally looser than AddRunPayloadSchema: TestRail derives the run
// name from the config when nested, so `name` (and every other field) is
// optional here. Using a separate schema avoids loosening the standalone
// `run add` contract.

export const PlanEntryRunPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>;

// Payload for POST add_run_to_plan_entry/{plan_id}/{entry_id}. `config_ids` is
// required: an entry-level run is created for a specific config combination.
// `name` is intentionally absent — TestRail derives the run name from the
// config. Distinct from `PlanEntryRunPayloadSchema` (used for nested entries
// where every field is optional).
export const AddRunToPlanEntryPayloadSchema = zObject({
    config_ids: z.array(z.number()),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>;

// Payload for POST update_run_in_plan_entry/{run_id}. The endpoint only accepts
// `description`, `assignedto_id`, `include_all`, and `case_ids`. `config_ids`,
// `name`, and `refs` are silently dropped, so we omit them client-side.
export const UpdateRunInPlanEntryPayloadSchema = zObject({
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
});

export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>;

export const AddPlanEntryPayloadSchema = zObject({
    suite_id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    runs: z.array(PlanEntryRunPayloadSchema).optional(),
    // SPEC #2.1.6 — request-side counterparts of the response fields added to
    // `PlanEntrySchema`. The TestRail Plans API doc's `add_plan_entry` request
    // body table lists `start_on` (timestamp, false), `due_on` (timestamp, false),
    // and `refs` (string, false) as valid request fields. These must be declared
    // here so they appear in `z.infer<typeof AddPlanEntryPayloadSchema>`, giving
    // consumers a statically-typed path to set them; without explicit declarations
    // the inferred `AddPlanEntryPayload` type would omit these keys even though
    // `zObject` is `passthrough()` and would forward unknown keys at runtime.
    // Declaration also enables validation (e.g., rejecting `start_on: 'string'`).
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    refs: z.string().optional(),
});

export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>;

export const UpdatePlanEntryPayloadSchema = zObject({
    suite_id: z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    runs: z.array(PlanEntryRunPayloadSchema).optional(),
    // SPEC #2.1.6 — TestRail Plans API doc's `update_plan_entry` request body
    // table independently lists `start_on` (timestamp, false), `due_on`
    // (timestamp, false), and `refs` (string, false — "requires TestRail 6.3 or
    // later"). Same typing rationale as `AddPlanEntryPayloadSchema` above:
    // declared so consumers get a statically-typed surface, and so wrong-typed
    // values are rejected at parse time.
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    refs: z.string().optional(),
});

export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>;

export const AddPlanPayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    // SPEC #2.1.6 — TestRail Plans API doc's `add_plan` request body table lists
    // `start_on` (timestamp, false) and `due_on` (timestamp, false). `refs` is NOT
    // in the request body table for `add_plan` (only in the response field table),
    // so it is intentionally omitted here.
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    entries: z.array(AddPlanEntryPayloadSchema).optional(),
});

export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>;

export const UpdatePlanPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    // SPEC #2.1.6 — TestRail Plans API doc says `update_plan` "supports the same
    // POST fields as `add_plan`" (with the exception of `entries`). That makes
    // `start_on` / `due_on` valid here. `refs` is intentionally omitted to mirror
    // `AddPlanPayloadSchema` (not in the `add_plan` request body table).
    start_on: z.number().optional(),
    due_on: z.number().optional(),
});

export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>;
