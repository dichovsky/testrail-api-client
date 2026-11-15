# Live-API Schema Audit — 2026-06-22

This audit tested `@dichovsky/testrail-api-client` schemas and client methods
against a **live TestRail Cloud instance**. The goal was to capture live
response types and compare them against the repository's Zod schemas. This
comparison identified type mismatches and missing response fields. All confirmed
defects were fixed in the same change.

## Method

- **Temporary project**: the audit created a temporary project
  (`SCHEMA-PROBE-<ts>`) to isolate all writes and deletes. Deleting that project
  at the end removed all project-scoped test data.
- **Dual capture**: the harness called each reachable endpoint with a raw `fetch`
  to record the unmodified JSON response. It then ran the shipped Zod schema
  against the captured response offline to identify validation failures.
- **Verification**: each candidate finding was checked against the raw JSON
  response and evaluated for overfitting before acceptance.
- **Fix policy**: schemas were updated to match the observed responses while
  keeping `.passthrough()` on every object schema instead of `.strict()`. If
  another TestRail version returns an extra field, the schema passes it through
  instead of rejecting the response. The audit did not remove `missing_in_real`
  fields or narrow per-instance `custom_*` fields.
- **Cleanup**: the harness used an append-only ledger, `delete_project`, a
  name-prefix sweep, and a final verification check. It also deleted the global
  group explicitly because `delete_project` does not remove global groups. The
  temporary probe script was deleted and not committed. The commit includes only
  sanitized fixtures, regression tests, schema and module fixes, and this report.

## Coverage

- **Target surface**: 117 documented endpoints.
- **Tested with a 2xx response**: 81 endpoint calls across read, write, update,
  and destructive operations. These calls covered single and bulk writes,
  pagination envelopes, multipart uploads, binary downloads, and soft-delete
  previews.
- **Not tested on this instance (16)**: skipped due to instance limits, **not**
  schema defects:

    | Reason                                           | Endpoints                                                                                                                                                                                         |
    | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Enterprise license required                      | `get_case_statuses`, `get_variables`, `get_datasets`, `add_variable`, `add_dataset`                                                                                                               |
    | Configuration permission denied                  | `add_config_group` (+ `add/update/delete_config*`), `add_run_to_plan_entry` (requires `config_ids`)                                                                                               |
    | Test-result/label permission denied              | `update_test`, `update_tests`, `delete_milestone`                                                                                                                                                 |
    | Closed-state / precondition                      | `delete_run`/`delete_plan`/`delete_plan_entry`/`delete_run_from_plan_entry` (run/plan was closed first), `update_run_in_plan_entry` (needs a config-split entry), `add_bdd` (BDD-enabled section) |
    | Intentionally skipped (irreversible global data) | `add_user`, `update_user`, `add_case_field`                                                                                                                                                       |

The audit also ran open-entity deletes (`delete_case`, `delete_section`,
`delete_suite`, `delete_shared_step`, and `delete_group`) and confirmed that
they return an empty response body.

## Confirmed defects (fixed)

The audit verified each row below by running the shipped schema against the
captured live response.

### CRITICAL — validation failures on live responses

| Schema / method                                                                                 | Defect                                                                                                | Real wire value | Fix                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `UserSchema.mfa_required`                                                                       | `z.boolean()`, but the server returns an **integer** (`getCurrentUser` / `getUser` / `getUsers` fail) | `0`             | `z.union([z.boolean(), z.number()]).nullish()`                                     |
| `AttachmentSchema.data_id`                                                                      | `z.string()`, but the server returns a **number**                                                     | `1000006328`    | `z.union([z.number(), z.string()]).nullish()`                                      |
| `getAttachmentsForTest` / `getAttachmentsForPlanEntry` (and `_case`/`_run`/`_plan` defensively) | Parsed with `z.object({attachments…})`, but TestRail returns a **bare array**                         | `[]`            | Accept `z.union([z.array(...), z.object({...})])` and unwrap                       |
| `StepHistoryEntrySchema.id` / `user_id`                                                         | `z.string()`, but the server returns a **number**                                                     | `23`, `40`      | `z.union([z.number(), z.string()])` (accepts observed integer and documented text) |
| `getSharedStepHistory`                                                                          | Parsed with `z.object({step_history…})`, but TestRail returns a **bare array**                        | `[]`            | Union and unwrap (matches `getSharedSteps`)                                        |
| `FieldConfigOptionsSchema.default_value`                                                        | Required `z.string()`, but some configs **omit** the key (`getCaseFields` / `getResultFields` fail)   | `undefined`     | `z.string().nullish()`                                                             |

### HIGH — missing fields and client bug

| Target                                              | Defect                                                                                                                     | Fix                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `AttachmentSchema`                                  | `cassandra_file_id` (UUID string) missing from schema                                                                      | Add `z.string().nullish()`              |
| `CaseFieldConfigSchema` / `ResultFieldConfigSchema` | Config-level `id` (UUID or legacy hex) missing from schema                                                                 | Add `id: z.string().nullish()`          |
| `updateGroup` (client method)                       | Sent `update_group/{id}` with body `{name?, user_ids?}`. TestRail requires `group_id` **in the body** and returns HTTP 400 | Inject `group_id` into the request body |

### MEDIUM — additive fields (previously untyped passthrough; now typed)

| Schema                                                                                     | Added field                                                                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `StatusSchema`, `CaseFieldSchema`, `ResultFieldSchema`, `CaseTypeSchema`, `TemplateSchema` | `i18n_custom_id: z.string().nullish()` (string when set, `null` on case types)               |
| `RoleSchema`                                                                               | `is_project_admin: z.boolean().nullish()`                                                    |
| `PlanEntrySchema`                                                                          | `dynamic_filters: z.unknown().nullish()`                                                     |
| `FieldConfigOptionsSchema`                                                                 | `has_expected` / `has_actual` / `has_additional` / `has_reference` (`z.boolean().nullish()`) |

## Deliberately NOT changed in the original audit

- **Pagination envelopes** (`offset`, `limit`, `size`, and `_links`): the
  original audit unwrapped and discarded these fields so existing methods kept
  their `Entity[]` return type. The 2026-08 follow-up below added explicit page
  and aggregate methods while keeping `Entity[]` on the existing methods.
- **`missing_in_real` fields:** The audit kept `ProjectSchema.users[].id/role_id` and `custom_fields` records. Their absence on one instance does not prove that TestRail never returns them.
- **Flattened `custom_*` fields:** Fields such as `custom_ai_*` and `custom_steps_separated` vary by instance on `Case`, `Test`, and `Result`. The schemas therefore do not list them as static properties.

## Follow-up — explicit pagination and type coverage (2026-08)

The 2026-08 update added metadata access without breaking existing callers. For
23 audited endpoints, existing `get*()` methods still send one request and
return `Entity[]`. New `get*Page()` methods return a normalized `Page<T>`, and
new `getAll*()` methods fetch all pages within configured safety bounds. This set covers cases, case history, projects, suites, sections, plans, runs, tests, and milestones. It includes all three result lists, labels, shared steps, shared-step history, and case, run, and plan attachments. Datasets, variables, roles, groups, and case statuses complete the set. It excludes test attachments, plan-entry attachments,
users, and standard metadata, configuration, and report lists.

The client reads continuation offsets from `_links.next`, but it never follows
the link host or path directly. Instead, it validates the continuation parameters
and rebuilds the request for the known endpoint with the original filters. Legacy
bare arrays stop pagination immediately. Page reads use a separate strict-schema
cache namespace. All-page reads bypass cache reads, cache writes, and request
coalescing, and they never return partial results. Default bounds are 250 items
per page, offset 0, 100 pages, 25,000 items, 300,000 ms, and 100 MiB. Hard
ceilings are 250 items per page, 300,000 ms, and 1 GiB. On failure, the client
throws `TestRailPaginationError` with a reason code and progress counters.
Shared-step history, datasets, variables, roles, groups, and case statuses are response-driven endpoints. Page and all-page modes therefore reject caller page size and offset parameters.

Public response type aliases now derive from declared schema keys so
`.passthrough()` does not add an unrestricted string index signature. Only
`Case`, `Test`, and `Result` include a `custom_*` template-literal index
signature (typed as `unknown`), while their nested `custom_fields` property
remains deprecated. This update also added `Test.refs_data`, `Test.case_title`,
`Result.case_title`, `Result.case_refs`, `CaseField.is_indexed`,
`CaseField.is_system`, `ResultField.is_system`, writable
`AddCaseFieldPayload.is_indexed`, and recursive `Milestone.milestones`.

## Verification

- The regression suite `tests/live-audit-regression.test.ts` (16 tests) verifies
  every fix against sanitized fixtures in `tests/fixtures/live-audit/`. Strings
  in the fixtures are replaced with `redacted`, while numbers, booleans, `null`
  values, and keys remain unchanged. The tests failed before the fixes and
  passed after them.
- Existing `getSharedStepHistory` client and CLI tests were updated from string
  IDs to numeric IDs.
- **During the original audit, the manual interfaces in `src/types.ts` were
  updated to match the schemas.** The 2026-08 update replaced those manual
  interfaces with type aliases derived from the schemas.
- All verification checks passed: `typecheck`, `lint`, `vitest` (3,255 passing
  tests), `codemap:check`, `mapping:check`, `agents-md:check`, and
  `schema-conventions`.
