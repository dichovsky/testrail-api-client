import { z } from 'zod';
import { zObject } from './common.js';
import { LabelEmbeddedSchema } from './metadata.js';

// ── Case Schema ───────────────────────────────────────────────────────────────

export const CaseSchema = zObject({
    id: z.number(),
    title: z.string(),
    section_id: z.number(),
    template_id: z.number().nullish(),
    type_id: z.number().nullish(),
    priority_id: z.number().nullish(),
    milestone_id: z.number().nullish(),
    refs: z.string().nullish(),
    created_by: z.number(),
    created_on: z.number(),
    updated_by: z.number(),
    updated_on: z.number(),
    estimate: z.string().nullish(),
    estimate_forecast: z.string().nullish(),
    suite_id: z.number(),
    display_order: z.number().nullish(),
    is_deleted: z.number().nullish(),
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // SPEC #2.1.3 — `labels` array uses the shared `LabelEmbeddedSchema` so the
    // same Label shape is enforced across `get_case` and `get_test` responses
    // and so a Label object can be carried between endpoints without re-casting.
    // See `LabelEmbeddedSchema` above for inner field choices.
    labels: z.array(LabelEmbeddedSchema).nullish(),
    // Live-instance audit (R-EXTRA): the server emits these on `get_case` /
    // `get_cases` / `add_case` / `update_case` responses but they were unmodeled
    // (carried as `unknown` via `.passthrough()`). Neither value shape was
    // captured on the wire, so both stay `z.unknown().nullish()` rather than a
    // speculative structure.
    refs_data: z.unknown().nullish(),
    ai_automated_test: z.unknown().nullish(),
});

export type Case = z.infer<typeof CaseSchema>;

// ── History Schemas ───────────────────────────────────────────────────────────

// Per-field delta inside a history entry's `changes[]`. All fields optional
// because TestRail emits different subsets per change type.
const HistoryChangeSchema = zObject({
    field: z.string().nullish(),
    type_id: z.number().nullish(),
    old_text: z.string().nullish(),
    new_text: z.string().nullish(),
    // SPEC #2.1.13 — added per the `get_history_for_case` field table:
    //   - `label` (string) is the field label as seen in the user interface.
    //   - `options` (array) carries field-config options (required, default value,
    //     etc.) — inner shape varies per field type, so the element type stays
    //     `z.unknown()` to accept whatever TestRail emits.
    //   - `old_value` / `new_value` are typed as a discriminated union of the
    //     value shapes the wire actually carries:
    //       * `string`   — text fields, refs ("1" in the doc example)
    //       * `number`   — integer fields (3573/3574 in the section_id example)
    //       * `boolean`  — boolean fields (type_id=3)
    //       * `array`    — separated-steps fields (type_id=8); element shape varies
    //       * `null`     — explicit-null emitted when previous/new is unset
    //     Plus `.nullish()` on the field itself so the key may be omitted
    //     entirely. The union gives consumers a switch-narrowable type instead of
    //     the bare `unknown` they'd get from `z.unknown()`.
    label: z.string().nullish(),
    options: z.array(z.unknown()).nullish(),
    old_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown())]).nullish(),
    new_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown())]).nullish(),
});

// Shared entry shape used by `get_history_for_case` and
// `get_shared_step_history`. The two endpoints emit slightly different
// timestamp keys (`timestamp` vs `created_on`); both are optional so the
// schema accepts either. `.passthrough()` (via zObject) preserves any
// endpoint-specific fields.
export const HistoryEntrySchema = zObject({
    id: z.number(),
    user_id: z.number(),
    type_id: z.number(),
    timestamp: z.number().nullish(),
    created_on: z.number().nullish(),
    changes: z.array(HistoryChangeSchema).nullish(),
    // Live-instance audit (R-EXTRA): `get_history_for_case` entries carry a
    // `comments` array (observed empty `[]`); element shape was never captured,
    // so the array element stays `z.unknown()`. `.nullish()` — the key may be
    // omitted entirely on some entries/representations.
    comments: z.array(z.unknown()).nullish(),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

// ── Case write payloads ───────────────────────────────────────────────────────

export const AddCasePayloadSchema = zObject({
    title: z.string(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>;

export const UpdateCasePayloadSchema = zObject({
    title: z.string().optional(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>;

// ── Bulk add cases (TestRail 7.5+) ────────────────────────────────────────────
// `POST add_cases/{section_id}` accepts a JSON array of case payloads — each
// item has the same shape as `AddCasePayloadSchema`. Distinct from the single
// `add_case/{section_id}` (object body) — the CLI exposes both as separate
// actions so the agent surface stays explicit about array-vs-object intent.
// Server-version gate: TestRail < 7.5 returns 400 "Invalid uri" or similar
// because the endpoint does not exist; the module rethrows that as a clearer
// "TestRail 7.5+ required" message. `z.array(...).min(1)` rejects empty arrays
// client-side since TestRail treats them as 400 — surface the contract at the
// CLI boundary instead of forcing a round-trip.
export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1);

export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>;

// ── Bulk case payloads ────────────────────────────────────────────────────────
// Inlined rather than `.extend(UpdateCasePayloadSchema)` so the passthrough()
// behavior is unambiguous and the inferred type stays a plain object literal
// (same precedent as AddResultForTestPayloadSchema). `case_ids` is required —
// the endpoint server-side rejects an empty body; surfacing that here lets
// agents see the contract failure at the CLI boundary.
export const UpdateCasesPayloadSchema = zObject({
    case_ids: z.array(z.number()),
    title: z.string().optional(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>;

// Body schema for bulk delete. We refine away a misplaced `soft` key on the
// body — TestRail toggles the soft-preview path via the `soft=1` *query*
// param, not a body field. The CLI surfaces this via `--soft`. Accepting a
// body-level `soft` would silently pass `.passthrough()` and could turn an
// intended preview into a hard delete (or vice versa) when callers paste
// example JSON that mixes the two. Surface the misuse early at the schema
// boundary so destructive intent stays unambiguous.
export const DeleteCasesPayloadSchema = zObject({
    case_ids: z.array(z.number()),
}).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), {
    message:
        '`soft` is not a body field — use the `--soft` CLI flag or the `options.soft` argument on `deleteCases()` to toggle the server-side preview.',
    path: ['soft'],
});

export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>;

// Shared shape returned by `delete_*?soft=1` endpoints (case / run / section /
// suite / cases). TestRail emits a subset of these counters depending on the
// target — e.g. `delete_case&soft=1` returns `{ affected_tests }`, while
// `delete_suite&soft=1` returns counts of sections, cases, runs, plans, and
// tests. Every numeric field stays optional and `.passthrough()` keeps
// unknown counters or future fields from being elided.
export const SoftDeletePreviewSchema = zObject({
    affected_tests: z.number().optional(),
    affected_cases: z.number().optional(),
    affected_sections: z.number().optional(),
    affected_runs: z.number().optional(),
    affected_milestones: z.number().optional(),
    affected_plans: z.number().optional(),
    affected_suites: z.number().optional(),
});

export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>;

// Identical shape to DeleteCasesPayloadSchema but intentionally a separate
// schema — a future TestRail change to either endpoint (e.g. delete adds a
// `force` flag) must not silently spread to the other.
export const CopyCasesToSectionPayloadSchema = zObject({
    case_ids: z.array(z.number()),
});

export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>;

// `suite_id` is required by TestRail when moving cases across suites and is
// harmless (ignored server-side) for same-suite moves. The Python reference
// client (`tolstislon/testrail-api`) treats it as required for the same
// reason. Path-only `section_id` is NOT in the body (TestRail's online docs
// have historically listed both — confirmed wrong against the live API and
// reference clients).
export const MoveCasesToSectionPayloadSchema = zObject({
    case_ids: z.array(z.number()),
    suite_id: z.number(),
});

export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>;
