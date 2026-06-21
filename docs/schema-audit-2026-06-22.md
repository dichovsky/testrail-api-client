# Live-API Schema Audit — 2026-06-22

Audit of `@dichovsky/testrail-api-client` schemas and client methods against a **live TestRail Cloud instance**. Goal: capture real response types and diff them against the repo's Zod schemas to find mismatches (wrong types) and gaps (fields TestRail returns that the schemas don't model). Confirmed defects were fixed in the same change.

## Method

- **Throwaway project**: a uniquely-named project (`SCHEMA-PROBE-<ts>`) was created to confine all writes/deletes; deleting it at the end was the one-call rollback (verified: no residue).
- **Dual capture**: every reachable endpoint was hit with a raw fetch (untouched JSON, ground truth), then the **shipped Zod schema** was run against the real entity offline to prove which schemas actually throw on live data.
- **Adversarial verification**: each candidate finding was re-checked against the raw evidence (default-reject) and scored for over-fit risk before being accepted.
- **Fix policy**: match-observed, but `.passthrough()` is retained on every object schema (never `.strict()`), so a field another instance/version returns that this one didn't still degrades to "untyped extra" rather than a hard reject. `missing_in_real` and per-instance `custom_*` fields were **not** removed/narrowed (over-fit guard).
- **Rollback / cleanup**: append-only ledger + `delete_project` catch-all + name-prefix sweep + verify. The global group (escapes `delete_project`) was deleted explicitly. The probe harness was throwaway (gitignored, deleted); only sanitized fixtures, regression tests, schema/module fixes, and this report are committed.

## Coverage

- **Target surface**: 117 documented endpoints.
- **Exercised with a 2xx capture**: 81 endpoint calls across the full read / write / update / destructive surface (single + bulk, pagination envelopes, multipart upload, binary download, soft-delete preview).
- **Not exercised on this instance (16)** — instance limits, **not** schema defects:
  | Reason | Endpoints |
  | --- | --- |
  | Enterprise license required | `get_case_statuses`, `get_variables`, `get_datasets`, `add_variable`, `add_dataset` |
  | Configuration permission denied | `add_config_group` (+ `add/update/delete_config*`), `add_run_to_plan_entry` (requires `config_ids`) |
  | Test-result/label permission denied | `update_test`, `update_tests`, `delete_milestone` |
  | Closed-state / precondition | `delete_run`/`delete_plan`/`delete_plan_entry`/`delete_run_from_plan_entry` (run/plan was closed first), `update_run_in_plan_entry` (needs a config-split entry), `add_bdd` (BDD-enabled section) |
  | Intentionally skipped (un-rollbackable global writes) | `add_user`, `update_user`, `add_case_field` |

Open-entity deletes (`delete_case`, `delete_section`, `delete_suite`, `delete_shared_step`, `delete_group`) were exercised and confirmed to return an empty/void body.

## Confirmed defects (fixed)

Each row was proven by running the **shipped** schema against the **real** captured entity; "throws" means `getX()` currently rejects a real response on this instance.

### CRITICAL — parse-throwers (the shipped client fails on real data today)

| Schema / method                                                                                 | Defect                                                                                                           | Real wire value | Fix                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| `UserSchema.mfa_required`                                                                       | `z.boolean()` but wire is an **integer** — throws on `getCurrentUser` / `getUser` / `getUsers`                   | `0`             | `z.union([z.boolean(), z.number()]).nullish()`                                    |
| `AttachmentSchema.data_id`                                                                      | `z.string()` but wire is a **number**                                                                            | `1000006328`    | `z.union([z.number(), z.string()]).nullish()`                                     |
| `getAttachmentsForTest` / `getAttachmentsForPlanEntry` (and `_case`/`_run`/`_plan` defensively) | parsed with `z.object({attachments…})` but TestRail returns a **bare array**                                     | `[]`            | accept `z.union([z.array(...), z.object({...})])` and unwrap                      |
| `StepHistoryEntrySchema.id` / `user_id`                                                         | `z.string()` but wire is a **number**                                                                            | `23`, `40`      | `z.union([z.number(), z.string()])` (accepts observed integer + the doc's string) |
| `getSharedStepHistory`                                                                          | parsed with `z.object({step_history…})` but TestRail returns a **bare array**                                    | `[]`            | union + unwrap (mirrors `getSharedSteps`)                                         |
| `FieldConfigOptionsSchema.default_value`                                                        | required `z.string()` but the key is **omitted** on some configs — throws on `getCaseFields` / `getResultFields` | `undefined`     | `z.string().nullish()`                                                            |

### HIGH — real gaps / client bug

| Target                                              | Defect                                                                                                           | Fix                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `AttachmentSchema`                                  | `cassandra_file_id` (UUID string) unmodeled                                                                      | add `z.string().nullish()`              |
| `CaseFieldConfigSchema` / `ResultFieldConfigSchema` | config-level `id` (UUID / legacy hex) unmodeled                                                                  | add `id: z.string().nullish()`          |
| `updateGroup` (client method)                       | sent `update_group/{id}` with body `{name?, user_ids?}`; TestRail requires `group_id` **in the body** → HTTP 400 | inject `group_id` into the request body |

### MEDIUM — additive gaps (passthrough today; now typed)

| Schema                                                                                     | Added field                                                                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `StatusSchema`, `CaseFieldSchema`, `ResultFieldSchema`, `CaseTypeSchema`, `TemplateSchema` | `i18n_custom_id: z.string().nullish()` (string when set, `null` on case types)               |
| `RoleSchema`                                                                               | `is_project_admin: z.boolean().nullish()`                                                    |
| `PlanEntrySchema`                                                                          | `dynamic_filters: z.unknown().nullish()`                                                     |
| `FieldConfigOptionsSchema`                                                                 | `has_expected` / `has_actual` / `has_additional` / `has_reference` (`z.boolean().nullish()`) |

## Deliberately NOT changed (over-fit / by-design)

- **Pagination envelopes** (`offset`/`limit`/`size`/`_links`) on list endpoints are intentionally unwrapped-and-dropped — the method contracts return `Entity[]`. No change.
- **`missing_in_real`** fields (e.g. `ProjectSchema.users[].id/role_id` from a single thin sample, `custom_fields` records) — kept; absence on one instance is not evidence to remove.
- **Flattened `custom_*` fields** on Case/Test/Result (e.g. `custom_ai_*`, `custom_steps_separated`) are dynamic per-instance and remain carried by `.passthrough()` rather than statically typed.

## Verification

- New regression suite `tests/live-audit-regression.test.ts` (16 tests) pins every fix using **sanitized** fixtures under `tests/fixtures/live-audit/` (strings deep-scrubbed to `redacted`; numbers/booleans/null/key-presence preserved exactly — no PII committed). Confirmed RED before the fixes, GREEN after.
- Existing `getSharedStepHistory` tests (client + CLI) were corrected from the prior string-`id` assumption to the real numeric shape.
- **Manual `src/types.ts` interfaces were synced to the widened schemas** — `getCaseFields`/`getResultFields`/`getUser`/`getAttachments*`/`getPlan` return these hand-written interfaces (not the Zod-inferred types), so the widening (`default_value` now optional, `data_id`/`mfa_required` unions, plus the new gap fields) was mirrored there to keep the public types honest (review follow-up).
- Full gate suite green: `typecheck`, `lint`, full `vitest` (3255 passing), `codemap:check`, `mapping:check`, `agents-md:check`, `schema-conventions`.
