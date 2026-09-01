# TestRail 10.7.0 API compatibility audit

Audit date: **2026-09-02**  
Target: **TestRail 10.7.0 (Default 1021)**

This document records the source corpus, counting method, corrections, and
remaining documentation ambiguities used to align this client with TestRail
10.7.0. It complements the generated endpoint matrix in
[`API-MAPPING.md`](API-MAPPING.md); that matrix remains the source for exact
method, CLI action, and recipe mappings.

TestRail does not publish a formal, versioned OpenAPI document for 10.7.0.
The compatibility target is therefore the cumulative official Help Center
reference, supplemented by TestRail release notes and official `gurock/trcli`
source where the current reference omits an operation or contradicts itself.

## Official source corpus

The audit used primary TestRail sources:

- [Current API reference](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference)
  — 27 reference articles containing 125 listed operations at the audit date.
- Release notes for
  [10.7.0](https://support.testrail.com/hc/en-us/articles/52231138481684-TestRail-10-7-0-Default-1021),
  [10.6.1](https://support.testrail.com/hc/en-us/articles/51202137678228-TestRail-10-6-1-Default-1001),
  [10.5.1](https://support.testrail.com/hc/en-us/articles/50194016906900-TestRail-10-5-1-Default-1001), and
  [10.4.1](https://support.testrail.com/hc/en-us/articles/49356250602388-TestRail-10-4-1-Default-1004)
  for cumulative API changes not consistently indexed in the current section.
- [TestRail 7.0 release notes](https://support.testrail.com/hc/en-us/articles/16952601525908-TestRail-7-0-Default),
  which already describe `add_cases` as an updated endpoint and therefore
  disprove the former 7.5+ client gate.
- [BDD commands reference](https://support.testrail.com/hc/en-us/articles/45582376878100-Behaviour-Driven-Development-BDD-commands-reference)
  for `update_bdd`.
- The official TRCLI implementations for
  [`get_test` with `with_data`](https://github.com/gurock/trcli/blob/v1.15.2/trcli/api/test_handler.py)
  and [label routes](https://github.com/gurock/trcli/blob/v1.15.2/trcli/api/label_manager.py)
  where the Help Center index is incomplete or imprecise.

The field- and filter-level comparison also used the current official articles
for [Tests](https://support.testrail.com/hc/en-us/articles/7077990441108-Tests),
[Results](https://support.testrail.com/hc/en-us/articles/7077819312404-Results),
[Users](https://support.testrail.com/hc/en-us/articles/7077978310292-Users),
[Datasets](https://support.testrail.com/hc/en-us/articles/7077300491540-Datasets),
[Plans](https://support.testrail.com/hc/en-us/articles/7077711537684-Plans), and
[Shared Steps](https://support.testrail.com/hc/en-us/articles/7077919815572-Shared-Steps).

## Inventory result

The current reference's 125 operations plus eight cumulative operations found
in release notes or auxiliary official references gives **133 unique
HTTP-verb/path operations**. The eight are `get_bdds`, `update_bdd`,
`get_case_titles`, `add_cases`, `add_label`, `delete_label`, `delete_labels`,
and `get_version`.

The repository exposes:

- **133 endpoint-bound public client methods** — exact route/verb parity; no
  missing, extra, or obsolete endpoint method was found.
- **48 pagination projection helpers** — `get*Page()` and `getAll*()` for 24
  registered list endpoints — for **181 public domain methods** in total.
- **134 CLI actions**. Every endpoint-bound method has a CLI action; `run watch`
  is the one extra action because it repeatedly calls the same `get_run`
  endpoint as `run get`. Pagination helpers are available through `--page` and
  `--all`, including their bounded aggregate controls.
- A generated SKILL command table, complete option reference, payload schema
  index, and manual recipes covering the same agent-facing CLI surface.

The route count is deliberately based on unique `(HTTP verb, path)` pairs,
not method names, helpers, or CLI workflows. This prevents pagination helpers
and `run watch` from being misreported as TestRail endpoints.

## Missing, incorrect, and obsolete result

- **Missing routes:** none. All 133 cumulative 10.7 operations have a public
  client method, CLI action, and SKILL binding.
- **Extra or obsolete routes:** none. No official 10.7 source marks one of the
  133 operations obsolete or deprecated, and the client has no unproven extra
  route/verb pair.
- **Incorrect contracts:** the field, filter, payload, and provenance defects
  found during the audit are listed below and were corrected. Removed items
  such as user `password`/`language`, `update_plan.assignedto_id`, the no-op
  `--case-id`, and the `add_cases` 7.5 gate were client-model defects, not
  obsolete TestRail endpoints.
- **Client deprecations:** retained snake_case option aliases and legacy
  positional overloads are compatibility shims. They must not be interpreted
  as server-side deprecations.

## Corrections made by this audit

- Results list filters now match each endpoint: `defects_filter` is supported
  where documented, while run-only creator/time filters no longer leak onto
  the other result routes. CLI page and all-page modes retain the filters.
- Shared-step lists now expose the documented created/updated/user/reference
  filters, and deletion supports the `keep_in_cases` request field through
  `--keep-in-cases`.
- Project and milestone lists now expose `is_completed` and `is_started` with
  pagination-safe filter retention. Milestone hierarchy/start fields are
  documented as 5.3+; setting `is_started` is update-only, while list reads can
  filter by it.
- `get_test` now accepts the exact `with_data=0|1` control. With `1`, the client
  normalizes TestRail's `{ test, results, attachments }` wrapper into one test
  object containing `results` and `attachments`; the CLI exposes
  `--with-data 1`.
- `get_users` now uses its optional project path scope and no longer advertises
  unsupported pagination. `--user-email` is separate from authentication
  `--email`. User create/update payloads match the documented fields: only
  `name` and `email` are required for create; password and language are not
  claimed as 10.7 fields.
- Case-field configuration, dataset variable maps, plan-entry payloads, and
  project access assignments (`default_role_id`, `groups`, and `users`) were
  corrected to match their conditional/optional 10.7 shapes. Project user
  assignments accept either official `id` spelling, but never both at once.
- `update_plan` no longer advertises the undocumented `assignedto_id`, while a
  plan-entry `suite_id` is required only for multi-suite or baseline projects.
  Run and plan-entry responses now declare their documented nullable
  `dataset_id`.
- The unused `--case-id` CLI option was removed, and the generated option
  registry now keeps CLI help and the SKILL option reference in lockstep.
- The false `add_cases` 7.5+ rejection/rewrite was removed. The public CLI
  still accepts a JSON array, while the module sends and accepts the
  live-proven `{ cases: [...] }` wire envelope and fails closed on an unknown
  successful write response.

## Documented ambiguities that require a 10.7 live probe

These contradictions are not filled with guessed fields or types:

- [TestRail 7.3 release notes](https://support.testrail.com/hc/en-us/articles/16921552763924-TestRail-7-3-Default)
  announce case assignee/status/comment response, filter, and write capabilities
  plus an approvals-enabled project response, but the current Cases and Projects
  articles omit the exact wire names and types.
- The Plans article uses `due_date` in an example but `due_on` in its table and
  says `update_plan` inherits `add_plan` fields without a complete update table.
- The Users article shows `get_current_user/{user_id}`, while the endpoint name,
  semantics, and official TRCLI use `get_current_user` with no ID.
- `copy_cases_to_section` marks `case_ids` optional even though the operation
  cannot identify work without target cases.
- `add_result` marks `status_id` optional in its table while its prose requires
  at least one of status, comment, or assignee.
- Project update documentation says users and groups are supported but lacks a
  complete request table and conflicts between `id` and `user_id` examples.
- Shared-step write tables contain fields that appear copied from list-filter
  documentation. The client models only independently substantiated fields.
- Precise `get_test?with_data=1` wrapper semantics are available in official
  TRCLI rather than the Help Center article.
- The Case Fields article omits `is_indexed`; the 10.6 release notes establish
  an indexing capability in the UI but not a stable API request contract. The
  existing passthrough-compatible field remains an unverified extension.
- Attachment wrapper and pagination prose are inconsistent, particularly for
  test attachments. Aggregation behavior should not change without a live
  instance containing more than 250 attachments.
- Several tables contain clear type/name defects: `edit_result.status_id` is
  shown as boolean, `update_tests` mentions singular `test_id`, and the
  `add_variable` example includes an `id`. The client retains the independently
  substantiated integer, body-list, and name-only contracts.

## Intentional wire-shape tolerances

TestRail documentation and live responses do not always agree. List decoders
therefore tolerate documented envelopes and legacy bare arrays, while explicit
page/all projections still validate continuation structure. Known observations
include a documented shared-step-history wrapper arriving as a bare array,
`mfa_required` arriving as integer `0`/`1` despite a documented boolean, and
`is_untested` being documented on the wrong endpoint. A normal TestRail Cloud
probe also returned no rate-limit headers; `Retry-After` support remains covered
for throttled or future responses.

These tolerances are not treated as new API operations. Unknown successful
responses to non-idempotent bulk writes fail closed with an indeterminate-outcome
error so an agent does not retry work that may already have succeeded.

## Verification contract

The compatibility surface is guarded by generated-artifact checks for the
codemap, API mapping, CLI/SKILL content, and `AGENTS.md`, plus typecheck, lint,
build, and the Vitest suite. Run `npm run test:coverage` for the full coverage
gate. Repository thresholds are 99% for statements, lines, and functions and
98% for branches, all stricter than the 95% compatibility target.
