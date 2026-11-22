import { z } from 'zod';
import { zObject } from './common.js';

// ── Result Schema ─────────────────────────────────────────────────────────────

/**
 * SPEC #A.1 — canonical exemplar for **response** schemas.
 *
 * See `CLAUDE.md (Schema authoring conventions)` (§1 naming, §2 nullability). All optional
 * fields use `.nullish()`, because TestRail can return `null` or omit the key.
 * A response `.optional()` would fail to parse `{ field: null }`.
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
     * @deprecated TestRail returns response custom fields as flat
     * `custom_*` properties. The schema keeps this field for compatibility
     * with older servers and proxies that still return a nested container.
     */
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // Observed response fields on `get_results_for_run` elements that were
    // previously unmodeled. `case_id` is a numeric id; `quality_rating` was
    // observed as a numeric rating, while the Result Fields reference (TestRail
    // 10.3+) documents an object of per-dimension scores, e.g.
    // `{ factual_accuracy: 4, relevance: 5 }` — no wire capture of the object
    // form on a read exists, so both are accepted. `defects_data` and the
    // element shape of `attachment_ids` were not captured on the wire —
    // `defects_data` stays `z.unknown()` and `attachment_ids` is typed only as
    // an array of `unknown`. All `.nullish()`.
    case_id: z.number().nullish(),
    quality_rating: z.union([z.number(), z.record(z.string(), z.unknown())]).nullish(),
    defects_data: z.unknown().nullish(),
    attachment_ids: z.array(z.unknown()).nullish(),
    // TestRail 10.5+: source-case metadata included on result responses.
    case_title: z.string().nullish(),
    case_refs: z.string().nullish(),
});

// ── Result write payloads ─────────────────────────────────────────────────────

// A new result needs at least one of a status, a comment or an assignee — not
// necessarily a status. TestRail API reference, "Results"
// (https://support.testrail.com/hc/en-us/articles/7077819312404-Results):
// add_result "adds a new test result, comment or assigns a test";
// add_results / add_results_for_cases: "you need to specify at least one of the
// status, comment or assignee fields for each result"; add_result_for_case
// "supports the same POST fields as add_result". Shared by all three add
// payloads (and through them the two bulk wrappers). A field counts as given
// when its value is not `undefined`.
const RESULT_CONTENT_MESSAGE = 'At least one of status_id, comment or assignedto_id is required';

function hasResultContent(result: {
    readonly status_id?: unknown;
    readonly comment?: unknown;
    readonly assignedto_id?: unknown;
}): boolean {
    return result.status_id !== undefined || result.comment !== undefined || result.assignedto_id !== undefined;
}

/**
 * SPEC #A.1 — canonical exemplar for **request** payload schemas.
 *
 * See `CLAUDE.md (Schema authoring conventions)` (§1 naming, §2 nullability). Caller-omitted
 * fields use `.optional()` (= `T | undefined`), NOT `.nullish()`. A request
 * `.nullish()` would widen the input type with `null` for no reason. Callers
 * omit the key, and do not send `null`. This schema is the request mirror of
 * the response-side `ResultSchema`. The optionality of `status_id`,
 * `comment`, `defects`, and `assignedto_id` changes accordingly.
 *
 * The at-least-one rule is a `.refine()`. In Zod 4, a `.refine()` keeps a
 * `ZodObject` (`.shape` readable, nests in `z.array()`) and a plain inferred
 * type with all fields optional. Thus, the schema validates the rule at parse
 * time (CLI `--data`). The type does not encode the rule.
 */
export const AddResultPayloadSchema = zObject({
    status_id: z.number().optional(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
}).refine(hasResultContent, { message: RESULT_CONTENT_MESSAGE });

export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>;

/**
 * The partial payload that `edit_result/{result_id}` accepts (TestRail 10.4+).
 * Each standard result field is optional, because the endpoint changes only
 * the fields that the caller supplies. Flat `custom_*` fields pass through
 * `zObject`. The schema declares the built-in separated-step field explicitly,
 * so that its replacement-array contract is visible to TypeScript consumers.
 */
export const EditResultPayloadSchema = zObject({
    status_id: z.number().optional(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_step_results: z.array(z.record(z.string(), z.unknown())).optional(),
}).refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'At least one result field is required',
});

export type EditResultPayload = z.infer<typeof EditResultPayloadSchema>;

// SPEC #A.1 — see CLAUDE.md (Schema authoring conventions) §3 (no .extend() across directions)
// Inlined rather than `.extend(AddResultPayloadSchema)` so the passthrough()
// behavior is unambiguous and the inferred type stays a plain object literal.
export const AddResultForCasePayloadSchema = zObject({
    case_id: z.number(),
    status_id: z.number().optional(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
}).refine(hasResultContent, { message: RESULT_CONTENT_MESSAGE });

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
    status_id: z.number().optional(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
}).refine(hasResultContent, { message: RESULT_CONTENT_MESSAGE });

export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>;

export const AddResultsPayloadSchema = zObject({
    results: z.array(AddResultForTestPayloadSchema),
});

export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>;
