import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Variable Schemas ──────────────────────────────────────────────────────────

/**
 * SPEC #2.1.16 — verified against the official TestRail "Variables" API
 * doc (support article 7077979742868) on 2026-05-23. The documented
 * Variable response object has exactly two fields, both required and
 * non-nullable: `id: integer` and `name: string`. The schema adds no
 * back-compat `.nullish()` to either field. TestRail has emitted this shape
 * since the introduction of the endpoint, and the doc shows no version
 * gating.
 *
 * The `zObject()` passthrough still keeps any forward-compat keys that
 * TestRail can add. The `getVariables()` module method, not the schema,
 * handles the doc-level `get_variables` pagination envelope (`offset` /
 * `limit` / `size` / `_links` / `variables[]`). The method unwraps the
 * envelope before it parses the entries.
 */
export const VariableSchema = zObject({
    id: z.number(),
    name: z.string(),
});

export type Variable = KnownResponse<typeof VariableSchema>;

export const AddVariablePayloadSchema = zObject({
    name: z.string(),
});

export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>;

/**
 * `update_variable` accepts an empty body as a no-op: all fields are
 * optional. The client intentionally does NOT apply an "at least one field
 * set" rule. TestRail itself accepts `{}` and returns the variable with no
 * change. This schema follows the `UpdateSectionPayloadSchema` precedent
 * below, which also passes through empty-body updates. `custom_*` extras
 * flow through `zObject()`'s passthrough.
 */
export const UpdateVariablePayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>;
