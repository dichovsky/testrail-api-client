# TestRail 10.7.0 API compatibility audit

Audit date: **2026-09-02**  
Target: **TestRail 10.7.0 (Default 1021)**

This document records sources, counting methods, corrections, and unclear documentation for TestRail 10.7.0 compatibility. It
supplements the generated endpoint matrix in [`API-MAPPING.md`](API-MAPPING.md).
That matrix remains the primary reference for exact method, CLI action, and
recipe mappings.

TestRail does not publish a versioned OpenAPI specification for 10.7.0.
Therefore, this client targets the cumulative official Help Center reference. It
also uses TestRail release notes and the official `gurock/trcli` source code
when the Help Center omits an operation or contradicts itself.

## Official sources

The audit used these primary TestRail sources:

- [Current API reference](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference):
  27 reference articles that list 125 operations on the audit date.
- Release notes for
  [10.7.0](https://support.testrail.com/hc/en-us/articles/52231138481684-TestRail-10-7-0-Default-1021),
  [10.6.1](https://support.testrail.com/hc/en-us/articles/51202137678228-TestRail-10-6-1-Default-1001),
  [10.5.1](https://support.testrail.com/hc/en-us/articles/50194016906900-TestRail-10-5-1-Default-1001), and
  [10.4.1](https://support.testrail.com/hc/en-us/articles/49356250602388-TestRail-10-4-1-Default-1004):
  cumulative API changes that are missing from the main reference index.
- [TestRail 7.0 release notes](https://support.testrail.com/hc/en-us/articles/16952601525908-TestRail-7-0-Default):
  these notes describe `add_cases` as an updated endpoint, which disproves the
  old 7.5+ client gate.
- [BDD commands reference](https://support.testrail.com/hc/en-us/articles/45582376878100-Behaviour-Driven-Development-BDD-commands-reference):
  documentation for `update_bdd`.
- Official TRCLI source code for
  [`get_test` with `with_data`](https://github.com/gurock/trcli/blob/v1.15.2/trcli/api/test_handler.py)
  and [label routes](https://github.com/gurock/trcli/blob/v1.15.2/trcli/api/label_manager.py):
  used where the Help Center index is incomplete or imprecise.

The field and filter comparison also checked the official articles for
[Tests](https://support.testrail.com/hc/en-us/articles/7077990441108-Tests),
[Results](https://support.testrail.com/hc/en-us/articles/7077819312404-Results),
[Users](https://support.testrail.com/hc/en-us/articles/7077978310292-Users),
[Datasets](https://support.testrail.com/hc/en-us/articles/7077300491540-Datasets),
[Plans](https://support.testrail.com/hc/en-us/articles/7077711537684-Plans), and
[Shared Steps](https://support.testrail.com/hc/en-us/articles/7077919815572-Shared-Steps).

## Inventory result

The current reference lists 125 operations. Release notes and auxiliary official
references add eight operations, for a total of **133 unique HTTP-verb/path
operations**. The eight additional operations are `get_bdds`, `update_bdd`,
`get_case_titles`, `add_cases`, `add_label`, `delete_label`, `delete_labels`,
and `get_version`.

The repository provides:

- **133 endpoint-bound public client methods**: exact route and verb parity,
  with no missing, extra, or obsolete endpoint methods.
- **48 pagination projection helpers**: `get*Page()` and `getAll*()` for 24
  registered list endpoints, for **181 public domain methods** in total.
- **134 CLI actions**: every endpoint-bound method has a CLI action. The extra
  action is `run watch`, which polls the same `get_run` endpoint as `run get`.
  The `--page` and `--all` flags expose the pagination helpers and their safety
  bounds.
- A generated SKILL command table, complete option reference, payload schema
  index, and manual recipes for the CLI surface.

The audit counts unique `(HTTP verb, path)` pairs rather than method names,
helpers, or CLI workflows. Consequently, the count does not treat pagination
helpers or `run watch` as separate TestRail endpoints.

## Missing, incorrect, and obsolete result

- **Missing routes:** none. All 133 cumulative 10.7 operations have a public
  client method, CLI action, and SKILL entry.
- **Extra or obsolete routes:** none. No official 10.7 source marks any of the
  133 operations as obsolete or deprecated. The client defines no unverified
  route or verb pairs.
- **Incorrect contracts:** the audit found and fixed the field, filter, payload,
  and provenance defects listed below. Removed items such as user
  `password`/`language`, `update_plan.assignedto_id`, the unused `--case-id`
  flag, and the `add_cases` 7.5 gate were client defects, not obsolete TestRail
  endpoints.
- **Client deprecations:** retained `snake_case` option aliases and legacy
  positional overloads are client compatibility shims. They do not represent
  server-side deprecations.

## Corrections made by this audit

- Results list filters now match each endpoint. The client supports
  `defects_filter` where documented and removes run-only creator and time
  filters from the other result routes. CLI `--page` and `--all` modes preserve
  these filters.
- Shared-step lists now expose the documented created, updated, user, and
  reference filters. Shared-step deletion now supports the `keep_in_cases`
  request field through `--keep-in-cases`.
- Project and milestone lists now expose `is_completed` and `is_started` and
  keep those filters across paginated requests. TestRail 5.3+ documents
  milestone hierarchy and start fields. Only `update_milestone` can set
  `is_started`, while list requests can filter by it.
- `get_test` now accepts the `with_data=0|1` query parameter. When `with_data`
  is `1`, the client normalizes TestRail's `{ test, results, attachments }`
  wrapper into a single test object with `results` and `attachments` arrays. The
  CLI exposes this option as `--with-data 1`.
- `get_users` now supports its optional project path parameter and no longer
  declares unsupported pagination. The `--user-email` flag is separate from the
  authentication `--email` flag. User create and update payloads match the
  documented fields. Only `name` and `email` are required on creation, and the
  schemas omit `password` and `language`.
- The schemas for case-field configuration, dataset variable maps, plan-entry
  payloads, and project access assignments (`default_role_id`, `groups`, and
  `users`) now match their conditional 10.7 shapes. Project user assignments
  accept either `id` or `user_id`, but not both at the same time.
- `update_plan` no longer includes the undocumented `assignedto_id` field. A
  plan-entry `suite_id` is now optional because single-suite projects do not
  require it. Run and plan-entry response schemas now include the nullable
  `dataset_id` field.
- The unused `--case-id` CLI flag was removed. The generated option registry now
  keeps CLI help and the SKILL option reference synchronized.
- The inaccurate `add_cases` 7.5+ version gate was removed. The CLI still
  accepts a JSON array, while the client module sends and parses the
  `{ cases: [...] }` wire envelope. If a write response has an unknown shape,
  the client fails with an indeterminate-outcome error.

## Documented ambiguities that require a 10.7 live probe

The client does not guess fields or types where official sources conflict:

- The [TestRail 7.3 release notes](https://support.testrail.com/hc/en-us/articles/16921552763924-TestRail-7-3-Default)
  mention case assignee, status, and comment fields, plus an approvals-enabled
  project field. However, the current Cases and Projects articles omit the exact
  wire names and types.
- The Plans article shows `due_date` in an example but lists `due_on` in the field table.
  It states that `update_plan` reuses `add_plan` fields, without a separate update table.
- The Users article shows `get_current_user/{user_id}`, whereas the endpoint
  name, description, and official TRCLI call `get_current_user` without an ID.
- The `copy_cases_to_section` article marks `case_ids` as optional, even though
  the operation requires target case IDs.
- The `add_result` table marks `status_id` as optional, while the text requires
  at least one of status, comment, or assignee. A later update resolved this:
  the current Results article states this rule for `add_results` and
  `add_results_for_cases`. Therefore, every add-result schema makes `status_id`
  optional and requires at least one of `status_id`, `comment`, or
  `assignedto_id` per result.
- Project update documentation mentions `users` and `groups` support, but it
  omits a full request table and shows conflicting `id` and `user_id` examples.
- Shared-step write tables list fields that appear copied from list-filter
  tables. The client models only verified write fields.
- Official TRCLI defines the exact `get_test?with_data=1` wrapper structure,
  which the Help Center article omits.
- The Case Fields article omits `is_indexed`. The 10.6 release notes describe UI
  indexing, but they do not define a stable API request contract. The client
  keeps `is_indexed` as an unverified passthrough-compatible field.
- Attachment wrapper and pagination descriptions conflict, especially for test
  attachments. Do not change aggregation behavior without testing against a live
  instance that has more than 250 attachments.
- Several reference tables contain clear type or name errors. For example,
  `edit_result.status_id` is listed as a boolean, `update_tests` lists a
  singular `test_id`, and the `add_variable` example includes an `id` field. The
  client keeps the verified integer, array, and name-only contracts.

## Intentional wire-shape tolerances

Live TestRail responses sometimes differ from the documentation. Therefore, list
decoders accept both documented pagination envelopes and legacy bare arrays,
while `--page` and `--all` modes still validate continuation links. Observed
differences include a bare array from `get_shared_step_history`, integer `0`/`1`
values for `mfa_required` instead of a boolean, and `is_untested` documented on
the wrong endpoint. In addition, a standard TestRail Cloud probe returned no
rate-limit headers, so the client retains `Retry-After` handling for throttled
responses.

These tolerances do not add new API operations. When a non-idempotent bulk write
returns an unrecognized 2xx response, the client throws an indeterminate-outcome
error so callers do not repeat a completed write.

## Verification contract

Generated-artifact checks verify the codemap, API mapping, CLI and SKILL docs,
and `AGENTS.md`. `npm run verify` also runs the TypeScript check, oxlint, the build, and Vitest. Run `npm run test:coverage` to execute the full coverage
check. The repository enforces 99% coverage for statements, lines, and functions
and 98% for branches, which exceeds the 95% compatibility target.
