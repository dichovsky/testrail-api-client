import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Label Schemas (stand-alone TestRail Labels API) ───────────────────────────

/**
 * `LabelSchema` — the canonical stand-alone label entity that the Labels API
 * returns (`get_label`, `get_labels`, `add_label`, `update_label`). This schema
 * is different from `LabelEmbeddedSchema`, which is the label shape nested in
 * `get_case` / `get_test` responses. Today, the two schemas are structurally
 * almost identical. They are intentionally separate, because the stand-alone
 * endpoint can change independently of the embedded form. See
 * schema-conventions §1 (`XSchema` is the canonical GET entity) and §4 (keep
 * sub-schemas separate).
 *
 * Naming divergence (verified against the TestRail Labels API doc, support
 * article 38961149782036, captured 2026-06-07):
 *   - `get_label` emits `name` ({ id, name, created_by, created_on }).
 *   - `get_labels` (paginated) and `update_label` emit `title`
 *     ({ id, title, ... }).
 * Thus, both `name` and `title` are `.nullish()`, so that a single schema
 * parses all Labels-API responses. `id` stays a required `z.number()`. Each
 * documented response contains a concrete integer ID. A nullish `id` would
 * hide a malformed-response regression. `created_by` / `created_on` are
 * `.nullish()` because the `update_label` `{ id, title }` response does not
 * include them. `.passthrough()` (through `zObject`) keeps forward-compat keys.
 */
export const LabelSchema = zObject({
    id: z.number(),
    title: z.string().nullish(),
    name: z.string().nullish(),
    // Union rather than a bare number: the Labels doc quotes `created_by` as
    // `"2"` while leaving `created_on` unquoted in the same object. No wire
    // capture exists for this API, so accept both encodings. Mirrors
    // `LabelEmbeddedSchema.created_by` in schemas/metadata.ts.
    created_by: z.union([z.number(), z.string()]).nullish(),
    created_on: z.number().nullish(),
});

export type Label = KnownResponse<typeof LabelSchema>;

/**
 * Label mutations have shipped with both a flat label response and a
 * `{ label: ... }` wrapper. The official TestRail CLI handles both forms for
 * `add_label` and `update_label` (gurock/trcli commit e723052,
 * `cmd_labels.py` lines 53–55 and 90–92):
 * - https://github.com/gurock/trcli/blob/e723052d0898da6a501972c6855eddf487cd51bb/trcli/commands/cmd_labels.py#L53-L55
 * - https://github.com/gurock/trcli/blob/e723052d0898da6a501972c6855eddf487cd51bb/trcli/commands/cmd_labels.py#L90-L92
 * Normalize either official-client shape to the same flat entity that the
 * public SDK methods return.
 */
export const LabelWriteResponseSchema = z.union([
    LabelSchema,
    zObject({ label: LabelSchema }).transform((response) => response.label),
]);

/**
 * `add_label/{project_id}` body — the new label title. TestRail limits the
 * title to 20 characters. The client intentionally leaves this limit to the
 * server, so that the client does not duplicate a rule that TestRail can
 * change independently.
 */
export const AddLabelPayloadSchema = zObject({
    title: z.string(),
});

export type AddLabelPayload = z.infer<typeof AddLabelPayloadSchema>;

/**
 * `update_label/{label_id}` body — the owning project and the new label title.
 * TestRail limits the title to 20 characters. The client intentionally does
 * NOT apply this limit. This choice follows the "let TestRail be the source of
 * truth" precedent. The client shows the 400 response of the server and does
 * not duplicate the rule. `custom_*` / forward-compat extras flow through
 * `zObject()`'s passthrough.
 */
export const UpdateLabelPayloadSchema = zObject({
    project_id: z.number().int().positive(),
    title: z.string(),
});

export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>;

/** `delete_labels` body — one or more positive label IDs. */
export const DeleteLabelsPayloadSchema = zObject({
    label_ids: z.array(z.number().int().positive()).min(1),
});

export type DeleteLabelsPayload = z.infer<typeof DeleteLabelsPayloadSchema>;
