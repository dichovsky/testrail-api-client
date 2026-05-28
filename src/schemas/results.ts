import { z } from 'zod';
import { zObject } from './common.js';

// ── Result Schema ─────────────────────────────────────────────────────────────

/**
 * SPEC #A.1 — canonical exemplar for **response** schemas.
 *
 * See `docs/SCHEMA-CONVENTIONS.md` (§1 naming, §2 nullability). All optional
 * fields use `.nullish()` because TestRail may return `null` or omit the key,
 * and a response `.optional()` would fail to parse `{ field: null }`.
 */
export const ResultSchema = zObject({
    id: z.number(),
    test_id: z.number(),
    status_id: z.number(),
    comment: z.string().nullish(),
    version: z.string().nullish(),
    elapsed: z.string().nullish(),
    defects: z.string().nullish(),
    assignedto_id: z.number().nullish(),
    created_by: z.number().nullish(),
    created_on: z.number().nullish(),
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
});

export type Result = z.infer<typeof ResultSchema>;

// ── Result write payloads ─────────────────────────────────────────────────────

/**
 * SPEC #A.1 — canonical exemplar for **request** payload schemas.
 *
 * See `docs/SCHEMA-CONVENTIONS.md` (§1 naming, §2 nullability). Caller-omitted
 * fields use `.optional()` (= `T | undefined`), NOT `.nullish()`: a request
 * `.nullish()` would widen the input type with `null` for no reason — callers
 * omit the key instead of sending `null`. Mirror of the response-side
 * `ResultSchema` with optionality flipped accordingly on `comment`, `defects`,
 * and `assignedto_id`.
 */
export const AddResultPayloadSchema = zObject({
    status_id: z.number(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>;

// SPEC #A.1 — see docs/SCHEMA-CONVENTIONS.md §3 (no .extend() across directions)
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

// SPEC #A.1 — see docs/SCHEMA-CONVENTIONS.md §3 (no .extend() across directions)
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
