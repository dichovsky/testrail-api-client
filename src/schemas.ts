import { z } from 'zod';

const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();

/**
 * Core schemas for common TestRail API structures.
 * These are used to validate API responses and provide static type inference via `z.infer`.
 */

// ── Common & Foundational Schemas ─────────────────────────────────────────────

export const PaginationSchema = zObject({
    limit: z.number().optional(),
    offset: z.number().optional(),
});

export const TestRailConfigSchema = zObject({
    baseUrl: z.string().url(),
    email: z.string().email(),
    apiKey: z.string().min(1),
    timeout: z.number().optional(),
    maxRetries: z.number().int().nonnegative().optional(),
    enableCache: z.boolean().optional(),
    cacheTtl: z.number().int().positive().optional(),
    cacheCleanupInterval: z.number().int().positive().optional(),
    maxCacheSize: z.number().int().positive().optional(),
    rateLimiter: zObject({
        maxRequests: z.number().int().positive(),
        windowMs: z.number().int().positive(),
    }).optional(),
    allowInsecure: z.boolean().optional(),
    allowPrivateHosts: z.boolean().optional(),
});

export type TestRailConfig = z.infer<typeof TestRailConfigSchema>;

// ── Identity & User Schemas ───────────────────────────────────────────────────

export const UserSchema = zObject({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    is_active: z.boolean(),
    role_id: z.number().nullish(),
    role: z.string().nullish(),
    // Absent in three distinct scenarios — `.nullish()` defends across all of them so the
    // inferred type for each field is `T | null | undefined` (key omitted vs explicit null
    // vs typed value):
    //   1. Version-gated: older TestRail servers (≤7.2) omit these keys entirely.
    //   2. Endpoint-shape: `get_current_user` returns a reduced shape even on 7.3+.
    //   3. Wire-null: TestRail may emit `null` for a key whose value is unset/unknown.
    email_notifications: z.boolean().nullish(),
    is_admin: z.boolean().nullish(),
    group_ids: z.array(z.number()).nullish(),
    mfa_required: z.boolean().nullish(),
    // Enterprise-only (TestRail Enterprise 7.3+). Professional and pre-7.3 servers never
    // emit these keys, so `undefined` (omitted) is the dominant case in non-Enterprise
    // traffic; explicit `null` and typed values appear on Enterprise instances.
    sso_enabled: z.boolean().nullish(),
    assigned_projects: z.array(z.number()).nullish(),
});

export type User = z.infer<typeof UserSchema>;

export const RoleSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type Role = z.infer<typeof RoleSchema>;

export const GroupSchema = zObject({
    id: z.number(),
    name: z.string(),
    user_ids: z.array(z.number()).nullish(),
});

export type Group = z.infer<typeof GroupSchema>;

/**
 * Group write-payload schemas (TestRail 7.5+). Mirror the
 * variable/shared-step/milestone payload-migration precedent: each schema is
 * declared once here as the source of truth for both the runtime validator
 * (CLI `--data` resolver) and the inferred TypeScript types consumed by the
 * programmatic client. `.passthrough()` (via `zObject`) preserves any future
 * `custom_*`-style fields TestRail may add to either endpoint.
 *
 * `UpdateGroupPayloadSchema` allows an empty body — mirrors
 * `UpdateVariablePayloadSchema` / `UpdateSectionPayloadSchema`. TestRail
 * itself accepts `{}` on update and returns the unchanged group; we do NOT
 * enforce "at least one field set" client-side.
 */
export const AddGroupPayloadSchema = zObject({
    name: z.string(),
    user_ids: z.array(z.number()).optional(),
});

export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>;

export const UpdateGroupPayloadSchema = zObject({
    name: z.string().optional(),
    user_ids: z.array(z.number()).optional(),
});

export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>;

/**
 * User write-payload schemas (TestRail 7.3+). Mirror the group/milestone
 * payload pattern: declared once here as the source of truth for both the
 * runtime validator (CLI `--data` resolver) and the inferred TypeScript types
 * consumed by the programmatic client. `.passthrough()` (via `zObject`)
 * preserves any future fields TestRail may add to either endpoint.
 *
 * `UserAddPayloadSchema` enforces `name`, `email`, and `password` as required
 * (all three are mandatory per the TestRail 7.3 API docs).
 * `UserUpdatePayloadSchema` allows partial update (all fields optional) —
 * PATCH semantics; an empty `{}` body is accepted by TestRail and returns
 * the unchanged user.
 *
 * Security note: `password` is accepted via `--data-file <path>` (file on
 * disk) or stdin pipe to avoid leaking credentials through shell history.
 * The CLI layer does not enforce this; callers must use a safe input mechanism.
 */
export const UserAddPayloadSchema = zObject({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
    is_active: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    language: z.string().optional(),
    email_notifications: z.boolean().optional(),
});

export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>;

export const UserUpdatePayloadSchema = zObject({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    role_id: z.number().int().positive().optional(),
    group_ids: z.array(z.number().int().positive()).optional(),
    mfa_required: z.boolean().optional(),
    language: z.string().optional(),
    email_notifications: z.boolean().optional(),
});

export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>;

// ── Project & Suite Schemas ────────────────────────────────────────────────────

export const ProjectSchema = zObject({
    id: z.number(),
    name: z.string(),
    announcement: z.string().nullish(),
    show_announcement: z.boolean().nullish(),
    is_completed: z.boolean().nullish(),
    completed_on: z.number().nullish(),
    suite_mode: z.number(),
    url: z.string(),
    // SPEC #2.1.1 — TestRail 7.3+ — absent on older servers; inferred type per field is
    // `T | null | undefined` (omitted vs explicit null vs typed value).
    default_role_id: z.number().nullish(),
    default_role: z.string().nullish(),
    // Per-project group assignment (TestRail 7.3+). Inner shape is the union of two
    // documented response forms — `.nullish()` per inner field plus `.passthrough()`
    // (via `zObject`) accepts both without rejecting valid TestRail responses:
    //   - `get_project` response item: `{ id, role, role_id }`
    //   - `update_project` response item: `{ id, role_id }` (no `role` name field)
    groups: z
        .array(
            zObject({
                id: z.number().nullish(),
                role: z.string().nullish(),
                role_id: z.number().nullish(),
            }),
        )
        .nullish(),
    // Per-project user assignment (TestRail Enterprise 7.3+ only — absent on
    // Professional and pre-7.3 servers). Inner shape is the union of two documented
    // response forms — same `.nullish()` per inner field + `.passthrough()` strategy
    // as `groups` above:
    //   - `get_project` response item: `{ id, global_role_id, global_role,
    //     project_role_id, project_role }`
    //   - `update_project` response item: `{ user_id, role_id }`
    users: z
        .array(
            zObject({
                id: z.number().nullish(),
                user_id: z.number().nullish(),
                global_role_id: z.number().nullish(),
                global_role: z.string().nullish(),
                project_role_id: z.number().nullish(),
                project_role: z.string().nullish(),
                role_id: z.number().nullish(),
            }),
        )
        .nullish(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const SuiteSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    project_id: z.number(),
    is_master: z.boolean().nullish(),
    is_baseline: z.boolean().nullish(),
    is_completed: z.boolean().nullish(),
    completed_on: z.number().nullish(),
    url: z.string(),
});

export type Suite = z.infer<typeof SuiteSchema>;

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
    created_by: z.number().nullish(),
    created_on: z.number().nullish(),
});

export type LabelEmbedded = z.infer<typeof LabelEmbeddedSchema>;

// ── Case & Section Schemas ─────────────────────────────────────────────────────

export const CaseSchema = zObject({
    id: z.number(),
    title: z.string(),
    section_id: z.number(),
    template_id: z.number().nullish(),
    type_id: z.number().nullish(),
    priority_id: z.number().nullish(),
    milestone_id: z.number().nullish(),
    refs: z.string().nullish(),
    created_by: z.number(),
    created_on: z.number(),
    updated_by: z.number(),
    updated_on: z.number(),
    estimate: z.string().nullish(),
    estimate_forecast: z.string().nullish(),
    suite_id: z.number(),
    display_order: z.number().nullish(),
    is_deleted: z.number().nullish(),
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // SPEC #2.1.3 — `labels` array uses the shared `LabelEmbeddedSchema` so the
    // same Label shape is enforced across `get_case` and `get_test` responses
    // and so a Label object can be carried between endpoints without re-casting.
    // See `LabelEmbeddedSchema` above for inner field choices.
    labels: z.array(LabelEmbeddedSchema).nullish(),
});

export type Case = z.infer<typeof CaseSchema>;

export const SectionSchema = zObject({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    parent_id: z.number().nullish(),
    display_order: z.number(),
    depth: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

// ── Move-section payload (TestRail 6.5.2+) ────────────────────────────────────
// Both fields are optional AND nullable, encoding three semantics:
//   - `parent_id: null` / `after_id: null` — explicit move-to-root / move-to-top
//   - `parent_id: <number>` / `after_id: <number>` — move under/after that target
//   - field omitted entirely (undefined) — don't change that axis
// `.nullable().optional()` yields type `number | null | undefined`; the
// CLI body resolver and the client request serializer must preserve the
// null-vs-undefined distinction (do NOT collapse null → undefined). We
// deliberately do not impose `min(1)` here: TestRail performs its own
// validation, and 0 is a useful sentinel in some installs.
export const MoveSectionPayloadSchema = zObject({
    parent_id: z.number().nullable().optional(),
    after_id: z.number().nullable().optional(),
});

export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>;

// ── Run Schema (forward declaration needed for PlanEntry) ─────────────────────

export const RunSchema = zObject({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    milestone_id: z.number().nullish(),
    assignedto_id: z.number().nullish(),
    include_all: z.boolean(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
    config: z.string().nullish(),
    config_ids: z.array(z.number()).nullish(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    custom_status1_count: z.number().nullish(),
    custom_status2_count: z.number().nullish(),
    custom_status3_count: z.number().nullish(),
    custom_status4_count: z.number().nullish(),
    custom_status5_count: z.number().nullish(),
    custom_status6_count: z.number().nullish(),
    custom_status7_count: z.number().nullish(),
    project_id: z.number(),
    plan_id: z.number().nullish(),
    created_on: z.number(),
    created_by: z.number(),
    refs: z.string().nullish(),
    url: z.string(),
    // SPEC #2.1.5 — TestRail timestamp fields. `updated_on` requires TestRail 6.5.2+;
    // `start_on` / `due_on` are ungated in the docs but emit only when set. `.nullish()`
    // per field — the inferred type is `number | null | undefined` (omitted vs explicit
    // null vs typed Unix timestamp).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    updated_on: z.number().nullish(),
    // Plan-entry context fields. NOT documented on the `get_run` response in the
    // current TestRail API reference; observed on runs returned inside `get_plan`
    // entries where each run carries the parent entry's GUID (string, matching
    // `PlanEntrySchema.id`) and the run's index within that entry. Standalone runs
    // returned by `get_run` / `get_runs` omit both keys. `.nullish()` is the only
    // safe modelling.
    entry_id: z.string().nullish(),
    entry_index: z.number().nullish(),
});

export type Run = z.infer<typeof RunSchema>;

// ── Plan Entry & Plan Schemas ─────────────────────────────────────────────────

export const PlanEntrySchema = zObject({
    id: z.string(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    assignedto_id: z.number().nullish(),
    include_all: z.boolean(),
    case_ids: z.array(z.number()).nullish(),
    config_ids: z.array(z.number()).nullish(),
    runs: z.array(RunSchema),
    // SPEC #2.1.6 — TestRail Plans API doc lists `start_on` / `due_on` / `refs` in the
    // `add_plan_entry` request body table (entry-level), and the `get_plan` example
    // shows `refs` in the entry object. `start_on` / `due_on` echo back on responses
    // when set. `.nullish()` per field: inferred type is `T | null | undefined`
    // (omitted vs explicit null vs typed value).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    refs: z.string().nullish(),
});

export type PlanEntry = z.infer<typeof PlanEntrySchema>;

export const PlanSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    milestone_id: z.number().nullish(),
    assignedto_id: z.number().nullish(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    custom_status1_count: z.number().nullish(),
    custom_status2_count: z.number().nullish(),
    custom_status3_count: z.number().nullish(),
    custom_status4_count: z.number().nullish(),
    custom_status5_count: z.number().nullish(),
    custom_status6_count: z.number().nullish(),
    custom_status7_count: z.number().nullish(),
    project_id: z.number(),
    created_on: z.number(),
    created_by: z.number(),
    url: z.string(),
    entries: z.array(PlanEntrySchema).nullish(),
    // SPEC #2.1.6 — Per the `get_plan` response-field table: `start_on` / `due_on`
    // are documented as timestamps (ungated); `refs` is "a string of external
    // requirement IDs, separated by commas - requires TestRail 6.3 or later".
    // Note: the doc's get_plan response *example* uses the non-canonical key
    // `due_date` (an upstream doc inconsistency); the field table is authoritative
    // and uses `due_on`, matching the `add_plan` request body. `.nullish()` per
    // field — inferred type is `T | null | undefined` (omitted vs explicit null
    // vs typed value).
    start_on: z.number().nullish(),
    due_on: z.number().nullish(),
    refs: z.string().nullish(),
});

export type Plan = z.infer<typeof PlanSchema>;

// ── Test & Result Schemas ─────────────────────────────────────────────────────

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
    custom_fields: z.record(z.string(), z.unknown()).nullish(),
    // SPEC #2.1.7 — Labels on a test response.
    //
    // Inner field choices, per the documented `get_test` response example
    // (`{ id, title }`) plus cross-endpoint compatibility with the stand-alone
    // `get_label` endpoint and the richer Case-embedded form (SPEC #2.1.3):
    //   - `id`: required `z.number()`. Every documented response example carries
    //     a concrete integer ID; making it nullish would silently mask a
    //     malformed-response regression where TestRail stops sending it.
    //   - `title`: `.nullish()` — `get_test` and `get_case` examples use `title`,
    //     but the stand-alone `get_label` uses `name`. Accepting either lets a
    //     consumer carry a Label object between endpoints without re-casting.
    //   - `name`: `.nullish()` for the same cross-endpoint reason. Wire responses
    //     from `get_test` populate `title`, not `name`.
    //   - `created_by` / `created_on`: `.nullish()` because `get_test`'s
    //     documented example omits them entirely (only `get_case` emits them).
    // `.passthrough()` (via `zObject`) preserves any future inner keys.
    //
    // TODO: once SPEC #2.1.3 lands on main (PR #138 introduces
    // `LabelEmbeddedSchema` as the shared label-on-resource shape), swap this
    // inline `zObject({ ... })` for `z.array(LabelEmbeddedSchema).nullish()` so
    // both `CaseSchema.labels` and `TestSchema.labels` reference the same
    // single source of truth. Tracked as a follow-up so this PR remains
    // independently mergeable.
    labels: z
        .array(
            zObject({
                id: z.number(),
                title: z.string().nullish(),
                name: z.string().nullish(),
                created_by: z.number().nullish(),
                created_on: z.number().nullish(),
            }),
        )
        .nullish(),
});

export type Test = z.infer<typeof TestSchema>;

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

// ── Milestone Schema ──────────────────────────────────────────────────────────

export const MilestoneSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    start_on: z.number().nullish(),
    started_on: z.number().nullish(),
    is_completed: z.boolean(),
    completed_on: z.number().nullish(),
    due_on: z.number().nullish(),
    project_id: z.number(),
    parent_id: z.number().nullish(),
    refs: z.string().nullish(),
    url: z.string(),
    // Sub-milestones are typed as unknown[] to avoid a recursive schema definition.
    milestones: z.array(z.unknown()).nullish(),
    // SPEC #2.1.9 — `is_started` response field. TestRail 5.3+ — older servers
    // omit the key entirely. Modelled as `.optional()` (not `.nullish()`) to
    // match the sibling `is_completed: z.boolean()` on this same schema: both
    // are documented as plain booleans, neither doc mentions a null value, so
    // accepting null on `is_started` would be an asymmetric over-defence
    // unsupported by the spec. `UpdateMilestonePayloadSchema` already accepts
    // `is_started` on the request side; this closes the response-side gap.
    is_started: z.boolean().optional(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

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
});

export type Status = z.infer<typeof StatusSchema>;

export const PrioritySchema = zObject({
    id: z.number(),
    name: z.string(),
    short_name: z.string(),
    is_default: z.boolean(),
    priority: z.number(),
});

export type Priority = z.infer<typeof PrioritySchema>;

// ── Case Status Schema ────────────────────────────────────────────────────────

// `get_case_statuses` (TestRail 7.5+) returns *case-level* lifecycle statuses
// (draft, approved, etc.), distinct from `get_statuses` which returns result
// statuses. The primary key is `case_status_id`, not `id`.
export const CaseStatusSchema = zObject({
    case_status_id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
    is_default: z.boolean(),
    is_approved: z.boolean(),
    is_untested: z.boolean(),
});

export type CaseStatus = z.infer<typeof CaseStatusSchema>;

// ── History Schemas ───────────────────────────────────────────────────────────

// Per-field delta inside a history entry's `changes[]`. All fields optional
// because TestRail emits different subsets per change type.
const HistoryChangeSchema = zObject({
    field: z.string().nullish(),
    type_id: z.number().nullish(),
    old_text: z.string().nullish(),
    new_text: z.string().nullish(),
    // SPEC #2.1.13 — added per the `get_history_for_case` field table:
    //   - `label` (string) is the field label as seen in the user interface.
    //   - `options` (array) carries field-config options (required, default value,
    //     etc.) — inner shape varies per field type, so the element type stays
    //     `z.unknown()` to accept whatever TestRail emits.
    //   - `old_value` / `new_value` are typed as a discriminated union of the
    //     value shapes the wire actually carries:
    //       * `string`   — text fields, refs ("1" in the doc example)
    //       * `number`   — integer fields (3573/3574 in the section_id example)
    //       * `boolean`  — boolean fields (type_id=3)
    //       * `array`    — separated-steps fields (type_id=8); element shape varies
    //       * `null`     — explicit-null emitted when previous/new is unset
    //     Plus `.nullish()` on the field itself so the key may be omitted
    //     entirely. The union gives consumers a switch-narrowable type instead of
    //     the bare `unknown` they'd get from `z.unknown()`.
    label: z.string().nullish(),
    options: z.array(z.unknown()).nullish(),
    old_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown())]).nullish(),
    new_value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown())]).nullish(),
});

// Shared entry shape used by `get_history_for_case` and
// `get_shared_step_history`. The two endpoints emit slightly different
// timestamp keys (`timestamp` vs `created_on`); both are optional so the
// schema accepts either. `.passthrough()` (via zObject) preserves any
// endpoint-specific fields.
export const HistoryEntrySchema = zObject({
    id: z.number(),
    user_id: z.number(),
    type_id: z.number(),
    timestamp: z.number().nullish(),
    created_on: z.number().nullish(),
    changes: z.array(HistoryChangeSchema).nullish(),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

// ── Field Config Schemas ──────────────────────────────────────────────────────

const FieldConfigOptionsSchema = zObject({
    is_required: z.boolean(),
    default_value: z.string(),
    items: z.string().nullish(),
    format: z.string().nullish(),
    rows: z.string().nullish(),
});

const FieldConfigContextSchema = zObject({
    is_global: z.boolean(),
    project_ids: z.array(z.number()),
});

export const CaseFieldConfigSchema = zObject({
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>;

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
});

export type CaseField = z.infer<typeof CaseFieldSchema>;

export const ResultFieldConfigSchema = zObject({
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>;

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
});

export type ResultField = z.infer<typeof ResultFieldSchema>;

// ── Case Type & Template Schemas ──────────────────────────────────────────────

export const CaseTypeSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type CaseType = z.infer<typeof CaseTypeSchema>;

export const TemplateSchema = zObject({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type Template = z.infer<typeof TemplateSchema>;

// ── Configuration Schemas ─────────────────────────────────────────────────────

export const ConfigurationSchema = zObject({
    id: z.number(),
    name: z.string(),
    group_id: z.number(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export const ConfigurationGroupSchema = zObject({
    id: z.number(),
    name: z.string(),
    project_id: z.number(),
    configs: z.array(ConfigurationSchema),
});

export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>;

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
    data_id: z.string().nullish(),
    legacy_id: z.number().nullish(),
    is_image: z.boolean().nullish(),
    icon: z.string().nullish(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// ── Shared Steps Schema ───────────────────────────────────────────────────────

/**
 * SPEC #2.1.15 — verified against the official Shared Steps API doc
 * (TestRail Support article 7077919815572). Endpoint requires TestRail 7.0+.
 *
 * Field-by-field reconciliation with the doc's `get_shared_step` response
 * field table:
 *
 *   id, title                                      — required; never null/absent
 *   project_id, case_ids, created_by, created_on,
 *   updated_by, updated_on, custom_steps_separated — listed in the field table
 *
 * The doc additionally specifies `get_shared_steps` (list-form) returning
 * truncated entries containing only `{ id, title }` (see the doc's list-response
 * example). Every field beyond `id`/`title` is therefore modelled as `.nullish()`
 * to accept both shapes from a single schema:
 *
 *   - present-and-valued: the `get_shared_step` full-form response
 *   - absent: the `get_shared_steps` truncated list-form
 *   - present-as-null: tolerated as a defensive widening (no doc example shows
 *     a top-level null, but matches the project-wide policy from PR #130
 *     "Accept nullable TestRail response fields with nullish schemas")
 *
 * Step entries (`custom_steps_separated[]`) are typed as a free-form
 * `z.record(string, unknown)` because the doc's `custom_steps_separated` field
 * note explicitly warns that the field's system name can be renamed by an
 * admin if it has ever been removed and recreated, and because the doc's
 * step-entry table allows `additional_info` and `refs` to come back as
 * literal `null` in the example payload — `z.unknown()` per-key absorbs
 * both nulls and any future per-tenant rename of step sub-fields.
 */
export const SharedStepSchema = zObject({
    id: z.number(),
    title: z.string(),
    project_id: z.number().nullish(),
    case_ids: z.array(z.number()).nullish(),
    created_on: z.number().nullish(),
    created_by: z.number().nullish(),
    updated_on: z.number().nullish(),
    updated_by: z.number().nullish(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).nullish(),
});

export type SharedStep = z.infer<typeof SharedStepSchema>;

// ── Variable & Dataset Schemas ────────────────────────────────────────────────

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

export const DatasetSchema = zObject({
    id: z.number(),
    name: z.string(),
    project_id: z.number().nullish(),
    created_on: z.number().nullish(),
    created_by: z.number().nullish(),
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

// ── Report Schemas ────────────────────────────────────────────────────────────

export const ReportSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    is_shared: z.boolean().nullish(),
});

export type Report = z.infer<typeof ReportSchema>;

export const ReportResultSchema = zObject({
    report_url: z.string(),
    user_report_url: z.string().nullish(),
});

export type ReportResult = z.infer<typeof ReportResultSchema>;

// ── Write Payload Schemas ─────────────────────────────────────────────────────
// Source-of-truth schemas for POST bodies sent by the TestRail client. Each is
// `.passthrough()` via `zObject`, so TestRail's user-configured `custom_*`
// fields (or any other forward-compatible extension) pass through unchanged.
// TypeScript payload types are derived via `z.infer` and exported alongside
// each schema; no separate handwritten interface lives in `src/types.ts`.

export const AddCasePayloadSchema = zObject({
    title: z.string(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>;

export const UpdateCasePayloadSchema = zObject({
    title: z.string().optional(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>;

// ── Bulk add cases (TestRail 7.5+) ────────────────────────────────────────────
// `POST add_cases/{section_id}` accepts a JSON array of case payloads — each
// item has the same shape as `AddCasePayloadSchema`. Distinct from the single
// `add_case/{section_id}` (object body) — the CLI exposes both as separate
// actions so the agent surface stays explicit about array-vs-object intent.
// Server-version gate: TestRail < 7.5 returns 400 "Invalid uri" or similar
// because the endpoint does not exist; the module rethrows that as a clearer
// "TestRail 7.5+ required" message. `z.array(...).min(1)` rejects empty arrays
// client-side since TestRail treats them as 400 — surface the contract at the
// CLI boundary instead of forcing a round-trip.
export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1);

export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>;

// ── Bulk case payloads ────────────────────────────────────────────────────────
// Inlined rather than `.extend(UpdateCasePayloadSchema)` so the passthrough()
// behavior is unambiguous and the inferred type stays a plain object literal
// (same precedent as AddResultForTestPayloadSchema). `case_ids` is required —
// the endpoint server-side rejects an empty body; surfacing that here lets
// agents see the contract failure at the CLI boundary.
export const UpdateCasesPayloadSchema = zObject({
    case_ids: z.array(z.number()),
    title: z.string().optional(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>;

// Body schema for bulk delete. We refine away a misplaced `soft` key on the
// body — TestRail toggles the soft-preview path via the `soft=1` *query*
// param, not a body field. The CLI surfaces this via `--soft`. Accepting a
// body-level `soft` would silently pass `.passthrough()` and could turn an
// intended preview into a hard delete (or vice versa) when callers paste
// example JSON that mixes the two. Surface the misuse early at the schema
// boundary so destructive intent stays unambiguous.
export const DeleteCasesPayloadSchema = zObject({
    case_ids: z.array(z.number()),
}).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), {
    message:
        '`soft` is not a body field — use the `--soft` CLI flag or the `options.soft` argument on `deleteCases()` to toggle the server-side preview.',
    path: ['soft'],
});

export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>;

// Shared shape returned by `delete_*?soft=1` endpoints (case / run / section /
// suite / cases). TestRail emits a subset of these counters depending on the
// target — e.g. `delete_case&soft=1` returns `{ affected_tests }`, while
// `delete_suite&soft=1` returns counts of sections, cases, runs, plans, and
// tests. Every numeric field stays optional and `.passthrough()` keeps
// unknown counters or future fields from being elided.
export const SoftDeletePreviewSchema = zObject({
    affected_tests: z.number().optional(),
    affected_cases: z.number().optional(),
    affected_sections: z.number().optional(),
    affected_runs: z.number().optional(),
    affected_milestones: z.number().optional(),
    affected_plans: z.number().optional(),
    affected_suites: z.number().optional(),
});

export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>;

// Identical shape to DeleteCasesPayloadSchema but intentionally a separate
// schema — a future TestRail change to either endpoint (e.g. delete adds a
// `force` flag) must not silently spread to the other.
export const CopyCasesToSectionPayloadSchema = zObject({
    case_ids: z.array(z.number()),
});

export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>;

// `suite_id` is required by TestRail when moving cases across suites and is
// harmless (ignored server-side) for same-suite moves. The Python reference
// client (`tolstislon/testrail-api`) treats it as required for the same
// reason. Path-only `section_id` is NOT in the body (TestRail's online docs
// have historically listed both — confirmed wrong against the live API and
// reference clients).
export const MoveCasesToSectionPayloadSchema = zObject({
    case_ids: z.array(z.number()),
    suite_id: z.number(),
});

export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>;

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
    template_ids: z.array(z.number()).optional(),
    configs: z.array(AddCaseFieldConfigPayloadSchema),
});

export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>;

export const AddRunPayloadSchema = zObject({
    name: z.string(),
    suite_id: z.number().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>;

export const UpdateRunPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>;

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

// ── Plan write payloads ───────────────────────────────────────────────────────
// Plans nest entries, and entries nest runs. The run shape inside a plan entry
// is intentionally looser than AddRunPayloadSchema: TestRail derives the run
// name from the config when nested, so `name` (and every other field) is
// optional here. Using a separate schema avoids loosening the standalone
// `run add` contract.

export const PlanEntryRunPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>;

// Payload for POST add_run_to_plan_entry/{plan_id}/{entry_id}. `config_ids` is
// required: an entry-level run is created for a specific config combination.
// `name` is intentionally absent — TestRail derives the run name from the
// config. Distinct from `PlanEntryRunPayloadSchema` (used for nested entries
// where every field is optional).
export const AddRunToPlanEntryPayloadSchema = zObject({
    config_ids: z.array(z.number()),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    refs: z.string().optional(),
});

export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>;

// Payload for POST update_run_in_plan_entry/{run_id}. The endpoint only accepts
// `description`, `assignedto_id`, `include_all`, and `case_ids`. `config_ids`,
// `name`, and `refs` are silently dropped, so we omit them client-side.
export const UpdateRunInPlanEntryPayloadSchema = zObject({
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
});

export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>;

export const AddPlanEntryPayloadSchema = zObject({
    suite_id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    runs: z.array(PlanEntryRunPayloadSchema).optional(),
    // SPEC #2.1.6 — request-side counterparts of the response fields added to
    // `PlanEntrySchema`. The TestRail Plans API doc's `add_plan_entry` request
    // body table lists `start_on` (timestamp, false), `due_on` (timestamp, false),
    // and `refs` (string, false) as valid request fields. These must be declared
    // here so they appear in `z.infer<typeof AddPlanEntryPayloadSchema>`, giving
    // consumers a statically-typed path to set them; without explicit declarations
    // the inferred `AddPlanEntryPayload` type would omit these keys even though
    // `zObject` is `passthrough()` and would forward unknown keys at runtime.
    // Declaration also enables validation (e.g., rejecting `start_on: 'string'`).
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    refs: z.string().optional(),
});

export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>;

export const UpdatePlanEntryPayloadSchema = zObject({
    suite_id: z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean().optional(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    runs: z.array(PlanEntryRunPayloadSchema).optional(),
    // SPEC #2.1.6 — TestRail Plans API doc's `update_plan_entry` request body
    // table independently lists `start_on` (timestamp, false), `due_on`
    // (timestamp, false), and `refs` (string, false — "requires TestRail 6.3 or
    // later"). Same typing rationale as `AddPlanEntryPayloadSchema` above:
    // declared so consumers get a statically-typed surface, and so wrong-typed
    // values are rejected at parse time.
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    refs: z.string().optional(),
});

export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>;

export const AddPlanPayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    // SPEC #2.1.6 — TestRail Plans API doc's `add_plan` request body table lists
    // `start_on` (timestamp, false) and `due_on` (timestamp, false). `refs` is NOT
    // in the request body table for `add_plan` (only in the response field table),
    // so it is intentionally omitted here.
    start_on: z.number().optional(),
    due_on: z.number().optional(),
    entries: z.array(AddPlanEntryPayloadSchema).optional(),
});

export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>;

export const UpdatePlanPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    // SPEC #2.1.6 — TestRail Plans API doc says `update_plan` "supports the same
    // POST fields as `add_plan`" (with the exception of `entries`). That makes
    // `start_on` / `due_on` valid here. `refs` is intentionally omitted to mirror
    // `AddPlanPayloadSchema` (not in the `add_plan` request body table).
    start_on: z.number().optional(),
    due_on: z.number().optional(),
});

export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>;

// ── Structural-setup write payloads ───────────────────────────────────────────
// Project, Suite, Section, and Milestone create/update payloads. All schemas use
// `.passthrough()` (via `zObject`) so forward-compatible TestRail fields and any
// `custom_*` keys survive a round-trip through Zod parsing. `suite_mode` is left
// as a plain `z.number()` rather than a `1|2|3` literal union — TestRail rejects
// invalid values server-side with a clear error, and a client-side literal union
// would have to track future modes the schema can't anticipate.

export const AddProjectPayloadSchema = zObject({
    name: z.string(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
});

export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>;

export const UpdateProjectPayloadSchema = zObject({
    name: z.string().optional(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    suite_mode: z.number().optional(),
});

export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>;

export const AddSuitePayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
});

export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>;

export const UpdateSuitePayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
});

export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>;

// `suite_id` is required by TestRail when adding a section to a multi-suite-mode
// project (suite_mode 2 or 3) and forbidden in single-suite mode (suite_mode 1).
// Modelled as optional so both modes work; the server returns a 400 if the
// caller's mode/`suite_id` combination is invalid. We do NOT replicate that
// suite-mode interaction client-side — TestRail is the authoritative source on
// the project's mode at request time.
export const AddSectionPayloadSchema = zObject({
    name: z.string(),
    suite_id: z.number().optional(),
    parent_id: z.number().optional(),
    description: z.string().optional(),
});

export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>;

export const UpdateSectionPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
});

export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>;

export const AddMilestonePayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
    due_on: z.number().optional(),
    start_on: z.number().optional(),
    parent_id: z.number().optional(),
    refs: z.string().optional(),
});

export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>;

export const UpdateMilestonePayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    due_on: z.number().optional(),
    start_on: z.number().optional(),
    parent_id: z.number().optional(),
    refs: z.string().optional(),
    is_completed: z.boolean().optional(),
    is_started: z.boolean().optional(),
});

export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>;

// ── Shared-step write payloads (TestRail 7.0+) ────────────────────────────────
// `custom_steps_separated` is intentionally typed as `z.array(z.record(z.string(), z.unknown()))`
// rather than a structured step schema — the step shape varies by TestRail
// template configuration (separated, additional info, expected result, etc.)
// and there's no project-time visibility into which keys are present. The
// `.passthrough()` from `zObject` also lets future `custom_*` keys survive
// round-trip (matches the AddCase / AddRun precedent).

/**
 * SPEC #2.1.15 — verified against the `add_shared_step` request-body field
 * table (Support article 7077919815572): only `title` is `required=true`;
 * `custom_steps_separated` is `required=false`. The doc's request example
 * also shows step entries with a subset of fields (just `content`), which
 * the `z.record(string, unknown())` per-step shape accepts.
 */
export const AddSharedStepPayloadSchema = zObject({
    title: z.string(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>;

/**
 * Update payload for `update_shared_step`. Every field is optional — TestRail
 * accepts an empty object (`{}`) as a no-op update, so the CLI's
 * `shared-step update <id> --data '{}'` is intentionally a valid call. This
 * mirrors `UpdateMilestonePayloadSchema` and `UpdateCasePayloadSchema`: empty
 * bodies are accepted at the schema layer; rejecting them is the API's
 * responsibility, not the client's. Callers that want to enforce
 * "non-empty update" must do so above this schema.
 */
export const UpdateSharedStepPayloadSchema = zObject({
    title: z.string().optional(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>;

// ── Configuration write payloads ──────────────────────────────────────────────
// TestRail's `add_config_group` / `update_config_group` / `add_config` /
// `update_config` endpoints accept only `{ name }`. Both group- and config-level
// operations share the same trivial payload shape, but they're kept as four
// separate schemas (instead of one shared `NamePayloadSchema`) so each can grow
// independently if TestRail extends one endpoint with additional optional fields.
// `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields.

export const AddConfigurationGroupPayloadSchema = zObject({
    name: z.string(),
});

export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>;

export const UpdateConfigurationGroupPayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>;

export const AddConfigurationPayloadSchema = zObject({
    name: z.string(),
});

export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>;

export const UpdateConfigurationPayloadSchema = zObject({
    name: z.string().optional(),
});

export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>;
