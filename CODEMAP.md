# CODEMAP

Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.

Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.

```json
{
  "schema": "codemap.v2",
  "repo": {
    "name": "@dichovsky/testrail-api-client",
    "version": "4.1.0"
  },
  "sourceHash": "cc08c5a61bd97186b9e58ec5835c86e0c6b2711b40c85aa364ebc205c7a55ace",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCaseFieldConfigPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 785,
      "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldConfigPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 771,
      "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
    },
    {
      "name": "AddCaseFieldPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 797,
      "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 787,
      "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
    },
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 650,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 639,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddCasesBulkPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 677,
      "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasesBulkPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 675,
      "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
    },
    {
      "name": "AddConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1099,
      "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1095,
      "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddConfigurationPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1111,
      "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1107,
      "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddDatasetPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 600,
      "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 596,
      "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 84,
      "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 79,
      "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })",
      "jsdoc": "Group write-payload schemas (TestRail 7.5+). Mirror the variable/shared-step/milestone payload-migration precedent: each schema is declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields TestRail may add to either endpoint."
    },
    {
      "name": "AddMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1041,
      "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1032,
      "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 937,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 926,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 959,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 952,
      "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
    },
    {
      "name": "AddProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 985,
      "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 978,
      "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "AddResultForCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 849,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 838,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultForTestPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 871,
      "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForTestPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 860,
      "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 834,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 824,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 855,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 851,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddResultsPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 877,
      "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 873,
      "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 810,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 799,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 912,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 903,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
    },
    {
      "name": "AddSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1023,
      "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1016,
      "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
    },
    {
      "name": "AddSharedStepPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1069,
      "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1064,
      "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
    },
    {
      "name": "AddSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1001,
      "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 996,
      "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
    },
    {
      "name": "AddUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 610,
      "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for creating a new user via POST /add_user (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 570,
      "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 566,
      "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "Attachment",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 658,
      "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string | null; size?: number | null; created_on?: number | null; created_by?: number | null; entity_id?: number | null; }",
      "jsdoc": "An attachment metadata record returned by attachment list and upload endpoints",
      "typeOnly": true
    },
    {
      "name": "AttachmentSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 529,
      "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().nullish(), size: z.number().nullish(), created_on: z.number().nullish(), created_by: z.numbe…"
    },
    {
      "name": "Case",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 101,
      "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 467,
      "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…",
      "jsdoc": "Custom case field definition returned by get_case_fields",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 452,
      "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…",
      "jsdoc": "Context/options configuration block shared by CaseField entries",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 444,
      "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 451,
      "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
    },
    {
      "name": "CaseSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 169,
      "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
    },
    {
      "name": "CaseStatus",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 307,
      "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }",
      "typeOnly": true
    },
    {
      "name": "CaseStatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 391,
      "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
    },
    {
      "name": "CaseType",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 487,
      "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case type definition returned by get_case_types",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 492,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Configuration",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 505,
      "signature": "export interface Configuration { id: number; name: string; group_id: number; }",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 512,
      "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\")",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 518,
      "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
    },
    {
      "name": "ConfigurationSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 510,
      "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
    },
    {
      "name": "CopyCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 741,
      "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "CopyCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 737,
      "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
    },
    {
      "name": "Dataset",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 594,
      "signature": "export type Dataset = z.infer<typeof DatasetSchema>",
      "typeOnly": true
    },
    {
      "name": "DatasetSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 586,
      "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().nullish(), created_on: z.number().nullish(), created_by: z.number().nullish(), })"
    },
    {
      "name": "DeleteCasesOptions",
      "kind": "type",
      "file": "src/modules/cases.ts",
      "line": 26,
      "signature": "export type DeleteCasesOptions = SoftDeleteOptions",
      "jsdoc": "@deprecated Use from `../types.js` — kept as an alias for back-compat.",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 714,
      "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 706,
      "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
    },
    {
      "name": "DeleteCasesPreview",
      "kind": "type",
      "file": "src/modules/cases.ts",
      "line": 30,
      "signature": "export type DeleteCasesPreview = SoftDeletePreview",
      "jsdoc": "@deprecated Use (re-exported from the package root) — kept as an alias for back-compat.",
      "typeOnly": true
    },
    {
      "name": "GetAttachmentsOptions",
      "kind": "interface",
      "file": "src/modules/attachments.ts",
      "line": 14,
      "signature": "export interface GetAttachmentsOptions { limit?: number; offset?: number; }",
      "jsdoc": "Optional pagination params shared by `getAttachmentsForCase`, `getAttachmentsForRun`, and `getAttachmentsForTest`. TestRail's `get_attachments_for_*` endpoints accept `limit`/`offset` query params (default page size 250). Plan-scoped endpoints (`get_attachments_for_plan`, `get_attachments_for_plan_entry`) intentionally don't accept these — they return every attachment under the plan tree.",
      "typeOnly": true
    },
    {
      "name": "GetCasesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 358,
      "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…",
      "jsdoc": "Filter options for `getCases()`. All date filters accept Unix timestamps (seconds since epoch).",
      "typeOnly": true
    },
    {
      "name": "GetHistoryForCaseOptions",
      "kind": "interface",
      "file": "src/modules/cases.ts",
      "line": 17,
      "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetMilestonesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 598,
      "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 541,
      "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 574,
      "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; defects_filter?: string; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 395,
      "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…",
      "typeOnly": true
    },
    {
      "name": "GetSharedStepHistoryOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 7,
      "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetTestsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 561,
      "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 64,
      "signature": "export type Group = z.infer<typeof GroupSchema>",
      "typeOnly": true
    },
    {
      "name": "GroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 58,
      "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
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
      "line": 316,
      "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 323,
      "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 418,
      "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
    },
    {
      "name": "Milestone",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 262,
      "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 341,
      "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
    },
    {
      "name": "MoveCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 754,
      "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 749,
      "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
    },
    {
      "name": "MoveSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 219,
      "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 214,
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
      "line": 159,
      "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 186,
      "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 896,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 886,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 259,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 273,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
    },
    {
      "name": "Priority",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 299,
      "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 376,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 147,
      "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …",
      "typeOnly": true
    },
    {
      "name": "ProjectSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 140,
      "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
    },
    {
      "name": "RateLimiterConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 529,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 694,
      "signature": "export interface Report { id: number; name: string; description?: string | null; is_shared?: boolean | null; }",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 706,
      "signature": "export interface ReportResult { report_url: string; user_report_url?: string | null; }",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 625,
      "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().nullish(), })"
    },
    {
      "name": "ReportSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 616,
      "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), is_shared: z.boolean().nullish(), })"
    },
    {
      "name": "Result",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 247,
      "signature": "export interface Result { id?: number | null; test_id?: number | null; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto…",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 430,
      "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 416,
      "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 467,
      "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 474,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 323,
      "signature": "export const ResultSchema = zObject({ id: z.number().nullish(), test_id: z.number().nullish(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().…"
    },
    {
      "name": "Role",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 640,
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
      "line": 198,
      "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 223,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
    },
    {
      "name": "Section",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 137,
      "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }",
      "typeOnly": true
    },
    {
      "name": "SectionSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 192,
      "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
    },
    {
      "name": "SharedStep",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 555,
      "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>",
      "typeOnly": true
    },
    {
      "name": "SharedStepSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 543,
      "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…"
    },
    {
      "name": "SoftDeleteOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 349,
      "signature": "export interface SoftDeleteOptions { soft?: boolean; }",
      "jsdoc": "Options for delete endpoints that support TestRail's `soft=1` server-side preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`, `delete_suite`). `delete_milestone` and `delete_project` do not accept `soft`; passing this option to those endpoints would be a no-op server-side, so the CLI rejects it instead to keep destructive intent unambiguous.",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreview",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 732,
      "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreviewSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 722,
      "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
    },
    {
      "name": "Status",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 287,
      "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 362,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "Suite",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 122,
      "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…",
      "typeOnly": true
    },
    {
      "name": "SuiteSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 153,
      "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
    },
    {
      "name": "Template",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 496,
      "signature": "export interface Template { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+)",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 500,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Test",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 230,
      "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number | null; run_id: number; title: string; template_id?: number | null; type_id?: number | null; priority_id?…",
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
      "line": 117,
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
      "line": 304,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 663,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 652,
      "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
    },
    {
      "name": "UpdateCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 697,
      "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 685,
      "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
    },
    {
      "name": "UpdateConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1105,
      "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1101,
      "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateConfigurationPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1117,
      "signature": "export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1113,
      "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateDatasetPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 612,
      "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 608,
      "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_dataset` accepts a partial body (rename-only at the moment). Mirrors the `UpdateVariablePayloadSchema` precedent — empty `{}` body is intentionally allowed and forwarded to TestRail, which treats it as a no-op. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 91,
      "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 86,
      "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1054,
      "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1043,
      "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 950,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 939,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 968,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 961,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 994,
      "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 987,
      "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 924,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 917,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 822,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 812,
      "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
    },
    {
      "name": "UpdateSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1030,
      "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1025,
      "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateSharedStepPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1085,
      "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1080,
      "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })",
      "jsdoc": "Update payload for `update_shared_step`. Every field is optional — TestRail accepts an empty object (`{}`) as a no-op update, so the CLI's `shared-step update <id> --data '{}'` is intentionally a valid call. This mirrors `UpdateMilestonePayloadSchema` and `UpdateCasePayloadSchema`: empty bodies are accepted at the schema layer; rejecting them is the API's responsibility, not the client's. Callers that want to enforce \"non-empty update\" must do so above this schema."
    },
    {
      "name": "UpdateSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1008,
      "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1003,
      "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 624,
      "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 584,
      "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 580,
      "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_variable` accepts an empty body as a no-op: every field is optional. We intentionally do NOT enforce \"at least one field set\" client-side — TestRail itself accepts `{}` and returns the unchanged variable. Mirrors the `UpdateSectionPayloadSchema` precedent below, where empty-body updates are also passed through. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UploadFileInput",
      "kind": "type",
      "file": "src/types.ts",
      "line": 99,
      "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput",
      "typeOnly": true
    },
    {
      "name": "UploadFilePathInput",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 85,
      "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 278,
      "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; }",
      "typeOnly": true
    },
    {
      "name": "UserAddPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 122,
      "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserAddPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 110,
      "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…",
      "jsdoc": "User write-payload schemas (TestRail 7.3+). Mirror the group/milestone payload pattern: declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future fields TestRail may add to either endpoint."
    },
    {
      "name": "UserSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 39,
      "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), })"
    },
    {
      "name": "UserUpdatePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 136,
      "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserUpdatePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 124,
      "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
    },
    {
      "name": "Variable",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 564,
      "signature": "export type Variable = z.infer<typeof VariableSchema>",
      "typeOnly": true
    },
    {
      "name": "VariableSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 559,
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
          "line": 15,
          "exported": true,
          "signature": "export type BodySource = 'data' | 'file' | 'stdin' | 'default'"
        },
        {
          "name": "BodyResolution",
          "kind": "type",
          "line": 17,
          "exported": true,
          "signature": "export type BodyResolution<T> = { ok: true; payload: T; source: BodySource } | { ok: false; error: string }"
        },
        {
          "name": "resolveBody",
          "kind": "function",
          "line": 43,
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
        "./handlers/case-field.js",
        "./handlers/case-status.js",
        "./handlers/case-type.js",
        "./handlers/case-write.js",
        "./handlers/case.js",
        "./handlers/configuration-write.js",
        "./handlers/configuration.js",
        "./handlers/dataset-write.js",
        "./handlers/dataset.js",
        "./handlers/group-write.js",
        "./handlers/group.js",
        "./handlers/milestone-write.js",
        "./handlers/milestone.js",
        "./handlers/plan-write.js",
        "./handlers/plan.js",
        "./handlers/priority.js",
        "./handlers/project-write.js",
        "./handlers/project.js",
        "./handlers/report.js",
        "./handlers/result-field.js",
        "./handlers/result-write.js",
        "./handlers/result.js",
        "./handlers/role.js",
        "./handlers/run-watch.js",
        "./handlers/run-write.js",
        "./handlers/run.js",
        "./handlers/section-write.js",
        "./handlers/section.js",
        "./handlers/shared-step-write.js",
        "./handlers/shared-step.js",
        "./handlers/status.js",
        "./handlers/suite-write.js",
        "./handlers/suite.js",
        "./handlers/template.js",
        "./handlers/test.js",
        "./handlers/user-write.js",
        "./handlers/user.js",
        "./handlers/variable-write.js",
        "./handlers/variable.js",
        "./metadata.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HANDLERS",
          "kind": "const",
          "line": 109,
          "exported": false,
          "signature": "const HANDLERS: Record<string, Handler> = { 'project:get': handleProjectGet, 'project:list': handleProjectList, 'project:add': handleProjectAdd, 'project:update': handleProjectUpdate, 'project:delete'…"
        },
        {
          "name": "RESOURCES",
          "kind": "const",
          "line": 230,
          "exported": false,
          "signature": "const RESOURCES: Record<string, readonly string[]> = (() => { const grouped: Record<string, string[]> = {}; for (const key of Object.keys(HANDLERS)) { const [resource, action] = key.split(':'); if (re…"
        },
        {
          "name": "DispatchResult",
          "kind": "type",
          "line": 245,
          "exported": true,
          "signature": "export type DispatchResult = { ok: true; handler: Handler } | { ok: false; error: string }"
        },
        {
          "name": "getRegisteredActions",
          "kind": "function",
          "line": 252,
          "exported": true,
          "signature": "export function getRegisteredActions(): readonly string[]"
        },
        {
          "name": "DESTRUCTIVE_ENV_VAR",
          "kind": "const",
          "line": 268,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_VAR = 'TESTRAIL_ALLOW_DESTRUCTIVE'"
        },
        {
          "name": "DESTRUCTIVE_ENV_ALLOW_VALUE",
          "kind": "const",
          "line": 274,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_ALLOW_VALUE = '1'"
        },
        {
          "name": "EnvGateResult",
          "kind": "type",
          "line": 276,
          "exported": true,
          "signature": "export type EnvGateResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkDestructiveEnvGate",
          "kind": "function",
          "line": 300,
          "exported": true,
          "signature": "export function checkDestructiveEnvGate( spec: ActionSpec | undefined, env: Readonly<Record<string, string | undefined>>, dryRun: boolean, ): EnvGateResult"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 325,
          "exported": true,
          "signature": "export function dispatch(resource: string, action: string): DispatchResult"
        }
      ]
    },
    {
      "path": "src/cli/file-input.ts",
      "imports": [
        "../constants.js",
        "node:fs",
        "node:path"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "STDIN_SENTINEL",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const STDIN_SENTINEL = '-'"
        },
        {
          "name": "FileInput",
          "kind": "interface",
          "line": 27,
          "exported": true,
          "signature": "export interface FileInput { fileFlag?: string; filenameFlag?: string; }"
        },
        {
          "name": "FileResolution",
          "kind": "type",
          "line": 40,
          "exported": true,
          "signature": "export type FileResolution = | { ok: true; path: string; filename: string; size: number; contents?: Uint8Array; fd?: number | undefined; source: 'file' | 'stdin'; } | { ok: false; error: string }"
        },
        {
          "name": "ResolveFileOptions",
          "kind": "interface",
          "line": 54,
          "exported": true,
          "signature": "export interface ResolveFileOptions { read: boolean; }"
        },
        {
          "name": "resolveFile",
          "kind": "function",
          "line": 83,
          "exported": true,
          "signature": "export async function resolveFile(input: FileInput, opts: ResolveFileOptions): Promise<FileResolution>"
        },
        {
          "name": "resolveFromStdin",
          "kind": "function",
          "line": 146,
          "exported": false,
          "signature": "async function resolveFromStdin(input: FileInput, opts: ResolveFileOptions): Promise<FileResolution>"
        },
        {
          "name": "readStdinBinary",
          "kind": "function",
          "line": 197,
          "exported": true,
          "signature": "export async function readStdinBinary(maxBytes: number, timeoutMs: number): Promise<Uint8Array>"
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
          "name": "STDOUT_SENTINEL",
          "kind": "const",
          "line": 10,
          "exported": true,
          "signature": "export const STDOUT_SENTINEL = '-'"
        },
        {
          "name": "FileOutput",
          "kind": "interface",
          "line": 16,
          "exported": true,
          "signature": "export interface FileOutput { outFlag?: string; }"
        },
        {
          "name": "OutputResolution",
          "kind": "type",
          "line": 20,
          "exported": true,
          "signature": "export type OutputResolution = { ok: true; path: string; target: 'file' | 'stdout' } | { ok: false; error: string }"
        },
        {
          "name": "ResolveOutOptions",
          "kind": "interface",
          "line": 22,
          "exported": true,
          "signature": "export interface ResolveOutOptions { force: boolean; dryRun: boolean; }"
        },
        {
          "name": "resolveOut",
          "kind": "function",
          "line": 46,
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
          "line": 63,
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
          "signature": "export interface HandlerArgs { pathParams: readonly string[]; projectId?: string; suiteId?: string; runId?: string; caseId?: string; limit?: string; offset?: string; statusId?: string; defectsFilter?:…"
        },
        {
          "name": "BodyInput",
          "kind": "interface",
          "line": 66,
          "exported": true,
          "signature": "export interface BodyInput { dataFlag?: string; dataFileFlag?: string; readStdin?: () => string; }"
        },
        {
          "name": "HandlerContext",
          "kind": "interface",
          "line": 72,
          "exported": true,
          "signature": "export interface HandlerContext { client: TestRailClient; args: HandlerArgs; bodyInput: BodyInput; dryRun: boolean; force: boolean; confirmDestructive: boolean; out: (data: unknown) => void; err?: (me…"
        },
        {
          "name": "Handler",
          "kind": "type",
          "line": 96,
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
          "line": 19,
          "exported": false,
          "signature": "interface ResolvedUpload { filename: string; path: string; contents?: Uint8Array; fd?: number | undefined; source: 'file' | 'stdin'; }"
        },
        {
          "name": "setupUpload",
          "kind": "function",
          "line": 42,
          "exported": false,
          "signature": "async function setupUpload( ctx: HandlerContext, action: string, idFields: Record<string, number>, ): Promise<ResolvedUpload | null>"
        },
        {
          "name": "uploadPayload",
          "kind": "function",
          "line": 87,
          "exported": false,
          "signature": "function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array"
        },
        {
          "name": "handleAttachmentAddToCase",
          "kind": "function",
          "line": 94,
          "exported": true,
          "signature": "export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToResult",
          "kind": "function",
          "line": 101,
          "exported": true,
          "signature": "export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToRun",
          "kind": "function",
          "line": 108,
          "exported": true,
          "signature": "export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlan",
          "kind": "function",
          "line": 115,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlanEntry",
          "kind": "function",
          "line": 122,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentDelete",
          "kind": "function",
          "line": 135,
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
        "../output.js",
        "../safe-write.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "paginationFromCtx",
          "kind": "function",
          "line": 16,
          "exported": false,
          "signature": "function paginationFromCtx(ctx: HandlerContext): { limit?: number; offset?: number }"
        },
        {
          "name": "handleAttachmentListForCase",
          "kind": "function",
          "line": 25,
          "exported": true,
          "signature": "export async function handleAttachmentListForCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForRun",
          "kind": "function",
          "line": 30,
          "exported": true,
          "signature": "export async function handleAttachmentListForRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForTest",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export async function handleAttachmentListForTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlan",
          "kind": "function",
          "line": 40,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlanEntry",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentGet",
          "kind": "function",
          "line": 63,
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
        "../output.js",
        "../safe-write.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleBddGet",
          "kind": "function",
          "line": 22,
          "exported": true,
          "signature": "export async function handleBddGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleBddAdd",
          "kind": "function",
          "line": 72,
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
      "path": "src/cli/handlers/case-field.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseFieldList",
          "kind": "function",
          "line": 13,
          "exported": true,
          "signature": "export async function handleCaseFieldList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-status.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseStatusList",
          "kind": "function",
          "line": 13,
          "exported": true,
          "signature": "export async function handleCaseStatusList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-type.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseTypeList",
          "kind": "function",
          "line": 12,
          "exported": true,
          "signature": "export async function handleCaseTypeList(ctx: HandlerContext): Promise<void>"
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
          "line": 14,
          "exported": true,
          "signature": "export async function handleCaseAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseAddBulk",
          "kind": "function",
          "line": 33,
          "exported": true,
          "signature": "export async function handleCaseAddBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseUpdate",
          "kind": "function",
          "line": 51,
          "exported": true,
          "signature": "export async function handleCaseUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseUpdateBulk",
          "kind": "function",
          "line": 62,
          "exported": true,
          "signature": "export async function handleCaseUpdateBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseDeleteBulk",
          "kind": "function",
          "line": 86,
          "exported": true,
          "signature": "export async function handleCaseDeleteBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseCopyToSection",
          "kind": "function",
          "line": 125,
          "exported": true,
          "signature": "export async function handleCaseCopyToSection(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseMoveToSection",
          "kind": "function",
          "line": 142,
          "exported": true,
          "signature": "export async function handleCaseMoveToSection(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseDelete",
          "kind": "function",
          "line": 166,
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
      "path": "src/cli/handlers/configuration-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleConfigurationGroupAdd",
          "kind": "function",
          "line": 19,
          "exported": true,
          "signature": "export async function handleConfigurationGroupAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationGroupUpdate",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export async function handleConfigurationGroupUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationGroupDelete",
          "kind": "function",
          "line": 64,
          "exported": true,
          "signature": "export async function handleConfigurationGroupDelete(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationAdd",
          "kind": "function",
          "line": 86,
          "exported": true,
          "signature": "export async function handleConfigurationAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationUpdate",
          "kind": "function",
          "line": 103,
          "exported": true,
          "signature": "export async function handleConfigurationUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationDelete",
          "kind": "function",
          "line": 127,
          "exported": true,
          "signature": "export async function handleConfigurationDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/configuration.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleConfigurationList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleConfigurationList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/dataset-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDatasetAdd",
          "kind": "function",
          "line": 8,
          "exported": true,
          "signature": "export async function handleDatasetAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetUpdate",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export async function handleDatasetUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetDelete",
          "kind": "function",
          "line": 72,
          "exported": true,
          "signature": "export async function handleDatasetDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/dataset.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDatasetGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleDatasetGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleDatasetList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/group-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleGroupAdd",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleGroupAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupUpdate",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export async function handleGroupUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupDelete",
          "kind": "function",
          "line": 70,
          "exported": true,
          "signature": "export async function handleGroupDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/group.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleGroupGet",
          "kind": "function",
          "line": 10,
          "exported": true,
          "signature": "export async function handleGroupGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupList",
          "kind": "function",
          "line": 22,
          "exported": true,
          "signature": "export async function handleGroupList(ctx: HandlerContext): Promise<void>"
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
          "line": 13,
          "exported": true,
          "signature": "export async function handlePlanAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdate",
          "kind": "function",
          "line": 24,
          "exported": true,
          "signature": "export async function handlePlanUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanAddEntry",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export async function handlePlanAddEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanAddRunToEntry",
          "kind": "function",
          "line": 46,
          "exported": true,
          "signature": "export async function handlePlanAddRunToEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdateEntry",
          "kind": "function",
          "line": 65,
          "exported": true,
          "signature": "export async function handlePlanUpdateEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdateRunInEntry",
          "kind": "function",
          "line": 84,
          "exported": true,
          "signature": "export async function handlePlanUpdateRunInEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanClose",
          "kind": "function",
          "line": 112,
          "exported": true,
          "signature": "export async function handlePlanClose(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanDelete",
          "kind": "function",
          "line": 134,
          "exported": true,
          "signature": "export async function handlePlanDelete(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanDeleteEntry",
          "kind": "function",
          "line": 157,
          "exported": true,
          "signature": "export async function handlePlanDeleteEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanDeleteRunFromEntry",
          "kind": "function",
          "line": 180,
          "exported": true,
          "signature": "export async function handlePlanDeleteRunFromEntry(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/priority.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePriorityList",
          "kind": "function",
          "line": 12,
          "exported": true,
          "signature": "export async function handlePriorityList(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/report.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleReportList",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleReportList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleReportRun",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleReportRun(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/result-field.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultFieldList",
          "kind": "function",
          "line": 10,
          "exported": true,
          "signature": "export async function handleResultFieldList(ctx: HandlerContext): Promise<void>"
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
          "name": "handleResultAddByTest",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleResultAddByTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultAdd",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleResultAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultAddBulk",
          "kind": "function",
          "line": 42,
          "exported": true,
          "signature": "export async function handleResultAddBulk(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultAddBulkByTest",
          "kind": "function",
          "line": 59,
          "exported": true,
          "signature": "export async function handleResultAddBulkByTest(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/result.ts",
      "imports": [
        "../../types.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultList",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleResultList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "buildResultOptions",
          "kind": "function",
          "line": 27,
          "exported": false,
          "signature": "function buildResultOptions(ctx: HandlerContext): GetResultsOptions"
        },
        {
          "name": "handleResultListForTest",
          "kind": "function",
          "line": 40,
          "exported": true,
          "signature": "export async function handleResultListForTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultListForCase",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export async function handleResultListForCase(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/role.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRoleList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleRoleList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/run-watch.ts",
      "imports": [
        "../../errors.js",
        "../../types.js",
        "../handler-context.js",
        "../ids.js",
        "../sanitize.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "DEFAULT_WATCH_INTERVAL_S",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const DEFAULT_WATCH_INTERVAL_S = 30"
        },
        {
          "name": "MIN_WATCH_INTERVAL_S",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const MIN_WATCH_INTERVAL_S = 5"
        },
        {
          "name": "MAX_WATCH_INTERVAL_S",
          "kind": "const",
          "line": 31,
          "exported": true,
          "signature": "export const MAX_WATCH_INTERVAL_S = 600"
        },
        {
          "name": "WATCHED_FIELDS",
          "kind": "const",
          "line": 39,
          "exported": false,
          "signature": "const WATCHED_FIELDS = [ 'is_completed', 'untested_count', 'passed_count', 'failed_count', 'retest_count', 'blocked_count', ] as const"
        },
        {
          "name": "WatchedField",
          "kind": "type",
          "line": 48,
          "exported": false,
          "signature": "type WatchedField = (typeof WATCHED_FIELDS)[number]"
        },
        {
          "name": "Snapshot",
          "kind": "type",
          "line": 49,
          "exported": false,
          "signature": "type Snapshot = Readonly<Pick<Run, WatchedField>>"
        },
        {
          "name": "snapshot",
          "kind": "function",
          "line": 51,
          "exported": false,
          "signature": "function snapshot(run: Run): Snapshot"
        },
        {
          "name": "Diff",
          "kind": "interface",
          "line": 62,
          "exported": false,
          "signature": "interface Diff { field: WatchedField; from: Run[WatchedField]; to: Run[WatchedField]; }"
        },
        {
          "name": "diff",
          "kind": "function",
          "line": 68,
          "exported": false,
          "signature": "function diff(prev: Snapshot, next: Snapshot): readonly Diff[]"
        },
        {
          "name": "isTransientError",
          "kind": "function",
          "line": 83,
          "exported": false,
          "signature": "function isTransientError(e: unknown): boolean"
        },
        {
          "name": "parseInterval",
          "kind": "function",
          "line": 98,
          "exported": false,
          "signature": "function parseInterval(raw: string | undefined): number"
        },
        {
          "name": "handleRunWatch",
          "kind": "function",
          "line": 142,
          "exported": true,
          "signature": "export async function handleRunWatch(ctx: HandlerContext): Promise<void>"
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
          "name": "handleRunUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleRunUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunClose",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export async function handleRunClose(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunDelete",
          "kind": "function",
          "line": 64,
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
      "path": "src/cli/handlers/section.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSectionGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleSectionGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSectionList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleSectionList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/shared-step-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleSharedStepAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleSharedStepUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepDelete",
          "kind": "function",
          "line": 56,
          "exported": true,
          "signature": "export async function handleSharedStepDelete(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/status.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleStatusList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleStatusList(ctx: HandlerContext): Promise<void>"
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
      "path": "src/cli/handlers/template.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleTemplateList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleTemplateList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/test.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "parseStatusIdList",
          "kind": "function",
          "line": 11,
          "exported": false,
          "signature": "function parseStatusIdList(raw: string | undefined): number[] | undefined"
        },
        {
          "name": "handleTestGet",
          "kind": "function",
          "line": 16,
          "exported": true,
          "signature": "export async function handleTestGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleTestList",
          "kind": "function",
          "line": 21,
          "exported": true,
          "signature": "export async function handleTestList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/user-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleUserAdd",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function handleUserAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserUpdate",
          "kind": "function",
          "line": 30,
          "exported": true,
          "signature": "export async function handleUserUpdate(ctx: HandlerContext): Promise<void>"
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
        },
        {
          "name": "handleUserGetByEmail",
          "kind": "function",
          "line": 30,
          "exported": true,
          "signature": "export async function handleUserGetByEmail(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserGetCurrent",
          "kind": "function",
          "line": 49,
          "exported": true,
          "signature": "export async function handleUserGetCurrent(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/variable-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVariableAdd",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleVariableAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleVariableUpdate",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleVariableUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleVariableDelete",
          "kind": "function",
          "line": 53,
          "exported": true,
          "signature": "export async function handleVariableDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/variable.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVariableList",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleVariableList(ctx: HandlerContext): Promise<void>"
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
          "name": "POSITIVE_INT_RE",
          "kind": "const",
          "line": 14,
          "exported": false,
          "signature": "const POSITIVE_INT_RE = /^[1-9]\\d*$/"
        },
        {
          "name": "NON_NEG_INT_RE",
          "kind": "const",
          "line": 26,
          "exported": false,
          "signature": "const NON_NEG_INT_RE = /^(0|[1-9]\\d*)$/"
        },
        {
          "name": "parseId",
          "kind": "function",
          "line": 28,
          "exported": true,
          "signature": "export function parseId(raw: string | undefined, name: string): number"
        },
        {
          "name": "parseEntryId",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export function parseEntryId(raw: string | undefined, name: string): string"
        },
        {
          "name": "optInt",
          "kind": "function",
          "line": 52,
          "exported": true,
          "signature": "export function optInt(raw: string | undefined): number | undefined"
        },
        {
          "name": "parseIdList",
          "kind": "function",
          "line": 67,
          "exported": true,
          "signature": "export function parseIdList(raw: string | undefined, name: string): number[] | undefined"
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
        "./file-input.js",
        "./file-output.js",
        "./flags.js",
        "./handler-context.js",
        "./install-skill.js",
        "./metadata.js",
        "./output.js",
        "./sanitize.js",
        "./stdin.js",
        "./uninstall-skill.js",
        "node:module",
        "node:util"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "require",
          "kind": "const",
          "line": 21,
          "exported": false,
          "signature": "const require = createRequire(import.meta.url)"
        },
        {
          "name": "VERSION",
          "kind": "const",
          "line": 22,
          "exported": false,
          "signature": "const VERSION: string = (require('../../package.json') as { version: string }).version"
        },
        {
          "name": "HELP",
          "kind": "const",
          "line": 26,
          "exported": false,
          "signature": "const HELP = `\ntestrail <resource> <action> [args] [options]\n\nRead actions:\n  project  get <id> | list [--limit N] [--offset N]\n  suite    get <id> | list --project-id <id>\n  case     get <id> | list …"
        },
        {
          "name": "main",
          "kind": "function",
          "line": 263,
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
          "line": 33,
          "exported": true,
          "signature": "export interface InstallSkillOptions { global: boolean; force: boolean; printPath: boolean; quiet: boolean; sourceOverride?: string; cwdOverride?: string; homeOverride?: string; }"
        },
        {
          "name": "getBundledSkillPath",
          "kind": "function",
          "line": 52,
          "exported": true,
          "signature": "export function getBundledSkillPath(metaUrl: string): string"
        },
        {
          "name": "runInstallSkill",
          "kind": "function",
          "line": 56,
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
          "line": 68,
          "exported": true,
          "signature": "export interface PathParam { name: string; description: string; }"
        },
        {
          "name": "ActionSpec",
          "kind": "interface",
          "line": 73,
          "exported": true,
          "signature": "export interface ActionSpec { resource: string; action: string; summary: string; pathParams: readonly PathParam[]; apiEndpoint: string; bodySchema?: z.ZodTypeAny; fileInput?: boolean; fileOutput?: boo…"
        },
        {
          "name": "ACTIONS",
          "kind": "const",
          "line": 111,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ { resource: 'project', action: 'get', summary: 'Fetch a single project by ID', pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 1207,
          "exported": true,
          "signature": "export function getActionSpec(resource: string, action: string): ActionSpec | undefined"
        }
      ]
    },
    {
      "path": "src/cli/output.ts",
      "imports": [
        "../constants.js",
        "./sanitize.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "OutputFormat",
          "kind": "type",
          "line": 4,
          "exported": true,
          "signature": "export type OutputFormat = 'json' | 'table' | 'yaml' | 'csv'"
        },
        {
          "name": "OutputOptions",
          "kind": "interface",
          "line": 6,
          "exported": true,
          "signature": "export interface OutputOptions { quiet: boolean; format: OutputFormat; }"
        },
        {
          "name": "Output",
          "kind": "interface",
          "line": 11,
          "exported": true,
          "signature": "export interface Output { out: (data: unknown) => void; err: (message: string) => void; errRaw: (chunk: string) => void; }"
        },
        {
          "name": "valueToString",
          "kind": "function",
          "line": 21,
          "exported": true,
          "signature": "export function valueToString(v: unknown): string"
        },
        {
          "name": "getField",
          "kind": "function",
          "line": 43,
          "exported": false,
          "signature": "function getField(row: unknown, key: string): unknown"
        },
        {
          "name": "renderTable",
          "kind": "function",
          "line": 48,
          "exported": true,
          "signature": "export function renderTable(data: unknown): string"
        },
        {
          "name": "safeJsonStringify",
          "kind": "function",
          "line": 97,
          "exported": true,
          "signature": "export function safeJsonStringify(data: unknown): string"
        },
        {
          "name": "SPECIAL_BARE_STRINGS",
          "kind": "const",
          "line": 129,
          "exported": false,
          "signature": "const SPECIAL_BARE_STRINGS: ReadonlySet<string> = new Set([ '', '~', 'null', 'Null', 'NULL', 'true', 'True', 'TRUE', 'false', 'False', 'FALSE', 'yes', 'Yes', 'YES', 'no', 'No', 'NO', 'on', 'On', 'ON',…"
        },
        {
          "name": "needsQuoting",
          "kind": "function",
          "line": 166,
          "exported": false,
          "signature": "function needsQuoting(s: string): boolean"
        },
        {
          "name": "escapeDoubleQuoted",
          "kind": "function",
          "line": 197,
          "exported": false,
          "signature": "function escapeDoubleQuoted(s: string): string"
        },
        {
          "name": "renderYamlScalar",
          "kind": "function",
          "line": 240,
          "exported": false,
          "signature": "function renderYamlScalar(v: unknown): string"
        },
        {
          "name": "isPlainObject",
          "kind": "function",
          "line": 262,
          "exported": false,
          "signature": "function isPlainObject(v: unknown): v is Record<string, unknown>"
        },
        {
          "name": "renderYamlNode",
          "kind": "function",
          "line": 271,
          "exported": false,
          "signature": "function renderYamlNode(v: unknown, depth: number): string"
        },
        {
          "name": "renderYaml",
          "kind": "function",
          "line": 352,
          "exported": true,
          "signature": "export function renderYaml(value: unknown): string"
        },
        {
          "name": "CSV_LINE_TERMINATOR",
          "kind": "const",
          "line": 372,
          "exported": false,
          "signature": "const CSV_LINE_TERMINATOR = '\\r\\n'"
        },
        {
          "name": "csvCellRequiresQuoting",
          "kind": "function",
          "line": 374,
          "exported": false,
          "signature": "function csvCellRequiresQuoting(cell: string): boolean"
        },
        {
          "name": "csvEscapeCell",
          "kind": "function",
          "line": 378,
          "exported": false,
          "signature": "function csvEscapeCell(cell: string): string"
        },
        {
          "name": "sanitizeForCsv",
          "kind": "function",
          "line": 385,
          "exported": false,
          "signature": "function sanitizeForCsv(cell: string): string"
        },
        {
          "name": "csvCellFromValue",
          "kind": "function",
          "line": 391,
          "exported": false,
          "signature": "function csvCellFromValue(v: unknown): string"
        },
        {
          "name": "renderCsv",
          "kind": "function",
          "line": 427,
          "exported": true,
          "signature": "export function renderCsv(value: unknown): string"
        },
        {
          "name": "createOutput",
          "kind": "function",
          "line": 481,
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
      "path": "src/cli/uninstall-skill.ts",
      "imports": [
        "./sanitize.js",
        "node:fs",
        "node:os",
        "node:path"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "UninstallSkillOptions",
          "kind": "interface",
          "line": 42,
          "exported": true,
          "signature": "export interface UninstallSkillOptions { global: boolean; quiet: boolean; cwdOverride?: string; homeOverride?: string; }"
        },
        {
          "name": "getInstallTarget",
          "kind": "function",
          "line": 56,
          "exported": true,
          "signature": "export function getInstallTarget(opts: Pick<UninstallSkillOptions, 'global' | 'cwdOverride' | 'homeOverride'>): string"
        },
        {
          "name": "runUninstallSkill",
          "kind": "function",
          "line": 61,
          "exported": true,
          "signature": "export function runUninstallSkill(opts: UninstallSkillOptions): number"
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
        "node:fs",
        "node:net",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "isFilePathInput",
          "kind": "function",
          "line": 19,
          "exported": false,
          "signature": "function isFilePathInput(value: unknown): value is UploadFilePathInput"
        },
        {
          "name": "USER_AGENT",
          "kind": "const",
          "line": 29,
          "exported": false,
          "signature": "const USER_AGENT = `${pkg.description}/${pkg.version}`"
        },
        {
          "name": "PRIVATE_HOST_PATTERNS",
          "kind": "const",
          "line": 56,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^0\\./, ]"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 69,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 91,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 123,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string): Promise<void>"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 172,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 173,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 176,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 182,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 205,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 206
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 209
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 210
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 211
            },
            {
              "name": "enableCache",
              "kind": "property",
              "line": 212
            },
            {
              "name": "cacheTtl",
              "kind": "property",
              "line": 213
            },
            {
              "name": "cacheCleanupInterval",
              "kind": "property",
              "line": 214
            },
            {
              "name": "maxCacheSize",
              "kind": "property",
              "line": 215
            },
            {
              "name": "cache",
              "kind": "property",
              "line": 216
            },
            {
              "name": "cacheCleanupTimer",
              "kind": "property",
              "line": 217
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 218
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 219
            },
            {
              "name": "hostname",
              "kind": "property",
              "line": 220
            },
            {
              "name": "allowPrivateHosts",
              "kind": "property",
              "line": 221
            },
            {
              "name": "maxJsonResponseBytes",
              "kind": "property",
              "line": 222
            },
            {
              "name": "maxBinaryResponseBytes",
              "kind": "property",
              "line": 223
            },
            {
              "name": "bodyTimeout",
              "kind": "property",
              "line": 228
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 230
            },
            {
              "name": "validateConfig",
              "kind": "method",
              "line": 289
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 435
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 460
            },
            {
              "name": "assertNotRedirect",
              "kind": "method",
              "line": 501
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 519
            },
            {
              "name": "validateId",
              "kind": "method",
              "line": 547
            },
            {
              "name": "validateEntryId",
              "kind": "method",
              "line": 557
            },
            {
              "name": "validatePaginationParams",
              "kind": "method",
              "line": 567
            },
            {
              "name": "buildEndpoint",
              "kind": "method",
              "line": 586
            },
            {
              "name": "getCachedData",
              "kind": "method",
              "line": 598
            },
            {
              "name": "setCachedData",
              "kind": "method",
              "line": 619
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 641
            },
            {
              "name": "startCacheCleanup",
              "kind": "method",
              "line": 645
            },
            {
              "name": "stopCacheCleanup",
              "kind": "method",
              "line": 656
            },
            {
              "name": "cleanupExpiredCache",
              "kind": "method",
              "line": 663
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 690
            },
            {
              "name": "request",
              "kind": "method",
              "line": 724
            },
            {
              "name": "requestText",
              "kind": "method",
              "line": 904
            },
            {
              "name": "requestMultipart",
              "kind": "method",
              "line": 1030
            },
            {
              "name": "requestBinary",
              "kind": "method",
              "line": 1160
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 1266
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 1275
            },
            {
              "name": "requestParsed",
              "kind": "method",
              "line": 1308
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
          "line": 117,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 119
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 120
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 121
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 122
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 123
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 124
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 125
            },
            {
              "name": "results",
              "kind": "property",
              "line": 126
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 127
            },
            {
              "name": "users",
              "kind": "property",
              "line": 128
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 129
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 130
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 131
            },
            {
              "name": "bdd",
              "kind": "property",
              "line": 132
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 133
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 134
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 135
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 136
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 138
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 167
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 176
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 184
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 193
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 202
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 213
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 222
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 231
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 240
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
              "name": "deleteSuite",
              "kind": "method",
              "line": 253
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 254
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 268
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 280
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 292
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 301
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
              "name": "deleteSection",
              "kind": "method",
              "line": 314
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 315
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 330
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 341
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 362
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 371
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 384
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 393
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 404
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 405
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 407
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 408
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 420
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 431
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 437
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 444
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 450
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 470
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 479
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 488
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 499
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 511
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 520
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 529
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 538
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 547
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 556
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 565
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 574
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 583
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 592
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 601
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 612
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 624
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 633
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 642
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 651
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 661
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 662
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 664
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 665
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 679
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 690
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 704
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 717
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 729
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 738
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 747
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 756
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 765
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 776
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 788
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 800
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 812
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 823
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 836
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 847
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 860
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 868
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 878
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 890
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 900
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 909
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 919
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 929
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 939
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 959
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 967
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 980
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 993
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 1005
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 1017
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 1031
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 1043
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 1055
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 1066
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 1076
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 1089
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 1097
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 1107
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 1119
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 1130
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 1144
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 1156
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 1168
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 1179
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 1191
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 1202
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 1215
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 1228
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 1241
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 1254
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 1268
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 1284
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 1301
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 1314
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 1327
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 1338
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 1350
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 1362
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 1373
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 1382
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 1395
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 1407
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 1419
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 1430
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 1443
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 1454
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 1466
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 1478
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 1489
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 1502
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 1513
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
        },
        {
          "name": "MAX_STDIN_UPLOAD_BYTES",
          "kind": "const",
          "line": 85,
          "exported": true,
          "signature": "export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "STDIN_READ_TIMEOUT_MS",
          "kind": "const",
          "line": 99,
          "exported": true,
          "signature": "export const STDIN_READ_TIMEOUT_MS = 30000"
        },
        {
          "name": "YAML_INDENT_SPACES",
          "kind": "const",
          "line": 107,
          "exported": true,
          "signature": "export const YAML_INDENT_SPACES = 2"
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
        "./modules/attachments.js",
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
          "name": "GetAttachmentsOptions",
          "kind": "interface",
          "line": 14,
          "exported": true,
          "signature": "export interface GetAttachmentsOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "AttachmentModule",
          "kind": "class",
          "line": 21,
          "exported": true,
          "signature": "export class AttachmentModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 22
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 25
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 44
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 63
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 82
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 96
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 111
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 117
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 123
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 129
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 135
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 141
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 157
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
        "../errors.js",
        "../schemas.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetHistoryForCaseOptions",
          "kind": "interface",
          "line": 17,
          "exported": true,
          "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "DeleteCasesOptions",
          "kind": "type",
          "line": 26,
          "exported": true,
          "signature": "export type DeleteCasesOptions = SoftDeleteOptions"
        },
        {
          "name": "DeleteCasesPreview",
          "kind": "type",
          "line": 30,
          "exported": true,
          "signature": "export type DeleteCasesPreview = SoftDeletePreview"
        },
        {
          "name": "CaseModule",
          "kind": "class",
          "line": 32,
          "exported": true,
          "signature": "export class CaseModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 33
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 36
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 42
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 91
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 110
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 146
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 160
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 161
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 167
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 168
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 192
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 205
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 211
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 218
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 224
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 247
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 264
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 270
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
        "../schemas.js"
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
              "line": 36
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 61
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 84
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 90
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 102
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 113
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
          "line": 7,
          "exported": true,
          "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "SharedStepModule",
          "kind": "class",
          "line": 14,
          "exported": true,
          "signature": "export class SharedStepModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 15
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 18
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 24
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 34
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 40
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 51
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 57
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
          "line": 8,
          "exported": false,
          "signature": "const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/"
        },
        {
          "name": "UsersModule",
          "kind": "class",
          "line": 10,
          "exported": true,
          "signature": "export class UsersModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 11
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 20
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 30
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 53
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 58
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 63
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 69
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 75
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 80
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 85
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 91
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/variables.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js"
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
          "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), })"
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
          "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
        },
        {
          "name": "Group",
          "kind": "type",
          "line": 64,
          "exported": true,
          "signature": "export type Group = z.infer<typeof GroupSchema>"
        },
        {
          "name": "AddGroupPayloadSchema",
          "kind": "const",
          "line": 79,
          "exported": true,
          "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "AddGroupPayload",
          "kind": "type",
          "line": 84,
          "exported": true,
          "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>"
        },
        {
          "name": "UpdateGroupPayloadSchema",
          "kind": "const",
          "line": 86,
          "exported": true,
          "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "type",
          "line": 91,
          "exported": true,
          "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>"
        },
        {
          "name": "UserAddPayloadSchema",
          "kind": "const",
          "line": 110,
          "exported": true,
          "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…"
        },
        {
          "name": "UserAddPayload",
          "kind": "type",
          "line": 122,
          "exported": true,
          "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>"
        },
        {
          "name": "UserUpdatePayloadSchema",
          "kind": "const",
          "line": 124,
          "exported": true,
          "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
        },
        {
          "name": "UserUpdatePayload",
          "kind": "type",
          "line": 136,
          "exported": true,
          "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>"
        },
        {
          "name": "ProjectSchema",
          "kind": "const",
          "line": 140,
          "exported": true,
          "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
        },
        {
          "name": "Project",
          "kind": "type",
          "line": 151,
          "exported": true,
          "signature": "export type Project = z.infer<typeof ProjectSchema>"
        },
        {
          "name": "SuiteSchema",
          "kind": "const",
          "line": 153,
          "exported": true,
          "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
        },
        {
          "name": "Suite",
          "kind": "type",
          "line": 165,
          "exported": true,
          "signature": "export type Suite = z.infer<typeof SuiteSchema>"
        },
        {
          "name": "CaseSchema",
          "kind": "const",
          "line": 169,
          "exported": true,
          "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
        },
        {
          "name": "Case",
          "kind": "type",
          "line": 190,
          "exported": true,
          "signature": "export type Case = z.infer<typeof CaseSchema>"
        },
        {
          "name": "SectionSchema",
          "kind": "const",
          "line": 192,
          "exported": true,
          "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
        },
        {
          "name": "Section",
          "kind": "type",
          "line": 202,
          "exported": true,
          "signature": "export type Section = z.infer<typeof SectionSchema>"
        },
        {
          "name": "MoveSectionPayloadSchema",
          "kind": "const",
          "line": 214,
          "exported": true,
          "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
        },
        {
          "name": "MoveSectionPayload",
          "kind": "type",
          "line": 219,
          "exported": true,
          "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>"
        },
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 223,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 255,
          "exported": true,
          "signature": "export type Run = z.infer<typeof RunSchema>"
        },
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 259,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 271,
          "exported": true,
          "signature": "export type PlanEntry = z.infer<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 273,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 300,
          "exported": true,
          "signature": "export type Plan = z.infer<typeof PlanSchema>"
        },
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 304,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 321,
          "exported": true,
          "signature": "export type Test = z.infer<typeof TestSchema>"
        },
        {
          "name": "ResultSchema",
          "kind": "const",
          "line": 323,
          "exported": true,
          "signature": "export const ResultSchema = zObject({ id: z.number().nullish(), test_id: z.number().nullish(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().…"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 337,
          "exported": true,
          "signature": "export type Result = z.infer<typeof ResultSchema>"
        },
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 341,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 358,
          "exported": true,
          "signature": "export type Milestone = z.infer<typeof MilestoneSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 362,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 374,
          "exported": true,
          "signature": "export type Status = z.infer<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 376,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 384,
          "exported": true,
          "signature": "export type Priority = z.infer<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatusSchema",
          "kind": "const",
          "line": 391,
          "exported": true,
          "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 400,
          "exported": true,
          "signature": "export type CaseStatus = z.infer<typeof CaseStatusSchema>"
        },
        {
          "name": "HistoryChangeSchema",
          "kind": "const",
          "line": 406,
          "exported": false,
          "signature": "const HistoryChangeSchema = zObject({ field: z.string().nullish(), type_id: z.number().nullish(), old_text: z.string().nullish(), new_text: z.string().nullish(), })"
        },
        {
          "name": "HistoryEntrySchema",
          "kind": "const",
          "line": 418,
          "exported": true,
          "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 427,
          "exported": true,
          "signature": "export type HistoryEntry = z.infer<typeof HistoryEntrySchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 431,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string(), items: z.string().nullish(), format: z.string().nullish(), rows: z.string().nullish(), })"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 439,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 444,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 449,
          "exported": true,
          "signature": "export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 451,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 465,
          "exported": true,
          "signature": "export type CaseField = z.infer<typeof CaseFieldSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 467,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 472,
          "exported": true,
          "signature": "export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 474,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 488,
          "exported": true,
          "signature": "export type ResultField = z.infer<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 492,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 498,
          "exported": true,
          "signature": "export type CaseType = z.infer<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 500,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 506,
          "exported": true,
          "signature": "export type Template = z.infer<typeof TemplateSchema>"
        },
        {
          "name": "ConfigurationSchema",
          "kind": "const",
          "line": 510,
          "exported": true,
          "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 516,
          "exported": true,
          "signature": "export type Configuration = z.infer<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroupSchema",
          "kind": "const",
          "line": 518,
          "exported": true,
          "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 525,
          "exported": true,
          "signature": "export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "AttachmentSchema",
          "kind": "const",
          "line": 529,
          "exported": true,
          "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number(), name: z.string(), filename: z.string().nullish(), size: z.number().nullish(), created_on: z.number().nullish(), created_by: z.numbe…"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 539,
          "exported": true,
          "signature": "export type Attachment = z.infer<typeof AttachmentSchema>"
        },
        {
          "name": "SharedStepSchema",
          "kind": "const",
          "line": 543,
          "exported": true,
          "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…"
        },
        {
          "name": "SharedStep",
          "kind": "type",
          "line": 555,
          "exported": true,
          "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>"
        },
        {
          "name": "VariableSchema",
          "kind": "const",
          "line": 559,
          "exported": true,
          "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
        },
        {
          "name": "Variable",
          "kind": "type",
          "line": 564,
          "exported": true,
          "signature": "export type Variable = z.infer<typeof VariableSchema>"
        },
        {
          "name": "AddVariablePayloadSchema",
          "kind": "const",
          "line": 566,
          "exported": true,
          "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddVariablePayload",
          "kind": "type",
          "line": 570,
          "exported": true,
          "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>"
        },
        {
          "name": "UpdateVariablePayloadSchema",
          "kind": "const",
          "line": 580,
          "exported": true,
          "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateVariablePayload",
          "kind": "type",
          "line": 584,
          "exported": true,
          "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>"
        },
        {
          "name": "DatasetSchema",
          "kind": "const",
          "line": 586,
          "exported": true,
          "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number().nullish(), created_on: z.number().nullish(), created_by: z.number().nullish(), })"
        },
        {
          "name": "Dataset",
          "kind": "type",
          "line": 594,
          "exported": true,
          "signature": "export type Dataset = z.infer<typeof DatasetSchema>"
        },
        {
          "name": "AddDatasetPayloadSchema",
          "kind": "const",
          "line": 596,
          "exported": true,
          "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "type",
          "line": 600,
          "exported": true,
          "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>"
        },
        {
          "name": "UpdateDatasetPayloadSchema",
          "kind": "const",
          "line": 608,
          "exported": true,
          "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "type",
          "line": 612,
          "exported": true,
          "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>"
        },
        {
          "name": "ReportSchema",
          "kind": "const",
          "line": 616,
          "exported": true,
          "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), is_shared: z.boolean().nullish(), })"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 623,
          "exported": true,
          "signature": "export type Report = z.infer<typeof ReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 625,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), user_report_url: z.string().nullish(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 630,
          "exported": true,
          "signature": "export type ReportResult = z.infer<typeof ReportResultSchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 639,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 650,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 652,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 663,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "AddCasesBulkPayloadSchema",
          "kind": "const",
          "line": 675,
          "exported": true,
          "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
        },
        {
          "name": "AddCasesBulkPayload",
          "kind": "type",
          "line": 677,
          "exported": true,
          "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>"
        },
        {
          "name": "UpdateCasesPayloadSchema",
          "kind": "const",
          "line": 685,
          "exported": true,
          "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
        },
        {
          "name": "UpdateCasesPayload",
          "kind": "type",
          "line": 697,
          "exported": true,
          "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>"
        },
        {
          "name": "DeleteCasesPayloadSchema",
          "kind": "const",
          "line": 706,
          "exported": true,
          "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
        },
        {
          "name": "DeleteCasesPayload",
          "kind": "type",
          "line": 714,
          "exported": true,
          "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>"
        },
        {
          "name": "SoftDeletePreviewSchema",
          "kind": "const",
          "line": 722,
          "exported": true,
          "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
        },
        {
          "name": "SoftDeletePreview",
          "kind": "type",
          "line": 732,
          "exported": true,
          "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>"
        },
        {
          "name": "CopyCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 737,
          "exported": true,
          "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
        },
        {
          "name": "CopyCasesToSectionPayload",
          "kind": "type",
          "line": 741,
          "exported": true,
          "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>"
        },
        {
          "name": "MoveCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 749,
          "exported": true,
          "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
        },
        {
          "name": "MoveCasesToSectionPayload",
          "kind": "type",
          "line": 754,
          "exported": true,
          "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>"
        },
        {
          "name": "AddCaseFieldConfigPayloadSchema",
          "kind": "const",
          "line": 771,
          "exported": true,
          "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
        },
        {
          "name": "AddCaseFieldConfigPayload",
          "kind": "type",
          "line": 785,
          "exported": true,
          "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>"
        },
        {
          "name": "AddCaseFieldPayloadSchema",
          "kind": "const",
          "line": 787,
          "exported": true,
          "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
        },
        {
          "name": "AddCaseFieldPayload",
          "kind": "type",
          "line": 797,
          "exported": true,
          "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 799,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 810,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 812,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 822,
          "exported": true,
          "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 824,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 834,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 838,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 849,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 851,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 855,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "AddResultForTestPayloadSchema",
          "kind": "const",
          "line": 860,
          "exported": true,
          "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForTestPayload",
          "kind": "type",
          "line": 871,
          "exported": true,
          "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>"
        },
        {
          "name": "AddResultsPayloadSchema",
          "kind": "const",
          "line": 873,
          "exported": true,
          "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
        },
        {
          "name": "AddResultsPayload",
          "kind": "type",
          "line": 877,
          "exported": true,
          "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 886,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 896,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 903,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 912,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 917,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 924,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 926,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 937,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 939,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 950,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 952,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), entries: z.array(AddPlanEntryPayloadSchema).optional(), })"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 959,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 961,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), })"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 968,
          "exported": true,
          "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>"
        },
        {
          "name": "AddProjectPayloadSchema",
          "kind": "const",
          "line": 978,
          "exported": true,
          "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "AddProjectPayload",
          "kind": "type",
          "line": 985,
          "exported": true,
          "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>"
        },
        {
          "name": "UpdateProjectPayloadSchema",
          "kind": "const",
          "line": 987,
          "exported": true,
          "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "type",
          "line": 994,
          "exported": true,
          "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>"
        },
        {
          "name": "AddSuitePayloadSchema",
          "kind": "const",
          "line": 996,
          "exported": true,
          "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
        },
        {
          "name": "AddSuitePayload",
          "kind": "type",
          "line": 1001,
          "exported": true,
          "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>"
        },
        {
          "name": "UpdateSuitePayloadSchema",
          "kind": "const",
          "line": 1003,
          "exported": true,
          "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSuitePayload",
          "kind": "type",
          "line": 1008,
          "exported": true,
          "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>"
        },
        {
          "name": "AddSectionPayloadSchema",
          "kind": "const",
          "line": 1016,
          "exported": true,
          "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
        },
        {
          "name": "AddSectionPayload",
          "kind": "type",
          "line": 1023,
          "exported": true,
          "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>"
        },
        {
          "name": "UpdateSectionPayloadSchema",
          "kind": "const",
          "line": 1025,
          "exported": true,
          "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSectionPayload",
          "kind": "type",
          "line": 1030,
          "exported": true,
          "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>"
        },
        {
          "name": "AddMilestonePayloadSchema",
          "kind": "const",
          "line": 1032,
          "exported": true,
          "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "type",
          "line": 1041,
          "exported": true,
          "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>"
        },
        {
          "name": "UpdateMilestonePayloadSchema",
          "kind": "const",
          "line": 1043,
          "exported": true,
          "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "type",
          "line": 1054,
          "exported": true,
          "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>"
        },
        {
          "name": "AddSharedStepPayloadSchema",
          "kind": "const",
          "line": 1064,
          "exported": true,
          "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "AddSharedStepPayload",
          "kind": "type",
          "line": 1069,
          "exported": true,
          "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>"
        },
        {
          "name": "UpdateSharedStepPayloadSchema",
          "kind": "const",
          "line": 1080,
          "exported": true,
          "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "UpdateSharedStepPayload",
          "kind": "type",
          "line": 1085,
          "exported": true,
          "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>"
        },
        {
          "name": "AddConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 1095,
          "exported": true,
          "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationGroupPayload",
          "kind": "type",
          "line": 1099,
          "exported": true,
          "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 1101,
          "exported": true,
          "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationGroupPayload",
          "kind": "type",
          "line": 1105,
          "exported": true,
          "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>"
        },
        {
          "name": "AddConfigurationPayloadSchema",
          "kind": "const",
          "line": 1107,
          "exported": true,
          "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationPayload",
          "kind": "type",
          "line": 1111,
          "exported": true,
          "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationPayloadSchema",
          "kind": "const",
          "line": 1113,
          "exported": true,
          "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationPayload",
          "kind": "type",
          "line": 1117,
          "exported": true,
          "signature": "export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>"
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
          "name": "UploadFilePathInput",
          "kind": "interface",
          "line": 85,
          "exported": true,
          "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }"
        },
        {
          "name": "UploadFileInput",
          "kind": "type",
          "line": 99,
          "exported": true,
          "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput"
        },
        {
          "name": "Case",
          "kind": "interface",
          "line": 101,
          "exported": true,
          "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …"
        },
        {
          "name": "Suite",
          "kind": "interface",
          "line": 122,
          "exported": true,
          "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…"
        },
        {
          "name": "Section",
          "kind": "interface",
          "line": 137,
          "exported": true,
          "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }"
        },
        {
          "name": "Project",
          "kind": "interface",
          "line": 147,
          "exported": true,
          "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …"
        },
        {
          "name": "Plan",
          "kind": "interface",
          "line": 159,
          "exported": true,
          "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…"
        },
        {
          "name": "PlanEntry",
          "kind": "interface",
          "line": 186,
          "exported": true,
          "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…"
        },
        {
          "name": "Run",
          "kind": "interface",
          "line": 198,
          "exported": true,
          "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…"
        },
        {
          "name": "Test",
          "kind": "interface",
          "line": 230,
          "exported": true,
          "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number | null; run_id: number; title: string; template_id?: number | null; type_id?: number | null; priority_id?…"
        },
        {
          "name": "Result",
          "kind": "interface",
          "line": 247,
          "exported": true,
          "signature": "export interface Result { id?: number | null; test_id?: number | null; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto…"
        },
        {
          "name": "Milestone",
          "kind": "interface",
          "line": 262,
          "exported": true,
          "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …"
        },
        {
          "name": "User",
          "kind": "interface",
          "line": 278,
          "exported": true,
          "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; }"
        },
        {
          "name": "Status",
          "kind": "interface",
          "line": 287,
          "exported": true,
          "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }"
        },
        {
          "name": "Priority",
          "kind": "interface",
          "line": 299,
          "exported": true,
          "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }"
        },
        {
          "name": "CaseStatus",
          "kind": "interface",
          "line": 307,
          "exported": true,
          "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }"
        },
        {
          "name": "HistoryChange",
          "kind": "interface",
          "line": 316,
          "exported": true,
          "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; }"
        },
        {
          "name": "HistoryEntry",
          "kind": "interface",
          "line": 323,
          "exported": true,
          "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }"
        },
        {
          "name": "SoftDeleteOptions",
          "kind": "interface",
          "line": 349,
          "exported": true,
          "signature": "export interface SoftDeleteOptions { soft?: boolean; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 358,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 395,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "interface",
          "line": 416,
          "exported": true,
          "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…"
        },
        {
          "name": "ResultField",
          "kind": "interface",
          "line": 430,
          "exported": true,
          "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "interface",
          "line": 452,
          "exported": true,
          "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…"
        },
        {
          "name": "CaseField",
          "kind": "interface",
          "line": 467,
          "exported": true,
          "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…"
        },
        {
          "name": "CaseType",
          "kind": "interface",
          "line": 487,
          "exported": true,
          "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Template",
          "kind": "interface",
          "line": 496,
          "exported": true,
          "signature": "export interface Template { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Configuration",
          "kind": "interface",
          "line": 505,
          "exported": true,
          "signature": "export interface Configuration { id: number; name: string; group_id: number; }"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "interface",
          "line": 512,
          "exported": true,
          "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 524,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 529,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 541,
          "exported": true,
          "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 561,
          "exported": true,
          "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 574,
          "exported": true,
          "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; defects_filter?: string; limit?: number; offset?: number; }"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 598,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }"
        },
        {
          "name": "AddUserPayload",
          "kind": "interface",
          "line": 610,
          "exported": true,
          "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "UpdateUserPayload",
          "kind": "interface",
          "line": 624,
          "exported": true,
          "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "Role",
          "kind": "interface",
          "line": 640,
          "exported": true,
          "signature": "export interface Role { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Attachment",
          "kind": "interface",
          "line": 658,
          "exported": true,
          "signature": "export interface Attachment { attachment_id: number; name: string; filename?: string | null; size?: number | null; created_on?: number | null; created_by?: number | null; entity_id?: number | null; }"
        },
        {
          "name": "Report",
          "kind": "interface",
          "line": 694,
          "exported": true,
          "signature": "export interface Report { id: number; name: string; description?: string | null; is_shared?: boolean | null; }"
        },
        {
          "name": "ReportResult",
          "kind": "interface",
          "line": 706,
          "exported": true,
          "signature": "export interface ReportResult { report_url: string; user_report_url?: string | null; }"
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
