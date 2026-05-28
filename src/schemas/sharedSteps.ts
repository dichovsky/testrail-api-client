import { z } from 'zod';
import { zObject } from './common.js';

// ── Shared Steps Schema ───────────────────────────────────────────────────────

/**
 * SPEC #2.1.15 — verified against the official Shared Steps API doc
 * (TestRail Support article 7077919815572). Endpoint requires TestRail 7.0+.
 *
 * Field-by-field reconciliation with the doc's `get_shared_step` response
 * field table:
 *
 *   id, title                                      — required; never null/absent
 *   project_id, case_ids, created_by, created_on,
 *   updated_by, updated_on, custom_steps_separated — listed in the field table
 *
 * The doc additionally specifies `get_shared_steps` (list-form) returning
 * truncated entries containing only `{ id, title }` (see the doc's list-response
 * example). Every field beyond `id`/`title` is therefore modelled as `.nullish()`
 * to accept both shapes from a single schema:
 *
 *   - present-and-valued: the `get_shared_step` full-form response
 *   - absent: the `get_shared_steps` truncated list-form
 *   - present-as-null: tolerated as a defensive widening (no doc example shows
 *     a top-level null, but matches the project-wide policy from PR #130
 *     "Accept nullable TestRail response fields with nullish schemas")
 *
 * Step entries (`custom_steps_separated[]`) are typed as a free-form
 * `z.record(string, unknown)` because the doc's `custom_steps_separated` field
 * note explicitly warns that the field's system name can be renamed by an
 * admin if it has ever been removed and recreated, and because the doc's
 * step-entry table allows `additional_info` and `refs` to come back as
 * literal `null` in the example payload — `z.unknown()` per-key absorbs
 * both nulls and any future per-tenant rename of step sub-fields.
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

export type SharedStep = z.infer<typeof SharedStepSchema>;

// ── Shared-step write payloads (TestRail 7.0+) ────────────────────────────────
// `custom_steps_separated` is intentionally typed as `z.array(z.record(z.string(), z.unknown()))`
// rather than a structured step schema — the step shape varies by TestRail
// template configuration (separated, additional info, expected result, etc.)
// and there's no project-time visibility into which keys are present. The
// `.passthrough()` from `zObject` also lets future `custom_*` keys survive
// round-trip (matches the AddCase / AddRun precedent).

/**
 * SPEC #2.1.15 — verified against the `add_shared_step` request-body field
 * table (Support article 7077919815572): only `title` is `required=true`;
 * `custom_steps_separated` is `required=false`. The doc's request example
 * also shows step entries with a subset of fields (just `content`), which
 * the `z.record(string, unknown())` per-step shape accepts.
 */
export const AddSharedStepPayloadSchema = zObject({
    title: z.string(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>;

/**
 * Update payload for `update_shared_step`. Every field is optional — TestRail
 * accepts an empty object (`{}`) as a no-op update, so the CLI's
 * `shared-step update <id> --data '{}'` is intentionally a valid call. This
 * mirrors `UpdateMilestonePayloadSchema` and `UpdateCasePayloadSchema`: empty
 * bodies are accepted at the schema layer; rejecting them is the API's
 * responsibility, not the client's. Callers that want to enforce
 * "non-empty update" must do so above this schema.
 */
export const UpdateSharedStepPayloadSchema = zObject({
    title: z.string().optional(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>;
