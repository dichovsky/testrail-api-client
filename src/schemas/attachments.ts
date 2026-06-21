import { z } from 'zod';
import { zObject } from './common.js';

// ── Attachment Schema ─────────────────────────────────────────────────────────

// SPEC #2.1.14 — full field-completeness audit of the Attachments doc
// (https://support.testrail.com/hc/en-us/articles/7077196481428-Attachments).
// TestRail's attachment endpoints emit three response shapes; this single
// schema is the union of all three plus the cloud-7.1+ variant:
//
//   1. `add_attachment_to_*` POST → `{ attachment_id: number }` only.
//   2. Legacy `get_attachments_for_case` / `get_attachments_for_test` →
//      `{ id, name, size, created_on, project_id, case_id, user_id, result_id }`.
//   3. `get_attachments_for_plan` / `get_attachments_for_plan_entry` /
//      `get_attachments_for_run` → adds `entity_attachments_id` + `icon_name`;
//      `case_id` is documented as `null` for plan-level attachments.
//   4. Cloud TestRail 7.1+ list response → replaces the integer `id` with a
//      string UUID and adds `client_id`, `entity_type`, `data_id`, `entity_id`
//      (string!), `filename`, `filetype`, `legacy_id`, `is_image`, `icon`.
//
// Field-by-field rationale:
//   - `attachment_id`: only present on the upload-POST response. Switched from
//     `z.number()` (required) to `.nullish()` so list responses — which
//     emit `id`, not `attachment_id` — no longer fail validation. The legacy
//     pre-7.1 list test fixtures that used `attachment_id` still pass because
//     `zObject` (passthrough) keeps the key around.
//   - `id`: integer pre-7.1, UUID string 7.1+. Modelled as a union so both
//     shapes parse without coercion.
//   - `entity_id`: integer in older endpoints, string ("3") in cloud 7.1+.
//     The previous `z.number().nullish()` would have rejected the 7.1+
//     payload outright; now a union accepts both.
//   - `case_id`, `result_id`: doc examples show explicit `null` for
//     plan-level attachments / unrelated results — `.nullish()` covers both
//     the legitimate `null` and pre-7.1 servers that omit the key.
//   - `entity_attachments_id`, `icon_name`: only on plan/plan-entry/run.
//   - `client_id`, `entity_type`, `data_id`, `filetype`, `legacy_id`,
//     `is_image`, `icon`: cloud TestRail 7.1+ only; older servers omit.
//   - `created_by`: NOT a documented field — the upload-side libraries used
//     this name historically. Retained as `.nullish()` for backward compat
//     with any caller that already reads it; `user_id` is the documented
//     equivalent and is the field a new caller should consume.
//   - `name`: switched from `z.string()` (required) to `.nullish()` because
//     the upload-POST response (shape 1 above) does NOT include `name`,
//     only `attachment_id`. Without this relaxation `requestParsed`-based
//     paths that ever reach the upload schema would fail; `requestMultipart`
//     bypasses schema validation today but the symmetry matters for future
//     callers and for documenting the contract honestly.
//
// `zObject` is `z.object(...).passthrough()`, so any further server-side
// fields land in the parsed object untouched and `custom_*` extras flow
// through identically to other resources.
export const AttachmentSchema = zObject({
    attachment_id: z.number().nullish(),
    id: z.union([z.number(), z.string()]).nullish(),
    name: z.string().nullish(),
    filename: z.string().nullish(),
    filetype: z.string().nullish(),
    size: z.number().nullish(),
    created_on: z.number().nullish(),
    created_by: z.number().nullish(),
    user_id: z.number().nullish(),
    project_id: z.number().nullish(),
    case_id: z.number().nullish(),
    result_id: z.number().nullish(),
    entity_id: z.union([z.number(), z.string()]).nullish(),
    entity_attachments_id: z.number().nullish(),
    entity_type: z.string().nullish(),
    icon_name: z.string().nullish(),
    client_id: z.number().nullish(),
    // Live-instance audit: `data_id` is an INTEGER on TestRail Cloud
    // (e.g. 1000006328), not the string the doc-derived schema assumed — a bare
    // z.string() rejected the real get_attachments_for_case entity. Union accepts
    // both. `cassandra_file_id` is a UUID string present on every populated entity
    // but was unmodeled (carried untyped via passthrough).
    data_id: z.union([z.number(), z.string()]).nullish(),
    cassandra_file_id: z.string().nullish(),
    legacy_id: z.number().nullish(),
    is_image: z.boolean().nullish(),
    icon: z.string().nullish(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;
