import { z } from 'zod';

/**
 * Core schemas for common TestRail API structures.
 * These are used to validate API responses and provide static type inference via `z.infer`.
 */

// ── Common & Foundational Schemas ─────────────────────────────────────────────

export const PaginationSchema = z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
});

export const TestRailConfigSchema = z.object({
    baseUrl: z.string().url(),
    email: z.string().email(),
    apiKey: z.string().min(1),
    timeout: z.number().optional(),
    maxRetries: z.number().int().nonnegative().optional(),
    enableCache: z.boolean().optional(),
    cacheTtl: z.number().int().positive().optional(),
    cacheCleanupInterval: z.number().int().positive().optional(),
    maxCacheSize: z.number().int().positive().optional(),
    rateLimiter: z
        .object({
            maxRequests: z.number().int().positive(),
            windowMs: z.number().int().positive(),
        })
        .optional(),
    allowInsecure: z.boolean().optional(),
    allowPrivateHosts: z.boolean().optional(),
});

export type TestRailConfig = z.infer<typeof TestRailConfigSchema>;

// ── Identity & User Schemas ───────────────────────────────────────────────────

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    is_active: z.boolean().optional(),
    role_id: z.number().optional(),
    role: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const RoleSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type Role = z.infer<typeof RoleSchema>;

export const GroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    user_ids: z.array(z.number()).optional(),
});

export type Group = z.infer<typeof GroupSchema>;

// ── Project & Suite Schemas ────────────────────────────────────────────────────

export const ProjectSchema = z.object({
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

export const SuiteSchema = z.object({
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

export const CaseSchema = z.object({
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

export const SectionSchema = z.object({
    id: z.number(),
    suite_id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    parent_id: z.number().optional(),
    display_order: z.number(),
    depth: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

// ── Run Schema (forward declaration needed for PlanEntry) ─────────────────────

export const RunSchema = z.object({
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

export const PlanEntrySchema = z.object({
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

export const PlanSchema = z.object({
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

export const TestSchema = z.object({
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

export const ResultSchema = z.object({
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

export const MilestoneSchema = z.object({
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

export const StatusSchema = z.object({
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

export const PrioritySchema = z.object({
    id: z.number(),
    name: z.string(),
    short_name: z.string(),
    is_default: z.boolean(),
    priority: z.number(),
});

export type Priority = z.infer<typeof PrioritySchema>;

// ── Field Config Schemas ──────────────────────────────────────────────────────

const FieldConfigOptionsSchema = z.object({
    is_required: z.boolean(),
    default_value: z.string(),
    items: z.string().optional(),
    format: z.string().optional(),
    rows: z.string().optional(),
});

const FieldConfigContextSchema = z.object({
    is_global: z.boolean(),
    project_ids: z.array(z.number()),
});

export const CaseFieldConfigSchema = z.object({
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>;

export const CaseFieldSchema = z.object({
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

export const ResultFieldConfigSchema = z.object({
    context: FieldConfigContextSchema,
    options: FieldConfigOptionsSchema,
});

export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>;

export const ResultFieldSchema = z.object({
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

export const CaseTypeSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type CaseType = z.infer<typeof CaseTypeSchema>;

export const TemplateSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type Template = z.infer<typeof TemplateSchema>;

// ── Configuration Schemas ─────────────────────────────────────────────────────

export const ConfigurationSchema = z.object({
    id: z.number(),
    name: z.string(),
    group_id: z.number(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export const ConfigurationGroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    project_id: z.number(),
    configs: z.array(ConfigurationSchema),
});

export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>;

// ── Attachment Schema ─────────────────────────────────────────────────────────

export const AttachmentSchema = z.object({
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

export const SharedStepSchema = z.object({
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

export const VariableSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export type Variable = z.infer<typeof VariableSchema>;

export const DatasetSchema = z.object({
    id: z.number(),
    name: z.string(),
    project_id: z.number().optional(),
    created_on: z.number().optional(),
    created_by: z.number().optional(),
});

export type Dataset = z.infer<typeof DatasetSchema>;

// ── Report Schemas ────────────────────────────────────────────────────────────

export const ReportSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    is_shared: z.boolean().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

export const ReportResultSchema = z.object({
    report_url: z.string(),
    user_report_url: z.string().optional(),
});

export type ReportResult = z.infer<typeof ReportResultSchema>;
