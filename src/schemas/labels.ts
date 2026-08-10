import { z } from 'zod';
import { zObject } from './common.js';

// ── Label Schemas (stand-alone TestRail Labels API) ───────────────────────────

/**
 * `LabelSchema` — the canonical stand-alone label entity returned by the
 * Labels API (`get_label`, `get_labels`, `update_label`). Distinct from
 * `LabelEmbeddedSchema` (the label shape nested inside `get_case` / `get_test`
 * responses): the two are structurally near-identical today but are kept
 * separate on purpose, because the stand-alone endpoint may diverge
 * independently of the embedded form (schema-conventions §1 — `XSchema` is the
 * canonical GET entity; §4 — keep sub-schemas separate).
 *
 * Naming divergence (verified against the TestRail Labels API doc, support
 * article 38961149782036, captured 2026-06-07):
 *   - `get_label` emits `name` ({ id, name, created_by, created_on }).
 *   - `get_labels` (paginated) and `update_label` emit `title`
 *     ({ id, title, ... }).
 * Both `name` and `title` are therefore `.nullish()` so a single schema parses
 * every Labels-API response. `id` stays required `z.number()` — every
 * documented response carries a concrete integer ID; making it nullish would
 * mask a malformed-response regression. `created_by` / `created_on` are
 * `.nullish()` because `update_label`'s `{ id, title }` response omits them.
 * `.passthrough()` (via `zObject`) preserves forward-compat keys.
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

export type Label = z.infer<typeof LabelSchema>;

/**
 * `update_label` body — the new label title. TestRail caps the title at 20
 * characters; the limit is intentionally NOT enforced client-side (the
 * "let TestRail be the source of truth" precedent — we surface the server's
 * 400 rather than duplicating the rule). `custom_*` / forward-compat extras
 * flow through `zObject()`'s passthrough.
 */
export const UpdateLabelPayloadSchema = zObject({
    title: z.string(),
});

export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>;
