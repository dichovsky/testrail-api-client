import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Result Schema ─────────────────────────────────────────────────────────────

/**
 * SPEC #A.1 — canonical exemplar for **response** schemas.
 *
 * See `CLAUDE.md (Schema authoring conventions)` (§1 naming, §2 nullability). All optional
 * fields use `.nullish()` because TestRail may return `null` or omit the key,
 * and a response `.optional()` would fail to parse `{ field: null }`.
 */
export const ResultSchema = zObject({
    id: z.number(),
    test_id: z.number(),
    // TestRail persists **comment-only** results — a comment, defect, or
    // assignment recorded without a status change (the UI's "Add Comment"
    // action) — and returns `status_id: null` for them. Under fail-closed
    // page-level validation, one such row invalidated the entire result page.
    //
    // `.nullable()` rather than `.nullish()`: the reported wire evidence is that
    // the key is always *present* and only its value can be null. Modelling that
    // exactly keeps `status_id` a required `number | null` property — callers
    // still get a compile error if they forget the null case — and leaves an
    // omitted key detectable as drift rather than silently absorbed.
    status_id: z.number().nullable(),
    comment: z.string().nullish(),
    version: z.string().nullish(),
    elapsed: z.string().nullish(),
    defects: z.string().nullish(),
    assignedto_id: z.number().nullish(),
    created_by: z.number().nullish(),
    created_on: z.number().nullish(),
    /**
     * @deprecated TestRail response custom fields are emitted as flat
     * `custom_*` properties. Retained for compatibility with older servers
     * and proxies that still return a nested container.
     */
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // Observed response fields on `get_results_for_run` elements that were
    // previously unmodeled. `case_id` is a numeric id; `quality_rating` a numeric
    // rating. `defects_data` and the element shape of `attachment_ids` were not
    // captured on the wire — `defects_data` stays `z.unknown()` and
    // `attachment_ids` is typed only as an array of `unknown`. All `.nullish()`.
    case_id: z.number().nullish(),
    quality_rating: z.number().nullish(),
    defects_data: z.unknown().nullish(),
    attachment_ids: z.array(z.unknown()).nullish(),
    // TestRail 10.5+: source-case metadata included on result responses.
    case_title: z.string().nullish(),
    case_refs: z.string().nullish(),
});

export type Result = KnownResponse<typeof ResultSchema>;

// ── Result write payloads ─────────────────────────────────────────────────────

/**
 * SPEC #A.1 — canonical exemplar for **request** payload schemas.
 *
 * See `CLAUDE.md (Schema authoring conventions)` (§1 naming, §2 nullability). Caller-omitted
 * fields use `.optional()` (= `T | undefined`), NOT `.nullish()`: a request
 * `.nullish()` would widen the input type with `null` for no reason — callers
 * omit the key instead of sending `null`. Mirror of the response-side
 * `ResultSchema` with optionality flipped accordingly on `comment`, `defects`,
 * and `assignedto_id`.
 */
export const AddResultPayloadSchema = zObject({
    // OPEN QUESTION (unverified): `status_id` is required here, so this client
    // cannot create the comment-only results it can now read. The available API
    // documentation does not establish whether omitting `status_id` is accepted;
    // such rows could also originate from a bulk operation or internal state
    // change. Keep the requirement until authoritative documentation or a
    // synthetic integration test confirms the write contract; request schemas
    // guard a real trust boundary (CLI `--data` is untrusted input).
    status_id: z.number(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>;

/**
 * Partial payload accepted by `edit_result/{result_id}` (TestRail 10.4+).
 * Every standard result field is optional because the endpoint changes only
 * the fields supplied by the caller. Flat `custom_*` fields pass through via
 * `zObject`; the built-in separated-step field is declared explicitly so its
 * replacement-array contract is visible to TypeScript consumers.
 */
export const EditResultPayloadSchema = zObject({
    status_id: z.number().optional(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_step_results: z.array(z.record(z.string(), z.unknown())).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one result field is required',
});

export type EditResultPayload = z.infer<typeof EditResultPayloadSchema>;

// SPEC #A.1 — see CLAUDE.md (Schema authoring conventions) §3 (no .extend() across directions)
// Inlined rather than `.extend(AddResultPayloadSchema)` so the passthrough()
// behavior is unambiguous and the inferred type stays a plain object literal.
export const AddResultForCasePayloadSchema = zObject({
    case_id: z.number(),
    status_id: z.number(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>;

export const AddResultsForCasesPayloadSchema = zObject({
    results: z.array(AddResultForCasePayloadSchema),
});

export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>;

// SPEC #A.1 — see CLAUDE.md (Schema authoring conventions) §3 (no .extend() across directions)
// Same precedent as AddResultForCasePayloadSchema: inlined rather than
// `.extend(AddResultPayloadSchema)` so the passthrough() behavior is
// unambiguous and the inferred type stays a plain object literal.
export const AddResultForTestPayloadSchema = zObject({
    test_id: z.number(),
    status_id: z.number(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>;

export const AddResultsPayloadSchema = zObject({
    results: z.array(AddResultForTestPayloadSchema),
});

export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>;
