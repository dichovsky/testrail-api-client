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
    role_id: z.number().optional(),
    role: z.string().optional(),
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
    user_ids: z.array(z.number()).optional(),
});

export type Group = z.infer<typeof GroupSchema>;

// ── Project & Suite Schemas ────────────────────────────────────────────────────

export const ProjectSchema = zObject({
    id: z.number(),
    name: z.string(),
    announcement: z.string().optional(),
    show_announcement: z.boolean().optional(),
    is_completed: z.boolean().optional(),
    completed_on: z.number().optional(),
    suite_mode: z.number(),
    url: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const SuiteSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    project_id: z.number(),
    is_master: z.boolean().optional(),
    is_baseline: z.boolean().optional(),
    is_completed: z.boolean().optional(),
    completed_on: z.number().optional(),
    url: z.string(),
});

export type Suite = z.infer<typeof SuiteSchema>;

// ── Case & Section Schemas ─────────────────────────────────────────────────────

export const CaseSchema = zObject({
    id: z.number(),
    title: z.string(),
    section_id: z.number(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    milestone_id: z.number().optional(),
    refs: z.string().optional(),
    created_by: z.number(),
    created_on: z.number(),
    updated_by: z.number(),
    updated_on: z.number(),
    estimate: z.string().optional(),
    estimate_forecast: z.string().optional(),
    suite_id: z.number(),
    display_order: z.number().optional(),
    is_deleted: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type Case = z.infer<typeof CaseSchema>;

export const SectionSchema = zObject({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    parent_id: z.number().optional(),
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
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean(),
    is_completed: z.boolean(),
    completed_on: z.number().optional(),
    config: z.string().optional(),
    config_ids: z.array(z.number()).optional(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    custom_status1_count: z.number().optional(),
    custom_status2_count: z.number().optional(),
    custom_status3_count: z.number().optional(),
    custom_status4_count: z.number().optional(),
    custom_status5_count: z.number().optional(),
    custom_status6_count: z.number().optional(),
    custom_status7_count: z.number().optional(),
    project_id: z.number(),
    plan_id: z.number().optional(),
    created_on: z.number(),
    created_by: z.number(),
    refs: z.string().optional(),
    url: z.string(),
});

export type Run = z.infer<typeof RunSchema>;

// ── Plan Entry & Plan Schemas ─────────────────────────────────────────────────

export const PlanEntrySchema = zObject({
    id: z.string(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    assignedto_id: z.number().optional(),
    include_all: z.boolean(),
    case_ids: z.array(z.number()).optional(),
    config_ids: z.array(z.number()).optional(),
    runs: z.array(RunSchema),
});

export type PlanEntry = z.infer<typeof PlanEntrySchema>;

export const PlanSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
    is_completed: z.boolean(),
    completed_on: z.number().optional(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    custom_status1_count: z.number().optional(),
    custom_status2_count: z.number().optional(),
    custom_status3_count: z.number().optional(),
    custom_status4_count: z.number().optional(),
    custom_status5_count: z.number().optional(),
    custom_status6_count: z.number().optional(),
    custom_status7_count: z.number().optional(),
    project_id: z.number(),
    created_on: z.number(),
    created_by: z.number(),
    url: z.string(),
    entries: z.array(PlanEntrySchema).optional(),
});

export type Plan = z.infer<typeof PlanSchema>;

// ── Test & Result Schemas ─────────────────────────────────────────────────────

export const TestSchema = zObject({
    id: z.number(),
    case_id: z.number(),
    status_id: z.number(),
    assignedto_id: z.number().optional(),
    run_id: z.number(),
    title: z.string(),
    template_id: z.number().optional(),
    type_id: z.number().optional(),
    priority_id: z.number().optional(),
    estimate: z.string().optional(),
    estimate_forecast: z.string().optional(),
    refs: z.string().optional(),
    milestone_id: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type Test = z.infer<typeof TestSchema>;

export const ResultSchema = zObject({
    id: z.number().optional(),
    test_id: z.number().optional(),
    status_id: z.number(),
    comment: z.string().optional(),
    version: z.string().optional(),
    elapsed: z.string().optional(),
    defects: z.string().optional(),
    assignedto_id: z.number().optional(),
    created_by: z.number().optional(),
    created_on: z.number().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export type Result = z.infer<typeof ResultSchema>;

// ── Milestone Schema ──────────────────────────────────────────────────────────

export const MilestoneSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    start_on: z.number().optional(),
    started_on: z.number().optional(),
    is_completed: z.boolean(),
    completed_on: z.number().optional(),
    due_on: z.number().optional(),
    project_id: z.number(),
    parent_id: z.number().optional(),
    refs: z.string().optional(),
    url: z.string(),
    // Sub-milestones are typed as unknown[] to avoid a recursive schema definition.
    milestones: z.array(z.unknown()).optional(),
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
    field: z.string().optional(),
    type_id: z.number().optional(),
    old_text: z.string().optional(),
    new_text: z.string().optional(),
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
    timestamp: z.number().optional(),
    created_on: z.number().optional(),
    changes: z.array(HistoryChangeSchema).optional(),
});

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

// ── Field Config Schemas ──────────────────────────────────────────────────────

const FieldConfigOptionsSchema = zObject({
    is_required: z.boolean(),
    default_value: z.string(),
    items: z.string().optional(),
    format: z.string().optional(),
    rows: z.string().optional(),
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
    description: z.string().optional(),
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
    description: z.string().optional(),
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

export const AttachmentSchema = zObject({
    attachment_id: z.number(),
    name: z.string(),
    filename: z.string().optional(),
    size: z.number().optional(),
    created_on: z.number().optional(),
    created_by: z.number().optional(),
    entity_id: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// ── Shared Steps Schema ───────────────────────────────────────────────────────

export const SharedStepSchema = zObject({
    id: z.number(),
    title: z.string(),
    project_id: z.number().optional(),
    case_ids: z.array(z.number()).optional(),
    created_on: z.number().optional(),
    created_by: z.number().optional(),
    updated_on: z.number().optional(),
    updated_by: z.number().optional(),
    custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type SharedStep = z.infer<typeof SharedStepSchema>;

// ── Variable & Dataset Schemas ────────────────────────────────────────────────

export const VariableSchema = zObject({
    id: z.number(),
    name: z.string(),
});

export type Variable = z.infer<typeof VariableSchema>;

export const DatasetSchema = zObject({
    id: z.number(),
    name: z.string(),
    project_id: z.number().optional(),
    created_on: z.number().optional(),
    created_by: z.number().optional(),
});

export type Dataset = z.infer<typeof DatasetSchema>;

// ── Report Schemas ────────────────────────────────────────────────────────────

export const ReportSchema = zObject({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    is_shared: z.boolean().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

export const ReportResultSchema = zObject({
    report_url: z.string(),
    user_report_url: z.string().optional(),
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
});

export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>;

export const AddPlanPayloadSchema = zObject({
    name: z.string(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    entries: z.array(AddPlanEntryPayloadSchema).optional(),
});

export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>;

export const UpdatePlanPayloadSchema = zObject({
    name: z.string().optional(),
    description: z.string().optional(),
    milestone_id: z.number().optional(),
    assignedto_id: z.number().optional(),
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
