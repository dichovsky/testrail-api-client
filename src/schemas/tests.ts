import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';
import { LabelEmbeddedSchema } from './metadata.js';
import { ResultSchema } from './results.js';
import { AttachmentSchema } from './attachments.js';

// ── Test Schema ───────────────────────────────────────────────────────────────

export const TestSchema = zObject({
    id: z.number(),
    case_id: z.number(),
    status_id: z.number(),
    assignedto_id: z.number().nullish(),
    run_id: z.number(),
    title: z.string(),
    template_id: z.number().nullish(),
    type_id: z.number().nullish(),
    priority_id: z.number().nullish(),
    estimate: z.string().nullish(),
    estimate_forecast: z.string().nullish(),
    refs: z.string().nullish(),
    milestone_id: z.number().nullish(),
    /**
     * @deprecated TestRail response custom fields are emitted as flat
     * `custom_*` properties. Retained for compatibility with older servers
     * and proxies that still return a nested container.
     */
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // SPEC #2.1.7 — `labels` array uses the shared `LabelEmbeddedSchema` so the
    // same Label shape is enforced across `get_test` and `get_case` responses
    // and so a Label object can be carried between endpoints without re-casting.
    // See `LabelEmbeddedSchema` for inner field choices.
    labels: z.array(LabelEmbeddedSchema).nullish(),
    // Live-instance audit (R-EXTRA): the server emits these on `get_test` /
    // `get_tests` responses but they were unmodeled (carried as `unknown` via
    // `.passthrough()`). No value shape was captured for any of them, so each
    // stays `z.unknown().nullish()` rather than a speculative type.
    sections_display_order: z.unknown().nullish(),
    cases_display_order: z.unknown().nullish(),
    refs_data: z.unknown().nullish(),
    case_comments: z.unknown().nullish(),
    ai_automated_test: z.unknown().nullish(),
    // TestRail 10.5+: the source case title is included on test responses.
    case_title: z.string().nullish(),
});

export type Test = KnownResponse<typeof TestSchema>;

/** Wire wrapper returned by `get_test/{test_id}&with_data=1`. */
export const TestWithDataResponseSchema = zObject({
    test: TestSchema,
    results: z
        .array(ResultSchema)
        .nullish()
        .transform((items) => items ?? []),
    attachments: z
        .array(AttachmentSchema)
        .nullish()
        .transform((items) => items ?? []),
});

export type TestWithDataResponse = z.infer<typeof TestWithDataResponseSchema>;

// ── Test label-write payloads (TestRail Labels API, 2025) ─────────────────────
// `update_test/{test_id}` and `update_tests` are label-only mutations on a test
// (NOT general test updates — unlike `update_case`). The `labels` array accepts
// a mix of existing-label numeric IDs and string titles, per the TestRail
// Labels/Tests API docs ("a mix of label titles and numeric label IDs"). The
// element union is intentionally permissive — TestRail is the source of truth
// on which titles resolve to which IDs, so we surface its 400 rather than
// over-validating. zObject()'s passthrough preserves forward-compat fields
// should TestRail later widen these endpoints beyond labels.

export const UpdateTestLabelsPayloadSchema = zObject({
    labels: z.array(z.union([z.number(), z.string()])),
});

export type UpdateTestLabelsPayload = z.infer<typeof UpdateTestLabelsPayloadSchema>;

// Bulk variant: `update_tests` has NO path param — the target tests are named
// in the body via `test_ids`, applying the SAME `labels` to every test (the
// endpoint cannot set different labels per test). `test_ids` is required;
// TestRail rejects an empty body, and the module validates each ID before the
// network call.
export const UpdateTestsLabelsPayloadSchema = zObject({
    test_ids: z.array(z.number()),
    labels: z.array(z.union([z.number(), z.string()])),
});

export type UpdateTestsLabelsPayload = z.infer<typeof UpdateTestsLabelsPayloadSchema>;

/**
 * `update_tests` acknowledges the bulk label assignment; it does **not** return
 * the updated tests. TestRail's documented example is
 * `{ "test_ids": [1, 2, 3], "labels": [{ "id": 1, "title": "label1" }] }` — the
 * page's boilerplate status line ("the tests are returned as part of the
 * response") is copy-pasted across every endpoint and contradicts the example
 * beneath it.
 *
 * Modelling this as a test list was a guess made while the docs were
 * unreachable, and it failed in the worst direction: the acknowledgement has no
 * `tests` key, so every successful call resolved `[]`.
 */
export const UpdateTestsResponseSchema = zObject({
    test_ids: z.array(z.number()),
    labels: z.array(LabelEmbeddedSchema),
});

export type UpdateTestsResponse = KnownResponse<typeof UpdateTestsResponseSchema>;
