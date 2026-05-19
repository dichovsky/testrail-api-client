# CODEMAP

Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.

Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.

```json
{
  "schema": "codemap.v2",
  "repo": {
    "name": "@dichovsky/testrail-api-client",
    "version": "3.5.0"
  },
  "sourceHash": "5836086b68a974d80b2f301a4907327c30863833c97585575247fe27bcbfb0aa",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCaseFieldConfigPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 661,
      "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldConfigPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 647,
      "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
    },
    {
      "name": "AddCaseFieldPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 673,
      "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 663,
      "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
    },
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 540,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 529,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddConfigurationGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 503,
      "signature": "export interface AddConfigurationGroupPayload { name: string; }",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 513,
      "signature": "export interface AddConfigurationPayload { name: string; }",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 769,
      "signature": "export interface AddDatasetPayload { name: string; }",
      "jsdoc": "Payload for creating a dataset via POST /add_dataset/{project_id}",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 655,
      "signature": "export interface AddGroupPayload { name: string; user_ids?: number[]; }",
      "jsdoc": "Payload for creating a new group via POST /add_group (TestRail 7.5+)",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 917,
      "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 908,
      "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 813,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 802,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 835,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 828,
      "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
    },
    {
      "name": "AddProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 861,
      "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 854,
      "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "AddResultForCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 725,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 714,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultForTestPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 747,
      "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForTestPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 736,
      "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 710,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 700,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 731,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 727,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddResultsPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 753,
      "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 749,
      "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 686,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 675,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 788,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 779,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
    },
    {
      "name": "AddSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 899,
      "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 892,
      "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
    },
    {
      "name": "AddSharedStepPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 715,
      "signature": "export interface AddSharedStepPayload { title: string; custom_steps_separated?: Record<string, unknown>[]; }",
      "jsdoc": "Payload for creating a shared step via POST /add_shared_step/{project_id} (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 877,
      "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 872,
      "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
    },
    {
      "name": "AddUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 603,
      "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for creating a new user via POST /add_user (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 741,
      "signature": "export interface AddVariablePayload { name: string; }",
      "jsdoc": "Payload for creating a variable via POST /add_variable/{project_id}",
      "typeOnly": true
    },
    {
      "name": "Attachment",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 673,
      "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string; size?: number; created_on?: number; created_by?: number; entity_id?: number; }",
      "jsdoc": "An attachment metadata record returned by attachment list and upload endpoints",
      "typeOnly": true
    },
    {
      "name": "AttachmentSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 457,
      "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().optional(), size: z.number().optional(), created_on: z.number().optional(), created_by: z.nu…"
    },
    {
      "name": "Case",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 85,
      "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number; type_id?: number; priority_id?: number; milestone_id?: number; refs?: string; created_by: number; created_o…",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 451,
      "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…",
      "jsdoc": "Custom case field definition returned by get_case_fields",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 436,
      "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; }; }",
      "jsdoc": "Context/options configuration block shared by CaseField entries",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 372,
      "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 379,
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
      "name": "CaseStatus",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 291,
      "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }",
      "typeOnly": true
    },
    {
      "name": "CaseStatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 319,
      "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
    },
    {
      "name": "CaseType",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 471,
      "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case type definition returned by get_case_types",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 420,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Configuration",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 489,
      "signature": "export interface Configuration { id: number; name: string; group_id: number; }",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 496,
      "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\")",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 446,
      "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
    },
    {
      "name": "ConfigurationSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 438,
      "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
    },
    {
      "name": "CopyCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 617,
      "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "CopyCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 613,
      "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
    },
    {
      "name": "Dataset",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 755,
      "signature": "export interface Dataset { id: number; name: string; project_id?: number; created_on?: number; created_by?: number; }",
      "jsdoc": "A dataset for data-driven testing",
      "typeOnly": true
    },
    {
      "name": "DatasetSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 494,
      "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().optional(), created_on: z.number().optional(), created_by: z.number().optional(), })"
    },
    {
      "name": "DeleteCasesOptions",
      "kind": "type",
      "file": "src/modules/cases.ts",
      "line": 24,
      "signature": "export type DeleteCasesOptions = SoftDeleteOptions",
      "jsdoc": "@deprecated Use from `../types.js` — kept as an alias for back-compat.",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 590,
      "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 582,
      "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
    },
    {
      "name": "DeleteCasesPreview",
      "kind": "type",
      "file": "src/modules/cases.ts",
      "line": 28,
      "signature": "export type DeleteCasesPreview = SoftDeletePreview",
      "jsdoc": "@deprecated Use (re-exported from the package root) — kept as an alias for back-compat.",
      "typeOnly": true
    },
    {
      "name": "GetCasesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 342,
      "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…",
      "jsdoc": "Filter options for `getCases()`. All date filters accept Unix timestamps (seconds since epoch).",
      "typeOnly": true
    },
    {
      "name": "GetHistoryForCaseOptions",
      "kind": "interface",
      "file": "src/modules/cases.ts",
      "line": 15,
      "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetMilestonesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 591,
      "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 540,
      "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 573,
      "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 379,
      "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…",
      "typeOnly": true
    },
    {
      "name": "GetSharedStepHistoryOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 6,
      "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetTestsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 560,
      "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 645,
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
      "name": "HistoryChange",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 300,
      "signature": "export interface HistoryChange { field?: string; type_id?: number; old_text?: string; new_text?: string; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 307,
      "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number; created_on?: number; changes?: HistoryChange[]; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 346,
      "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().optional(), created_on: z.number().optional(), changes: z.array(HistoryChang…"
    },
    {
      "name": "Milestone",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 246,
      "signature": "export interface Milestone { id: number; name: string; description?: string; start_on?: number; started_on?: number; is_completed: boolean; completed_on?: number; due_on?: number; project_id: number; …",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 269,
      "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), start_on: z.number().optional(), started_on: z.number().optional(), is_completed: z.boole…"
    },
    {
      "name": "MoveCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 630,
      "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 625,
      "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
    },
    {
      "name": "MoveSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 147,
      "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 142,
      "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
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
      "line": 143,
      "signature": "export interface Plan { id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; is_completed: boolean; completed_on?: number; passed_count: number; blocked_count…",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 170,
      "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string; assignedto_id?: number; include_all: boolean; case_ids?: number[]; config_ids?: number[]; runs: Run[]; }",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 772,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 762,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 187,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean(), cas…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 201,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), is_completed: z.boo…"
    },
    {
      "name": "Priority",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 283,
      "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 304,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 131,
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
      "line": 528,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 783,
      "signature": "export interface Report { id: number; name: string; description?: string; is_shared?: boolean; }",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 795,
      "signature": "export interface ReportResult { report_url: string; user_report_url?: string; }",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 515,
      "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().optional(), })"
    },
    {
      "name": "ReportSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 506,
      "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), is_shared: z.boolean().optional(), })"
    },
    {
      "name": "Result",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 231,
      "signature": "export interface Result { id?: number; test_id?: number; status_id: number; comment?: string; version?: string; elapsed?: string; defects?: string; assignedto_id?: number; created_by?: number; created…",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 414,
      "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 400,
      "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; };…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 395,
      "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 402,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 251,
      "signature": "export const ResultSchema = zObject({ id: z.number().optional(), test_id: z.number().optional(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.strin…"
    },
    {
      "name": "Role",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 633,
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
      "line": 182,
      "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; include_all: boolean; is_completed: boolean; completed_on?: numb…",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 151,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional()…"
    },
    {
      "name": "Section",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 121,
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
      "line": 693,
      "signature": "export interface SharedStep { id: number; title: string; project_id?: number; case_ids?: number[]; created_on?: number; created_by?: number; updated_on?: number; updated_by?: number; custom_steps_sepa…",
      "jsdoc": "A shared step set returned by GET /get_shared_step (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "SharedStepSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 471,
      "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().optional(), case_ids: z.array(z.number()).optional(), created_on: z.number().optional(), created_by:…"
    },
    {
      "name": "SoftDeleteOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 333,
      "signature": "export interface SoftDeleteOptions { soft?: boolean; }",
      "jsdoc": "Options for delete endpoints that support TestRail's `soft=1` server-side preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`, `delete_suite`). `delete_milestone` and `delete_project` do not accept `soft`; passing this option to those endpoints would be a no-op server-side, so the CLI rejects it instead to keep destructive intent unambiguous.",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreview",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 608,
      "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreviewSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 598,
      "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
    },
    {
      "name": "Status",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 271,
      "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 290,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "Suite",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 106,
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
      "line": 480,
      "signature": "export interface Template { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+)",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 428,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Test",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 214,
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
      "line": 114,
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
      "line": 232,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().optional(), run_id: z.number(), title: z.string(), template_id: z.number().opt…"
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 553,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 542,
      "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
    },
    {
      "name": "UpdateCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 573,
      "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 561,
      "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
    },
    {
      "name": "UpdateConfigurationGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 508,
      "signature": "export interface UpdateConfigurationGroupPayload { name?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 518,
      "signature": "export interface UpdateConfigurationPayload { name?: string; }",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 775,
      "signature": "export interface UpdateDatasetPayload { name?: string; }",
      "jsdoc": "Payload for updating a dataset via POST /update_dataset/{dataset_id}",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 663,
      "signature": "export interface UpdateGroupPayload { name?: string; user_ids?: number[]; }",
      "jsdoc": "Payload for updating an existing group via POST /update_group/{group_id} (TestRail 7.5+)",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 930,
      "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 919,
      "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 826,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 815,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 844,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 837,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 870,
      "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 863,
      "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 800,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 793,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 698,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 688,
      "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
    },
    {
      "name": "UpdateSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 906,
      "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 901,
      "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateSharedStepPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 723,
      "signature": "export interface UpdateSharedStepPayload { title?: string; custom_steps_separated?: Record<string, unknown>[]; }",
      "jsdoc": "Payload for updating a shared step via POST /update_shared_step/{shared_step_id} (TestRail 7.0+)",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 884,
      "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 879,
      "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 617,
      "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 747,
      "signature": "export interface UpdateVariablePayload { name?: string; }",
      "jsdoc": "Payload for updating a variable via POST /update_variable/{variable_id}",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 262,
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
      "line": 733,
      "signature": "export interface Variable { id: number; name: string; }",
      "jsdoc": "A variable used in data-driven testing",
      "typeOnly": true
    },
    {
      "name": "VariableSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 487,
      "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
    }
  ],
  "files": [
    {
      "path": "src/body-reader.ts",
      "imports": [
        "./errors.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BodyLimits",
          "kind": "interface",
          "line": 6,
          "exported": true,
          "signature": "export interface BodyLimits { maxBytes: number; deadlineMs: number; }"
        },
        {
          "name": "readBodyWithLimits",
          "kind": "function",
          "line": 38,
          "exported": true,
          "signature": "export async function readBodyWithLimits(response: Response, limits: BodyLimits): Promise<Uint8Array>"
        },
        {
          "name": "readBodyAsText",
          "kind": "function",
          "line": 146,
          "exported": true,
          "signature": "export async function readBodyAsText(response: Response, limits: BodyLimits): Promise<string>"
        },
        {
          "name": "readBodyViaFallback",
          "kind": "function",
          "line": 159,
          "exported": false,
          "signature": "async function readBodyViaFallback(response: Response, maxBytes: number): Promise<Uint8Array>"
        }
      ]
    },
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
          "signature": "export const MISSING_AUTH_MESSAGE = 'Missing auth. Set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, TESTRAIL_API_KEY (or pass --base-url / --email; the API key must come from the env var or --api-key-stdin — ar…"
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
        "./handlers/bdd.js",
        "./handlers/case-field-write.js",
        "./handlers/case-status.js",
        "./handlers/case-write.js",
        "./handlers/case.js",
        "./handlers/milestone-write.js",
        "./handlers/milestone.js",
        "./handlers/plan-write.js",
        "./handlers/plan.js",
        "./handlers/project-write.js",
        "./handlers/project.js",
        "./handlers/result-write.js",
        "./handlers/result.js",
        "./handlers/run-write.js",
        "./handlers/run.js",
        "./handlers/section-write.js",
        "./handlers/shared-step.js",
        "./handlers/suite-write.js",
        "./handlers/suite.js",
        "./handlers/user.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HANDLERS",
          "kind": "const",
          "line": 63,
          "exported": false,
          "signature": "const HANDLERS: Record<string, Handler> = { 'project:get': handleProjectGet, 'project:list': handleProjectList, 'project:add': handleProjectAdd, 'project:update': handleProjectUpdate, 'project:delete'…"
        },
        {
          "name": "RESOURCES",
          "kind": "const",
          "line": 130,
          "exported": false,
          "signature": "const RESOURCES: Record<string, readonly string[]> = (() => { const grouped: Record<string, string[]> = {}; for (const key of Object.keys(HANDLERS)) { const [resource, action] = key.split(':'); if (re…"
        },
        {
          "name": "DispatchResult",
          "kind": "type",
          "line": 145,
          "exported": true,
          "signature": "export type DispatchResult = { ok: true; handler: Handler } | { ok: false; error: string }"
        },
        {
          "name": "getRegisteredActions",
          "kind": "function",
          "line": 152,
          "exported": true,
          "signature": "export function getRegisteredActions(): readonly string[]"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 156,
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
          "line": 32,
          "exported": true,
          "signature": "export function resolveOut(input: FileOutput, opts: ResolveOutOptions): OutputResolution"
        }
      ]
    },
    {
      "path": "src/cli/flags.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "CLI_OPTIONS",
          "kind": "const",
          "line": 20,
          "exported": true,
          "signature": "export const CLI_OPTIONS = { 'base-url': { type: 'string' as const }, email: { type: 'string' as const }, 'api-key-stdin': { type: 'boolean' as const, default: false }, format: { type: 'string' as con…"
        },
        {
          "name": "KNOWN_FLAGS",
          "kind": "const",
          "line": 51,
          "exported": true,
          "signature": "export const KNOWN_FLAGS: ReadonlySet<string> = new Set(Object.keys(CLI_OPTIONS))"
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
          "line": 42,
          "exported": true,
          "signature": "export interface BodyInput { dataFlag?: string; dataFileFlag?: string; readStdin?: () => string; }"
        },
        {
          "name": "HandlerContext",
          "kind": "interface",
          "line": 48,
          "exported": true,
          "signature": "export interface HandlerContext { client: TestRailClient; args: HandlerArgs; bodyInput: BodyInput; dryRun: boolean; force: boolean; confirmDestructive: boolean; out: (data: unknown) => void; }"
        },
        {
          "name": "Handler",
          "kind": "type",
          "line": 62,
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
        "../safe-write.js"
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
      "path": "src/cli/handlers/bdd.ts",
      "imports": [
        "../file-input.js",
        "../file-output.js",
        "../handler-context.js",
        "../ids.js",
        "../safe-write.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleBddGet",
          "kind": "function",
          "line": 15,
          "exported": true,
          "signature": "export async function handleBddGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleBddAdd",
          "kind": "function",
          "line": 47,
          "exported": true,
          "signature": "export async function handleBddAdd(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-field-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseFieldAdd",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleCaseFieldAdd(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-status.ts",
      "imports": [
        "../handler-context.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseStatusList",
          "kind": "function",
          "line": 3,
          "exported": true,
          "signature": "export async function handleCaseStatusList(ctx: HandlerContext): Promise<void>"
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
          "line": 13,
          "exported": true,
          "signature": "export async function handleCaseAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseUpdate",
          "kind": "function",
          "line": 24,
          "exported": true,
          "signature": "export async function handleCaseUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseUpdateBulk",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export async function handleCaseUpdateBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseDeleteBulk",
          "kind": "function",
          "line": 59,
          "exported": true,
          "signature": "export async function handleCaseDeleteBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseCopyToSection",
          "kind": "function",
          "line": 98,
          "exported": true,
          "signature": "export async function handleCaseCopyToSection(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseMoveToSection",
          "kind": "function",
          "line": 115,
          "exported": true,
          "signature": "export async function handleCaseMoveToSection(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseDelete",
          "kind": "function",
          "line": 139,
          "exported": true,
          "signature": "export async function handleCaseDelete(ctx: HandlerContext): Promise<void>"
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
        },
        {
          "name": "handleCaseHistory",
          "kind": "function",
          "line": 15,
          "exported": true,
          "signature": "export async function handleCaseHistory(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/milestone-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleMilestoneAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleMilestoneAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleMilestoneUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneDelete",
          "kind": "function",
          "line": 46,
          "exported": true,
          "signature": "export async function handleMilestoneDelete(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/project-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleProjectAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleProjectAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectUpdate",
          "kind": "function",
          "line": 16,
          "exported": true,
          "signature": "export async function handleProjectUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectDelete",
          "kind": "function",
          "line": 41,
          "exported": true,
          "signature": "export async function handleProjectDelete(ctx: HandlerContext): Promise<void>"
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
        },
        {
          "name": "handleResultAddBulkByTest",
          "kind": "function",
          "line": 42,
          "exported": true,
          "signature": "export async function handleResultAddBulkByTest(ctx: HandlerContext): Promise<void>"
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
          "line": 28,
          "exported": true,
          "signature": "export async function handleRunClose(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunDelete",
          "kind": "function",
          "line": 47,
          "exported": true,
          "signature": "export async function handleRunDelete(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/section-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSectionAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleSectionAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSectionUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleSectionUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSectionMove",
          "kind": "function",
          "line": 52,
          "exported": true,
          "signature": "export async function handleSectionMove(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSectionDelete",
          "kind": "function",
          "line": 75,
          "exported": true,
          "signature": "export async function handleSectionDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/shared-step.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleSharedStepGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleSharedStepList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepHistory",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function handleSharedStepHistory(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/suite-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSuiteAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleSuiteAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSuiteUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleSuiteUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSuiteDelete",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export async function handleSuiteDelete(ctx: HandlerContext): Promise<void>"
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
        "../constants.js",
        "./auth.js",
        "./dispatch.js",
        "./flags.js",
        "./handler-context.js",
        "./install-skill.js",
        "./metadata.js",
        "./output.js",
        "./sanitize.js",
        "./stdin.js",
        "node:module",
        "node:util"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "require",
          "kind": "const",
          "line": 18,
          "exported": false,
          "signature": "const require = createRequire(import.meta.url)"
        },
        {
          "name": "VERSION",
          "kind": "const",
          "line": 19,
          "exported": false,
          "signature": "const VERSION: string = (require('../../package.json') as { version: string }).version"
        },
        {
          "name": "HELP",
          "kind": "const",
          "line": 23,
          "exported": false,
          "signature": "const HELP = `\ntestrail <resource> <action> [args] [options]\n\nRead actions:\n  project  get <id> | list [--limit N] [--offset N]\n  suite    get <id> | list --project-id <id>\n  case     get <id> | list …"
        },
        {
          "name": "main",
          "kind": "function",
          "line": 148,
          "exported": false,
          "signature": "async function main(): Promise<number>"
        }
      ]
    },
    {
      "path": "src/cli/install-skill.ts",
      "imports": [
        "./sanitize.js",
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
          "line": 22,
          "exported": true,
          "signature": "export interface InstallSkillOptions { global: boolean; force: boolean; printPath: boolean; quiet: boolean; sourceOverride?: string; cwdOverride?: string; homeOverride?: string; }"
        },
        {
          "name": "getBundledSkillPath",
          "kind": "function",
          "line": 41,
          "exported": true,
          "signature": "export function getBundledSkillPath(metaUrl: string): string"
        },
        {
          "name": "runInstallSkill",
          "kind": "function",
          "line": 45,
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
          "line": 49,
          "exported": true,
          "signature": "export interface PathParam { name: string; description: string; }"
        },
        {
          "name": "ActionSpec",
          "kind": "interface",
          "line": 54,
          "exported": true,
          "signature": "export interface ActionSpec { resource: string; action: string; summary: string; pathParams: readonly PathParam[]; apiEndpoint: string; bodySchema?: z.ZodTypeAny; fileInput?: boolean; fileOutput?: boo…"
        },
        {
          "name": "ACTIONS",
          "kind": "const",
          "line": 92,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ { resource: 'project', action: 'get', summary: 'Fetch a single project by ID', pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 680,
          "exported": true,
          "signature": "export function getActionSpec(resource: string, action: string): ActionSpec | undefined"
        }
      ]
    },
    {
      "path": "src/cli/output.ts",
      "imports": [
        "./sanitize.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "OutputOptions",
          "kind": "interface",
          "line": 3,
          "exported": true,
          "signature": "export interface OutputOptions { quiet: boolean; format: 'json' | 'table'; }"
        },
        {
          "name": "Output",
          "kind": "interface",
          "line": 8,
          "exported": true,
          "signature": "export interface Output { out: (data: unknown) => void; err: (message: string) => void; }"
        },
        {
          "name": "valueToString",
          "kind": "function",
          "line": 13,
          "exported": true,
          "signature": "export function valueToString(v: unknown): string"
        },
        {
          "name": "getField",
          "kind": "function",
          "line": 35,
          "exported": false,
          "signature": "function getField(row: unknown, key: string): unknown"
        },
        {
          "name": "renderTable",
          "kind": "function",
          "line": 40,
          "exported": true,
          "signature": "export function renderTable(data: unknown): string"
        },
        {
          "name": "safeJsonStringify",
          "kind": "function",
          "line": 89,
          "exported": true,
          "signature": "export function safeJsonStringify(data: unknown): string"
        },
        {
          "name": "createOutput",
          "kind": "function",
          "line": 104,
          "exported": true,
          "signature": "export function createOutput(opts: OutputOptions): Output"
        }
      ]
    },
    {
      "path": "src/cli/safe-write.ts",
      "imports": [
        "node:fs"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "WriteEncoding",
          "kind": "type",
          "line": 21,
          "exported": false,
          "signature": "type WriteEncoding = 'utf-8'"
        },
        {
          "name": "safeWrite",
          "kind": "function",
          "line": 23,
          "exported": false,
          "signature": "function safeWrite(path: string, data: Uint8Array | string, force: boolean, encoding?: WriteEncoding): void"
        },
        {
          "name": "safeWriteBinary",
          "kind": "function",
          "line": 43,
          "exported": true,
          "signature": "export function safeWriteBinary(path: string, bytes: Uint8Array, force: boolean): void"
        },
        {
          "name": "safeWriteText",
          "kind": "function",
          "line": 47,
          "exported": true,
          "signature": "export function safeWriteText(path: string, text: string, force: boolean): void"
        }
      ]
    },
    {
      "path": "src/cli/sanitize.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "sanitizeForTerminal",
          "kind": "function",
          "line": 29,
          "exported": true,
          "signature": "export function sanitizeForTerminal(s: string): string"
        }
      ]
    },
    {
      "path": "src/cli/stdin.ts",
      "imports": [
        "node:fs"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "readBoundedStdin",
          "kind": "function",
          "line": 39,
          "exported": true,
          "signature": "export function readBoundedStdin(maxBytes: number, fd = 0): string"
        }
      ]
    },
    {
      "path": "src/client-core.ts",
      "imports": [
        "../package.json",
        "./body-reader.js",
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
          "line": 35,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^0\\./, ]"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 48,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 70,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 102,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string): Promise<void>"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 151,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 152,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 155,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 161,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 184,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 185
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 188
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 189
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 190
            },
            {
              "name": "enableCache",
              "kind": "property",
              "line": 191
            },
            {
              "name": "cacheTtl",
              "kind": "property",
              "line": 192
            },
            {
              "name": "cacheCleanupInterval",
              "kind": "property",
              "line": 193
            },
            {
              "name": "maxCacheSize",
              "kind": "property",
              "line": 194
            },
            {
              "name": "cache",
              "kind": "property",
              "line": 195
            },
            {
              "name": "cacheCleanupTimer",
              "kind": "property",
              "line": 196
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 197
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 198
            },
            {
              "name": "hostname",
              "kind": "property",
              "line": 199
            },
            {
              "name": "allowPrivateHosts",
              "kind": "property",
              "line": 200
            },
            {
              "name": "maxJsonResponseBytes",
              "kind": "property",
              "line": 201
            },
            {
              "name": "maxBinaryResponseBytes",
              "kind": "property",
              "line": 202
            },
            {
              "name": "bodyTimeout",
              "kind": "property",
              "line": 207
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 209
            },
            {
              "name": "validateConfig",
              "kind": "method",
              "line": 268
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 414
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 439
            },
            {
              "name": "assertNotRedirect",
              "kind": "method",
              "line": 480
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 498
            },
            {
              "name": "validateId",
              "kind": "method",
              "line": 526
            },
            {
              "name": "validateEntryId",
              "kind": "method",
              "line": 536
            },
            {
              "name": "validatePaginationParams",
              "kind": "method",
              "line": 546
            },
            {
              "name": "buildEndpoint",
              "kind": "method",
              "line": 565
            },
            {
              "name": "getCachedData",
              "kind": "method",
              "line": 577
            },
            {
              "name": "setCachedData",
              "kind": "method",
              "line": 598
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 620
            },
            {
              "name": "startCacheCleanup",
              "kind": "method",
              "line": 624
            },
            {
              "name": "stopCacheCleanup",
              "kind": "method",
              "line": 635
            },
            {
              "name": "cleanupExpiredCache",
              "kind": "method",
              "line": 642
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 669
            },
            {
              "name": "request",
              "kind": "method",
              "line": 703
            },
            {
              "name": "requestText",
              "kind": "method",
              "line": 883
            },
            {
              "name": "requestMultipart",
              "kind": "method",
              "line": 992
            },
            {
              "name": "requestBinary",
              "kind": "method",
              "line": 1093
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 1199
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 1208
            },
            {
              "name": "requestParsed",
              "kind": "method",
              "line": 1241
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
        "./modules/bdd.js",
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
          "line": 114,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 116
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 117
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 118
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 119
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 120
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 121
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 122
            },
            {
              "name": "results",
              "kind": "property",
              "line": 123
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 124
            },
            {
              "name": "users",
              "kind": "property",
              "line": 125
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 126
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 127
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 128
            },
            {
              "name": "bdd",
              "kind": "property",
              "line": 129
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 130
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 131
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 132
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 133
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 135
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 164
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 173
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 181
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 190
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 199
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 210
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 219
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 228
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 237
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 247
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 248
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 250
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 251
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 265
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 277
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 289
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 298
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 308
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 309
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 311
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 312
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 327
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 338
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 359
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 368
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 377
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 388
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 389
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 391
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 392
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 404
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 415
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 421
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 428
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 434
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 454
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 463
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 472
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 483
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 495
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 504
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 513
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 522
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 531
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 540
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 549
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 558
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 567
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 576
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 585
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 596
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 608
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 617
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 626
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 635
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 645
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 646
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 648
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 649
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 663
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 674
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 688
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 701
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 713
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 722
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 731
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 740
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 749
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 760
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 772
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 784
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 796
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 807
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 820
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 831
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 844
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 852
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 862
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 874
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 884
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 893
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 903
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 913
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 923
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 943
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 951
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 964
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 977
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 989
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 1001
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 1015
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 1027
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 1039
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 1050
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 1060
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 1073
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 1081
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 1091
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 1103
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 1114
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 1127
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 1138
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 1149
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 1160
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 1172
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 1183
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 1196
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 1213
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 1230
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 1247
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 1265
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 1281
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 1298
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 1311
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 1328
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 1339
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 1351
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 1363
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 1374
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 1383
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 1396
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 1408
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 1420
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 1431
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 1444
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 1455
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 1467
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 1479
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 1490
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 1503
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 1514
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
          "name": "DEFAULT_MAX_JSON_RESPONSE_BYTES",
          "kind": "const",
          "line": 39,
          "exported": true,
          "signature": "export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 10 * 1024 * 1024"
        },
        {
          "name": "DEFAULT_MAX_BINARY_RESPONSE_BYTES",
          "kind": "const",
          "line": 40,
          "exported": true,
          "signature": "export const DEFAULT_MAX_BINARY_RESPONSE_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "MAX_RESPONSE_BYTES_LIMIT",
          "kind": "const",
          "line": 41,
          "exported": true,
          "signature": "export const MAX_RESPONSE_BYTES_LIMIT = 1024 * 1024 * 1024"
        },
        {
          "name": "DEFAULT_BODY_TIMEOUT_MS",
          "kind": "const",
          "line": 55,
          "exported": true,
          "signature": "export const DEFAULT_BODY_TIMEOUT_MS: number | undefined = undefined"
        },
        {
          "name": "MAX_STDIN_BYTES",
          "kind": "const",
          "line": 69,
          "exported": true,
          "signature": "export const MAX_STDIN_BYTES = 1024 * 1024"
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
        "./modules/cases.js",
        "./modules/sharedSteps.js",
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
              "line": 10
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 24
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 38
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 52
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 66
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 81
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 87
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 97
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 107
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 117
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 127
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 143
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/bdd.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BddModule",
          "kind": "class",
          "line": 17,
          "exported": true,
          "signature": "export class BddModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 18
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 25
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 35
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
          "name": "GetHistoryForCaseOptions",
          "kind": "interface",
          "line": 15,
          "exported": true,
          "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "DeleteCasesOptions",
          "kind": "type",
          "line": 24,
          "exported": true,
          "signature": "export type DeleteCasesOptions = SoftDeleteOptions"
        },
        {
          "name": "DeleteCasesPreview",
          "kind": "type",
          "line": 28,
          "exported": true,
          "signature": "export type DeleteCasesPreview = SoftDeletePreview"
        },
        {
          "name": "CaseModule",
          "kind": "class",
          "line": 30,
          "exported": true,
          "signature": "export class CaseModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 31
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 34
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 40
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 89
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 95
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 109
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 110
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 116
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 117
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 141
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 154
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 160
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 167
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 173
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 196
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 213
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 219
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
              "line": 17
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 27
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 38
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 52
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 58
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 69
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 80
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
              "line": 9
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 15
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 21
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 27
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 33
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
          "line": 16,
          "exported": true,
          "signature": "export class MetadataModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 17
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 20
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 25
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 30
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 35
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 40
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 59
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 64
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 69
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 75
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
          "line": 7,
          "exported": true,
          "signature": "export class MilestoneModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 11
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 17
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 37
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 43
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 54
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
              "line": 21
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 27
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 51
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 57
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 63
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 69
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 75
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 81
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 93
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 100
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 107
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 113
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
          "line": 7,
          "exported": true,
          "signature": "export class ProjectModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 16
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 27
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 46
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 56
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 67
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
              "line": 9
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 15
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
              "line": 12
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 35
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 59
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 82
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 88
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 100
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 111
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
              "line": 11
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 17
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 55
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 61
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 67
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 80
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 81
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 84
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 85
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
          "line": 7,
          "exported": true,
          "signature": "export class SectionModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 11
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 17
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 40
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 46
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 59
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 60
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 62
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 63
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 88
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
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetSharedStepHistoryOptions",
          "kind": "interface",
          "line": 6,
          "exported": true,
          "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "SharedStepModule",
          "kind": "class",
          "line": 13,
          "exported": true,
          "signature": "export class SharedStepModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 14
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 17
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 23
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 33
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 39
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 50
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 56
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
          "line": 7,
          "exported": true,
          "signature": "export class SuiteModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 16
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 27
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 38
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 49
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 64
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 65
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 67
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 68
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
              "line": 11
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 17
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
              "line": 13
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 19
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 29
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 52
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 57
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 62
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 68
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 74
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 79
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 84
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 90
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
              "line": 9
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 15
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 21
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 27
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
          "name": "MoveSectionPayloadSchema",
          "kind": "const",
          "line": 142,
          "exported": true,
          "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
        },
        {
          "name": "MoveSectionPayload",
          "kind": "type",
          "line": 147,
          "exported": true,
          "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>"
        },
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 151,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional()…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 183,
          "exported": true,
          "signature": "export type Run = z.infer<typeof RunSchema>"
        },
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 187,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean(), cas…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 199,
          "exported": true,
          "signature": "export type PlanEntry = z.infer<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 201,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), is_completed: z.boo…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 228,
          "exported": true,
          "signature": "export type Plan = z.infer<typeof PlanSchema>"
        },
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 232,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().optional(), run_id: z.number(), title: z.string(), template_id: z.number().opt…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 249,
          "exported": true,
          "signature": "export type Test = z.infer<typeof TestSchema>"
        },
        {
          "name": "ResultSchema",
          "kind": "const",
          "line": 251,
          "exported": true,
          "signature": "export const ResultSchema = zObject({ id: z.number().optional(), test_id: z.number().optional(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.strin…"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 265,
          "exported": true,
          "signature": "export type Result = z.infer<typeof ResultSchema>"
        },
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 269,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), start_on: z.number().optional(), started_on: z.number().optional(), is_completed: z.boole…"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 286,
          "exported": true,
          "signature": "export type Milestone = z.infer<typeof MilestoneSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 290,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 302,
          "exported": true,
          "signature": "export type Status = z.infer<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 304,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 312,
          "exported": true,
          "signature": "export type Priority = z.infer<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatusSchema",
          "kind": "const",
          "line": 319,
          "exported": true,
          "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 328,
          "exported": true,
          "signature": "export type CaseStatus = z.infer<typeof CaseStatusSchema>"
        },
        {
          "name": "HistoryChangeSchema",
          "kind": "const",
          "line": 334,
          "exported": false,
          "signature": "const HistoryChangeSchema = zObject({ field: z.string().optional(), type_id: z.number().optional(), old_text: z.string().optional(), new_text: z.string().optional(), })"
        },
        {
          "name": "HistoryEntrySchema",
          "kind": "const",
          "line": 346,
          "exported": true,
          "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().optional(), created_on: z.number().optional(), changes: z.array(HistoryChang…"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 355,
          "exported": true,
          "signature": "export type HistoryEntry = z.infer<typeof HistoryEntrySchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 359,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string(), items: z.string().optional(), format: z.string().optional(), rows: z.string().optional(), })"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 367,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 372,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 377,
          "exported": true,
          "signature": "export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 379,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 393,
          "exported": true,
          "signature": "export type CaseField = z.infer<typeof CaseFieldSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 395,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 400,
          "exported": true,
          "signature": "export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 402,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 416,
          "exported": true,
          "signature": "export type ResultField = z.infer<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 420,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 426,
          "exported": true,
          "signature": "export type CaseType = z.infer<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 428,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 434,
          "exported": true,
          "signature": "export type Template = z.infer<typeof TemplateSchema>"
        },
        {
          "name": "ConfigurationSchema",
          "kind": "const",
          "line": 438,
          "exported": true,
          "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 444,
          "exported": true,
          "signature": "export type Configuration = z.infer<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroupSchema",
          "kind": "const",
          "line": 446,
          "exported": true,
          "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 453,
          "exported": true,
          "signature": "export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "AttachmentSchema",
          "kind": "const",
          "line": 457,
          "exported": true,
          "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().optional(), size: z.number().optional(), created_on: z.number().optional(), created_by: z.nu…"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 467,
          "exported": true,
          "signature": "export type Attachment = z.infer<typeof AttachmentSchema>"
        },
        {
          "name": "SharedStepSchema",
          "kind": "const",
          "line": 471,
          "exported": true,
          "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().optional(), case_ids: z.array(z.number()).optional(), created_on: z.number().optional(), created_by:…"
        },
        {
          "name": "SharedStep",
          "kind": "type",
          "line": 483,
          "exported": true,
          "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>"
        },
        {
          "name": "VariableSchema",
          "kind": "const",
          "line": 487,
          "exported": true,
          "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
        },
        {
          "name": "Variable",
          "kind": "type",
          "line": 492,
          "exported": true,
          "signature": "export type Variable = z.infer<typeof VariableSchema>"
        },
        {
          "name": "DatasetSchema",
          "kind": "const",
          "line": 494,
          "exported": true,
          "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().optional(), created_on: z.number().optional(), created_by: z.number().optional(), })"
        },
        {
          "name": "Dataset",
          "kind": "type",
          "line": 502,
          "exported": true,
          "signature": "export type Dataset = z.infer<typeof DatasetSchema>"
        },
        {
          "name": "ReportSchema",
          "kind": "const",
          "line": 506,
          "exported": true,
          "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().optional(), is_shared: z.boolean().optional(), })"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 513,
          "exported": true,
          "signature": "export type Report = z.infer<typeof ReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 515,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().optional(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 520,
          "exported": true,
          "signature": "export type ReportResult = z.infer<typeof ReportResultSchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 529,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 540,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 542,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 553,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "UpdateCasesPayloadSchema",
          "kind": "const",
          "line": 561,
          "exported": true,
          "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
        },
        {
          "name": "UpdateCasesPayload",
          "kind": "type",
          "line": 573,
          "exported": true,
          "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>"
        },
        {
          "name": "DeleteCasesPayloadSchema",
          "kind": "const",
          "line": 582,
          "exported": true,
          "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
        },
        {
          "name": "DeleteCasesPayload",
          "kind": "type",
          "line": 590,
          "exported": true,
          "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>"
        },
        {
          "name": "SoftDeletePreviewSchema",
          "kind": "const",
          "line": 598,
          "exported": true,
          "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
        },
        {
          "name": "SoftDeletePreview",
          "kind": "type",
          "line": 608,
          "exported": true,
          "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>"
        },
        {
          "name": "CopyCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 613,
          "exported": true,
          "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
        },
        {
          "name": "CopyCasesToSectionPayload",
          "kind": "type",
          "line": 617,
          "exported": true,
          "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>"
        },
        {
          "name": "MoveCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 625,
          "exported": true,
          "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
        },
        {
          "name": "MoveCasesToSectionPayload",
          "kind": "type",
          "line": 630,
          "exported": true,
          "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>"
        },
        {
          "name": "AddCaseFieldConfigPayloadSchema",
          "kind": "const",
          "line": 647,
          "exported": true,
          "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
        },
        {
          "name": "AddCaseFieldConfigPayload",
          "kind": "type",
          "line": 661,
          "exported": true,
          "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>"
        },
        {
          "name": "AddCaseFieldPayloadSchema",
          "kind": "const",
          "line": 663,
          "exported": true,
          "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
        },
        {
          "name": "AddCaseFieldPayload",
          "kind": "type",
          "line": 673,
          "exported": true,
          "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 675,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 686,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 688,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 698,
          "exported": true,
          "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 700,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 710,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 714,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 725,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 727,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 731,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "AddResultForTestPayloadSchema",
          "kind": "const",
          "line": 736,
          "exported": true,
          "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForTestPayload",
          "kind": "type",
          "line": 747,
          "exported": true,
          "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>"
        },
        {
          "name": "AddResultsPayloadSchema",
          "kind": "const",
          "line": 749,
          "exported": true,
          "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
        },
        {
          "name": "AddResultsPayload",
          "kind": "type",
          "line": 753,
          "exported": true,
          "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 762,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 772,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 779,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 788,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 793,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 800,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 802,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 813,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 815,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 826,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 828,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 835,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 837,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 844,
          "exported": true,
          "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>"
        },
        {
          "name": "AddProjectPayloadSchema",
          "kind": "const",
          "line": 854,
          "exported": true,
          "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "AddProjectPayload",
          "kind": "type",
          "line": 861,
          "exported": true,
          "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>"
        },
        {
          "name": "UpdateProjectPayloadSchema",
          "kind": "const",
          "line": 863,
          "exported": true,
          "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "type",
          "line": 870,
          "exported": true,
          "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>"
        },
        {
          "name": "AddSuitePayloadSchema",
          "kind": "const",
          "line": 872,
          "exported": true,
          "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
        },
        {
          "name": "AddSuitePayload",
          "kind": "type",
          "line": 877,
          "exported": true,
          "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>"
        },
        {
          "name": "UpdateSuitePayloadSchema",
          "kind": "const",
          "line": 879,
          "exported": true,
          "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSuitePayload",
          "kind": "type",
          "line": 884,
          "exported": true,
          "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>"
        },
        {
          "name": "AddSectionPayloadSchema",
          "kind": "const",
          "line": 892,
          "exported": true,
          "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
        },
        {
          "name": "AddSectionPayload",
          "kind": "type",
          "line": 899,
          "exported": true,
          "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>"
        },
        {
          "name": "UpdateSectionPayloadSchema",
          "kind": "const",
          "line": 901,
          "exported": true,
          "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSectionPayload",
          "kind": "type",
          "line": 906,
          "exported": true,
          "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>"
        },
        {
          "name": "AddMilestonePayloadSchema",
          "kind": "const",
          "line": 908,
          "exported": true,
          "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "type",
          "line": 917,
          "exported": true,
          "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>"
        },
        {
          "name": "UpdateMilestonePayloadSchema",
          "kind": "const",
          "line": 919,
          "exported": true,
          "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "type",
          "line": 930,
          "exported": true,
          "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>"
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
          "line": 85,
          "exported": true,
          "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number; type_id?: number; priority_id?: number; milestone_id?: number; refs?: string; created_by: number; created_o…"
        },
        {
          "name": "Suite",
          "kind": "interface",
          "line": 106,
          "exported": true,
          "signature": "export interface Suite { id: number; name: string; description?: string; project_id: number; is_master?: boolean; is_baseline?: boolean; is_completed?: boolean; completed_on?: number; url: string; }"
        },
        {
          "name": "Section",
          "kind": "interface",
          "line": 121,
          "exported": true,
          "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string; parent_id?: number; display_order: number; depth: number; }"
        },
        {
          "name": "Project",
          "kind": "interface",
          "line": 131,
          "exported": true,
          "signature": "export interface Project { id: number; name: string; announcement?: string; show_announcement?: boolean; is_completed?: boolean; completed_on?: number; suite_mode: number; url: string; }"
        },
        {
          "name": "Plan",
          "kind": "interface",
          "line": 143,
          "exported": true,
          "signature": "export interface Plan { id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; is_completed: boolean; completed_on?: number; passed_count: number; blocked_count…"
        },
        {
          "name": "PlanEntry",
          "kind": "interface",
          "line": 170,
          "exported": true,
          "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string; assignedto_id?: number; include_all: boolean; case_ids?: number[]; config_ids?: number[]; runs: Run[]; }"
        },
        {
          "name": "Run",
          "kind": "interface",
          "line": 182,
          "exported": true,
          "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string; milestone_id?: number; assignedto_id?: number; include_all: boolean; is_completed: boolean; completed_on?: numb…"
        },
        {
          "name": "Test",
          "kind": "interface",
          "line": 214,
          "exported": true,
          "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number; run_id: number; title: string; template_id?: number; type_id?: number; priority_id?: number; estimate?: …"
        },
        {
          "name": "Result",
          "kind": "interface",
          "line": 231,
          "exported": true,
          "signature": "export interface Result { id?: number; test_id?: number; status_id: number; comment?: string; version?: string; elapsed?: string; defects?: string; assignedto_id?: number; created_by?: number; created…"
        },
        {
          "name": "Milestone",
          "kind": "interface",
          "line": 246,
          "exported": true,
          "signature": "export interface Milestone { id: number; name: string; description?: string; start_on?: number; started_on?: number; is_completed: boolean; completed_on?: number; due_on?: number; project_id: number; …"
        },
        {
          "name": "User",
          "kind": "interface",
          "line": 262,
          "exported": true,
          "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number; role?: string; }"
        },
        {
          "name": "Status",
          "kind": "interface",
          "line": 271,
          "exported": true,
          "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }"
        },
        {
          "name": "Priority",
          "kind": "interface",
          "line": 283,
          "exported": true,
          "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }"
        },
        {
          "name": "CaseStatus",
          "kind": "interface",
          "line": 291,
          "exported": true,
          "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }"
        },
        {
          "name": "HistoryChange",
          "kind": "interface",
          "line": 300,
          "exported": true,
          "signature": "export interface HistoryChange { field?: string; type_id?: number; old_text?: string; new_text?: string; }"
        },
        {
          "name": "HistoryEntry",
          "kind": "interface",
          "line": 307,
          "exported": true,
          "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number; created_on?: number; changes?: HistoryChange[]; }"
        },
        {
          "name": "SoftDeleteOptions",
          "kind": "interface",
          "line": 333,
          "exported": true,
          "signature": "export interface SoftDeleteOptions { soft?: boolean; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 342,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 379,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "interface",
          "line": 400,
          "exported": true,
          "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; };…"
        },
        {
          "name": "ResultField",
          "kind": "interface",
          "line": 414,
          "exported": true,
          "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "interface",
          "line": 436,
          "exported": true,
          "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string; format?: string; rows?: string; }; }"
        },
        {
          "name": "CaseField",
          "kind": "interface",
          "line": 451,
          "exported": true,
          "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…"
        },
        {
          "name": "CaseType",
          "kind": "interface",
          "line": 471,
          "exported": true,
          "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Template",
          "kind": "interface",
          "line": 480,
          "exported": true,
          "signature": "export interface Template { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Configuration",
          "kind": "interface",
          "line": 489,
          "exported": true,
          "signature": "export interface Configuration { id: number; name: string; group_id: number; }"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "interface",
          "line": 496,
          "exported": true,
          "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }"
        },
        {
          "name": "AddConfigurationGroupPayload",
          "kind": "interface",
          "line": 503,
          "exported": true,
          "signature": "export interface AddConfigurationGroupPayload { name: string; }"
        },
        {
          "name": "UpdateConfigurationGroupPayload",
          "kind": "interface",
          "line": 508,
          "exported": true,
          "signature": "export interface UpdateConfigurationGroupPayload { name?: string; }"
        },
        {
          "name": "AddConfigurationPayload",
          "kind": "interface",
          "line": 513,
          "exported": true,
          "signature": "export interface AddConfigurationPayload { name: string; }"
        },
        {
          "name": "UpdateConfigurationPayload",
          "kind": "interface",
          "line": 518,
          "exported": true,
          "signature": "export interface UpdateConfigurationPayload { name?: string; }"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 523,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 528,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 540,
          "exported": true,
          "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 560,
          "exported": true,
          "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 573,
          "exported": true,
          "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 591,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }"
        },
        {
          "name": "AddUserPayload",
          "kind": "interface",
          "line": 603,
          "exported": true,
          "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "UpdateUserPayload",
          "kind": "interface",
          "line": 617,
          "exported": true,
          "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "Role",
          "kind": "interface",
          "line": 633,
          "exported": true,
          "signature": "export interface Role { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Group",
          "kind": "interface",
          "line": 645,
          "exported": true,
          "signature": "export interface Group { id: number; name: string; user_ids?: number[]; }"
        },
        {
          "name": "AddGroupPayload",
          "kind": "interface",
          "line": 655,
          "exported": true,
          "signature": "export interface AddGroupPayload { name: string; user_ids?: number[]; }"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "interface",
          "line": 663,
          "exported": true,
          "signature": "export interface UpdateGroupPayload { name?: string; user_ids?: number[]; }"
        },
        {
          "name": "Attachment",
          "kind": "interface",
          "line": 673,
          "exported": true,
          "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string; size?: number; created_on?: number; created_by?: number; entity_id?: number; }"
        },
        {
          "name": "SharedStep",
          "kind": "interface",
          "line": 693,
          "exported": true,
          "signature": "export interface SharedStep { id: number; title: string; project_id?: number; case_ids?: number[]; created_on?: number; created_by?: number; updated_on?: number; updated_by?: number; custom_steps_sepa…"
        },
        {
          "name": "AddSharedStepPayload",
          "kind": "interface",
          "line": 715,
          "exported": true,
          "signature": "export interface AddSharedStepPayload { title: string; custom_steps_separated?: Record<string, unknown>[]; }"
        },
        {
          "name": "UpdateSharedStepPayload",
          "kind": "interface",
          "line": 723,
          "exported": true,
          "signature": "export interface UpdateSharedStepPayload { title?: string; custom_steps_separated?: Record<string, unknown>[]; }"
        },
        {
          "name": "Variable",
          "kind": "interface",
          "line": 733,
          "exported": true,
          "signature": "export interface Variable { id: number; name: string; }"
        },
        {
          "name": "AddVariablePayload",
          "kind": "interface",
          "line": 741,
          "exported": true,
          "signature": "export interface AddVariablePayload { name: string; }"
        },
        {
          "name": "UpdateVariablePayload",
          "kind": "interface",
          "line": 747,
          "exported": true,
          "signature": "export interface UpdateVariablePayload { name?: string; }"
        },
        {
          "name": "Dataset",
          "kind": "interface",
          "line": 755,
          "exported": true,
          "signature": "export interface Dataset { id: number; name: string; project_id?: number; created_on?: number; created_by?: number; }"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "interface",
          "line": 769,
          "exported": true,
          "signature": "export interface AddDatasetPayload { name: string; }"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "interface",
          "line": 775,
          "exported": true,
          "signature": "export interface UpdateDatasetPayload { name?: string; }"
        },
        {
          "name": "Report",
          "kind": "interface",
          "line": 783,
          "exported": true,
          "signature": "export interface Report { id: number; name: string; description?: string; is_shared?: boolean; }"
        },
        {
          "name": "ReportResult",
          "kind": "interface",
          "line": 795,
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
