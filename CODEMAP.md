# CODEMAP

Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.

Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.

```json
{
  "schema": "codemap.v2",
  "repo": {
    "name": "@dichovsky/testrail-api-client",
    "version": "5.0.2"
  },
  "sourceHash": "7e80f92f7093d3092e721a677cb9e5c8358289f8e895a2887b0aae4816304ddf",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCaseFieldConfigPayload",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 247,
      "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldConfigPayloadSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 233,
      "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
    },
    {
      "name": "AddCaseFieldPayload",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 259,
      "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldPayloadSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 249,
      "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
    },
    {
      "name": "AddCaseFieldResponse",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 175,
      "signature": "export type AddCaseFieldResponse = z.infer<typeof AddCaseFieldResponseSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldResponseSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 150,
      "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
    },
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 106,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 95,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddCasesBulkPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 133,
      "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasesBulkPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 131,
      "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
    },
    {
      "name": "AddConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas/configurations.ts",
      "line": 35,
      "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 31,
      "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddConfigurationPayload",
      "kind": "type",
      "file": "src/schemas/configurations.ts",
      "line": 47,
      "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 43,
      "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddDatasetPayload",
      "kind": "type",
      "file": "src/schemas/datasets.ts",
      "line": 54,
      "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 50,
      "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddGroupPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 71,
      "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 66,
      "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })",
      "jsdoc": "Group write-payload schemas (TestRail 7.5+). Mirror the variable/shared-step/milestone payload-migration precedent: each schema is declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields TestRail may add to either endpoint."
    },
    {
      "name": "AddMilestonePayload",
      "kind": "type",
      "file": "src/schemas/milestones.ts",
      "line": 44,
      "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 35,
      "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 144,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 121,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 181,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 168,
      "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(),…"
    },
    {
      "name": "AddProjectPayload",
      "kind": "type",
      "file": "src/schemas/projects.ts",
      "line": 66,
      "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 59,
      "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "AddResultForCasePayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 76,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 65,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultForTestPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 99,
      "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForTestPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 88,
      "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 60,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 50,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **request** payload schemas."
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 82,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 78,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddResultsPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 105,
      "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 101,
      "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas/runs.ts",
      "line": 77,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 66,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 107,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 98,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
    },
    {
      "name": "AddSectionPayload",
      "kind": "type",
      "file": "src/schemas/sections.ts",
      "line": 50,
      "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/sections.ts",
      "line": 43,
      "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
    },
    {
      "name": "AddSharedStepPayload",
      "kind": "type",
      "file": "src/schemas/sharedSteps.ts",
      "line": 70,
      "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas/sharedSteps.ts",
      "line": 65,
      "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })",
      "jsdoc": "SPEC #2.1.15 — verified against the `add_shared_step` request-body field table (Support article 7077919815572): only `title` is `required=true`; `custom_steps_separated` is `required=false`. The doc's request example also shows step entries with a subset of fields (just `content`), which the `z.record(string, unknown())` per-step shape accepts."
    },
    {
      "name": "AddSuitePayload",
      "kind": "type",
      "file": "src/schemas/suites.ts",
      "line": 27,
      "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas/suites.ts",
      "line": 22,
      "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
    },
    {
      "name": "AddVariablePayload",
      "kind": "type",
      "file": "src/schemas/variables.ts",
      "line": 30,
      "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas/variables.ts",
      "line": 26,
      "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "Attachment",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 799,
      "signature": "export interface Attachment { attachment_id?: number | null; id?: number | string | null; name?: string | null; filename?: string | null; filetype?: string | null; size?: number | null; created_on?: n…",
      "jsdoc": "An attachment metadata record returned by attachment list and upload endpoints.",
      "typeOnly": true
    },
    {
      "name": "AttachmentSchema",
      "kind": "const",
      "file": "src/schemas/attachments.ts",
      "line": 52,
      "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number().nullish(), id: z.union([z.number(), z.string()]).nullish(), name: z.string().nullish(), filename: z.string().nullish(), filetype: z.…"
    },
    {
      "name": "Case",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 138,
      "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 597,
      "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…",
      "jsdoc": "Custom case field definition returned by get_case_fields",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 582,
      "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…",
      "jsdoc": "Context/options configuration block shared by CaseField entries",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 108,
      "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 115,
      "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
    },
    {
      "name": "CaseSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 7,
      "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
    },
    {
      "name": "CaseStatus",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 428,
      "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }",
      "typeOnly": true
    },
    {
      "name": "CaseStatusSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 72,
      "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
    },
    {
      "name": "CaseType",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 617,
      "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case type definition returned by get_case_types",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 202,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Configuration",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 635,
      "signature": "export interface Configuration { id: number; name: string; group_id: number; }",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 642,
      "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\")",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroupSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 14,
      "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
    },
    {
      "name": "ConfigurationSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 6,
      "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
    },
    {
      "name": "CopyCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 197,
      "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "CopyCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 193,
      "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
    },
    {
      "name": "Dataset",
      "kind": "type",
      "file": "src/schemas/datasets.ts",
      "line": 48,
      "signature": "export type Dataset = z.infer<typeof DatasetSchema>",
      "typeOnly": true
    },
    {
      "name": "DatasetSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 42,
      "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), variables: z.array(DatasetVariableSchema).nullish(), })",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Datasets\" API doc (support article 7077300491540) on 2026-05-23. Documented response fields are `id`, `name`, and `variables[]`; `id` and `name` are required scalars, `variables` is the array of `DatasetVariable` entries. `variables` is modelled as `.nullish()` for defensive back-compat — TestRail's `add_dataset` example also shows the same shape but older API revisions or edge cases (e.g. an empty dataset mid-creation) may omit the key. Any forward-compat keys the server might add (e.g. `project_id`, `created_on`, `created_by`) survive at runtime via `zObject()`'s passthrough; they are intentionally not declared here until the upstream doc lists them (SPEC #1.5)."
    },
    {
      "name": "DatasetVariable",
      "kind": "type",
      "file": "src/schemas/datasets.ts",
      "line": 22,
      "signature": "export type DatasetVariable = z.infer<typeof DatasetVariableSchema>",
      "typeOnly": true
    },
    {
      "name": "DatasetVariableSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 16,
      "signature": "export const DatasetVariableSchema = zObject({ id: z.number(), name: z.string(), value: z.string().nullable(), })",
      "jsdoc": "SPEC #2.1.16 — embedded variable/value entry inside a Dataset response. Per the official TestRail \"Datasets\" API doc (support article 7077300491540), `get_dataset` returns a `variables` array where each entry has `id` (integer), `name` (string), and `value`. `id` and `name` are documented as plain non-nullable scalars; `value` may be null when the variable is unset/cleared on the server side, so it is modelled as nullable per SPEC #2.1.16 review. `zObject()`'s passthrough preserves any forward-compat keys."
    },
    {
      "name": "DeleteCasesPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 170,
      "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 162,
      "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
    },
    {
      "name": "GetAttachmentsOptions",
      "kind": "interface",
      "file": "src/modules/attachments.ts",
      "line": 16,
      "signature": "export interface GetAttachmentsOptions { limit?: number; offset?: number; }",
      "jsdoc": "Optional pagination params shared by `getAttachmentsForCase`, `getAttachmentsForRun`, and `getAttachmentsForTest`. TestRail's `get_attachments_for_*` endpoints accept `limit`/`offset` query params (default page size 250). Plan-scoped endpoints (`get_attachments_for_plan`, `get_attachments_for_plan_entry`) intentionally don't accept these — they return every attachment under the plan tree.",
      "typeOnly": true
    },
    {
      "name": "GetCasesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 488,
      "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…",
      "jsdoc": "Filter options for `getCases()`. All date filters accept Unix timestamps (seconds since epoch).",
      "typeOnly": true
    },
    {
      "name": "GetHistoryForCaseOptions",
      "kind": "interface",
      "file": "src/modules/cases.ts",
      "line": 19,
      "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetMilestonesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 750,
      "signature": "export interface GetMilestonesOptions { isCompleted?: boolean; limit?: number; offset?: number; is_completed?: 0 | 1; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 671,
      "signature": "export interface GetPlansOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number[]; limit?: number; offset?: number; created_after?: …",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 716,
      "signature": "export interface GetResultsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; statusId?: number[]; defectsFilter?: string; limit?: number; offset?: number; created_after?: …",
      "jsdoc": "Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 525,
      "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…",
      "typeOnly": true
    },
    {
      "name": "GetSharedStepHistoryOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 8,
      "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetTestsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 701,
      "signature": "export interface GetTestsOptions { statusId?: number[]; limit?: number; offset?: number; status_id?: number[]; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 51,
      "signature": "export type Group = z.infer<typeof GroupSchema>",
      "typeOnly": true
    },
    {
      "name": "GroupSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 45,
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
      "line": 437,
      "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; label?: string | null; options?: unknown[] | null; old_value?: stri…",
      "typeOnly": true
    },
    {
      "name": "HistoryEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 453,
      "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 77,
      "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
    },
    {
      "name": "Label",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 35,
      "signature": "export type Label = z.infer<typeof LabelSchema>",
      "typeOnly": true
    },
    {
      "name": "LabelEmbedded",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 39,
      "signature": "export type LabelEmbedded = z.infer<typeof LabelEmbeddedSchema>",
      "typeOnly": true
    },
    {
      "name": "LabelEmbeddedSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 31,
      "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })",
      "jsdoc": "Shape of a Label object as embedded inside a parent resource response — notably `get_case` (SPEC #2.1.3) and `get_test` (SPEC #2.1.7). The two endpoints emit the same logical shape but the wider TestRail Labels API has historically diverged on naming (`title` on embedded forms vs `name` on the stand-alone `get_label`), so the inner schema accepts both."
    },
    {
      "name": "LabelSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 27,
      "signature": "export const LabelSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })",
      "jsdoc": "`LabelSchema` — the canonical stand-alone label entity returned by the Labels API (`get_label`, `get_labels`, `update_label`). Distinct from `LabelEmbeddedSchema` (the label shape nested inside `get_case` / `get_test` responses): the two are structurally near-identical today but are kept separate on purpose, because the stand-alone endpoint may diverge independently of the embedded form (schema-conventions §1 — `XSchema` is the canonical GET entity; §4 — keep sub-schemas separate)."
    },
    {
      "name": "Milestone",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 362,
      "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 6,
      "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
    },
    {
      "name": "MoveCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 210,
      "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 205,
      "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
    },
    {
      "name": "MoveSectionPayload",
      "kind": "type",
      "file": "src/schemas/sections.ts",
      "line": 33,
      "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/sections.ts",
      "line": 28,
      "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
    },
    {
      "name": "PaginationSchema",
      "kind": "const",
      "file": "src/schemas/common.ts",
      "line": 12,
      "signature": "export const PaginationSchema = zObject({ limit: z.number().optional(), offset: z.number().optional(), })",
      "jsdoc": "Core schemas for common TestRail API structures. These are used to validate API responses and provide static type inference via `z.infer`."
    },
    {
      "name": "Plan",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 226,
      "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 261,
      "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 91,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 81,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 7,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 29,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
    },
    {
      "name": "Priority",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 420,
      "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 57,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 189,
      "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …",
      "typeOnly": true
    },
    {
      "name": "ProjectSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 6,
      "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
    },
    {
      "name": "RateLimiterConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 659,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 879,
      "signature": "export interface Report { id: number; name: string; description?: string | null; notify_user?: boolean | null; notify_link?: boolean | null; notify_link_recipients?: string | null; notify_attachment?:…",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 910,
      "signature": "export interface ReportResult { report_url: string; report_html?: string | null; report_pdf?: string | null; user_report_url?: string | null; }",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas/reports.ts",
      "line": 46,
      "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), report_html: z.string().nullish(), report_pdf: z.string().nullish(), user_report_url: z.string().nullish(), })",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Reports and Cross-Project Reports\" API doc (support article 7077825062036) on 2026-05-23. `run_report` returns three URLs per the current doc example: `report_url` (the report view), `report_html`, and `report_pdf`. `report_url` is required; `report_html` and `report_pdf` are modelled as `.nullish()` since the endpoint requires TestRail 5.7+ and older servers may emit fewer keys. `user_report_url` is NOT in the current doc but remains `.nullish()` as a forward/legacy-compat placeholder for TestRail revisions that emitted it."
    },
    {
      "name": "ReportSchema",
      "kind": "const",
      "file": "src/schemas/reports.ts",
      "line": 20,
      "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), notify_user: z.boolean().nullish(), notify_link: z.boolean().nullish(), notify_link_recipient…",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Reports and Cross-Project Reports\" API doc (support article 7077825062036) on 2026-05-23. Per the \"system fields always included in the response\" table, `get_reports` returns `id`, `name`, `description`, and six `notify_*` fields. `id` and `name` are required scalars; `description` is documented as a string but the doc example shows `\"description\": null`, so `.nullish()` matches the wire. The six `notify_*` fields are always-included per the doc, but modelled as `.nullish()` for defensive back-compat: older TestRail versions may omit them and `notify_link_recipients` is documented as a string that the doc example also shows as `null`. `is_shared` is NOT in the current doc field table; it remains `.nullish()` as a forward-compat placeholder."
    },
    {
      "name": "Result",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 347,
      "signature": "export interface Result { id: number; test_id: number; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto_id?: number | n…",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 560,
      "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 546,
      "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 177,
      "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 184,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 13,
      "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish(), defects: …",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **response** schemas."
    },
    {
      "name": "Role",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 764,
      "signature": "export interface Role { id: number; name: string; is_default: boolean; }",
      "jsdoc": "A user role returned by GET /get_roles (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "RoleSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 37,
      "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Run",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 280,
      "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 6,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
    },
    {
      "name": "Section",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 179,
      "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }",
      "typeOnly": true
    },
    {
      "name": "SectionSchema",
      "kind": "const",
      "file": "src/schemas/sections.ts",
      "line": 6,
      "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
    },
    {
      "name": "SharedStep",
      "kind": "type",
      "file": "src/schemas/sharedSteps.ts",
      "line": 48,
      "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>",
      "typeOnly": true
    },
    {
      "name": "SharedStepSchema",
      "kind": "const",
      "file": "src/schemas/sharedSteps.ts",
      "line": 36,
      "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…",
      "jsdoc": "SPEC #2.1.15 — verified against the official Shared Steps API doc (TestRail Support article 7077919815572). Endpoint requires TestRail 7.0+."
    },
    {
      "name": "SoftDeleteOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 479,
      "signature": "export interface SoftDeleteOptions { soft?: boolean; }",
      "jsdoc": "Options for delete endpoints that support TestRail's `soft=1` server-side preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`, `delete_suite`). `delete_milestone` and `delete_project` do not accept `soft`; passing this option to those endpoints would be a no-op server-side, so the CLI rejects it instead to keep destructive intent unambiguous.",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreview",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 188,
      "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreviewSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 178,
      "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
    },
    {
      "name": "Status",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 408,
      "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 43,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "StepHistoryEntry",
      "kind": "type",
      "file": "src/schemas/sharedSteps.ts",
      "line": 104,
      "signature": "export type StepHistoryEntry = z.infer<typeof StepHistoryEntrySchema>",
      "typeOnly": true
    },
    {
      "name": "StepHistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas/sharedSteps.ts",
      "line": 96,
      "signature": "export const StepHistoryEntrySchema = zObject({ id: z.string(), title: z.string().nullish(), timestamp: z.number().nullish(), user_id: z.string().nullish(), custom_steps_separated: z.array(z.record(z.…",
      "jsdoc": "SPEC #1.7 — `get_shared_step_history/{shared_step_id}` returns entries under `step_history` (NOT `history`). Per the official Shared Steps API doc, an entry carries string `id`/`user_id`, a `timestamp`, a `title`, and `custom_steps_separated[]` — distinct from the case-history `HistoryEntry` shape. `id` is the required identifier; every other field is `.nullish()`- widened so a real server response never throws (the bug class this fixes)."
    },
    {
      "name": "Suite",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 164,
      "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…",
      "typeOnly": true
    },
    {
      "name": "SuiteSchema",
      "kind": "const",
      "file": "src/schemas/suites.ts",
      "line": 6,
      "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
    },
    {
      "name": "Template",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 626,
      "signature": "export interface Template { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+)",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 210,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Test",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 325,
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
      "line": 35,
      "signature": "export class TestRailClient extends TestRailClientCore",
      "jsdoc": "TestRail API Client"
    },
    {
      "name": "TestRailConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 6,
      "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…",
      "jsdoc": "TestRail API client configuration options",
      "typeOnly": true
    },
    {
      "name": "TestRailConfigSchema",
      "kind": "const",
      "file": "src/schemas/common.ts",
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
      "file": "src/schemas/tests.ts",
      "line": 7,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 119,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 108,
      "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
    },
    {
      "name": "UpdateCasesPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 153,
      "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 141,
      "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
    },
    {
      "name": "UpdateConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas/configurations.ts",
      "line": 41,
      "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 37,
      "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateConfigurationPayload",
      "kind": "type",
      "file": "src/schemas/configurations.ts",
      "line": 53,
      "signature": "export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas/configurations.ts",
      "line": 49,
      "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateDatasetPayload",
      "kind": "type",
      "file": "src/schemas/datasets.ts",
      "line": 66,
      "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 62,
      "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_dataset` accepts a partial body (rename-only at the moment). Mirrors the `UpdateVariablePayloadSchema` precedent — empty `{}` body is intentionally allowed and forwarded to TestRail, which treats it as a no-op. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 78,
      "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 73,
      "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
    },
    {
      "name": "UpdateLabelPayload",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 48,
      "signature": "export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateLabelPayloadSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 44,
      "signature": "export const UpdateLabelPayloadSchema = zObject({ title: z.string(), })",
      "jsdoc": "`update_label` body — the new label title. TestRail caps the title at 20 characters; the limit is intentionally NOT enforced client-side (the \"let TestRail be the source of truth\" precedent — we surface the server's 400 rather than duplicating the rule). `custom_*` / forward-compat extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "type",
      "file": "src/schemas/milestones.ts",
      "line": 57,
      "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 46,
      "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 166,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 146,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 196,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 183,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), start_on: z…"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "type",
      "file": "src/schemas/projects.ts",
      "line": 75,
      "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 68,
      "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 119,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 112,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas/runs.ts",
      "line": 89,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 79,
      "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
    },
    {
      "name": "UpdateSectionPayload",
      "kind": "type",
      "file": "src/schemas/sections.ts",
      "line": 57,
      "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/sections.ts",
      "line": 52,
      "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateSharedStepPayload",
      "kind": "type",
      "file": "src/schemas/sharedSteps.ts",
      "line": 86,
      "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas/sharedSteps.ts",
      "line": 81,
      "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })",
      "jsdoc": "Update payload for `update_shared_step`. Every field is optional — TestRail accepts an empty object (`{}`) as a no-op update, so the CLI's `shared-step update <id> --data '{}'` is intentionally a valid call. This mirrors `UpdateMilestonePayloadSchema` and `UpdateCasePayloadSchema`: empty bodies are accepted at the schema layer; rejecting them is the API's responsibility, not the client's. Callers that want to enforce \"non-empty update\" must do so above this schema."
    },
    {
      "name": "UpdateSuitePayload",
      "kind": "type",
      "file": "src/schemas/suites.ts",
      "line": 34,
      "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas/suites.ts",
      "line": 29,
      "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateTestLabelsPayload",
      "kind": "type",
      "file": "src/schemas/tests.ts",
      "line": 54,
      "signature": "export type UpdateTestLabelsPayload = z.infer<typeof UpdateTestLabelsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateTestLabelsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 50,
      "signature": "export const UpdateTestLabelsPayloadSchema = zObject({ labels: z.array(z.union([z.number(), z.string()])), })"
    },
    {
      "name": "UpdateTestsLabelsPayload",
      "kind": "type",
      "file": "src/schemas/tests.ts",
      "line": 66,
      "signature": "export type UpdateTestsLabelsPayload = z.infer<typeof UpdateTestsLabelsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateTestsLabelsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 61,
      "signature": "export const UpdateTestsLabelsPayloadSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(z.union([z.number(), z.string()])), })"
    },
    {
      "name": "UpdateVariablePayload",
      "kind": "type",
      "file": "src/schemas/variables.ts",
      "line": 44,
      "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas/variables.ts",
      "line": 40,
      "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_variable` accepts an empty body as a no-op: every field is optional. We intentionally do NOT enforce \"at least one field set\" client-side — TestRail itself accepts `{}` and returns the unchanged variable. Mirrors the `UpdateSectionPayloadSchema` precedent below, where empty-body updates are also passed through. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UploadFileInput",
      "kind": "type",
      "file": "src/types.ts",
      "line": 136,
      "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput",
      "typeOnly": true
    },
    {
      "name": "UploadFilePathInput",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 118,
      "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 384,
      "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; email_notifications?: boolean | null; is_admin?: boolean | null; gro…",
      "typeOnly": true
    },
    {
      "name": "UserAddPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 109,
      "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserAddPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 97,
      "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…",
      "jsdoc": "User write-payload schemas (TestRail 7.3+). Mirror the group/milestone payload pattern: declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future fields TestRail may add to either endpoint."
    },
    {
      "name": "UserSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 6,
      "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), email_notifications: z.boole…"
    },
    {
      "name": "UserUpdatePayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 123,
      "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserUpdatePayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 111,
      "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
    },
    {
      "name": "Variable",
      "kind": "type",
      "file": "src/schemas/variables.ts",
      "line": 24,
      "signature": "export type Variable = z.infer<typeof VariableSchema>",
      "typeOnly": true
    },
    {
      "name": "VariableSchema",
      "kind": "const",
      "file": "src/schemas/variables.ts",
      "line": 19,
      "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Variables\" API doc (support article 7077979742868) on 2026-05-23. The documented Variable response object has exactly two fields, both required and non-nullable: `id: integer` and `name: string`. No back-compat `.nullish()` is added on either field — TestRail has emitted this shape since the endpoint was introduced and the doc shows no version gating. `zObject()`'s passthrough still preserves any forward-compat keys TestRail may add. The doc-level `get_variables` pagination envelope (`offset` / `limit` / `size` / `_links` / `variables[]`) is handled outside the schema by the `getVariables()` module method, which unwraps the envelope before parsing."
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
          "line": 159,
          "exported": true,
          "signature": "export async function readBodyAsText(response: Response, limits: BodyLimits): Promise<string>"
        },
        {
          "name": "readBodyViaFallback",
          "kind": "function",
          "line": 172,
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
        "../constants.js",
        "./handler-context.js",
        "./stdin.js",
        "node:fs",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BodySource",
          "kind": "type",
          "line": 17,
          "exported": true,
          "signature": "export type BodySource = 'data' | 'file' | 'stdin' | 'default'"
        },
        {
          "name": "BodyResolution",
          "kind": "type",
          "line": 19,
          "exported": true,
          "signature": "export type BodyResolution<T> = { ok: true; payload: T; source: BodySource } | { ok: false; error: string }"
        },
        {
          "name": "resolveBody",
          "kind": "function",
          "line": 47,
          "exported": true,
          "signature": "export function resolveBody<S extends z.ZodTypeAny>(input: BodyInput, schema: S): BodyResolution<z.infer<S>>"
        }
      ]
    },
    {
      "path": "src/cli/dispatch.ts",
      "imports": [
        "./handler-context.js",
        "./metadata.js",
        "./metadata/types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HANDLERS",
          "kind": "const",
          "line": 17,
          "exported": false,
          "signature": "const HANDLERS: Record<string, Handler> = Object.fromEntries( ACTIONS.map((a) => [`${a.resource}:${a.action}`, a.handler]),\n)"
        },
        {
          "name": "RESOURCES",
          "kind": "const",
          "line": 21,
          "exported": false,
          "signature": "const RESOURCES: Record<string, readonly string[]> = (() => { const grouped: Record<string, string[]> = {}; for (const { resource, action } of ACTIONS) { (grouped[resource] ??= []).push(action); } ret…"
        },
        {
          "name": "DispatchResult",
          "kind": "type",
          "line": 29,
          "exported": true,
          "signature": "export type DispatchResult = { ok: true; handler: Handler } | { ok: false; error: string }"
        },
        {
          "name": "getRegisteredActions",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export function getRegisteredActions(): readonly string[]"
        },
        {
          "name": "DESTRUCTIVE_ENV_VAR",
          "kind": "const",
          "line": 52,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_VAR = 'TESTRAIL_ALLOW_DESTRUCTIVE'"
        },
        {
          "name": "DESTRUCTIVE_ENV_ALLOW_VALUE",
          "kind": "const",
          "line": 58,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_ALLOW_VALUE = '1'"
        },
        {
          "name": "EnvGateResult",
          "kind": "type",
          "line": 60,
          "exported": true,
          "signature": "export type EnvGateResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkDestructiveEnvGate",
          "kind": "function",
          "line": 84,
          "exported": true,
          "signature": "export function checkDestructiveEnvGate( spec: ActionSpec | undefined, env: Readonly<Record<string, string | undefined>>, dryRun: boolean, ): EnvGateResult"
        },
        {
          "name": "PathParamCountResult",
          "kind": "type",
          "line": 109,
          "exported": true,
          "signature": "export type PathParamCountResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkPathParamCount",
          "kind": "function",
          "line": 120,
          "exported": true,
          "signature": "export function checkPathParamCount(spec: ActionSpec | undefined, pathParams: readonly string[]): PathParamCountResult"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 149,
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
          "signature": "async function setupUpload( ctx: HandlerContext, action: string, idFields: Record<string, number | string>, ): Promise<ResolvedUpload | null>"
        },
        {
          "name": "uploadPayload",
          "kind": "function",
          "line": 89,
          "exported": false,
          "signature": "function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array"
        },
        {
          "name": "handleAttachmentAddToCase",
          "kind": "function",
          "line": 96,
          "exported": true,
          "signature": "export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToResult",
          "kind": "function",
          "line": 103,
          "exported": true,
          "signature": "export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToRun",
          "kind": "function",
          "line": 110,
          "exported": true,
          "signature": "export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlan",
          "kind": "function",
          "line": 117,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlanEntry",
          "kind": "function",
          "line": 124,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentDelete",
          "kind": "function",
          "line": 143,
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
          "line": 64,
          "exported": true,
          "signature": "export async function handleBddAdd(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case-field-write.ts",
      "imports": [
        "../../schemas.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseFieldAdd",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const handleCaseFieldAdd = createWriteHandler({ action: 'case-field add', bodySchema: AddCaseFieldPayloadSchema, call: (client, _nums, body) => client.metadata.addCaseField(body), })"
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
        "../ids.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseAdd",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const handleCaseAdd = createWriteHandler({ action: 'case add', pathParams: ['section_id'], bodySchema: AddCasePayloadSchema, call: (client, [sectionId], body) => client.cases.addCase(sectionId,…"
        },
        {
          "name": "handleCaseAddBulk",
          "kind": "const",
          "line": 28,
          "exported": true,
          "signature": "export const handleCaseAddBulk = createWriteHandler({ action: 'case add-bulk', pathParams: ['section_id'], bodySchema: AddCasesBulkPayloadSchema, previewExtras: (body) => ({ count: body.length }), cal…"
        },
        {
          "name": "handleCaseUpdate",
          "kind": "const",
          "line": 36,
          "exported": true,
          "signature": "export const handleCaseUpdate = createWriteHandler({ action: 'case update', pathParams: ['case_id'], bodySchema: UpdateCasePayloadSchema, call: (client, [caseId], body) => client.cases.updateCase(case…"
        },
        {
          "name": "handleCaseUpdateBulk",
          "kind": "const",
          "line": 43,
          "exported": true,
          "signature": "export const handleCaseUpdateBulk = createWriteHandler({ action: 'case update-bulk', pathParams: ['suite_id'], bodySchema: UpdateCasesPayloadSchema, call: (client, [suiteId], body) => client.cases.upd…"
        },
        {
          "name": "handleCaseCopyToSection",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const handleCaseCopyToSection = createWriteHandler({ action: 'case copy-to-section', pathParams: ['section_id'], bodySchema: CopyCasesToSectionPayloadSchema, call: (client, [sectionId], body) =…"
        },
        {
          "name": "handleCaseMoveToSection",
          "kind": "const",
          "line": 57,
          "exported": true,
          "signature": "export const handleCaseMoveToSection = createWriteHandler({ action: 'case move-to-section', pathParams: ['section_id'], bodySchema: MoveCasesToSectionPayloadSchema, call: (client, [sectionId], body) =…"
        },
        {
          "name": "handleCaseDelete",
          "kind": "const",
          "line": 69,
          "exported": true,
          "signature": "export const handleCaseDelete = createDestructiveHandler({ action: 'case delete', pathParams: ['case_id'], softMode: 'optional', call: (client, [caseId], _entry, soft) => client.cases.deleteCase(caseI…"
        },
        {
          "name": "handleCaseDeleteBulk",
          "kind": "function",
          "line": 82,
          "exported": true,
          "signature": "export async function handleCaseDeleteBulk(ctx: HandlerContext): Promise<void>"
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
          "line": 23,
          "exported": true,
          "signature": "export async function handleCaseHistory(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/configuration-write.ts",
      "imports": [
        "../../schemas.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleConfigurationGroupAdd",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const handleConfigurationGroupAdd = createWriteHandler({ action: 'configuration-group add', pathParams: ['project_id'], bodySchema: AddConfigurationGroupPayloadSchema, call: (client, [projectId…"
        },
        {
          "name": "handleConfigurationGroupUpdate",
          "kind": "const",
          "line": 21,
          "exported": true,
          "signature": "export const handleConfigurationGroupUpdate = createWriteHandler({ action: 'configuration-group update', pathParams: ['config_group_id'], bodySchema: UpdateConfigurationGroupPayloadSchema, call: (clie…"
        },
        {
          "name": "handleConfigurationGroupDelete",
          "kind": "const",
          "line": 34,
          "exported": true,
          "signature": "export const handleConfigurationGroupDelete = createDestructiveHandler({ action: 'configuration-group delete', pathParams: ['config_group_id'], call: (client, [configGroupId]) => client.configurations…"
        },
        {
          "name": "handleConfigurationAdd",
          "kind": "const",
          "line": 42,
          "exported": true,
          "signature": "export const handleConfigurationAdd = createWriteHandler({ action: 'configuration add', pathParams: ['config_group_id'], bodySchema: AddConfigurationPayloadSchema, call: (client, [configGroupId], body…"
        },
        {
          "name": "handleConfigurationUpdate",
          "kind": "const",
          "line": 49,
          "exported": true,
          "signature": "export const handleConfigurationUpdate = createWriteHandler({ action: 'configuration update', pathParams: ['config_id'], bodySchema: UpdateConfigurationPayloadSchema, call: (client, [configId], body) …"
        },
        {
          "name": "handleConfigurationDelete",
          "kind": "const",
          "line": 61,
          "exported": true,
          "signature": "export const handleConfigurationDelete = createDestructiveHandler({ action: 'configuration delete', pathParams: ['config_id'], call: (client, [configId]) => client.configurations.deleteConfiguration(c…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDatasetAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleDatasetAdd = createWriteHandler({ action: 'dataset add', pathParams: ['project_id'], bodySchema: AddDatasetPayloadSchema, call: (client, [projectId], body) => client.datasets.addDat…"
        },
        {
          "name": "handleDatasetUpdate",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const handleDatasetUpdate = createWriteHandler({ action: 'dataset update', pathParams: ['dataset_id'], bodySchema: UpdateDatasetPayloadSchema, allowEmptyBody: true, call: (client, [datasetId], …"
        },
        {
          "name": "handleDatasetDelete",
          "kind": "const",
          "line": 29,
          "exported": true,
          "signature": "export const handleDatasetDelete = createDestructiveHandler({ action: 'dataset delete', pathParams: ['dataset_id'], call: (client, [datasetId]) => client.datasets.deleteDataset(datasetId), })"
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
        "../ids.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleGroupAdd",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function handleGroupAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupUpdate",
          "kind": "const",
          "line": 38,
          "exported": true,
          "signature": "export const handleGroupUpdate = createWriteHandler({ action: 'group update', pathParams: ['group_id'], bodySchema: UpdateGroupPayloadSchema, call: (client, [groupId], body) => client.users.updateGrou…"
        },
        {
          "name": "handleGroupDelete",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const handleGroupDelete = createDestructiveHandler({ action: 'group delete', pathParams: ['group_id'], call: (client, [groupId]) => client.users.deleteGroup(groupId), })"
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
      "path": "src/cli/handlers/label-write.ts",
      "imports": [
        "../../schemas.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleLabelUpdate",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const handleLabelUpdate = createWriteHandler({ action: 'label update', pathParams: ['label_id'], bodySchema: UpdateLabelPayloadSchema, call: (client, [labelId], body) => client.labels.updateLab…"
        }
      ]
    },
    {
      "path": "src/cli/handlers/label.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleLabelGet",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export async function handleLabelGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleLabelList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleLabelList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/milestone-write.ts",
      "imports": [
        "../../schemas.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleMilestoneAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleMilestoneAdd = createWriteHandler({ action: 'milestone add', pathParams: ['project_id'], bodySchema: AddMilestonePayloadSchema, call: (client, [projectId], body) => client.milestone…"
        },
        {
          "name": "handleMilestoneUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleMilestoneUpdate = createWriteHandler({ action: 'milestone update', pathParams: ['milestone_id'], bodySchema: UpdateMilestonePayloadSchema, call: (client, [milestoneId], body) => cli…"
        },
        {
          "name": "handleMilestoneDelete",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const handleMilestoneDelete = createDestructiveHandler({ action: 'milestone delete', pathParams: ['milestone_id'], call: (client, [milestoneId]) => client.milestones.deleteMilestone(milestoneId…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePlanAdd",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handlePlanAdd = createWriteHandler({ action: 'plan add', pathParams: ['project_id'], bodySchema: AddPlanPayloadSchema, call: (client, [projectId], body) => client.plans.addPlan(projectId,…"
        },
        {
          "name": "handlePlanUpdate",
          "kind": "const",
          "line": 18,
          "exported": true,
          "signature": "export const handlePlanUpdate = createWriteHandler({ action: 'plan update', pathParams: ['plan_id'], bodySchema: UpdatePlanPayloadSchema, call: (client, [planId], body) => client.plans.updatePlan(plan…"
        },
        {
          "name": "handlePlanAddEntry",
          "kind": "const",
          "line": 25,
          "exported": true,
          "signature": "export const handlePlanAddEntry = createWriteHandler({ action: 'plan add-entry', pathParams: ['plan_id'], bodySchema: AddPlanEntryPayloadSchema, call: (client, [planId], body) => client.plans.addPlanE…"
        },
        {
          "name": "handlePlanAddRunToEntry",
          "kind": "const",
          "line": 32,
          "exported": true,
          "signature": "export const handlePlanAddRunToEntry = createWriteHandler({ action: 'plan add-run-to-entry', pathParams: ['plan_id'], entryParam: 'entry_id', bodySchema: AddRunToPlanEntryPayloadSchema, call: (client,…"
        },
        {
          "name": "handlePlanUpdateEntry",
          "kind": "const",
          "line": 40,
          "exported": true,
          "signature": "export const handlePlanUpdateEntry = createWriteHandler({ action: 'plan update-entry', pathParams: ['plan_id'], entryParam: 'entry_id', bodySchema: UpdatePlanEntryPayloadSchema, call: (client, [planId…"
        },
        {
          "name": "handlePlanUpdateRunInEntry",
          "kind": "const",
          "line": 48,
          "exported": true,
          "signature": "export const handlePlanUpdateRunInEntry = createWriteHandler({ action: 'plan update-run-in-entry', pathParams: ['run_id'], bodySchema: UpdateRunInPlanEntryPayloadSchema, call: (client, [runId], body) …"
        },
        {
          "name": "handlePlanClose",
          "kind": "const",
          "line": 59,
          "exported": true,
          "signature": "export const handlePlanClose = createDestructiveHandler({ action: 'plan close', pathParams: ['plan_id'], kind: 'close', call: (client, [planId]) => client.plans.closePlan(planId), })"
        },
        {
          "name": "handlePlanDelete",
          "kind": "const",
          "line": 70,
          "exported": true,
          "signature": "export const handlePlanDelete = createDestructiveHandler({ action: 'plan delete', pathParams: ['plan_id'], call: (client, [planId]) => client.plans.deletePlan(planId), })"
        },
        {
          "name": "handlePlanDeleteEntry",
          "kind": "const",
          "line": 80,
          "exported": true,
          "signature": "export const handlePlanDeleteEntry = createDestructiveHandler({ action: 'plan delete-entry', pathParams: ['plan_id'], entryParam: 'entry_id', call: (client, [planId], entryId) => client.plans.deletePl…"
        },
        {
          "name": "handlePlanDeleteRunFromEntry",
          "kind": "const",
          "line": 91,
          "exported": true,
          "signature": "export const handlePlanDeleteRunFromEntry = createDestructiveHandler({ action: 'plan delete-run-from-entry', pathParams: ['run_id'], call: (client, [runId]) => client.plans.deleteRunFromPlanEntry(runI…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleProjectAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleProjectAdd = createWriteHandler({ action: 'project add', bodySchema: AddProjectPayloadSchema, call: (client, _nums, body) => client.projects.addProject(body), })"
        },
        {
          "name": "handleProjectUpdate",
          "kind": "const",
          "line": 10,
          "exported": true,
          "signature": "export const handleProjectUpdate = createWriteHandler({ action: 'project update', pathParams: ['project_id'], bodySchema: UpdateProjectPayloadSchema, call: (client, [projectId], body) => client.projec…"
        },
        {
          "name": "handleProjectDelete",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const handleProjectDelete = createDestructiveHandler({ action: 'project delete', pathParams: ['project_id'], call: (client, [projectId]) => client.projects.deleteProject(projectId), })"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultAddByTest",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleResultAddByTest = createWriteHandler({ action: 'result add-by-test', pathParams: ['test_id'], bodySchema: AddResultPayloadSchema, call: (client, [testId], body) => client.results.ad…"
        },
        {
          "name": "handleResultAdd",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleResultAdd = createWriteHandler({ action: 'result add', pathParams: ['run_id', 'case_id'], bodySchema: AddResultPayloadSchema, call: (client, [runId, caseId], body) => client.results…"
        },
        {
          "name": "handleResultAddBulk",
          "kind": "const",
          "line": 18,
          "exported": true,
          "signature": "export const handleResultAddBulk = createWriteHandler({ action: 'result add-bulk', pathParams: ['run_id'], bodySchema: AddResultsForCasesPayloadSchema, call: (client, [runId], body) => client.results.…"
        },
        {
          "name": "handleResultAddBulkByTest",
          "kind": "const",
          "line": 25,
          "exported": true,
          "signature": "export const handleResultAddBulkByTest = createWriteHandler({ action: 'result add-bulk-by-test', pathParams: ['run_id'], bodySchema: AddResultsPayloadSchema, call: (client, [runId], body) => client.re…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRunAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleRunAdd = createWriteHandler({ action: 'run add', pathParams: ['project_id'], bodySchema: AddRunPayloadSchema, call: (client, [projectId], body) => client.runs.addRun(projectId, body…"
        },
        {
          "name": "handleRunUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleRunUpdate = createWriteHandler({ action: 'run update', pathParams: ['run_id'], bodySchema: UpdateRunPayloadSchema, call: (client, [runId], body) => client.runs.updateRun(runId, body…"
        },
        {
          "name": "handleRunClose",
          "kind": "const",
          "line": 23,
          "exported": true,
          "signature": "export const handleRunClose = createDestructiveHandler({ action: 'run close', pathParams: ['run_id'], softMode: 'ignore', kind: 'close', call: (client, [runId]) => client.runs.closeRun(runId), })"
        },
        {
          "name": "handleRunDelete",
          "kind": "const",
          "line": 35,
          "exported": true,
          "signature": "export const handleRunDelete = createDestructiveHandler({ action: 'run delete', pathParams: ['run_id'], softMode: 'optional', call: (client, [runId], _entry, soft) => client.runs.deleteRun(runId, { so…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSectionAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleSectionAdd = createWriteHandler({ action: 'section add', pathParams: ['project_id'], bodySchema: AddSectionPayloadSchema, call: (client, [projectId], body) => client.sections.addSec…"
        },
        {
          "name": "handleSectionUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleSectionUpdate = createWriteHandler({ action: 'section update', pathParams: ['section_id'], bodySchema: UpdateSectionPayloadSchema, call: (client, [sectionId], body) => client.sectio…"
        },
        {
          "name": "handleSectionMove",
          "kind": "const",
          "line": 24,
          "exported": true,
          "signature": "export const handleSectionMove = createWriteHandler({ action: 'section move', pathParams: ['section_id'], bodySchema: MoveSectionPayloadSchema, call: (client, [sectionId], body) => client.sections.mov…"
        },
        {
          "name": "handleSectionDelete",
          "kind": "const",
          "line": 36,
          "exported": true,
          "signature": "export const handleSectionDelete = createDestructiveHandler({ action: 'section delete', pathParams: ['section_id'], softMode: 'optional', call: (client, [sectionId], _entry, soft) => client.sections.d…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleSharedStepAdd = createWriteHandler({ action: 'shared-step add', pathParams: ['project_id'], bodySchema: AddSharedStepPayloadSchema, call: (client, [projectId], body) => client.share…"
        },
        {
          "name": "handleSharedStepUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleSharedStepUpdate = createWriteHandler({ action: 'shared-step update', pathParams: ['shared_step_id'], bodySchema: UpdateSharedStepPayloadSchema, call: (client, [sharedStepId], body)…"
        },
        {
          "name": "handleSharedStepDelete",
          "kind": "const",
          "line": 24,
          "exported": true,
          "signature": "export const handleSharedStepDelete = createDestructiveHandler({ action: 'shared-step delete', pathParams: ['shared_step_id'], call: (client, [sharedStepId]) => client.sharedSteps.deleteSharedStep(sha…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSuiteAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleSuiteAdd = createWriteHandler({ action: 'suite add', pathParams: ['project_id'], bodySchema: AddSuitePayloadSchema, call: (client, [projectId], body) => client.suites.addSuite(proje…"
        },
        {
          "name": "handleSuiteUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleSuiteUpdate = createWriteHandler({ action: 'suite update', pathParams: ['suite_id'], bodySchema: UpdateSuitePayloadSchema, call: (client, [suiteId], body) => client.suites.updateSui…"
        },
        {
          "name": "handleSuiteDelete",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const handleSuiteDelete = createDestructiveHandler({ action: 'suite delete', pathParams: ['suite_id'], softMode: 'optional', call: (client, [suiteId], _entry, soft) => client.suites.deleteSuite…"
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
      "path": "src/cli/handlers/test-write.ts",
      "imports": [
        "../../schemas.js",
        "../body.js",
        "../handler-context.js",
        "../ids.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleTestUpdate",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const handleTestUpdate = createWriteHandler({ action: 'test update-labels', pathParams: ['test_id'], bodySchema: UpdateTestLabelsPayloadSchema, call: (client, [testId], body) => client.tests.up…"
        },
        {
          "name": "handleTestUpdateBulk",
          "kind": "function",
          "line": 26,
          "exported": true,
          "signature": "export async function handleTestUpdateBulk(ctx: HandlerContext): Promise<void>"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleUserAdd",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const handleUserAdd = createWriteHandler({ action: 'user add', bodySchema: UserAddPayloadSchema, call: (client, _nums, body) => client.users.addUser(body), })"
        },
        {
          "name": "handleUserUpdate",
          "kind": "const",
          "line": 19,
          "exported": true,
          "signature": "export const handleUserUpdate = createWriteHandler({ action: 'user update', pathParams: ['user_id'], bodySchema: UserUpdatePayloadSchema, call: (client, [userId], body) => client.users.updateUser(user…"
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
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVariableAdd",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const handleVariableAdd = createWriteHandler({ action: 'variable add', pathParams: ['project_id'], bodySchema: AddVariablePayloadSchema, call: (client, [projectId], body) => client.variables.ad…"
        },
        {
          "name": "handleVariableUpdate",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const handleVariableUpdate = createWriteHandler({ action: 'variable update', pathParams: ['variable_id'], bodySchema: UpdateVariablePayloadSchema, call: (client, [variableId], body) => client.v…"
        },
        {
          "name": "handleVariableDelete",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const handleVariableDelete = createDestructiveHandler({ action: 'variable delete', pathParams: ['variable_id'], call: (client, [variableId]) => client.variables.deleteVariable(variableId), })"
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
      "path": "src/cli/help.ts",
      "imports": [
        "./metadata.js",
        "./metadata/types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "METADATA_RESOURCES",
          "kind": "const",
          "line": 30,
          "exported": false,
          "signature": "const METADATA_RESOURCES: ReadonlySet<string> = new Set([ 'case-field', 'case-status', 'case-type', 'priority', 'result-field', 'role', 'status', 'template', ])"
        },
        {
          "name": "CONFIGURATION_RESOURCES",
          "kind": "const",
          "line": 46,
          "exported": false,
          "signature": "const CONFIGURATION_RESOURCES: ReadonlySet<string> = new Set(['configuration', 'configuration-group'])"
        },
        {
          "name": "SPECIAL_RESOURCES",
          "kind": "const",
          "line": 47,
          "exported": false,
          "signature": "const SPECIAL_RESOURCES: ReadonlySet<string> = new Set(['attachment', 'bdd'])"
        },
        {
          "name": "isReadAction",
          "kind": "function",
          "line": 49,
          "exported": false,
          "signature": "function isReadAction(spec: ActionSpec): boolean"
        },
        {
          "name": "isWriteAction",
          "kind": "function",
          "line": 53,
          "exported": false,
          "signature": "function isWriteAction(spec: ActionSpec): boolean"
        },
        {
          "name": "pathParamsText",
          "kind": "function",
          "line": 64,
          "exported": false,
          "signature": "function pathParamsText(spec: ActionSpec): string"
        },
        {
          "name": "actionArgvHint",
          "kind": "function",
          "line": 73,
          "exported": true,
          "signature": "export function actionArgvHint(spec: ActionSpec): string"
        },
        {
          "name": "renderActionLine",
          "kind": "function",
          "line": 109,
          "exported": false,
          "signature": "function renderActionLine(spec: ActionSpec): string"
        },
        {
          "name": "renderSection",
          "kind": "function",
          "line": 118,
          "exported": true,
          "signature": "export function renderSection(title: string, predicate: (spec: ActionSpec) => boolean): string"
        },
        {
          "name": "renderReadSection",
          "kind": "function",
          "line": 128,
          "exported": false,
          "signature": "function renderReadSection(): string"
        },
        {
          "name": "renderMetadataSection",
          "kind": "function",
          "line": 139,
          "exported": false,
          "signature": "function renderMetadataSection(): string"
        },
        {
          "name": "renderWriteSection",
          "kind": "function",
          "line": 145,
          "exported": false,
          "signature": "function renderWriteSection(): string"
        },
        {
          "name": "renderConfigurationSection",
          "kind": "function",
          "line": 153,
          "exported": false,
          "signature": "function renderConfigurationSection(): string"
        },
        {
          "name": "renderAttachmentSection",
          "kind": "function",
          "line": 159,
          "exported": false,
          "signature": "function renderAttachmentSection(): string"
        },
        {
          "name": "renderBddSection",
          "kind": "function",
          "line": 163,
          "exported": false,
          "signature": "function renderBddSection(): string"
        },
        {
          "name": "BINARY_STDIO_BLOCK",
          "kind": "const",
          "line": 174,
          "exported": false,
          "signature": "const BINARY_STDIO_BLOCK = `Binary stdio (Unix-convention '-' sentinel):\n  --file -    Read binary upload payload from stdin (must be piped; not a TTY).\n              Capped at 100 MiB with a 30s wall…"
        },
        {
          "name": "META_BLOCK",
          "kind": "const",
          "line": 187,
          "exported": false,
          "signature": "const META_BLOCK = `Meta:\n  install-skill [--global] [--force] [--print-path]\n                                    Install the testrail-cli skill to\n                                    ./.claude/skills…"
        },
        {
          "name": "AUTH_BLOCK",
          "kind": "const",
          "line": 198,
          "exported": false,
          "signature": "const AUTH_BLOCK = `Auth (env var preferred — argv is visible to other processes):\n  TESTRAIL_BASE_URL / --base-url <url>\n  TESTRAIL_EMAIL    / --email <email>\n  TESTRAIL_API_KEY  (recommended) | echo…"
        },
        {
          "name": "OPTIONS_BLOCK",
          "kind": "const",
          "line": 212,
          "exported": false,
          "signature": "const OPTIONS_BLOCK = `Options:\n  --api-key-stdin       Read API key from stdin (single line; mutually\n                        exclusive with stdin-piped JSON body). Use the\n                        TE…"
        },
        {
          "name": "SEMANTICS_BLOCK",
          "kind": "const",
          "line": 252,
          "exported": false,
          "signature": "const SEMANTICS_BLOCK = `For body-bearing write actions, exactly one body source is required\n(--data | --data-file | stdin). Stdin is auto-detected when input is piped\n(process.stdin.isTTY !== true) a…"
        },
        {
          "name": "HEADER",
          "kind": "const",
          "line": 281,
          "exported": false,
          "signature": "const HEADER = 'testrail <resource> <action> [args] [options]'"
        },
        {
          "name": "buildHelpText",
          "kind": "function",
          "line": 288,
          "exported": true,
          "signature": "export function buildHelpText(): string"
        }
      ]
    },
    {
      "path": "src/cli/ids.ts",
      "imports": [
        "../validation.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "IdParseError",
          "kind": "class",
          "line": 3,
          "exported": true,
          "signature": "export class IdParseError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 4
            }
          ]
        },
        {
          "name": "POSITIVE_INT_RE",
          "kind": "const",
          "line": 16,
          "exported": false,
          "signature": "const POSITIVE_INT_RE = /^[1-9]\\d*$/"
        },
        {
          "name": "NON_NEG_INT_RE",
          "kind": "const",
          "line": 28,
          "exported": false,
          "signature": "const NON_NEG_INT_RE = /^(0|[1-9]\\d*)$/"
        },
        {
          "name": "parseId",
          "kind": "function",
          "line": 30,
          "exported": true,
          "signature": "export function parseId(raw: string | undefined, name: string): number"
        },
        {
          "name": "parseEntryId",
          "kind": "function",
          "line": 49,
          "exported": true,
          "signature": "export function parseEntryId(raw: string | undefined, name: string): string"
        },
        {
          "name": "parseAttachmentId",
          "kind": "function",
          "line": 70,
          "exported": true,
          "signature": "export function parseAttachmentId(raw: string | undefined, name: string): number | string"
        },
        {
          "name": "optInt",
          "kind": "function",
          "line": 81,
          "exported": true,
          "signature": "export function optInt(raw: string | undefined): number | undefined"
        },
        {
          "name": "parseIdList",
          "kind": "function",
          "line": 96,
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
        "./help.js",
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
          "line": 22,
          "exported": false,
          "signature": "const require = createRequire(import.meta.url)"
        },
        {
          "name": "VERSION",
          "kind": "const",
          "line": 23,
          "exported": false,
          "signature": "const VERSION: string = (require('../../package.json') as { version: string }).version"
        },
        {
          "name": "HELP",
          "kind": "const",
          "line": 31,
          "exported": false,
          "signature": "const HELP = buildHelpText()"
        },
        {
          "name": "main",
          "kind": "function",
          "line": 42,
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
        "./metadata/attachments.js",
        "./metadata/bdd.js",
        "./metadata/caseFields.js",
        "./metadata/caseStatuses.js",
        "./metadata/caseTypes.js",
        "./metadata/cases.js",
        "./metadata/configurationGroups.js",
        "./metadata/configurations.js",
        "./metadata/datasets.js",
        "./metadata/groups.js",
        "./metadata/labels.js",
        "./metadata/milestones.js",
        "./metadata/plans.js",
        "./metadata/priorities.js",
        "./metadata/projects.js",
        "./metadata/reports.js",
        "./metadata/resultFields.js",
        "./metadata/results.js",
        "./metadata/roles.js",
        "./metadata/runs.js",
        "./metadata/sections.js",
        "./metadata/sharedSteps.js",
        "./metadata/statuses.js",
        "./metadata/suites.js",
        "./metadata/templates.js",
        "./metadata/tests.js",
        "./metadata/types.js",
        "./metadata/users.js",
        "./metadata/variables.js"
      ],
      "reExports": [
        "./metadata/types.js"
      ],
      "symbols": [
        {
          "name": "ACTIONS",
          "kind": "const",
          "line": 62,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ ...projectActions.slice(0, 2), ...suiteActions.slice(0, 2), ...caseActions.slice(0, 3), ...runActions.slice(0, 3), ...testActions.slice(0, 2), ...result…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 140,
          "exported": true,
          "signature": "export function getActionSpec(resource: string, action: string): ActionSpec | undefined"
        }
      ]
    },
    {
      "path": "src/cli/metadata/attachments.ts",
      "imports": [
        "../handlers/attachment-write.js",
        "../handlers/attachment.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "attachmentActions",
          "kind": "const",
          "line": 34,
          "exported": true,
          "signature": "export const attachmentActions: readonly ActionSpec[] = [ { resource: 'attachment', action: 'list-for-case', summary: 'List attachments on a test case', pathParams: [{ name: 'case_id', description: 'T…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/bdd.ts",
      "imports": [
        "../handlers/bdd.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "bddActions",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const bddActions: readonly ActionSpec[] = [ { resource: 'bdd', action: 'get', summary: \"Download a case's BDD (Gherkin .feature) content to --out <path>\", pathParams: [{ name: 'case_id', descri…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/caseFields.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/case-field-write.js",
        "../handlers/case-field.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "caseFieldActions",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const caseFieldActions: readonly ActionSpec[] = [ { resource: 'case-field', action: 'list', summary: 'List all custom case fields defined on the TestRail instance', pathParams: [], apiEndpoint:…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/cases.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/case-write.js",
        "../handlers/case.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "caseActions",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const caseActions: readonly ActionSpec[] = [ { resource: 'case', action: 'get', summary: 'Fetch a single test case by ID', pathParams: [{ name: 'case_id', description: 'TestRail case ID' }], ap…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/caseStatuses.ts",
      "imports": [
        "../handlers/case-status.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "caseStatusActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const caseStatusActions: readonly ActionSpec[] = [ { resource: 'case-status', action: 'list', summary: 'List case-level lifecycle statuses (TestRail 7.5+)', pathParams: [], apiEndpoint: 'GET ge…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/caseTypes.ts",
      "imports": [
        "../handlers/case-type.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "caseTypeActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const caseTypeActions: readonly ActionSpec[] = [ { resource: 'case-type', action: 'list', summary: 'List all case types defined on the TestRail instance', pathParams: [], apiEndpoint: 'GET get_…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/configurationGroups.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/configuration-write.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "configurationGroupActions",
          "kind": "const",
          "line": 20,
          "exported": true,
          "signature": "export const configurationGroupActions: readonly ActionSpec[] = [ { resource: 'configuration-group', action: 'add', summary: 'Create a new configuration group in a project (e.g. \"Browsers\")', pathPara…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/configurations.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/configuration-write.js",
        "../handlers/configuration.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "configurationActions",
          "kind": "const",
          "line": 24,
          "exported": true,
          "signature": "export const configurationActions: readonly ActionSpec[] = [ { resource: 'configuration', action: 'list', summary: 'List configuration groups (with nested configs) for a project', pathParams: [{ name:…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/datasets.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/dataset-write.js",
        "../handlers/dataset.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "datasetActions",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const datasetActions: readonly ActionSpec[] = [ { resource: 'dataset', action: 'get', summary: 'Fetch a single dataset by ID', pathParams: [{ name: 'dataset_id', description: 'TestRail dataset …"
        }
      ]
    },
    {
      "path": "src/cli/metadata/groups.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/group-write.js",
        "../handlers/group.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "groupActions",
          "kind": "const",
          "line": 19,
          "exported": true,
          "signature": "export const groupActions: readonly ActionSpec[] = [ { resource: 'group', action: 'get', summary: 'Fetch a single user group by ID (TestRail 7.5+)', pathParams: [{ name: 'group_id', description: 'Test…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/labels.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/label-write.js",
        "../handlers/label.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "labelActions",
          "kind": "const",
          "line": 16,
          "exported": true,
          "signature": "export const labelActions: readonly ActionSpec[] = [ { resource: 'label', action: 'get', summary: 'Fetch a single label by ID', pathParams: [{ name: 'label_id', description: 'TestRail label ID' }], ap…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/milestones.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/milestone-write.js",
        "../handlers/milestone.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "milestoneActions",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const milestoneActions: readonly ActionSpec[] = [ { resource: 'milestone', action: 'get', summary: 'Fetch a single milestone by ID', pathParams: [{ name: 'milestone_id', description: 'TestRail …"
        }
      ]
    },
    {
      "path": "src/cli/metadata/plans.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/plan-write.js",
        "../handlers/plan.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "planActions",
          "kind": "const",
          "line": 39,
          "exported": true,
          "signature": "export const planActions: readonly ActionSpec[] = [ { resource: 'plan', action: 'get', summary: 'Fetch a single test plan by ID', pathParams: [{ name: 'plan_id', description: 'TestRail plan ID' }], ap…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/priorities.ts",
      "imports": [
        "../handlers/priority.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "priorityActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const priorityActions: readonly ActionSpec[] = [ { resource: 'priority', action: 'list', summary: 'List all case priorities defined on the TestRail instance', pathParams: [], apiEndpoint: 'GET …"
        }
      ]
    },
    {
      "path": "src/cli/metadata/projects.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/project-write.js",
        "../handlers/project.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "projectActions",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const projectActions: readonly ActionSpec[] = [ { resource: 'project', action: 'get', summary: 'Fetch a single project by ID', pathParams: [{ name: 'project_id', description: 'TestRail project …"
        }
      ]
    },
    {
      "path": "src/cli/metadata/reports.ts",
      "imports": [
        "../handlers/report.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "reportActions",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const reportActions: readonly ActionSpec[] = [ { resource: 'report', action: 'list', summary: 'List report templates configured for a project', pathParams: [{ name: 'project_id', description: '…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/resultFields.ts",
      "imports": [
        "../handlers/result-field.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "resultFieldActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const resultFieldActions: readonly ActionSpec[] = [ { resource: 'result-field', action: 'list', summary: 'List all custom result fields defined on the TestRail instance', pathParams: [], apiEnd…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/results.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/result-write.js",
        "../handlers/result.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "resultActions",
          "kind": "const",
          "line": 21,
          "exported": true,
          "signature": "export const resultActions: readonly ActionSpec[] = [ { resource: 'result', action: 'list', summary: 'List results for a run (paginated)', pathParams: [], apiEndpoint: 'GET get_results_for_run/{run_id…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/roles.ts",
      "imports": [
        "../handlers/role.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "roleActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const roleActions: readonly ActionSpec[] = [ { resource: 'role', action: 'list', summary: 'List all user roles defined on the TestRail instance', pathParams: [], apiEndpoint: 'GET get_roles', i…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/runs.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/run-watch.js",
        "../handlers/run-write.js",
        "../handlers/run.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "runActions",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const runActions: readonly ActionSpec[] = [ { resource: 'run', action: 'get', summary: 'Fetch a single run by ID', pathParams: [{ name: 'run_id', description: 'TestRail run ID' }], apiEndpoint:…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/sections.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/section-write.js",
        "../handlers/section.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "sectionActions",
          "kind": "const",
          "line": 20,
          "exported": true,
          "signature": "export const sectionActions: readonly ActionSpec[] = [ { resource: 'section', action: 'get', summary: 'Fetch a single section by ID', pathParams: [{ name: 'section_id', description: 'TestRail section …"
        }
      ]
    },
    {
      "path": "src/cli/metadata/sharedSteps.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/shared-step-write.js",
        "../handlers/shared-step.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "sharedStepActions",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const sharedStepActions: readonly ActionSpec[] = [ { resource: 'shared-step', action: 'get', summary: 'Fetch a single shared step by ID', pathParams: [{ name: 'shared_step_id', description: 'Te…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/statuses.ts",
      "imports": [
        "../handlers/status.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "statusActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const statusActions: readonly ActionSpec[] = [ { resource: 'status', action: 'list', summary: 'List all result statuses defined on the TestRail instance', pathParams: [], apiEndpoint: 'GET get_…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/suites.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/suite-write.js",
        "../handlers/suite.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "suiteActions",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const suiteActions: readonly ActionSpec[] = [ { resource: 'suite', action: 'get', summary: 'Fetch a single suite by ID', pathParams: [{ name: 'suite_id', description: 'TestRail suite ID' }], ap…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/templates.ts",
      "imports": [
        "../handlers/template.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "templateActions",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const templateActions: readonly ActionSpec[] = [ { resource: 'template', action: 'list', summary: 'List case templates available in a project', pathParams: [{ name: 'project_id', description: '…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/tests.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/test-write.js",
        "../handlers/test.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "testActions",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const testActions: readonly ActionSpec[] = [ { resource: 'test', action: 'get', summary: 'Fetch a single test (run instance of a case) by ID', pathParams: [{ name: 'test_id', description: 'Test…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/types.ts",
      "imports": [
        "../handler-context.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PathParam",
          "kind": "interface",
          "line": 11,
          "exported": true,
          "signature": "export interface PathParam { name: string; description: string; }"
        },
        {
          "name": "ActionSpec",
          "kind": "interface",
          "line": 16,
          "exported": true,
          "signature": "export interface ActionSpec { resource: string; action: string; summary: string; pathParams: readonly PathParam[]; handler: Handler; apiEndpoint: string; bodySchema?: z.ZodTypeAny; helpExample?: strin…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/users.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/user-write.js",
        "../handlers/user.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "userActions",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const userActions: readonly ActionSpec[] = [ { resource: 'user', action: 'get', summary: 'Fetch a single user by ID', pathParams: [{ name: 'user_id', description: 'TestRail user ID' }], apiEndp…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/variables.ts",
      "imports": [
        "../../schemas.js",
        "../handlers/variable-write.js",
        "../handlers/variable.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "variableActions",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const variableActions: readonly ActionSpec[] = [ { resource: 'variable', action: 'list', summary: 'List variables in a project', pathParams: [{ name: 'project_id', description: 'TestRail projec…"
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
          "line": 114,
          "exported": true,
          "signature": "export function safeJsonStringify(data: unknown): string"
        },
        {
          "name": "emitStdoutAck",
          "kind": "function",
          "line": 136,
          "exported": true,
          "signature": "export function emitStdoutAck( payload: Uint8Array | string, ack: Record<string, unknown>, errRaw?: (chunk: string) => void, ): void"
        },
        {
          "name": "SPECIAL_BARE_STRINGS",
          "kind": "const",
          "line": 164,
          "exported": false,
          "signature": "const SPECIAL_BARE_STRINGS: ReadonlySet<string> = new Set([ '', '~', 'null', 'Null', 'NULL', 'true', 'True', 'TRUE', 'false', 'False', 'FALSE', 'yes', 'Yes', 'YES', 'no', 'No', 'NO', 'on', 'On', 'ON',…"
        },
        {
          "name": "needsQuoting",
          "kind": "function",
          "line": 207,
          "exported": false,
          "signature": "function needsQuoting(s: string): boolean"
        },
        {
          "name": "escapeDoubleQuoted",
          "kind": "function",
          "line": 249,
          "exported": false,
          "signature": "function escapeDoubleQuoted(s: string): string"
        },
        {
          "name": "renderYamlScalar",
          "kind": "function",
          "line": 292,
          "exported": false,
          "signature": "function renderYamlScalar(v: unknown): string"
        },
        {
          "name": "isPlainObject",
          "kind": "function",
          "line": 314,
          "exported": false,
          "signature": "function isPlainObject(v: unknown): v is Record<string, unknown>"
        },
        {
          "name": "renderYamlNode",
          "kind": "function",
          "line": 323,
          "exported": false,
          "signature": "function renderYamlNode(v: unknown, depth: number): string"
        },
        {
          "name": "renderYaml",
          "kind": "function",
          "line": 404,
          "exported": true,
          "signature": "export function renderYaml(value: unknown): string"
        },
        {
          "name": "CSV_LINE_TERMINATOR",
          "kind": "const",
          "line": 436,
          "exported": false,
          "signature": "const CSV_LINE_TERMINATOR = '\\r\\n'"
        },
        {
          "name": "TAB",
          "kind": "const",
          "line": 441,
          "exported": false,
          "signature": "const TAB = 0x09"
        },
        {
          "name": "LF",
          "kind": "const",
          "line": 442,
          "exported": false,
          "signature": "const LF = 0x0a"
        },
        {
          "name": "CR",
          "kind": "const",
          "line": 443,
          "exported": false,
          "signature": "const CR = 0x0d"
        },
        {
          "name": "CSV_FORMULA_LEAD_CHARS",
          "kind": "const",
          "line": 448,
          "exported": false,
          "signature": "const CSV_FORMULA_LEAD_CHARS: ReadonlySet<string> = new Set(['=', '+', '-', '@'])"
        },
        {
          "name": "neutralizeCsvFormula",
          "kind": "function",
          "line": 452,
          "exported": false,
          "signature": "function neutralizeCsvFormula(cell: string): string"
        },
        {
          "name": "csvCellRequiresQuoting",
          "kind": "function",
          "line": 462,
          "exported": false,
          "signature": "function csvCellRequiresQuoting(cell: string): boolean"
        },
        {
          "name": "csvQuoteCell",
          "kind": "function",
          "line": 471,
          "exported": false,
          "signature": "function csvQuoteCell(cell: string): string"
        },
        {
          "name": "csvEscapeCell",
          "kind": "function",
          "line": 480,
          "exported": false,
          "signature": "function csvEscapeCell(cell: string): string"
        },
        {
          "name": "csvDataCell",
          "kind": "function",
          "line": 487,
          "exported": false,
          "signature": "function csvDataCell(v: unknown): string"
        },
        {
          "name": "sanitizeForCsv",
          "kind": "function",
          "line": 491,
          "exported": false,
          "signature": "function sanitizeForCsv(cell: string): string"
        },
        {
          "name": "csvCellFromValue",
          "kind": "function",
          "line": 497,
          "exported": false,
          "signature": "function csvCellFromValue(v: unknown): string"
        },
        {
          "name": "renderCsv",
          "kind": "function",
          "line": 537,
          "exported": true,
          "signature": "export function renderCsv(value: unknown): string"
        },
        {
          "name": "createOutput",
          "kind": "function",
          "line": 591,
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
        },
        {
          "name": "isControlChar",
          "kind": "function",
          "line": 38,
          "exported": true,
          "signature": "export function isControlChar(code: number): boolean"
        },
        {
          "name": "stripChars",
          "kind": "function",
          "line": 53,
          "exported": true,
          "signature": "export function stripChars(s: string, shouldStrip: (code: number) => boolean): string"
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
      "path": "src/cli/write-handler-factory.ts",
      "imports": [
        "../client.js",
        "./body.js",
        "./handler-context.js",
        "./ids.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "camelCase",
          "kind": "function",
          "line": 30,
          "exported": false,
          "signature": "function camelCase(snake: string): string"
        },
        {
          "name": "NumIds",
          "kind": "type",
          "line": 45,
          "exported": true,
          "signature": "export type NumIds = readonly [number, number]"
        },
        {
          "name": "ParsedPath",
          "kind": "interface",
          "line": 47,
          "exported": false,
          "signature": "interface ParsedPath { nums: number[]; entry: string; idBag: Record<string, number | string>; }"
        },
        {
          "name": "parsePathArgs",
          "kind": "function",
          "line": 57,
          "exported": false,
          "signature": "function parsePathArgs(ctx: HandlerContext, pathParams: readonly string[], entryParam: string | undefined): ParsedPath"
        },
        {
          "name": "WriteHandlerSpec",
          "kind": "interface",
          "line": 73,
          "exported": true,
          "signature": "export interface WriteHandlerSpec<S extends z.ZodTypeAny> { action: string; pathParams?: readonly string[]; entryParam?: string; bodySchema: S; allowEmptyBody?: boolean; call: (client: TestRailClient,…"
        },
        {
          "name": "createWriteHandler",
          "kind": "function",
          "line": 98,
          "exported": true,
          "signature": "export function createWriteHandler<S extends z.ZodTypeAny>(spec: WriteHandlerSpec<S>): Handler"
        },
        {
          "name": "DestructiveHandlerSpec",
          "kind": "interface",
          "line": 131,
          "exported": true,
          "signature": "export interface DestructiveHandlerSpec { action: string; pathParams?: readonly string[]; entryParam?: string; softMode?: 'reject' | 'ignore' | 'optional'; kind?: 'delete' | 'close'; call: (client: Te…"
        },
        {
          "name": "createDestructiveHandler",
          "kind": "function",
          "line": 157,
          "exported": true,
          "signature": "export function createDestructiveHandler(spec: DestructiveHandlerSpec): Handler"
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
        "./http-pipeline-types.js",
        "./retry-policy.js",
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
          "line": 21,
          "exported": false,
          "signature": "function isFilePathInput(value: unknown): value is UploadFilePathInput"
        },
        {
          "name": "USER_AGENT",
          "kind": "const",
          "line": 31,
          "exported": false,
          "signature": "const USER_AGENT = `${pkg.description}/${pkg.version}`"
        },
        {
          "name": "PRIVATE_HOST_PATTERNS",
          "kind": "const",
          "line": 58,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^fe[c-f][0-9a-f]…"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 74,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 96,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "DnsLookupFn",
          "kind": "type",
          "line": 135,
          "exported": false,
          "signature": "type DnsLookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 137,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string, dnsLookup?: DnsLookupFn): Promise<void>"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 197,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 198,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 201,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 211,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 234,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 235
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 238
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 239
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 240
            },
            {
              "name": "enableCache",
              "kind": "property",
              "line": 241
            },
            {
              "name": "cacheTtl",
              "kind": "property",
              "line": 242
            },
            {
              "name": "cacheCleanupInterval",
              "kind": "property",
              "line": 243
            },
            {
              "name": "maxCacheSize",
              "kind": "property",
              "line": 244
            },
            {
              "name": "cache",
              "kind": "property",
              "line": 245
            },
            {
              "name": "pendingRequests",
              "kind": "property",
              "line": 246
            },
            {
              "name": "cacheGeneration",
              "kind": "property",
              "line": 247
            },
            {
              "name": "cacheCleanupTimer",
              "kind": "property",
              "line": 248
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 249
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 250
            },
            {
              "name": "hostname",
              "kind": "property",
              "line": 251
            },
            {
              "name": "allowPrivateHosts",
              "kind": "property",
              "line": 252
            },
            {
              "name": "maxJsonResponseBytes",
              "kind": "property",
              "line": 253
            },
            {
              "name": "maxBinaryResponseBytes",
              "kind": "property",
              "line": 254
            },
            {
              "name": "bodyTimeout",
              "kind": "property",
              "line": 259
            },
            {
              "name": "fetchOverride",
              "kind": "property",
              "line": 260
            },
            {
              "name": "dnsLookup",
              "kind": "property",
              "line": 261
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 263
            },
            {
              "name": "validateConfig",
              "kind": "method",
              "line": 330
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 502
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 527
            },
            {
              "name": "assertNotRedirect",
              "kind": "method",
              "line": 569
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 612
            },
            {
              "name": "getCachedData",
              "kind": "method",
              "line": 635
            },
            {
              "name": "setCachedData",
              "kind": "method",
              "line": 656
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 692
            },
            {
              "name": "startCacheCleanup",
              "kind": "method",
              "line": 704
            },
            {
              "name": "stopCacheCleanup",
              "kind": "method",
              "line": 715
            },
            {
              "name": "cleanupExpiredCache",
              "kind": "method",
              "line": 722
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 749
            },
            {
              "name": "request",
              "kind": "method",
              "line": 797
            },
            {
              "name": "executeJson",
              "kind": "method",
              "line": 879
            },
            {
              "name": "cacheInvalidationHook",
              "kind": "method",
              "line": 914
            },
            {
              "name": "executeText",
              "kind": "method",
              "line": 934
            },
            {
              "name": "executeBinary",
              "kind": "method",
              "line": 958
            },
            {
              "name": "buildPipelineBody",
              "kind": "method",
              "line": 986
            },
            {
              "name": "buildMultipartBody",
              "kind": "method",
              "line": 1004
            },
            {
              "name": "executePipeline",
              "kind": "method",
              "line": 1108
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 1271
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 1280
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
        "./modules/labels.js",
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
        "./modules/variables.js"
      ],
      "reExports": [
        "./errors.js"
      ],
      "symbols": [
        {
          "name": "TestRailClient",
          "kind": "class",
          "line": 35,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 37
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 38
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 39
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 40
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 41
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 42
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 43
            },
            {
              "name": "results",
              "kind": "property",
              "line": 44
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 45
            },
            {
              "name": "users",
              "kind": "property",
              "line": 46
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 47
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 48
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 49
            },
            {
              "name": "bdd",
              "kind": "property",
              "line": 50
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 51
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 52
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 53
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 54
            },
            {
              "name": "labels",
              "kind": "property",
              "line": 55
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 57
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
          "name": "MAX_PAGINATION_LIMIT",
          "kind": "const",
          "line": 25,
          "exported": true,
          "signature": "export const MAX_PAGINATION_LIMIT = 250"
        },
        {
          "name": "DEFAULT_MAX_JSON_RESPONSE_BYTES",
          "kind": "const",
          "line": 49,
          "exported": true,
          "signature": "export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 10 * 1024 * 1024"
        },
        {
          "name": "DEFAULT_MAX_BINARY_RESPONSE_BYTES",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const DEFAULT_MAX_BINARY_RESPONSE_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "MAX_RESPONSE_BYTES_LIMIT",
          "kind": "const",
          "line": 51,
          "exported": true,
          "signature": "export const MAX_RESPONSE_BYTES_LIMIT = 1024 * 1024 * 1024"
        },
        {
          "name": "MAX_DATA_FILE_BYTES",
          "kind": "const",
          "line": 60,
          "exported": true,
          "signature": "export const MAX_DATA_FILE_BYTES = 1_048_576"
        },
        {
          "name": "MAX_STDIN_BYTES",
          "kind": "const",
          "line": 74,
          "exported": true,
          "signature": "export const MAX_STDIN_BYTES = 1024 * 1024"
        },
        {
          "name": "MAX_STDIN_UPLOAD_BYTES",
          "kind": "const",
          "line": 90,
          "exported": true,
          "signature": "export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "STDIN_READ_TIMEOUT_MS",
          "kind": "const",
          "line": 104,
          "exported": true,
          "signature": "export const STDIN_READ_TIMEOUT_MS = 30000"
        },
        {
          "name": "YAML_INDENT_SPACES",
          "kind": "const",
          "line": 112,
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
      "path": "src/http-pipeline-types.ts",
      "imports": [
        "./retry-policy.js",
        "./types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RetryPolicy",
          "kind": "interface",
          "line": 14,
          "exported": true,
          "signature": "export interface RetryPolicy { isStatusRetryable(status: number, method: string): boolean; isNetworkErrorRetryable(method: string): boolean; }"
        },
        {
          "name": "BodyShape",
          "kind": "type",
          "line": 28,
          "exported": true,
          "signature": "export type BodyShape = | { readonly kind: 'none' } | { readonly kind: 'json'; readonly data: unknown } | { readonly kind: 'formdata'; readonly build: () => Promise<{ body: FormData; cleanup: () => vo…"
        },
        {
          "name": "CachePolicy",
          "kind": "interface",
          "line": 41,
          "exported": true,
          "signature": "export interface CachePolicy { readonly key: string | undefined; readonly skipRead: boolean; }"
        },
        {
          "name": "PipelineSpec",
          "kind": "interface",
          "line": 50,
          "exported": true,
          "signature": "export interface PipelineSpec<TParsed> { readonly method: string; readonly endpoint: string; readonly body: BodyShape; readonly sendJsonContentType: boolean; readonly retryPolicy: RetryPolicy; readonl…"
        },
        {
          "name": "RequestBody",
          "kind": "type",
          "line": 75,
          "exported": true,
          "signature": "export type RequestBody = | { readonly kind: 'json'; readonly data: unknown } | { readonly kind: 'multipart'; readonly file: UploadFileInput; readonly filename: string }"
        },
        {
          "name": "RequestSpec",
          "kind": "interface",
          "line": 99,
          "exported": true,
          "signature": "export interface RequestSpec<T> { readonly __t?: T; readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE'; readonly endpoint: string; readonly body?: RequestBody; readonly schema?: ZodType; readonly resp…"
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAttachmentsOptions",
          "kind": "interface",
          "line": 16,
          "exported": true,
          "signature": "export interface GetAttachmentsOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "AttachmentModule",
          "kind": "class",
          "line": 23,
          "exported": true,
          "signature": "export class AttachmentModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 24
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 27
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 48
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 69
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 90
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 115
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 132
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 143
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 154
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 165
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 176
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 192
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 209
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
        "../types.js",
        "../validation.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BddModule",
          "kind": "class",
          "line": 18,
          "exported": true,
          "signature": "export class BddModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 19
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 26
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 40
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetHistoryForCaseOptions",
          "kind": "interface",
          "line": 19,
          "exported": true,
          "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "CaseModule",
          "kind": "class",
          "line": 26,
          "exported": true,
          "signature": "export class CaseModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 27
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 30
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 36
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 87
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 111
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 147
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 166
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 167
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 173
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 174
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 198
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 216
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 222
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 229
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 235
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 262
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 279
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 289
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
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ConfigurationModule",
          "kind": "class",
          "line": 14,
          "exported": true,
          "signature": "export class ConfigurationModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 15
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 18
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 28
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 39
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 53
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 62
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 73
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 84
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
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "DatasetModule",
          "kind": "class",
          "line": 7,
          "exported": true,
          "signature": "export class DatasetModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 11
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 21
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 41
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 52
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 63
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/labels.ts",
      "imports": [
        "../client-core.js",
        "../schemas.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "LabelModule",
          "kind": "class",
          "line": 14,
          "exported": true,
          "signature": "export class LabelModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 15
            },
            {
              "name": "getLabel",
              "kind": "method",
              "line": 18
            },
            {
              "name": "getLabels",
              "kind": "method",
              "line": 28
            },
            {
              "name": "updateLabel",
              "kind": "method",
              "line": 48
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
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "MetadataModule",
          "kind": "class",
          "line": 18,
          "exported": true,
          "signature": "export class MetadataModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 19
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 22
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 31
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 40
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 49
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 58
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 89
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 99
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 108
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 118
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "MilestoneModule",
          "kind": "class",
          "line": 9,
          "exported": true,
          "signature": "export class MilestoneModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 10
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 13
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 23
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 47
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 58
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 69
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
        "../url.js",
        "../utils.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PlanModule",
          "kind": "class",
          "line": 19,
          "exported": true,
          "signature": "export class PlanModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 20
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 23
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 29
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 67
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 78
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 89
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 99
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 105
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 116
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 128
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 138
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 150
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 161
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ProjectModule",
          "kind": "class",
          "line": 9,
          "exported": true,
          "signature": "export class ProjectModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 10
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 18
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 33
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 54
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 69
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 85
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
        "../types.js",
        "../validation.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ReportModule",
          "kind": "class",
          "line": 6,
          "exported": true,
          "signature": "export class ReportModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 7
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 10
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 20
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
        "../url.js",
        "../utils.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResultModule",
          "kind": "class",
          "line": 10,
          "exported": true,
          "signature": "export class ResultModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 11
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 51
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 89
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 124
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 135
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 147
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 158
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
        "../url.js",
        "../utils.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RunModule",
          "kind": "class",
          "line": 10,
          "exported": true,
          "signature": "export class RunModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 11
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 20
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 59
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 70
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 81
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 98
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 99
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 102
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 103
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SectionModule",
          "kind": "class",
          "line": 9,
          "exported": true,
          "signature": "export class SectionModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 10
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 13
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 23
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 48
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 59
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 77
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 78
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 80
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 81
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 106
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetSharedStepHistoryOptions",
          "kind": "interface",
          "line": 8,
          "exported": true,
          "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "SharedStepModule",
          "kind": "class",
          "line": 15,
          "exported": true,
          "signature": "export class SharedStepModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 16
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 19
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 29
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 47
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 58
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 69
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 78
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SuiteModule",
          "kind": "class",
          "line": 9,
          "exported": true,
          "signature": "export class SuiteModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 10
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 18
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 33
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 55
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 71
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 91
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 92
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 94
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 95
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
        "../url.js",
        "../utils.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestModule",
          "kind": "class",
          "line": 10,
          "exported": true,
          "signature": "export class TestModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 11
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 14
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 24
            },
            {
              "name": "updateTest",
              "kind": "method",
              "line": 58
            },
            {
              "name": "updateTests",
              "kind": "method",
              "line": 81
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
        "../url.js",
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "EMAIL_REGEX",
          "kind": "const",
          "line": 17,
          "exported": false,
          "signature": "const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+$/"
        },
        {
          "name": "UsersModule",
          "kind": "class",
          "line": 19,
          "exported": true,
          "signature": "export class UsersModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 20
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 23
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 33
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 43
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 68
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 77
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 87
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 98
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 108
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 123
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 133
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 144
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
        "../validation.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "VariableModule",
          "kind": "class",
          "line": 7,
          "exported": true,
          "signature": "export class VariableModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 8
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 11
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 32
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 43
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 54
            }
          ]
        }
      ]
    },
    {
      "path": "src/retry-policy.ts",
      "imports": [
        "./http-pipeline-types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "FULL_RETRY_POLICY",
          "kind": "const",
          "line": 9,
          "exported": false,
          "signature": "const FULL_RETRY_POLICY: RetryPolicy = { isStatusRetryable(status: number, method: string): boolean { if (status === 429) return true; return status >= 500 && method === 'GET'; }, isNetworkErrorRetrya…"
        },
        {
          "name": "BINARY_GET_RETRY_POLICY",
          "kind": "const",
          "line": 25,
          "exported": false,
          "signature": "const BINARY_GET_RETRY_POLICY: RetryPolicy = { isStatusRetryable(status: number): boolean { return status === 429 || status >= 500; }, isNetworkErrorRetryable(): boolean { return true; }, }"
        },
        {
          "name": "NO_RETRY_POLICY",
          "kind": "const",
          "line": 40,
          "exported": false,
          "signature": "const NO_RETRY_POLICY: RetryPolicy = { isStatusRetryable(): boolean { return false; }, isNetworkErrorRetryable(): boolean { return false; }, }"
        },
        {
          "name": "RetryPolicyName",
          "kind": "type",
          "line": 50,
          "exported": true,
          "signature": "export type RetryPolicyName = 'full' | 'binaryGet' | 'none'"
        },
        {
          "name": "getRetryPolicy",
          "kind": "function",
          "line": 56,
          "exported": true,
          "signature": "export function getRetryPolicy(name: RetryPolicyName): RetryPolicy"
        }
      ]
    },
    {
      "path": "src/schemas.ts",
      "imports": [],
      "reExports": [
        "./schemas/attachments.js",
        "./schemas/cases.js",
        "./schemas/common.js",
        "./schemas/configurations.js",
        "./schemas/datasets.js",
        "./schemas/labels.js",
        "./schemas/metadata.js",
        "./schemas/milestones.js",
        "./schemas/plans.js",
        "./schemas/projects.js",
        "./schemas/reports.js",
        "./schemas/results.js",
        "./schemas/runs.js",
        "./schemas/sections.js",
        "./schemas/sharedSteps.js",
        "./schemas/suites.js",
        "./schemas/tests.js",
        "./schemas/users.js",
        "./schemas/variables.js"
      ],
      "symbols": []
    },
    {
      "path": "src/schemas/attachments.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "AttachmentSchema",
          "kind": "const",
          "line": 52,
          "exported": true,
          "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number().nullish(), id: z.union([z.number(), z.string()]).nullish(), name: z.string().nullish(), filename: z.string().nullish(), filetype: z.…"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 76,
          "exported": true,
          "signature": "export type Attachment = z.infer<typeof AttachmentSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/cases.ts",
      "imports": [
        "./common.js",
        "./metadata.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "CaseSchema",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
        },
        {
          "name": "Case",
          "kind": "type",
          "line": 40,
          "exported": true,
          "signature": "export type Case = z.infer<typeof CaseSchema>"
        },
        {
          "name": "HistoryChangeSchema",
          "kind": "const",
          "line": 46,
          "exported": false,
          "signature": "const HistoryChangeSchema = zObject({ field: z.string().nullish(), type_id: z.number().nullish(), old_text: z.string().nullish(), new_text: z.string().nullish(), label: z.string().nullish(), options: …"
        },
        {
          "name": "HistoryEntrySchema",
          "kind": "const",
          "line": 77,
          "exported": true,
          "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 91,
          "exported": true,
          "signature": "export type HistoryEntry = z.infer<typeof HistoryEntrySchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 95,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 106,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 108,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 119,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "AddCasesBulkPayloadSchema",
          "kind": "const",
          "line": 131,
          "exported": true,
          "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
        },
        {
          "name": "AddCasesBulkPayload",
          "kind": "type",
          "line": 133,
          "exported": true,
          "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>"
        },
        {
          "name": "UpdateCasesPayloadSchema",
          "kind": "const",
          "line": 141,
          "exported": true,
          "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
        },
        {
          "name": "UpdateCasesPayload",
          "kind": "type",
          "line": 153,
          "exported": true,
          "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>"
        },
        {
          "name": "DeleteCasesPayloadSchema",
          "kind": "const",
          "line": 162,
          "exported": true,
          "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
        },
        {
          "name": "DeleteCasesPayload",
          "kind": "type",
          "line": 170,
          "exported": true,
          "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>"
        },
        {
          "name": "SoftDeletePreviewSchema",
          "kind": "const",
          "line": 178,
          "exported": true,
          "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
        },
        {
          "name": "SoftDeletePreview",
          "kind": "type",
          "line": 188,
          "exported": true,
          "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>"
        },
        {
          "name": "CopyCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 193,
          "exported": true,
          "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
        },
        {
          "name": "CopyCasesToSectionPayload",
          "kind": "type",
          "line": 197,
          "exported": true,
          "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>"
        },
        {
          "name": "MoveCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 205,
          "exported": true,
          "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
        },
        {
          "name": "MoveCasesToSectionPayload",
          "kind": "type",
          "line": 210,
          "exported": true,
          "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/common.ts",
      "imports": [
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "zObject",
          "kind": "const",
          "line": 3,
          "exported": true,
          "signature": "export const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough()"
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
        }
      ]
    },
    {
      "path": "src/schemas/configurations.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ConfigurationSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 12,
          "exported": true,
          "signature": "export type Configuration = z.infer<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroupSchema",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 21,
          "exported": true,
          "signature": "export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "AddConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 31,
          "exported": true,
          "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationGroupPayload",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationGroupPayload",
          "kind": "type",
          "line": 41,
          "exported": true,
          "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>"
        },
        {
          "name": "AddConfigurationPayloadSchema",
          "kind": "const",
          "line": 43,
          "exported": true,
          "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationPayload",
          "kind": "type",
          "line": 47,
          "exported": true,
          "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationPayloadSchema",
          "kind": "const",
          "line": 49,
          "exported": true,
          "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationPayload",
          "kind": "type",
          "line": 53,
          "exported": true,
          "signature": "export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/datasets.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "DatasetVariableSchema",
          "kind": "const",
          "line": 16,
          "exported": true,
          "signature": "export const DatasetVariableSchema = zObject({ id: z.number(), name: z.string(), value: z.string().nullable(), })"
        },
        {
          "name": "DatasetVariable",
          "kind": "type",
          "line": 22,
          "exported": true,
          "signature": "export type DatasetVariable = z.infer<typeof DatasetVariableSchema>"
        },
        {
          "name": "DatasetSchema",
          "kind": "const",
          "line": 42,
          "exported": true,
          "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), variables: z.array(DatasetVariableSchema).nullish(), })"
        },
        {
          "name": "Dataset",
          "kind": "type",
          "line": 48,
          "exported": true,
          "signature": "export type Dataset = z.infer<typeof DatasetSchema>"
        },
        {
          "name": "AddDatasetPayloadSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "type",
          "line": 54,
          "exported": true,
          "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>"
        },
        {
          "name": "UpdateDatasetPayloadSchema",
          "kind": "const",
          "line": 62,
          "exported": true,
          "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "type",
          "line": 66,
          "exported": true,
          "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/labels.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "LabelSchema",
          "kind": "const",
          "line": 27,
          "exported": true,
          "signature": "export const LabelSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })"
        },
        {
          "name": "Label",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type Label = z.infer<typeof LabelSchema>"
        },
        {
          "name": "UpdateLabelPayloadSchema",
          "kind": "const",
          "line": 44,
          "exported": true,
          "signature": "export const UpdateLabelPayloadSchema = zObject({ title: z.string(), })"
        },
        {
          "name": "UpdateLabelPayload",
          "kind": "type",
          "line": 48,
          "exported": true,
          "signature": "export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/metadata.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "LabelEmbeddedSchema",
          "kind": "const",
          "line": 31,
          "exported": true,
          "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })"
        },
        {
          "name": "LabelEmbedded",
          "kind": "type",
          "line": 39,
          "exported": true,
          "signature": "export type LabelEmbedded = z.infer<typeof LabelEmbeddedSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 43,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 55,
          "exported": true,
          "signature": "export type Status = z.infer<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 57,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 65,
          "exported": true,
          "signature": "export type Priority = z.infer<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatusSchema",
          "kind": "const",
          "line": 72,
          "exported": true,
          "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 81,
          "exported": true,
          "signature": "export type CaseStatus = z.infer<typeof CaseStatusSchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 85,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string(), items: z.string().nullish(), format: z.string().nullish(), rows: z.string().nullish(), })"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 93,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z .union([z.array(z.number()), z.literal('')]) .nullish() .transform((value) => (Array.isArray(value) ? value : [])), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 108,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 113,
          "exported": true,
          "signature": "export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 115,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 129,
          "exported": true,
          "signature": "export type CaseField = z.infer<typeof CaseFieldSchema>"
        },
        {
          "name": "AddCaseFieldResponseSchema",
          "kind": "const",
          "line": 150,
          "exported": true,
          "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
        },
        {
          "name": "AddCaseFieldResponse",
          "kind": "type",
          "line": 175,
          "exported": true,
          "signature": "export type AddCaseFieldResponse = z.infer<typeof AddCaseFieldResponseSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 177,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 182,
          "exported": true,
          "signature": "export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 184,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 198,
          "exported": true,
          "signature": "export type ResultField = z.infer<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 202,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 208,
          "exported": true,
          "signature": "export type CaseType = z.infer<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 210,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 216,
          "exported": true,
          "signature": "export type Template = z.infer<typeof TemplateSchema>"
        },
        {
          "name": "AddCaseFieldConfigPayloadSchema",
          "kind": "const",
          "line": 233,
          "exported": true,
          "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
        },
        {
          "name": "AddCaseFieldConfigPayload",
          "kind": "type",
          "line": 247,
          "exported": true,
          "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>"
        },
        {
          "name": "AddCaseFieldPayloadSchema",
          "kind": "const",
          "line": 249,
          "exported": true,
          "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
        },
        {
          "name": "AddCaseFieldPayload",
          "kind": "type",
          "line": 259,
          "exported": true,
          "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/milestones.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 31,
          "exported": true,
          "signature": "export type Milestone = z.infer<typeof MilestoneSchema>"
        },
        {
          "name": "AddMilestonePayloadSchema",
          "kind": "const",
          "line": 35,
          "exported": true,
          "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "type",
          "line": 44,
          "exported": true,
          "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>"
        },
        {
          "name": "UpdateMilestonePayloadSchema",
          "kind": "const",
          "line": 46,
          "exported": true,
          "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "type",
          "line": 57,
          "exported": true,
          "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/plans.ts",
      "imports": [
        "./common.js",
        "./runs.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 27,
          "exported": true,
          "signature": "export type PlanEntry = z.infer<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 29,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 72,
          "exported": true,
          "signature": "export type Plan = z.infer<typeof PlanSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 81,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 91,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 98,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 107,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 112,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 119,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 121,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 144,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 146,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 166,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 168,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(),…"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 181,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 183,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), start_on: z…"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 196,
          "exported": true,
          "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/projects.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ProjectSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
        },
        {
          "name": "Project",
          "kind": "type",
          "line": 55,
          "exported": true,
          "signature": "export type Project = z.infer<typeof ProjectSchema>"
        },
        {
          "name": "AddProjectPayloadSchema",
          "kind": "const",
          "line": 59,
          "exported": true,
          "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "AddProjectPayload",
          "kind": "type",
          "line": 66,
          "exported": true,
          "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>"
        },
        {
          "name": "UpdateProjectPayloadSchema",
          "kind": "const",
          "line": 68,
          "exported": true,
          "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "type",
          "line": 75,
          "exported": true,
          "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/reports.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ReportSchema",
          "kind": "const",
          "line": 20,
          "exported": true,
          "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), notify_user: z.boolean().nullish(), notify_link: z.boolean().nullish(), notify_link_recipient…"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 33,
          "exported": true,
          "signature": "export type Report = z.infer<typeof ReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 46,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), report_html: z.string().nullish(), report_pdf: z.string().nullish(), user_report_url: z.string().nullish(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 53,
          "exported": true,
          "signature": "export type ReportResult = z.infer<typeof ReportResultSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/results.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResultSchema",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish(), defects: …"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 36,
          "exported": true,
          "signature": "export type Result = z.infer<typeof ResultSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 60,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 65,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 76,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 78,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 82,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "AddResultForTestPayloadSchema",
          "kind": "const",
          "line": 88,
          "exported": true,
          "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForTestPayload",
          "kind": "type",
          "line": 99,
          "exported": true,
          "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>"
        },
        {
          "name": "AddResultsPayloadSchema",
          "kind": "const",
          "line": 101,
          "exported": true,
          "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
        },
        {
          "name": "AddResultsPayload",
          "kind": "type",
          "line": 105,
          "exported": true,
          "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/runs.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 62,
          "exported": true,
          "signature": "export type Run = z.infer<typeof RunSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 66,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 77,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 79,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 89,
          "exported": true,
          "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/sections.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SectionSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
        },
        {
          "name": "Section",
          "kind": "type",
          "line": 16,
          "exported": true,
          "signature": "export type Section = z.infer<typeof SectionSchema>"
        },
        {
          "name": "MoveSectionPayloadSchema",
          "kind": "const",
          "line": 28,
          "exported": true,
          "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
        },
        {
          "name": "MoveSectionPayload",
          "kind": "type",
          "line": 33,
          "exported": true,
          "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>"
        },
        {
          "name": "AddSectionPayloadSchema",
          "kind": "const",
          "line": 43,
          "exported": true,
          "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
        },
        {
          "name": "AddSectionPayload",
          "kind": "type",
          "line": 50,
          "exported": true,
          "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>"
        },
        {
          "name": "UpdateSectionPayloadSchema",
          "kind": "const",
          "line": 52,
          "exported": true,
          "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSectionPayload",
          "kind": "type",
          "line": 57,
          "exported": true,
          "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/sharedSteps.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SharedStepSchema",
          "kind": "const",
          "line": 36,
          "exported": true,
          "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…"
        },
        {
          "name": "SharedStep",
          "kind": "type",
          "line": 48,
          "exported": true,
          "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>"
        },
        {
          "name": "AddSharedStepPayloadSchema",
          "kind": "const",
          "line": 65,
          "exported": true,
          "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "AddSharedStepPayload",
          "kind": "type",
          "line": 70,
          "exported": true,
          "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>"
        },
        {
          "name": "UpdateSharedStepPayloadSchema",
          "kind": "const",
          "line": 81,
          "exported": true,
          "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "UpdateSharedStepPayload",
          "kind": "type",
          "line": 86,
          "exported": true,
          "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>"
        },
        {
          "name": "StepHistoryEntrySchema",
          "kind": "const",
          "line": 96,
          "exported": true,
          "signature": "export const StepHistoryEntrySchema = zObject({ id: z.string(), title: z.string().nullish(), timestamp: z.number().nullish(), user_id: z.string().nullish(), custom_steps_separated: z.array(z.record(z.…"
        },
        {
          "name": "StepHistoryEntry",
          "kind": "type",
          "line": 104,
          "exported": true,
          "signature": "export type StepHistoryEntry = z.infer<typeof StepHistoryEntrySchema>"
        }
      ]
    },
    {
      "path": "src/schemas/suites.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "SuiteSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
        },
        {
          "name": "Suite",
          "kind": "type",
          "line": 18,
          "exported": true,
          "signature": "export type Suite = z.infer<typeof SuiteSchema>"
        },
        {
          "name": "AddSuitePayloadSchema",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
        },
        {
          "name": "AddSuitePayload",
          "kind": "type",
          "line": 27,
          "exported": true,
          "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>"
        },
        {
          "name": "UpdateSuitePayloadSchema",
          "kind": "const",
          "line": 29,
          "exported": true,
          "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSuitePayload",
          "kind": "type",
          "line": 34,
          "exported": true,
          "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/tests.ts",
      "imports": [
        "./common.js",
        "./metadata.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 38,
          "exported": true,
          "signature": "export type Test = z.infer<typeof TestSchema>"
        },
        {
          "name": "UpdateTestLabelsPayloadSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const UpdateTestLabelsPayloadSchema = zObject({ labels: z.array(z.union([z.number(), z.string()])), })"
        },
        {
          "name": "UpdateTestLabelsPayload",
          "kind": "type",
          "line": 54,
          "exported": true,
          "signature": "export type UpdateTestLabelsPayload = z.infer<typeof UpdateTestLabelsPayloadSchema>"
        },
        {
          "name": "UpdateTestsLabelsPayloadSchema",
          "kind": "const",
          "line": 61,
          "exported": true,
          "signature": "export const UpdateTestsLabelsPayloadSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(z.union([z.number(), z.string()])), })"
        },
        {
          "name": "UpdateTestsLabelsPayload",
          "kind": "type",
          "line": 66,
          "exported": true,
          "signature": "export type UpdateTestsLabelsPayload = z.infer<typeof UpdateTestsLabelsPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/users.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "UserSchema",
          "kind": "const",
          "line": 6,
          "exported": true,
          "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), email_notifications: z.boole…"
        },
        {
          "name": "User",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type User = z.infer<typeof UserSchema>"
        },
        {
          "name": "RoleSchema",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Role",
          "kind": "type",
          "line": 43,
          "exported": true,
          "signature": "export type Role = z.infer<typeof RoleSchema>"
        },
        {
          "name": "GroupSchema",
          "kind": "const",
          "line": 45,
          "exported": true,
          "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
        },
        {
          "name": "Group",
          "kind": "type",
          "line": 51,
          "exported": true,
          "signature": "export type Group = z.infer<typeof GroupSchema>"
        },
        {
          "name": "AddGroupPayloadSchema",
          "kind": "const",
          "line": 66,
          "exported": true,
          "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "AddGroupPayload",
          "kind": "type",
          "line": 71,
          "exported": true,
          "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>"
        },
        {
          "name": "UpdateGroupPayloadSchema",
          "kind": "const",
          "line": 73,
          "exported": true,
          "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "type",
          "line": 78,
          "exported": true,
          "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>"
        },
        {
          "name": "UserAddPayloadSchema",
          "kind": "const",
          "line": 97,
          "exported": true,
          "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…"
        },
        {
          "name": "UserAddPayload",
          "kind": "type",
          "line": 109,
          "exported": true,
          "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>"
        },
        {
          "name": "UserUpdatePayloadSchema",
          "kind": "const",
          "line": 111,
          "exported": true,
          "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
        },
        {
          "name": "UserUpdatePayload",
          "kind": "type",
          "line": 123,
          "exported": true,
          "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/variables.ts",
      "imports": [
        "./common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "VariableSchema",
          "kind": "const",
          "line": 19,
          "exported": true,
          "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
        },
        {
          "name": "Variable",
          "kind": "type",
          "line": 24,
          "exported": true,
          "signature": "export type Variable = z.infer<typeof VariableSchema>"
        },
        {
          "name": "AddVariablePayloadSchema",
          "kind": "const",
          "line": 26,
          "exported": true,
          "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddVariablePayload",
          "kind": "type",
          "line": 30,
          "exported": true,
          "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>"
        },
        {
          "name": "UpdateVariablePayloadSchema",
          "kind": "const",
          "line": 40,
          "exported": true,
          "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateVariablePayload",
          "kind": "type",
          "line": 44,
          "exported": true,
          "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>"
        }
      ]
    },
    {
      "path": "src/types.ts",
      "imports": [
        "./schemas.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestRailConfig",
          "kind": "interface",
          "line": 6,
          "exported": true,
          "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…"
        },
        {
          "name": "UploadFilePathInput",
          "kind": "interface",
          "line": 118,
          "exported": true,
          "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }"
        },
        {
          "name": "UploadFileInput",
          "kind": "type",
          "line": 136,
          "exported": true,
          "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput"
        },
        {
          "name": "Case",
          "kind": "interface",
          "line": 138,
          "exported": true,
          "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …"
        },
        {
          "name": "Suite",
          "kind": "interface",
          "line": 164,
          "exported": true,
          "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…"
        },
        {
          "name": "Section",
          "kind": "interface",
          "line": 179,
          "exported": true,
          "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }"
        },
        {
          "name": "Project",
          "kind": "interface",
          "line": 189,
          "exported": true,
          "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …"
        },
        {
          "name": "Plan",
          "kind": "interface",
          "line": 226,
          "exported": true,
          "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…"
        },
        {
          "name": "PlanEntry",
          "kind": "interface",
          "line": 261,
          "exported": true,
          "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…"
        },
        {
          "name": "Run",
          "kind": "interface",
          "line": 280,
          "exported": true,
          "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…"
        },
        {
          "name": "Test",
          "kind": "interface",
          "line": 325,
          "exported": true,
          "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number | null; run_id: number; title: string; template_id?: number | null; type_id?: number | null; priority_id?…"
        },
        {
          "name": "Result",
          "kind": "interface",
          "line": 347,
          "exported": true,
          "signature": "export interface Result { id: number; test_id: number; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto_id?: number | n…"
        },
        {
          "name": "Milestone",
          "kind": "interface",
          "line": 362,
          "exported": true,
          "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …"
        },
        {
          "name": "User",
          "kind": "interface",
          "line": 384,
          "exported": true,
          "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; email_notifications?: boolean | null; is_admin?: boolean | null; gro…"
        },
        {
          "name": "Status",
          "kind": "interface",
          "line": 408,
          "exported": true,
          "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }"
        },
        {
          "name": "Priority",
          "kind": "interface",
          "line": 420,
          "exported": true,
          "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }"
        },
        {
          "name": "CaseStatus",
          "kind": "interface",
          "line": 428,
          "exported": true,
          "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }"
        },
        {
          "name": "HistoryChange",
          "kind": "interface",
          "line": 437,
          "exported": true,
          "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; label?: string | null; options?: unknown[] | null; old_value?: stri…"
        },
        {
          "name": "HistoryEntry",
          "kind": "interface",
          "line": 453,
          "exported": true,
          "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }"
        },
        {
          "name": "SoftDeleteOptions",
          "kind": "interface",
          "line": 479,
          "exported": true,
          "signature": "export interface SoftDeleteOptions { soft?: boolean; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 488,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 525,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "interface",
          "line": 546,
          "exported": true,
          "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…"
        },
        {
          "name": "ResultField",
          "kind": "interface",
          "line": 560,
          "exported": true,
          "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "interface",
          "line": 582,
          "exported": true,
          "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…"
        },
        {
          "name": "CaseField",
          "kind": "interface",
          "line": 597,
          "exported": true,
          "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…"
        },
        {
          "name": "CaseType",
          "kind": "interface",
          "line": 617,
          "exported": true,
          "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Template",
          "kind": "interface",
          "line": 626,
          "exported": true,
          "signature": "export interface Template { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Configuration",
          "kind": "interface",
          "line": 635,
          "exported": true,
          "signature": "export interface Configuration { id: number; name: string; group_id: number; }"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "interface",
          "line": 642,
          "exported": true,
          "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 654,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 659,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 671,
          "exported": true,
          "signature": "export interface GetPlansOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number[]; limit?: number; offset?: number; created_after?: …"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 701,
          "exported": true,
          "signature": "export interface GetTestsOptions { statusId?: number[]; limit?: number; offset?: number; status_id?: number[]; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 716,
          "exported": true,
          "signature": "export interface GetResultsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; statusId?: number[]; defectsFilter?: string; limit?: number; offset?: number; created_after?: …"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 750,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { isCompleted?: boolean; limit?: number; offset?: number; is_completed?: 0 | 1; }"
        },
        {
          "name": "Role",
          "kind": "interface",
          "line": 764,
          "exported": true,
          "signature": "export interface Role { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Attachment",
          "kind": "interface",
          "line": 799,
          "exported": true,
          "signature": "export interface Attachment { attachment_id?: number | null; id?: number | string | null; name?: string | null; filename?: string | null; filetype?: string | null; size?: number | null; created_on?: n…"
        },
        {
          "name": "Report",
          "kind": "interface",
          "line": 879,
          "exported": true,
          "signature": "export interface Report { id: number; name: string; description?: string | null; notify_user?: boolean | null; notify_link?: boolean | null; notify_link_recipients?: string | null; notify_attachment?:…"
        },
        {
          "name": "ReportResult",
          "kind": "interface",
          "line": 910,
          "exported": true,
          "signature": "export interface ReportResult { report_url: string; report_html?: string | null; report_pdf?: string | null; user_report_url?: string | null; }"
        }
      ]
    },
    {
      "path": "src/url.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "buildEndpoint",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export function buildEndpoint(base: string, params: Record<string, string | number | undefined> = {}): string"
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
    },
    {
      "path": "src/validation.ts",
      "imports": [
        "./constants.js",
        "./errors.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ENTRY_ID_RE",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i"
        },
        {
          "name": "validateId",
          "kind": "function",
          "line": 18,
          "exported": true,
          "signature": "export function validateId(id: number, name: string): void"
        },
        {
          "name": "validateEntryId",
          "kind": "function",
          "line": 31,
          "exported": true,
          "signature": "export function validateEntryId(entryId: string): void"
        },
        {
          "name": "validateAttachmentId",
          "kind": "function",
          "line": 49,
          "exported": true,
          "signature": "export function validateAttachmentId(id: number | string): void"
        },
        {
          "name": "validatePaginationParams",
          "kind": "function",
          "line": 66,
          "exported": true,
          "signature": "export function validatePaginationParams(limit?: number, offset?: number): void"
        }
      ]
    }
  ]
}
```
