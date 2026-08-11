import { z } from 'zod';
import { zObject, type KnownResponse } from './common.js';

// ── Label-Embedded Schema (shared between Case/Test response labels) ──────────

/**
 * Shape of a Label object as embedded inside a parent resource response —
 * notably `get_case` (SPEC #2.1.3) and `get_test` (SPEC #2.1.7). The two
 * endpoints emit the same logical shape but the wider TestRail Labels API
 * has historically diverged on naming (`title` on embedded forms vs `name`
 * on the stand-alone `get_label`), so the inner schema accepts both.
 *
 * Field choices, per `get_case` / `get_test` response examples in the
 * TestRail API docs:
 *   - `id`: required `z.number()`. Every documented response example carries
 *     a concrete integer ID; making it nullish would silently mask a
 *     malformed-response regression where TestRail stops sending it.
 *   - `title`: `.nullish()` for the cross-endpoint `name`-vs-`title` split.
 *     Case- and Test-embedded labels use `title`; the stand-alone Labels API
 *     (`get_label`) uses `name`. Accepting either keeps a single shape
 *     viable across both endpoints.
 *   - `name`: `.nullish()` for the same cross-endpoint reason.
 *   - `created_by` / `created_on`: `.nullish()` because TestRail's
 *     `get_test` response example does not emit them at all, while
 *     `get_case` does. Accepting both shapes lets consumers carry the same
 *     `LabelEmbedded` object between endpoints without a re-cast.
 *
 * `.passthrough()` (via `zObject`) preserves any future inner keys without
 * rejecting the parse.
 */
export const LabelEmbeddedSchema = zObject({
    id: z.number(),
    title: z.string().nullish(),
    name: z.string().nullish(),
    // TestRail's Labels documentation quotes `created_by` as `"2"` in the same
    // object where it leaves `created_on` unquoted, and where the parent case's
    // own `created_by` is an unquoted `1`. No wire capture exists for the Labels
    // API, so accept both documented encodings — the
    // union mirrors the `mfa_required` and `data_id` fixes from the audit.
    // This schema is embedded in `CaseSchema.labels[]` and `TestSchema.labels[]`,
    // so a string here would have failed getCase/getCases/getTest/getTests.
    created_by: z.union([z.number(), z.string()]).nullish(),
    created_on: z.number().nullish(),
});

export type LabelEmbedded = KnownResponse<typeof LabelEmbeddedSchema>;

// ── Status & Priority Schemas ──────────────────────────────────────────────────

export const StatusSchema = zObject({
    id: z.number(),
    name: z.string(),
    label: z.string(),
    color_dark: z.number(),
    color_medium: z.number(),
    color_bright: z.number(),
    is_system: z.boolean(),
    is_untested: z.boolean(),
    is_final: z.boolean(),
    // Live-instance audit: i18n translation key, string when set and `null` for
    // some entities. Present across get_statuses / get_case_fields /
    // get_result_fields / get_case_types / get_templates; was unmodeled.
    i18n_custom_id: z.string().nullish(),
});

export type Status = KnownResponse<typeof StatusSchema>;

export const PrioritySchema = zObject({
    id: z.number(),
    name: z.string(),
    short_name: z.string(),
    is_default: z.boolean(),
    priority: z.number(),
});

export type Priority = KnownResponse<typeof PrioritySchema>;

// ── Case Status Schema ────────────────────────────────────────────────────────

// `get_case_statuses` (TestRail 7.5+) returns *case-level* lifecycle statuses
// (draft, approved, etc.), distinct from `get_statuses` which returns result
// statuses. The primary key is `case_status_id`, not `id`.
export const CaseStatusSchema = zObject({
    case_status_id: z.number(),
    name: z.string(),
    // `abbreviation` is an optional short label. The built-in Approved and Draft
    // statuses — the out-of-the-box configuration of every instance — ship with
    // it unset, and TestRail's own documented example response returns `null`
    // for both. A required `z.string()` rejected the very first element.
    abbreviation: z.string().nullish(),
    is_default: z.boolean(),
    is_approved: z.boolean(),
    // `is_untested` belongs to `get_statuses` (result statuses), not
    // `get_case_statuses`. TestRail never emits the key here, so the required
    // `z.boolean()` failed every row of every response. Kept (rather than
    // deleted) so an instance that does send it still parses into the type.
    is_untested: z.boolean().nullish(),
});

export type CaseStatus = KnownResponse<typeof CaseStatusSchema>;

// ── Field Config Schemas ──────────────────────────────────────────────────────

const FieldConfigOptionsSchema = zObject({
    is_required: z.boolean(),
    // `default_value` is OMITTED entirely on some get_case_fields and
    // get_result_fields configurations, so a required `z.string()` threw.
    // `.nullish()` accepts present-string, null, and key-omitted.
    default_value: z.string().nullish(),
    // Newline-delimited string for dropdown fields
    // ("0,Option A\n1,Option B\n…"), but some result-field configurations use
    // an ARRAY of `{ name, machine_name }`. A bare `z.string()` therefore made
    // those responses fail validation, compounding the `default_value` defect.
    items: z.union([z.string(), z.array(z.unknown())]).nullish(),
    format: z.string().nullish(),
    rows: z.string().nullish(),
    // Step-style fields can carry these boolean toggles in the options object;
    // they were previously carried only through the passthrough type.
    has_expected: z.boolean().nullish(),
    has_actual: z.boolean().nullish(),
    has_additional: z.boolean().nullish(),
    has_reference: z.boolean().nullish(),
});

const FieldConfigContextSchema = zObject({
    is_global: z.boolean(),
    // TestRail returns `project_ids` as a `number[]` for project-scoped fields,
    // but as `null` or `""` (empty string) for global fields (`is_global: true`)
    // — which includes every built-in system field (Preconditions, Steps,
    // Expected Result, …). A required `z.array(z.number())` therefore rejects
    // the response from virtually any real instance. Accept the non-array forms
    // and normalize them to `[]` so the parsed shape stays `number[]` for callers
    // (matches the public `CaseFieldConfig`/`ResultFieldConfig` types in types.ts).
    // The `.transform()` that used to normalize the non-array forms to `[]` was
    // removed in 6.0.0. Response validation is now advisory, so a sibling field
    // failing to parse returns the raw body — and the raw body carries the
    // untransformed `null` / `""` while the inferred type claimed `number[]`,
    // turning a caught validation error into an uncaught `TypeError` on
    // `project_ids.length` in caller code. The type now states the wire shape.
    project_ids: z.union([z.array(z.number()), z.string()]).nullish(),
});

export const CaseFieldConfigSchema = zObject({
    // Live-instance audit: each config carries a string `id` (UUID on modern
    // fields, legacy hex token e.g. "4be1344d55d11" on older ones). `.nullish()`
    // — sibling of context/options.
    id: z.string().nullish(),
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type CaseFieldConfig = KnownResponse<typeof CaseFieldConfigSchema>;

export const CaseFieldSchema = zObject({
    id: z.number(),
    system_name: z.string(),
    label: z.string(),
    name: z.string(),
    type_id: z.number(),
    display_order: z.number(),
    configs: z.array(CaseFieldConfigSchema),
    is_active: z.boolean(),
    include_all: z.boolean(),
    template_ids: z.array(z.number()),
    description: z.string().nullish(),
    // Live-instance audit: i18n translation key (string|null); was unmodeled.
    i18n_custom_id: z.string().nullish(),
    // Search-indexing flag documented as a boolean on get_case_fields.
    is_indexed: z.boolean().nullish(),
    // Older responses encode this flag as 0/1; newer responses may use JSON booleans.
    is_system: z.union([z.boolean(), z.literal(0), z.literal(1)]).nullish(),
});

export type CaseField = KnownResponse<typeof CaseFieldSchema>;

// ── add_case_field response (string-vs-array divergence) ──────────────────────
// SPEC #2.1.12 — TestRail's `add_case_field` POST response shape differs
// from `get_case_fields` GET response in two ways:
//
//   1. `configs` is a **JSON-encoded string** (not a parsed array). The
//      server serializes the configs array back to a string before sending
//      the response, e.g.:
//        "configs": "[{\"context\":{...},\"options\":{...},\"id\":\"<uuid>\"}]"
//      Per the upstream docs and the literal POST response example. Callers
//      that need the structured form must `JSON.parse(response.configs)`.
//   2. Several boolean-style fields surface as `0`/`1` integers
//      (`is_active`, `include_all`, `is_multi`, `is_system`) instead of
//      `true`/`false`, and the response includes admin-internal fields
//      (`entity_id`, `location_id`, `status_id`) absent from the GET shape.
//
// Modeled as a distinct schema so `getCaseFields` keeps its strict structured
// `configs: array` shape and `addCaseField` matches what the server actually
// returns. `.passthrough()` (via `zObject`) preserves forward-compat as
// TestRail adds response-only fields.
export const AddCaseFieldResponseSchema = zObject({
    id: z.number(),
    system_name: z.string(),
    label: z.string(),
    name: z.string(),
    type_id: z.number(),
    display_order: z.number(),
    // POST response: JSON-encoded array (string), NOT the parsed array shape.
    // configs is a JSON-encoded string per TestRail spec; not validated as
    // parseable JSON here — callers using JSON.parse must handle SyntaxError
    // (server-bug case; programmer error in normal operation).
    configs: z.string(),
    // POST response uses 0/1 integers instead of true/false.
    is_active: z.union([z.literal(0), z.literal(1)]),
    include_all: z.union([z.literal(0), z.literal(1)]),
    template_ids: z.array(z.number()),
    description: z.string().nullish(),
    // Admin-internal fields absent from GET get_case_fields.
    entity_id: z.number().nullish(),
    location_id: z.number().nullish(),
    is_multi: z.union([z.literal(0), z.literal(1)]).nullish(),
    status_id: z.number().nullish(),
    is_system: z.union([z.literal(0), z.literal(1)]).nullish(),
});

export type AddCaseFieldResponse = KnownResponse<typeof AddCaseFieldResponseSchema>;

export const ResultFieldConfigSchema = zObject({
    // Live-instance audit: config-level string `id` (UUID / legacy hex token),
    // mirror of CaseFieldConfigSchema.
    id: z.string().nullish(),
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type ResultFieldConfig = KnownResponse<typeof ResultFieldConfigSchema>;

export const ResultFieldSchema = zObject({
    id: z.number(),
    system_name: z.string(),
    label: z.string(),
    name: z.string(),
    type_id: z.number(),
    display_order: z.number(),
    configs: z.array(ResultFieldConfigSchema),
    is_active: z.boolean(),
    include_all: z.boolean(),
    template_ids: z.array(z.number()),
    description: z.string().nullish(),
    // Live-instance audit: i18n translation key (string|null); was unmodeled.
    i18n_custom_id: z.string().nullish(),
    // Version-tolerant flag: TestRail has emitted both booleans and 0/1 integers.
    is_system: z.union([z.boolean(), z.literal(0), z.literal(1)]).nullish(),
});

export type ResultField = KnownResponse<typeof ResultFieldSchema>;

// ── Case Type & Template Schemas ──────────────────────────────────────────────

export const CaseTypeSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
    // Live-instance audit: i18n translation key (string|null); was unmodeled.
    i18n_custom_id: z.string().nullish(),
});

export type CaseType = KnownResponse<typeof CaseTypeSchema>;

export const TemplateSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
    // Live-instance audit: i18n translation key (string|null); was unmodeled.
    i18n_custom_id: z.string().nullish(),
});

export type Template = KnownResponse<typeof TemplateSchema>;

// ── Case-field payloads ───────────────────────────────────────────────────────
// `add_case_field` (admin-only) creates a custom case field at the
// instance/project level. The payload mirrors the response-side
// `CaseFieldConfigSchema` for `configs[]` (same private `context`/`options`
// helpers), but is intentionally a separate top-level schema — write payloads
// must not drift if TestRail later adds response-only fields like
// `display_order` or `is_active` to the GET response.
//
// Inlined (not `.extend()`-ed off CaseFieldSchema) so the inferred type stays
// a plain object literal and `.passthrough()` behaviour is unambiguous —
// same precedent as AddResultForTestPayloadSchema. `.passthrough()` also
// lets TestRail be the source of truth on field-type-specific quirks (e.g.
// some versions reject `items` when `type=Steps`, and `name` must be a
// valid system slug). We surface the server's 400 instead of duplicating
// those rules client-side.
export const AddCaseFieldConfigPayloadSchema = zObject({
    context: zObject({
        is_global: z.boolean(),
        project_ids: z.array(z.number()),
    }),
    options: zObject({
        is_required: z.boolean(),
        default_value: z.string(),
        items: z.string().optional(),
        format: z.string().optional(),
        rows: z.string().optional(),
    }),
});

export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>;

export const AddCaseFieldPayloadSchema = zObject({
    type: z.string(),
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
    include_all: z.boolean().optional(),
    is_indexed: z.boolean().optional(),
    template_ids: z.array(z.number()).optional(),
    configs: z.array(AddCaseFieldConfigPayloadSchema),
});

export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>;
