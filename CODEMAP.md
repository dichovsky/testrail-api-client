# CODEMAP

Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.

Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.

```json
{
  "schema": "codemap.v2",
  "repo": {
    "name": "@dichovsky/testrail-api-client",
    "version": "7.0.0"
  },
  "sourceHash": "595d272c953c56fe6d0fc1c833ff11f50ad5a6de9138785dcc3620258a1c8702",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCaseFieldConfigPayload",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 340,
      "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldConfigPayloadSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 326,
      "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.union([z.array(z.number().int().positive()), z.literal('')]), }), options: zObject({ …"
    },
    {
      "name": "AddCaseFieldPayload",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 353,
      "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldPayloadSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 342,
      "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), is_indexed: z.boolean…"
    },
    {
      "name": "AddCaseFieldResponse",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 220,
      "signature": "export type AddCaseFieldResponse = KnownResponse<typeof AddCaseFieldResponseSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldResponseSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 195,
      "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
    },
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 125,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 112,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddCasesBulkPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 153,
      "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasesBulkPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 151,
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
      "line": 62,
      "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 57,
      "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), variables: DatasetVariablesPayloadSchema.optional(), })"
    },
    {
      "name": "AddGroupPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 79,
      "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 74,
      "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })",
      "jsdoc": "Group write-payload schemas (TestRail 7.5+). Mirror the variable/shared-step/milestone payload-migration precedent: each schema is declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields TestRail may add to either endpoint."
    },
    {
      "name": "AddLabelPayload",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 65,
      "signature": "export type AddLabelPayload = z.infer<typeof AddLabelPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddLabelPayloadSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 61,
      "signature": "export const AddLabelPayloadSchema = zObject({ title: z.string(), })",
      "jsdoc": "`add_label/{project_id}` body — the new label title. TestRail caps the title at 20 characters; the limit is intentionally left to the server so the client does not duplicate a rule TestRail may change independently."
    },
    {
      "name": "AddMilestonePayload",
      "kind": "type",
      "file": "src/schemas/milestones.ts",
      "line": 59,
      "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 50,
      "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 161,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 135,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: …"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 198,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 185,
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
      "line": 122,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 111,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultForTestPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 145,
      "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForTestPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 134,
      "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 85,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 68,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **request** payload schemas."
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 128,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 124,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddResultsPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 151,
      "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 147,
      "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas/runs.ts",
      "line": 86,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 72,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 118,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 106,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), start_on: z.number().optional(), due_…"
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
      "kind": "type",
      "file": "src/types.ts",
      "line": 621,
      "signature": "export type Attachment = KnownResponse<typeof AttachmentSchema>",
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
      "name": "Bdd",
      "kind": "type",
      "file": "src/schemas/bdd.ts",
      "line": 14,
      "signature": "export type Bdd = z.infer<typeof BddSchema>",
      "typeOnly": true
    },
    {
      "name": "BddSchema",
      "kind": "const",
      "file": "src/schemas/bdd.ts",
      "line": 12,
      "signature": "export const BddSchema = z.record(z.string(), z.unknown())",
      "jsdoc": "One entry returned by TestRail 10.5+'s bulk `get_bdds` endpoint."
    },
    {
      "name": "Case",
      "kind": "type",
      "file": "src/types.ts",
      "line": 301,
      "signature": "export type Case = ResponseWithCustomFields<typeof CaseSchema>",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "type",
      "file": "src/types.ts",
      "line": 450,
      "signature": "export type CaseField = KnownResponse<typeof CaseFieldSchema>",
      "jsdoc": "Custom case field definition returned by get_case_fields.",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "type",
      "file": "src/types.ts",
      "line": 447,
      "signature": "export type CaseFieldConfig = KnownResponse<typeof CaseFieldConfigSchema>",
      "jsdoc": "Context/options configuration block shared by CaseField entries.",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 143,
      "signature": "export const CaseFieldConfigSchema = zObject({ id: z.string().nullish(), context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 154,
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
      "kind": "type",
      "file": "src/types.ts",
      "line": 330,
      "signature": "export type CaseStatus = KnownResponse<typeof CaseStatusSchema>",
      "typeOnly": true
    },
    {
      "name": "CaseStatusSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 83,
      "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string().nullish(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean().…"
    },
    {
      "name": "CaseTitle",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 53,
      "signature": "export type CaseTitle = KnownResponse<typeof CaseTitleSchema>",
      "typeOnly": true
    },
    {
      "name": "CaseTitleSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 48,
      "signature": "export const CaseTitleSchema = zObject({ id: z.number(), title: z.string(), })"
    },
    {
      "name": "CaseType",
      "kind": "type",
      "file": "src/types.ts",
      "line": 453,
      "signature": "export type CaseType = KnownResponse<typeof CaseTypeSchema>",
      "jsdoc": "Case type definition returned by get_case_types.",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 254,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), i18n_custom_id: z.string().nullish(), })"
    },
    {
      "name": "Configuration",
      "kind": "type",
      "file": "src/types.ts",
      "line": 463,
      "signature": "export type Configuration = KnownResponse<typeof ConfigurationSchema>",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group.",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "type",
      "file": "src/types.ts",
      "line": 466,
      "signature": "export type ConfigurationGroup = KnownResponse<typeof ConfigurationGroupSchema>",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\").",
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
      "line": 225,
      "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "CopyCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 221,
      "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
    },
    {
      "name": "CrossProjectReport",
      "kind": "type",
      "file": "src/types.ts",
      "line": 661,
      "signature": "export type CrossProjectReport = KnownResponse<typeof CrossProjectReportSchema>",
      "jsdoc": "Enterprise report template spanning multiple projects.",
      "typeOnly": true
    },
    {
      "name": "CrossProjectReportSchema",
      "kind": "const",
      "file": "src/schemas/reports.ts",
      "line": 49,
      "signature": "export const CrossProjectReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_ids: z.array(z.number()), user_ids: z.array(z.number()).nullish(), includ…",
      "jsdoc": "Enterprise cross-project report template returned by `get_cross_project_reports`."
    },
    {
      "name": "Dataset",
      "kind": "type",
      "file": "src/schemas/datasets.ts",
      "line": 48,
      "signature": "export type Dataset = KnownResponse<typeof DatasetSchema>",
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
      "signature": "export type DatasetVariable = KnownResponse<typeof DatasetVariableSchema>",
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
      "name": "DEFAULT_MAX_ITEMS",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 39,
      "signature": "export const DEFAULT_MAX_ITEMS = 25_000"
    },
    {
      "name": "DEFAULT_MAX_PAGES",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 38,
      "signature": "export const DEFAULT_MAX_PAGES = 100"
    },
    {
      "name": "DEFAULT_MAX_PAGINATION_BYTES",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 41,
      "signature": "export const DEFAULT_MAX_PAGINATION_BYTES = 100 * 1024 * 1024"
    },
    {
      "name": "DEFAULT_MAX_PAGINATION_DURATION_MS",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 40,
      "signature": "export const DEFAULT_MAX_PAGINATION_DURATION_MS = MAX_TIMEOUT_MS"
    },
    {
      "name": "DEFAULT_PAGE_SIZE",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 37,
      "signature": "export const DEFAULT_PAGE_SIZE = MAX_PAGINATION_LIMIT",
      "jsdoc": "Defaults and hard bounds for bounded multi-page aggregation."
    },
    {
      "name": "DeleteCasesPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 193,
      "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 185,
      "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
    },
    {
      "name": "DeleteLabelsPayload",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 87,
      "signature": "export type DeleteLabelsPayload = z.infer<typeof DeleteLabelsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteLabelsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 83,
      "signature": "export const DeleteLabelsPayloadSchema = zObject({ label_ids: z.array(z.number().int().positive()).min(1), })",
      "jsdoc": "`delete_labels` body — one or more positive label IDs."
    },
    {
      "name": "DeleteSharedStepOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 34,
      "signature": "export interface DeleteSharedStepOptions { keepInCases?: boolean; }",
      "typeOnly": true
    },
    {
      "name": "DynamicFilterField",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 290,
      "signature": "export type DynamicFilterField = KnownResponse<typeof DynamicFilterFieldSchema>",
      "typeOnly": true
    },
    {
      "name": "DynamicFilterFieldSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 282,
      "signature": "export const DynamicFilterFieldSchema = zObject({ type_id: z.number(), system_name: z.string(), label: z.string(), options: z.string().nullish(), sub_filters: z.string().nullish(), })",
      "jsdoc": "One field definition returned by `get_dynamic_filter_fields/{project_id}`. `options` and `sub_filters` are mutually endpoint-dependent and therefore nullish; `zObject` preserves any additional field metadata introduced by a future TestRail release."
    },
    {
      "name": "DynamicFiltersPayload",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 302,
      "signature": "export type DynamicFiltersPayload = z.infer<typeof DynamicFiltersPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DynamicFiltersPayloadSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 297,
      "signature": "export const DynamicFiltersPayloadSchema = zObject({ mode: z.string(), filters: z.record(z.string(), z.record(z.string(), z.unknown())), })",
      "jsdoc": "Forward-compatible object accepted by run and plan-entry `dynamic_filters` fields. TestRail requires top-level `mode` and `filters`; each field-specific criterion remains open because its shape varies by field type."
    },
    {
      "name": "EditResultPayload",
      "kind": "type",
      "file": "src/schemas/results.ts",
      "line": 106,
      "signature": "export type EditResultPayload = z.infer<typeof EditResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "EditResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 94,
      "signature": "export const EditResultPayloadSchema = zObject({ status_id: z.number().optional(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().o…",
      "jsdoc": "Partial payload accepted by `edit_result/{result_id}` (TestRail 10.4+). Every standard result field is optional because the endpoint changes only the fields supplied by the caller. Flat `custom_*` fields pass through via `zObject`; the built-in separated-step field is declared explicitly so its replacement-array contract is visible to TypeScript consumers."
    },
    {
      "name": "GetAllAttachmentsOptions",
      "kind": "type",
      "file": "src/modules/attachments.ts",
      "line": 21,
      "signature": "export type GetAllAttachmentsOptions = PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllBddsOptions",
      "kind": "interface",
      "file": "src/modules/bdd.ts",
      "line": 30,
      "signature": "export interface GetAllBddsOptions extends Omit<GetBddsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}",
      "typeOnly": true
    },
    {
      "name": "GetAllCasesOptions",
      "kind": "interface",
      "file": "src/modules/cases.ts",
      "line": 31,
      "signature": "export interface GetAllCasesOptions extends Omit<GetCasesOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}",
      "typeOnly": true
    },
    {
      "name": "GetAllCaseStatusesOptions",
      "kind": "type",
      "file": "src/modules/metadata.ts",
      "line": 22,
      "signature": "export type GetAllCaseStatusesOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllDatasetsOptions",
      "kind": "type",
      "file": "src/modules/datasets.ts",
      "line": 8,
      "signature": "export type GetAllDatasetsOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllGroupsOptions",
      "kind": "type",
      "file": "src/modules/users.ts",
      "line": 12,
      "signature": "export type GetAllGroupsOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllHistoryForCaseOptions",
      "kind": "type",
      "file": "src/modules/cases.ts",
      "line": 33,
      "signature": "export type GetAllHistoryForCaseOptions = PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllLabelsOptions",
      "kind": "type",
      "file": "src/modules/labels.ts",
      "line": 16,
      "signature": "export type GetAllLabelsOptions = PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllMilestonesOptions",
      "kind": "type",
      "file": "src/modules/milestones.ts",
      "line": 9,
      "signature": "export type GetAllMilestonesOptions = Omit<GetMilestonesOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllPlansOptions",
      "kind": "type",
      "file": "src/modules/plans.ts",
      "line": 19,
      "signature": "export type GetAllPlansOptions = Omit<GetPlansOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllProjectsOptions",
      "kind": "type",
      "file": "src/modules/projects.ts",
      "line": 19,
      "signature": "export type GetAllProjectsOptions = Omit<GetProjectsOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllResultsForRunOptions",
      "kind": "interface",
      "file": "src/modules/results.ts",
      "line": 14,
      "signature": "export interface GetAllResultsForRunOptions extends Omit<GetResultsForRunOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}",
      "typeOnly": true
    },
    {
      "name": "GetAllResultsOptions",
      "kind": "interface",
      "file": "src/modules/results.ts",
      "line": 12,
      "signature": "export interface GetAllResultsOptions extends Omit<GetResultsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}",
      "typeOnly": true
    },
    {
      "name": "GetAllRolesOptions",
      "kind": "type",
      "file": "src/modules/metadata.ts",
      "line": 23,
      "signature": "export type GetAllRolesOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllRunsOptions",
      "kind": "type",
      "file": "src/modules/runs.ts",
      "line": 11,
      "signature": "export type GetAllRunsOptions = Omit<GetRunsOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllSectionsOptions",
      "kind": "type",
      "file": "src/modules/sections.ts",
      "line": 16,
      "signature": "export type GetAllSectionsOptions = Omit<GetSectionsOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllSharedStepHistoryOptions",
      "kind": "type",
      "file": "src/modules/sharedSteps.ts",
      "line": 32,
      "signature": "export type GetAllSharedStepHistoryOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllSharedStepsOptions",
      "kind": "type",
      "file": "src/modules/sharedSteps.ts",
      "line": 31,
      "signature": "export type GetAllSharedStepsOptions = Omit<GetSharedStepsOptions, 'limit' | 'offset'> & PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllSuitesOptions",
      "kind": "type",
      "file": "src/modules/suites.ts",
      "line": 15,
      "signature": "export type GetAllSuitesOptions = PaginatedRequestOptions",
      "typeOnly": true
    },
    {
      "name": "GetAllTestsOptions",
      "kind": "interface",
      "file": "src/modules/tests.ts",
      "line": 17,
      "signature": "export interface GetAllTestsOptions extends Omit<GetTestsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}",
      "typeOnly": true
    },
    {
      "name": "GetAllVariablesOptions",
      "kind": "type",
      "file": "src/modules/variables.ts",
      "line": 8,
      "signature": "export type GetAllVariablesOptions = PaginationSafetyOptions",
      "typeOnly": true
    },
    {
      "name": "GetAttachmentsOptions",
      "kind": "interface",
      "file": "src/modules/attachments.ts",
      "line": 14,
      "signature": "export interface GetAttachmentsOptions { limit?: number; offset?: number; }",
      "jsdoc": "Optional pagination params. TestRail documents them for case-, run-, and plan-scoped attachment lists. The test-scoped method retains its historical support for these options even though current upstream docs omit them.",
      "typeOnly": true
    },
    {
      "name": "GetBddsOptions",
      "kind": "interface",
      "file": "src/modules/bdd.ts",
      "line": 11,
      "signature": "export interface GetBddsOptions { suiteId?: number; sectionId?: number; labelId?: number | readonly number[]; refs?: string | readonly string[]; limit?: number; offset?: number; }",
      "jsdoc": "Filters and pagination controls accepted by TestRail 10.5+'s `get_bdds`.",
      "typeOnly": true
    },
    {
      "name": "GetCasesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 360,
      "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number | readonly number[]; priorityId?: number | readonly number[]; templateId?: number | readonly number[]; mileston…",
      "jsdoc": "Filter options for `getCases()`. All date filters accept Unix timestamps (seconds since epoch).",
      "typeOnly": true
    },
    {
      "name": "GetHistoryForCaseOptions",
      "kind": "interface",
      "file": "src/modules/cases.ts",
      "line": 24,
      "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetLabelsOptions",
      "kind": "interface",
      "file": "src/modules/labels.ts",
      "line": 9,
      "signature": "export interface GetLabelsOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetMilestonesOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 575,
      "signature": "export interface GetMilestonesOptions { isCompleted?: boolean; isStarted?: boolean; limit?: number; offset?: number; is_completed?: 0 | 1; is_started?: 0 | 1; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 490,
      "signature": "export interface GetPlansOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number[]; refs?: string; limit?: number; offset?: number; c…",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetProjectsOptions",
      "kind": "interface",
      "file": "src/modules/projects.ts",
      "line": 9,
      "signature": "export interface GetProjectsOptions { isCompleted?: boolean; limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetProjectsPageOptions",
      "kind": "type",
      "file": "src/modules/projects.ts",
      "line": 17,
      "signature": "export type GetProjectsPageOptions = GetProjectsOptions",
      "jsdoc": "@deprecated Use .",
      "typeOnly": true
    },
    {
      "name": "GetResultsForRunOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 557,
      "signature": "export interface GetResultsForRunOptions extends GetResultsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; created_after?: number; created_before?: number; created_by?: …",
      "jsdoc": "Filter options for `getResultsForRun()`. Date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 538,
      "signature": "export interface GetResultsOptions { statusId?: number[]; defectsFilter?: string; limit?: number; offset?: number; status_id?: number[]; defects_filter?: string; }",
      "jsdoc": "Filter options shared by `getResults()` and `getResultsForCase()`.",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 411,
      "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; includePlanRuns?: boolean; isCompleted?: boolean; milestoneId?: number | readonly number[]; refs?…",
      "typeOnly": true
    },
    {
      "name": "GetSectionsOptions",
      "kind": "interface",
      "file": "src/modules/sections.ts",
      "line": 10,
      "signature": "export interface GetSectionsOptions { suiteId?: number; limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetSharedStepHistoryOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 26,
      "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetSharedStepsOptions",
      "kind": "interface",
      "file": "src/modules/sharedSteps.ts",
      "line": 9,
      "signature": "export interface GetSharedStepsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number | readonly number[]; updatedAfter?: number; updatedBefore?: number; refs?: string; limit?: nu…",
      "typeOnly": true
    },
    {
      "name": "GetSuitesOptions",
      "kind": "interface",
      "file": "src/modules/suites.ts",
      "line": 10,
      "signature": "export interface GetSuitesOptions { limit?: number; offset?: number; }",
      "typeOnly": true
    },
    {
      "name": "GetTestOptions",
      "kind": "interface",
      "file": "src/modules/tests.ts",
      "line": 19,
      "signature": "export interface GetTestOptions { withData?: '0' | '1'; }",
      "typeOnly": true
    },
    {
      "name": "GetTestsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 522,
      "signature": "export interface GetTestsOptions { statusId?: number[]; labelId?: number[]; limit?: number; offset?: number; status_id?: number[]; label_id?: number[]; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 59,
      "signature": "export type Group = KnownResponse<typeof GroupSchema>",
      "typeOnly": true
    },
    {
      "name": "GroupSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 53,
      "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
    },
    {
      "name": "handleZodError",
      "kind": "function",
      "file": "src/errors.ts",
      "line": 121,
      "signature": "export function handleZodError(error: ZodError): TestRailValidationError",
      "jsdoc": "Utility to convert ZodError into TestRailValidationError."
    },
    {
      "name": "HistoryChange",
      "kind": "type",
      "file": "src/types.ts",
      "line": 332,
      "signature": "export type HistoryChange = KnownResponse<typeof HistoryChangeSchema>",
      "typeOnly": true
    },
    {
      "name": "HistoryChangeSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 59,
      "signature": "export const HistoryChangeSchema = zObject({ field: z.string().nullish(), type_id: z.number().nullish(), old_text: z.string().nullish(), new_text: z.string().nullish(), label: z.string().nullish(), op…"
    },
    {
      "name": "HistoryEntry",
      "kind": "type",
      "file": "src/types.ts",
      "line": 334,
      "signature": "export type HistoryEntry = KnownResponse<typeof HistoryEntrySchema>",
      "typeOnly": true
    },
    {
      "name": "HistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 94,
      "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
    },
    {
      "name": "Label",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 39,
      "signature": "export type Label = KnownResponse<typeof LabelSchema>",
      "typeOnly": true
    },
    {
      "name": "LabelEmbedded",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 46,
      "signature": "export type LabelEmbedded = KnownResponse<typeof LabelEmbeddedSchema>",
      "typeOnly": true
    },
    {
      "name": "LabelEmbeddedSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 31,
      "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.union([z.number(), z.string()]).nullish(), created_on: z.number().nu…",
      "jsdoc": "Shape of a Label object as embedded inside a parent resource response — notably `get_case` (SPEC #2.1.3) and `get_test` (SPEC #2.1.7). The two endpoints emit the same logical shape but the wider TestRail Labels API has historically diverged on naming (`title` on embedded forms vs `name` on the stand-alone `get_label`), so the inner schema accepts both."
    },
    {
      "name": "LabelSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 27,
      "signature": "export const LabelSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.union([z.number(), z.string()]).nullish(), created_on: z.number().nullish(),…",
      "jsdoc": "`LabelSchema` — the canonical stand-alone label entity returned by the Labels API (`get_label`, `get_labels`, `add_label`, `update_label`). Distinct from `LabelEmbeddedSchema` (the label shape nested inside `get_case` / `get_test` responses): the two are structurally near-identical today but are kept separate on purpose, because the stand-alone endpoint may diverge independently of the embedded form (schema-conventions §1 — `XSchema` is the canonical GET entity; §4 — keep sub-schemas separate)."
    },
    {
      "name": "LabelWriteResponseSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 51,
      "signature": "export const LabelWriteResponseSchema = z.union([ LabelSchema, zObject({ label: LabelSchema }).transform((response) => response.label), ])",
      "jsdoc": "Label mutations have shipped with both a flat label response and a `{ label: ... }` wrapper. The official TestRail CLI handles both forms for `add_label` and `update_label` (gurock/trcli commit e723052, `cmd_labels.py` lines 53–55 and 90–92): - https://github.com/gurock/trcli/blob/e723052d0898da6a501972c6855eddf487cd51bb/trcli/commands/cmd_labels.py#L53-L55 - https://github.com/gurock/trcli/blob/e723052d0898da6a501972c6855eddf487cd51bb/trcli/commands/cmd_labels.py#L90-L92 Normalize either official-client shape to the same flat entity returned by the public SDK methods."
    },
    {
      "name": "MAX_PAGINATION_BYTES",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 42,
      "signature": "export const MAX_PAGINATION_BYTES = 1024 * 1024 * 1024"
    },
    {
      "name": "MAX_PAGINATION_LIMIT",
      "kind": "const",
      "file": "src/constants.ts",
      "line": 34,
      "signature": "export const MAX_PAGINATION_LIMIT = 250",
      "jsdoc": "Maximum page size accepted by TestRail's paginated/bulk API endpoints."
    },
    {
      "name": "Milestone",
      "kind": "type",
      "file": "src/types.ts",
      "line": 322,
      "signature": "export type Milestone = KnownResponse<typeof MilestoneSchema>",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 41,
      "signature": "export const MilestoneSchema = zObject({ ...MilestoneBaseSchema.shape, milestones: z.array(MilestoneNodeSchema).nullish(), })"
    },
    {
      "name": "MoveCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 238,
      "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 233,
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
      "name": "Page",
      "kind": "type",
      "file": "src/pagination.ts",
      "line": 19,
      "signature": "export type Page<T> = | { kind: 'envelope'; items: T[]; offset: number; limit: number; size: number; _links: PageLinks; } | { kind: 'legacy-array'; items: T[]; size: number; }",
      "jsdoc": "A normalized TestRail list response without invented legacy metadata.",
      "typeOnly": true
    },
    {
      "name": "PageLinks",
      "kind": "interface",
      "file": "src/pagination.ts",
      "line": 13,
      "signature": "export interface PageLinks { next: string | null; prev: string | null; }",
      "typeOnly": true
    },
    {
      "name": "PaginatedRequestOptions",
      "kind": "interface",
      "file": "src/pagination.ts",
      "line": 46,
      "signature": "export interface PaginatedRequestOptions extends PaginationSafetyOptions { pageSize?: number; startOffset?: number; }",
      "jsdoc": "Request controls exposed only by endpoints with documented limit/offset input.",
      "typeOnly": true
    },
    {
      "name": "PaginationErrorReason",
      "kind": "type",
      "file": "src/pagination.ts",
      "line": 34,
      "signature": "export type PaginationErrorReason = 'max_pages' | 'max_items' | 'max_duration' | 'max_bytes' | 'invalid_page' | 'invalid_continuation' | 'non_progress'",
      "typeOnly": true
    },
    {
      "name": "PaginationRequestSchema",
      "kind": "const",
      "file": "src/schemas/common.ts",
      "line": 69,
      "signature": "export const PaginationRequestSchema = zObject({ limit: z.number().int().positive().max(MAX_PAGINATION_LIMIT).optional(), offset: z.number().int().nonnegative().optional(), })",
      "jsdoc": "Caller-supplied controls for one TestRail list request."
    },
    {
      "name": "PaginationSafetyOptions",
      "kind": "interface",
      "file": "src/pagination.ts",
      "line": 38,
      "signature": "export interface PaginationSafetyOptions { maxPages?: number; maxItems?: number; maxDurationMs?: number; maxBytes?: number; }",
      "jsdoc": "Bounds shared by all get-all methods, including envelope-only endpoints.",
      "typeOnly": true
    },
    {
      "name": "PaginationSchema",
      "kind": "const",
      "file": "src/schemas/common.ts",
      "line": 80,
      "signature": "export const PaginationSchema = zObject({ limit: z.number().optional(), offset: z.number().optional(), })",
      "jsdoc": "Legacy permissive pagination schema retained for runtime compatibility. New request-boundary code should use , which enforces the same integer/range contract as the client methods. @deprecated Use for request validation."
    },
    {
      "name": "Plan",
      "kind": "type",
      "file": "src/types.ts",
      "line": 312,
      "signature": "export type Plan = KnownResponse<typeof PlanSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "type",
      "file": "src/types.ts",
      "line": 314,
      "signature": "export type PlanEntry = KnownResponse<typeof PlanEntrySchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 99,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 89,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 8,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 37,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
    },
    {
      "name": "Priority",
      "kind": "type",
      "file": "src/types.ts",
      "line": 328,
      "signature": "export type Priority = KnownResponse<typeof PrioritySchema>",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 68,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "type",
      "file": "src/types.ts",
      "line": 310,
      "signature": "export type Project = KnownResponse<typeof ProjectSchema>",
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
      "line": 478,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "type",
      "file": "src/types.ts",
      "line": 658,
      "signature": "export type Report = KnownResponse<typeof ReportSchema>",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "type",
      "file": "src/types.ts",
      "line": 671,
      "signature": "export type ReportResult = KnownResponse<typeof ReportResultSchema>",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas/reports.ts",
      "line": 87,
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
      "kind": "type",
      "file": "src/types.ts",
      "line": 320,
      "signature": "export type Result = ResponseWithCustomFields<typeof ResultSchema>",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "type",
      "file": "src/types.ts",
      "line": 442,
      "signature": "export type ResultField = KnownResponse<typeof ResultFieldSchema>",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "type",
      "file": "src/types.ts",
      "line": 440,
      "signature": "export type ResultFieldConfig = KnownResponse<typeof ResultFieldConfigSchema>",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 222,
      "signature": "export const ResultFieldConfigSchema = zObject({ id: z.string().nullish(), context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 232,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas/results.ts",
      "line": 13,
      "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number().nullable(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish()…",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **response** schemas."
    },
    {
      "name": "Role",
      "kind": "type",
      "file": "src/types.ts",
      "line": 593,
      "signature": "export type Role = KnownResponse<typeof RoleSchema>",
      "jsdoc": "A user role returned by GET /get_roles (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "RoleSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 42,
      "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), is_project_admin: z.boolean().nullish(), })"
    },
    {
      "name": "Run",
      "kind": "type",
      "file": "src/types.ts",
      "line": 316,
      "signature": "export type Run = KnownResponse<typeof RunSchema>",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 7,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
    },
    {
      "name": "SchemaMismatch",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 65,
      "signature": "export interface SchemaMismatch { method: string; endpoint: string; error: ZodError; data: unknown; }",
      "jsdoc": "Detail passed to when a response does not conform to its Zod schema.",
      "typeOnly": true
    },
    {
      "name": "Section",
      "kind": "type",
      "file": "src/types.ts",
      "line": 308,
      "signature": "export type Section = KnownResponse<typeof SectionSchema>",
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
      "signature": "export type SharedStep = KnownResponse<typeof SharedStepSchema>",
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
      "line": 351,
      "signature": "export interface SoftDeleteOptions { soft?: boolean; }",
      "jsdoc": "Options for delete endpoints that support TestRail's `soft=1` server-side preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`, `delete_suite`). `delete_milestone` and `delete_project` do not accept `soft`; passing this option to those endpoints would be a no-op server-side, so the CLI rejects it instead to keep destructive intent unambiguous.",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreview",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 216,
      "signature": "export type SoftDeletePreview = KnownResponse<typeof SoftDeletePreviewSchema>",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreviewSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 206,
      "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().nullish(), affected_cases: z.number().nullish(), affected_sections: z.number().nullish(), affected_runs: z.number().nullish(…"
    },
    {
      "name": "Status",
      "kind": "type",
      "file": "src/types.ts",
      "line": 326,
      "signature": "export type Status = KnownResponse<typeof StatusSchema>",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 50,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "StepHistoryEntry",
      "kind": "type",
      "file": "src/schemas/sharedSteps.ts",
      "line": 105,
      "signature": "export type StepHistoryEntry = KnownResponse<typeof StepHistoryEntrySchema>",
      "typeOnly": true
    },
    {
      "name": "StepHistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas/sharedSteps.ts",
      "line": 97,
      "signature": "export const StepHistoryEntrySchema = zObject({ id: z.union([z.number(), z.string()]), title: z.string().nullish(), timestamp: z.number().nullish(), user_id: z.union([z.number(), z.string()]).nullish(…",
      "jsdoc": "SPEC #1.7 — `get_shared_step_history/{shared_step_id}` returns entries under `step_history` (NOT `history`). Live-instance audit correction: TestRail Cloud returns `id` and `user_id` as INTEGERS (e.g. 23, 40), but the doc field table says string — a bare `z.string()` on `id` rejected the real response. Accept BOTH forms (a union, like `AttachmentSchema.data_id` / `entity_id` and `UserSchema.mfa_required`) so neither Cloud's integers nor a doc-compliant self-hosted server's strings throw. Every other field is `.nullish()`-widened."
    },
    {
      "name": "Suite",
      "kind": "type",
      "file": "src/types.ts",
      "line": 303,
      "signature": "export type Suite = KnownResponse<typeof SuiteSchema>",
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
      "kind": "type",
      "file": "src/types.ts",
      "line": 458,
      "signature": "export type Template = KnownResponse<typeof TemplateSchema>",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+).",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 264,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), i18n_custom_id: z.string().nullish(), })"
    },
    {
      "name": "Test",
      "kind": "type",
      "file": "src/types.ts",
      "line": 318,
      "signature": "export type Test = ResponseWithCustomFields<typeof TestSchema>",
      "typeOnly": true
    },
    {
      "name": "TestRailApiError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 11,
      "signature": "export class TestRailApiError extends Error",
      "jsdoc": "Thrown when communication with TestRail fails or a successful response cannot be used safely. This includes non-2xx responses, network/body-processing failures, and unrecognized outer response structures. The optional `response` retains the raw server value for programmatic inspection; callers should not expose it in logs because it can contain instance data."
    },
    {
      "name": "TestRailClient",
      "kind": "class",
      "file": "src/client.ts",
      "line": 87,
      "signature": "export class TestRailClient extends TestRailClientCore",
      "jsdoc": "TestRail API Client"
    },
    {
      "name": "TestRailConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 102,
      "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…",
      "jsdoc": "TestRail API client configuration options",
      "typeOnly": true
    },
    {
      "name": "TestRailConfigSchema",
      "kind": "const",
      "file": "src/schemas/common.ts",
      "line": 135,
      "signature": "export const TestRailConfigSchema = zObject(testRailConfigShape)"
    },
    {
      "name": "TestRailLicenseError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 30,
      "signature": "export class TestRailLicenseError extends TestRailApiError",
      "jsdoc": "Thrown when TestRail rejects a request because the instance lacks the required Enterprise license/subscription (HTTP 403 with a \"Not an Enterprise license/subscription.\" body — live-audit findings B.22/B.33). A subclass of , so existing `catch (TestRailApiError)` handlers still catch it; callers that want to branch on license gating specifically can use `instanceof TestRailLicenseError`."
    },
    {
      "name": "TestRailPaginationError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 105,
      "signature": "export class TestRailPaginationError extends TestRailValidationError",
      "jsdoc": "Thrown when a bounded multi-page read cannot complete safely. HTTP and network failures remain ; this subtype represents client-side page structure, continuation, and aggregation-policy failures."
    },
    {
      "name": "TestRailValidationError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 90,
      "signature": "export class TestRailValidationError extends Error",
      "jsdoc": "Thrown when client configuration or method parameters fail validation."
    },
    {
      "name": "TestRailVersion",
      "kind": "type",
      "file": "src/schemas/metadata.ts",
      "line": 309,
      "signature": "export type TestRailVersion = KnownResponse<typeof TestRailVersionSchema>",
      "typeOnly": true
    },
    {
      "name": "TestRailVersionSchema",
      "kind": "const",
      "file": "src/schemas/metadata.ts",
      "line": 305,
      "signature": "export const TestRailVersionSchema = zObject({ version: z.string(), })",
      "jsdoc": "Response from the authenticated `get_version` endpoint (TestRail 10.6+)."
    },
    {
      "name": "TestSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 9,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
    },
    {
      "name": "TestWithData",
      "kind": "type",
      "file": "src/types.ts",
      "line": 624,
      "signature": "export type TestWithData = Test & { results: Result[]; attachments: Attachment[]; }",
      "jsdoc": "Test enriched by `get_test` with `with_data=1`.",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 141,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 127,
      "signature": "export const UpdateCasePayloadSchema = zObject({ section_id: z.number().optional(), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.num…"
    },
    {
      "name": "UpdateCasesPayload",
      "kind": "type",
      "file": "src/schemas/cases.ts",
      "line": 176,
      "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas/cases.ts",
      "line": 161,
      "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), section_id: z.number().optional(), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number(…"
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
      "line": 75,
      "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas/datasets.ts",
      "line": 70,
      "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), variables: DatasetVariablesPayloadSchema.optional(), })",
      "jsdoc": "`update_dataset` accepts a partial body: callers may rename the dataset, replace its variable-value map, or do both. Empty `{}` is intentionally allowed and forwarded to TestRail, which treats it as a no-op. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 86,
      "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 81,
      "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
    },
    {
      "name": "UpdateLabelPayload",
      "kind": "type",
      "file": "src/schemas/labels.ts",
      "line": 80,
      "signature": "export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateLabelPayloadSchema",
      "kind": "const",
      "file": "src/schemas/labels.ts",
      "line": 75,
      "signature": "export const UpdateLabelPayloadSchema = zObject({ project_id: z.number().int().positive(), title: z.string(), })",
      "jsdoc": "`update_label/{label_id}` body — the owning project and new label title. TestRail caps the title at 20 characters; the limit is intentionally NOT enforced client-side (the \"let TestRail be the source of truth\" precedent — we surface the server's 400 rather than duplicating the rule). `custom_*` / forward-compat extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "type",
      "file": "src/schemas/milestones.ts",
      "line": 72,
      "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas/milestones.ts",
      "line": 61,
      "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 183,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 165,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_i…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 212,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 200,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number…"
    },
    {
      "name": "UpdateProjectGroupAssignmentPayload",
      "kind": "type",
      "file": "src/schemas/projects.ts",
      "line": 78,
      "signature": "export type UpdateProjectGroupAssignmentPayload = z.infer<typeof UpdateProjectGroupAssignmentPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectGroupAssignmentPayloadSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 73,
      "signature": "export const UpdateProjectGroupAssignmentPayloadSchema = zObject({ id: z.number().int().positive(), role_id: ProjectAccessRoleIdPayloadSchema, })"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "type",
      "file": "src/schemas/projects.ts",
      "line": 109,
      "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 99,
      "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), defa…"
    },
    {
      "name": "UpdateProjectUserAssignmentPayload",
      "kind": "type",
      "file": "src/schemas/projects.ts",
      "line": 97,
      "signature": "export type UpdateProjectUserAssignmentPayload = z.infer<typeof UpdateProjectUserAssignmentPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectUserAssignmentPayloadSchema",
      "kind": "const",
      "file": "src/schemas/projects.ts",
      "line": 84,
      "signature": "export const UpdateProjectUserAssignmentPayloadSchema = z.union([ zObject({ id: z.number().int().positive(), user_id: z.never().optional(), role_id: ProjectAccessRoleIdPayloadSchema, }), zObject({ id:…"
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas/plans.ts",
      "line": 133,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas/plans.ts",
      "line": 122,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(), inc…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas/runs.ts",
      "line": 101,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas/runs.ts",
      "line": 88,
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
      "line": 78,
      "signature": "export type UpdateTestLabelsPayload = z.infer<typeof UpdateTestLabelsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateTestLabelsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 74,
      "signature": "export const UpdateTestLabelsPayloadSchema = zObject({ labels: z.array(z.union([z.number(), z.string()])), })"
    },
    {
      "name": "UpdateTestsLabelsPayload",
      "kind": "type",
      "file": "src/schemas/tests.ts",
      "line": 90,
      "signature": "export type UpdateTestsLabelsPayload = z.infer<typeof UpdateTestsLabelsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateTestsLabelsPayloadSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 85,
      "signature": "export const UpdateTestsLabelsPayloadSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(z.union([z.number(), z.string()])), })"
    },
    {
      "name": "UpdateTestsResponse",
      "kind": "type",
      "file": "src/schemas/tests.ts",
      "line": 109,
      "signature": "export type UpdateTestsResponse = KnownResponse<typeof UpdateTestsResponseSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateTestsResponseSchema",
      "kind": "const",
      "file": "src/schemas/tests.ts",
      "line": 104,
      "signature": "export const UpdateTestsResponseSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(LabelEmbeddedSchema), })",
      "jsdoc": "`update_tests` acknowledges the bulk label assignment; it does **not** return the updated tests. TestRail's documented example is `{ \"test_ids\": [1, 2, 3], \"labels\": [{ \"id\": 1, \"title\": \"label1\" }] }` — the page's boilerplate status line (\"the tests are returned as part of the response\") is copy-pasted across every endpoint and contradicts the example beneath it."
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
      "line": 299,
      "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput",
      "typeOnly": true
    },
    {
      "name": "UploadFilePathInput",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 281,
      "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "type",
      "file": "src/types.ts",
      "line": 324,
      "signature": "export type User = KnownResponse<typeof UserSchema>",
      "typeOnly": true
    },
    {
      "name": "UserAddPayload",
      "kind": "type",
      "file": "src/schemas/users.ts",
      "line": 115,
      "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserAddPayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 102,
      "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), is_active: z.boolean().optional(), is_admin: z.boolean().optional(), role_id: z.number().int().positiv…",
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
      "line": 130,
      "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserUpdatePayloadSchema",
      "kind": "const",
      "file": "src/schemas/users.ts",
      "line": 117,
      "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), is_active: z.boolean().optional(), is_admin: z.boolean().optional(), role_id:…"
    },
    {
      "name": "Variable",
      "kind": "type",
      "file": "src/schemas/variables.ts",
      "line": 24,
      "signature": "export type Variable = KnownResponse<typeof VariableSchema>",
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
          "name": "cancelReaderBestEffort",
          "kind": "function",
          "line": 20,
          "exported": false,
          "signature": "function cancelReaderBestEffort(reader: globalThis.ReadableStreamDefaultReader<Uint8Array>, reason: Error): void"
        },
        {
          "name": "bodyTimeoutError",
          "kind": "function",
          "line": 31,
          "exported": false,
          "signature": "function bodyTimeoutError(deadlineMs: number): TestRailApiError"
        },
        {
          "name": "readBodyWithLimits",
          "kind": "function",
          "line": 57,
          "exported": true,
          "signature": "export async function readBodyWithLimits(response: Response, limits: BodyLimits): Promise<Uint8Array>"
        },
        {
          "name": "readBodyAsText",
          "kind": "function",
          "line": 206,
          "exported": true,
          "signature": "export async function readBodyAsText(response: Response, limits: BodyLimits): Promise<string>"
        },
        {
          "name": "failIfFallbackDeadlineReached",
          "kind": "function",
          "line": 219,
          "exported": false,
          "signature": "function failIfFallbackDeadlineReached(deadlineAt: number | undefined, deadlineMs: number): void"
        },
        {
          "name": "awaitFallbackBody",
          "kind": "function",
          "line": 225,
          "exported": false,
          "signature": "async function awaitFallbackBody<T>( promise: Promise<T>, deadlineAt: number | undefined, deadlineMs: number, ): Promise<T>"
        },
        {
          "name": "readBodyViaFallback",
          "kind": "function",
          "line": 250,
          "exported": false,
          "signature": "async function readBodyViaFallback(response: Response, maxBytes: number, deadlineMs: number): Promise<Uint8Array>"
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
      "path": "src/cli/action-invocation.ts",
      "imports": [
        "./flags.js",
        "./metadata/types.js",
        "./pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ActionInvocation",
          "kind": "interface",
          "line": 15,
          "exported": true,
          "signature": "export interface ActionInvocation { readonly spec: ActionSpec; readonly args: CliHandlerArgs; readonly pagination: CliPaginationParsed; }"
        },
        {
          "name": "ActionInvocationResult",
          "kind": "type",
          "line": 21,
          "exported": true,
          "signature": "export type ActionInvocationResult = { readonly ok: true; readonly invocation: ActionInvocation } | { readonly ok: false; readonly error: string }"
        },
        {
          "name": "MetaCommandName",
          "kind": "type",
          "line": 24,
          "exported": true,
          "signature": "export type MetaCommandName = 'install-skill' | 'uninstall-skill'"
        },
        {
          "name": "META_COMMAND_FLAGS",
          "kind": "const",
          "line": 26,
          "exported": false,
          "signature": "const META_COMMAND_FLAGS = { 'install-skill': ['global', 'force', 'print-path', 'quiet'], 'uninstall-skill': ['global', 'quiet'], } as const satisfies Readonly<Record<MetaCommandName, readonly CliFlag…"
        },
        {
          "name": "getAllowedActionFlags",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export function getAllowedActionFlags(spec: ActionSpec): ReadonlySet<CliFlagName>"
        },
        {
          "name": "validateMetaCommandFlags",
          "kind": "function",
          "line": 59,
          "exported": true,
          "signature": "export function validateMetaCommandFlags( command: MetaCommandName, suppliedFlags: readonly string[], ): { readonly ok: true } | { readonly ok: false; readonly error: string }"
        },
        {
          "name": "hasRequiredFlagValue",
          "kind": "function",
          "line": 73,
          "exported": false,
          "signature": "function hasRequiredFlagValue(values: Readonly<Record<string, unknown>>, name: CliFlagName): boolean"
        },
        {
          "name": "resolveActionInvocation",
          "kind": "function",
          "line": 82,
          "exported": true,
          "signature": "export function resolveActionInvocation(options: { readonly spec: ActionSpec; readonly values: Readonly<Record<string, unknown>>; readonly suppliedFlags: readonly string[]; readonly pathParams: readon…"
        }
      ]
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
          "name": "ACTION_SPECS",
          "kind": "const",
          "line": 17,
          "exported": false,
          "signature": "const ACTION_SPECS: Record<string, ActionSpec> = Object.fromEntries( ACTIONS.map((spec) => [`${spec.resource}:${spec.action}`, spec]),\n)"
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
          "signature": "export type DispatchResult = { ok: true; spec: ActionSpec; handler: Handler } | { ok: false; error: string }"
        },
        {
          "name": "getRegisteredActions",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export function getRegisteredActions(): readonly string[]"
        },
        {
          "name": "DESTRUCTIVE_ENV_VAR",
          "kind": "const",
          "line": 51,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_VAR = 'TESTRAIL_ALLOW_DESTRUCTIVE'"
        },
        {
          "name": "DESTRUCTIVE_ENV_ALLOW_VALUE",
          "kind": "const",
          "line": 57,
          "exported": true,
          "signature": "export const DESTRUCTIVE_ENV_ALLOW_VALUE = '1'"
        },
        {
          "name": "EnvGateResult",
          "kind": "type",
          "line": 59,
          "exported": true,
          "signature": "export type EnvGateResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkDestructiveEnvGate",
          "kind": "function",
          "line": 83,
          "exported": true,
          "signature": "export function checkDestructiveEnvGate( spec: ActionSpec | undefined, env: Readonly<Record<string, string | undefined>>, dryRun: boolean, ): EnvGateResult"
        },
        {
          "name": "PathParamCountResult",
          "kind": "type",
          "line": 108,
          "exported": true,
          "signature": "export type PathParamCountResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkPathParamCount",
          "kind": "function",
          "line": 119,
          "exported": true,
          "signature": "export function checkPathParamCount(spec: ActionSpec | undefined, pathParams: readonly string[]): PathParamCountResult"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 148,
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
      "path": "src/cli/filters.ts",
      "imports": [
        "./ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "parseOptionalId",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export function parseOptionalId(raw: string | undefined, name: string): number | undefined"
        },
        {
          "name": "parseOptionalIdList",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export function parseOptionalIdList(raw: string | undefined, name: string): number[] | undefined"
        },
        {
          "name": "parseOptionalBoolean",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export function parseOptionalBoolean(raw: string | undefined, name: string): boolean | undefined"
        },
        {
          "name": "parseOptionalRefs",
          "kind": "function",
          "line": 26,
          "exported": true,
          "signature": "export function parseOptionalRefs(raw: string | undefined, name = '--refs'): string | readonly string[] | undefined"
        },
        {
          "name": "parseOptionalSingleRef",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export function parseOptionalSingleRef(raw: string | undefined, name = '--refs'): string | undefined"
        }
      ]
    },
    {
      "path": "src/cli/flags.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "ActionCapability",
          "kind": "type",
          "line": 9,
          "exported": true,
          "signature": "export type ActionCapability = 'body' | 'destructive' | 'file-input' | 'file-output' | 'pagination' | 'pagination-request' | 'write'"
        },
        {
          "name": "CliFlagBase",
          "kind": "interface",
          "line": 12,
          "exported": false,
          "signature": "interface CliFlagBase { readonly scope: 'global' | 'action' | 'meta' | 'action-meta'; readonly capability?: ActionCapability; readonly handlerKey?: string; readonly paginationKey?: string; readonly va…"
        },
        {
          "name": "CliFlagDefinition",
          "kind": "type",
          "line": 20,
          "exported": false,
          "signature": "type CliFlagDefinition = CliFlagBase & ({ readonly type: 'string'; readonly default?: string } | { readonly type: 'boolean'; readonly default?: boolean })"
        },
        {
          "name": "defineFlagCatalog",
          "kind": "function",
          "line": 23,
          "exported": false,
          "signature": "function defineFlagCatalog<const Catalog extends Readonly<Record<string, CliFlagDefinition>>>( catalog: Catalog, ): Catalog"
        },
        {
          "name": "FLAG_CATALOG",
          "kind": "const",
          "line": 35,
          "exported": true,
          "signature": "export const FLAG_CATALOG = defineFlagCatalog({ 'base-url': { type: 'string', scope: 'global' }, email: { type: 'string', scope: 'global', valueName: 'email' }, 'user-email': { type: 'string', scope: …"
        },
        {
          "name": "CliFlagName",
          "kind": "type",
          "line": 159,
          "exported": true,
          "signature": "export type CliFlagName = keyof typeof FLAG_CATALOG"
        },
        {
          "name": "ActionFlagName",
          "kind": "type",
          "line": 161,
          "exported": true,
          "signature": "export type ActionFlagName = { [Name in CliFlagName]: (typeof FLAG_CATALOG)[Name]['scope'] extends 'action' | 'action-meta' ? Name : never; }[CliFlagName]"
        },
        {
          "name": "ActionSpecFlagName",
          "kind": "type",
          "line": 165,
          "exported": true,
          "signature": "export type ActionSpecFlagName = ActionFlagName"
        },
        {
          "name": "HandlerFlagArgs",
          "kind": "type",
          "line": 167,
          "exported": false,
          "signature": "type HandlerFlagArgs = { [ Name in CliFlagName as (typeof FLAG_CATALOG)[Name] extends { readonly handlerKey: infer Key extends string; } ? Key : never ]?: (typeof FLAG_CATALOG)[Name]['type'] extends '…"
        },
        {
          "name": "CliHandlerArgs",
          "kind": "type",
          "line": 177,
          "exported": true,
          "signature": "export type CliHandlerArgs = HandlerFlagArgs & { readonly pathParams: readonly string[] }"
        },
        {
          "name": "RawCliPaginationArgs",
          "kind": "type",
          "line": 179,
          "exported": true,
          "signature": "export type RawCliPaginationArgs = { readonly [ Name in CliFlagName as (typeof FLAG_CATALOG)[Name] extends { readonly paginationKey: infer Key extends string; } ? Key : never ]?: unknown; }"
        },
        {
          "name": "CliParseOption",
          "kind": "interface",
          "line": 189,
          "exported": false,
          "signature": "interface CliParseOption { readonly type: 'string' | 'boolean'; readonly default?: string | boolean; }"
        },
        {
          "name": "buildCliOptions",
          "kind": "function",
          "line": 194,
          "exported": false,
          "signature": "function buildCliOptions(): Readonly<Record<CliFlagName, CliParseOption>>"
        },
        {
          "name": "CLI_OPTIONS",
          "kind": "const",
          "line": 206,
          "exported": true,
          "signature": "export const CLI_OPTIONS = buildCliOptions()"
        },
        {
          "name": "CliOptionName",
          "kind": "type",
          "line": 208,
          "exported": true,
          "signature": "export type CliOptionName = CliFlagName"
        },
        {
          "name": "CliOptionDocumentationEntry",
          "kind": "interface",
          "line": 210,
          "exported": true,
          "signature": "export interface CliOptionDocumentationEntry { readonly value?: string; readonly scope: string; readonly description: string; }"
        },
        {
          "name": "CLI_OPTION_DOCUMENTATION",
          "kind": "const",
          "line": 220,
          "exported": true,
          "signature": "export const CLI_OPTION_DOCUMENTATION: Readonly<Record<CliOptionName, CliOptionDocumentationEntry>> = { 'base-url': { value: '<url>', scope: 'All API commands', description: 'TestRail base URL; overri…"
        },
        {
          "name": "KNOWN_FLAGS",
          "kind": "const",
          "line": 451,
          "exported": true,
          "signature": "export const KNOWN_FLAGS: ReadonlySet<string> = new Set(Object.keys(FLAG_CATALOG))"
        },
        {
          "name": "isCliFlagName",
          "kind": "function",
          "line": 453,
          "exported": true,
          "signature": "export function isCliFlagName(value: string): value is CliFlagName"
        },
        {
          "name": "CliFlagTypeValidationResult",
          "kind": "type",
          "line": 457,
          "exported": true,
          "signature": "export type CliFlagTypeValidationResult = { readonly ok: true } | { readonly ok: false; readonly error: string }"
        },
        {
          "name": "validateSuppliedFlagTypes",
          "kind": "function",
          "line": 460,
          "exported": true,
          "signature": "export function validateSuppliedFlagTypes( values: Readonly<Record<string, unknown>>, suppliedFlags: readonly string[], ): CliFlagTypeValidationResult"
        },
        {
          "name": "getCliFlagUsage",
          "kind": "function",
          "line": 481,
          "exported": true,
          "signature": "export function getCliFlagUsage(name: CliFlagName): string"
        },
        {
          "name": "getGlobalActionFlags",
          "kind": "function",
          "line": 487,
          "exported": true,
          "signature": "export function getGlobalActionFlags(): readonly CliFlagName[]"
        },
        {
          "name": "getCapabilityFlags",
          "kind": "function",
          "line": 491,
          "exported": true,
          "signature": "export function getCapabilityFlags(capability: ActionCapability): readonly CliFlagName[]"
        },
        {
          "name": "projectHandlerArgs",
          "kind": "function",
          "line": 499,
          "exported": true,
          "signature": "export function projectHandlerArgs( values: Readonly<Record<string, unknown>>, pathParams: readonly string[], ): CliHandlerArgs"
        },
        {
          "name": "projectPaginationArgs",
          "kind": "function",
          "line": 517,
          "exported": true,
          "signature": "export function projectPaginationArgs(values: Readonly<Record<string, unknown>>): RawCliPaginationArgs"
        }
      ]
    },
    {
      "path": "src/cli/handler-context.ts",
      "imports": [
        "../client.js",
        "./flags.js",
        "./metadata/types.js",
        "./pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "HandlerArgs",
          "kind": "type",
          "line": 7,
          "exported": true,
          "signature": "export type HandlerArgs = CliHandlerArgs"
        },
        {
          "name": "BodyInput",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface BodyInput { dataFlag?: string; dataFileFlag?: string; readStdin?: () => string; }"
        },
        {
          "name": "HandlerContext",
          "kind": "interface",
          "line": 16,
          "exported": true,
          "signature": "export interface HandlerContext { client: TestRailClient; actionSpec: Pick<ActionSpec, 'resource' | 'action' | 'softMode'>; args: HandlerArgs; pagination: CliPaginationParsed; bodyInput: BodyInput; dr…"
        },
        {
          "name": "Handler",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type Handler = (ctx: HandlerContext) => Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/attachment-write.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js",
        "../upload.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleAttachmentAddToCase",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToResult",
          "kind": "function",
          "line": 13,
          "exported": true,
          "signature": "export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToRun",
          "kind": "function",
          "line": 20,
          "exported": true,
          "signature": "export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlan",
          "kind": "function",
          "line": 27,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlanEntry",
          "kind": "function",
          "line": 34,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentDelete",
          "kind": "function",
          "line": 53,
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
        "../pagination.js",
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
          "line": 35,
          "exported": true,
          "signature": "export async function handleAttachmentListForRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForTest",
          "kind": "function",
          "line": 45,
          "exported": true,
          "signature": "export async function handleAttachmentListForTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlan",
          "kind": "function",
          "line": 50,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentListForPlanEntry",
          "kind": "function",
          "line": 64,
          "exported": true,
          "signature": "export async function handleAttachmentListForPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentGet",
          "kind": "function",
          "line": 82,
          "exported": true,
          "signature": "export async function handleAttachmentGet(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/bdd.ts",
      "imports": [
        "../file-output.js",
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../output.js",
        "../pagination.js",
        "../safe-write.js",
        "../upload.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleBddList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleBddList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleBddGet",
          "kind": "function",
          "line": 55,
          "exported": true,
          "signature": "export async function handleBddGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleBddAdd",
          "kind": "function",
          "line": 97,
          "exported": true,
          "signature": "export async function handleBddAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleBddUpdate",
          "kind": "function",
          "line": 105,
          "exported": true,
          "signature": "export async function handleBddUpdate(ctx: HandlerContext): Promise<void>"
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
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseStatusList",
          "kind": "function",
          "line": 14,
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
          "line": 26,
          "exported": true,
          "signature": "export const handleCaseAddBulk = createWriteHandler({ action: 'case add-bulk', pathParams: ['section_id'], bodySchema: AddCasesBulkPayloadSchema, previewExtras: (body) => ({ count: body.length }), cal…"
        },
        {
          "name": "handleCaseUpdate",
          "kind": "const",
          "line": 34,
          "exported": true,
          "signature": "export const handleCaseUpdate = createWriteHandler({ action: 'case update', pathParams: ['case_id'], bodySchema: UpdateCasePayloadSchema, call: (client, [caseId], body) => client.cases.updateCase(case…"
        },
        {
          "name": "handleCaseUpdateBulk",
          "kind": "const",
          "line": 41,
          "exported": true,
          "signature": "export const handleCaseUpdateBulk = createWriteHandler({ action: 'case update-bulk', pathParams: ['suite_id'], bodySchema: UpdateCasesPayloadSchema, call: (client, [suiteId], body) => client.cases.upd…"
        },
        {
          "name": "handleCaseCopyToSection",
          "kind": "const",
          "line": 48,
          "exported": true,
          "signature": "export const handleCaseCopyToSection = createWriteHandler({ action: 'case copy-to-section', pathParams: ['section_id'], bodySchema: CopyCasesToSectionPayloadSchema, call: (client, [sectionId], body) =…"
        },
        {
          "name": "handleCaseMoveToSection",
          "kind": "const",
          "line": 55,
          "exported": true,
          "signature": "export const handleCaseMoveToSection = createWriteHandler({ action: 'case move-to-section', pathParams: ['section_id'], bodySchema: MoveCasesToSectionPayloadSchema, call: (client, [sectionId], body) =…"
        },
        {
          "name": "handleCaseDelete",
          "kind": "const",
          "line": 67,
          "exported": true,
          "signature": "export const handleCaseDelete = createDestructiveHandler({ action: 'case delete', pathParams: ['case_id'], call: (client, [caseId], _entry, soft) => client.cases.deleteCase(caseId, { soft }), })"
        },
        {
          "name": "handleCaseDeleteBulk",
          "kind": "function",
          "line": 79,
          "exported": true,
          "signature": "export async function handleCaseDeleteBulk(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/case.ts",
      "imports": [
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleCaseGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleCaseGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleCaseList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseTitles",
          "kind": "function",
          "line": 62,
          "exported": true,
          "signature": "export async function handleCaseTitles(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCaseHistory",
          "kind": "function",
          "line": 70,
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
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDatasetGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleDatasetGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetList",
          "kind": "function",
          "line": 10,
          "exported": true,
          "signature": "export async function handleDatasetList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/dynamic-filter-field.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDynamicFilterFieldList",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleDynamicFilterFieldList(ctx: HandlerContext): Promise<void>"
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
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleGroupGet",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleGroupGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupList",
          "kind": "function",
          "line": 23,
          "exported": true,
          "signature": "export async function handleGroupList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/label-write.ts",
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
          "name": "handleLabelAdd",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const handleLabelAdd = createWriteHandler({ action: 'label add', pathParams: ['project_id'], bodySchema: AddLabelPayloadSchema, call: (client, [projectId], body) => client.labels.addLabel(proje…"
        },
        {
          "name": "handleLabelUpdate",
          "kind": "const",
          "line": 20,
          "exported": true,
          "signature": "export const handleLabelUpdate = createWriteHandler({ action: 'label update', pathParams: ['label_id'], bodySchema: UpdateLabelPayloadSchema, call: (client, [labelId], body) => client.labels.updateLab…"
        },
        {
          "name": "handleLabelDelete",
          "kind": "const",
          "line": 28,
          "exported": true,
          "signature": "export const handleLabelDelete = createDestructiveHandler({ action: 'label delete', pathParams: ['label_id'], call: (client, [labelId]) => client.labels.deleteLabel(labelId), })"
        },
        {
          "name": "handleLabelDeleteBulk",
          "kind": "function",
          "line": 39,
          "exported": true,
          "signature": "export async function handleLabelDeleteBulk(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/label.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleLabelGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleLabelGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleLabelList",
          "kind": "function",
          "line": 10,
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
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleMilestoneGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleMilestoneGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneList",
          "kind": "function",
          "line": 11,
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
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePlanGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handlePlanGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanList",
          "kind": "function",
          "line": 11,
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
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleProjectGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleProjectGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectList",
          "kind": "function",
          "line": 11,
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
        },
        {
          "name": "handleCrossProjectReportList",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function handleCrossProjectReportList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleCrossProjectReportRun",
          "kind": "function",
          "line": 18,
          "exported": true,
          "signature": "export async function handleCrossProjectReportRun(ctx: HandlerContext): Promise<void>"
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
          "line": 9,
          "exported": true,
          "signature": "export const handleResultAddByTest = createWriteHandler({ action: 'result add-by-test', pathParams: ['test_id'], bodySchema: AddResultPayloadSchema, call: (client, [testId], body) => client.results.ad…"
        },
        {
          "name": "handleResultAdd",
          "kind": "const",
          "line": 16,
          "exported": true,
          "signature": "export const handleResultAdd = createWriteHandler({ action: 'result add', pathParams: ['run_id', 'case_id'], bodySchema: AddResultPayloadSchema, call: (client, [runId, caseId], body) => client.results…"
        },
        {
          "name": "handleResultAddBulk",
          "kind": "const",
          "line": 23,
          "exported": true,
          "signature": "export const handleResultAddBulk = createWriteHandler({ action: 'result add-bulk', pathParams: ['run_id'], bodySchema: AddResultsForCasesPayloadSchema, call: (client, [runId], body) => client.results.…"
        },
        {
          "name": "handleResultAddBulkByTest",
          "kind": "const",
          "line": 30,
          "exported": true,
          "signature": "export const handleResultAddBulkByTest = createWriteHandler({ action: 'result add-bulk-by-test', pathParams: ['run_id'], bodySchema: AddResultsPayloadSchema, call: (client, [runId], body) => client.re…"
        },
        {
          "name": "handleResultEdit",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const handleResultEdit = createWriteHandler({ action: 'result edit', pathParams: ['result_id'], bodySchema: EditResultPayloadSchema, call: (client, [resultId], body) => client.results.editResul…"
        }
      ]
    },
    {
      "path": "src/cli/handlers/result.ts",
      "imports": [
        "../../types.js",
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleResultList",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export async function handleResultList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "buildResultOptions",
          "kind": "function",
          "line": 36,
          "exported": false,
          "signature": "function buildResultOptions(ctx: HandlerContext): GetResultsOptions"
        },
        {
          "name": "buildResultForRunFilters",
          "kind": "function",
          "line": 49,
          "exported": false,
          "signature": "function buildResultForRunFilters(ctx: HandlerContext): Omit<GetResultsForRunOptions, 'limit' | 'offset'>"
        },
        {
          "name": "handleResultListForTest",
          "kind": "function",
          "line": 64,
          "exported": true,
          "signature": "export async function handleResultListForTest(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleResultListForCase",
          "kind": "function",
          "line": 82,
          "exported": true,
          "signature": "export async function handleResultListForCase(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/role.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRoleList",
          "kind": "function",
          "line": 12,
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
          "signature": "export const handleRunClose = createDestructiveHandler({ action: 'run close', pathParams: ['run_id'], kind: 'close', call: (client, [runId]) => client.runs.closeRun(runId), })"
        },
        {
          "name": "handleRunDelete",
          "kind": "const",
          "line": 34,
          "exported": true,
          "signature": "export const handleRunDelete = createDestructiveHandler({ action: 'run delete', pathParams: ['run_id'], call: (client, [runId], _entry, soft) => client.runs.deleteRun(runId, { soft }), })"
        }
      ]
    },
    {
      "path": "src/cli/handlers/run.ts",
      "imports": [
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleRunGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleRunGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleRunList",
          "kind": "function",
          "line": 11,
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
          "signature": "export const handleSectionDelete = createDestructiveHandler({ action: 'section delete', pathParams: ['section_id'], call: (client, [sectionId], _entry, soft) => client.sections.deleteSection(sectionId…"
        }
      ]
    },
    {
      "path": "src/cli/handlers/section.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSectionGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleSectionGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSectionList",
          "kind": "function",
          "line": 10,
          "exported": true,
          "signature": "export async function handleSectionList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/shared-step-write.ts",
      "imports": [
        "../../schemas.js",
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../write-handler-factory.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepAdd",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const handleSharedStepAdd = createWriteHandler({ action: 'shared-step add', pathParams: ['project_id'], bodySchema: AddSharedStepPayloadSchema, call: (client, [projectId], body) => client.share…"
        },
        {
          "name": "handleSharedStepUpdate",
          "kind": "const",
          "line": 14,
          "exported": true,
          "signature": "export const handleSharedStepUpdate = createWriteHandler({ action: 'shared-step update', pathParams: ['shared_step_id'], bodySchema: UpdateSharedStepPayloadSchema, call: (client, [sharedStepId], body)…"
        },
        {
          "name": "handleSharedStepDelete",
          "kind": "function",
          "line": 27,
          "exported": true,
          "signature": "export async function handleSharedStepDelete(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/shared-step.ts",
      "imports": [
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleSharedStepGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepList",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export async function handleSharedStepList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepHistory",
          "kind": "function",
          "line": 45,
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
          "signature": "export const handleSuiteDelete = createDestructiveHandler({ action: 'suite delete', pathParams: ['suite_id'], call: (client, [suiteId], _entry, soft) => client.suites.deleteSuite(suiteId, { soft }), }…"
        }
      ]
    },
    {
      "path": "src/cli/handlers/suite.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSuiteGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleSuiteGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSuiteList",
          "kind": "function",
          "line": 10,
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
        "../filters.js",
        "../handler-context.js",
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleTestGet",
          "kind": "function",
          "line": 6,
          "exported": true,
          "signature": "export async function handleTestGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleTestList",
          "kind": "function",
          "line": 15,
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
          "line": 8,
          "exported": true,
          "signature": "export const handleUserAdd = createWriteHandler({ action: 'user add', bodySchema: UserAddPayloadSchema, call: (client, _nums, body) => client.users.addUser(body), })"
        },
        {
          "name": "handleUserUpdate",
          "kind": "const",
          "line": 18,
          "exported": true,
          "signature": "export const handleUserUpdate = createWriteHandler({ action: 'user update', pathParams: ['user_id'], bodySchema: UserUpdatePayloadSchema, call: (client, [userId], body) => client.users.updateUser(user…"
        }
      ]
    },
    {
      "path": "src/cli/handlers/user.ts",
      "imports": [
        "../filters.js",
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleUserGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleUserGet(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserList",
          "kind": "function",
          "line": 10,
          "exported": true,
          "signature": "export async function handleUserList(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserGetByEmail",
          "kind": "function",
          "line": 28,
          "exported": true,
          "signature": "export async function handleUserGetByEmail(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleUserGetCurrent",
          "kind": "function",
          "line": 47,
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
        "../ids.js",
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVariableList",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleVariableList(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/handlers/version.ts",
      "imports": [
        "../handler-context.js",
        "../ids.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVersionGet",
          "kind": "function",
          "line": 5,
          "exported": true,
          "signature": "export async function handleVersionGet(ctx: HandlerContext): Promise<void>"
        }
      ]
    },
    {
      "path": "src/cli/help.ts",
      "imports": [
        "./flags.js",
        "./metadata.js",
        "./metadata/types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "METADATA_RESOURCES",
          "kind": "const",
          "line": 36,
          "exported": false,
          "signature": "const METADATA_RESOURCES: ReadonlySet<string> = new Set([ 'case-field', 'case-status', 'case-type', 'dynamic-filter-field', 'priority', 'result-field', 'role', 'status', 'template', 'version', ])"
        },
        {
          "name": "CONFIGURATION_RESOURCES",
          "kind": "const",
          "line": 54,
          "exported": false,
          "signature": "const CONFIGURATION_RESOURCES: ReadonlySet<string> = new Set(['configuration', 'configuration-group'])"
        },
        {
          "name": "SPECIAL_RESOURCES",
          "kind": "const",
          "line": 55,
          "exported": false,
          "signature": "const SPECIAL_RESOURCES: ReadonlySet<string> = new Set(['attachment', 'bdd'])"
        },
        {
          "name": "isReadAction",
          "kind": "function",
          "line": 57,
          "exported": false,
          "signature": "function isReadAction(spec: ActionSpec): boolean"
        },
        {
          "name": "isWriteAction",
          "kind": "function",
          "line": 61,
          "exported": false,
          "signature": "function isWriteAction(spec: ActionSpec): boolean"
        },
        {
          "name": "pathParamsText",
          "kind": "function",
          "line": 72,
          "exported": false,
          "signature": "function pathParamsText(spec: ActionSpec): string"
        },
        {
          "name": "actionArgvHint",
          "kind": "function",
          "line": 81,
          "exported": true,
          "signature": "export function actionArgvHint(spec: ActionSpec): string"
        },
        {
          "name": "renderActionLine",
          "kind": "function",
          "line": 128,
          "exported": false,
          "signature": "function renderActionLine(spec: ActionSpec): string"
        },
        {
          "name": "renderSection",
          "kind": "function",
          "line": 137,
          "exported": true,
          "signature": "export function renderSection(title: string, predicate: (spec: ActionSpec) => boolean): string"
        },
        {
          "name": "renderReadSection",
          "kind": "function",
          "line": 147,
          "exported": false,
          "signature": "function renderReadSection(): string"
        },
        {
          "name": "renderMetadataSection",
          "kind": "function",
          "line": 158,
          "exported": false,
          "signature": "function renderMetadataSection(): string"
        },
        {
          "name": "renderWriteSection",
          "kind": "function",
          "line": 164,
          "exported": false,
          "signature": "function renderWriteSection(): string"
        },
        {
          "name": "renderConfigurationSection",
          "kind": "function",
          "line": 172,
          "exported": false,
          "signature": "function renderConfigurationSection(): string"
        },
        {
          "name": "renderAttachmentSection",
          "kind": "function",
          "line": 178,
          "exported": false,
          "signature": "function renderAttachmentSection(): string"
        },
        {
          "name": "renderBddSection",
          "kind": "function",
          "line": 182,
          "exported": false,
          "signature": "function renderBddSection(): string"
        },
        {
          "name": "BINARY_STDIO_BLOCK",
          "kind": "const",
          "line": 192,
          "exported": false,
          "signature": "const BINARY_STDIO_BLOCK = `Binary stdio (Unix-convention '-' sentinel):\n  --file -    Read binary upload payload from stdin (must be piped; not a TTY).\n              Capped at 100 MiB with a 30s wall…"
        },
        {
          "name": "META_BLOCK",
          "kind": "const",
          "line": 205,
          "exported": false,
          "signature": "const META_BLOCK = `Meta:\n  install-skill [--global] [--force] [--print-path]\n                                    Install the testrail-cli skill to\n                                    ./.claude/skills…"
        },
        {
          "name": "AUTH_BLOCK",
          "kind": "const",
          "line": 216,
          "exported": false,
          "signature": "const AUTH_BLOCK = `Auth (env var preferred — argv is visible to other processes):\n  TESTRAIL_BASE_URL / --base-url <url>\n  TESTRAIL_EMAIL    / --email <email>\n  TESTRAIL_API_KEY  (recommended) | echo…"
        },
        {
          "name": "optionUsage",
          "kind": "function",
          "line": 234,
          "exported": false,
          "signature": "function optionUsage(name: CliOptionName, documentation: CliOptionDocumentationEntry): string"
        },
        {
          "name": "renderOptionsBlock",
          "kind": "function",
          "line": 239,
          "exported": true,
          "signature": "export function renderOptionsBlock(): string"
        },
        {
          "name": "actionNames",
          "kind": "function",
          "line": 250,
          "exported": false,
          "signature": "function actionNames(predicate: (spec: ActionSpec) => boolean): string"
        },
        {
          "name": "DESTRUCTIVE_ACTIONS",
          "kind": "const",
          "line": 256,
          "exported": false,
          "signature": "const DESTRUCTIVE_ACTIONS = actionNames((spec) => spec.destructive === true)"
        },
        {
          "name": "SOFT_OPTIONAL_ACTIONS",
          "kind": "const",
          "line": 257,
          "exported": false,
          "signature": "const SOFT_OPTIONAL_ACTIONS = actionNames((spec) => spec.destructive === true && spec.softMode === 'optional')"
        },
        {
          "name": "SOFT_REJECTED_ACTIONS",
          "kind": "const",
          "line": 258,
          "exported": false,
          "signature": "const SOFT_REJECTED_ACTIONS = actionNames( (spec) => spec.destructive === true && (spec.softMode ?? 'reject') === 'reject', )"
        },
        {
          "name": "NO_BODY_WRITES",
          "kind": "const",
          "line": 261,
          "exported": false,
          "signature": "const NO_BODY_WRITES = actionNames((spec) => spec.isWrite && spec.bodySchema === undefined && spec.fileInput !== true)"
        },
        {
          "name": "SEMANTICS_BLOCK",
          "kind": "const",
          "line": 263,
          "exported": false,
          "signature": "const SEMANTICS_BLOCK = `For body-bearing write actions, exactly one body source is required\n(--data | --data-file | stdin). Stdin is auto-detected when input is piped\n(process.stdin.isTTY !== true) a…"
        },
        {
          "name": "HEADER",
          "kind": "const",
          "line": 285,
          "exported": false,
          "signature": "const HEADER = 'testrail <resource> <action> [args] [options]'"
        },
        {
          "name": "buildHelpText",
          "kind": "function",
          "line": 292,
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
        "./action-invocation.js",
        "./auth.js",
        "./dispatch.js",
        "./flags.js",
        "./handler-context.js",
        "./help.js",
        "./ids.js",
        "./install-skill.js",
        "./output.js",
        "./response-validation.js",
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
          "line": 26,
          "exported": false,
          "signature": "const require = createRequire(import.meta.url)"
        },
        {
          "name": "VERSION",
          "kind": "const",
          "line": 27,
          "exported": false,
          "signature": "const VERSION: string = (require('../../package.json') as { version: string }).version"
        },
        {
          "name": "HELP",
          "kind": "const",
          "line": 35,
          "exported": false,
          "signature": "const HELP = buildHelpText()"
        },
        {
          "name": "main",
          "kind": "function",
          "line": 47,
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
        "./metadata/dynamicFilterFields.js",
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
        "./metadata/variables.js",
        "./metadata/versions.js"
      ],
      "reExports": [
        "./metadata/types.js"
      ],
      "symbols": [
        {
          "name": "ACTIONS",
          "kind": "const",
          "line": 64,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ ...projectActions.slice(0, 2), ...suiteActions.slice(0, 2), ...caseActions.slice(0, 4), ...runActions.slice(0, 3), ...testActions.slice(0, 2), ...result…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 144,
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
          "signature": "export const attachmentActions: readonly ActionSpec[] = [ { resource: 'attachment', action: 'list-for-case', summary: 'List attachments on a test case (paginated)', pathParams: [{ name: 'case_id', des…"
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
          "line": 15,
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
          "line": 38,
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
          "signature": "export const caseStatusActions: readonly ActionSpec[] = [ { resource: 'case-status', action: 'list', summary: 'List case-level lifecycle statuses (pagination envelope; TestRail Enterprise 7.3+)', path…"
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
      "path": "src/cli/metadata/dynamicFilterFields.ts",
      "imports": [
        "../handlers/dynamic-filter-field.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "dynamicFilterFieldActions",
          "kind": "const",
          "line": 5,
          "exported": true,
          "signature": "export const dynamicFilterFieldActions: readonly ActionSpec[] = [ { resource: 'dynamic-filter-field', action: 'list', summary: 'List fields available for dynamic filtering in a project', pathParams: […"
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
          "line": 20,
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
          "line": 14,
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
          "line": 28,
          "exported": true,
          "signature": "export const resultActions: readonly ActionSpec[] = [ { resource: 'result', action: 'list', summary: 'List results for a run (paginated; creator/date, status, and defect filters supported)', pathParam…"
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
          "signature": "export const roleActions: readonly ActionSpec[] = [ { resource: 'role', action: 'list', summary: 'List all user roles defined on the TestRail instance (pagination envelope)', pathParams: [], apiEndpoi…"
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
          "signature": "export const testActions: readonly ActionSpec[] = [ { resource: 'test', action: 'get', summary: 'Fetch a single test by ID (optionally with TestRail data via --with-data)', pathParams: [{ name: 'test_…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/types.ts",
      "imports": [
        "../flags.js",
        "../handler-context.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PathParam",
          "kind": "interface",
          "line": 12,
          "exported": true,
          "signature": "export interface PathParam { name: string; description: string; }"
        },
        {
          "name": "ActionFlagSpec",
          "kind": "interface",
          "line": 17,
          "exported": true,
          "signature": "export interface ActionFlagSpec { readonly name: ActionSpecFlagName; readonly required?: boolean; }"
        },
        {
          "name": "PaginationSpec",
          "kind": "interface",
          "line": 25,
          "exported": true,
          "signature": "export interface PaginationSpec { response: 'envelope' | 'nested-envelope'; requestControls: boolean; collectionKey: string; }"
        },
        {
          "name": "ActionSpec",
          "kind": "interface",
          "line": 34,
          "exported": true,
          "signature": "export interface ActionSpec { resource: string; action: string; summary: string; pathParams: readonly PathParam[]; handler: Handler; flags?: readonly ActionFlagSpec[]; apiEndpoint: string; pagination?…"
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
          "signature": "export const variableActions: readonly ActionSpec[] = [ { resource: 'variable', action: 'list', summary: 'List variables in a project (pagination envelope)', pathParams: [{ name: 'project_id', descrip…"
        }
      ]
    },
    {
      "path": "src/cli/metadata/versions.ts",
      "imports": [
        "../handlers/version.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "versionActions",
          "kind": "const",
          "line": 5,
          "exported": true,
          "signature": "export const versionActions: readonly ActionSpec[] = [ { resource: 'version', action: 'get', summary: 'Get the installed TestRail version', pathParams: [], apiEndpoint: 'GET get_version', isWrite: fal…"
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
          "name": "OUTPUT_FORMATS",
          "kind": "const",
          "line": 4,
          "exported": true,
          "signature": "export const OUTPUT_FORMATS = ['json', 'table', 'yaml', 'csv'] as const"
        },
        {
          "name": "OutputFormat",
          "kind": "type",
          "line": 5,
          "exported": true,
          "signature": "export type OutputFormat = (typeof OUTPUT_FORMATS)[number]"
        },
        {
          "name": "isOutputFormat",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export function isOutputFormat(value: unknown): value is OutputFormat"
        },
        {
          "name": "OutputOptions",
          "kind": "interface",
          "line": 11,
          "exported": true,
          "signature": "export interface OutputOptions { quiet: boolean; format: OutputFormat; }"
        },
        {
          "name": "ProjectedCell",
          "kind": "type",
          "line": 16,
          "exported": false,
          "signature": "type ProjectedCell = | { readonly trusted: true; readonly source: null | undefined | number | boolean | bigint } | { readonly trusted: false; readonly source: unknown }"
        },
        {
          "name": "ProjectedRow",
          "kind": "interface",
          "line": 20,
          "exported": false,
          "signature": "interface ProjectedRow<Cell> { cells: Record<string, Cell>; isRecord: boolean; scalarValue?: Cell; }"
        },
        {
          "name": "ProjectedOutput",
          "kind": "interface",
          "line": 26,
          "exported": false,
          "signature": "interface ProjectedOutput<Cell> { readonly columns: readonly string[]; readonly rows: readonly ProjectedRow<Cell>[]; }"
        },
        {
          "name": "ProjectionShape",
          "kind": "type",
          "line": 31,
          "exported": false,
          "signature": "type ProjectionShape = 'table' | 'csv'"
        },
        {
          "name": "Output",
          "kind": "interface",
          "line": 33,
          "exported": true,
          "signature": "export interface Output { out: (data: unknown) => void; err: (message: string) => void; errRaw: (chunk: string) => void; }"
        },
        {
          "name": "valueToString",
          "kind": "function",
          "line": 43,
          "exported": true,
          "signature": "export function valueToString(v: unknown): string"
        },
        {
          "name": "getField",
          "kind": "function",
          "line": 65,
          "exported": false,
          "signature": "function getField(row: unknown, key: string): unknown"
        },
        {
          "name": "projectCell",
          "kind": "function",
          "line": 70,
          "exported": false,
          "signature": "function projectCell(value: unknown): ProjectedCell"
        },
        {
          "name": "isProjectionRecord",
          "kind": "function",
          "line": 80,
          "exported": false,
          "signature": "function isProjectionRecord(value: unknown, shape: ProjectionShape): value is Record<string, unknown>"
        },
        {
          "name": "projectRecord",
          "kind": "function",
          "line": 84,
          "exported": false,
          "signature": "function projectRecord<Cell>( row: Record<string, unknown>, columns: readonly string[], project: (value: unknown) => Cell, ): ProjectedRow<Cell>"
        },
        {
          "name": "projectOutput",
          "kind": "function",
          "line": 96,
          "exported": false,
          "signature": "function projectOutput<Cell>( data: unknown, shape: ProjectionShape, project: (value: unknown) => Cell, ): ProjectedOutput<Cell>"
        },
        {
          "name": "renderTable",
          "kind": "function",
          "line": 147,
          "exported": true,
          "signature": "export function renderTable(data: unknown): string"
        },
        {
          "name": "safeJsonStringify",
          "kind": "function",
          "line": 196,
          "exported": true,
          "signature": "export function safeJsonStringify(data: unknown): string"
        },
        {
          "name": "emitStdoutAck",
          "kind": "function",
          "line": 218,
          "exported": true,
          "signature": "export function emitStdoutAck( payload: Uint8Array | string, ack: Record<string, unknown>, errRaw?: (chunk: string) => void, ): void"
        },
        {
          "name": "SPECIAL_BARE_STRINGS",
          "kind": "const",
          "line": 246,
          "exported": false,
          "signature": "const SPECIAL_BARE_STRINGS: ReadonlySet<string> = new Set([ '', '~', 'null', 'Null', 'NULL', 'true', 'True', 'TRUE', 'false', 'False', 'FALSE', 'yes', 'Yes', 'YES', 'no', 'No', 'NO', 'on', 'On', 'ON',…"
        },
        {
          "name": "needsQuoting",
          "kind": "function",
          "line": 289,
          "exported": false,
          "signature": "function needsQuoting(s: string): boolean"
        },
        {
          "name": "escapeDoubleQuoted",
          "kind": "function",
          "line": 331,
          "exported": false,
          "signature": "function escapeDoubleQuoted(s: string): string"
        },
        {
          "name": "renderYamlScalar",
          "kind": "function",
          "line": 374,
          "exported": false,
          "signature": "function renderYamlScalar(v: unknown): string"
        },
        {
          "name": "isPlainObject",
          "kind": "function",
          "line": 396,
          "exported": false,
          "signature": "function isPlainObject(v: unknown): v is Record<string, unknown>"
        },
        {
          "name": "renderYamlNode",
          "kind": "function",
          "line": 405,
          "exported": false,
          "signature": "function renderYamlNode(v: unknown, depth: number): string"
        },
        {
          "name": "renderYaml",
          "kind": "function",
          "line": 486,
          "exported": true,
          "signature": "export function renderYaml(value: unknown): string"
        },
        {
          "name": "CSV_LINE_TERMINATOR",
          "kind": "const",
          "line": 518,
          "exported": false,
          "signature": "const CSV_LINE_TERMINATOR = '\\r\\n'"
        },
        {
          "name": "TAB",
          "kind": "const",
          "line": 523,
          "exported": false,
          "signature": "const TAB = 0x09"
        },
        {
          "name": "LF",
          "kind": "const",
          "line": 524,
          "exported": false,
          "signature": "const LF = 0x0a"
        },
        {
          "name": "CR",
          "kind": "const",
          "line": 525,
          "exported": false,
          "signature": "const CR = 0x0d"
        },
        {
          "name": "CSV_FORMULA_LEAD_CHARS",
          "kind": "const",
          "line": 530,
          "exported": false,
          "signature": "const CSV_FORMULA_LEAD_CHARS: ReadonlySet<string> = new Set(['=', '+', '-', '@'])"
        },
        {
          "name": "neutralizeCsvFormula",
          "kind": "function",
          "line": 534,
          "exported": false,
          "signature": "function neutralizeCsvFormula(cell: string): string"
        },
        {
          "name": "csvCellRequiresQuoting",
          "kind": "function",
          "line": 544,
          "exported": false,
          "signature": "function csvCellRequiresQuoting(cell: string): boolean"
        },
        {
          "name": "csvQuoteCell",
          "kind": "function",
          "line": 553,
          "exported": false,
          "signature": "function csvQuoteCell(cell: string): string"
        },
        {
          "name": "csvEscapeCell",
          "kind": "function",
          "line": 562,
          "exported": false,
          "signature": "function csvEscapeCell(cell: string): string"
        },
        {
          "name": "csvDataCell",
          "kind": "function",
          "line": 569,
          "exported": false,
          "signature": "function csvDataCell(cell: ProjectedCell | undefined): string"
        },
        {
          "name": "sanitizeForCsv",
          "kind": "function",
          "line": 573,
          "exported": false,
          "signature": "function sanitizeForCsv(cell: string): string"
        },
        {
          "name": "csvCellFromProjected",
          "kind": "function",
          "line": 579,
          "exported": false,
          "signature": "function csvCellFromProjected(cell: ProjectedCell | undefined): string"
        },
        {
          "name": "renderCsv",
          "kind": "function",
          "line": 619,
          "exported": true,
          "signature": "export function renderCsv(value: unknown): string"
        },
        {
          "name": "OutputEncoder",
          "kind": "interface",
          "line": 657,
          "exported": false,
          "signature": "interface OutputEncoder { readonly render: (payload: unknown) => string; readonly terminator: string; readonly omitEmpty: boolean; }"
        },
        {
          "name": "OUTPUT_ENCODERS",
          "kind": "const",
          "line": 663,
          "exported": false,
          "signature": "const OUTPUT_ENCODERS: Record<OutputFormat, OutputEncoder> = { table: { render: renderTable, terminator: '\\n', omitEmpty: false }, yaml: { render: renderYaml, terminator: '\\n', omitEmpty: false }, csv…"
        },
        {
          "name": "createOutput",
          "kind": "function",
          "line": 670,
          "exported": true,
          "signature": "export function createOutput(opts: OutputOptions): Output"
        }
      ]
    },
    {
      "path": "src/cli/pagination.ts",
      "imports": [
        "../constants.js",
        "../pagination.js",
        "./flags.js",
        "./handler-context.js",
        "./ids.js",
        "./metadata/types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "CliPaginationMode",
          "kind": "type",
          "line": 8,
          "exported": true,
          "signature": "export type CliPaginationMode = 'items' | 'page' | 'all'"
        },
        {
          "name": "CliPaginationOperations",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface CliPaginationOperations<T> { readonly items: () => Promise<T[]>; readonly page: () => Promise<unknown>; readonly all: () => Promise<T[]>; }"
        },
        {
          "name": "CliPaginationParsed",
          "kind": "interface",
          "line": 16,
          "exported": true,
          "signature": "export interface CliPaginationParsed { readonly mode: CliPaginationMode; readonly limit?: number; readonly offset?: number; readonly pageSize?: number; readonly startOffset?: number; readonly maxPages…"
        },
        {
          "name": "CliPaginationValidationResult",
          "kind": "type",
          "line": 28,
          "exported": true,
          "signature": "export type CliPaginationValidationResult = { readonly ok: true; readonly parsed: CliPaginationParsed } | { readonly ok: false; readonly error: string }"
        },
        {
          "name": "ParsedPaginationAggregateProperty",
          "kind": "type",
          "line": 31,
          "exported": false,
          "signature": "type ParsedPaginationAggregateProperty = 'pageSize' | 'startOffset' | 'maxPages' | 'maxItems' | 'maxDurationMs' | 'maxBytes'"
        },
        {
          "name": "ParsedPaginationArgs",
          "kind": "type",
          "line": 34,
          "exported": false,
          "signature": "type ParsedPaginationArgs = Omit<CliPaginationParsed, 'mode'>"
        },
        {
          "name": "NumericFlag",
          "kind": "interface",
          "line": 36,
          "exported": false,
          "signature": "interface NumericFlag { readonly property: ParsedPaginationAggregateProperty; readonly flag: string; readonly allowZero: boolean; readonly maximum?: number; }"
        },
        {
          "name": "PAGE_SIZE_FLAG",
          "kind": "const",
          "line": 43,
          "exported": false,
          "signature": "const PAGE_SIZE_FLAG = { property: 'pageSize', flag: '--page-size', allowZero: false, maximum: MAX_PAGINATION_LIMIT, } satisfies NumericFlag"
        },
        {
          "name": "START_OFFSET_FLAG",
          "kind": "const",
          "line": 49,
          "exported": false,
          "signature": "const START_OFFSET_FLAG = { property: 'startOffset', flag: '--start-offset', allowZero: true, } satisfies NumericFlag"
        },
        {
          "name": "MAX_PAGES_FLAG",
          "kind": "const",
          "line": 54,
          "exported": false,
          "signature": "const MAX_PAGES_FLAG = { property: 'maxPages', flag: '--max-pages', allowZero: false } satisfies NumericFlag"
        },
        {
          "name": "MAX_ITEMS_FLAG",
          "kind": "const",
          "line": 55,
          "exported": false,
          "signature": "const MAX_ITEMS_FLAG = { property: 'maxItems', flag: '--max-items', allowZero: false } satisfies NumericFlag"
        },
        {
          "name": "MAX_DURATION_FLAG",
          "kind": "const",
          "line": 56,
          "exported": false,
          "signature": "const MAX_DURATION_FLAG = { property: 'maxDurationMs', flag: '--max-duration-ms', allowZero: false, maximum: MAX_TIMEOUT_MS, } satisfies NumericFlag"
        },
        {
          "name": "MAX_BYTES_FLAG",
          "kind": "const",
          "line": 62,
          "exported": false,
          "signature": "const MAX_BYTES_FLAG = { property: 'maxBytes', flag: '--max-bytes', allowZero: false, maximum: MAX_PAGINATION_BYTES, } satisfies NumericFlag"
        },
        {
          "name": "NUMERIC_FLAGS",
          "kind": "const",
          "line": 69,
          "exported": false,
          "signature": "const NUMERIC_FLAGS: readonly NumericFlag[] = [ PAGE_SIZE_FLAG, START_OFFSET_FLAG, MAX_PAGES_FLAG, MAX_ITEMS_FLAG, MAX_DURATION_FLAG, MAX_BYTES_FLAG, ]"
        },
        {
          "name": "parseCanonicalInteger",
          "kind": "function",
          "line": 78,
          "exported": false,
          "signature": "function parseCanonicalInteger(raw: unknown, flag: string, allowZero: boolean, maximum?: number): number"
        },
        {
          "name": "parseOptional",
          "kind": "function",
          "line": 98,
          "exported": false,
          "signature": "function parseOptional(args: RawCliPaginationArgs, definition: NumericFlag): number | undefined"
        },
        {
          "name": "parseCliPagination",
          "kind": "function",
          "line": 105,
          "exported": true,
          "signature": "export function parseCliPagination(args: RawCliPaginationArgs): CliPaginationParsed"
        },
        {
          "name": "validateCliPagination",
          "kind": "function",
          "line": 141,
          "exported": true,
          "signature": "export function validateCliPagination( actionSpec: ActionSpec | undefined, args: RawCliPaginationArgs, ): CliPaginationValidationResult"
        },
        {
          "name": "getCliPaginationMode",
          "kind": "function",
          "line": 218,
          "exported": true,
          "signature": "export function getCliPaginationMode(args: Pick<RawCliPaginationArgs, 'page' | 'all'>): CliPaginationMode"
        },
        {
          "name": "outputPaginated",
          "kind": "function",
          "line": 225,
          "exported": true,
          "signature": "export async function outputPaginated<T>( ctx: Pick<HandlerContext, 'pagination' | 'out'>, operations: CliPaginationOperations<T>, ): Promise<void>"
        },
        {
          "name": "getPaginationSafetyOptions",
          "kind": "function",
          "line": 236,
          "exported": true,
          "signature": "export function getPaginationSafetyOptions(pagination: CliPaginationParsed): PaginationSafetyOptions"
        },
        {
          "name": "getPaginatedRequestOptions",
          "kind": "function",
          "line": 246,
          "exported": true,
          "signature": "export function getPaginatedRequestOptions(pagination: CliPaginationParsed): PaginatedRequestOptions"
        }
      ]
    },
    {
      "path": "src/cli/response-validation.ts",
      "imports": [
        "../constants.js",
        "../errors.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "STRICT_RESPONSES_ENV_VAR",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const STRICT_RESPONSES_ENV_VAR = 'TESTRAIL_STRICT_RESPONSES'"
        },
        {
          "name": "StrictResponsesResolution",
          "kind": "type",
          "line": 9,
          "exported": true,
          "signature": "export type StrictResponsesResolution = { readonly ok: true; readonly strict: boolean } | { readonly ok: false; readonly error: string }"
        },
        {
          "name": "resolveStrictResponses",
          "kind": "function",
          "line": 20,
          "exported": true,
          "signature": "export function resolveStrictResponses(flagEnabled: boolean, envValue: string | undefined): StrictResponsesResolution"
        },
        {
          "name": "FlattenedIssue",
          "kind": "interface",
          "line": 31,
          "exported": false,
          "signature": "interface FlattenedIssue { readonly code: string; readonly path: readonly PropertyKey[]; }"
        },
        {
          "name": "flattenIssues",
          "kind": "function",
          "line": 41,
          "exported": false,
          "signature": "function flattenIssues( issues: readonly ZodIssue[], parentPath: readonly PropertyKey[] = [], ): readonly FlattenedIssue[]"
        },
        {
          "name": "SAFE_METHODS",
          "kind": "const",
          "line": 59,
          "exported": false,
          "signature": "const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])"
        },
        {
          "name": "READ_ONLY_METHODS",
          "kind": "const",
          "line": 60,
          "exported": false,
          "signature": "const READ_ONLY_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS'])"
        },
        {
          "name": "SAFE_COMMAND_TOKEN",
          "kind": "const",
          "line": 61,
          "exported": false,
          "signature": "const SAFE_COMMAND_TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/"
        },
        {
          "name": "SAFE_ISSUE_CODE",
          "kind": "const",
          "line": 62,
          "exported": false,
          "signature": "const SAFE_ISSUE_CODE = /^[a-z][a-z0-9_]*$/"
        },
        {
          "name": "NORMALIZED_SEGMENT",
          "kind": "const",
          "line": 63,
          "exported": false,
          "signature": "const NORMALIZED_SEGMENT = '*'"
        },
        {
          "name": "INDETERMINATE_WRITE_STATUS_TEXT",
          "kind": "const",
          "line": 64,
          "exported": false,
          "signature": "const INDETERMINATE_WRITE_STATUS_TEXT = 'Write request succeeded but returned an unrecognized response; write outcome is indeterminate'"
        },
        {
          "name": "normalizeMethod",
          "kind": "function",
          "line": 67,
          "exported": false,
          "signature": "function normalizeMethod(method: string): string"
        },
        {
          "name": "normalizeCommandToken",
          "kind": "function",
          "line": 72,
          "exported": false,
          "signature": "function normalizeCommandToken(token: string): string"
        },
        {
          "name": "normalizeIssueCode",
          "kind": "function",
          "line": 76,
          "exported": false,
          "signature": "function normalizeIssueCode(code: string): string"
        },
        {
          "name": "formatPath",
          "kind": "function",
          "line": 80,
          "exported": false,
          "signature": "function formatPath(path: readonly PropertyKey[]): string"
        },
        {
          "name": "CliSchemaMismatchReporter",
          "kind": "interface",
          "line": 87,
          "exported": true,
          "signature": "export interface CliSchemaMismatchReporter { readonly onSchemaMismatch: (mismatch: SchemaMismatch) => void; readonly flush: () => void; }"
        },
        {
          "name": "CliSchemaMismatchReporterOptions",
          "kind": "interface",
          "line": 93,
          "exported": true,
          "signature": "export interface CliSchemaMismatchReporterOptions { readonly strict: boolean; readonly quiet: boolean; readonly resource: string; readonly action: string; readonly write?: ((chunk: string) => void) | …"
        },
        {
          "name": "createCliSchemaMismatchReporter",
          "kind": "function",
          "line": 109,
          "exported": true,
          "signature": "export function createCliSchemaMismatchReporter(options: CliSchemaMismatchReporterOptions): CliSchemaMismatchReporter"
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
      "path": "src/cli/upload.ts",
      "imports": [
        "./file-input.js",
        "./handler-context.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResolvedUpload",
          "kind": "interface",
          "line": 5,
          "exported": true,
          "signature": "export interface ResolvedUpload { filename: string; path: string; contents?: Uint8Array; fd?: number | undefined; source: 'file' | 'stdin'; }"
        },
        {
          "name": "setupUpload",
          "kind": "function",
          "line": 18,
          "exported": true,
          "signature": "export async function setupUpload( ctx: HandlerContext, action: string, idFields: Record<string, number | string>, ): Promise<ResolvedUpload | null>"
        },
        {
          "name": "uploadPayload",
          "kind": "function",
          "line": 55,
          "exported": true,
          "signature": "export function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array"
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
          "signature": "export interface DestructiveHandlerSpec { action: string; pathParams?: readonly string[]; entryParam?: string; kind?: 'delete' | 'close'; call: (client: TestRailClient, nums: NumIds, entry: string, so…"
        },
        {
          "name": "resolveSoftFlag",
          "kind": "function",
          "line": 150,
          "exported": true,
          "signature": "export function resolveSoftFlag(ctx: HandlerContext): boolean"
        },
        {
          "name": "createDestructiveHandler",
          "kind": "function",
          "line": 159,
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
        "./config-validation.js",
        "./constants.js",
        "./errors.js",
        "./http-pipeline-types.js",
        "./request-cache.js",
        "./retry-policy.js",
        "./types.js",
        "./utils.js",
        "./validation.js",
        "node:fs",
        "node:net",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "isFilePathInput",
          "kind": "function",
          "line": 23,
          "exported": false,
          "signature": "function isFilePathInput(value: unknown): value is UploadFilePathInput"
        },
        {
          "name": "USER_AGENT",
          "kind": "const",
          "line": 33,
          "exported": false,
          "signature": "const USER_AGENT = `${pkg.description}/${pkg.version}`"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 60,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 82,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "DnsLookupFn",
          "kind": "type",
          "line": 121,
          "exported": false,
          "signature": "type DnsLookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 123,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string, dnsLookup?: DnsLookupFn): Promise<void>"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 183,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 184,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 187,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 197,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "ResolvedTimeouts",
          "kind": "interface",
          "line": 221,
          "exported": false,
          "signature": "interface ResolvedTimeouts { readonly timeout: number; readonly bodyTimeout: number; readonly deadlineAt?: number; }"
        },
        {
          "name": "defineOverride",
          "kind": "function",
          "line": 234,
          "exported": false,
          "signature": "function defineOverride<T, K extends keyof T>(obj: T, key: K, fn: T[K]): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 242,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 243
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 246
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 247
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 248
            },
            {
              "name": "requestCache",
              "kind": "property",
              "line": 249
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 250
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 251
            },
            {
              "name": "hostname",
              "kind": "property",
              "line": 252
            },
            {
              "name": "allowPrivateHosts",
              "kind": "property",
              "line": 253
            },
            {
              "name": "maxJsonResponseBytes",
              "kind": "property",
              "line": 254
            },
            {
              "name": "maxBinaryResponseBytes",
              "kind": "property",
              "line": 255
            },
            {
              "name": "bodyTimeout",
              "kind": "property",
              "line": 260
            },
            {
              "name": "bodyTimeoutExplicit",
              "kind": "property",
              "line": 266
            },
            {
              "name": "root",
              "kind": "property",
              "line": 273
            },
            {
              "name": "fetchOverride",
              "kind": "property",
              "line": 274
            },
            {
              "name": "dnsLookup",
              "kind": "property",
              "line": 275
            },
            {
              "name": "onSchemaMismatch",
              "kind": "property",
              "line": 276
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 278
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 348
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 373
            },
            {
              "name": "assertNotRedirect",
              "kind": "method",
              "line": 415
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 458
            },
            {
              "name": "spawnTimeoutView",
              "kind": "method",
              "line": 506
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 525
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 539
            },
            {
              "name": "request",
              "kind": "method",
              "line": 585
            },
            {
              "name": "executeJson",
              "kind": "method",
              "line": 684
            },
            {
              "name": "cacheInvalidationHook",
              "kind": "method",
              "line": 724
            },
            {
              "name": "executeText",
              "kind": "method",
              "line": 744
            },
            {
              "name": "executeBinary",
              "kind": "method",
              "line": 775
            },
            {
              "name": "buildPipelineBody",
              "kind": "method",
              "line": 809
            },
            {
              "name": "buildMultipartBody",
              "kind": "method",
              "line": 827
            },
            {
              "name": "remainingDeadlineMs",
              "kind": "method",
              "line": 921
            },
            {
              "name": "clipBodyTimeout",
              "kind": "method",
              "line": 930
            },
            {
              "name": "withDeadline",
              "kind": "method",
              "line": 940
            },
            {
              "name": "waitForRetryDelay",
              "kind": "method",
              "line": 965
            },
            {
              "name": "executePipeline",
              "kind": "method",
              "line": 976
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 1140
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 1176
            },
            {
              "name": "parseAdvisory",
              "kind": "method",
              "line": 1188
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
          "name": "Mutable",
          "kind": "type",
          "line": 25,
          "exported": false,
          "signature": "type Mutable<T> = { -readonly [K in keyof T]: T[K] }"
        },
        {
          "name": "ModuleBindingKey",
          "kind": "type",
          "line": 27,
          "exported": false,
          "signature": "type ModuleBindingKey = | 'projects' | 'suites' | 'sections' | 'cases' | 'plans' | 'runs' | 'tests' | 'results' | 'milestones' | 'users' | 'metadata' | 'configurations' | 'attachments' | 'bdd' | 'shar…"
        },
        {
          "name": "ModuleBindings",
          "kind": "type",
          "line": 48,
          "exported": false,
          "signature": "type ModuleBindings = Pick<TestRailClient, ModuleBindingKey>"
        },
        {
          "name": "createModuleBindings",
          "kind": "const",
          "line": 50,
          "exported": false,
          "signature": "const createModuleBindings = (client: TestRailClientCore): ModuleBindings => ({ projects: new ProjectModule(client), suites: new SuiteModule(client), sections: new SectionModule(client), cases: new Ca…"
        },
        {
          "name": "rebindModules",
          "kind": "function",
          "line": 72,
          "exported": false,
          "signature": "function rebindModules(target: Mutable<TestRailClient>, client: TestRailClientCore): void"
        },
        {
          "name": "TestRailClient",
          "kind": "class",
          "line": 87,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 89
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 90
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 91
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 92
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 93
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 94
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 95
            },
            {
              "name": "results",
              "kind": "property",
              "line": 96
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 97
            },
            {
              "name": "users",
              "kind": "property",
              "line": 98
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 99
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 100
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 101
            },
            {
              "name": "bdd",
              "kind": "property",
              "line": 102
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 103
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 104
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 105
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 106
            },
            {
              "name": "labels",
              "kind": "property",
              "line": 107
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 109
            },
            {
              "name": "withTimeout",
              "kind": "method",
              "line": 153
            }
          ]
        }
      ]
    },
    {
      "path": "src/config-validation.ts",
      "imports": [
        "./constants.js",
        "./errors.js",
        "./schemas/common.js",
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ConstructionConfigSchema",
          "kind": "const",
          "line": 15,
          "exported": false,
          "signature": "const ConstructionConfigSchema = TestRailConfigSchema.strip().extend({ rateLimiter: TestRailConfigSchema.shape.rateLimiter.unwrap().strip().optional(), })"
        },
        {
          "name": "PRIVATE_HOST_PATTERNS",
          "kind": "const",
          "line": 22,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: readonly RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^fe[c-f…"
        },
        {
          "name": "isPrivateHostLiteral",
          "kind": "function",
          "line": 39,
          "exported": true,
          "signature": "export function isPrivateHostLiteral(hostname: string): boolean"
        },
        {
          "name": "requiredString",
          "kind": "function",
          "line": 44,
          "exported": false,
          "signature": "function requiredString(config: Readonly<Record<string, unknown>>, key: 'baseUrl' | 'email' | 'apiKey'): string"
        },
        {
          "name": "isRecord",
          "kind": "function",
          "line": 52,
          "exported": false,
          "signature": "function isRecord(value: unknown): value is Readonly<Record<string, unknown>>"
        },
        {
          "name": "validateBaseUrl",
          "kind": "function",
          "line": 56,
          "exported": false,
          "signature": "function validateBaseUrl(baseUrl: string, config: Readonly<Record<string, unknown>>): void"
        },
        {
          "name": "issueMessage",
          "kind": "function",
          "line": 88,
          "exported": false,
          "signature": "function issueMessage(path: readonly PropertyKey[]): string"
        },
        {
          "name": "validateTestRailConfig",
          "kind": "function",
          "line": 146,
          "exported": true,
          "signature": "export function validateTestRailConfig(config: unknown): asserts config is TestRailConfig"
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
          "name": "HTTP_OK_STATUS",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const HTTP_OK_STATUS = 200"
        },
        {
          "name": "DEFAULT_TIMEOUT_MS",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const DEFAULT_TIMEOUT_MS = 30000"
        },
        {
          "name": "DEFAULT_MAX_RETRIES",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const DEFAULT_MAX_RETRIES = 3"
        },
        {
          "name": "MAX_RETRIES",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const MAX_RETRIES = 10"
        },
        {
          "name": "DEFAULT_CACHE_TTL_MS",
          "kind": "const",
          "line": 16,
          "exported": true,
          "signature": "export const DEFAULT_CACHE_TTL_MS = 300000"
        },
        {
          "name": "DEFAULT_CACHE_CLEANUP_INTERVAL_MS",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const DEFAULT_CACHE_CLEANUP_INTERVAL_MS = 60000"
        },
        {
          "name": "MAX_NODE_TIMER_DELAY_MS",
          "kind": "const",
          "line": 19,
          "exported": true,
          "signature": "export const MAX_NODE_TIMER_DELAY_MS = 2_147_483_647"
        },
        {
          "name": "TESTRAIL_CONFIG_EMAIL_PATTERN",
          "kind": "const",
          "line": 21,
          "exported": true,
          "signature": "export const TESTRAIL_CONFIG_EMAIL_PATTERN = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/"
        },
        {
          "name": "DEFAULT_MAX_CACHE_SIZE",
          "kind": "const",
          "line": 22,
          "exported": true,
          "signature": "export const DEFAULT_MAX_CACHE_SIZE = 1000"
        },
        {
          "name": "DEFAULT_RATE_LIMIT_MAX_REQUESTS",
          "kind": "const",
          "line": 23,
          "exported": true,
          "signature": "export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100"
        },
        {
          "name": "DEFAULT_RATE_LIMIT_WINDOW_MS",
          "kind": "const",
          "line": 24,
          "exported": true,
          "signature": "export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000"
        },
        {
          "name": "MAX_PAGINATION_LIMIT",
          "kind": "const",
          "line": 34,
          "exported": true,
          "signature": "export const MAX_PAGINATION_LIMIT = 250"
        },
        {
          "name": "DEFAULT_PAGE_SIZE",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const DEFAULT_PAGE_SIZE = MAX_PAGINATION_LIMIT"
        },
        {
          "name": "DEFAULT_MAX_PAGES",
          "kind": "const",
          "line": 38,
          "exported": true,
          "signature": "export const DEFAULT_MAX_PAGES = 100"
        },
        {
          "name": "DEFAULT_MAX_ITEMS",
          "kind": "const",
          "line": 39,
          "exported": true,
          "signature": "export const DEFAULT_MAX_ITEMS = 25_000"
        },
        {
          "name": "DEFAULT_MAX_PAGINATION_DURATION_MS",
          "kind": "const",
          "line": 40,
          "exported": true,
          "signature": "export const DEFAULT_MAX_PAGINATION_DURATION_MS = MAX_TIMEOUT_MS"
        },
        {
          "name": "DEFAULT_MAX_PAGINATION_BYTES",
          "kind": "const",
          "line": 41,
          "exported": true,
          "signature": "export const DEFAULT_MAX_PAGINATION_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "MAX_PAGINATION_BYTES",
          "kind": "const",
          "line": 42,
          "exported": true,
          "signature": "export const MAX_PAGINATION_BYTES = 1024 * 1024 * 1024"
        },
        {
          "name": "DEFAULT_MAX_JSON_RESPONSE_BYTES",
          "kind": "const",
          "line": 66,
          "exported": true,
          "signature": "export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 10 * 1024 * 1024"
        },
        {
          "name": "DEFAULT_MAX_BINARY_RESPONSE_BYTES",
          "kind": "const",
          "line": 67,
          "exported": true,
          "signature": "export const DEFAULT_MAX_BINARY_RESPONSE_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "MAX_RESPONSE_BYTES_LIMIT",
          "kind": "const",
          "line": 68,
          "exported": true,
          "signature": "export const MAX_RESPONSE_BYTES_LIMIT = 1024 * 1024 * 1024"
        },
        {
          "name": "MAX_DATA_FILE_BYTES",
          "kind": "const",
          "line": 77,
          "exported": true,
          "signature": "export const MAX_DATA_FILE_BYTES = 1_048_576"
        },
        {
          "name": "MAX_STDIN_BYTES",
          "kind": "const",
          "line": 91,
          "exported": true,
          "signature": "export const MAX_STDIN_BYTES = 1024 * 1024"
        },
        {
          "name": "MAX_CLI_SCHEMA_MISMATCH_WARNINGS",
          "kind": "const",
          "line": 94,
          "exported": true,
          "signature": "export const MAX_CLI_SCHEMA_MISMATCH_WARNINGS = 10"
        },
        {
          "name": "MAX_STDIN_UPLOAD_BYTES",
          "kind": "const",
          "line": 110,
          "exported": true,
          "signature": "export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "STDIN_READ_TIMEOUT_MS",
          "kind": "const",
          "line": 124,
          "exported": true,
          "signature": "export const STDIN_READ_TIMEOUT_MS = 30000"
        },
        {
          "name": "YAML_INDENT_SPACES",
          "kind": "const",
          "line": 132,
          "exported": true,
          "signature": "export const YAML_INDENT_SPACES = 2"
        }
      ]
    },
    {
      "path": "src/errors.ts",
      "imports": [
        "./pagination.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestRailApiError",
          "kind": "class",
          "line": 11,
          "exported": true,
          "signature": "export class TestRailApiError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 12
            }
          ]
        },
        {
          "name": "TestRailLicenseError",
          "kind": "class",
          "line": 30,
          "exported": true,
          "signature": "export class TestRailLicenseError extends TestRailApiError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 31
            }
          ]
        },
        {
          "name": "LICENSE_RESTRICTION_RE",
          "kind": "const",
          "line": 58,
          "exported": false,
          "signature": "const LICENSE_RESTRICTION_RE = /(?:not an|requires)\\s+enterprise (?:licen|subscription)/i"
        },
        {
          "name": "isLicenseRestriction",
          "kind": "function",
          "line": 69,
          "exported": true,
          "signature": "export function isLicenseRestriction(status: number, body: unknown): boolean"
        },
        {
          "name": "TestRailValidationError",
          "kind": "class",
          "line": 90,
          "exported": true,
          "signature": "export class TestRailValidationError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 91
            }
          ]
        },
        {
          "name": "TestRailPaginationError",
          "kind": "class",
          "line": 105,
          "exported": true,
          "signature": "export class TestRailPaginationError extends TestRailValidationError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 106
            }
          ]
        },
        {
          "name": "handleZodError",
          "kind": "function",
          "line": 121,
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
          "name": "PipelineSpec",
          "kind": "interface",
          "line": 37,
          "exported": true,
          "signature": "export interface PipelineSpec<TParsed> { readonly method: string; readonly endpoint: string; readonly body: BodyShape; readonly timeout: number; readonly bodyTimeout: number; readonly deadlineAt?: num…"
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
        "./constants.js",
        "./errors.js",
        "./modules/attachments.js",
        "./modules/bdd.js",
        "./modules/cases.js",
        "./modules/datasets.js",
        "./modules/labels.js",
        "./modules/metadata.js",
        "./modules/milestones.js",
        "./modules/plans.js",
        "./modules/projects.js",
        "./modules/results.js",
        "./modules/runs.js",
        "./modules/sections.js",
        "./modules/sharedSteps.js",
        "./modules/suites.js",
        "./modules/tests.js",
        "./modules/users.js",
        "./modules/variables.js",
        "./pagination.js",
        "./schemas.js",
        "./types.js"
      ],
      "symbols": []
    },
    {
      "path": "src/modules/attachments.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../validation.js",
        "./list.js",
        "./paginated-list.js"
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
          "name": "GetAllAttachmentsOptions",
          "kind": "type",
          "line": 21,
          "exported": true,
          "signature": "export type GetAllAttachmentsOptions = PaginatedRequestOptions"
        },
        {
          "name": "AttachmentPaginationArgs",
          "kind": "type",
          "line": 23,
          "exported": false,
          "signature": "type AttachmentPaginationArgs = | { readonly operation: 'get_attachments_for_case'; readonly caseId: number } | { readonly operation: 'get_attachments_for_run'; readonly runId: number } | { readonly o…"
        },
        {
          "name": "ATTACHMENTS_PAGINATION",
          "kind": "const",
          "line": 29,
          "exported": true,
          "signature": "export const ATTACHMENTS_PAGINATION = createPaginatedListExecutor< AttachmentPaginationArgs, GetAttachmentsOptions, GetAllAttachmentsOptions, Attachment >({ operations: [ 'get_attachments_for_case', '…"
        },
        {
          "name": "AttachmentModule",
          "kind": "class",
          "line": 63,
          "exported": true,
          "signature": "export class AttachmentModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 64
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 67
            },
            {
              "name": "getAttachmentsForCasePage",
              "kind": "method",
              "line": 72
            },
            {
              "name": "getAllAttachmentsForCase",
              "kind": "method",
              "line": 77
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 82
            },
            {
              "name": "getAttachmentsForRunPage",
              "kind": "method",
              "line": 87
            },
            {
              "name": "getAllAttachmentsForRun",
              "kind": "method",
              "line": 92
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 97
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 102
            },
            {
              "name": "getAttachmentsForPlanPage",
              "kind": "method",
              "line": 107
            },
            {
              "name": "getAllAttachmentsForPlan",
              "kind": "method",
              "line": 112
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 126
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 140
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 151
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 162
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 173
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 184
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 200
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 217
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/bdd.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetBddsOptions",
          "kind": "interface",
          "line": 11,
          "exported": true,
          "signature": "export interface GetBddsOptions { suiteId?: number; sectionId?: number; labelId?: number | readonly number[]; refs?: string | readonly string[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllBddsOptions",
          "kind": "interface",
          "line": 30,
          "exported": true,
          "signature": "export interface GetAllBddsOptions extends Omit<GetBddsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}"
        },
        {
          "name": "BDDS_PAGINATION",
          "kind": "const",
          "line": 32,
          "exported": true,
          "signature": "export const BDDS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetBddsOptions, GetAllBddsOptions, Bdd >({ operations: ['get_bdds'], collectionKey: 'bdd', itemSchema: BddSc…"
        },
        {
          "name": "BddModule",
          "kind": "class",
          "line": 75,
          "exported": true,
          "signature": "export class BddModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 76
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 83
            },
            {
              "name": "getBdds",
              "kind": "method",
              "line": 96
            },
            {
              "name": "getBddsPage",
              "kind": "method",
              "line": 101
            },
            {
              "name": "getAllBdds",
              "kind": "method",
              "line": 106
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 114
            },
            {
              "name": "updateBdd",
              "kind": "method",
              "line": 123
            },
            {
              "name": "uploadBdd",
              "kind": "method",
              "line": 128
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
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../utils.js",
        "../validation.js",
        "./list.js",
        "./paginated-list.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetHistoryForCaseOptions",
          "kind": "interface",
          "line": 24,
          "exported": true,
          "signature": "export interface GetHistoryForCaseOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllCasesOptions",
          "kind": "interface",
          "line": 31,
          "exported": true,
          "signature": "export interface GetAllCasesOptions extends Omit<GetCasesOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}"
        },
        {
          "name": "GetAllHistoryForCaseOptions",
          "kind": "type",
          "line": 33,
          "exported": true,
          "signature": "export type GetAllHistoryForCaseOptions = PaginatedRequestOptions"
        },
        {
          "name": "CASES_PAGINATION",
          "kind": "const",
          "line": 35,
          "exported": true,
          "signature": "export const CASES_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetCasesOptions, GetAllCasesOptions, Case >({ operations: ['get_cases'], collectionKey: 'cases', itemSchema…"
        },
        {
          "name": "CASE_HISTORY_PAGINATION",
          "kind": "const",
          "line": 92,
          "exported": true,
          "signature": "export const CASE_HISTORY_PAGINATION = createPaginatedListExecutor< { readonly caseId: number }, GetHistoryForCaseOptions, GetAllHistoryForCaseOptions, HistoryEntry >({ operations: ['get_history_for_c…"
        },
        {
          "name": "CaseModule",
          "kind": "class",
          "line": 109,
          "exported": true,
          "signature": "export class CaseModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 110
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 113
            },
            {
              "name": "getCaseTitles",
              "kind": "method",
              "line": 123
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 137
            },
            {
              "name": "getCasesPage",
              "kind": "method",
              "line": 142
            },
            {
              "name": "getAllCases",
              "kind": "method",
              "line": 147
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 152
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 172
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 203
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 222
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 223
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 229
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 230
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 260
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 293
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 299
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 306
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 312
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 344
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 360
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 370
            },
            {
              "name": "getHistoryForCasePage",
              "kind": "method",
              "line": 375
            },
            {
              "name": "getAllHistoryForCase",
              "kind": "method",
              "line": 380
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
        "../pagination.js",
        "../schemas.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllDatasetsOptions",
          "kind": "type",
          "line": 8,
          "exported": true,
          "signature": "export type GetAllDatasetsOptions = PaginationSafetyOptions"
        },
        {
          "name": "DatasetPaginationControls",
          "kind": "interface",
          "line": 10,
          "exported": false,
          "signature": "interface DatasetPaginationControls { limit?: number; offset?: number; }"
        },
        {
          "name": "DATASETS_PAGINATION",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const DATASETS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, DatasetPaginationControls, GetAllDatasetsOptions, Dataset >({ operations: ['get_datasets'], collectionKe…"
        },
        {
          "name": "DatasetModule",
          "kind": "class",
          "line": 35,
          "exported": true,
          "signature": "export class DatasetModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 36
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 39
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 49
            },
            {
              "name": "getDatasetsPage",
              "kind": "method",
              "line": 54
            },
            {
              "name": "getAllDatasets",
              "kind": "method",
              "line": 59
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 64
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 75
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 86
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/labels.ts",
      "imports": [
        "../client-core.js",
        "../errors.js",
        "../pagination.js",
        "../schemas.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetLabelsOptions",
          "kind": "interface",
          "line": 9,
          "exported": true,
          "signature": "export interface GetLabelsOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllLabelsOptions",
          "kind": "type",
          "line": 16,
          "exported": true,
          "signature": "export type GetAllLabelsOptions = PaginatedRequestOptions"
        },
        {
          "name": "LABELS_PAGINATION",
          "kind": "const",
          "line": 18,
          "exported": true,
          "signature": "export const LABELS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetLabelsOptions, GetAllLabelsOptions, Label >({ operations: ['get_labels'], collectionKey: 'labels', item…"
        },
        {
          "name": "LabelModule",
          "kind": "class",
          "line": 40,
          "exported": true,
          "signature": "export class LabelModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 41
            },
            {
              "name": "getLabel",
              "kind": "method",
              "line": 44
            },
            {
              "name": "getLabels",
              "kind": "method",
              "line": 54
            },
            {
              "name": "getLabelsPage",
              "kind": "method",
              "line": 59
            },
            {
              "name": "getAllLabels",
              "kind": "method",
              "line": 64
            },
            {
              "name": "addLabel",
              "kind": "method",
              "line": 69
            },
            {
              "name": "updateLabel",
              "kind": "method",
              "line": 80
            },
            {
              "name": "deleteLabel",
              "kind": "method",
              "line": 92
            },
            {
              "name": "deleteLabels",
              "kind": "method",
              "line": 101
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/list.ts",
      "imports": [
        "../constants.js",
        "../errors.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "pageLinksSchema",
          "kind": "const",
          "line": 5,
          "exported": false,
          "signature": "const pageLinksSchema = z.object({ next: z.string().nullable(), prev: z.string().nullable() }).passthrough()"
        },
        {
          "name": "PAGINATION_METADATA_KEYS",
          "kind": "const",
          "line": 6,
          "exported": false,
          "signature": "const PAGINATION_METADATA_KEYS = ['offset', 'limit', 'size', '_links'] as const"
        },
        {
          "name": "MALFORMED_LIST_STATUS_TEXT",
          "kind": "const",
          "line": 7,
          "exported": false,
          "signature": "const MALFORMED_LIST_STATUS_TEXT = 'Unexpected list response structure'"
        },
        {
          "name": "malformedListResponse",
          "kind": "function",
          "line": 9,
          "exported": false,
          "signature": "function malformedListResponse(raw: unknown): TestRailApiError"
        },
        {
          "name": "hasPaginationMetadataSignature",
          "kind": "function",
          "line": 13,
          "exported": false,
          "signature": "function hasPaginationMetadataSignature(value: unknown): boolean"
        },
        {
          "name": "paginatedEnvelopeOf",
          "kind": "const",
          "line": 22,
          "exported": false,
          "signature": "const paginatedEnvelopeOf = <T extends z.ZodTypeAny>(key: string, item: T) => { const collection = { [key]: z.array(item).nullable() }; return z .object({ ...collection, offset: z.number().int().nonne…"
        },
        {
          "name": "envelopeOf",
          "kind": "const",
          "line": 52,
          "exported": false,
          "signature": "const envelopeOf = <T extends z.ZodTypeAny>(key: string, item: T) => { const collection = { [key]: z.array(item).nullable() }; const paginated = paginatedEnvelopeOf(key, item); const wrapperOnly = z .…"
        },
        {
          "name": "listOf",
          "kind": "const",
          "line": 103,
          "exported": true,
          "signature": "export const listOf = <T extends z.ZodTypeAny>(key: string, item: T) => z.union([z.array(item), envelopeOf(key, item)])"
        },
        {
          "name": "pageOf",
          "kind": "const",
          "line": 112,
          "exported": true,
          "signature": "export const pageOf = <T extends z.ZodTypeAny>(key: string, item: T) => z.union([z.array(item), paginatedEnvelopeOf(key, item)])"
        },
        {
          "name": "unwrapList",
          "kind": "const",
          "line": 124,
          "exported": true,
          "signature": "export const unwrapList = <T>(key: string, raw: unknown): T[] => { if (Array.isArray(raw)) return raw as T[]; if (typeof raw !== 'object' || raw === null) { throw malformedListResponse(raw); } const v…"
        },
        {
          "name": "listOfNested",
          "kind": "const",
          "line": 145,
          "exported": true,
          "signature": "export const listOfNested = <T extends z.ZodTypeAny>(key: string, item: T) => z.union([z.array(item), envelopeOf(key, item), z.tuple([envelopeOf(key, item)])])"
        },
        {
          "name": "pageOfNested",
          "kind": "const",
          "line": 149,
          "exported": true,
          "signature": "export const pageOfNested = <T extends z.ZodTypeAny>(key: string, item: T) => { const envelope = paginatedEnvelopeOf(key, item); return z.union([z.array(item), envelope, z.tuple([envelope])]); }"
        },
        {
          "name": "unwrapNestedList",
          "kind": "const",
          "line": 159,
          "exported": true,
          "signature": "export const unwrapNestedList = <T>(key: string, raw: unknown): T[] => { if (Array.isArray(raw)) { const envelopes = raw.filter( (value) => typeof value === 'object' && value !== null && !Array.isArra…"
        }
      ]
    },
    {
      "path": "src/modules/metadata.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../validation.js",
        "./paginated-list.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllCaseStatusesOptions",
          "kind": "type",
          "line": 22,
          "exported": true,
          "signature": "export type GetAllCaseStatusesOptions = PaginationSafetyOptions"
        },
        {
          "name": "GetAllRolesOptions",
          "kind": "type",
          "line": 23,
          "exported": true,
          "signature": "export type GetAllRolesOptions = PaginationSafetyOptions"
        },
        {
          "name": "MetadataPaginationControls",
          "kind": "interface",
          "line": 25,
          "exported": false,
          "signature": "interface MetadataPaginationControls { limit?: number; offset?: number; }"
        },
        {
          "name": "CASE_STATUSES_PAGINATION",
          "kind": "const",
          "line": 30,
          "exported": true,
          "signature": "export const CASE_STATUSES_PAGINATION = createPaginatedListExecutor< undefined, MetadataPaginationControls, GetAllCaseStatusesOptions, CaseStatus >({ operations: ['get_case_statuses'], collectionKey: …"
        },
        {
          "name": "ROLES_PAGINATION",
          "kind": "const",
          "line": 44,
          "exported": true,
          "signature": "export const ROLES_PAGINATION = createPaginatedListExecutor< undefined, MetadataPaginationControls, GetAllRolesOptions, Role >({ operations: ['get_roles'], collectionKey: 'roles', itemSchema: RoleSche…"
        },
        {
          "name": "MetadataModule",
          "kind": "class",
          "line": 58,
          "exported": true,
          "signature": "export class MetadataModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 59
            },
            {
              "name": "getVersion",
              "kind": "method",
              "line": 62
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 71
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 80
            },
            {
              "name": "getCaseStatusesPage",
              "kind": "method",
              "line": 85
            },
            {
              "name": "getAllCaseStatuses",
              "kind": "method",
              "line": 90
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 95
            },
            {
              "name": "getDynamicFilterFields",
              "kind": "method",
              "line": 104
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 114
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 123
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 154
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 164
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 173
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 183
            },
            {
              "name": "getRolesPage",
              "kind": "method",
              "line": 188
            },
            {
              "name": "getAllRoles",
              "kind": "method",
              "line": 193
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/milestones.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllMilestonesOptions",
          "kind": "type",
          "line": 9,
          "exported": true,
          "signature": "export type GetAllMilestonesOptions = Omit<GetMilestonesOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "MILESTONES_PAGINATION",
          "kind": "const",
          "line": 11,
          "exported": true,
          "signature": "export const MILESTONES_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetMilestonesOptions, GetAllMilestonesOptions, Milestone >({ operations: ['get_milestones'], collectio…"
        },
        {
          "name": "MilestoneModule",
          "kind": "class",
          "line": 39,
          "exported": true,
          "signature": "export class MilestoneModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 40
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 43
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 53
            },
            {
              "name": "getMilestonesPage",
              "kind": "method",
              "line": 58
            },
            {
              "name": "getAllMilestones",
              "kind": "method",
              "line": 63
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 68
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 79
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 90
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/paginated-list.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../url.js",
        "../validation.js",
        "./list.js",
        "./pagination-options.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "QueryPrimitive",
          "kind": "type",
          "line": 16,
          "exported": false,
          "signature": "type QueryPrimitive = string | number"
        },
        {
          "name": "PaginatedQueryValue",
          "kind": "type",
          "line": 19,
          "exported": true,
          "signature": "export type PaginatedQueryValue = QueryPrimitive | readonly QueryPrimitive[] | undefined"
        },
        {
          "name": "DirectPaginationOptions",
          "kind": "interface",
          "line": 21,
          "exported": false,
          "signature": "interface DirectPaginationOptions { readonly limit?: number; readonly offset?: number; }"
        },
        {
          "name": "DirectPaginationValues",
          "kind": "interface",
          "line": 26,
          "exported": false,
          "signature": "interface DirectPaginationValues { readonly limit: number | undefined; readonly offset: number | undefined; }"
        },
        {
          "name": "EndpointOptions",
          "kind": "type",
          "line": 31,
          "exported": false,
          "signature": "type EndpointOptions<Options extends DirectPaginationOptions> = Omit<Options, keyof DirectPaginationOptions>"
        },
        {
          "name": "PaginatedOperationDeclaration",
          "kind": "type",
          "line": 33,
          "exported": true,
          "signature": "export type PaginatedOperationDeclaration = | string | { readonly operation: string; readonly registered: false; }"
        },
        {
          "name": "PreparedPaginatedRequest",
          "kind": "interface",
          "line": 47,
          "exported": true,
          "signature": "export interface PreparedPaginatedRequest { readonly operation: string; readonly pathParameters?: readonly number[]; readonly query?: Readonly<Record<string, PaginatedQueryValue>>; }"
        },
        {
          "name": "PaginationRegistration",
          "kind": "interface",
          "line": 53,
          "exported": true,
          "signature": "export interface PaginationRegistration { readonly operation: string; readonly response: 'envelope' | 'nested-envelope'; readonly requestControls: boolean; readonly collectionKey: string; }"
        },
        {
          "name": "PaginatedListDescriptor",
          "kind": "interface",
          "line": 60,
          "exported": false,
          "signature": "interface PaginatedListDescriptor<Args, ReadOptions extends DirectPaginationOptions, Item> { readonly operations: readonly [PaginatedOperationDeclaration, ...PaginatedOperationDeclaration[]]; readonly…"
        },
        {
          "name": "PaginatedListExecutor",
          "kind": "interface",
          "line": 74,
          "exported": true,
          "signature": "export interface PaginatedListExecutor< Args, ReadOptions extends DirectPaginationOptions, AllOptions extends ReadOptions & PaginationSafetyOptions, Item, > { readonly registrations: readonly Paginati…"
        },
        {
          "name": "PaginationTransport",
          "kind": "type",
          "line": 86,
          "exported": false,
          "signature": "type PaginationTransport = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & { readonly pageProjection?: boolean; }"
        },
        {
          "name": "isQueryArray",
          "kind": "function",
          "line": 90,
          "exported": false,
          "signature": "function isQueryArray(value: PaginatedQueryValue): value is readonly QueryPrimitive[]"
        },
        {
          "name": "ResolvedPaginatedOperation",
          "kind": "interface",
          "line": 94,
          "exported": false,
          "signature": "interface ResolvedPaginatedOperation { readonly operation: string; readonly registered: boolean; }"
        },
        {
          "name": "resolveOperation",
          "kind": "function",
          "line": 99,
          "exported": false,
          "signature": "function resolveOperation(declaration: PaginatedOperationDeclaration): ResolvedPaginatedOperation"
        },
        {
          "name": "endpointOptions",
          "kind": "function",
          "line": 105,
          "exported": false,
          "signature": "function endpointOptions<Options extends DirectPaginationOptions>( options: Options | undefined, ): EndpointOptions<Options> | undefined"
        },
        {
          "name": "snapshotPreparedRequest",
          "kind": "function",
          "line": 114,
          "exported": false,
          "signature": "function snapshotPreparedRequest( request: PreparedPaginatedRequest, allowedOperations: ReadonlySet<string>, ): PreparedPaginatedRequest"
        },
        {
          "name": "buildOperationPath",
          "kind": "function",
          "line": 131,
          "exported": false,
          "signature": "function buildOperationPath(request: PreparedPaginatedRequest): string"
        },
        {
          "name": "createPaginatedListExecutor",
          "kind": "function",
          "line": 140,
          "exported": true,
          "signature": "export function createPaginatedListExecutor< Args, ReadOptions extends DirectPaginationOptions, AllOptions extends ReadOptions & PaginationSafetyOptions, Item, >( descriptor: PaginatedListDescriptor<A…"
        }
      ]
    },
    {
      "path": "src/modules/pagination-options.ts",
      "imports": [
        "../pagination.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "isUnknownArray",
          "kind": "function",
          "line": 3,
          "exported": false,
          "signature": "function isUnknownArray(value: unknown): value is readonly unknown[]"
        },
        {
          "name": "snapshotValue",
          "kind": "function",
          "line": 7,
          "exported": false,
          "signature": "function snapshotValue(value: unknown): unknown"
        },
        {
          "name": "snapshotOptionFields",
          "kind": "function",
          "line": 15,
          "exported": true,
          "signature": "export function snapshotOptionFields<T extends object, K extends Extract<keyof T, string>>( options: T | undefined, keys: readonly K[], ): Partial<Pick<T, K>>"
        },
        {
          "name": "snapshotPaginationSafetyOptions",
          "kind": "function",
          "line": 30,
          "exported": true,
          "signature": "export function snapshotPaginationSafetyOptions(options: PaginationSafetyOptions | undefined): PaginationSafetyOptions"
        },
        {
          "name": "snapshotPaginatedRequestOptions",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export function snapshotPaginatedRequestOptions(options: PaginatedRequestOptions | undefined): PaginatedRequestOptions"
        }
      ]
    },
    {
      "path": "src/modules/plans.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllPlansOptions",
          "kind": "type",
          "line": 19,
          "exported": true,
          "signature": "export type GetAllPlansOptions = Omit<GetPlansOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "PLANS_PAGINATION",
          "kind": "const",
          "line": 21,
          "exported": true,
          "signature": "export const PLANS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetPlansOptions, GetAllPlansOptions, Plan >({ operations: ['get_plans'], collectionKey: 'plans', itemSchema…"
        },
        {
          "name": "PlanModule",
          "kind": "class",
          "line": 57,
          "exported": true,
          "signature": "export class PlanModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 58
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 61
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 67
            },
            {
              "name": "getPlansPage",
              "kind": "method",
              "line": 72
            },
            {
              "name": "getAllPlans",
              "kind": "method",
              "line": 77
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 82
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 93
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 104
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 114
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 120
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 131
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 143
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 153
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 165
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 176
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/projects.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetProjectsOptions",
          "kind": "interface",
          "line": 9,
          "exported": true,
          "signature": "export interface GetProjectsOptions { isCompleted?: boolean; limit?: number; offset?: number; }"
        },
        {
          "name": "GetProjectsPageOptions",
          "kind": "type",
          "line": 17,
          "exported": true,
          "signature": "export type GetProjectsPageOptions = GetProjectsOptions"
        },
        {
          "name": "GetAllProjectsOptions",
          "kind": "type",
          "line": 19,
          "exported": true,
          "signature": "export type GetAllProjectsOptions = Omit<GetProjectsOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "PROJECTS_PAGINATION",
          "kind": "const",
          "line": 21,
          "exported": true,
          "signature": "export const PROJECTS_PAGINATION = createPaginatedListExecutor< Record<never, never>, GetProjectsOptions, GetAllProjectsOptions, Project >({ operations: ['get_projects'], collectionKey: 'projects', it…"
        },
        {
          "name": "ProjectModule",
          "kind": "class",
          "line": 40,
          "exported": true,
          "signature": "export class ProjectModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 41
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 49
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 64
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 66
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 67
            },
            {
              "name": "getProjectsPage",
              "kind": "method",
              "line": 78
            },
            {
              "name": "getAllProjects",
              "kind": "method",
              "line": 83
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 88
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 98
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 109
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
            },
            {
              "name": "getCrossProjectReports",
              "kind": "method",
              "line": 34
            },
            {
              "name": "runCrossProjectReport",
              "kind": "method",
              "line": 46
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/results.ts",
      "imports": [
        "../client-core.js",
        "../errors.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllResultsOptions",
          "kind": "interface",
          "line": 12,
          "exported": true,
          "signature": "export interface GetAllResultsOptions extends Omit<GetResultsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}"
        },
        {
          "name": "GetAllResultsForRunOptions",
          "kind": "interface",
          "line": 14,
          "exported": true,
          "signature": "export interface GetAllResultsForRunOptions extends Omit<GetResultsForRunOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}"
        },
        {
          "name": "ResultsPaginationArgs",
          "kind": "interface",
          "line": 17,
          "exported": false,
          "signature": "interface ResultsPaginationArgs { readonly operation: 'get_results'; readonly testId: number; }"
        },
        {
          "name": "ResultsForCasePaginationArgs",
          "kind": "interface",
          "line": 22,
          "exported": false,
          "signature": "interface ResultsForCasePaginationArgs { readonly operation: 'get_results_for_case'; readonly runId: number; readonly caseId: number; }"
        },
        {
          "name": "ResultsForRunPaginationArgs",
          "kind": "interface",
          "line": 28,
          "exported": false,
          "signature": "interface ResultsForRunPaginationArgs { readonly operation: 'get_results_for_run'; readonly runId: number; }"
        },
        {
          "name": "ResultPaginationArgs",
          "kind": "type",
          "line": 33,
          "exported": false,
          "signature": "type ResultPaginationArgs = ResultsPaginationArgs | ResultsForCasePaginationArgs | ResultsForRunPaginationArgs"
        },
        {
          "name": "RESULTS_PAGINATION",
          "kind": "const",
          "line": 35,
          "exported": true,
          "signature": "export const RESULTS_PAGINATION = createPaginatedListExecutor< ResultPaginationArgs, GetResultsForRunOptions, GetAllResultsForRunOptions, Result >({ operations: ['get_results', 'get_results_for_case',…"
        },
        {
          "name": "ResultModule",
          "kind": "class",
          "line": 86,
          "exported": true,
          "signature": "export class ResultModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 87
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 90
            },
            {
              "name": "getResultsPage",
              "kind": "method",
              "line": 95
            },
            {
              "name": "getAllResults",
              "kind": "method",
              "line": 100
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 105
            },
            {
              "name": "getResultsForCasePage",
              "kind": "method",
              "line": 110
            },
            {
              "name": "getAllResultsForCase",
              "kind": "method",
              "line": 115
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 120
            },
            {
              "name": "getResultsForRunPage",
              "kind": "method",
              "line": 125
            },
            {
              "name": "getAllResultsForRun",
              "kind": "method",
              "line": 130
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 135
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 146
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 158
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 169
            },
            {
              "name": "editResult",
              "kind": "method",
              "line": 183
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/runs.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllRunsOptions",
          "kind": "type",
          "line": 11,
          "exported": true,
          "signature": "export type GetAllRunsOptions = Omit<GetRunsOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "RUNS_PAGINATION",
          "kind": "const",
          "line": 13,
          "exported": true,
          "signature": "export const RUNS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetRunsOptions, GetAllRunsOptions, Run >({ operations: ['get_runs'], collectionKey: 'runs', itemSchema: RunS…"
        },
        {
          "name": "RunModule",
          "kind": "class",
          "line": 55,
          "exported": true,
          "signature": "export class RunModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 56
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 59
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 65
            },
            {
              "name": "getRunsPage",
              "kind": "method",
              "line": 70
            },
            {
              "name": "getAllRuns",
              "kind": "method",
              "line": 75
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 80
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 91
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 102
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 119
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 120
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 123
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 124
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/sections.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetSectionsOptions",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface GetSectionsOptions { suiteId?: number; limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllSectionsOptions",
          "kind": "type",
          "line": 16,
          "exported": true,
          "signature": "export type GetAllSectionsOptions = Omit<GetSectionsOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "SECTIONS_PAGINATION",
          "kind": "const",
          "line": 18,
          "exported": true,
          "signature": "export const SECTIONS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetSectionsOptions, GetAllSectionsOptions, Section >({ operations: ['get_sections'], collectionKey: 'sec…"
        },
        {
          "name": "SectionModule",
          "kind": "class",
          "line": 41,
          "exported": true,
          "signature": "export class SectionModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 42
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 45
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 55
            },
            {
              "name": "getSectionsPage",
              "kind": "method",
              "line": 60
            },
            {
              "name": "getAllSections",
              "kind": "method",
              "line": 65
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 70
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 81
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 99
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 100
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 102
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 103
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 131
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/sharedSteps.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetSharedStepsOptions",
          "kind": "interface",
          "line": 9,
          "exported": true,
          "signature": "export interface GetSharedStepsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number | readonly number[]; updatedAfter?: number; updatedBefore?: number; refs?: string; limit?: nu…"
        },
        {
          "name": "GetSharedStepHistoryOptions",
          "kind": "interface",
          "line": 26,
          "exported": true,
          "signature": "export interface GetSharedStepHistoryOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllSharedStepsOptions",
          "kind": "type",
          "line": 31,
          "exported": true,
          "signature": "export type GetAllSharedStepsOptions = Omit<GetSharedStepsOptions, 'limit' | 'offset'> & PaginatedRequestOptions"
        },
        {
          "name": "GetAllSharedStepHistoryOptions",
          "kind": "type",
          "line": 32,
          "exported": true,
          "signature": "export type GetAllSharedStepHistoryOptions = PaginationSafetyOptions"
        },
        {
          "name": "DeleteSharedStepOptions",
          "kind": "interface",
          "line": 34,
          "exported": true,
          "signature": "export interface DeleteSharedStepOptions { keepInCases?: boolean; }"
        },
        {
          "name": "SHARED_STEPS_PAGINATION",
          "kind": "const",
          "line": 39,
          "exported": true,
          "signature": "export const SHARED_STEPS_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetSharedStepsOptions, GetAllSharedStepsOptions, SharedStep >({ operations: ['get_shared_steps'], co…"
        },
        {
          "name": "SHARED_STEP_HISTORY_PAGINATION",
          "kind": "const",
          "line": 67,
          "exported": true,
          "signature": "export const SHARED_STEP_HISTORY_PAGINATION = createPaginatedListExecutor< { readonly sharedStepId: number }, GetSharedStepHistoryOptions, GetAllSharedStepHistoryOptions, StepHistoryEntry >({ operatio…"
        },
        {
          "name": "SharedStepModule",
          "kind": "class",
          "line": 84,
          "exported": true,
          "signature": "export class SharedStepModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 85
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 88
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 98
            },
            {
              "name": "getSharedStepsPage",
              "kind": "method",
              "line": 103
            },
            {
              "name": "getAllSharedSteps",
              "kind": "method",
              "line": 108
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 113
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 124
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 135
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 147
            },
            {
              "name": "getSharedStepHistoryPage",
              "kind": "method",
              "line": 155
            },
            {
              "name": "getAllSharedStepHistory",
              "kind": "method",
              "line": 160
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/suites.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetSuitesOptions",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface GetSuitesOptions { limit?: number; offset?: number; }"
        },
        {
          "name": "GetAllSuitesOptions",
          "kind": "type",
          "line": 15,
          "exported": true,
          "signature": "export type GetAllSuitesOptions = PaginatedRequestOptions"
        },
        {
          "name": "SUITES_PAGINATION",
          "kind": "const",
          "line": 17,
          "exported": true,
          "signature": "export const SUITES_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, GetSuitesOptions, GetAllSuitesOptions, Suite >({ operations: ['get_suites'], collectionKey: 'suites', item…"
        },
        {
          "name": "SuiteModule",
          "kind": "class",
          "line": 34,
          "exported": true,
          "signature": "export class SuiteModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 35
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 43
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 58
            },
            {
              "name": "getSuitesPage",
              "kind": "method",
              "line": 63
            },
            {
              "name": "getAllSuites",
              "kind": "method",
              "line": 68
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 78
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 94
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 114
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 115
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 117
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 118
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/tests.ts",
      "imports": [
        "../client-core.js",
        "../errors.js",
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../utils.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllTestsOptions",
          "kind": "interface",
          "line": 17,
          "exported": true,
          "signature": "export interface GetAllTestsOptions extends Omit<GetTestsOptions, 'limit' | 'offset'>, PaginatedRequestOptions {}"
        },
        {
          "name": "GetTestOptions",
          "kind": "interface",
          "line": 19,
          "exported": true,
          "signature": "export interface GetTestOptions { withData?: '0' | '1'; }"
        },
        {
          "name": "TESTS_PAGINATION",
          "kind": "const",
          "line": 24,
          "exported": true,
          "signature": "export const TESTS_PAGINATION = createPaginatedListExecutor< { readonly runId: number }, GetTestsOptions, GetAllTestsOptions, Test >({ operations: ['get_tests'], collectionKey: 'tests', itemSchema: Te…"
        },
        {
          "name": "TestModule",
          "kind": "class",
          "line": 49,
          "exported": true,
          "signature": "export class TestModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 50
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 53
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 54
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 55
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 78
            },
            {
              "name": "getTestsPage",
              "kind": "method",
              "line": 83
            },
            {
              "name": "getAllTests",
              "kind": "method",
              "line": 88
            },
            {
              "name": "updateTest",
              "kind": "method",
              "line": 96
            },
            {
              "name": "updateTests",
              "kind": "method",
              "line": 110
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
        "../pagination.js",
        "../schemas.js",
        "../types.js",
        "../url.js",
        "../validation.js",
        "./list.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllGroupsOptions",
          "kind": "type",
          "line": 12,
          "exported": true,
          "signature": "export type GetAllGroupsOptions = PaginationSafetyOptions"
        },
        {
          "name": "GroupPaginationControls",
          "kind": "interface",
          "line": 14,
          "exported": false,
          "signature": "interface GroupPaginationControls { limit?: number; offset?: number; }"
        },
        {
          "name": "GROUPS_PAGINATION",
          "kind": "const",
          "line": 19,
          "exported": true,
          "signature": "export const GROUPS_PAGINATION = createPaginatedListExecutor< undefined, GroupPaginationControls, GetAllGroupsOptions, Group >({ operations: ['get_groups'], collectionKey: 'groups', itemSchema: GroupS…"
        },
        {
          "name": "EMAIL_REGEX",
          "kind": "const",
          "line": 40,
          "exported": false,
          "signature": "const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+$/"
        },
        {
          "name": "UsersModule",
          "kind": "class",
          "line": 42,
          "exported": true,
          "signature": "export class UsersModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 43
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 46
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 56
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 66
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 88
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 97
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 107
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 118
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 128
            },
            {
              "name": "getGroupsPage",
              "kind": "method",
              "line": 133
            },
            {
              "name": "getAllGroups",
              "kind": "method",
              "line": 138
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 143
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 153
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 167
            }
          ]
        }
      ]
    },
    {
      "path": "src/modules/variables.ts",
      "imports": [
        "../client-core.js",
        "../pagination.js",
        "../schemas.js",
        "../validation.js",
        "./paginated-list.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "GetAllVariablesOptions",
          "kind": "type",
          "line": 8,
          "exported": true,
          "signature": "export type GetAllVariablesOptions = PaginationSafetyOptions"
        },
        {
          "name": "VariablePaginationControls",
          "kind": "interface",
          "line": 10,
          "exported": false,
          "signature": "interface VariablePaginationControls { limit?: number; offset?: number; }"
        },
        {
          "name": "VARIABLES_PAGINATION",
          "kind": "const",
          "line": 15,
          "exported": true,
          "signature": "export const VARIABLES_PAGINATION = createPaginatedListExecutor< { readonly projectId: number }, VariablePaginationControls, GetAllVariablesOptions, Variable >({ operations: ['get_variables'], collect…"
        },
        {
          "name": "VariableModule",
          "kind": "class",
          "line": 35,
          "exported": true,
          "signature": "export class VariableModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 36
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 39
            },
            {
              "name": "getVariablesPage",
              "kind": "method",
              "line": 44
            },
            {
              "name": "getAllVariables",
              "kind": "method",
              "line": 49
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 54
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 65
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 76
            }
          ]
        }
      ]
    },
    {
      "path": "src/pagination.ts",
      "imports": [
        "./constants.js",
        "./errors.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PageLinks",
          "kind": "interface",
          "line": 13,
          "exported": true,
          "signature": "export interface PageLinks { next: string | null; prev: string | null; }"
        },
        {
          "name": "Page",
          "kind": "type",
          "line": 19,
          "exported": true,
          "signature": "export type Page<T> = | { kind: 'envelope'; items: T[]; offset: number; limit: number; size: number; _links: PageLinks; } | { kind: 'legacy-array'; items: T[]; size: number; }"
        },
        {
          "name": "PaginationErrorReason",
          "kind": "type",
          "line": 34,
          "exported": true,
          "signature": "export type PaginationErrorReason = 'max_pages' | 'max_items' | 'max_duration' | 'max_bytes' | 'invalid_page' | 'invalid_continuation' | 'non_progress'"
        },
        {
          "name": "PaginationSafetyOptions",
          "kind": "interface",
          "line": 38,
          "exported": true,
          "signature": "export interface PaginationSafetyOptions { maxPages?: number; maxItems?: number; maxDurationMs?: number; maxBytes?: number; }"
        },
        {
          "name": "PaginatedRequestOptions",
          "kind": "interface",
          "line": 46,
          "exported": true,
          "signature": "export interface PaginatedRequestOptions extends PaginationSafetyOptions { pageSize?: number; startOffset?: number; }"
        },
        {
          "name": "PaginationRequest",
          "kind": "interface",
          "line": 52,
          "exported": true,
          "signature": "export interface PaginationRequest { readonly offset: number | undefined; readonly limit: number | undefined; readonly bypassCache: true; readonly deadlineAt: number; readonly remainingTimeMs: number;…"
        },
        {
          "name": "PaginationContinuation",
          "kind": "interface",
          "line": 61,
          "exported": true,
          "signature": "export interface PaginationContinuation { readonly offset: number; readonly limit: number | undefined; }"
        },
        {
          "name": "CollectionStats",
          "kind": "interface",
          "line": 66,
          "exported": false,
          "signature": "interface CollectionStats { readonly pagesFetched: number; readonly itemsFetched: number; }"
        },
        {
          "name": "ControlledCollectionOptions",
          "kind": "interface",
          "line": 71,
          "exported": false,
          "signature": "interface ControlledCollectionOptions<T> extends PaginatedRequestOptions { readonly requestControls?: true; readonly fetchPage: (request: PaginationRequest) => Promise<Page<T>>; readonly now?: () => n…"
        },
        {
          "name": "EnvelopeOnlyCollectionOptions",
          "kind": "interface",
          "line": 78,
          "exported": false,
          "signature": "interface EnvelopeOnlyCollectionOptions<T> extends PaginationSafetyOptions { readonly requestControls: false; readonly pageSize?: never; readonly startOffset?: never; readonly fetchPage: (request: Pag…"
        },
        {
          "name": "CollectAllPagesOptions",
          "kind": "type",
          "line": 87,
          "exported": true,
          "signature": "export type CollectAllPagesOptions<T> = ControlledCollectionOptions<T> | EnvelopeOnlyCollectionOptions<T>"
        },
        {
          "name": "ResolvedCollectionOptions",
          "kind": "interface",
          "line": 89,
          "exported": false,
          "signature": "interface ResolvedCollectionOptions { readonly requestControls: boolean; readonly pageSize: number | undefined; readonly startOffset: number | undefined; readonly maxPages: number; readonly maxItems: …"
        },
        {
          "name": "PAGINATION_METADATA_KEYS",
          "kind": "const",
          "line": 99,
          "exported": false,
          "signature": "const PAGINATION_METADATA_KEYS = ['offset', 'limit', 'size', '_links'] as const"
        },
        {
          "name": "isRecord",
          "kind": "function",
          "line": 101,
          "exported": false,
          "signature": "function isRecord(value: unknown): value is Record<string, unknown>"
        },
        {
          "name": "hasPaginationMetadataSignature",
          "kind": "function",
          "line": 105,
          "exported": false,
          "signature": "function hasPaginationMetadataSignature(value: unknown): boolean"
        },
        {
          "name": "isNonNegativeInteger",
          "kind": "function",
          "line": 112,
          "exported": false,
          "signature": "function isNonNegativeInteger(value: unknown): value is number"
        },
        {
          "name": "isPositiveInteger",
          "kind": "function",
          "line": 116,
          "exported": false,
          "signature": "function isPositiveInteger(value: unknown): value is number"
        },
        {
          "name": "invalidPage",
          "kind": "function",
          "line": 120,
          "exported": false,
          "signature": "function invalidPage(message: string, stats: CollectionStats = { pagesFetched: 0, itemsFetched: 0 }): never"
        },
        {
          "name": "decodeEnvelope",
          "kind": "function",
          "line": 124,
          "exported": false,
          "signature": "function decodeEnvelope<T>(key: string, raw: Record<string, unknown>, stats?: CollectionStats): Page<T>"
        },
        {
          "name": "decodePage",
          "kind": "function",
          "line": 177,
          "exported": true,
          "signature": "export function decodePage<T>(key: string, raw: unknown, stats?: CollectionStats): Page<T>"
        },
        {
          "name": "decodeNestedPage",
          "kind": "function",
          "line": 194,
          "exported": true,
          "signature": "export function decodeNestedPage<T>(key: string, raw: unknown, stats?: CollectionStats): Page<T>"
        },
        {
          "name": "parseCanonicalInteger",
          "kind": "function",
          "line": 221,
          "exported": false,
          "signature": "function parseCanonicalInteger(values: string[], name: string, allowZero: boolean, stats: CollectionStats): number"
        },
        {
          "name": "parsePaginationContinuation",
          "kind": "function",
          "line": 256,
          "exported": true,
          "signature": "export function parsePaginationContinuation( next: string, stats: CollectionStats = { pagesFetched: 0, itemsFetched: 0 }, ): PaginationContinuation"
        },
        {
          "name": "validatePositiveBound",
          "kind": "function",
          "line": 304,
          "exported": false,
          "signature": "function validatePositiveBound(value: number, name: string, maximum?: number): void"
        },
        {
          "name": "defaultWhenUndefined",
          "kind": "function",
          "line": 311,
          "exported": false,
          "signature": "function defaultWhenUndefined<T>(value: T | undefined, fallback: T): T"
        },
        {
          "name": "resolveCollectionOptions",
          "kind": "function",
          "line": 316,
          "exported": false,
          "signature": "function resolveCollectionOptions<T>(options: CollectAllPagesOptions<T>): ResolvedCollectionOptions"
        },
        {
          "name": "serializedByteLength",
          "kind": "function",
          "line": 337,
          "exported": false,
          "signature": "function serializedByteLength(items: readonly unknown[], stats: CollectionStats): number"
        },
        {
          "name": "appendPageItems",
          "kind": "function",
          "line": 345,
          "exported": false,
          "signature": "function appendPageItems<T>(target: T[], pageItems: readonly T[]): void"
        },
        {
          "name": "policyError",
          "kind": "function",
          "line": 349,
          "exported": false,
          "signature": "function policyError( reason: PaginationErrorReason, message: string, stats: CollectionStats, context: Readonly<Record<string, string | number | boolean | null>> = {}, ): never"
        },
        {
          "name": "collectAllPages",
          "kind": "function",
          "line": 363,
          "exported": true,
          "signature": "export async function collectAllPages<T>(options: CollectAllPagesOptions<T>): Promise<T[]>"
        }
      ]
    },
    {
      "path": "src/request-cache.ts",
      "imports": [
        "./types.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RequestCacheOptions",
          "kind": "interface",
          "line": 3,
          "exported": true,
          "signature": "export interface RequestCacheOptions { readonly enableStorage: boolean; readonly ttlMs: number; readonly cleanupIntervalMs: number; readonly maxEntries: number; }"
        },
        {
          "name": "CacheLoadResult",
          "kind": "interface",
          "line": 10,
          "exported": true,
          "signature": "export interface CacheLoadResult<T> { readonly value: T; readonly cacheable: boolean; }"
        },
        {
          "name": "CacheResolution",
          "kind": "interface",
          "line": 15,
          "exported": true,
          "signature": "export interface CacheResolution<T> { readonly key: string | undefined; readonly shareInFlight: boolean; readonly wait: (promise: Promise<T>) => Promise<T>; readonly load: () => Promise<CacheLoadResul…"
        },
        {
          "name": "RequestCache",
          "kind": "class",
          "line": 36,
          "exported": true,
          "signature": "export class RequestCache",
          "members": [
            {
              "name": "entries",
              "kind": "property",
              "line": 37
            },
            {
              "name": "pending",
              "kind": "property",
              "line": 38
            },
            {
              "name": "generation",
              "kind": "property",
              "line": 39
            },
            {
              "name": "cleanupTimer",
              "kind": "property",
              "line": 40
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 42
            },
            {
              "name": "resolve",
              "kind": "method",
              "line": 53
            },
            {
              "name": "invalidate",
              "kind": "method",
              "line": 106
            },
            {
              "name": "dispose",
              "kind": "method",
              "line": 113
            },
            {
              "name": "read",
              "kind": "method",
              "line": 121
            },
            {
              "name": "write",
              "kind": "method",
              "line": 141
            },
            {
              "name": "removeExpiredEntries",
              "kind": "method",
              "line": 160
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
        "./schemas/bdd.js",
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
          "line": 82,
          "exported": true,
          "signature": "export type Attachment = KnownResponse<typeof AttachmentSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/bdd.ts",
      "imports": [
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "BddSchema",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const BddSchema = z.record(z.string(), z.unknown())"
        },
        {
          "name": "Bdd",
          "kind": "type",
          "line": 14,
          "exported": true,
          "signature": "export type Bdd = z.infer<typeof BddSchema>"
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
          "line": 45,
          "exported": true,
          "signature": "export type Case = KnownResponse<typeof CaseSchema>"
        },
        {
          "name": "CaseTitleSchema",
          "kind": "const",
          "line": 48,
          "exported": true,
          "signature": "export const CaseTitleSchema = zObject({ id: z.number(), title: z.string(), })"
        },
        {
          "name": "CaseTitle",
          "kind": "type",
          "line": 53,
          "exported": true,
          "signature": "export type CaseTitle = KnownResponse<typeof CaseTitleSchema>"
        },
        {
          "name": "HistoryChangeSchema",
          "kind": "const",
          "line": 59,
          "exported": true,
          "signature": "export const HistoryChangeSchema = zObject({ field: z.string().nullish(), type_id: z.number().nullish(), old_text: z.string().nullish(), new_text: z.string().nullish(), label: z.string().nullish(), op…"
        },
        {
          "name": "HistoryEntrySchema",
          "kind": "const",
          "line": 94,
          "exported": true,
          "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 108,
          "exported": true,
          "signature": "export type HistoryEntry = KnownResponse<typeof HistoryEntrySchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 112,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 125,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 127,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ section_id: z.number().optional(), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.num…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 141,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "AddCasesBulkPayloadSchema",
          "kind": "const",
          "line": 151,
          "exported": true,
          "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
        },
        {
          "name": "AddCasesBulkPayload",
          "kind": "type",
          "line": 153,
          "exported": true,
          "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>"
        },
        {
          "name": "UpdateCasesPayloadSchema",
          "kind": "const",
          "line": 161,
          "exported": true,
          "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), section_id: z.number().optional(), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number(…"
        },
        {
          "name": "UpdateCasesPayload",
          "kind": "type",
          "line": 176,
          "exported": true,
          "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>"
        },
        {
          "name": "DeleteCasesPayloadSchema",
          "kind": "const",
          "line": 185,
          "exported": true,
          "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
        },
        {
          "name": "DeleteCasesPayload",
          "kind": "type",
          "line": 193,
          "exported": true,
          "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>"
        },
        {
          "name": "SoftDeletePreviewSchema",
          "kind": "const",
          "line": 206,
          "exported": true,
          "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().nullish(), affected_cases: z.number().nullish(), affected_sections: z.number().nullish(), affected_runs: z.number().nullish(…"
        },
        {
          "name": "SoftDeletePreview",
          "kind": "type",
          "line": 216,
          "exported": true,
          "signature": "export type SoftDeletePreview = KnownResponse<typeof SoftDeletePreviewSchema>"
        },
        {
          "name": "CopyCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 221,
          "exported": true,
          "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
        },
        {
          "name": "CopyCasesToSectionPayload",
          "kind": "type",
          "line": 225,
          "exported": true,
          "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>"
        },
        {
          "name": "MoveCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 233,
          "exported": true,
          "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
        },
        {
          "name": "MoveCasesToSectionPayload",
          "kind": "type",
          "line": 238,
          "exported": true,
          "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/common.ts",
      "imports": [
        "../constants.js",
        "../types.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "zObject",
          "kind": "const",
          "line": 12,
          "exported": true,
          "signature": "export const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough()"
        },
        {
          "name": "ShallowKnownObject",
          "kind": "type",
          "line": 14,
          "exported": false,
          "signature": "type ShallowKnownObject<TShape extends z.ZodRawShape> = z.output<z.ZodObject<TShape>>"
        },
        {
          "name": "OptionalObjectKeys",
          "kind": "type",
          "line": 16,
          "exported": false,
          "signature": "type OptionalObjectKeys<TShape extends z.ZodRawShape> = { [TKey in keyof ShallowKnownObject<TShape>]-?: object extends Pick<ShallowKnownObject<TShape>, TKey> ? TKey : never; }[keyof ShallowKnownObject…"
        },
        {
          "name": "KnownObject",
          "kind": "type",
          "line": 20,
          "exported": false,
          "signature": "type KnownObject<TShape extends z.ZodRawShape> = { [TKey in Exclude<keyof TShape, OptionalObjectKeys<TShape>>]: KnownResponseValue<TShape[TKey]>; } & { [TKey in Extract<keyof TShape, OptionalObjectKey…"
        },
        {
          "name": "KnownRecord",
          "kind": "type",
          "line": 26,
          "exported": false,
          "signature": "type KnownRecord<TOutput, TValue extends z.core.SomeType> = { [TKey in keyof TOutput]: KnownResponseValue<TValue>; }"
        },
        {
          "name": "KnownResponseValue",
          "kind": "type",
          "line": 31,
          "exported": false,
          "signature": "type KnownResponseValue<TSchema extends z.core.SomeType> = TSchema extends z.ZodOptional<infer TInner> ? KnownResponseValue<TInner> | undefined : TSchema extends z.ZodNullable<infer TInner> ? KnownRes…"
        },
        {
          "name": "KnownResponse",
          "kind": "type",
          "line": 53,
          "exported": true,
          "signature": "export type KnownResponse<TSchema extends z.ZodObject> = KnownObject<TSchema['shape']>"
        },
        {
          "name": "PaginationRequestSchema",
          "kind": "const",
          "line": 69,
          "exported": true,
          "signature": "export const PaginationRequestSchema = zObject({ limit: z.number().int().positive().max(MAX_PAGINATION_LIMIT).optional(), offset: z.number().int().nonnegative().optional(), })"
        },
        {
          "name": "PaginationSchema",
          "kind": "const",
          "line": 80,
          "exported": true,
          "signature": "export const PaginationSchema = zObject({ limit: z.number().optional(), offset: z.number().optional(), })"
        },
        {
          "name": "TestRailConfigSchemaShape",
          "kind": "type",
          "line": 94,
          "exported": false,
          "signature": "type TestRailConfigSchemaShape = { [TKey in keyof TestRailConfig]-?: z.ZodType<TestRailConfig[TKey]>; }"
        },
        {
          "name": "testRailConfigShape",
          "kind": "const",
          "line": 98,
          "exported": false,
          "signature": "const testRailConfigShape = { baseUrl: z.string().url(), email: z.string().regex(TESTRAIL_CONFIG_EMAIL_PATTERN), apiKey: z.string().min(1), timeout: z.number().positive().max(MAX_TIMEOUT_MS).optional(…"
        },
        {
          "name": "TestRailConfigSchema",
          "kind": "const",
          "line": 135,
          "exported": true,
          "signature": "export const TestRailConfigSchema = zObject(testRailConfigShape)"
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
          "signature": "export type Configuration = KnownResponse<typeof ConfigurationSchema>"
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
          "signature": "export type ConfigurationGroup = KnownResponse<typeof ConfigurationGroupSchema>"
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
          "signature": "export type DatasetVariable = KnownResponse<typeof DatasetVariableSchema>"
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
          "signature": "export type Dataset = KnownResponse<typeof DatasetSchema>"
        },
        {
          "name": "DatasetVariablesPayloadSchema",
          "kind": "const",
          "line": 55,
          "exported": false,
          "signature": "const DatasetVariablesPayloadSchema = z.record(z.string(), z.string())"
        },
        {
          "name": "AddDatasetPayloadSchema",
          "kind": "const",
          "line": 57,
          "exported": true,
          "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), variables: DatasetVariablesPayloadSchema.optional(), })"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "type",
          "line": 62,
          "exported": true,
          "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>"
        },
        {
          "name": "UpdateDatasetPayloadSchema",
          "kind": "const",
          "line": 70,
          "exported": true,
          "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), variables: DatasetVariablesPayloadSchema.optional(), })"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "type",
          "line": 75,
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
          "signature": "export const LabelSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.union([z.number(), z.string()]).nullish(), created_on: z.number().nullish(),…"
        },
        {
          "name": "Label",
          "kind": "type",
          "line": 39,
          "exported": true,
          "signature": "export type Label = KnownResponse<typeof LabelSchema>"
        },
        {
          "name": "LabelWriteResponseSchema",
          "kind": "const",
          "line": 51,
          "exported": true,
          "signature": "export const LabelWriteResponseSchema = z.union([ LabelSchema, zObject({ label: LabelSchema }).transform((response) => response.label), ])"
        },
        {
          "name": "AddLabelPayloadSchema",
          "kind": "const",
          "line": 61,
          "exported": true,
          "signature": "export const AddLabelPayloadSchema = zObject({ title: z.string(), })"
        },
        {
          "name": "AddLabelPayload",
          "kind": "type",
          "line": 65,
          "exported": true,
          "signature": "export type AddLabelPayload = z.infer<typeof AddLabelPayloadSchema>"
        },
        {
          "name": "UpdateLabelPayloadSchema",
          "kind": "const",
          "line": 75,
          "exported": true,
          "signature": "export const UpdateLabelPayloadSchema = zObject({ project_id: z.number().int().positive(), title: z.string(), })"
        },
        {
          "name": "UpdateLabelPayload",
          "kind": "type",
          "line": 80,
          "exported": true,
          "signature": "export type UpdateLabelPayload = z.infer<typeof UpdateLabelPayloadSchema>"
        },
        {
          "name": "DeleteLabelsPayloadSchema",
          "kind": "const",
          "line": 83,
          "exported": true,
          "signature": "export const DeleteLabelsPayloadSchema = zObject({ label_ids: z.array(z.number().int().positive()).min(1), })"
        },
        {
          "name": "DeleteLabelsPayload",
          "kind": "type",
          "line": 87,
          "exported": true,
          "signature": "export type DeleteLabelsPayload = z.infer<typeof DeleteLabelsPayloadSchema>"
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
          "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.union([z.number(), z.string()]).nullish(), created_on: z.number().nu…"
        },
        {
          "name": "LabelEmbedded",
          "kind": "type",
          "line": 46,
          "exported": true,
          "signature": "export type LabelEmbedded = KnownResponse<typeof LabelEmbeddedSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 66,
          "exported": true,
          "signature": "export type Status = KnownResponse<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 68,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 76,
          "exported": true,
          "signature": "export type Priority = KnownResponse<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatusSchema",
          "kind": "const",
          "line": 83,
          "exported": true,
          "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string().nullish(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean().…"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 100,
          "exported": true,
          "signature": "export type CaseStatus = KnownResponse<typeof CaseStatusSchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 104,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string().nullish(), items: z.union([z.string(), z.array(z.unknown())]).nullish(), format: z.string().nullish(), ro…"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 125,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z.union([z.array(z.number()), z.string()]).nullish(), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 143,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ id: z.string().nullish(), context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 152,
          "exported": true,
          "signature": "export type CaseFieldConfig = KnownResponse<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 154,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 174,
          "exported": true,
          "signature": "export type CaseField = KnownResponse<typeof CaseFieldSchema>"
        },
        {
          "name": "AddCaseFieldResponseSchema",
          "kind": "const",
          "line": 195,
          "exported": true,
          "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
        },
        {
          "name": "AddCaseFieldResponse",
          "kind": "type",
          "line": 220,
          "exported": true,
          "signature": "export type AddCaseFieldResponse = KnownResponse<typeof AddCaseFieldResponseSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 222,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ id: z.string().nullish(), context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 230,
          "exported": true,
          "signature": "export type ResultFieldConfig = KnownResponse<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 232,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 250,
          "exported": true,
          "signature": "export type ResultField = KnownResponse<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 254,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), i18n_custom_id: z.string().nullish(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 262,
          "exported": true,
          "signature": "export type CaseType = KnownResponse<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 264,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), i18n_custom_id: z.string().nullish(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 272,
          "exported": true,
          "signature": "export type Template = KnownResponse<typeof TemplateSchema>"
        },
        {
          "name": "DynamicFilterFieldSchema",
          "kind": "const",
          "line": 282,
          "exported": true,
          "signature": "export const DynamicFilterFieldSchema = zObject({ type_id: z.number(), system_name: z.string(), label: z.string(), options: z.string().nullish(), sub_filters: z.string().nullish(), })"
        },
        {
          "name": "DynamicFilterField",
          "kind": "type",
          "line": 290,
          "exported": true,
          "signature": "export type DynamicFilterField = KnownResponse<typeof DynamicFilterFieldSchema>"
        },
        {
          "name": "DynamicFiltersPayloadSchema",
          "kind": "const",
          "line": 297,
          "exported": true,
          "signature": "export const DynamicFiltersPayloadSchema = zObject({ mode: z.string(), filters: z.record(z.string(), z.record(z.string(), z.unknown())), })"
        },
        {
          "name": "DynamicFiltersPayload",
          "kind": "type",
          "line": 302,
          "exported": true,
          "signature": "export type DynamicFiltersPayload = z.infer<typeof DynamicFiltersPayloadSchema>"
        },
        {
          "name": "TestRailVersionSchema",
          "kind": "const",
          "line": 305,
          "exported": true,
          "signature": "export const TestRailVersionSchema = zObject({ version: z.string(), })"
        },
        {
          "name": "TestRailVersion",
          "kind": "type",
          "line": 309,
          "exported": true,
          "signature": "export type TestRailVersion = KnownResponse<typeof TestRailVersionSchema>"
        },
        {
          "name": "AddCaseFieldConfigPayloadSchema",
          "kind": "const",
          "line": 326,
          "exported": true,
          "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.union([z.array(z.number().int().positive()), z.literal('')]), }), options: zObject({ …"
        },
        {
          "name": "AddCaseFieldConfigPayload",
          "kind": "type",
          "line": 340,
          "exported": true,
          "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>"
        },
        {
          "name": "AddCaseFieldPayloadSchema",
          "kind": "const",
          "line": 342,
          "exported": true,
          "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), is_indexed: z.boolean…"
        },
        {
          "name": "AddCaseFieldPayload",
          "kind": "type",
          "line": 353,
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
          "name": "MilestoneBaseSchema",
          "kind": "const",
          "line": 6,
          "exported": false,
          "signature": "const MilestoneBaseSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(), …"
        },
        {
          "name": "MilestoneBase",
          "kind": "type",
          "line": 33,
          "exported": false,
          "signature": "type MilestoneBase = z.output<z.ZodObject<typeof MilestoneBaseSchema.shape>>"
        },
        {
          "name": "MilestoneNode",
          "kind": "type",
          "line": 34,
          "exported": false,
          "signature": "type MilestoneNode = MilestoneBase & { milestones?: MilestoneNode[] | null | undefined }"
        },
        {
          "name": "MilestoneNodeSchema",
          "kind": "const",
          "line": 39,
          "exported": false,
          "signature": "const MilestoneNodeSchema: z.ZodType<MilestoneNode> = z.lazy(() => MilestoneSchema)"
        },
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 41,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ ...MilestoneBaseSchema.shape, milestones: z.array(MilestoneNodeSchema).nullish(), })"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 46,
          "exported": true,
          "signature": "export type Milestone = KnownResponse<typeof MilestoneSchema>"
        },
        {
          "name": "AddMilestonePayloadSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "type",
          "line": 59,
          "exported": true,
          "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>"
        },
        {
          "name": "UpdateMilestonePayloadSchema",
          "kind": "const",
          "line": 61,
          "exported": true,
          "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "type",
          "line": 72,
          "exported": true,
          "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/plans.ts",
      "imports": [
        "./common.js",
        "./metadata.js",
        "./runs.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 8,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 35,
          "exported": true,
          "signature": "export type PlanEntry = KnownResponse<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 37,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 80,
          "exported": true,
          "signature": "export type Plan = KnownResponse<typeof PlanSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 89,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 99,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 106,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), start_on: z.number().optional(), due_…"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 118,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 122,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(), inc…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 133,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 135,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: …"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 161,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 165,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_i…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 183,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 185,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(),…"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 198,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 200,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number…"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 212,
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
          "signature": "export type Project = KnownResponse<typeof ProjectSchema>"
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
          "name": "ProjectAccessRoleIdPayloadSchema",
          "kind": "const",
          "line": 71,
          "exported": false,
          "signature": "const ProjectAccessRoleIdPayloadSchema = z.number().int().nonnegative().nullable()"
        },
        {
          "name": "UpdateProjectGroupAssignmentPayloadSchema",
          "kind": "const",
          "line": 73,
          "exported": true,
          "signature": "export const UpdateProjectGroupAssignmentPayloadSchema = zObject({ id: z.number().int().positive(), role_id: ProjectAccessRoleIdPayloadSchema, })"
        },
        {
          "name": "UpdateProjectGroupAssignmentPayload",
          "kind": "type",
          "line": 78,
          "exported": true,
          "signature": "export type UpdateProjectGroupAssignmentPayload = z.infer<typeof UpdateProjectGroupAssignmentPayloadSchema>"
        },
        {
          "name": "UpdateProjectUserAssignmentPayloadSchema",
          "kind": "const",
          "line": 84,
          "exported": true,
          "signature": "export const UpdateProjectUserAssignmentPayloadSchema = z.union([ zObject({ id: z.number().int().positive(), user_id: z.never().optional(), role_id: ProjectAccessRoleIdPayloadSchema, }), zObject({ id:…"
        },
        {
          "name": "UpdateProjectUserAssignmentPayload",
          "kind": "type",
          "line": 97,
          "exported": true,
          "signature": "export type UpdateProjectUserAssignmentPayload = z.infer<typeof UpdateProjectUserAssignmentPayloadSchema>"
        },
        {
          "name": "UpdateProjectPayloadSchema",
          "kind": "const",
          "line": 99,
          "exported": true,
          "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), defa…"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "type",
          "line": 109,
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
          "line": 34,
          "exported": true,
          "signature": "export type Report = KnownResponse<typeof ReportSchema>"
        },
        {
          "name": "CrossProjectReportSchema",
          "kind": "const",
          "line": 49,
          "exported": true,
          "signature": "export const CrossProjectReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_ids: z.array(z.number()), user_ids: z.array(z.number()).nullish(), includ…"
        },
        {
          "name": "CrossProjectReport",
          "kind": "type",
          "line": 74,
          "exported": true,
          "signature": "export type CrossProjectReport = KnownResponse<typeof CrossProjectReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 87,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), report_html: z.string().nullish(), report_pdf: z.string().nullish(), user_report_url: z.string().nullish(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 94,
          "exported": true,
          "signature": "export type ReportResult = KnownResponse<typeof ReportResultSchema>"
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
          "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number().nullable(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish()…"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 54,
          "exported": true,
          "signature": "export type Result = KnownResponse<typeof ResultSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 68,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 85,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "EditResultPayloadSchema",
          "kind": "const",
          "line": 94,
          "exported": true,
          "signature": "export const EditResultPayloadSchema = zObject({ status_id: z.number().optional(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().o…"
        },
        {
          "name": "EditResultPayload",
          "kind": "type",
          "line": 106,
          "exported": true,
          "signature": "export type EditResultPayload = z.infer<typeof EditResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 111,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 122,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 124,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 128,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "AddResultForTestPayloadSchema",
          "kind": "const",
          "line": 134,
          "exported": true,
          "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForTestPayload",
          "kind": "type",
          "line": 145,
          "exported": true,
          "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>"
        },
        {
          "name": "AddResultsPayloadSchema",
          "kind": "const",
          "line": 147,
          "exported": true,
          "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
        },
        {
          "name": "AddResultsPayload",
          "kind": "type",
          "line": 151,
          "exported": true,
          "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>"
        }
      ]
    },
    {
      "path": "src/schemas/runs.ts",
      "imports": [
        "./common.js",
        "./metadata.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 7,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 68,
          "exported": true,
          "signature": "export type Run = KnownResponse<typeof RunSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 72,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 86,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 88,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 101,
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
          "signature": "export type Section = KnownResponse<typeof SectionSchema>"
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
          "signature": "export type SharedStep = KnownResponse<typeof SharedStepSchema>"
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
          "line": 97,
          "exported": true,
          "signature": "export const StepHistoryEntrySchema = zObject({ id: z.union([z.number(), z.string()]), title: z.string().nullish(), timestamp: z.number().nullish(), user_id: z.union([z.number(), z.string()]).nullish(…"
        },
        {
          "name": "StepHistoryEntry",
          "kind": "type",
          "line": 105,
          "exported": true,
          "signature": "export type StepHistoryEntry = KnownResponse<typeof StepHistoryEntrySchema>"
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
          "signature": "export type Suite = KnownResponse<typeof SuiteSchema>"
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
        "./attachments.js",
        "./common.js",
        "./metadata.js",
        "./results.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 9,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 47,
          "exported": true,
          "signature": "export type Test = KnownResponse<typeof TestSchema>"
        },
        {
          "name": "TestWithDataResponseSchema",
          "kind": "const",
          "line": 50,
          "exported": true,
          "signature": "export const TestWithDataResponseSchema = zObject({ test: TestSchema, results: z .array(ResultSchema) .nullish() .transform((items) => items ?? []), attachments: z .array(AttachmentSchema) .nullish() …"
        },
        {
          "name": "TestWithDataResponse",
          "kind": "type",
          "line": 62,
          "exported": true,
          "signature": "export type TestWithDataResponse = z.infer<typeof TestWithDataResponseSchema>"
        },
        {
          "name": "UpdateTestLabelsPayloadSchema",
          "kind": "const",
          "line": 74,
          "exported": true,
          "signature": "export const UpdateTestLabelsPayloadSchema = zObject({ labels: z.array(z.union([z.number(), z.string()])), })"
        },
        {
          "name": "UpdateTestLabelsPayload",
          "kind": "type",
          "line": 78,
          "exported": true,
          "signature": "export type UpdateTestLabelsPayload = z.infer<typeof UpdateTestLabelsPayloadSchema>"
        },
        {
          "name": "UpdateTestsLabelsPayloadSchema",
          "kind": "const",
          "line": 85,
          "exported": true,
          "signature": "export const UpdateTestsLabelsPayloadSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(z.union([z.number(), z.string()])), })"
        },
        {
          "name": "UpdateTestsLabelsPayload",
          "kind": "type",
          "line": 90,
          "exported": true,
          "signature": "export type UpdateTestsLabelsPayload = z.infer<typeof UpdateTestsLabelsPayloadSchema>"
        },
        {
          "name": "UpdateTestsResponseSchema",
          "kind": "const",
          "line": 104,
          "exported": true,
          "signature": "export const UpdateTestsResponseSchema = zObject({ test_ids: z.array(z.number()), labels: z.array(LabelEmbeddedSchema), })"
        },
        {
          "name": "UpdateTestsResponse",
          "kind": "type",
          "line": 109,
          "exported": true,
          "signature": "export type UpdateTestsResponse = KnownResponse<typeof UpdateTestsResponseSchema>"
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
          "line": 40,
          "exported": true,
          "signature": "export type User = KnownResponse<typeof UserSchema>"
        },
        {
          "name": "RoleSchema",
          "kind": "const",
          "line": 42,
          "exported": true,
          "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), is_project_admin: z.boolean().nullish(), })"
        },
        {
          "name": "Role",
          "kind": "type",
          "line": 51,
          "exported": true,
          "signature": "export type Role = KnownResponse<typeof RoleSchema>"
        },
        {
          "name": "GroupSchema",
          "kind": "const",
          "line": 53,
          "exported": true,
          "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
        },
        {
          "name": "Group",
          "kind": "type",
          "line": 59,
          "exported": true,
          "signature": "export type Group = KnownResponse<typeof GroupSchema>"
        },
        {
          "name": "AddGroupPayloadSchema",
          "kind": "const",
          "line": 74,
          "exported": true,
          "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "AddGroupPayload",
          "kind": "type",
          "line": 79,
          "exported": true,
          "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>"
        },
        {
          "name": "UpdateGroupPayloadSchema",
          "kind": "const",
          "line": 81,
          "exported": true,
          "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "type",
          "line": 86,
          "exported": true,
          "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>"
        },
        {
          "name": "UserAddPayloadSchema",
          "kind": "const",
          "line": 102,
          "exported": true,
          "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), is_active: z.boolean().optional(), is_admin: z.boolean().optional(), role_id: z.number().int().positiv…"
        },
        {
          "name": "UserAddPayload",
          "kind": "type",
          "line": 115,
          "exported": true,
          "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>"
        },
        {
          "name": "UserUpdatePayloadSchema",
          "kind": "const",
          "line": 117,
          "exported": true,
          "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), is_active: z.boolean().optional(), is_admin: z.boolean().optional(), role_id:…"
        },
        {
          "name": "UserUpdatePayload",
          "kind": "type",
          "line": 130,
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
          "signature": "export type Variable = KnownResponse<typeof VariableSchema>"
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
        "./schemas.js",
        "./schemas/common.js",
        "zod"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "CustomFieldAccess",
          "kind": "type",
          "line": 36,
          "exported": false,
          "signature": "type CustomFieldAccess = { [key: `custom_${string}`]: unknown;\n}"
        },
        {
          "name": "ResponseWithCustomFields",
          "kind": "type",
          "line": 40,
          "exported": false,
          "signature": "type ResponseWithCustomFields< TSchema extends z.ZodObject, TKnown extends KnownResponse<TSchema> = KnownResponse<TSchema>, > = TKnown extends { custom_fields?: infer TCustomFields } ? Omit<TKnown, 'c…"
        },
        {
          "name": "SchemaMismatch",
          "kind": "interface",
          "line": 65,
          "exported": true,
          "signature": "export interface SchemaMismatch { method: string; endpoint: string; error: ZodError; data: unknown; }"
        },
        {
          "name": "TestRailConfig",
          "kind": "interface",
          "line": 102,
          "exported": true,
          "signature": "export interface TestRailConfig { baseUrl: string; email: string; apiKey: string; timeout?: number; maxRetries?: number; enableCache?: boolean; cacheTtl?: number; cacheCleanupInterval?: number; maxCac…"
        },
        {
          "name": "UploadFilePathInput",
          "kind": "interface",
          "line": 281,
          "exported": true,
          "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }"
        },
        {
          "name": "UploadFileInput",
          "kind": "type",
          "line": 299,
          "exported": true,
          "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput"
        },
        {
          "name": "Case",
          "kind": "type",
          "line": 301,
          "exported": true,
          "signature": "export type Case = ResponseWithCustomFields<typeof CaseSchema>"
        },
        {
          "name": "Suite",
          "kind": "type",
          "line": 303,
          "exported": true,
          "signature": "export type Suite = KnownResponse<typeof SuiteSchema>"
        },
        {
          "name": "Section",
          "kind": "type",
          "line": 308,
          "exported": true,
          "signature": "export type Section = KnownResponse<typeof SectionSchema>"
        },
        {
          "name": "Project",
          "kind": "type",
          "line": 310,
          "exported": true,
          "signature": "export type Project = KnownResponse<typeof ProjectSchema>"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 312,
          "exported": true,
          "signature": "export type Plan = KnownResponse<typeof PlanSchema>"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 314,
          "exported": true,
          "signature": "export type PlanEntry = KnownResponse<typeof PlanEntrySchema>"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 316,
          "exported": true,
          "signature": "export type Run = KnownResponse<typeof RunSchema>"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 318,
          "exported": true,
          "signature": "export type Test = ResponseWithCustomFields<typeof TestSchema>"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 320,
          "exported": true,
          "signature": "export type Result = ResponseWithCustomFields<typeof ResultSchema>"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 322,
          "exported": true,
          "signature": "export type Milestone = KnownResponse<typeof MilestoneSchema>"
        },
        {
          "name": "User",
          "kind": "type",
          "line": 324,
          "exported": true,
          "signature": "export type User = KnownResponse<typeof UserSchema>"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 326,
          "exported": true,
          "signature": "export type Status = KnownResponse<typeof StatusSchema>"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 328,
          "exported": true,
          "signature": "export type Priority = KnownResponse<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 330,
          "exported": true,
          "signature": "export type CaseStatus = KnownResponse<typeof CaseStatusSchema>"
        },
        {
          "name": "HistoryChange",
          "kind": "type",
          "line": 332,
          "exported": true,
          "signature": "export type HistoryChange = KnownResponse<typeof HistoryChangeSchema>"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 334,
          "exported": true,
          "signature": "export type HistoryEntry = KnownResponse<typeof HistoryEntrySchema>"
        },
        {
          "name": "SoftDeleteOptions",
          "kind": "interface",
          "line": 351,
          "exported": true,
          "signature": "export interface SoftDeleteOptions { soft?: boolean; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 360,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number | readonly number[]; priorityId?: number | readonly number[]; templateId?: number | readonly number[]; mileston…"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 411,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; includePlanRuns?: boolean; isCompleted?: boolean; milestoneId?: number | readonly number[]; refs?…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 440,
          "exported": true,
          "signature": "export type ResultFieldConfig = KnownResponse<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 442,
          "exported": true,
          "signature": "export type ResultField = KnownResponse<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 447,
          "exported": true,
          "signature": "export type CaseFieldConfig = KnownResponse<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 450,
          "exported": true,
          "signature": "export type CaseField = KnownResponse<typeof CaseFieldSchema>"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 453,
          "exported": true,
          "signature": "export type CaseType = KnownResponse<typeof CaseTypeSchema>"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 458,
          "exported": true,
          "signature": "export type Template = KnownResponse<typeof TemplateSchema>"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 463,
          "exported": true,
          "signature": "export type Configuration = KnownResponse<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 466,
          "exported": true,
          "signature": "export type ConfigurationGroup = KnownResponse<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 473,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 478,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 490,
          "exported": true,
          "signature": "export interface GetPlansOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number[]; refs?: string; limit?: number; offset?: number; c…"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 522,
          "exported": true,
          "signature": "export interface GetTestsOptions { statusId?: number[]; labelId?: number[]; limit?: number; offset?: number; status_id?: number[]; label_id?: number[]; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 538,
          "exported": true,
          "signature": "export interface GetResultsOptions { statusId?: number[]; defectsFilter?: string; limit?: number; offset?: number; status_id?: number[]; defects_filter?: string; }"
        },
        {
          "name": "GetResultsForRunOptions",
          "kind": "interface",
          "line": 557,
          "exported": true,
          "signature": "export interface GetResultsForRunOptions extends GetResultsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; created_after?: number; created_before?: number; created_by?: …"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 575,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { isCompleted?: boolean; isStarted?: boolean; limit?: number; offset?: number; is_completed?: 0 | 1; is_started?: 0 | 1; }"
        },
        {
          "name": "Role",
          "kind": "type",
          "line": 593,
          "exported": true,
          "signature": "export type Role = KnownResponse<typeof RoleSchema>"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 621,
          "exported": true,
          "signature": "export type Attachment = KnownResponse<typeof AttachmentSchema>"
        },
        {
          "name": "TestWithData",
          "kind": "type",
          "line": 624,
          "exported": true,
          "signature": "export type TestWithData = Test & { results: Result[]; attachments: Attachment[]; }"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 658,
          "exported": true,
          "signature": "export type Report = KnownResponse<typeof ReportSchema>"
        },
        {
          "name": "CrossProjectReport",
          "kind": "type",
          "line": 661,
          "exported": true,
          "signature": "export type CrossProjectReport = KnownResponse<typeof CrossProjectReportSchema>"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 671,
          "exported": true,
          "signature": "export type ReportResult = KnownResponse<typeof ReportResultSchema>"
        }
      ]
    },
    {
      "path": "src/url.ts",
      "imports": [],
      "reExports": [],
      "symbols": [
        {
          "name": "EndpointParam",
          "kind": "type",
          "line": 8,
          "exported": false,
          "signature": "type EndpointParam = string | number"
        },
        {
          "name": "EndpointParamValue",
          "kind": "type",
          "line": 9,
          "exported": false,
          "signature": "type EndpointParamValue = EndpointParam | readonly EndpointParam[] | undefined"
        },
        {
          "name": "buildEndpoint",
          "kind": "function",
          "line": 11,
          "exported": true,
          "signature": "export function buildEndpoint(base: string, params: Readonly<Record<string, EndpointParamValue>> = {}): string"
        }
      ]
    },
    {
      "path": "src/utils.ts",
      "imports": [
        "./validation.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "base64Encode",
          "kind": "function",
          "line": 4,
          "exported": true,
          "signature": "export function base64Encode(str: string): string"
        },
        {
          "name": "sleep",
          "kind": "function",
          "line": 15,
          "exported": true,
          "signature": "export function sleep(ms: number, signal?: globalThis.AbortSignal): Promise<void>"
        },
        {
          "name": "serializeIdList",
          "kind": "function",
          "line": 43,
          "exported": true,
          "signature": "export function serializeIdList(ids?: readonly number[]): string | undefined"
        },
        {
          "name": "serializeIdFilter",
          "kind": "function",
          "line": 52,
          "exported": true,
          "signature": "export function serializeIdFilter( value: number | readonly number[] | undefined, name: string, ): string | number | undefined"
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
          "name": "validateTimeout",
          "kind": "function",
          "line": 25,
          "exported": true,
          "signature": "export function validateTimeout(ms: number): void"
        },
        {
          "name": "validateId",
          "kind": "function",
          "line": 35,
          "exported": true,
          "signature": "export function validateId(id: number, name: string): void"
        },
        {
          "name": "validateEntryId",
          "kind": "function",
          "line": 48,
          "exported": true,
          "signature": "export function validateEntryId(entryId: string): void"
        },
        {
          "name": "validateAttachmentId",
          "kind": "function",
          "line": 66,
          "exported": true,
          "signature": "export function validateAttachmentId(id: number | string): void"
        },
        {
          "name": "validatePaginationParams",
          "kind": "function",
          "line": 83,
          "exported": true,
          "signature": "export function validatePaginationParams(limit?: number, offset?: number): void"
        }
      ]
    }
  ]
}
```
