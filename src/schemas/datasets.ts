import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Dataset Schemas ───────────────────────────────────────────────────────────

/**
 * SPEC #2.1.16 — an embedded variable/value entry in a Dataset response.
 *
 * In the official TestRail "Datasets" API doc (support article
 * 7077300491540), `get_dataset` returns a `variables` array. Each entry has
 * `id` (integer), `name` (string), and `value`. The doc gives `id` and
 * `name` as plain non-nullable scalars. `value` can be null when the variable
 * is unset or cleared on the server side. Thus, the schema models `value` as
 * nullable, per the SPEC #2.1.16 review. The `zObject()` passthrough keeps
 * any forward-compat keys.
 */
export const DatasetVariableSchema = zObject({
    id: z.number(),
    name: z.string(),
    value: z.string().nullable(),
});

export type DatasetVariable = KnownResponse<typeof DatasetVariableSchema>;

/**
 * SPEC #2.1.16 — verified against the official TestRail "Datasets" API
 * doc (support article 7077300491540) on 2026-05-23. The documented response
 * fields are `id`, `name`, and `variables[]`. `id` and `name` are required
 * scalars. `variables` is the array of `DatasetVariable` entries.
 *
 * The schema models `variables` as `.nullish()` for defensive back-compat.
 * The TestRail `add_dataset` example also shows the same shape. But in older
 * API revisions or edge cases (for example, an empty dataset mid-creation),
 * the key can be missing.
 *
 * At runtime, the `zObject()` passthrough keeps any forward-compat keys that
 * the server can add (for example `project_id`, `created_on`, `created_by`).
 * The schema intentionally does not declare these keys until the upstream doc
 * lists them (SPEC #1.5).
 *
 * The list endpoint `get_datasets` wraps these objects in the standard
 * bulk-API pagination envelope (`offset` / `limit` / `size` / `_links` /
 * `datasets[]`). The `getDatasets()` module method unwraps the envelope
 * before it parses the entries. Thus, `DatasetSchema` only models a single
 * dataset object.
 */
export const DatasetSchema = zObject({
    id: z.number(),
    name: z.string(),
    variables: z.array(DatasetVariableSchema).nullish(),
});

export type Dataset = KnownResponse<typeof DatasetSchema>;

/**
 * Write payloads identify dataset variables by their variable name, and
 * contain the selected value directly. This payload shape is intentionally
 * different from the response `variables[]` projection above, whose entries
 * include server-assigned IDs.
 */
const DatasetVariablesPayloadSchema = z.record(z.string(), z.string());

export const AddDatasetPayloadSchema = zObject({
    name: z.string(),
    variables: DatasetVariablesPayloadSchema.optional(),
});

export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>;

/**
 * `update_dataset` accepts a partial body. Callers may rename the dataset,
 * replace its variable-value map, or do both. The schema intentionally allows
 * an empty `{}`, and the client forwards it to TestRail, which treats it as a
 * no-op. `custom_*` extras flow through `zObject()`'s passthrough.
 */
export const UpdateDatasetPayloadSchema = zObject({
    name: z.string().optional(),
    variables: DatasetVariablesPayloadSchema.optional(),
});

export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>;
