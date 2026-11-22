import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Shared Steps Schema ───────────────────────────────────────────────────────

/**
 * SPEC #2.1.15 — verified against the official Shared Steps API doc
 * (TestRail Support article 7077919815572). The endpoint requires TestRail 7.0+.
 *
 * Field-by-field reconciliation with the doc's `get_shared_step` response
 * field table:
 *
 *   id, title                                      — required; never null/absent
 *   project_id, case_ids, created_by, created_on,
 *   updated_by, updated_on, custom_steps_separated — listed in the field table
 *
 * The doc also specifies that `get_shared_steps` (list-form) returns truncated
 * entries that contain only `{ id, title }` (see the list-response example of
 * the doc). Thus, the schema models each field other than `id`/`title` as
 * `.nullish()`, so that a single schema accepts both shapes:
 *
 *   - present-and-valued: the `get_shared_step` full-form response
 *   - absent: the `get_shared_steps` truncated list-form
 *   - present-as-null: accepted as a defensive widening. No doc example shows
 *     a top-level null. But this widening matches the project-wide policy from
 *     PR #130 "Accept nullable TestRail response fields with nullish schemas".
 *
 * The schema types step entries (`custom_steps_separated[]`) as a free-form
 * `z.record(string, unknown)`, for two reasons:
 *
 *   - The `custom_steps_separated` field note in the doc explicitly warns that
 *     an admin can rename the system name of the field, if the field was ever
 *     removed and created again.
 *   - The step-entry table in the doc lets `additional_info` and `refs` be
 *     literal `null` in the example payload.
 *
 * The per-key `z.unknown()` accepts both nulls and any future per-tenant
 * rename of step sub-fields.
 */
export const SharedStepSchema = zObject({
    id: z.number(),
    title: z.string(),
    project_id: z.number().nullish(),
    case_ids: z.array(z.number()).nullish(),
    created_on: z.number().nullish(),
    created_by: z.number().nullish(),
    updated_on: z.number().nullish(),
    updated_by: z.number().nullish(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).nullish(),
});

export type SharedStep = KnownResponse<typeof SharedStepSchema>;

// ── Shared-step write payloads (TestRail 7.0+) ────────────────────────────────
// `custom_steps_separated` is intentionally typed as `z.array(z.record(z.string(), z.unknown()))`
// rather than a structured step schema — the step shape varies by TestRail
// template configuration (separated, additional info, expected result, etc.)
// and there's no project-time visibility into which keys are present. The
// `.passthrough()` from `zObject` also lets future `custom_*` keys survive
// round-trip (matches the AddCase / AddRun precedent).

/**
 * SPEC #2.1.15 — verified against the `add_shared_step` request-body field
 * table (Support article 7077919815572): only `title` is `required=true`.
 * `custom_steps_separated` is `required=false`. The request example of the doc
 * also shows step entries with a subset of fields (only `content`). The
 * `z.record(string, unknown())` per-step shape accepts these entries.
 */
export const AddSharedStepPayloadSchema = zObject({
    title: z.string(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>;

/**
 * The update payload for `update_shared_step`. All fields are optional.
 * TestRail accepts an empty object (`{}`) as a no-op update. Thus, the CLI
 * command `shared-step update <id> --data '{}'` is intentionally a valid
 * command.
 *
 * This behavior is the same as in `UpdateMilestonePayloadSchema` and
 * `UpdateCasePayloadSchema`: the schema layer accepts empty bodies. The API,
 * not the client, is responsible for the rejection of empty bodies. Callers
 * that want to apply a "non-empty update" rule must do so above this schema.
 */
export const UpdateSharedStepPayloadSchema = zObject({
    title: z.string().optional(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>;

/**
 * SPEC #1.7 — `get_shared_step_history/{shared_step_id}` returns entries in
 * `step_history` (NOT `history`). Live-instance audit correction: TestRail Cloud
 * returns `id` and `user_id` as INTEGERS (for example 23, 40), but the doc
 * field table gives string. A bare `z.string()` on `id` rejected the real
 * response. The schema accepts BOTH forms (a union, like
 * `AttachmentSchema.data_id` / `entity_id` and `UserSchema.mfa_required`).
 * Thus, neither the integers from Cloud nor the strings from a doc-compliant
 * self-hosted server throw. All other fields are `.nullish()`-widened.
 */
export const StepHistoryEntrySchema = zObject({
    id: z.union([z.number(), z.string()]),
    title: z.string().nullish(),
    timestamp: z.number().nullish(),
    user_id: z.union([z.number(), z.string()]).nullish(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).nullish(),
});

export type StepHistoryEntry = KnownResponse<typeof StepHistoryEntrySchema>;
