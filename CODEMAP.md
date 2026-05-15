# CODEMAP

Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.

Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.

```json
{
  "schema": "codemap.v2",
  "repo": {
    "name": "@dichovsky/testrail-api-client",
    "version": "2.1.0"
  },
  "sourceHash": "5bef6df15cf8950859596261149d1dd90ad0a56141f6bb8a95f5e5ec05aa0457",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 480,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 469,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddConfigurationGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 456,
      "signature": "export interface AddConfigurationGroupPayload { name: string; }",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 466,
      "signature": "export interface AddConfigurationPayload { name: string; }",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 733,
      "signature": "export interface AddDatasetPayload { name: string; }",
      "jsdoc": "Payload for creating a dataset via POST /add_dataset/{project_id}",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 619,
      "signature": "export interface AddGroupPayload { name: string; user_ids?: number[]; }",
      "jsdoc": "Payload for creating a new group via POST /add_group (TestRail 7.5+)",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 308,
      "signature": "export interface AddMilestonePayload { name: string; description?: string; due_on?: number; start_on?: number; parent_id?: number; refs?: string; }",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 611,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 600,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 633,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 626,
      "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
    },
    {
      "name": "AddProjectPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 486,
      "signature": "export interface AddProjectPayload { name: string; announcement?: string; show_announcement?: boolean; suite_mode?: number; }",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 545,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 534,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 530,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 520,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 551,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 547,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 506,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 495,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 586,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 577,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
    },
    {
      "name": "AddSectionPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 296,
      "signature": "export interface AddSectionPayload { name: string; suite_id?: number; parent_id?: number; description?: string; }",
      "typeOnly": true
    },
    {
      "name": "AddSharedStepPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 679,
      "signature": "export interface AddSharedStepPayload { title: string; custom_steps_separated?: Record<string, unknown>[]; }",
      "jsdoc": "Payload for creating a shared step via POST /add_shared_step/{project_id} (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 76,
      "signature": "export interface AddSuitePayload { name: string; description?: string; }",
      "typeOnly": true
    },
    {
      "name": "AddUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 567,
      "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for creating a new user via POST /add_user (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 705,
      "signature": "export interface AddVariablePayload { name: string; }",
      "jsdoc": "Payload for creating a variable via POST /add_variable/{project_id}",
      "typeOnly": true
    },
    {
      "name": "Attachment",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 637,
      "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string; size?: number; created_on?: number; created_by?: number; entity_id?: number; }",
      "jsdoc": "An attachment metadata record returned by attachment list and upload endpoints",
      "typeOnly": true
    },
    {
      "name": "AttachmentSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 397,
      "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().optional(), size: z.number().optional(), created_on: z.number().optional(), created_by: z.nu…"
    },
    {
      "name": "Case",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 43,
      "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number; type_id?: number; priority_id?: number; milestone_id?: number; refs?: string; created_by: number; created_o…",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 404,
      "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…",
      "jsdoc": "Custom case field definition returned by get_case_fields",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 389,
      "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; }; }",
      "jsdoc": "Context/options configuration block shared by CaseField entries",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 312,
      "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 319,
      "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
    },
    {
      "name": "CaseSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 97,
      "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), m…"
    },
    {
      "name": "CaseType",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 424,
      "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case type definition returned by get_case_types",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 360,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Configuration",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 442,
      "signature": "export interface Configuration { id: number; name: string; group_id: number; }",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 449,
      "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\")",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 386,
      "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
    },
    {
      "name": "ConfigurationSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 378,
      "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
    },
    {
      "name": "Dataset",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 719,
      "signature": "export interface Dataset { id: number; name: string; project_id?: number; created_on?: number; created_by?: number; }",
      "jsdoc": "A dataset for data-driven testing",
      "typeOnly": true
    },
    {
      "name": "DatasetSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 434,
      "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().optional(), created_on: z.number().optional(), created_by: z.number().optional(), })"
    },
    {
      "name": "GetCasesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 263,
      "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…",
      "jsdoc": "Filter options for `getCases()`. All date filters accept Unix timestamps (seconds since epoch).",
      "typeOnly": true
    },
    {
      "name": "GetMilestonesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 555,
      "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 504,
      "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 537,
      "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 332,
      "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…",
      "typeOnly": true
    },
    {
      "name": "GetTestsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 524,
      "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 609,
      "signature": "export interface Group { id: number; name: string; user_ids?: number[]; }",
      "jsdoc": "A user group returned by GET /get_group and GET /get_groups (TestRail 7.5+)",
      "typeOnly": true
    },
    {
      "name": "GroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 58,
      "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).optional(), })"
    },
    {
      "name": "handleZodError",
      "kind": "function",
      "file": "src/errors.ts",
      "line": 33,
      "signature": "export function handleZodError(error: ZodError): TestRailValidationError",
      "jsdoc": "Utility to convert ZodError into TestRailValidationError."
    },
    {
      "name": "Milestone",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 211,
      "signature": "export interface Milestone { id: number; name: string; description?: string; start_on?: number; started_on?: number; is_completed: boolean; completed_on?: number; due_on?: number; project_id: number; …",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 252,
      "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), start_on: z.number().optional(), started_on: z.number().optional(), is_completed: z.boole…"
    },
    {
      "name": "PaginationSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 12,
      "signature": "export const PaginationSchema = zObject({ limit: z.number().optional(), offset: z.number().optional(), })",
      "jsdoc": "Core schemas for common TestRail API structures. These are used to validate API responses and provide static type inference via `z.infer`."
    },
    {
      "name": "Plan",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 108,
      "signature": "export interface Plan { id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; is_completed: boolean; completed_on?: number; passed_count: number; blocked_count…",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 135,
      "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string; assignedto_id?: number; include_all: boolean; case_ids?: number[]; config_ids?: number[]; runs: Run[]; }",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 570,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 560,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 170,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean(), cas…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 184,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), is_completed: z.boo…"
    },
    {
      "name": "Priority",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 248,
      "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 287,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 96,
      "signature": "export interface Project { id: number; name: string; announcement?: string; show_announcement?: boolean; is_completed?: boolean; completed_on?: number; suite_mode: number; url: string; }",
      "typeOnly": true
    },
    {
      "name": "ProjectSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 68,
      "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), is_completed: z.boolean().optional(), completed…"
    },
    {
      "name": "RateLimiterConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 481,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 747,
      "signature": "export interface Report { id: number; name: string; description?: string; is_shared?: boolean; }",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 759,
      "signature": "export interface ReportResult { report_url: string; user_report_url?: string; }",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 455,
      "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().optional(), })"
    },
    {
      "name": "ReportSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 446,
      "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), is_shared: z.boolean().optional(), })"
    },
    {
      "name": "Result",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 196,
      "signature": "export interface Result { id?: number; test_id?: number; status_id: number; comment?: string; version?: string; elapsed?: string; defects?: string; assignedto_id?: number; created_by?: number; created…",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 367,
      "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 353,
      "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; };…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 335,
      "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 342,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 234,
      "signature": "export const ResultSchema = zObject({ id: z.number().optional(), test_id: z.number().optional(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.strin…"
    },
    {
      "name": "Role",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 597,
      "signature": "export interface Role { id: number; name: string; is_default: boolean; }",
      "jsdoc": "A user role returned by GET /get_roles (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "RoleSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 50,
      "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Run",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 147,
      "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; include_all: boolean; is_completed: boolean; completed_on?: numb…",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 134,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional()…"
    },
    {
      "name": "Section",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 86,
      "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string; parent_id?: number; display_order: number; depth: number; }",
      "typeOnly": true
    },
    {
      "name": "SectionSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 120,
      "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), parent_id: z.number().optional(), display_order: z.number(), depth: z…"
    },
    {
      "name": "SharedStep",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 657,
      "signature": "export interface SharedStep { id: number; title: string; project_id?: number; case_ids?: number[]; created_on?: number; created_by?: number; updated_on?: number; updated_by?: number; custom_steps_sepa…",
      "jsdoc": "A shared step set returned by GET /get_shared_step (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "SharedStepSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 411,
      "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().optional(), case_ids: z.array(z.number()).optional(), created_on: z.number().optional(), created_by:…"
    },
    {
      "name": "Status",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 236,
      "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 273,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "Suite",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 64,
      "signature": "export interface Suite { id: number; name: string; description?: string; project_id: number; is_master?: boolean; is_baseline?: boolean; is_completed?: boolean; completed_on?: number; url: string; }",
      "typeOnly": true
    },
    {
      "name": "SuiteSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 81,
      "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), project_id: z.number(), is_master: z.boolean().optional(), is_baseline: z.boolean().optional(…"
    },
    {
      "name": "Template",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 433,
      "signature": "export interface Template { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+)",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 368,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Test",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 179,
      "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number; run_id: number; title: string; template_id?: number; type_id?: number; priority_id?: number; estimate?: …",
      "typeOnly": true
    },
    {
      "name": "TestRailApiError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 6,
      "signature": "export class TestRailApiError extends Error",
      "jsdoc": "Thrown when the TestRail API returns a non-2xx response or a network error occurs."
    },
    {
      "name": "TestRailClient",
      "kind": "class",
      "file": "src/client.ts",
      "line": 100,
      "signature": "export class TestRailClient extends TestRailClientCore",
      "jsdoc": "TestRail API Client"
    },
    {
      "name": "TestRailConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 4,
      "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…",
      "jsdoc": "TestRail API client configuration options",
      "typeOnly": true
    },
    {
      "name": "TestRailConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 17,
      "signature": "export const TestRailConfigSchema = zObject({ baseUrl: z.string().url(), email: z.string().email(), apiKey: z.string().min(1), timeout: z.number().optional(), maxRetries: z.number().int().nonnegative(…"
    },
    {
      "name": "TestRailValidationError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 20,
      "signature": "export class TestRailValidationError extends Error",
      "jsdoc": "Thrown when client configuration or method parameters fail validation."
    },
    {
      "name": "TestSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 215,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().optional(), run_id: z.number(), title: z.string(), template_id: z.number().opt…"
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 493,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 482,
      "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
    },
    {
      "name": "UpdateConfigurationGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 461,
      "signature": "export interface UpdateConfigurationGroupPayload { name?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 471,
      "signature": "export interface UpdateConfigurationPayload { name?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 739,
      "signature": "export interface UpdateDatasetPayload { name?: string; }",
      "jsdoc": "Payload for updating a dataset via POST /update_dataset/{dataset_id}",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 627,
      "signature": "export interface UpdateGroupPayload { name?: string; user_ids?: number[]; }",
      "jsdoc": "Payload for updating an existing group via POST /update_group/{group_id} (TestRail 7.5+)",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 319,
      "signature": "export interface UpdateMilestonePayload { name?: string; description?: string; due_on?: number; start_on?: number; parent_id?: number; refs?: string; is_completed?: boolean; is_started?: boolean; }",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 624,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 613,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 642,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 635,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 493,
      "signature": "export interface UpdateProjectPayload { name?: string; announcement?: string; show_announcement?: boolean; suite_mode?: number; }",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 598,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 591,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 518,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 508,
      "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
    },
    {
      "name": "UpdateSectionPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 303,
      "signature": "export interface UpdateSectionPayload { name?: string; description?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateSharedStepPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 687,
      "signature": "export interface UpdateSharedStepPayload { title?: string; custom_steps_separated?: Record<string, unknown>[]; }",
      "jsdoc": "Payload for updating a shared step via POST /update_shared_step/{shared_step_id} (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 81,
      "signature": "export interface UpdateSuitePayload { name?: string; description?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 581,
      "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 711,
      "signature": "export interface UpdateVariablePayload { name?: string; }",
      "jsdoc": "Payload for updating a variable via POST /update_variable/{variable_id}",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 227,
      "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number; role?: string; }",
      "typeOnly": true
    },
    {
      "name": "UserSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 39,
      "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().optional(), role: z.string().optional(), })"
    },
    {
      "name": "Variable",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 697,
      "signature": "export interface Variable { id: number; name: string; }",
      "jsdoc": "A variable used in data-driven testing",
      "typeOnly": true
    },
    {
      "name": "VariableSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 427,
      "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
    }
  ],
  "files": [
    {
      "path": "src/cli.ts",
      "imports": [
        "./cli/index.js"
      ],
      "reExports": [],
      "symbols": []
    },
    {
      "path": "src/cli/auth.ts",
      "imports": [
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "AuthFlags",
          "kind": "interface",
          "line": 3,
          "exported": true,
          "signature": "export interface AuthFlags { baseUrl: string | undefined; email: string | undefined; apiKey: string | undefined; }"
        },
        {
          "name": "AuthEnv",
          "kind": "interface",
          "line": 9,
          "exported": true,
          "signature": "export interface AuthEnv { TESTRAIL_BASE_URL?: string; TESTRAIL_EMAIL?: string; TESTRAIL_API_KEY?: string; }"
        },
        {
          "name": "AuthResolution",
          "kind": "type",
          "line": 15,
          "exported": true,
          "signature": "export type AuthResolution = { ok: true; config: TestRailConfig } | { ok: false; error: string }"
        },
        {
          "name": "MISSING_AUTH_MESSAGE",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const MISSING_AUTH_MESSAGE = 'Missing auth. Set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, TESTRAIL_API_KEY or use --base-url, --email, --api-key flags.'"
        },
        {
          "name": "resolveAuth",
          "kind": "function",
          "line": 20,
          "exported": true,
          "signature": "export function resolveAuth(flags: AuthFlags, env: AuthEnv): AuthResolution"
        }
      ]
    },
    {
      "path": "src/cli/body.ts",
      "imports": [
        "./handler-context.js",
        "node:fs",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BodySource",
          "kind": "type",
          "line": 10,
          "exported": true,
          "signature": "export type BodySource = 'data' | 'file' | 'stdin'"
        },
        {
          "name": "BodyResolution",
          "kind": "type",
          "line": 12,
          "exported": true,
          "signature": "export type BodyResolution<T> = { ok: true; payload: T; source: BodySource } | { ok: false; error: string }"
        },
        {
          "name": "resolveBody",
          "kind": "function",
          "line": 38,
          "exported": true,
          "signature": "export function resolveBody<S extends z.ZodTypeAny>(input: BodyInput, schema: S): BodyResolution<z.infer<S>>"
        }
      ]
    },
    {
      "path": "src/cli/dispatch.ts",
      "imports": [
        "./handler-context.js",
        "./handlers/attachment-write.js",
        "./handlers/attachment.js",
        "./handlers/case-write.js",
        "./handlers/case.js",
        "./handlers/milestone.js",
        "./handlers/plan-write.js",
        "./handlers/plan.js",
        "./handlers/project.js",
        "./handlers/result-write.js",
        "./handlers/result.js",
        "./handlers/run-write.js",
        "./handlers/run.js",
        "./handlers/suite.js",
        "./handlers/user.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HANDLERS",
          "kind": "const",
          "line": 42,
          "exported": false,
          "signature": "const HANDLERS: Record<string, Handler> = { 'project:get': handleProjectGet, 'project:list': handleProjectList, 'suite:get': handleSuiteGet, 'suite:list': handleSuiteList, 'case:get': handleCaseGet, '…"
        },
        {
          "name": "RESOURCES",
          "kind": "const",
          "line": 81,
          "exported": false,
          "signature": "const RESOURCES: Record<string, readonly string[]> = (() => { const grouped: Record<string, string[]> = {}; for (const key of Object.keys(HANDLERS)) { const [resource, action] = key.split(':'); if (re…"
        },
        {
          "name": "DispatchResult",
          "kind": "type",
          "line": 96,
          "exported": true,
          "signature": "export type DispatchResult = { ok: true; handler: Handler } | { ok: false; error: string }"
        },
        {
          "name": "getRegisteredActions",
          "kind": "function",
          "line": 103,
          "exported": true,
          "signature": "export function getRegisteredActions(): readonly string[]"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 107,
          "exported": true,
          "signature": "export function dispatch(resource: string, action: string): DispatchResult"
        }
      ]
    },
    {
      "path": "src/cli/file-input.ts",
      "imports": [
        "node:fs",
        "node:path"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "FileInput",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface FileInput { fileFlag?: string; filenameFlag?: string; }"
        },
        {
          "name": "FileResolution",
          "kind": "type",
          "line": 20,
          "exported": true,
          "signature": "export type FileResolution = | { ok: true; path: string; filename: string; size: number; contents?: Uint8Array } | { ok: false; error: string }"
        },
        {
          "name": "ResolveFileOptions",
          "kind": "interface",
          "line": 24,
          "exported": true,
          "signature": "export interface ResolveFileOptions { read: boolean; }"
        },
        {
          "name": "resolveFile",
          "kind": "function",
          "line": 38,
          "exported": true,
          "signature": "export function resolveFile(input: FileInput, opts: ResolveFileOptions): FileResolution"
        }
      ]
    },
    {
      "path": "src/cli/file-output.ts",
      "imports": [
        "node:fs"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "FileOutput",
          "kind": "interface",
          "line": 7,
          "exported": true,
          "signature": "export interface FileOutput { outFlag?: string; }"
        },
        {
          "name": "OutputResolution",
          "kind": "type",
          "line": 11,
          "exported": true,
          "signature": "export type OutputResolution = { ok: true; path: string } | { ok: false; error: string }"
        },
        {
          "name": "ResolveOutOptions",
          "kind": "interface",
          "line": 13,
          "exported": true,
          "signature": "export interface ResolveOutOptions { force: boolean; dryRun: boolean; }"
        },
        {
          "name": "resolveOut",
          "kind": "function",
          "line": 27,
          "exported": true,
          "signature": "export function resolveOut(input: FileOutput, opts: ResolveOutOptions): OutputResolution"
        }
      ]
    },
    {
      "path": "src/cli/handler-context.ts",
      "imports": [
        "../client.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HandlerArgs",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface HandlerArgs { pathParams: readonly string[]; projectId?: string; suiteId?: string; runId?: string; caseId?: string; limit?: string; offset?: string; file?: string; filename?: string; …"
        },
        {
          "name": "BodyInput",
          "kind": "interface",
          "line": 38,
          "exported": true,
          "signature": "export interface BodyInput { dataFlag?: string; dataFileFlag?: string; readStdin?: () => string; }"
        },
        {
          "name": "HandlerContext",
          "kind": "interface",
          "line": 44,
          "exported": true,
          "signature": "export interface HandlerContext { client: TestRailClient; args: HandlerArgs; bodyInput: BodyInput; dryRun: boolean; force: boolean; confirmDestructive: boolean; out: (data: unknown) => void; }"
        },
        {
          "name": "Handler",
          "kind": "type",
          "line": 58,
          "exported": true,
          "signature": "export type Handler = (ctx: HandlerContext) => Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/attachment-write.ts",
      "imports": [
        "../file-input.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResolvedUpload",
          "kind": "interface",
          "line": 10,
          "exported": false,
          "signature": "interface ResolvedUpload { filename: string; contents: Uint8Array; }"
        },
        {
          "name": "setupUpload",
          "kind": "function",
          "line": 21,
          "exported": false,
          "signature": "function setupUpload(ctx: HandlerContext, action: string, idFields: Record<string, number>): ResolvedUpload | null"
        },
        {
          "name": "handleAttachmentAddToCase",
          "kind": "function",
          "line": 50,
          "exported": true,
          "signature": "export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToResult",
          "kind": "function",
          "line": 57,
          "exported": true,
          "signature": "export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToRun",
          "kind": "function",
          "line": 64,
          "exported": true,
          "signature": "export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlan",
          "kind": "function",
          "line": 71,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlanEntry",
          "kind": "function",
          "line": 78,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentDelete",
          "kind": "function",
          "line": 91,
          "exported": true,
          "signature": "export async function handleAttachmentDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/attachment.ts",
      "imports": [
        "../file-output.js",
        "../handler-context.js",
        "../ids.js",
        "node:fs"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleAttachmentListForCase",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleAttachmentListForCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForRun",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleAttachmentListForRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForTest",
          "kind": "function",
          "line": 16,
          "exported": true,
          "signature": "export async function handleAttachmentListForTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlan",
          "kind": "function",
          "line": 21,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlanEntry",
          "kind": "function",
          "line": 26,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentGet",
          "kind": "function",
          "line": 38,
          "exported": true,
          "signature": "export async function handleAttachmentGet(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleCaseAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseUpdate",
          "kind": "function",
          "line": 17,
          "exported": true,
          "signature": "export async function handleCaseUpdate(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleCaseGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleCaseList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/milestone.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleMilestoneGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleMilestoneGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleMilestoneList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/plan-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePlanAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handlePlanAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdate",
          "kind": "function",
          "line": 17,
          "exported": true,
          "signature": "export async function handlePlanUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanAddEntry",
          "kind": "function",
          "line": 28,
          "exported": true,
          "signature": "export async function handlePlanAddEntry(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/plan.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePlanGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handlePlanGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handlePlanList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/project.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleProjectGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleProjectGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleProjectList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/result-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleResultAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultAddBulk",
          "kind": "function",
          "line": 25,
          "exported": true,
          "signature": "export async function handleResultAddBulk(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/result.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultList",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleResultList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/run-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRunAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleRunAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunClose",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleRunClose(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/run.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRunGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleRunGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleRunList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/suite.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSuiteGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleSuiteGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSuiteList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleSuiteList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/user.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleUserGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleUserGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleUserList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/ids.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "IdParseError",
          "kind": "class",
          "line": 1,
          "exported": true,
          "signature": "export class IdParseError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 2
            }
          ]
        },
        {
          "name": "parseId",
          "kind": "function",
          "line": 8,
          "exported": true,
          "signature": "export function parseId(raw: string | undefined, name: string): number"
        },
        {
          "name": "optInt",
          "kind": "function",
          "line": 16,
          "exported": true,
          "signature": "export function optInt(raw: string | undefined): number | undefined"
        }
      ]
    },
    {
      "path": "src/cli/index.ts",
      "imports": [
        "../client.js",
        "./auth.js",
        "./dispatch.js",
        "./handler-context.js",
        "./install-skill.js",
        "./metadata.js",
        "./output.js",
        "node:fs",
        "node:module",
        "node:util"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "require",
          "kind": "const",
          "line": 15,
          "exported": false,
          "signature": "const require = createRequire(import.meta.url)"
        },
        {
          "name": "VERSION",
          "kind": "const",
          "line": 16,
          "exported": false,
          "signature": "const VERSION: string = (require('../../package.json') as { version: string }).version"
        },
        {
          "name": "HELP",
          "kind": "const",
          "line": 20,
          "exported": false,
          "signature": "const HELP = `\ntestrail <resource> <action> [args] [options]\n\nRead actions:\n  project  get <id> | list [--limit N] [--offset N]\n  suite    get <id> | list --project-id <id>\n  case     get <id> | list …"
        },
        {
          "name": "main",
          "kind": "function",
          "line": 102,
          "exported": false,
          "signature": "async function main(): Promise<number>"
        }
      ]
    },
    {
      "path": "src/cli/install-skill.ts",
      "imports": [
        "node:fs",
        "node:os",
        "node:path",
        "node:url"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "InstallSkillOptions",
          "kind": "interface",
          "line": 21,
          "exported": true,
          "signature": "export interface InstallSkillOptions { global: boolean; force: boolean; printPath: boolean; quiet: boolean; sourceOverride?: string; cwdOverride?: string; homeOverride?: string; }"
        },
        {
          "name": "getBundledSkillPath",
          "kind": "function",
          "line": 40,
          "exported": true,
          "signature": "export function getBundledSkillPath(metaUrl: string): string"
        },
        {
          "name": "runInstallSkill",
          "kind": "function",
          "line": 44,
          "exported": true,
          "signature": "export function runInstallSkill(opts: InstallSkillOptions, metaUrl: string): number"
        }
      ]
    },
    {
      "path": "src/cli/metadata.ts",
      "imports": [
        "../schemas.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PathParam",
          "kind": "interface",
          "line": 30,
          "exported": true,
          "signature": "export interface PathParam { name: string; description: string; }"
        },
        {
          "name": "ActionSpec",
          "kind": "interface",
          "line": 35,
          "exported": true,
          "signature": "export interface ActionSpec { resource: string; action: string; summary: string; pathParams: readonly PathParam[]; bodySchema?: z.ZodTypeAny; fileInput?: boolean; fileOutput?: boolean; isWrite: boolea…"
        },
        {
          "name": "ACTIONS",
          "kind": "const",
          "line": 58,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ { resource: 'project', action: 'get', summary: 'Fetch a single project by ID', pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 343,
          "exported": true,
          "signature": "export function getActionSpec(resource: string, action: string): ActionSpec | undefined"
        }
      ]
    },
    {
      "path": "src/cli/output.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "OutputOptions",
          "kind": "interface",
          "line": 1,
          "exported": true,
          "signature": "export interface OutputOptions { quiet: boolean; format: 'json' | 'table'; }"
        },
        {
          "name": "Output",
          "kind": "interface",
          "line": 6,
          "exported": true,
          "signature": "export interface Output { out: (data: unknown) => void; err: (message: string) => void; }"
        },
        {
          "name": "valueToString",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export function valueToString(v: unknown): string"
        },
        {
          "name": "getField",
          "kind": "function",
          "line": 27,
          "exported": false,
          "signature": "function getField(row: unknown, key: string): unknown"
        },
        {
          "name": "renderTable",
          "kind": "function",
          "line": 32,
          "exported": true,
          "signature": "export function renderTable(data: unknown): string"
        },
        {
          "name": "safeJsonStringify",
          "kind": "function",
          "line": 68,
          "exported": true,
          "signature": "export function safeJsonStringify(data: unknown): string"
        },
        {
          "name": "createOutput",
          "kind": "function",
          "line": 83,
          "exported": true,
          "signature": "export function createOutput(opts: OutputOptions): Output"
        }
      ]
    },
    {
      "path": "src/client-core.ts",
      "imports": [
        "../package.json",
        "./constants.js",
        "./errors.js",
        "./types.js",
        "./utils.js",
        "node:net",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "USER_AGENT",
          "kind": "const",
          "line": 8,
          "exported": false,
          "signature": "const USER_AGENT = `${pkg.description}/${pkg.version}`"
        },
        {
          "name": "PRIVATE_HOST_PATTERNS",
          "kind": "const",
          "line": 30,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^0\\./, ]"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 43,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 65,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 97,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string): Promise<void>"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 129,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 130,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 133,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 139,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 162,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 163
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 166
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 167
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 168
            },
            {
              "name": "enableCache",
              "kind": "property",
              "line": 169
            },
            {
              "name": "cacheTtl",
              "kind": "property",
              "line": 170
            },
            {
              "name": "cacheCleanupInterval",
              "kind": "property",
              "line": 171
            },
            {
              "name": "maxCacheSize",
              "kind": "property",
              "line": 172
            },
            {
              "name": "cache",
              "kind": "property",
              "line": 173
            },
            {
              "name": "cacheCleanupTimer",
              "kind": "property",
              "line": 174
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 175
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 176
            },
            {
              "name": "dnsValidationPromise",
              "kind": "property",
              "line": 177
            },
            {
              "name": "dnsValidationError",
              "kind": "property",
              "line": 178
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 180
            },
            {
              "name": "validateConfig",
              "kind": "method",
              "line": 230
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 335
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 345
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 371
            },
            {
              "name": "validateId",
              "kind": "method",
              "line": 399
            },
            {
              "name": "validateEntryId",
              "kind": "method",
              "line": 409
            },
            {
              "name": "validatePaginationParams",
              "kind": "method",
              "line": 419
            },
            {
              "name": "buildEndpoint",
              "kind": "method",
              "line": 438
            },
            {
              "name": "getCachedData",
              "kind": "method",
              "line": 450
            },
            {
              "name": "setCachedData",
              "kind": "method",
              "line": 471
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 493
            },
            {
              "name": "startCacheCleanup",
              "kind": "method",
              "line": 497
            },
            {
              "name": "stopCacheCleanup",
              "kind": "method",
              "line": 508
            },
            {
              "name": "cleanupExpiredCache",
              "kind": "method",
              "line": 515
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 538
            },
            {
              "name": "request",
              "kind": "method",
              "line": 565
            },
            {
              "name": "requestMultipart",
              "kind": "method",
              "line": 694
            },
            {
              "name": "requestBinary",
              "kind": "method",
              "line": 778
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 841
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 867
            }
          ]
        }
      ]
    },
    {
      "path": "src/client.ts",
      "imports": [
        "./client-core.js",
        "./modules/attachments.js",
        "./modules/cases.js",
        "./modules/configurations.js",
        "./modules/datasets.js",
        "./modules/metadata.js",
        "./modules/milestones.js",
        "./modules/plans.js",
        "./modules/projects.js",
        "./modules/reports.js",
        "./modules/results.js",
        "./modules/runs.js",
        "./modules/sections.js",
        "./modules/sharedSteps.js",
        "./modules/suites.js",
        "./modules/tests.js",
        "./modules/users.js",
        "./modules/variables.js",
        "./schemas.js",
        "./types.js"
      ],
      "reExports": [
        "./errors.js"
      ],
      "symbols": [
        {
          "name": "TestRailClient",
          "kind": "class",
          "line": 100,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 102
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 103
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 104
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 105
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 106
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 107
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 108
            },
            {
              "name": "results",
              "kind": "property",
              "line": 109
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 110
            },
            {
              "name": "users",
              "kind": "property",
              "line": 111
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 112
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 113
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 114
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 115
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 116
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 117
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 118
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 120
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 148
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 157
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 165
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 174
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 183
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 194
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 203
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 212
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 221
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 230
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 241
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 253
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 265
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 274
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 283
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 294
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 315
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 324
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 333
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 342
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 353
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 365
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 374
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 383
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 392
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 401
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 410
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 419
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 428
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 437
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 446
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 455
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 466
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 478
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 487
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 496
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 505
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 514
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 525
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 536
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 550
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 563
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 575
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 584
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 593
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 602
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 613
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 625
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 637
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 649
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 660
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 673
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 684
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 697
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 705
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 715
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 727
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 737
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 747
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 757
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 767
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 775
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 788
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 801
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 813
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 825
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 839
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 851
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 863
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 874
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 884
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 897
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 905
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 915
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 927
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 938
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 951
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 962
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 973
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 984
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 996
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 1007
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 1020
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 1037
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 1054
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 1071
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 1089
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 1105
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 1118
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 1129
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 1141
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 1153
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 1164
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 1177
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 1189
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 1201
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 1212
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 1225
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 1236
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 1248
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 1260
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 1271
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 1284
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 1295
            }
          ]
        }
      ]
    },
    {
      "path": "src/constants.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "BASE_RETRY_DELAY_MS",
          "kind": "const",
          "line": 2,
          "exported": true,
          "signature": "export const BASE_RETRY_DELAY_MS = 1000"
        },
        {
          "name": "MAX_RETRY_DELAY_MS",
          "kind": "const",
          "line": 3,
          "exported": true,
          "signature": "export const MAX_RETRY_DELAY_MS = 10000"
        },
        {
          "name": "MAX_TIMEOUT_MS",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const MAX_TIMEOUT_MS = 5 * 60 * 1000"
        },
        {
          "name": "DEFAULT_TIMEOUT_MS",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const DEFAULT_TIMEOUT_MS = 30000"
        },
        {
          "name": "DEFAULT_MAX_RETRIES",
          "kind": "const",
          "line": 10,
          "exported": true,
          "signature": "export const DEFAULT_MAX_RETRIES = 3"
        },
        {
          "name": "DEFAULT_CACHE_TTL_MS",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const DEFAULT_CACHE_TTL_MS = 300000"
        },
        {
          "name": "DEFAULT_CACHE_CLEANUP_INTERVAL_MS",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const DEFAULT_CACHE_CLEANUP_INTERVAL_MS = 60000"
        },
        {
          "name": "DEFAULT_MAX_CACHE_SIZE",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const DEFAULT_MAX_CACHE_SIZE = 1000"
        },
        {
          "name": "DEFAULT_RATE_LIMIT_MAX_REQUESTS",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100"
        },
        {
          "name": "DEFAULT_RATE_LIMIT_WINDOW_MS",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000"
        },
        {
          "name": "DEFAULT_DNS_VALIDATION_MAX_WAIT_MS",
          "kind": "const",
          "line": 16,
          "exported": true,
          "signature": "export const DEFAULT_DNS_VALIDATION_MAX_WAIT_MS = 2000"
        }
      ]
    },
    {
      "path": "src/errors.ts",
      "imports": [
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestRailApiError",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class TestRailApiError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            }
          ]
        },
        {
          "name": "TestRailValidationError",
          "kind": "class",
          "line": 20,
          "exported": true,
          "signature": "export class TestRailValidationError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 21
            }
          ]
        },
        {
          "name": "handleZodError",
          "kind": "function",
          "line": 33,
          "exported": true,
          "signature": "export function handleZodError(error: ZodError): TestRailValidationError"
        }
      ]
    },
    {
      "path": "src/index.ts",
      "imports": [],
      "reExports": [
        "./client.js",
        "./errors.js",
        "./schemas.js",
        "./types.js"
      ],
      "symbols": []
    },
    {
      "path": "src/modules/attachments.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "AttachmentModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class AttachmentModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 9
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 20
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 31
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 42
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 53
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 65
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 70
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 79
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 88
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 97
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 106
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 121
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/cases.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "CaseModule",
          "kind": "class",
          "line": 7,
          "exported": true,
          "signature": "export class CaseModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 10
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 15
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 58
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 66
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 74
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/configurations.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ConfigurationModule",
          "kind": "class",
          "line": 13,
          "exported": true,
          "signature": "export class ConfigurationModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 14
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 16
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 24
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 32
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 43
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 48
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 56
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 64
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/datasets.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "DatasetModule",
          "kind": "class",
          "line": 5,
          "exported": true,
          "signature": "export class DatasetModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 6
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 8
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 16
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 24
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 32
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 40
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/metadata.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "MetadataModule",
          "kind": "class",
          "line": 14,
          "exported": true,
          "signature": "export class MetadataModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 15
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 17
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 24
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 31
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 38
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 45
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 52
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 60
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/milestones.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "MilestoneModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class MilestoneModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 9
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 17
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 34
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 42
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 50
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/plans.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PlanModule",
          "kind": "class",
          "line": 17,
          "exported": true,
          "signature": "export class PlanModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 18
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 20
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 25
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 43
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 51
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 59
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 64
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 69
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 77
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 86
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 92
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 101
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 109
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/projects.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ProjectModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class ProjectModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 24
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 38
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 50
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 63
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/reports.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ReportModule",
          "kind": "class",
          "line": 5,
          "exported": true,
          "signature": "export class ReportModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 6
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 8
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 16
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/results.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResultModule",
          "kind": "class",
          "line": 8,
          "exported": true,
          "signature": "export class ResultModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 9
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 11
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 29
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 48
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 66
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 74
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 83
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/runs.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RunModule",
          "kind": "class",
          "line": 7,
          "exported": true,
          "signature": "export class RunModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 10
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 15
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 45
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 53
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 61
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 66
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/sections.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SectionModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class SectionModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 9
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 17
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 35
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 43
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 51
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/sharedSteps.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SharedStepModule",
          "kind": "class",
          "line": 5,
          "exported": true,
          "signature": "export class SharedStepModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 6
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 8
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 16
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 24
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 32
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 40
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/suites.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SuiteModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class SuiteModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 24
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 37
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 50
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 63
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/tests.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestModule",
          "kind": "class",
          "line": 7,
          "exported": true,
          "signature": "export class TestModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 10
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 15
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/users.ts",
      "imports": [
        "../client-core.js",
        "../errors.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "EMAIL_REGEX",
          "kind": "const",
          "line": 7,
          "exported": false,
          "signature": "const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/"
        },
        {
          "name": "UsersModule",
          "kind": "class",
          "line": 9,
          "exported": true,
          "signature": "export class UsersModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 10
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 12
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 17
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 26
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 43
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 47
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 51
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 59
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 64
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 71
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 75
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 83
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/variables.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "VariableModule",
          "kind": "class",
          "line": 5,
          "exported": true,
          "signature": "export class VariableModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 6
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 8
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 16
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 24
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 32
            }
          ]
        }
      ]
    },
    {
      "path": "src/schemas.ts",
      "imports": [
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "zObject",
          "kind": "const",
          "line": 3,
          "exported": false,
          "signature": "const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough()"
        },
        {
          "name": "PaginationSchema",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const PaginationSchema = zObject({ limit: z.number().optional(), offset: z.number().optional(), })"
        },
        {
          "name": "TestRailConfigSchema",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const TestRailConfigSchema = zObject({ baseUrl: z.string().url(), email: z.string().email(), apiKey: z.string().min(1), timeout: z.number().optional(), maxRetries: z.number().int().nonnegative(…"
        },
        {
          "name": "TestRailConfig",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type TestRailConfig = z.infer<typeof TestRailConfigSchema>"
        },
        {
          "name": "UserSchema",
          "kind": "const",
          "line": 39,
          "exported": true,
          "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().optional(), role: z.string().optional(), })"
        },
        {
          "name": "User",
          "kind": "type",
          "line": 48,
          "exported": true,
          "signature": "export type User = z.infer<typeof UserSchema>"
        },
        {
          "name": "RoleSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Role",
          "kind": "type",
          "line": 56,
          "exported": true,
          "signature": "export type Role = z.infer<typeof RoleSchema>"
        },
        {
          "name": "GroupSchema",
          "kind": "const",
          "line": 58,
          "exported": true,
          "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "Group",
          "kind": "type",
          "line": 64,
          "exported": true,
          "signature": "export type Group = z.infer<typeof GroupSchema>"
        },
        {
          "name": "ProjectSchema",
          "kind": "const",
          "line": 68,
          "exported": true,
          "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), is_completed: z.boolean().optional(), completed…"
        },
        {
          "name": "Project",
          "kind": "type",
          "line": 79,
          "exported": true,
          "signature": "export type Project = z.infer<typeof ProjectSchema>"
        },
        {
          "name": "SuiteSchema",
          "kind": "const",
          "line": 81,
          "exported": true,
          "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), project_id: z.number(), is_master: z.boolean().optional(), is_baseline: z.boolean().optional(…"
        },
        {
          "name": "Suite",
          "kind": "type",
          "line": 93,
          "exported": true,
          "signature": "export type Suite = z.infer<typeof SuiteSchema>"
        },
        {
          "name": "CaseSchema",
          "kind": "const",
          "line": 97,
          "exported": true,
          "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), m…"
        },
        {
          "name": "Case",
          "kind": "type",
          "line": 118,
          "exported": true,
          "signature": "export type Case = z.infer<typeof CaseSchema>"
        },
        {
          "name": "SectionSchema",
          "kind": "const",
          "line": 120,
          "exported": true,
          "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), parent_id: z.number().optional(), display_order: z.number(), depth: z…"
        },
        {
          "name": "Section",
          "kind": "type",
          "line": 130,
          "exported": true,
          "signature": "export type Section = z.infer<typeof SectionSchema>"
        },
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 134,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional()…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 166,
          "exported": true,
          "signature": "export type Run = z.infer<typeof RunSchema>"
        },
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 170,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean(), cas…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 182,
          "exported": true,
          "signature": "export type PlanEntry = z.infer<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 184,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), is_completed: z.boo…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 211,
          "exported": true,
          "signature": "export type Plan = z.infer<typeof PlanSchema>"
        },
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 215,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().optional(), run_id: z.number(), title: z.string(), template_id: z.number().opt…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 232,
          "exported": true,
          "signature": "export type Test = z.infer<typeof TestSchema>"
        },
        {
          "name": "ResultSchema",
          "kind": "const",
          "line": 234,
          "exported": true,
          "signature": "export const ResultSchema = zObject({ id: z.number().optional(), test_id: z.number().optional(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.strin…"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 248,
          "exported": true,
          "signature": "export type Result = z.infer<typeof ResultSchema>"
        },
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 252,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), start_on: z.number().optional(), started_on: z.number().optional(), is_completed: z.boole…"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 269,
          "exported": true,
          "signature": "export type Milestone = z.infer<typeof MilestoneSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 273,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 285,
          "exported": true,
          "signature": "export type Status = z.infer<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 287,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 295,
          "exported": true,
          "signature": "export type Priority = z.infer<typeof PrioritySchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 299,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string(), items: z.string().optional(), format: z.string().optional(), rows: z.string().optional(), })"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 307,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 312,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 317,
          "exported": true,
          "signature": "export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 319,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 333,
          "exported": true,
          "signature": "export type CaseField = z.infer<typeof CaseFieldSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 335,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 340,
          "exported": true,
          "signature": "export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 342,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 356,
          "exported": true,
          "signature": "export type ResultField = z.infer<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 360,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 366,
          "exported": true,
          "signature": "export type CaseType = z.infer<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 368,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 374,
          "exported": true,
          "signature": "export type Template = z.infer<typeof TemplateSchema>"
        },
        {
          "name": "ConfigurationSchema",
          "kind": "const",
          "line": 378,
          "exported": true,
          "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 384,
          "exported": true,
          "signature": "export type Configuration = z.infer<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroupSchema",
          "kind": "const",
          "line": 386,
          "exported": true,
          "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 393,
          "exported": true,
          "signature": "export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "AttachmentSchema",
          "kind": "const",
          "line": 397,
          "exported": true,
          "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().optional(), size: z.number().optional(), created_on: z.number().optional(), created_by: z.nu…"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 407,
          "exported": true,
          "signature": "export type Attachment = z.infer<typeof AttachmentSchema>"
        },
        {
          "name": "SharedStepSchema",
          "kind": "const",
          "line": 411,
          "exported": true,
          "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().optional(), case_ids: z.array(z.number()).optional(), created_on: z.number().optional(), created_by:…"
        },
        {
          "name": "SharedStep",
          "kind": "type",
          "line": 423,
          "exported": true,
          "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>"
        },
        {
          "name": "VariableSchema",
          "kind": "const",
          "line": 427,
          "exported": true,
          "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
        },
        {
          "name": "Variable",
          "kind": "type",
          "line": 432,
          "exported": true,
          "signature": "export type Variable = z.infer<typeof VariableSchema>"
        },
        {
          "name": "DatasetSchema",
          "kind": "const",
          "line": 434,
          "exported": true,
          "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().optional(), created_on: z.number().optional(), created_by: z.number().optional(), })"
        },
        {
          "name": "Dataset",
          "kind": "type",
          "line": 442,
          "exported": true,
          "signature": "export type Dataset = z.infer<typeof DatasetSchema>"
        },
        {
          "name": "ReportSchema",
          "kind": "const",
          "line": 446,
          "exported": true,
          "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), is_shared: z.boolean().optional(), })"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 453,
          "exported": true,
          "signature": "export type Report = z.infer<typeof ReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 455,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().optional(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 460,
          "exported": true,
          "signature": "export type ReportResult = z.infer<typeof ReportResultSchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 469,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 480,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 482,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 493,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 495,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 506,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 508,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 518,
          "exported": true,
          "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 520,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 530,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 534,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 545,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 547,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 551,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 560,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 570,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 577,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 586,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 591,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 598,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 600,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 611,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 613,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 624,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 626,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 633,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 635,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 642,
          "exported": true,
          "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/types.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "TestRailConfig",
          "kind": "interface",
          "line": 4,
          "exported": true,
          "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…"
        },
        {
          "name": "Case",
          "kind": "interface",
          "line": 43,
          "exported": true,
          "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number; type_id?: number; priority_id?: number; milestone_id?: number; refs?: string; created_by: number; created_o…"
        },
        {
          "name": "Suite",
          "kind": "interface",
          "line": 64,
          "exported": true,
          "signature": "export interface Suite { id: number; name: string; description?: string; project_id: number; is_master?: boolean; is_baseline?: boolean; is_completed?: boolean; completed_on?: number; url: string; }"
        },
        {
          "name": "AddSuitePayload",
          "kind": "interface",
          "line": 76,
          "exported": true,
          "signature": "export interface AddSuitePayload { name: string; description?: string; }"
        },
        {
          "name": "UpdateSuitePayload",
          "kind": "interface",
          "line": 81,
          "exported": true,
          "signature": "export interface UpdateSuitePayload { name?: string; description?: string; }"
        },
        {
          "name": "Section",
          "kind": "interface",
          "line": 86,
          "exported": true,
          "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string; parent_id?: number; display_order: number; depth: number; }"
        },
        {
          "name": "Project",
          "kind": "interface",
          "line": 96,
          "exported": true,
          "signature": "export interface Project { id: number; name: string; announcement?: string; show_announcement?: boolean; is_completed?: boolean; completed_on?: number; suite_mode: number; url: string; }"
        },
        {
          "name": "Plan",
          "kind": "interface",
          "line": 108,
          "exported": true,
          "signature": "export interface Plan { id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; is_completed: boolean; completed_on?: number; passed_count: number; blocked_count…"
        },
        {
          "name": "PlanEntry",
          "kind": "interface",
          "line": 135,
          "exported": true,
          "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string; assignedto_id?: number; include_all: boolean; case_ids?: number[]; config_ids?: number[]; runs: Run[]; }"
        },
        {
          "name": "Run",
          "kind": "interface",
          "line": 147,
          "exported": true,
          "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; include_all: boolean; is_completed: boolean; completed_on?: numb…"
        },
        {
          "name": "Test",
          "kind": "interface",
          "line": 179,
          "exported": true,
          "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number; run_id: number; title: string; template_id?: number; type_id?: number; priority_id?: number; estimate?: …"
        },
        {
          "name": "Result",
          "kind": "interface",
          "line": 196,
          "exported": true,
          "signature": "export interface Result { id?: number; test_id?: number; status_id: number; comment?: string; version?: string; elapsed?: string; defects?: string; assignedto_id?: number; created_by?: number; created…"
        },
        {
          "name": "Milestone",
          "kind": "interface",
          "line": 211,
          "exported": true,
          "signature": "export interface Milestone { id: number; name: string; description?: string; start_on?: number; started_on?: number; is_completed: boolean; completed_on?: number; due_on?: number; project_id: number; …"
        },
        {
          "name": "User",
          "kind": "interface",
          "line": 227,
          "exported": true,
          "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number; role?: string; }"
        },
        {
          "name": "Status",
          "kind": "interface",
          "line": 236,
          "exported": true,
          "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }"
        },
        {
          "name": "Priority",
          "kind": "interface",
          "line": 248,
          "exported": true,
          "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 263,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…"
        },
        {
          "name": "AddSectionPayload",
          "kind": "interface",
          "line": 296,
          "exported": true,
          "signature": "export interface AddSectionPayload { name: string; suite_id?: number; parent_id?: number; description?: string; }"
        },
        {
          "name": "UpdateSectionPayload",
          "kind": "interface",
          "line": 303,
          "exported": true,
          "signature": "export interface UpdateSectionPayload { name?: string; description?: string; }"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "interface",
          "line": 308,
          "exported": true,
          "signature": "export interface AddMilestonePayload { name: string; description?: string; due_on?: number; start_on?: number; parent_id?: number; refs?: string; }"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "interface",
          "line": 319,
          "exported": true,
          "signature": "export interface UpdateMilestonePayload { name?: string; description?: string; due_on?: number; start_on?: number; parent_id?: number; refs?: string; is_completed?: boolean; is_started?: boolean; }"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 332,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "interface",
          "line": 353,
          "exported": true,
          "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; };…"
        },
        {
          "name": "ResultField",
          "kind": "interface",
          "line": 367,
          "exported": true,
          "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "interface",
          "line": 389,
          "exported": true,
          "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; }; }"
        },
        {
          "name": "CaseField",
          "kind": "interface",
          "line": 404,
          "exported": true,
          "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…"
        },
        {
          "name": "CaseType",
          "kind": "interface",
          "line": 424,
          "exported": true,
          "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Template",
          "kind": "interface",
          "line": 433,
          "exported": true,
          "signature": "export interface Template { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Configuration",
          "kind": "interface",
          "line": 442,
          "exported": true,
          "signature": "export interface Configuration { id: number; name: string; group_id: number; }"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "interface",
          "line": 449,
          "exported": true,
          "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }"
        },
        {
          "name": "AddConfigurationGroupPayload",
          "kind": "interface",
          "line": 456,
          "exported": true,
          "signature": "export interface AddConfigurationGroupPayload { name: string; }"
        },
        {
          "name": "UpdateConfigurationGroupPayload",
          "kind": "interface",
          "line": 461,
          "exported": true,
          "signature": "export interface UpdateConfigurationGroupPayload { name?: string; }"
        },
        {
          "name": "AddConfigurationPayload",
          "kind": "interface",
          "line": 466,
          "exported": true,
          "signature": "export interface AddConfigurationPayload { name: string; }"
        },
        {
          "name": "UpdateConfigurationPayload",
          "kind": "interface",
          "line": 471,
          "exported": true,
          "signature": "export interface UpdateConfigurationPayload { name?: string; }"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 476,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 481,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "AddProjectPayload",
          "kind": "interface",
          "line": 486,
          "exported": true,
          "signature": "export interface AddProjectPayload { name: string; announcement?: string; show_announcement?: boolean; suite_mode?: number; }"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "interface",
          "line": 493,
          "exported": true,
          "signature": "export interface UpdateProjectPayload { name?: string; announcement?: string; show_announcement?: boolean; suite_mode?: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 504,
          "exported": true,
          "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 524,
          "exported": true,
          "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 537,
          "exported": true,
          "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 555,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }"
        },
        {
          "name": "AddUserPayload",
          "kind": "interface",
          "line": 567,
          "exported": true,
          "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "UpdateUserPayload",
          "kind": "interface",
          "line": 581,
          "exported": true,
          "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "Role",
          "kind": "interface",
          "line": 597,
          "exported": true,
          "signature": "export interface Role { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Group",
          "kind": "interface",
          "line": 609,
          "exported": true,
          "signature": "export interface Group { id: number; name: string; user_ids?: number[]; }"
        },
        {
          "name": "AddGroupPayload",
          "kind": "interface",
          "line": 619,
          "exported": true,
          "signature": "export interface AddGroupPayload { name: string; user_ids?: number[]; }"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "interface",
          "line": 627,
          "exported": true,
          "signature": "export interface UpdateGroupPayload { name?: string; user_ids?: number[]; }"
        },
        {
          "name": "Attachment",
          "kind": "interface",
          "line": 637,
          "exported": true,
          "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string; size?: number; created_on?: number; created_by?: number; entity_id?: number; }"
        },
        {
          "name": "SharedStep",
          "kind": "interface",
          "line": 657,
          "exported": true,
          "signature": "export interface SharedStep { id: number; title: string; project_id?: number; case_ids?: number[]; created_on?: number; created_by?: number; updated_on?: number; updated_by?: number; custom_steps_sepa…"
        },
        {
          "name": "AddSharedStepPayload",
          "kind": "interface",
          "line": 679,
          "exported": true,
          "signature": "export interface AddSharedStepPayload { title: string; custom_steps_separated?: Record<string, unknown>[]; }"
        },
        {
          "name": "UpdateSharedStepPayload",
          "kind": "interface",
          "line": 687,
          "exported": true,
          "signature": "export interface UpdateSharedStepPayload { title?: string; custom_steps_separated?: Record<string, unknown>[]; }"
        },
        {
          "name": "Variable",
          "kind": "interface",
          "line": 697,
          "exported": true,
          "signature": "export interface Variable { id: number; name: string; }"
        },
        {
          "name": "AddVariablePayload",
          "kind": "interface",
          "line": 705,
          "exported": true,
          "signature": "export interface AddVariablePayload { name: string; }"
        },
        {
          "name": "UpdateVariablePayload",
          "kind": "interface",
          "line": 711,
          "exported": true,
          "signature": "export interface UpdateVariablePayload { name?: string; }"
        },
        {
          "name": "Dataset",
          "kind": "interface",
          "line": 719,
          "exported": true,
          "signature": "export interface Dataset { id: number; name: string; project_id?: number; created_on?: number; created_by?: number; }"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "interface",
          "line": 733,
          "exported": true,
          "signature": "export interface AddDatasetPayload { name: string; }"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "interface",
          "line": 739,
          "exported": true,
          "signature": "export interface UpdateDatasetPayload { name?: string; }"
        },
        {
          "name": "Report",
          "kind": "interface",
          "line": 747,
          "exported": true,
          "signature": "export interface Report { id: number; name: string; description?: string; is_shared?: boolean; }"
        },
        {
          "name": "ReportResult",
          "kind": "interface",
          "line": 759,
          "exported": true,
          "signature": "export interface ReportResult { report_url: string; user_report_url?: string; }"
        }
      ]
    },
    {
      "path": "src/utils.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "base64Encode",
          "kind": "function",
          "line": 2,
          "exported": true,
          "signature": "export function base64Encode(str: string): string"
        },
        {
          "name": "sleep",
          "kind": "function",
          "line": 13,
          "exported": true,
          "signature": "export function sleep(ms: number): Promise<void>"
        },
        {
          "name": "serializeIdList",
          "kind": "function",
          "line": 18,
          "exported": true,
          "signature": "export function serializeIdList(ids?: number[]): string | undefined"
        }
      ]
    }
  ]
}
```
