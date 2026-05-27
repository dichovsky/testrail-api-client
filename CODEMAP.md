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
  "sourceHash": "3d7ed4e295a0b8884241d10efeabbf72ccb33f7499c029512a064f1266139ab5",
  "entrypoints": [
    "src/index.ts",
    "src/cli.ts"
  ],
  "publicApi": [
    {
      "name": "AddCaseFieldConfigPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1193,
      "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldConfigPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1179,
      "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
    },
    {
      "name": "AddCaseFieldPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1205,
      "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1195,
      "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
    },
    {
      "name": "AddCaseFieldResponse",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 708,
      "signature": "export type AddCaseFieldResponse = z.infer<typeof AddCaseFieldResponseSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCaseFieldResponseSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 683,
      "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
    },
    {
      "name": "AddCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1058,
      "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1047,
      "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
    },
    {
      "name": "AddCasesBulkPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1085,
      "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddCasesBulkPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1083,
      "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
    },
    {
      "name": "AddConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1559,
      "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1555,
      "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddConfigurationPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1571,
      "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1567,
      "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddDatasetPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 975,
      "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 971,
      "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "AddGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 99,
      "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 94,
      "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })",
      "jsdoc": "Group write-payload schemas (TestRail 7.5+). Mirror the variable/shared-step/milestone payload-migration precedent: each schema is declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future `custom_*`-style fields TestRail may add to either endpoint."
    },
    {
      "name": "AddMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1494,
      "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1485,
      "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
    },
    {
      "name": "AddPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1369,
      "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1346,
      "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
    },
    {
      "name": "AddPlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1406,
      "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddPlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1393,
      "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(),…"
    },
    {
      "name": "AddProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1438,
      "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1431,
      "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "AddResultForCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1268,
      "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1257,
      "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultForTestPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1291,
      "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultForTestPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1280,
      "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
    },
    {
      "name": "AddResultPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1252,
      "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1242,
      "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **request** payload schemas."
    },
    {
      "name": "AddResultsForCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1274,
      "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsForCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1270,
      "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
    },
    {
      "name": "AddResultsPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1297,
      "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddResultsPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1293,
      "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
    },
    {
      "name": "AddRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1218,
      "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1207,
      "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
    },
    {
      "name": "AddRunToPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1332,
      "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddRunToPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1323,
      "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
    },
    {
      "name": "AddSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1476,
      "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1469,
      "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
    },
    {
      "name": "AddSharedStepPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1529,
      "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1524,
      "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })",
      "jsdoc": "SPEC #2.1.15 — verified against the `add_shared_step` request-body field table (Support article 7077919815572): only `title` is `required=true`; `custom_steps_separated` is `required=false`. The doc's request example also shows step entries with a subset of fields (just `content`), which the `z.record(string, unknown())` per-step shape accepts."
    },
    {
      "name": "AddSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1454,
      "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1449,
      "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
    },
    {
      "name": "AddUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 752,
      "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for creating a new user via POST /add_user (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 916,
      "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "AddVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 912,
      "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
    },
    {
      "name": "Attachment",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 817,
      "signature": "export interface Attachment { attachment_id?: number | null; id?: number | string | null; name?: string | null; filename?: string | null; filetype?: string | null; size?: number | null; created_on?: n…",
      "jsdoc": "An attachment metadata record returned by attachment list and upload endpoints.",
      "typeOnly": true
    },
    {
      "name": "AttachmentSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 818,
      "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number().nullish(), id: z.union([z.number(), z.string()]).nullish(), name: z.string().nullish(), filename: z.string().nullish(), filetype: z.…"
    },
    {
      "name": "Case",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 113,
      "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …",
      "typeOnly": true
    },
    {
      "name": "CaseField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 609,
      "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…",
      "jsdoc": "Custom case field definition returned by get_case_fields",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 594,
      "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…",
      "jsdoc": "Context/options configuration block shared by CaseField entries",
      "typeOnly": true
    },
    {
      "name": "CaseFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 641,
      "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "CaseFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 648,
      "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
    },
    {
      "name": "CaseSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 259,
      "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
    },
    {
      "name": "CaseStatus",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 440,
      "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }",
      "typeOnly": true
    },
    {
      "name": "CaseStatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 569,
      "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
    },
    {
      "name": "CaseType",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 629,
      "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case type definition returned by get_case_types",
      "typeOnly": true
    },
    {
      "name": "CaseTypeSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 735,
      "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Configuration",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 647,
      "signature": "export interface Configuration { id: number; name: string; group_id: number; }",
      "jsdoc": "An individual configuration (e.g. \"Windows 10\", \"Chrome\") within a group",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroup",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 654,
      "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }",
      "jsdoc": "A configuration group (e.g. \"Operating Systems\", \"Browsers\")",
      "typeOnly": true
    },
    {
      "name": "ConfigurationGroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 761,
      "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
    },
    {
      "name": "ConfigurationSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 753,
      "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
    },
    {
      "name": "CopyCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1149,
      "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "CopyCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1145,
      "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
    },
    {
      "name": "createApiError",
      "kind": "function",
      "file": "src/errors.ts",
      "line": 53,
      "signature": "export function createApiError(status: number, statusText: string, response?: unknown): TestRailApiError",
      "jsdoc": "Returns the most specific TestRailApiError subclass for a given HTTP status. Falls back to TestRailApiError for unclassified statuses."
    },
    {
      "name": "Dataset",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 969,
      "signature": "export type Dataset = z.infer<typeof DatasetSchema>",
      "typeOnly": true
    },
    {
      "name": "DatasetSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 963,
      "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), variables: z.array(DatasetVariableSchema).nullish(), })",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Datasets\" API doc (support article 7077300491540) on 2026-05-23. Documented response fields are `id`, `name`, and `variables[]`; `id` and `name` are required scalars, `variables` is the array of `DatasetVariable` entries. `variables` is modelled as `.nullish()` for defensive back-compat — TestRail's `add_dataset` example also shows the same shape but older API revisions or edge cases (e.g. an empty dataset mid-creation) may omit the key. Any forward-compat keys the server might add (e.g. `project_id`, `created_on`, `created_by`) survive at runtime via `zObject()`'s passthrough; they are intentionally not declared here until the upstream doc lists them (SPEC #1.5)."
    },
    {
      "name": "DatasetVariable",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 948,
      "signature": "export type DatasetVariable = z.infer<typeof DatasetVariableSchema>",
      "typeOnly": true
    },
    {
      "name": "DatasetVariableSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 942,
      "signature": "export const DatasetVariableSchema = zObject({ id: z.number(), name: z.string(), value: z.string().nullable(), })",
      "jsdoc": "SPEC #2.1.16 — embedded variable/value entry inside a Dataset response. Per the official TestRail \"Datasets\" API doc (support article 7077300491540), `get_dataset` returns a `variables` array where each entry has `id` (integer), `name` (string), and `value`. `id` and `name` are documented as plain non-nullable scalars; `value` may be null when the variable is unset/cleared on the server side, so it is modelled as nullable per SPEC #2.1.16 review. `zObject()`'s passthrough preserves any forward-compat keys."
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
      "line": 1122,
      "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "DeleteCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1114,
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
      "line": 500,
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
      "line": 740,
      "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getMilestones()`.",
      "typeOnly": true
    },
    {
      "name": "GetPlansOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 683,
      "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getPlans()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetResultsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 716,
      "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; defects_filter?: string; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getResults()`, `getResultsForCase()`, and `getResultsForRun()`. All date filters accept Unix timestamps (seconds).",
      "typeOnly": true
    },
    {
      "name": "GetRunsOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 537,
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
      "line": 703,
      "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }",
      "jsdoc": "Filter options for `getTests()`.",
      "typeOnly": true
    },
    {
      "name": "Group",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 79,
      "signature": "export type Group = z.infer<typeof GroupSchema>",
      "typeOnly": true
    },
    {
      "name": "GroupSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 73,
      "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
    },
    {
      "name": "handleZodError",
      "kind": "function",
      "file": "src/errors.ts",
      "line": 77,
      "signature": "export function handleZodError(error: ZodError): TestRailValidationError",
      "jsdoc": "Utility to convert ZodError into TestRailValidationError."
    },
    {
      "name": "HistoryChange",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 449,
      "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; label?: string | null; options?: unknown[] | null; old_value?: stri…",
      "typeOnly": true
    },
    {
      "name": "HistoryEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 465,
      "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }",
      "typeOnly": true
    },
    {
      "name": "HistoryEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 615,
      "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
    },
    {
      "name": "LabelEmbedded",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 255,
      "signature": "export type LabelEmbedded = z.infer<typeof LabelEmbeddedSchema>",
      "typeOnly": true
    },
    {
      "name": "LabelEmbeddedSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 247,
      "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })",
      "jsdoc": "Shape of a Label object as embedded inside a parent resource response — notably `get_case` (SPEC #2.1.3) and `get_test` (SPEC #2.1.7). The two endpoints emit the same logical shape but the wider TestRail Labels API has historically diverged on naming (`title` on embedded forms vs `name` on the stand-alone `get_label`), so the inner schema accepts both."
    },
    {
      "name": "Milestone",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 374,
      "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …",
      "typeOnly": true
    },
    {
      "name": "MilestoneSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 511,
      "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
    },
    {
      "name": "MoveCasesToSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1162,
      "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveCasesToSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1157,
      "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
    },
    {
      "name": "MoveSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 314,
      "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "MoveSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 309,
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
      "line": 218,
      "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…",
      "typeOnly": true
    },
    {
      "name": "PlanEntry",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 253,
      "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1316,
      "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "PlanEntryRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1306,
      "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
    },
    {
      "name": "PlanEntrySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 369,
      "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
    },
    {
      "name": "PlanSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 391,
      "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
    },
    {
      "name": "Priority",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 432,
      "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }",
      "typeOnly": true
    },
    {
      "name": "PrioritySchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 554,
      "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
    },
    {
      "name": "Project",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 181,
      "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …",
      "typeOnly": true
    },
    {
      "name": "ProjectSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 155,
      "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
    },
    {
      "name": "RateLimiterConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 671,
      "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }",
      "typeOnly": true
    },
    {
      "name": "Report",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 897,
      "signature": "export interface Report { id: number; name: string; description?: string | null; notify_user?: boolean | null; notify_link?: boolean | null; notify_link_recipients?: string | null; notify_attachment?:…",
      "jsdoc": "A report template returned by GET /get_reports/{project_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResult",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 928,
      "signature": "export interface ReportResult { report_url: string; report_html?: string | null; report_pdf?: string | null; user_report_url?: string | null; }",
      "jsdoc": "Result returned by GET /run_report/{report_template_id}.",
      "typeOnly": true
    },
    {
      "name": "ReportResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1031,
      "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), report_html: z.string().nullish(), report_pdf: z.string().nullish(), user_report_url: z.string().nullish(), })",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Reports and Cross-Project Reports\" API doc (support article 7077825062036) on 2026-05-23. `run_report` returns three URLs per the current doc example: `report_url` (the report view), `report_html`, and `report_pdf`. `report_url` is required; `report_html` and `report_pdf` are modelled as `.nullish()` since the endpoint requires TestRail 5.7+ and older servers may emit fewer keys. `user_report_url` is NOT in the current doc but remains `.nullish()` as a forward/legacy-compat placeholder for TestRail revisions that emitted it."
    },
    {
      "name": "ReportSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1005,
      "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), notify_user: z.boolean().nullish(), notify_link: z.boolean().nullish(), notify_link_recipient…",
      "jsdoc": "SPEC #2.1.16 — verified against the official TestRail \"Reports and Cross-Project Reports\" API doc (support article 7077825062036) on 2026-05-23. Per the \"system fields always included in the response\" table, `get_reports` returns `id`, `name`, `description`, and six `notify_*` fields. `id` and `name` are required scalars; `description` is documented as a string but the doc example shows `\"description\": null`, so `.nullish()` matches the wire. The six `notify_*` fields are always-included per the doc, but modelled as `.nullish()` for defensive back-compat: older TestRail versions may omit them and `notify_link_recipients` is documented as a string that the doc example also shows as `null`. `is_shared` is NOT in the current doc field table; it remains `.nullish()` as a forward-compat placeholder."
    },
    {
      "name": "Result",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 359,
      "signature": "export interface Result { id: number; test_id: number; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto_id?: number | n…",
      "typeOnly": true
    },
    {
      "name": "ResultField",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 572,
      "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfig",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 558,
      "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…",
      "typeOnly": true
    },
    {
      "name": "ResultFieldConfigSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 710,
      "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
    },
    {
      "name": "ResultFieldSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 717,
      "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
    },
    {
      "name": "ResultSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 493,
      "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish(), defects: …",
      "jsdoc": "SPEC #A.1 — canonical exemplar for **response** schemas."
    },
    {
      "name": "Role",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 782,
      "signature": "export interface Role { id: number; name: string; is_default: boolean; }",
      "jsdoc": "A user role returned by GET /get_roles (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "RoleSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 65,
      "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Run",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 272,
      "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…",
      "typeOnly": true
    },
    {
      "name": "RunSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 318,
      "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
    },
    {
      "name": "Section",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 171,
      "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }",
      "typeOnly": true
    },
    {
      "name": "SectionSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 287,
      "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
    },
    {
      "name": "SharedStep",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 888,
      "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>",
      "typeOnly": true
    },
    {
      "name": "SharedStepSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 876,
      "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…",
      "jsdoc": "SPEC #2.1.15 — verified against the official Shared Steps API doc (TestRail Support article 7077919815572). Endpoint requires TestRail 7.0+."
    },
    {
      "name": "SoftDeleteOptions",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 491,
      "signature": "export interface SoftDeleteOptions { soft?: boolean; }",
      "jsdoc": "Options for delete endpoints that support TestRail's `soft=1` server-side preview (`delete_case`, `delete_cases`, `delete_run`, `delete_section`, `delete_suite`). `delete_milestone` and `delete_project` do not accept `soft`; passing this option to those endpoints would be a no-op server-side, so the CLI rejects it instead to keep destructive intent unambiguous.",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreview",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1140,
      "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>",
      "typeOnly": true
    },
    {
      "name": "SoftDeletePreviewSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1130,
      "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
    },
    {
      "name": "Status",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 420,
      "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }",
      "typeOnly": true
    },
    {
      "name": "StatusSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 540,
      "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
    },
    {
      "name": "Suite",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 156,
      "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…",
      "typeOnly": true
    },
    {
      "name": "SuiteSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 206,
      "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
    },
    {
      "name": "Template",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 638,
      "signature": "export interface Template { id: number; name: string; is_default: boolean; }",
      "jsdoc": "Case template returned by get_templates (requires TestRail 5.2+)",
      "typeOnly": true
    },
    {
      "name": "TemplateSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 743,
      "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
    },
    {
      "name": "Test",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 317,
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
      "name": "TestRailAuthError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 26,
      "signature": "export class TestRailAuthError extends TestRailApiError",
      "jsdoc": "Thrown when TestRail returns 401 Unauthorized or 403 Forbidden."
    },
    {
      "name": "TestRailClient",
      "kind": "class",
      "file": "src/client.ts",
      "line": 118,
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
      "name": "TestRailNotFoundError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 34,
      "signature": "export class TestRailNotFoundError extends TestRailApiError",
      "jsdoc": "Thrown when TestRail returns 404 Not Found."
    },
    {
      "name": "TestRailRateLimitError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 18,
      "signature": "export class TestRailRateLimitError extends TestRailApiError",
      "jsdoc": "Thrown when TestRail returns 429 Too Many Requests or the client-side rate limiter fires."
    },
    {
      "name": "TestRailTimeoutError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 42,
      "signature": "export class TestRailTimeoutError extends TestRailApiError",
      "jsdoc": "Thrown when TestRail returns 408 or the fetch is aborted (AbortError / request-header timeout). Body-read deadline timeouts surface as plain `TestRailApiError(0, 'Body read timeout')`."
    },
    {
      "name": "TestRailValidationError",
      "kind": "class",
      "file": "src/errors.ts",
      "line": 64,
      "signature": "export class TestRailValidationError extends Error",
      "jsdoc": "Thrown when client configuration or method parameters fail validation."
    },
    {
      "name": "TestSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 433,
      "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
    },
    {
      "name": "UpdateCasePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1071,
      "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1060,
      "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
    },
    {
      "name": "UpdateCasesPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1105,
      "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateCasesPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1093,
      "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
    },
    {
      "name": "UpdateConfigurationGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1565,
      "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1561,
      "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateConfigurationPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1577,
      "signature": "export type UpdateConfigurationPayload = z.infer<typeof UpdateConfigurationPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateConfigurationPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1573,
      "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
    },
    {
      "name": "UpdateDatasetPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 987,
      "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateDatasetPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 983,
      "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_dataset` accepts a partial body (rename-only at the moment). Mirrors the `UpdateVariablePayloadSchema` precedent — empty `{}` body is intentionally allowed and forwarded to TestRail, which treats it as a no-op. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UpdateGroupPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 106,
      "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateGroupPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 101,
      "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
    },
    {
      "name": "UpdateMilestonePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1507,
      "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateMilestonePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1496,
      "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
    },
    {
      "name": "UpdatePlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1391,
      "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1371,
      "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
    },
    {
      "name": "UpdatePlanPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1421,
      "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdatePlanPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1408,
      "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), start_on: z…"
    },
    {
      "name": "UpdateProjectPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1447,
      "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateProjectPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1440,
      "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
    },
    {
      "name": "UpdateRunInPlanEntryPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1344,
      "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunInPlanEntryPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1337,
      "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
    },
    {
      "name": "UpdateRunPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1230,
      "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateRunPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1220,
      "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
    },
    {
      "name": "UpdateSectionPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1483,
      "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSectionPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1478,
      "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateSharedStepPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1545,
      "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSharedStepPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1540,
      "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })",
      "jsdoc": "Update payload for `update_shared_step`. Every field is optional — TestRail accepts an empty object (`{}`) as a no-op update, so the CLI's `shared-step update <id> --data '{}'` is intentionally a valid call. This mirrors `UpdateMilestonePayloadSchema` and `UpdateCasePayloadSchema`: empty bodies are accepted at the schema layer; rejecting them is the API's responsibility, not the client's. Callers that want to enforce \"non-empty update\" must do so above this schema."
    },
    {
      "name": "UpdateSuitePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 1461,
      "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateSuitePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 1456,
      "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
    },
    {
      "name": "UpdateUserPayload",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 766,
      "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }",
      "jsdoc": "Payload for updating an existing user via POST /update_user/{user_id} (TestRail 7.3+)",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 930,
      "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UpdateVariablePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 926,
      "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })",
      "jsdoc": "`update_variable` accepts an empty body as a no-op: every field is optional. We intentionally do NOT enforce \"at least one field set\" client-side — TestRail itself accepts `{}` and returns the unchanged variable. Mirrors the `UpdateSectionPayloadSchema` precedent below, where empty-body updates are also passed through. `custom_*` extras flow through `zObject()`'s passthrough."
    },
    {
      "name": "UploadFileInput",
      "kind": "type",
      "file": "src/types.ts",
      "line": 111,
      "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput",
      "typeOnly": true
    },
    {
      "name": "UploadFilePathInput",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 93,
      "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }",
      "typeOnly": true
    },
    {
      "name": "User",
      "kind": "interface",
      "file": "src/types.ts",
      "line": 396,
      "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; email_notifications?: boolean | null; is_admin?: boolean | null; gro…",
      "typeOnly": true
    },
    {
      "name": "UserAddPayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 137,
      "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserAddPayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 125,
      "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…",
      "jsdoc": "User write-payload schemas (TestRail 7.3+). Mirror the group/milestone payload pattern: declared once here as the source of truth for both the runtime validator (CLI `--data` resolver) and the inferred TypeScript types consumed by the programmatic client. `.passthrough()` (via `zObject`) preserves any future fields TestRail may add to either endpoint."
    },
    {
      "name": "UserSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 39,
      "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), email_notifications:…"
    },
    {
      "name": "UserUpdatePayload",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 151,
      "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>",
      "typeOnly": true
    },
    {
      "name": "UserUpdatePayloadSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 139,
      "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
    },
    {
      "name": "Variable",
      "kind": "type",
      "file": "src/schemas.ts",
      "line": 910,
      "signature": "export type Variable = z.infer<typeof VariableSchema>",
      "typeOnly": true
    },
    {
      "name": "VariableSchema",
      "kind": "const",
      "file": "src/schemas.ts",
      "line": 905,
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
          "name": "PathParamCountResult",
          "kind": "type",
          "line": 325,
          "exported": true,
          "signature": "export type PathParamCountResult = { ok: true } | { ok: false; error: string }"
        },
        {
          "name": "checkPathParamCount",
          "kind": "function",
          "line": 336,
          "exported": true,
          "signature": "export function checkPathParamCount(spec: ActionSpec | undefined, pathParams: readonly string[]): PathParamCountResult"
        },
        {
          "name": "dispatch",
          "kind": "function",
          "line": 365,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "ResolvedUpload",
          "kind": "interface",
          "line": 20,
          "exported": false,
          "signature": "interface ResolvedUpload { filename: string; path: string; contents?: Uint8Array; fd?: number | undefined; source: 'file' | 'stdin'; }"
        },
        {
          "name": "setupUpload",
          "kind": "function",
          "line": 43,
          "exported": false,
          "signature": "async function setupUpload( ctx: HandlerContext, action: string, idFields: Record<string, number>, ): Promise<ResolvedUpload | null>"
        },
        {
          "name": "uploadPayload",
          "kind": "function",
          "line": 88,
          "exported": false,
          "signature": "function uploadPayload(upload: ResolvedUpload): { path: string; fd?: number | undefined } | Uint8Array"
        },
        {
          "name": "handleAttachmentAddToCase",
          "kind": "function",
          "line": 95,
          "exported": true,
          "signature": "export async function handleAttachmentAddToCase(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToResult",
          "kind": "function",
          "line": 102,
          "exported": true,
          "signature": "export async function handleAttachmentAddToResult(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToRun",
          "kind": "function",
          "line": 109,
          "exported": true,
          "signature": "export async function handleAttachmentAddToRun(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlan",
          "kind": "function",
          "line": 116,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlan(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentAddToPlanEntry",
          "kind": "function",
          "line": 123,
          "exported": true,
          "signature": "export async function handleAttachmentAddToPlanEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleAttachmentDelete",
          "kind": "function",
          "line": 138,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleConfigurationGroupAdd",
          "kind": "function",
          "line": 20,
          "exported": true,
          "signature": "export async function handleConfigurationGroupAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationGroupUpdate",
          "kind": "function",
          "line": 37,
          "exported": true,
          "signature": "export async function handleConfigurationGroupUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationGroupDelete",
          "kind": "function",
          "line": 67,
          "exported": true,
          "signature": "export async function handleConfigurationGroupDelete(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationAdd",
          "kind": "function",
          "line": 82,
          "exported": true,
          "signature": "export async function handleConfigurationAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationUpdate",
          "kind": "function",
          "line": 99,
          "exported": true,
          "signature": "export async function handleConfigurationUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleConfigurationDelete",
          "kind": "function",
          "line": 125,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleDatasetAdd",
          "kind": "function",
          "line": 9,
          "exported": true,
          "signature": "export async function handleDatasetAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetUpdate",
          "kind": "function",
          "line": 37,
          "exported": true,
          "signature": "export async function handleDatasetUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleDatasetDelete",
          "kind": "function",
          "line": 69,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleGroupAdd",
          "kind": "function",
          "line": 12,
          "exported": true,
          "signature": "export async function handleGroupAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupUpdate",
          "kind": "function",
          "line": 37,
          "exported": true,
          "signature": "export async function handleGroupUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleGroupDelete",
          "kind": "function",
          "line": 66,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleMilestoneAdd",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export async function handleMilestoneAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneUpdate",
          "kind": "function",
          "line": 24,
          "exported": true,
          "signature": "export async function handleMilestoneUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleMilestoneDelete",
          "kind": "function",
          "line": 49,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handlePlanAdd",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function handlePlanAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdate",
          "kind": "function",
          "line": 25,
          "exported": true,
          "signature": "export async function handlePlanUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanAddEntry",
          "kind": "function",
          "line": 36,
          "exported": true,
          "signature": "export async function handlePlanAddEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanAddRunToEntry",
          "kind": "function",
          "line": 47,
          "exported": true,
          "signature": "export async function handlePlanAddRunToEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdateEntry",
          "kind": "function",
          "line": 66,
          "exported": true,
          "signature": "export async function handlePlanUpdateEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanUpdateRunInEntry",
          "kind": "function",
          "line": 85,
          "exported": true,
          "signature": "export async function handlePlanUpdateRunInEntry(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanClose",
          "kind": "function",
          "line": 115,
          "exported": true,
          "signature": "export async function handlePlanClose(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanDelete",
          "kind": "function",
          "line": 136,
          "exported": true,
          "signature": "export async function handlePlanDelete(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handlePlanDeleteEntry",
          "kind": "function",
          "line": 158,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleProjectAdd",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export async function handleProjectAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectUpdate",
          "kind": "function",
          "line": 17,
          "exported": true,
          "signature": "export async function handleProjectUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleProjectDelete",
          "kind": "function",
          "line": 44,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleSharedStepAdd",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export async function handleSharedStepAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepUpdate",
          "kind": "function",
          "line": 24,
          "exported": true,
          "signature": "export async function handleSharedStepUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleSharedStepDelete",
          "kind": "function",
          "line": 53,
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
        "../ids.js",
        "../run-destructive.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "handleVariableAdd",
          "kind": "function",
          "line": 7,
          "exported": true,
          "signature": "export async function handleVariableAdd(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleVariableUpdate",
          "kind": "function",
          "line": 24,
          "exported": true,
          "signature": "export async function handleVariableUpdate(ctx: HandlerContext): Promise<void>"
        },
        {
          "name": "handleVariableDelete",
          "kind": "function",
          "line": 50,
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
          "name": "ENTRY_ID_RE",
          "kind": "const",
          "line": 41,
          "exported": false,
          "signature": "const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i"
        },
        {
          "name": "parseEntryId",
          "kind": "function",
          "line": 49,
          "exported": true,
          "signature": "export function parseEntryId(raw: string | undefined, name: string): string"
        },
        {
          "name": "optInt",
          "kind": "function",
          "line": 59,
          "exported": true,
          "signature": "export function optInt(raw: string | undefined): number | undefined"
        },
        {
          "name": "parseIdList",
          "kind": "function",
          "line": 74,
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
          "line": 121,
          "exported": true,
          "signature": "export const ACTIONS: readonly ActionSpec[] = [ { resource: 'project', action: 'get', summary: 'Fetch a single project by ID', pathParams: [{ name: 'project_id', description: 'TestRail project ID' }],…"
        },
        {
          "name": "getActionSpec",
          "kind": "function",
          "line": 1217,
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
      "path": "src/cli/run-destructive.ts",
      "imports": [
        "./handler-context.js"
      ],
      "reExports": [],
      "symbols": [
        {
          "name": "runDestructive",
          "kind": "function",
          "line": 14,
          "exported": true,
          "signature": "export async function runDestructive( ctx: HandlerContext, preview: Record<string, unknown>, execute: () => Promise<void>, opts?: { softUnsupported?: boolean }, ): Promise<void>"
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
          "line": 26,
          "exported": false,
          "signature": "function isFilePathInput(value: unknown): value is UploadFilePathInput"
        },
        {
          "name": "USER_AGENT",
          "kind": "const",
          "line": 36,
          "exported": false,
          "signature": "const USER_AGENT = `${pkg.description}/${pkg.version}`"
        },
        {
          "name": "PRIVATE_HOST_PATTERNS",
          "kind": "const",
          "line": 63,
          "exported": false,
          "signature": "const PRIVATE_HOST_PATTERNS: RegExp[] = [ /^localhost\\.?$/i, /^127\\./, /^10\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./, /^192\\.168\\./, /^169\\.254\\./, /^::1$/, /^fe80:/i, /^f[cd][0-9a-f]{2}:/i, /^fe[c-f][0-9a-f]…"
        },
        {
          "name": "isPrivateOrLoopbackIPv4",
          "kind": "function",
          "line": 79,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIPv4(ip: string): boolean"
        },
        {
          "name": "isPrivateOrLoopbackIP",
          "kind": "function",
          "line": 101,
          "exported": false,
          "signature": "function isPrivateOrLoopbackIP(ip: string, family?: number): boolean"
        },
        {
          "name": "validatePublicHost",
          "kind": "function",
          "line": 140,
          "exported": false,
          "signature": "async function validatePublicHost(hostname: string): Promise<void>"
        },
        {
          "name": "ENTRY_ID_RE",
          "kind": "const",
          "line": 191,
          "exported": false,
          "signature": "const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i"
        },
        {
          "name": "activeClients",
          "kind": "const",
          "line": 193,
          "exported": false,
          "signature": "const activeClients = new Set<TestRailClientCore>()"
        },
        {
          "name": "processHandlersRegistered",
          "kind": "let",
          "line": 194,
          "exported": false,
          "signature": "let processHandlersRegistered = false"
        },
        {
          "name": "cleanupAllClients",
          "kind": "function",
          "line": 197,
          "exported": false,
          "signature": "function cleanupAllClients(): void"
        },
        {
          "name": "registerProcessHandlers",
          "kind": "function",
          "line": 207,
          "exported": false,
          "signature": "function registerProcessHandlers(): void"
        },
        {
          "name": "TestRailClientCore",
          "kind": "class",
          "line": 230,
          "exported": true,
          "signature": "export class TestRailClientCore",
          "members": [
            {
              "name": "baseUrl",
              "kind": "property",
              "line": 231
            },
            {
              "name": "auth",
              "kind": "property",
              "line": 234
            },
            {
              "name": "timeout",
              "kind": "property",
              "line": 235
            },
            {
              "name": "maxRetries",
              "kind": "property",
              "line": 236
            },
            {
              "name": "enableCache",
              "kind": "property",
              "line": 237
            },
            {
              "name": "cacheTtl",
              "kind": "property",
              "line": 238
            },
            {
              "name": "cacheCleanupInterval",
              "kind": "property",
              "line": 239
            },
            {
              "name": "maxCacheSize",
              "kind": "property",
              "line": 240
            },
            {
              "name": "cache",
              "kind": "property",
              "line": 241
            },
            {
              "name": "pendingRequests",
              "kind": "property",
              "line": 242
            },
            {
              "name": "cacheCleanupTimer",
              "kind": "property",
              "line": 243
            },
            {
              "name": "rateLimiter",
              "kind": "property",
              "line": 244
            },
            {
              "name": "isDestroyed",
              "kind": "property",
              "line": 245
            },
            {
              "name": "hostname",
              "kind": "property",
              "line": 246
            },
            {
              "name": "allowPrivateHosts",
              "kind": "property",
              "line": 247
            },
            {
              "name": "maxJsonResponseBytes",
              "kind": "property",
              "line": 248
            },
            {
              "name": "maxBinaryResponseBytes",
              "kind": "property",
              "line": 249
            },
            {
              "name": "bodyTimeout",
              "kind": "property",
              "line": 254
            },
            {
              "name": "fetchOverride",
              "kind": "property",
              "line": 255
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 257
            },
            {
              "name": "validateConfig",
              "kind": "method",
              "line": 325
            },
            {
              "name": "getRetryDelay",
              "kind": "method",
              "line": 481
            },
            {
              "name": "parseRetryAfterMs",
              "kind": "method",
              "line": 506
            },
            {
              "name": "assertNotRedirect",
              "kind": "method",
              "line": 547
            },
            {
              "name": "checkRateLimit",
              "kind": "method",
              "line": 565
            },
            {
              "name": "validateId",
              "kind": "method",
              "line": 593
            },
            {
              "name": "validateEntryId",
              "kind": "method",
              "line": 606
            },
            {
              "name": "validatePaginationParams",
              "kind": "method",
              "line": 616
            },
            {
              "name": "buildEndpoint",
              "kind": "method",
              "line": 635
            },
            {
              "name": "getCachedData",
              "kind": "method",
              "line": 647
            },
            {
              "name": "setCachedData",
              "kind": "method",
              "line": 668
            },
            {
              "name": "clearCache",
              "kind": "method",
              "line": 690
            },
            {
              "name": "startCacheCleanup",
              "kind": "method",
              "line": 698
            },
            {
              "name": "stopCacheCleanup",
              "kind": "method",
              "line": 709
            },
            {
              "name": "cleanupExpiredCache",
              "kind": "method",
              "line": 716
            },
            {
              "name": "destroy",
              "kind": "method",
              "line": 743
            },
            {
              "name": "request",
              "kind": "method",
              "line": 780
            },
            {
              "name": "requestText",
              "kind": "method",
              "line": 995
            },
            {
              "name": "requestMultipart",
              "kind": "method",
              "line": 1121
            },
            {
              "name": "requestBinary",
              "kind": "method",
              "line": 1271
            },
            {
              "name": "awaitDnsValidation",
              "kind": "method",
              "line": 1377
            },
            {
              "name": "parse",
              "kind": "method",
              "line": 1386
            },
            {
              "name": "requestParsed",
              "kind": "method",
              "line": 1419
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
          "line": 118,
          "exported": true,
          "signature": "export class TestRailClient extends TestRailClientCore",
          "members": [
            {
              "name": "projects",
              "kind": "property",
              "line": 120
            },
            {
              "name": "suites",
              "kind": "property",
              "line": 121
            },
            {
              "name": "sections",
              "kind": "property",
              "line": 122
            },
            {
              "name": "cases",
              "kind": "property",
              "line": 123
            },
            {
              "name": "plans",
              "kind": "property",
              "line": 124
            },
            {
              "name": "runs",
              "kind": "property",
              "line": 125
            },
            {
              "name": "tests",
              "kind": "property",
              "line": 126
            },
            {
              "name": "results",
              "kind": "property",
              "line": 127
            },
            {
              "name": "milestones",
              "kind": "property",
              "line": 128
            },
            {
              "name": "users",
              "kind": "property",
              "line": 129
            },
            {
              "name": "metadata",
              "kind": "property",
              "line": 130
            },
            {
              "name": "configurations",
              "kind": "property",
              "line": 131
            },
            {
              "name": "attachments",
              "kind": "property",
              "line": 132
            },
            {
              "name": "bdd",
              "kind": "property",
              "line": 133
            },
            {
              "name": "sharedSteps",
              "kind": "property",
              "line": 134
            },
            {
              "name": "variables",
              "kind": "property",
              "line": 135
            },
            {
              "name": "datasets",
              "kind": "property",
              "line": 136
            },
            {
              "name": "reports",
              "kind": "property",
              "line": 137
            },
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 139
            },
            {
              "name": "getProject",
              "kind": "method",
              "line": 168
            },
            {
              "name": "getProjects",
              "kind": "method",
              "line": 177
            },
            {
              "name": "addProject",
              "kind": "method",
              "line": 185
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 194
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 203
            },
            {
              "name": "getSuite",
              "kind": "method",
              "line": 214
            },
            {
              "name": "getSuites",
              "kind": "method",
              "line": 223
            },
            {
              "name": "addSuite",
              "kind": "method",
              "line": 232
            },
            {
              "name": "updateSuite",
              "kind": "method",
              "line": 241
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 251
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 252
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 254
            },
            {
              "name": "deleteSuite",
              "kind": "method",
              "line": 255
            },
            {
              "name": "getSection",
              "kind": "method",
              "line": 269
            },
            {
              "name": "getSections",
              "kind": "method",
              "line": 281
            },
            {
              "name": "addSection",
              "kind": "method",
              "line": 293
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 302
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 312
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 313
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 315
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 316
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 331
            },
            {
              "name": "getCase",
              "kind": "method",
              "line": 342
            },
            {
              "name": "getCases",
              "kind": "method",
              "line": 363
            },
            {
              "name": "addCase",
              "kind": "method",
              "line": 372
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 385
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 394
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 405
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 406
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 408
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 409
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 421
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 432
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 438
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 445
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 451
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 471
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 480
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 489
            },
            {
              "name": "getPlan",
              "kind": "method",
              "line": 500
            },
            {
              "name": "getPlans",
              "kind": "method",
              "line": 512
            },
            {
              "name": "addPlan",
              "kind": "method",
              "line": 521
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 530
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 539
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 548
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 557
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 566
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 575
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 584
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 593
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 602
            },
            {
              "name": "getRun",
              "kind": "method",
              "line": 613
            },
            {
              "name": "getRuns",
              "kind": "method",
              "line": 625
            },
            {
              "name": "addRun",
              "kind": "method",
              "line": 634
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 643
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 652
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 662
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 663
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 665
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 666
            },
            {
              "name": "getTest",
              "kind": "method",
              "line": 680
            },
            {
              "name": "getTests",
              "kind": "method",
              "line": 691
            },
            {
              "name": "getResults",
              "kind": "method",
              "line": 705
            },
            {
              "name": "getResultsForCase",
              "kind": "method",
              "line": 718
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 730
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 739
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 748
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 757
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 766
            },
            {
              "name": "getMilestone",
              "kind": "method",
              "line": 777
            },
            {
              "name": "getMilestones",
              "kind": "method",
              "line": 789
            },
            {
              "name": "addMilestone",
              "kind": "method",
              "line": 801
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 813
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 824
            },
            {
              "name": "getUser",
              "kind": "method",
              "line": 837
            },
            {
              "name": "getUserByEmail",
              "kind": "method",
              "line": 848
            },
            {
              "name": "getUsers",
              "kind": "method",
              "line": 861
            },
            {
              "name": "getCurrentUser",
              "kind": "method",
              "line": 869
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 879
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 891
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 901
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 910
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 920
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 930
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 940
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 962
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 970
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 983
            },
            {
              "name": "getConfigurations",
              "kind": "method",
              "line": 996
            },
            {
              "name": "addConfigurationGroup",
              "kind": "method",
              "line": 1008
            },
            {
              "name": "updateConfigurationGroup",
              "kind": "method",
              "line": 1020
            },
            {
              "name": "deleteConfigurationGroup",
              "kind": "method",
              "line": 1034
            },
            {
              "name": "addConfiguration",
              "kind": "method",
              "line": 1046
            },
            {
              "name": "updateConfiguration",
              "kind": "method",
              "line": 1058
            },
            {
              "name": "deleteConfiguration",
              "kind": "method",
              "line": 1069
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 1079
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 1092
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 1100
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 1110
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 1122
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 1133
            },
            {
              "name": "getAttachmentsForCase",
              "kind": "method",
              "line": 1147
            },
            {
              "name": "getAttachmentsForRun",
              "kind": "method",
              "line": 1159
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 1171
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 1182
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 1194
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 1205
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 1218
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 1231
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 1244
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 1257
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 1271
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 1287
            },
            {
              "name": "getBdd",
              "kind": "method",
              "line": 1304
            },
            {
              "name": "addBdd",
              "kind": "method",
              "line": 1317
            },
            {
              "name": "getSharedStep",
              "kind": "method",
              "line": 1330
            },
            {
              "name": "getSharedSteps",
              "kind": "method",
              "line": 1341
            },
            {
              "name": "addSharedStep",
              "kind": "method",
              "line": 1353
            },
            {
              "name": "updateSharedStep",
              "kind": "method",
              "line": 1365
            },
            {
              "name": "deleteSharedStep",
              "kind": "method",
              "line": 1376
            },
            {
              "name": "getSharedStepHistory",
              "kind": "method",
              "line": 1385
            },
            {
              "name": "getVariables",
              "kind": "method",
              "line": 1398
            },
            {
              "name": "addVariable",
              "kind": "method",
              "line": 1410
            },
            {
              "name": "updateVariable",
              "kind": "method",
              "line": 1422
            },
            {
              "name": "deleteVariable",
              "kind": "method",
              "line": 1433
            },
            {
              "name": "getDataset",
              "kind": "method",
              "line": 1446
            },
            {
              "name": "getDatasets",
              "kind": "method",
              "line": 1457
            },
            {
              "name": "addDataset",
              "kind": "method",
              "line": 1469
            },
            {
              "name": "updateDataset",
              "kind": "method",
              "line": 1481
            },
            {
              "name": "deleteDataset",
              "kind": "method",
              "line": 1492
            },
            {
              "name": "getReports",
              "kind": "method",
              "line": 1505
            },
            {
              "name": "runReport",
              "kind": "method",
              "line": 1516
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
          "name": "MAX_DATA_FILE_BYTES",
          "kind": "const",
          "line": 64,
          "exported": true,
          "signature": "export const MAX_DATA_FILE_BYTES = 1_048_576"
        },
        {
          "name": "MAX_STDIN_BYTES",
          "kind": "const",
          "line": 78,
          "exported": true,
          "signature": "export const MAX_STDIN_BYTES = 1024 * 1024"
        },
        {
          "name": "MAX_STDIN_UPLOAD_BYTES",
          "kind": "const",
          "line": 94,
          "exported": true,
          "signature": "export const MAX_STDIN_UPLOAD_BYTES = 100 * 1024 * 1024"
        },
        {
          "name": "STDIN_READ_TIMEOUT_MS",
          "kind": "const",
          "line": 108,
          "exported": true,
          "signature": "export const STDIN_READ_TIMEOUT_MS = 30000"
        },
        {
          "name": "YAML_INDENT_SPACES",
          "kind": "const",
          "line": 116,
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
          "name": "TestRailRateLimitError",
          "kind": "class",
          "line": 18,
          "exported": true,
          "signature": "export class TestRailRateLimitError extends TestRailApiError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 19
            }
          ]
        },
        {
          "name": "TestRailAuthError",
          "kind": "class",
          "line": 26,
          "exported": true,
          "signature": "export class TestRailAuthError extends TestRailApiError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 27
            }
          ]
        },
        {
          "name": "TestRailNotFoundError",
          "kind": "class",
          "line": 34,
          "exported": true,
          "signature": "export class TestRailNotFoundError extends TestRailApiError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 35
            }
          ]
        },
        {
          "name": "TestRailTimeoutError",
          "kind": "class",
          "line": 42,
          "exported": true,
          "signature": "export class TestRailTimeoutError extends TestRailApiError",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 43
            }
          ]
        },
        {
          "name": "createApiError",
          "kind": "function",
          "line": 53,
          "exported": true,
          "signature": "export function createApiError(status: number, statusText: string, response?: unknown): TestRailApiError"
        },
        {
          "name": "TestRailValidationError",
          "kind": "class",
          "line": 64,
          "exported": true,
          "signature": "export class TestRailValidationError extends Error",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 65
            }
          ]
        },
        {
          "name": "handleZodError",
          "kind": "function",
          "line": 77,
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
              "line": 46
            },
            {
              "name": "getAttachmentsForTest",
              "kind": "method",
              "line": 67
            },
            {
              "name": "getAttachmentsForPlan",
              "kind": "method",
              "line": 88
            },
            {
              "name": "getAttachmentsForPlanEntry",
              "kind": "method",
              "line": 104
            },
            {
              "name": "getAttachment",
              "kind": "method",
              "line": 121
            },
            {
              "name": "addAttachmentToCase",
              "kind": "method",
              "line": 127
            },
            {
              "name": "addAttachmentToResult",
              "kind": "method",
              "line": 133
            },
            {
              "name": "addAttachmentToRun",
              "kind": "method",
              "line": 139
            },
            {
              "name": "addAttachmentToPlan",
              "kind": "method",
              "line": 145
            },
            {
              "name": "addAttachmentToPlanEntry",
              "kind": "method",
              "line": 151
            },
            {
              "name": "deleteAttachment",
              "kind": "method",
              "line": 167
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
              "line": 93
            },
            {
              "name": "addCases",
              "kind": "method",
              "line": 112
            },
            {
              "name": "updateCase",
              "kind": "method",
              "line": 148
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 162
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 163
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 169
            },
            {
              "name": "deleteCase",
              "kind": "method",
              "line": 170
            },
            {
              "name": "updateCases",
              "kind": "method",
              "line": 194
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 207
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 213
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 220
            },
            {
              "name": "deleteCases",
              "kind": "method",
              "line": 226
            },
            {
              "name": "copyCasesToSection",
              "kind": "method",
              "line": 249
            },
            {
              "name": "moveCasesToSection",
              "kind": "method",
              "line": 266
            },
            {
              "name": "getHistoryForCase",
              "kind": "method",
              "line": 272
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
          "line": 17,
          "exported": true,
          "signature": "export class MetadataModule",
          "members": [
            {
              "name": "constructor",
              "kind": "constructor",
              "line": 18
            },
            {
              "name": "getStatuses",
              "kind": "method",
              "line": 21
            },
            {
              "name": "getCaseStatuses",
              "kind": "method",
              "line": 26
            },
            {
              "name": "getPriorities",
              "kind": "method",
              "line": 31
            },
            {
              "name": "getResultFields",
              "kind": "method",
              "line": 36
            },
            {
              "name": "getCaseFields",
              "kind": "method",
              "line": 41
            },
            {
              "name": "addCaseField",
              "kind": "method",
              "line": 68
            },
            {
              "name": "getCaseTypes",
              "kind": "method",
              "line": 78
            },
            {
              "name": "getTemplates",
              "kind": "method",
              "line": 83
            },
            {
              "name": "getRoles",
              "kind": "method",
              "line": 89
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
              "line": 39
            },
            {
              "name": "updateMilestone",
              "kind": "method",
              "line": 45
            },
            {
              "name": "deleteMilestone",
              "kind": "method",
              "line": 56
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
              "line": 53
            },
            {
              "name": "updatePlan",
              "kind": "method",
              "line": 59
            },
            {
              "name": "closePlan",
              "kind": "method",
              "line": 65
            },
            {
              "name": "deletePlan",
              "kind": "method",
              "line": 71
            },
            {
              "name": "addPlanEntry",
              "kind": "method",
              "line": 77
            },
            {
              "name": "updatePlanEntry",
              "kind": "method",
              "line": 83
            },
            {
              "name": "deletePlanEntry",
              "kind": "method",
              "line": 95
            },
            {
              "name": "addRunToPlanEntry",
              "kind": "method",
              "line": 102
            },
            {
              "name": "updateRunInPlanEntry",
              "kind": "method",
              "line": 109
            },
            {
              "name": "deleteRunFromPlanEntry",
              "kind": "method",
              "line": 115
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
              "line": 48
            },
            {
              "name": "updateProject",
              "kind": "method",
              "line": 58
            },
            {
              "name": "deleteProject",
              "kind": "method",
              "line": 69
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
              "line": 38
            },
            {
              "name": "getResultsForRun",
              "kind": "method",
              "line": 65
            },
            {
              "name": "addResult",
              "kind": "method",
              "line": 90
            },
            {
              "name": "addResultForCase",
              "kind": "method",
              "line": 96
            },
            {
              "name": "addResultsForCases",
              "kind": "method",
              "line": 108
            },
            {
              "name": "addResults",
              "kind": "method",
              "line": 119
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
              "line": 57
            },
            {
              "name": "updateRun",
              "kind": "method",
              "line": 63
            },
            {
              "name": "closeRun",
              "kind": "method",
              "line": 69
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 82
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 83
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 86
            },
            {
              "name": "deleteRun",
              "kind": "method",
              "line": 87
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
              "line": 42
            },
            {
              "name": "updateSection",
              "kind": "method",
              "line": 48
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 61
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 62
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 64
            },
            {
              "name": "deleteSection",
              "kind": "method",
              "line": 65
            },
            {
              "name": "moveSection",
              "kind": "method",
              "line": 90
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
              "line": 55
            },
            {
              "name": "addUser",
              "kind": "method",
              "line": 60
            },
            {
              "name": "updateUser",
              "kind": "method",
              "line": 65
            },
            {
              "name": "getGroup",
              "kind": "method",
              "line": 71
            },
            {
              "name": "getGroups",
              "kind": "method",
              "line": 77
            },
            {
              "name": "addGroup",
              "kind": "method",
              "line": 82
            },
            {
              "name": "updateGroup",
              "kind": "method",
              "line": 87
            },
            {
              "name": "deleteGroup",
              "kind": "method",
              "line": 93
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
          "signature": "export const UserSchema = zObject({ id: z.number(), name: z.string(), email: z.string().email(), is_active: z.boolean(), role_id: z.number().nullish(), role: z.string().nullish(), email_notifications:…"
        },
        {
          "name": "User",
          "kind": "type",
          "line": 63,
          "exported": true,
          "signature": "export type User = z.infer<typeof UserSchema>"
        },
        {
          "name": "RoleSchema",
          "kind": "const",
          "line": 65,
          "exported": true,
          "signature": "export const RoleSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Role",
          "kind": "type",
          "line": 71,
          "exported": true,
          "signature": "export type Role = z.infer<typeof RoleSchema>"
        },
        {
          "name": "GroupSchema",
          "kind": "const",
          "line": 73,
          "exported": true,
          "signature": "export const GroupSchema = zObject({ id: z.number(), name: z.string(), user_ids: z.array(z.number()).nullish(), })"
        },
        {
          "name": "Group",
          "kind": "type",
          "line": 79,
          "exported": true,
          "signature": "export type Group = z.infer<typeof GroupSchema>"
        },
        {
          "name": "AddGroupPayloadSchema",
          "kind": "const",
          "line": 94,
          "exported": true,
          "signature": "export const AddGroupPayloadSchema = zObject({ name: z.string(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "AddGroupPayload",
          "kind": "type",
          "line": 99,
          "exported": true,
          "signature": "export type AddGroupPayload = z.infer<typeof AddGroupPayloadSchema>"
        },
        {
          "name": "UpdateGroupPayloadSchema",
          "kind": "const",
          "line": 101,
          "exported": true,
          "signature": "export const UpdateGroupPayloadSchema = zObject({ name: z.string().optional(), user_ids: z.array(z.number()).optional(), })"
        },
        {
          "name": "UpdateGroupPayload",
          "kind": "type",
          "line": 106,
          "exported": true,
          "signature": "export type UpdateGroupPayload = z.infer<typeof UpdateGroupPayloadSchema>"
        },
        {
          "name": "UserAddPayloadSchema",
          "kind": "const",
          "line": 125,
          "exported": true,
          "signature": "export const UserAddPayloadSchema = zObject({ name: z.string().min(1), email: z.string().email(), password: z.string().min(1), is_active: z.boolean().optional(), role_id: z.number().int().positive().o…"
        },
        {
          "name": "UserAddPayload",
          "kind": "type",
          "line": 137,
          "exported": true,
          "signature": "export type UserAddPayload = z.infer<typeof UserAddPayloadSchema>"
        },
        {
          "name": "UserUpdatePayloadSchema",
          "kind": "const",
          "line": 139,
          "exported": true,
          "signature": "export const UserUpdatePayloadSchema = zObject({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(1).optional(), is_active: z.boolean().optional(), ro…"
        },
        {
          "name": "UserUpdatePayload",
          "kind": "type",
          "line": 151,
          "exported": true,
          "signature": "export type UserUpdatePayload = z.infer<typeof UserUpdatePayloadSchema>"
        },
        {
          "name": "ProjectSchema",
          "kind": "const",
          "line": 155,
          "exported": true,
          "signature": "export const ProjectSchema = zObject({ id: z.number(), name: z.string(), announcement: z.string().nullish(), show_announcement: z.boolean().nullish(), is_completed: z.boolean().nullish(), completed_on…"
        },
        {
          "name": "Project",
          "kind": "type",
          "line": 204,
          "exported": true,
          "signature": "export type Project = z.infer<typeof ProjectSchema>"
        },
        {
          "name": "SuiteSchema",
          "kind": "const",
          "line": 206,
          "exported": true,
          "signature": "export const SuiteSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), project_id: z.number(), is_master: z.boolean().nullish(), is_baseline: z.boolean().nullish(), …"
        },
        {
          "name": "Suite",
          "kind": "type",
          "line": 218,
          "exported": true,
          "signature": "export type Suite = z.infer<typeof SuiteSchema>"
        },
        {
          "name": "LabelEmbeddedSchema",
          "kind": "const",
          "line": 247,
          "exported": true,
          "signature": "export const LabelEmbeddedSchema = zObject({ id: z.number(), title: z.string().nullish(), name: z.string().nullish(), created_by: z.number().nullish(), created_on: z.number().nullish(), })"
        },
        {
          "name": "LabelEmbedded",
          "kind": "type",
          "line": 255,
          "exported": true,
          "signature": "export type LabelEmbedded = z.infer<typeof LabelEmbeddedSchema>"
        },
        {
          "name": "CaseSchema",
          "kind": "const",
          "line": 259,
          "exported": true,
          "signature": "export const CaseSchema = zObject({ id: z.number(), title: z.string(), section_id: z.number(), template_id: z.number().nullish(), type_id: z.number().nullish(), priority_id: z.number().nullish(), mile…"
        },
        {
          "name": "Case",
          "kind": "type",
          "line": 285,
          "exported": true,
          "signature": "export type Case = z.infer<typeof CaseSchema>"
        },
        {
          "name": "SectionSchema",
          "kind": "const",
          "line": 287,
          "exported": true,
          "signature": "export const SectionSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), parent_id: z.number().nullish(), display_order: z.number(), depth: z.n…"
        },
        {
          "name": "Section",
          "kind": "type",
          "line": 297,
          "exported": true,
          "signature": "export type Section = z.infer<typeof SectionSchema>"
        },
        {
          "name": "MoveSectionPayloadSchema",
          "kind": "const",
          "line": 309,
          "exported": true,
          "signature": "export const MoveSectionPayloadSchema = zObject({ parent_id: z.number().nullable().optional(), after_id: z.number().nullable().optional(), })"
        },
        {
          "name": "MoveSectionPayload",
          "kind": "type",
          "line": 314,
          "exported": true,
          "signature": "export type MoveSectionPayload = z.infer<typeof MoveSectionPayloadSchema>"
        },
        {
          "name": "RunSchema",
          "kind": "const",
          "line": 318,
          "exported": true,
          "signature": "export const RunSchema = zObject({ id: z.number(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), i…"
        },
        {
          "name": "Run",
          "kind": "type",
          "line": 365,
          "exported": true,
          "signature": "export type Run = z.infer<typeof RunSchema>"
        },
        {
          "name": "PlanEntrySchema",
          "kind": "const",
          "line": 369,
          "exported": true,
          "signature": "export const PlanEntrySchema = zObject({ id: z.string(), suite_id: z.number(), name: z.string(), description: z.string().nullish(), assignedto_id: z.number().nullish(), include_all: z.boolean(), case_…"
        },
        {
          "name": "PlanEntry",
          "kind": "type",
          "line": 389,
          "exported": true,
          "signature": "export type PlanEntry = z.infer<typeof PlanEntrySchema>"
        },
        {
          "name": "PlanSchema",
          "kind": "const",
          "line": 391,
          "exported": true,
          "signature": "export const PlanSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), milestone_id: z.number().nullish(), assignedto_id: z.number().nullish(), is_completed: z.boolea…"
        },
        {
          "name": "Plan",
          "kind": "type",
          "line": 429,
          "exported": true,
          "signature": "export type Plan = z.infer<typeof PlanSchema>"
        },
        {
          "name": "TestSchema",
          "kind": "const",
          "line": 433,
          "exported": true,
          "signature": "export const TestSchema = zObject({ id: z.number(), case_id: z.number(), status_id: z.number(), assignedto_id: z.number().nullish(), run_id: z.number(), title: z.string(), template_id: z.number().null…"
        },
        {
          "name": "Test",
          "kind": "type",
          "line": 484,
          "exported": true,
          "signature": "export type Test = z.infer<typeof TestSchema>"
        },
        {
          "name": "ResultSchema",
          "kind": "const",
          "line": 493,
          "exported": true,
          "signature": "export const ResultSchema = zObject({ id: z.number(), test_id: z.number(), status_id: z.number(), comment: z.string().nullish(), version: z.string().nullish(), elapsed: z.string().nullish(), defects: …"
        },
        {
          "name": "Result",
          "kind": "type",
          "line": 507,
          "exported": true,
          "signature": "export type Result = z.infer<typeof ResultSchema>"
        },
        {
          "name": "MilestoneSchema",
          "kind": "const",
          "line": 511,
          "exported": true,
          "signature": "export const MilestoneSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), start_on: z.number().nullish(), started_on: z.number().nullish(), is_completed: z.boolean(…"
        },
        {
          "name": "Milestone",
          "kind": "type",
          "line": 536,
          "exported": true,
          "signature": "export type Milestone = z.infer<typeof MilestoneSchema>"
        },
        {
          "name": "StatusSchema",
          "kind": "const",
          "line": 540,
          "exported": true,
          "signature": "export const StatusSchema = zObject({ id: z.number(), name: z.string(), label: z.string(), color_dark: z.number(), color_medium: z.number(), color_bright: z.number(), is_system: z.boolean(), is_untest…"
        },
        {
          "name": "Status",
          "kind": "type",
          "line": 552,
          "exported": true,
          "signature": "export type Status = z.infer<typeof StatusSchema>"
        },
        {
          "name": "PrioritySchema",
          "kind": "const",
          "line": 554,
          "exported": true,
          "signature": "export const PrioritySchema = zObject({ id: z.number(), name: z.string(), short_name: z.string(), is_default: z.boolean(), priority: z.number(), })"
        },
        {
          "name": "Priority",
          "kind": "type",
          "line": 562,
          "exported": true,
          "signature": "export type Priority = z.infer<typeof PrioritySchema>"
        },
        {
          "name": "CaseStatusSchema",
          "kind": "const",
          "line": 569,
          "exported": true,
          "signature": "export const CaseStatusSchema = zObject({ case_status_id: z.number(), name: z.string(), abbreviation: z.string(), is_default: z.boolean(), is_approved: z.boolean(), is_untested: z.boolean(), })"
        },
        {
          "name": "CaseStatus",
          "kind": "type",
          "line": 578,
          "exported": true,
          "signature": "export type CaseStatus = z.infer<typeof CaseStatusSchema>"
        },
        {
          "name": "HistoryChangeSchema",
          "kind": "const",
          "line": 584,
          "exported": false,
          "signature": "const HistoryChangeSchema = zObject({ field: z.string().nullish(), type_id: z.number().nullish(), old_text: z.string().nullish(), new_text: z.string().nullish(), label: z.string().nullish(), options: …"
        },
        {
          "name": "HistoryEntrySchema",
          "kind": "const",
          "line": 615,
          "exported": true,
          "signature": "export const HistoryEntrySchema = zObject({ id: z.number(), user_id: z.number(), type_id: z.number(), timestamp: z.number().nullish(), created_on: z.number().nullish(), changes: z.array(HistoryChangeS…"
        },
        {
          "name": "HistoryEntry",
          "kind": "type",
          "line": 624,
          "exported": true,
          "signature": "export type HistoryEntry = z.infer<typeof HistoryEntrySchema>"
        },
        {
          "name": "FieldConfigOptionsSchema",
          "kind": "const",
          "line": 628,
          "exported": false,
          "signature": "const FieldConfigOptionsSchema = zObject({ is_required: z.boolean(), default_value: z.string(), items: z.string().nullish(), format: z.string().nullish(), rows: z.string().nullish(), })"
        },
        {
          "name": "FieldConfigContextSchema",
          "kind": "const",
          "line": 636,
          "exported": false,
          "signature": "const FieldConfigContextSchema = zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), })"
        },
        {
          "name": "CaseFieldConfigSchema",
          "kind": "const",
          "line": 641,
          "exported": true,
          "signature": "export const CaseFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "type",
          "line": 646,
          "exported": true,
          "signature": "export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>"
        },
        {
          "name": "CaseFieldSchema",
          "kind": "const",
          "line": 648,
          "exported": true,
          "signature": "export const CaseFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(CaseFieldConfigS…"
        },
        {
          "name": "CaseField",
          "kind": "type",
          "line": 662,
          "exported": true,
          "signature": "export type CaseField = z.infer<typeof CaseFieldSchema>"
        },
        {
          "name": "AddCaseFieldResponseSchema",
          "kind": "const",
          "line": 683,
          "exported": true,
          "signature": "export const AddCaseFieldResponseSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.string(), i…"
        },
        {
          "name": "AddCaseFieldResponse",
          "kind": "type",
          "line": 708,
          "exported": true,
          "signature": "export type AddCaseFieldResponse = z.infer<typeof AddCaseFieldResponseSchema>"
        },
        {
          "name": "ResultFieldConfigSchema",
          "kind": "const",
          "line": 710,
          "exported": true,
          "signature": "export const ResultFieldConfigSchema = zObject({ context: FieldConfigContextSchema, options: FieldConfigOptionsSchema, })"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "type",
          "line": 715,
          "exported": true,
          "signature": "export type ResultFieldConfig = z.infer<typeof ResultFieldConfigSchema>"
        },
        {
          "name": "ResultFieldSchema",
          "kind": "const",
          "line": 717,
          "exported": true,
          "signature": "export const ResultFieldSchema = zObject({ id: z.number(), system_name: z.string(), label: z.string(), name: z.string(), type_id: z.number(), display_order: z.number(), configs: z.array(ResultFieldCon…"
        },
        {
          "name": "ResultField",
          "kind": "type",
          "line": 731,
          "exported": true,
          "signature": "export type ResultField = z.infer<typeof ResultFieldSchema>"
        },
        {
          "name": "CaseTypeSchema",
          "kind": "const",
          "line": 735,
          "exported": true,
          "signature": "export const CaseTypeSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "CaseType",
          "kind": "type",
          "line": 741,
          "exported": true,
          "signature": "export type CaseType = z.infer<typeof CaseTypeSchema>"
        },
        {
          "name": "TemplateSchema",
          "kind": "const",
          "line": 743,
          "exported": true,
          "signature": "export const TemplateSchema = zObject({ id: z.number(), name: z.string(), is_default: z.boolean(), })"
        },
        {
          "name": "Template",
          "kind": "type",
          "line": 749,
          "exported": true,
          "signature": "export type Template = z.infer<typeof TemplateSchema>"
        },
        {
          "name": "ConfigurationSchema",
          "kind": "const",
          "line": 753,
          "exported": true,
          "signature": "export const ConfigurationSchema = zObject({ id: z.number(), name: z.string(), group_id: z.number(), })"
        },
        {
          "name": "Configuration",
          "kind": "type",
          "line": 759,
          "exported": true,
          "signature": "export type Configuration = z.infer<typeof ConfigurationSchema>"
        },
        {
          "name": "ConfigurationGroupSchema",
          "kind": "const",
          "line": 761,
          "exported": true,
          "signature": "export const ConfigurationGroupSchema = zObject({ id: z.number(), name: z.string(), project_id: z.number(), configs: z.array(ConfigurationSchema), })"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "type",
          "line": 768,
          "exported": true,
          "signature": "export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>"
        },
        {
          "name": "AttachmentSchema",
          "kind": "const",
          "line": 818,
          "exported": true,
          "signature": "export const AttachmentSchema = zObject({ attachment_id: z.number().nullish(), id: z.union([z.number(), z.string()]).nullish(), name: z.string().nullish(), filename: z.string().nullish(), filetype: z.…"
        },
        {
          "name": "Attachment",
          "kind": "type",
          "line": 842,
          "exported": true,
          "signature": "export type Attachment = z.infer<typeof AttachmentSchema>"
        },
        {
          "name": "SharedStepSchema",
          "kind": "const",
          "line": 876,
          "exported": true,
          "signature": "export const SharedStepSchema = zObject({ id: z.number(), title: z.string(), project_id: z.number().nullish(), case_ids: z.array(z.number()).nullish(), created_on: z.number().nullish(), created_by: z.…"
        },
        {
          "name": "SharedStep",
          "kind": "type",
          "line": 888,
          "exported": true,
          "signature": "export type SharedStep = z.infer<typeof SharedStepSchema>"
        },
        {
          "name": "VariableSchema",
          "kind": "const",
          "line": 905,
          "exported": true,
          "signature": "export const VariableSchema = zObject({ id: z.number(), name: z.string(), })"
        },
        {
          "name": "Variable",
          "kind": "type",
          "line": 910,
          "exported": true,
          "signature": "export type Variable = z.infer<typeof VariableSchema>"
        },
        {
          "name": "AddVariablePayloadSchema",
          "kind": "const",
          "line": 912,
          "exported": true,
          "signature": "export const AddVariablePayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddVariablePayload",
          "kind": "type",
          "line": 916,
          "exported": true,
          "signature": "export type AddVariablePayload = z.infer<typeof AddVariablePayloadSchema>"
        },
        {
          "name": "UpdateVariablePayloadSchema",
          "kind": "const",
          "line": 926,
          "exported": true,
          "signature": "export const UpdateVariablePayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateVariablePayload",
          "kind": "type",
          "line": 930,
          "exported": true,
          "signature": "export type UpdateVariablePayload = z.infer<typeof UpdateVariablePayloadSchema>"
        },
        {
          "name": "DatasetVariableSchema",
          "kind": "const",
          "line": 942,
          "exported": true,
          "signature": "export const DatasetVariableSchema = zObject({ id: z.number(), name: z.string(), value: z.string().nullable(), })"
        },
        {
          "name": "DatasetVariable",
          "kind": "type",
          "line": 948,
          "exported": true,
          "signature": "export type DatasetVariable = z.infer<typeof DatasetVariableSchema>"
        },
        {
          "name": "DatasetSchema",
          "kind": "const",
          "line": 963,
          "exported": true,
          "signature": "export const DatasetSchema = zObject({ id: z.number(), name: z.string(), variables: z.array(DatasetVariableSchema).nullish(), })"
        },
        {
          "name": "Dataset",
          "kind": "type",
          "line": 969,
          "exported": true,
          "signature": "export type Dataset = z.infer<typeof DatasetSchema>"
        },
        {
          "name": "AddDatasetPayloadSchema",
          "kind": "const",
          "line": 971,
          "exported": true,
          "signature": "export const AddDatasetPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddDatasetPayload",
          "kind": "type",
          "line": 975,
          "exported": true,
          "signature": "export type AddDatasetPayload = z.infer<typeof AddDatasetPayloadSchema>"
        },
        {
          "name": "UpdateDatasetPayloadSchema",
          "kind": "const",
          "line": 983,
          "exported": true,
          "signature": "export const UpdateDatasetPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateDatasetPayload",
          "kind": "type",
          "line": 987,
          "exported": true,
          "signature": "export type UpdateDatasetPayload = z.infer<typeof UpdateDatasetPayloadSchema>"
        },
        {
          "name": "ReportSchema",
          "kind": "const",
          "line": 1005,
          "exported": true,
          "signature": "export const ReportSchema = zObject({ id: z.number(), name: z.string(), description: z.string().nullish(), notify_user: z.boolean().nullish(), notify_link: z.boolean().nullish(), notify_link_recipient…"
        },
        {
          "name": "Report",
          "kind": "type",
          "line": 1018,
          "exported": true,
          "signature": "export type Report = z.infer<typeof ReportSchema>"
        },
        {
          "name": "ReportResultSchema",
          "kind": "const",
          "line": 1031,
          "exported": true,
          "signature": "export const ReportResultSchema = zObject({ report_url: z.string(), report_html: z.string().nullish(), report_pdf: z.string().nullish(), user_report_url: z.string().nullish(), })"
        },
        {
          "name": "ReportResult",
          "kind": "type",
          "line": 1038,
          "exported": true,
          "signature": "export type ReportResult = z.infer<typeof ReportResultSchema>"
        },
        {
          "name": "AddCasePayloadSchema",
          "kind": "const",
          "line": 1047,
          "exported": true,
          "signature": "export const AddCasePayloadSchema = zObject({ title: z.string(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.string().optional()…"
        },
        {
          "name": "AddCasePayload",
          "kind": "type",
          "line": 1058,
          "exported": true,
          "signature": "export type AddCasePayload = z.infer<typeof AddCasePayloadSchema>"
        },
        {
          "name": "UpdateCasePayloadSchema",
          "kind": "const",
          "line": 1060,
          "exported": true,
          "signature": "export const UpdateCasePayloadSchema = zObject({ title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number().optional(), estimate: z.strin…"
        },
        {
          "name": "UpdateCasePayload",
          "kind": "type",
          "line": 1071,
          "exported": true,
          "signature": "export type UpdateCasePayload = z.infer<typeof UpdateCasePayloadSchema>"
        },
        {
          "name": "AddCasesBulkPayloadSchema",
          "kind": "const",
          "line": 1083,
          "exported": true,
          "signature": "export const AddCasesBulkPayloadSchema = z.array(AddCasePayloadSchema).min(1)"
        },
        {
          "name": "AddCasesBulkPayload",
          "kind": "type",
          "line": 1085,
          "exported": true,
          "signature": "export type AddCasesBulkPayload = z.infer<typeof AddCasesBulkPayloadSchema>"
        },
        {
          "name": "UpdateCasesPayloadSchema",
          "kind": "const",
          "line": 1093,
          "exported": true,
          "signature": "export const UpdateCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), title: z.string().optional(), template_id: z.number().optional(), type_id: z.number().optional(), priority_id: z.number…"
        },
        {
          "name": "UpdateCasesPayload",
          "kind": "type",
          "line": 1105,
          "exported": true,
          "signature": "export type UpdateCasesPayload = z.infer<typeof UpdateCasesPayloadSchema>"
        },
        {
          "name": "DeleteCasesPayloadSchema",
          "kind": "const",
          "line": 1114,
          "exported": true,
          "signature": "export const DeleteCasesPayloadSchema = zObject({ case_ids: z.array(z.number()), }).refine((body) => !Object.prototype.hasOwnProperty.call(body, 'soft'), { message: '`soft` is not a body field — use t…"
        },
        {
          "name": "DeleteCasesPayload",
          "kind": "type",
          "line": 1122,
          "exported": true,
          "signature": "export type DeleteCasesPayload = z.infer<typeof DeleteCasesPayloadSchema>"
        },
        {
          "name": "SoftDeletePreviewSchema",
          "kind": "const",
          "line": 1130,
          "exported": true,
          "signature": "export const SoftDeletePreviewSchema = zObject({ affected_tests: z.number().optional(), affected_cases: z.number().optional(), affected_sections: z.number().optional(), affected_runs: z.number().optio…"
        },
        {
          "name": "SoftDeletePreview",
          "kind": "type",
          "line": 1140,
          "exported": true,
          "signature": "export type SoftDeletePreview = z.infer<typeof SoftDeletePreviewSchema>"
        },
        {
          "name": "CopyCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 1145,
          "exported": true,
          "signature": "export const CopyCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), })"
        },
        {
          "name": "CopyCasesToSectionPayload",
          "kind": "type",
          "line": 1149,
          "exported": true,
          "signature": "export type CopyCasesToSectionPayload = z.infer<typeof CopyCasesToSectionPayloadSchema>"
        },
        {
          "name": "MoveCasesToSectionPayloadSchema",
          "kind": "const",
          "line": 1157,
          "exported": true,
          "signature": "export const MoveCasesToSectionPayloadSchema = zObject({ case_ids: z.array(z.number()), suite_id: z.number(), })"
        },
        {
          "name": "MoveCasesToSectionPayload",
          "kind": "type",
          "line": 1162,
          "exported": true,
          "signature": "export type MoveCasesToSectionPayload = z.infer<typeof MoveCasesToSectionPayloadSchema>"
        },
        {
          "name": "AddCaseFieldConfigPayloadSchema",
          "kind": "const",
          "line": 1179,
          "exported": true,
          "signature": "export const AddCaseFieldConfigPayloadSchema = zObject({ context: zObject({ is_global: z.boolean(), project_ids: z.array(z.number()), }), options: zObject({ is_required: z.boolean(), default_value: z.…"
        },
        {
          "name": "AddCaseFieldConfigPayload",
          "kind": "type",
          "line": 1193,
          "exported": true,
          "signature": "export type AddCaseFieldConfigPayload = z.infer<typeof AddCaseFieldConfigPayloadSchema>"
        },
        {
          "name": "AddCaseFieldPayloadSchema",
          "kind": "const",
          "line": 1195,
          "exported": true,
          "signature": "export const AddCaseFieldPayloadSchema = zObject({ type: z.string(), name: z.string(), label: z.string(), description: z.string().optional(), include_all: z.boolean().optional(), template_ids: z.array…"
        },
        {
          "name": "AddCaseFieldPayload",
          "kind": "type",
          "line": 1205,
          "exported": true,
          "signature": "export type AddCaseFieldPayload = z.infer<typeof AddCaseFieldPayloadSchema>"
        },
        {
          "name": "AddRunPayloadSchema",
          "kind": "const",
          "line": 1207,
          "exported": true,
          "signature": "export const AddRunPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optio…"
        },
        {
          "name": "AddRunPayload",
          "kind": "type",
          "line": 1218,
          "exported": true,
          "signature": "export type AddRunPayload = z.infer<typeof AddRunPayloadSchema>"
        },
        {
          "name": "UpdateRunPayloadSchema",
          "kind": "const",
          "line": 1220,
          "exported": true,
          "signature": "export const UpdateRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), include_all:…"
        },
        {
          "name": "UpdateRunPayload",
          "kind": "type",
          "line": 1230,
          "exported": true,
          "signature": "export type UpdateRunPayload = z.infer<typeof UpdateRunPayloadSchema>"
        },
        {
          "name": "AddResultPayloadSchema",
          "kind": "const",
          "line": 1242,
          "exported": true,
          "signature": "export const AddResultPayloadSchema = zObject({ status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defects: z.string().optional(), a…"
        },
        {
          "name": "AddResultPayload",
          "kind": "type",
          "line": 1252,
          "exported": true,
          "signature": "export type AddResultPayload = z.infer<typeof AddResultPayloadSchema>"
        },
        {
          "name": "AddResultForCasePayloadSchema",
          "kind": "const",
          "line": 1257,
          "exported": true,
          "signature": "export const AddResultForCasePayloadSchema = zObject({ case_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForCasePayload",
          "kind": "type",
          "line": 1268,
          "exported": true,
          "signature": "export type AddResultForCasePayload = z.infer<typeof AddResultForCasePayloadSchema>"
        },
        {
          "name": "AddResultsForCasesPayloadSchema",
          "kind": "const",
          "line": 1270,
          "exported": true,
          "signature": "export const AddResultsForCasesPayloadSchema = zObject({ results: z.array(AddResultForCasePayloadSchema), })"
        },
        {
          "name": "AddResultsForCasesPayload",
          "kind": "type",
          "line": 1274,
          "exported": true,
          "signature": "export type AddResultsForCasesPayload = z.infer<typeof AddResultsForCasesPayloadSchema>"
        },
        {
          "name": "AddResultForTestPayloadSchema",
          "kind": "const",
          "line": 1280,
          "exported": true,
          "signature": "export const AddResultForTestPayloadSchema = zObject({ test_id: z.number(), status_id: z.number(), comment: z.string().optional(), version: z.string().optional(), elapsed: z.string().optional(), defec…"
        },
        {
          "name": "AddResultForTestPayload",
          "kind": "type",
          "line": 1291,
          "exported": true,
          "signature": "export type AddResultForTestPayload = z.infer<typeof AddResultForTestPayloadSchema>"
        },
        {
          "name": "AddResultsPayloadSchema",
          "kind": "const",
          "line": 1293,
          "exported": true,
          "signature": "export const AddResultsPayloadSchema = zObject({ results: z.array(AddResultForTestPayloadSchema), })"
        },
        {
          "name": "AddResultsPayload",
          "kind": "type",
          "line": 1297,
          "exported": true,
          "signature": "export type AddResultsPayload = z.infer<typeof AddResultsPayloadSchema>"
        },
        {
          "name": "PlanEntryRunPayloadSchema",
          "kind": "const",
          "line": 1306,
          "exported": true,
          "signature": "export const PlanEntryRunPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids:…"
        },
        {
          "name": "PlanEntryRunPayload",
          "kind": "type",
          "line": 1316,
          "exported": true,
          "signature": "export type PlanEntryRunPayload = z.infer<typeof PlanEntryRunPayloadSchema>"
        },
        {
          "name": "AddRunToPlanEntryPayloadSchema",
          "kind": "const",
          "line": 1323,
          "exported": true,
          "signature": "export const AddRunToPlanEntryPayloadSchema = zObject({ config_ids: z.array(z.number()), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), …"
        },
        {
          "name": "AddRunToPlanEntryPayload",
          "kind": "type",
          "line": 1332,
          "exported": true,
          "signature": "export type AddRunToPlanEntryPayload = z.infer<typeof AddRunToPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdateRunInPlanEntryPayloadSchema",
          "kind": "const",
          "line": 1337,
          "exported": true,
          "signature": "export const UpdateRunInPlanEntryPayloadSchema = zObject({ description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean().optional(), case_ids: z.array(z.number()).…"
        },
        {
          "name": "UpdateRunInPlanEntryPayload",
          "kind": "type",
          "line": 1344,
          "exported": true,
          "signature": "export type UpdateRunInPlanEntryPayload = z.infer<typeof UpdateRunInPlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanEntryPayloadSchema",
          "kind": "const",
          "line": 1346,
          "exported": true,
          "signature": "export const AddPlanEntryPayloadSchema = zObject({ suite_id: z.number(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_all: z.boolean()…"
        },
        {
          "name": "AddPlanEntryPayload",
          "kind": "type",
          "line": 1369,
          "exported": true,
          "signature": "export type AddPlanEntryPayload = z.infer<typeof AddPlanEntryPayloadSchema>"
        },
        {
          "name": "UpdatePlanEntryPayloadSchema",
          "kind": "const",
          "line": 1371,
          "exported": true,
          "signature": "export const UpdatePlanEntryPayloadSchema = zObject({ suite_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(), assignedto_id: z.number().optional(), include_al…"
        },
        {
          "name": "UpdatePlanEntryPayload",
          "kind": "type",
          "line": 1391,
          "exported": true,
          "signature": "export type UpdatePlanEntryPayload = z.infer<typeof UpdatePlanEntryPayloadSchema>"
        },
        {
          "name": "AddPlanPayloadSchema",
          "kind": "const",
          "line": 1393,
          "exported": true,
          "signature": "export const AddPlanPayloadSchema = zObject({ name: z.string(), description: z.string().optional(), milestone_id: z.number().optional(), start_on: z.number().optional(), due_on: z.number().optional(),…"
        },
        {
          "name": "AddPlanPayload",
          "kind": "type",
          "line": 1406,
          "exported": true,
          "signature": "export type AddPlanPayload = z.infer<typeof AddPlanPayloadSchema>"
        },
        {
          "name": "UpdatePlanPayloadSchema",
          "kind": "const",
          "line": 1408,
          "exported": true,
          "signature": "export const UpdatePlanPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), milestone_id: z.number().optional(), assignedto_id: z.number().optional(), start_on: z…"
        },
        {
          "name": "UpdatePlanPayload",
          "kind": "type",
          "line": 1421,
          "exported": true,
          "signature": "export type UpdatePlanPayload = z.infer<typeof UpdatePlanPayloadSchema>"
        },
        {
          "name": "AddProjectPayloadSchema",
          "kind": "const",
          "line": 1431,
          "exported": true,
          "signature": "export const AddProjectPayloadSchema = zObject({ name: z.string(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "AddProjectPayload",
          "kind": "type",
          "line": 1438,
          "exported": true,
          "signature": "export type AddProjectPayload = z.infer<typeof AddProjectPayloadSchema>"
        },
        {
          "name": "UpdateProjectPayloadSchema",
          "kind": "const",
          "line": 1440,
          "exported": true,
          "signature": "export const UpdateProjectPayloadSchema = zObject({ name: z.string().optional(), announcement: z.string().optional(), show_announcement: z.boolean().optional(), suite_mode: z.number().optional(), })"
        },
        {
          "name": "UpdateProjectPayload",
          "kind": "type",
          "line": 1447,
          "exported": true,
          "signature": "export type UpdateProjectPayload = z.infer<typeof UpdateProjectPayloadSchema>"
        },
        {
          "name": "AddSuitePayloadSchema",
          "kind": "const",
          "line": 1449,
          "exported": true,
          "signature": "export const AddSuitePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), })"
        },
        {
          "name": "AddSuitePayload",
          "kind": "type",
          "line": 1454,
          "exported": true,
          "signature": "export type AddSuitePayload = z.infer<typeof AddSuitePayloadSchema>"
        },
        {
          "name": "UpdateSuitePayloadSchema",
          "kind": "const",
          "line": 1456,
          "exported": true,
          "signature": "export const UpdateSuitePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSuitePayload",
          "kind": "type",
          "line": 1461,
          "exported": true,
          "signature": "export type UpdateSuitePayload = z.infer<typeof UpdateSuitePayloadSchema>"
        },
        {
          "name": "AddSectionPayloadSchema",
          "kind": "const",
          "line": 1469,
          "exported": true,
          "signature": "export const AddSectionPayloadSchema = zObject({ name: z.string(), suite_id: z.number().optional(), parent_id: z.number().optional(), description: z.string().optional(), })"
        },
        {
          "name": "AddSectionPayload",
          "kind": "type",
          "line": 1476,
          "exported": true,
          "signature": "export type AddSectionPayload = z.infer<typeof AddSectionPayloadSchema>"
        },
        {
          "name": "UpdateSectionPayloadSchema",
          "kind": "const",
          "line": 1478,
          "exported": true,
          "signature": "export const UpdateSectionPayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), })"
        },
        {
          "name": "UpdateSectionPayload",
          "kind": "type",
          "line": 1483,
          "exported": true,
          "signature": "export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>"
        },
        {
          "name": "AddMilestonePayloadSchema",
          "kind": "const",
          "line": 1485,
          "exported": true,
          "signature": "export const AddMilestonePayloadSchema = zObject({ name: z.string(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.number().optional(…"
        },
        {
          "name": "AddMilestonePayload",
          "kind": "type",
          "line": 1494,
          "exported": true,
          "signature": "export type AddMilestonePayload = z.infer<typeof AddMilestonePayloadSchema>"
        },
        {
          "name": "UpdateMilestonePayloadSchema",
          "kind": "const",
          "line": 1496,
          "exported": true,
          "signature": "export const UpdateMilestonePayloadSchema = zObject({ name: z.string().optional(), description: z.string().optional(), due_on: z.number().optional(), start_on: z.number().optional(), parent_id: z.numb…"
        },
        {
          "name": "UpdateMilestonePayload",
          "kind": "type",
          "line": 1507,
          "exported": true,
          "signature": "export type UpdateMilestonePayload = z.infer<typeof UpdateMilestonePayloadSchema>"
        },
        {
          "name": "AddSharedStepPayloadSchema",
          "kind": "const",
          "line": 1524,
          "exported": true,
          "signature": "export const AddSharedStepPayloadSchema = zObject({ title: z.string(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "AddSharedStepPayload",
          "kind": "type",
          "line": 1529,
          "exported": true,
          "signature": "export type AddSharedStepPayload = z.infer<typeof AddSharedStepPayloadSchema>"
        },
        {
          "name": "UpdateSharedStepPayloadSchema",
          "kind": "const",
          "line": 1540,
          "exported": true,
          "signature": "export const UpdateSharedStepPayloadSchema = zObject({ title: z.string().optional(), custom_steps_separated: z.array(z.record(z.string(), z.unknown())).optional(), })"
        },
        {
          "name": "UpdateSharedStepPayload",
          "kind": "type",
          "line": 1545,
          "exported": true,
          "signature": "export type UpdateSharedStepPayload = z.infer<typeof UpdateSharedStepPayloadSchema>"
        },
        {
          "name": "AddConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 1555,
          "exported": true,
          "signature": "export const AddConfigurationGroupPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationGroupPayload",
          "kind": "type",
          "line": 1559,
          "exported": true,
          "signature": "export type AddConfigurationGroupPayload = z.infer<typeof AddConfigurationGroupPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationGroupPayloadSchema",
          "kind": "const",
          "line": 1561,
          "exported": true,
          "signature": "export const UpdateConfigurationGroupPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationGroupPayload",
          "kind": "type",
          "line": 1565,
          "exported": true,
          "signature": "export type UpdateConfigurationGroupPayload = z.infer<typeof UpdateConfigurationGroupPayloadSchema>"
        },
        {
          "name": "AddConfigurationPayloadSchema",
          "kind": "const",
          "line": 1567,
          "exported": true,
          "signature": "export const AddConfigurationPayloadSchema = zObject({ name: z.string(), })"
        },
        {
          "name": "AddConfigurationPayload",
          "kind": "type",
          "line": 1571,
          "exported": true,
          "signature": "export type AddConfigurationPayload = z.infer<typeof AddConfigurationPayloadSchema>"
        },
        {
          "name": "UpdateConfigurationPayloadSchema",
          "kind": "const",
          "line": 1573,
          "exported": true,
          "signature": "export const UpdateConfigurationPayloadSchema = zObject({ name: z.string().optional(), })"
        },
        {
          "name": "UpdateConfigurationPayload",
          "kind": "type",
          "line": 1577,
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
          "line": 93,
          "exported": true,
          "signature": "export interface UploadFilePathInput { path: string; type?: string; fd?: number | undefined; }"
        },
        {
          "name": "UploadFileInput",
          "kind": "type",
          "line": 111,
          "exported": true,
          "signature": "export type UploadFileInput = globalThis.Blob | Uint8Array | globalThis.File | UploadFilePathInput"
        },
        {
          "name": "Case",
          "kind": "interface",
          "line": 113,
          "exported": true,
          "signature": "export interface Case { id: number; title: string; section_id: number; template_id?: number | null; type_id?: number | null; priority_id?: number | null; milestone_id?: number | null; refs?: string | …"
        },
        {
          "name": "Suite",
          "kind": "interface",
          "line": 156,
          "exported": true,
          "signature": "export interface Suite { id: number; name: string; description?: string | null; project_id: number; is_master?: boolean | null; is_baseline?: boolean | null; is_completed?: boolean | null; completed_o…"
        },
        {
          "name": "Section",
          "kind": "interface",
          "line": 171,
          "exported": true,
          "signature": "export interface Section { id: number; suite_id: number; name: string; description?: string | null; parent_id?: number | null; display_order: number; depth: number; }"
        },
        {
          "name": "Project",
          "kind": "interface",
          "line": 181,
          "exported": true,
          "signature": "export interface Project { id: number; name: string; announcement?: string | null; show_announcement?: boolean | null; is_completed?: boolean | null; completed_on?: number | null; suite_mode: number; …"
        },
        {
          "name": "Plan",
          "kind": "interface",
          "line": 218,
          "exported": true,
          "signature": "export interface Plan { id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; is_completed: boolean; completed_on?: number | null; passed_…"
        },
        {
          "name": "PlanEntry",
          "kind": "interface",
          "line": 253,
          "exported": true,
          "signature": "export interface PlanEntry { id: string; suite_id: number; name: string; description?: string | null; assignedto_id?: number | null; include_all: boolean; case_ids?: number[] | null; config_ids?: numb…"
        },
        {
          "name": "Run",
          "kind": "interface",
          "line": 272,
          "exported": true,
          "signature": "export interface Run { id: number; suite_id: number; name: string; description?: string | null; milestone_id?: number | null; assignedto_id?: number | null; include_all: boolean; is_completed: boolean…"
        },
        {
          "name": "Test",
          "kind": "interface",
          "line": 317,
          "exported": true,
          "signature": "export interface Test { id: number; case_id: number; status_id: number; assignedto_id?: number | null; run_id: number; title: string; template_id?: number | null; type_id?: number | null; priority_id?…"
        },
        {
          "name": "Result",
          "kind": "interface",
          "line": 359,
          "exported": true,
          "signature": "export interface Result { id: number; test_id: number; status_id: number; comment?: string | null; version?: string | null; elapsed?: string | null; defects?: string | null; assignedto_id?: number | n…"
        },
        {
          "name": "Milestone",
          "kind": "interface",
          "line": 374,
          "exported": true,
          "signature": "export interface Milestone { id: number; name: string; description?: string | null; start_on?: number | null; started_on?: number | null; is_completed: boolean; completed_on?: number | null; due_on?: …"
        },
        {
          "name": "User",
          "kind": "interface",
          "line": 396,
          "exported": true,
          "signature": "export interface User { id: number; name: string; email: string; is_active: boolean; role_id?: number | null; role?: string | null; email_notifications?: boolean | null; is_admin?: boolean | null; gro…"
        },
        {
          "name": "Status",
          "kind": "interface",
          "line": 420,
          "exported": true,
          "signature": "export interface Status { id: number; name: string; label: string; color_dark: number; color_medium: number; color_bright: number; is_system: boolean; is_untested: boolean; is_final: boolean; }"
        },
        {
          "name": "Priority",
          "kind": "interface",
          "line": 432,
          "exported": true,
          "signature": "export interface Priority { id: number; name: string; short_name: string; is_default: boolean; priority: number; }"
        },
        {
          "name": "CaseStatus",
          "kind": "interface",
          "line": 440,
          "exported": true,
          "signature": "export interface CaseStatus { case_status_id: number; name: string; abbreviation: string; is_default: boolean; is_approved: boolean; is_untested: boolean; }"
        },
        {
          "name": "HistoryChange",
          "kind": "interface",
          "line": 449,
          "exported": true,
          "signature": "export interface HistoryChange { field?: string | null; type_id?: number | null; old_text?: string | null; new_text?: string | null; label?: string | null; options?: unknown[] | null; old_value?: stri…"
        },
        {
          "name": "HistoryEntry",
          "kind": "interface",
          "line": 465,
          "exported": true,
          "signature": "export interface HistoryEntry { id: number; user_id: number; type_id: number; timestamp?: number | null; created_on?: number | null; changes?: HistoryChange[] | null; }"
        },
        {
          "name": "SoftDeleteOptions",
          "kind": "interface",
          "line": 491,
          "exported": true,
          "signature": "export interface SoftDeleteOptions { soft?: boolean; }"
        },
        {
          "name": "GetCasesOptions",
          "kind": "interface",
          "line": 500,
          "exported": true,
          "signature": "export interface GetCasesOptions { suiteId?: number; sectionId?: number; typeId?: number; priorityId?: number; templateId?: number; milestoneId?: number; createdAfter?: number; createdBefore?: number;…"
        },
        {
          "name": "GetRunsOptions",
          "kind": "interface",
          "line": 537,
          "exported": true,
          "signature": "export interface GetRunsOptions { createdAfter?: number; createdBefore?: number; createdBy?: number[]; isCompleted?: boolean; milestoneId?: number; refsFilter?: string; suiteId?: number; limit?: numbe…"
        },
        {
          "name": "ResultFieldConfig",
          "kind": "interface",
          "line": 558,
          "exported": true,
          "signature": "export interface ResultFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; row…"
        },
        {
          "name": "ResultField",
          "kind": "interface",
          "line": 572,
          "exported": true,
          "signature": "export interface ResultField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: ResultFieldConfig[]; is_active: boolean; include_all: bool…"
        },
        {
          "name": "CaseFieldConfig",
          "kind": "interface",
          "line": 594,
          "exported": true,
          "signature": "export interface CaseFieldConfig { context: { is_global: boolean; project_ids: number[]; }; options: { is_required: boolean; default_value: string; items?: string | null; format?: string | null; rows?…"
        },
        {
          "name": "CaseField",
          "kind": "interface",
          "line": 609,
          "exported": true,
          "signature": "export interface CaseField { id: number; system_name: string; label: string; name: string; type_id: number; display_order: number; configs: CaseFieldConfig[]; is_active: boolean; include_all: boolean;…"
        },
        {
          "name": "CaseType",
          "kind": "interface",
          "line": 629,
          "exported": true,
          "signature": "export interface CaseType { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Template",
          "kind": "interface",
          "line": 638,
          "exported": true,
          "signature": "export interface Template { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Configuration",
          "kind": "interface",
          "line": 647,
          "exported": true,
          "signature": "export interface Configuration { id: number; name: string; group_id: number; }"
        },
        {
          "name": "ConfigurationGroup",
          "kind": "interface",
          "line": 654,
          "exported": true,
          "signature": "export interface ConfigurationGroup { id: number; name: string; project_id: number; configs: Configuration[]; }"
        },
        {
          "name": "CacheEntry",
          "kind": "interface",
          "line": 666,
          "exported": true,
          "signature": "export interface CacheEntry<T> { data: T; expiry: number; }"
        },
        {
          "name": "RateLimiterConfig",
          "kind": "interface",
          "line": 671,
          "exported": true,
          "signature": "export interface RateLimiterConfig { maxRequests: number; windowMs: number; }"
        },
        {
          "name": "GetPlansOptions",
          "kind": "interface",
          "line": 683,
          "exported": true,
          "signature": "export interface GetPlansOptions { created_after?: number; created_before?: number; created_by?: number[]; is_completed?: 0 | 1; milestone_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetTestsOptions",
          "kind": "interface",
          "line": 703,
          "exported": true,
          "signature": "export interface GetTestsOptions { status_id?: number[]; limit?: number; offset?: number; }"
        },
        {
          "name": "GetResultsOptions",
          "kind": "interface",
          "line": 716,
          "exported": true,
          "signature": "export interface GetResultsOptions { created_after?: number; created_before?: number; created_by?: number[]; status_id?: number[]; defects_filter?: string; limit?: number; offset?: number; }"
        },
        {
          "name": "GetMilestonesOptions",
          "kind": "interface",
          "line": 740,
          "exported": true,
          "signature": "export interface GetMilestonesOptions { is_completed?: 0 | 1; limit?: number; offset?: number; }"
        },
        {
          "name": "AddUserPayload",
          "kind": "interface",
          "line": 752,
          "exported": true,
          "signature": "export interface AddUserPayload { email: string; name: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "UpdateUserPayload",
          "kind": "interface",
          "line": 766,
          "exported": true,
          "signature": "export interface UpdateUserPayload { email?: string; name?: string; is_active?: boolean; role_id?: number; password?: string; }"
        },
        {
          "name": "Role",
          "kind": "interface",
          "line": 782,
          "exported": true,
          "signature": "export interface Role { id: number; name: string; is_default: boolean; }"
        },
        {
          "name": "Attachment",
          "kind": "interface",
          "line": 817,
          "exported": true,
          "signature": "export interface Attachment { attachment_id?: number | null; id?: number | string | null; name?: string | null; filename?: string | null; filetype?: string | null; size?: number | null; created_on?: n…"
        },
        {
          "name": "Report",
          "kind": "interface",
          "line": 897,
          "exported": true,
          "signature": "export interface Report { id: number; name: string; description?: string | null; notify_user?: boolean | null; notify_link?: boolean | null; notify_link_recipients?: string | null; notify_attachment?:…"
        },
        {
          "name": "ReportResult",
          "kind": "interface",
          "line": 928,
          "exported": true,
          "signature": "export interface ReportResult { report_url: string; report_html?: string | null; report_pdf?: string | null; user_report_url?: string | null; }"
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
