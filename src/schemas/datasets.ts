import { z } from 'zod';
import { zObject } from './common.js';

// ── Dataset Schemas ───────────────────────────────────────────────────────────

/**
 * SPEC #2.1.16 — embedded variable/value entry inside a Dataset response.
 * Per the official TestRail "Datasets" API doc (support article
 * 7077300491540), `get_dataset` returns a `variables` array where each
 * entry has `id` (integer), `name` (string), and `value`. `id` and
 * `name` are documented as plain non-nullable scalars; `value` may be
 * null when the variable is unset/cleared on the server side, so it is
 * modelled as nullable per SPEC #2.1.16 review. `zObject()`'s passthrough
 * preserves any forward-compat keys.
 */
export const DatasetVariableSchema = zObject({
    id: z.number(),
    name: z.string(),
    value: z.string().nullable(),
});

export type DatasetVariable = z.infer<typeof DatasetVariableSchema>;

/**
 * SPEC #2.1.16 — verified against the official TestRail "Datasets" API
 * doc (support article 7077300491540) on 2026-05-23. Documented response
 * fields are `id`, `name`, and `variables[]`; `id` and `name` are
 * required scalars, `variables` is the array of `DatasetVariable`
 * entries. `variables` is modelled as `.nullish()` for defensive
 * back-compat — TestRail's `add_dataset` example also shows the same
 * shape but older API revisions or edge cases (e.g. an empty dataset
 * mid-creation) may omit the key. Any forward-compat keys the server
 * might add (e.g. `project_id`, `created_on`, `created_by`) survive at
 * runtime via `zObject()`'s passthrough; they are intentionally not
 * declared here until the upstream doc lists them (SPEC #1.5).
 */
export const DatasetSchema = zObject({
    id: z.number(),
    name: z.string(),
    variables: z.array(DatasetVariableSchema).nullish(),
});

export type Dataset = z.infer<typeof DatasetSchema>;

export const AddDatasetPayloadSchema = zObject({
    name: z.string(),
});

export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>;

/**
 * `update_dataset` accepts a partial body (rename-only at the moment).
 * Mirrors the `UpdateVariablePayloadSchema` precedent — empty `{}` body
 * is intentionally allowed and forwarded to TestRail, which treats it
 * as a no-op. `custom_*` extras flow through `zObject()`'s passthrough.
 */
export const UpdateDatasetPayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>;
