import { z } from 'zod';
import { zObject } from './common.js';

// ── Variable Schemas ──────────────────────────────────────────────────────────

/**
 * SPEC #2.1.16 — verified against the official TestRail "Variables" API
 * doc (support article 7077979742868) on 2026-05-23. The documented
 * Variable response object has exactly two fields, both required and
 * non-nullable: `id: integer` and `name: string`. No back-compat
 * `.nullish()` is added on either field — TestRail has emitted this
 * shape since the endpoint was introduced and the doc shows no version
 * gating. `zObject()`'s passthrough still preserves any forward-compat
 * keys TestRail may add. The doc-level `get_variables` pagination
 * envelope (`offset` / `limit` / `size` / `_links` / `variables[]`) is
 * handled outside the schema by the `getVariables()` module method,
 * which unwraps the envelope before parsing.
 */
export const VariableSchema = zObject({
    id: z.number(),
    name: z.string(),
});

export type Variable = z.infer<typeof VariableSchema>;

export const AddVariablePayloadSchema = zObject({
    name: z.string(),
});

export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>;

/**
 * `update_variable` accepts an empty body as a no-op: every field is
 * optional. We intentionally do NOT enforce "at least one field set"
 * client-side — TestRail itself accepts `{}` and returns the unchanged
 * variable. Mirrors the `UpdateSectionPayloadSchema` precedent below,
 * where empty-body updates are also passed through. `custom_*` extras
 * flow through `zObject()`'s passthrough.
 */
export const UpdateVariablePayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>;
