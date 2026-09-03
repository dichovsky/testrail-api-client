# Changelog

All notable changes to `@dichovsky/testrail-api-client` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Published to npm:** `1.0.0`, `2.1.0`, `4.0.0`, `4.1.0`, `5.0.0`, `5.0.1`, `5.0.2`, `5.1.0`, `5.2.0`, `5.2.1`, `5.3.0`, `6.0.0`, `7.0.0`.
> Other version headers in this file (`2.0.0`/`2.2.0` and the `3.x` line) were internal
> or unreleased and never reached the registry. The `5.0.0` entry below collapses a
> large body of unreleased work — previously carried on `main` as `5.0.0` through
> `7.1.0` — into a single major bump from the last published release, `4.1.0`. No
> source was reverted in that reconciliation; only the version number and this log
> were realigned with what npm actually shipped.

## [Unreleased]

### Security

- **SSRF guard: IPv4-mapped IPv6 literals no longer bypass private-host blocking.**
  A `baseUrl` such as `https://[::ffff:127.0.0.1]` or
  `https://[::ffff:169.254.169.254]` passed both the construction-time literal
  check and the per-request address check because the WHATWG URL parser
  rewrites the host to the hex form (`[::ffff:7f00:1]`), which only the dotted
  spelling was recognized for, and Node's `fetch` connects that address straight
  to the IPv4 target. Both layers now classify addresses through one
  `net.BlockList`, which applies the IPv4 rules to mapped addresses in every
  spelling. Public mapped addresses (for example `::ffff:8.8.8.8`) remain
  allowed.
- Carrier-grade NAT `100.64.0.0/10` (RFC 6598) is now treated as private
  alongside the RFC 1918 ranges.

## [7.0.0] — 2026-09-02 — TestRail 10.7 API compatibility and stricter validation

### Added — TestRail 10.7.0 API compatibility

- Added the cumulative API surface introduced through TestRail 10.7.0:
  `edit_result`, dynamic-filter discovery/payloads, and run/plan reference
  filters from 10.4; project BDD listing and lightweight case-title lookup
  from 10.5; `get_version` from 10.6; and the repeated `refs[]` query form for
  case and BDD lists from 10.7.
- Added typed programmatic methods and matching CLI actions for
  `case titles`, `bdd list`, `bdd update`, `result edit`, `version get`, and
  `dynamic-filter-field list`. Existing scalar `refs` values remain supported;
  arrays are serialized as repeated `refs[]` parameters where TestRail 10.7
  requires them.
- Completed the TestRail 10.5 label-management surface with create, update,
  single-delete, and bulk-delete operations. Case add/update/bulk-update
  payloads now type and validate mixed label IDs/titles instead of exposing
  them only through passthrough fields.
- Added Enterprise cross-project report discovery and execution through
  `report list-cross-project` and `report run-cross-project`.
- Expanded current case/run/plan list filters, including list-valued ID
  filters, labels, references, and the `include_plan_runs` option where the
  corresponding TestRail endpoint supports them. Test lists now expose the
  documented label-ID filter as well.
- Added `get_test`'s `with_data=0|1` projection to the SDK and CLI. The
  enriched response is normalized to one test object with `results` and
  `attachments` arrays.
- Generated CLI help and the bundled skill now share one typed option
  registry, so every accepted CLI flag has an agent-facing scope and behavior
  description and option drift fails type-checking or generation checks.
- Aligned run, plan, and plan-entry write payloads with the current request tables,
  including `start_on`, `due_on`, and `refs`. Result edits use flat `custom_*`
  fields as documented and reject empty updates. Dynamic-filter payloads now
  require their documented `mode` and `filters` structure.

### Changed — BREAKING

- The CLI now rejects known but action-irrelevant flags before authentication
  instead of silently ignoring them. This includes rejecting real
  `run close --soft` invocations because TestRail cannot preview a close;
  `--dry-run --soft` remains a no-network client-side preview.
- `TestRailConfigSchema` now covers every `TestRailConfig` field and aligns its
  numeric bounds and function-valued hooks with client construction. Client
  construction now also rejects invalid values for previously unchecked
  optional cache, boolean, DNS-lookup, and process-handler settings instead of
  allowing them to fail or behave unpredictably later. Zero-valued documented
  sentinels remain accepted. The legacy `PaginationSchema` remains permissive;
  use `PaginationRequestSchema` for strict request controls.

- `UpdateLabelPayload` and `label update` now require the owning
  `project_id`, matching TestRail's `update_label` request contract. Migrate
  `{ "title": "New" }` payloads to
  `{ "project_id": 123, "title": "New" }`.
- `UpdatePlanEntryPayload` no longer declares `suite_id`, `config_ids`, or
  `runs`: the current `update_plan_entry` contract omits `suite_id` and
  explicitly does not support the other two fields. Because write schemas
  preserve unknown keys for forward compatibility, those legacy keys are no
  longer type-checked locally if supplied through an untyped object; remove
  them instead of relying on client-side validation.
- `UsersModule.getUsers()` now follows the documented optional project path
  (`getUsers(projectId?)`) and no longer advertises unsupported pagination.
  The CLI uses `user list --project-id` and the distinct `--user-email` lookup
  flag, preventing lookup targets from colliding with authentication email.
  `user list --limit/--offset` now fails explicitly instead of silently issuing
  an unbounded request.
- `UpdatePlanPayload` no longer advertises the undocumented `assignedto_id`
  field. `AddPlanEntryPayload.suite_id` is now optional because TestRail only
  requires it for multi-suite and baseline projects.
- The `bdd add --dry-run` acknowledgement now reports `sectionId` rather than
  the incorrect `caseId`. Update automation that reads this JSON field.

### Fixed

- Preserved the deprecated `GetRunsOptions.refsFilter` behavior across server
  generations: the alias now emits both current `refs` and legacy
  `refs_filter`; an explicit `refs` value takes precedence.
- Corrected the `addBdd` parameter and CLI documentation from `caseId` to
  `sectionId`. TestRail's `add_bdd/{section_id}` endpoint creates a new BDD
  case under a section; the request path itself is unchanged.
- Corrected result-list filters by endpoint: all three result reads support
  status/defect filtering, while only `get_results_for_run` accepts creator
  and creation-date filters. CLI default, page, and aggregate modes now retain
  the same filters.
- Added missing documented shared-step filters and `delete_shared_step`'s
  `keep_in_cases` control, project completion and milestone-started filters,
  dataset variable maps, project access assignments, and conditional case-field
  configuration shapes.
- Removed the obsolete no-op `--case-id` CLI flag and stopped advertising
  undocumented user password/language fields and the false TestRail 7.5
  requirement for `add_cases`.

### Internal

- Migrated the build and primary type-check to native TypeScript 7.0.2. The
  compiler-API generators and typed ESLint stack use the aliased TypeScript 6
  compatibility package while the native compiler has no stable Compiler API.
  Packed-package smoke tests compile the published declarations with both
  TypeScript 6 and 7, preserving the TypeScript 6+ consumer guarantee.
- Refreshed every direct dependency to its current release: Zod 4.5.4,
  `@types/node` 26.4.1, typescript-eslint 8.69.0, ESLint 10.9.1, Vitest and its
  V8 coverage provider 4.1.11, lockfile-lint 5.0.1, and tsx 4.23.13. The
  already-current `@eslint/js`, audit-ci, fast-check, and Prettier releases are
  unchanged. The lockfile refresh also removes the obsolete js-yaml audit
  exception; the dependency audit now passes without allowlisted advisories.

## [6.0.0] — 2026-08-11 — advisory validation, safe pagination, and response coverage

Entity-field response validation no longer fails closed. A TestRail response
whose entity fields do not match their Zod schema is returned raw and reported
to a new `onSchemaMismatch` hook instead of throwing. With a non-throwing hook,
structural list/page invariants still fail closed: default list projections
throw `TestRailApiError`, explicit page/all projections throw
`TestRailPaginationError`, and the non-idempotent `addCases` / `updateCases`
bulk writes throw an explicit indeterminate-outcome `TestRailApiError`. These
guards prevent an unknown successful response from masquerading as zero rows or
zero affected cases. A caller hook that throws takes precedence over the
downstream decoder.

The evidence for the change: response-schema corrections have consistently
widened schemas to admit valid TestRail responses rather than narrowed them to
reject invalid ones. Fail-closed response validation repeatedly converted wire
shape differences into client-side outages. Because list endpoints validate a
whole page at once, a single unmodelled row could discard an otherwise valid
page.

### Changed — BREAKING

- **`parse()` no longer throws on a response mismatch.** Code that caught
  `TestRailValidationError` around a read will no longer see it. Restore the old
  behavior in one line:
  `onSchemaMismatch: ({ error }) => { throw handleZodError(error) }`.
  `handleZodError` (exported from the package root) reproduces the exact
  `TestRailValidationError` older versions threw, so existing `instanceof`
  handlers keep matching — a bare `throw error` throws a `ZodError` instead, and
  those handlers silently stop matching.
- **`TestRailClientCore.parse()` takes a required third argument** carrying the
  originating `{ method, endpoint }`. Only relevant if you call `parse()`
  directly; every in-package call site passes it.
- **`onSchemaMismatch` must be synchronous.** A hook that returns a promise now
  has its rejection consumed and immediately throws `TestRailValidationError`;
  the response is neither returned nor cached. TypeScript permits an `async`
  function where a `void` callback is expected, so this runtime guard prevents a
  strict hook from failing open. Use a synchronous
  `throw handleZodError(error)` when restoring 5.x behavior.
- **A schema-invalid GET response is no longer cached.** It is still returned to
  the caller, but caching it would pin a rejected body for the full TTL with no
  further hook notifications. Each subsequent call now re-fetches and re-reports,
  so a transient blip self-heals as it did in 5.x.
- **The CLI reports entity-field drift safely and can opt back into strict
  behavior.** Its default remains advisory, with at most 10 unique,
  deduplicated warnings followed by a safe suppressed-count summary. Warnings
  contain only the HTTP method, CLI resource/action, normalized Zod issue codes,
  and shape-only paths with every segment masked; they never include the
  endpoint, field/record keys, issue messages, or raw response.
  `--strict-responses` or `TESTRAIL_STRICT_RESPONSES=1` stops at the
  first mismatch with exit code 1. A successful mutating request instead throws
  an indeterminate-outcome `TestRailApiError` so CI does not retry it blindly.
  One-shot commands emit no mismatched value and bounded aggregates emit no
  partial array; streaming `run watch` output from completed earlier polls
  cannot be retracted. The environment variable accepts only `1`, `0`, an empty
  value, or unset; every other value fails before authentication/network access.
  `--strict-responses=<value>` forms are rejected. `--quiet` suppresses advisory
  warnings.
- **Malformed default-list outer responses are `TestRailApiError`s in
  non-throwing advisory mode.** The
  successful HTTP response had an unrecognized protocol shape, not a bad caller
  argument, so it no longer surfaces as `TestRailValidationError`. The raw body
  is available only through `.response`; it is never interpolated into the error
  message. Explicit page/all failures retain the structured
  `TestRailPaginationError` contract. Consumers that caught
  `TestRailValidationError` around default list reads with the default hook must catch
  `TestRailApiError` for this condition instead; page/all catch logic is
  unchanged. A throwing hook still propagates before either structural decoder.
- **`tests.updateTests()` returns `UpdateTestsResponse`, not `Test[]`.**
  `update_tests` acknowledges the bulk label assignment —
  `{ test_ids: [1, 2, 3], labels: [{ id, title }] }` — and does not return the
  updated tests. The previous test-list schema was a guess made while the docs
  were unreachable; because the acknowledgement has no `tests` key, **every
  successful call resolved `[]`**, reporting "0 tests updated" for work the
  server had done. New exports: `UpdateTestsResponse`,
  `UpdateTestsResponseSchema`. The matching
  `testrail test update-labels-bulk` command now emits this acknowledgement
  object instead of a test array.
- **Response types widened** where wire evidence exists. Each breaks code that
  reads the field at its old narrow type:
    - `Result.status_id`: `number` → `number | null`. Still a required property:
      the key is always present, only the value is nullable. TestRail returns
      `null` for comment-only results — a comment, defect, or assignment recorded
      with no status change.
    - `CaseStatus.abbreviation`: `string` → `string | null | undefined`, and
      `CaseStatus.is_untested`: `boolean` → `boolean | null | undefined`. Two
      independent defects that made `getCaseStatuses()` fail on affected
      Enterprise instances: the built-in Approved/Draft statuses ship with a null
      abbreviation, and `is_untested` belongs to `get_statuses`, not
      `get_case_statuses`, so it is never emitted.
    - `Label.created_by` and `LabelEmbedded.created_by`: `number` →
      `number | string | null | undefined`. TestRail's Labels documentation quotes
      this as `"2"` while leaving `created_on` unquoted in the same object, and no
      wire capture exists for that API. `LabelEmbedded` rides on
      `Case.labels[]` and `Test.labels[]`, so guessing wrong failed `getCase`,
      `getCases`, `getTest`, and `getTests` page-wide.
    - `Milestone.is_started`: `boolean | undefined` → `boolean | null | undefined`.
    - `CaseFieldConfig.context.project_ids` / `ResultFieldConfig.context.project_ids`:
      `number[]` → `number[] | string | null | undefined`. The normalizing
      `.transform()` that folded `null`/`""` into `[]` was **removed** — under
      advisory parsing it was unsound, because a sibling field failing to parse
      returns the raw body, delivering an untransformed `null` under a type that
      claimed `number[]` and turning a caught validation error into an uncaught
      `TypeError`. Narrow before indexing.
    - Every `SoftDeletePreview` counter: `number | undefined` →
      `number | null | undefined`. Narrow before arithmetic.
    - `HistoryChange.options`: `unknown[] | null | undefined` →
      `Record<string, unknown> | unknown[] | null | undefined`. Use
      `Array.isArray()` before array operations.
    - `CaseFieldConfig.options.items` / `ResultFieldConfig.options.items`:
      `string | null | undefined` → `string | unknown[] | null | undefined`.
      Narrow before calling string methods or iterating.
- **Public response types now derive from the declared response-schema keys.**
  Runtime schemas remain `.passthrough()`, but their inferred public types no
  longer advertise a broad `[key: string]: unknown` signature. This removes
  accidental property access from response models that do not support dynamic
  fields and eliminates hand-written schema/type drift.
- **Flat custom-field access is explicit and narrow.** Only `Case`, `Test`, and
  `Result` expose a `custom_*` template-literal index returning `unknown`;
  narrow a bracket-accessed value before use. Their nested `custom_fields` member is retained but marked
  deprecated. Other response types no longer require or encourage casts for
  fields TestRail does not emit there.

### Added

- **`TestRailConfig.onSchemaMismatch`** — called with
  `{ method, endpoint, error, data }` when a response fails its schema. Unset by
  default, in which case a mismatch is silent. Invoked outside any `try`, so
  throwing from it propagates to the caller; that is the supported strict mode,
  and it also prevents the cache write. Exported type: `SchemaMismatch`.
- **Explicit bounded pagination on 23 audited list endpoints.** Existing
  `get*()` methods remain one-response `Entity[]` reads. Each registered endpoint
  also exposes `get*Page(): Page<Entity>` (preserves `offset`, `limit`, `size`,
  and `_links`) and `getAll*(): Entity[]` (collects every response page).
  Registered endpoints are cases and case history; projects, suites, sections,
  plans, runs, tests, milestones, and all three result lists; labels; shared
  steps and shared-step history; case/run/plan attachment lists; datasets,
  variables, roles, groups, and case statuses. Test attachments, plan-entry
  attachments, users, and ordinary metadata/configuration/report lists are
  intentionally excluded.
- **Safe continuation handling.** `_links.next` is authoritative for whether a
  next page exists, but its host and path are never followed. The client parses
  only a canonical offset and optional limit, then rebuilds the known endpoint
  with the original filters. A legacy bare array is terminal. All-page reads
  bypass GET cache reads/writes/coalescing and return no partial results.
  Explicit page reads validate against a strict envelope schema and use a
  separate cache namespace, so legacy collection-only wrappers cannot poison
  `Page<T>` responses.
- **Bounded aggregation and structured failures.** Defaults: page size 250,
  offset 0, 100 pages, 25,000 items, five minutes, and 100 MiB serialized data;
  hard ceilings are 250/page, five minutes, and 1 GiB. New
  `TestRailPaginationError` extends `TestRailValidationError` and carries
  `reason`, `pagesFetched`, and `itemsFetched`; reasons are `max_pages`,
  `max_items`, `max_duration`, `max_bytes`, `invalid_page`,
  `invalid_continuation`, and `non_progress`.
- **CLI pagination projections.** The default remains a one-response item
  array. `--page` emits the normalized page; `--all` emits the bounded complete
  array and accepts `--page-size`, `--start-offset`, `--max-pages`,
  `--max-items`, `--max-duration-ms`, and `--max-bytes`. `--page` and `--all`
  conflict; `--all` rejects `--limit`/`--offset`; aggregate controls require
  `--all`. Shared-step history, datasets, variables, roles, groups, and case
  statuses are response-driven and reject caller-controlled page size/offset.
- **Stable response fields and recursive milestones.** Added
  `Test.refs_data`, `Test.case_title`, `Result.case_title`, `Result.case_refs`,
  optional `Plan.is_archived` and `Plan.archived_on`,
  `CaseField.is_indexed`, version-tolerant `CaseField.is_system` and
  `ResultField.is_system` (`boolean | 0 | 1 | null | undefined`), plus writable
  `AddCaseFieldPayload.is_indexed`. `Milestone.milestones` is now recursively
  typed and validated instead of `unknown[]`.
- **Bare-array tolerance on every wrapper-documented list read.** All of these
  now accept both the paginated envelope and a bare top-level array, via the
  shared `listOf()`/`unwrapList()` pair in `src/modules/list.ts` (the union
  already proven on `getSuites`). Non-breaking: each method's contract stays
  `Entity[]`.
    - Previously single-shape, now bimodal (25 methods): `getCases`,
      `getSections`, `getHistoryForCase`, `getUsers`, `getGroups`,
      `getVariables`, `getDatasets`, `getProjects`, `getMilestones`, `getPlans`,
      `getRuns`, `getTests`, `getResults`, `getResultsForCase`,
      `getResultsForRun`, `getRoles`, `getLabels`, `getSharedSteps`,
      `getSharedStepHistory`, `getAttachmentsForCase`, `getAttachmentsForTest`,
      `getAttachmentsForRun`, `getAttachmentsForPlan`, `getCaseStatuses`,
      `getAttachmentsForPlanEntry`. (`getSuites` already accepted both.)
    - Also applied to the two bulk _writes_, `addCases` and `updateCases`: there
      a shape mismatch used to resolve `[]`, reporting "0 created/updated" for
      work the server had done, which a retrying caller would then duplicate.
    - Endpoints whose response is a bare array to begin with are unchanged and
      keep parsing `z.array(...)`: `getStatuses`, `getPriorities`,
      `getCaseTypes`, `getTemplates`, `getCaseFields`,
      `getResultFields`, `getConfigurations`, `addResults`,
      `addResultsForCases`.
    - Why the broad fix rather than another per-endpoint change: multiple methods
      have returned a bare array despite a documented wrapper, and `get_users` is
      a bulk endpoint whose own docs show a bare array. The documentation does
      not reliably predict the shape, so every wrapper-documented list read now
      accepts both.
- **A list read cannot silently report zero rows.** The envelope branch requires
  the key to be present (an explicit `null` still means an empty page), so a body
  that is not the expected list — `{ error: ... }`, a single entity, a renamed
  key — is reported through `onSchemaMismatch` instead of parsing "successfully"
  to `{}` and unwrapping to `[]`. `unwrapList()` also guards the extracted member
  with `Array.isArray`, so a key holding a scalar can no longer be returned typed
  as `Entity[]`.
- **Structural list/page corruption now fails closed.** Advisory parsing still
  preserves rows whose entity fields drift. Every list projection rejects a
  missing/wrong collection instead of returning an empty list; explicit
  page/all projections additionally reject partial pagination metadata,
  malformed `_links`, unsafe continuations, and non-advancing offsets.
- **Bulk case writes fail closed on an unrecognized success body.**
  `addCases()` and `updateCases()` still accept both documented envelopes and
  bare arrays, but a body matching neither form now throws `TestRailApiError`
  with an indeterminate-outcome message. The server-side write may already have
  happened, so returning `[]` would invite a duplicate retry.

### Fixed

- **`SoftDeletePreview` counters accept an explicit `null`.** All seven were
  `.optional()` (`T | undefined`), which rejects `null` — a parse failure landing
  on a destructive-delete preview. The schema post-dated the #130
  optional→nullish sweep and was never covered by it.
- **`HistoryChangeSchema.options` accepts the object TestRail actually sends.**
  Declared `z.array(z.unknown())` after the doc's field table, but the wire
  carries an object — `{ is_required, default_value, items }` — on any change to
  some dropdown-style custom fields. `getHistoryForCase()` therefore failed for
  affected histories. Now a union; the documented array form still parses.
- **`FieldConfigOptionsSchema.items` accepts the array form.** A newline-delimited
  string on dropdown fields, but an array of `{ name, machine_name }` on the
  built-in `quality_rating` (type_id 16). `getResultFields()` failed on every
  call, compounding the `default_value` defect fixed in #248.
- **An Enterprise-license 403 is now always a `TestRailLicenseError`.** TestRail
  phrases the condition two ways — `"Not an Enterprise license/subscription."`
  (`get_variables`, `get_datasets`) and `"…(Requires Enterprise license…)"`
  (`get_case_statuses`). The matcher anchored on the first, so `getCaseStatuses()`
  raised a plain `TestRailApiError` and callers branching on
  `instanceof TestRailLicenseError` to degrade gracefully missed it. Ordinary
  permission 403s are unaffected, and the match still requires "Not an"/"Requires"
  beside the phrase so an arbitrary 403 body that merely mentions Enterprise
  licensing — a proxy error page, a project named "Enterprise Licensing" — is not
  misclassified.
- **`getHistoryForCase()` accepts TestRail's documented outer-array response.**
  The published example wraps the pagination object in an array,
  `[{ offset, limit, size, _links, history: [...] }]`. That shape matched neither
  accepted branch, so the raw outer array was returned and the caller received the
  envelope itself as `result[0]` — typed `HistoryEntry`, but carrying pagination
  fields and no `id`/`user_id`. All three shapes now parse.
- **The CLI no longer truncates pipe-backed output on Node 20/22.** Terminal
  paths set `process.exitCode` and let stdout/stderr drain instead of calling
  `process.exit()` immediately.

Together with the widenings above and the bare-array tolerance, this covers the
response-shape issues described in the defect report.

### Internal

- `tests/schema-conventions.test.ts` gains two zero-false-positive rules:
  response schemas may not use `.optional()`, and may not carry format or length
  validators (regression guard for #236). A "no bare required scalar" rule was
  evaluated and rejected because it produced mostly false positives while
  missing important wrapper-shape and wire-type risks.
- devDependencies bumped. TypeScript held at `~6.0.3`: TypeScript 7's native port
  does not expose the Compiler API, which both AST generators require.
- **Release publication is now fail closed.** A GitHub Release must be a stable
  `release/<version>` tag whose peeled commit matches the workflow SHA, is on
  `main`, and matches `package.json` plus both lockfile version fields. The
  read-only verification job runs the complete test, drift, audit, and packed
  consumer-smoke gates before handing a digest-checked artifact to the separate,
  manually approved npm Trusted Publishing job. Registry checks enforce a
  monotonic stable version, exact `gitHead`, `latest`, package contents, and SLSA
  provenance; an existing version is accepted only when every identity check
  matches.
- Packed-package smoke runs on Linux with Node 20.19, 22.13, and 24 plus Windows
  with Node 24, behind the stable `package-smoke` CI gate. Pull-request CI also
  enforces formatting, lockfile policy, and AGENTS.md drift, and uses the pinned
  `audit-ci` dependency rather than a transient `npx` install.

### Known gaps

- `AddResultPayloadSchema.status_id` remains **required**, so this client can read
  comment-only results but cannot create them. Relaxing it needs authoritative
  documentation or synthetic integration evidence for a successful comment-only
  `add_result`. Documented in-place in `src/schemas/results.ts`.
- Lower-risk over-strict fields identified by audit remain unwidened, by design
  — they now degrade to a warning rather than an outage, and widen when evidence
  arrives.

## [5.3.0] — 2026-07-16 — configurable request timeout (per-request + CLI)

The request timeout was only settable once, at construction (`config.timeout`).
This release adds two override paths that surface the _existing_ timeout knob
rather than introducing a new one — no breaking changes; every change is
additive with an unchanged default (30s).

### Added

- **`client.withTimeout(ms)` (SDK).** Returns a lightweight view of the client
  that applies `ms` as the request timeout to every call made through it —
  e.g. `client.withTimeout(120_000).cases.getCases(1)` gives one bulk export two
  minutes without constructing a second client. The view **shares** the root
  client's cache, rate-limiter budget, credential, and cleanup timer by
  reference (it is not a second client) and is not registered for its own process
  lifecycle. The body-read deadline (SEC #21) tracks the new timeout when
  `bodyTimeout` was left at its default and is preserved when set explicitly.
  Views chain (outermost wins) and validate `ms` with the same rule as
  `config.timeout` (positive, finite, ≤ 5 minutes). Because a view shares state,
  `destroy()` / `clearCache()` called on a view act on the shared root client —
  `destroy()` on any handle zeroes the one credential and disables the root and
  all its views.
- **`--timeout <ms>` and `TESTRAIL_TIMEOUT` (CLI).** Override the request timeout
  in milliseconds (flag > env var > 30s default), mapped straight to
  `config.timeout`. A non-integer value exits 1; an out-of-range value is
  rejected by the client. Parse errors name the actual source (`--timeout` vs
  `TESTRAIL_TIMEOUT`).

### Internal

- Timeout validation extracted to a shared `validateTimeout()` (`src/validation.ts`)
  so `config.timeout` and `withTimeout()` reject identically; the per-request
  `RequestSpec.timeout`/`bodyTimeout` overrides are validated at the single
  `request()` chokepoint so no unvalidated value can reach the abort timer or
  body-read deadline.

## [5.2.1] — 2026-07-14 — live-API schema fixes + skill-packaging hardening

Two threads. **Live-API schema corrections (#248)** repair six client methods
that threw on real TestRail Cloud responses in `5.2.0` — the fixes were merged to
`main` on 2026-06-22 but landed _after_ the `5.2.0` tag, so they had never reached
the registry until this release. **Skill-packaging and coverage-gate hardening
(#249)** makes the bundled skill's frontmatter version track `package.json`
automatically, verifies the installer end-to-end against the real shipped file,
and adds a fifth API-mapping drift gate closing the SDK-to-CLI half of the
layer-coverage invariant. No breaking changes — every schema fix _widens_ what
parses, and `.passthrough()` is preserved throughout so an extra field from
another instance or version degrades to an untyped extra rather than a reject.

### Fixed

Audited the client against a live TestRail Cloud instance (dual capture: raw
fetch + shipped-schema parse) to find where real responses diverge from the Zod
schemas; each fix is proven by a sanitized-fixture regression test
(`tests/live-audit-regression.test.ts`, red before and green after). Full report
in `docs/schema-audit-2026-06-22.md`. **These six paths threw on real data in
`5.2.0`:**

- **`get_users` / `get_user` / `get_current_user` — `mfa_required`.** The wire
  value is an integer `0`/`1`, not a boolean, so a bare `z.boolean()` rejected
  the real response and `getUsers` / `getUser` / `getCurrentUser` all threw. Now
  accepts `boolean | number`.
- **`get_attachments_for_case` — `data_id`.** The wire value is a number
  (e.g. `1000006328`), not the string the doc-derived schema assumed. Now a
  `number | string` union; `cassandra_file_id` and the config-level `id` are
  modeled too.
- **All five `getAttachmentsFor*` list methods — bare-array response.** TestRail
  returns a bare JSON array, not the `{ attachments: [...] }` wrapper the schema
  required, so `z.object()` rejected every populated response. All five methods
  now accept both the bare array and the wrapped shape.
- **`get_case_fields` / `get_result_fields` — `default_value`.** The key is
  omitted entirely on some field configs (step-results and BDD-scenario fields),
  so a required `z.string()` threw. Now `.nullish()` — accepts present-string,
  `null`, and key-omitted. Both endpoints share `FieldConfigOptionsSchema`, so
  the one change covers both.
- **`get_shared_step_history` — `id` / `user_id` + wrapper.** History-entry `id`
  and `user_id` are numbers on Cloud (strings on doc-compliant self-hosted
  servers); both are now `number | string` unions. The endpoint also returns a
  bare array, not the `{ step_history: [...] }` wrapper — now accepts both.
- **`update_group` — `group_id`.** TestRail requires `group_id` in the request
  body, not just the path, so `updateGroup` returned `400`. The method now
  injects it into the body.

Additive typing (previously carried untyped via `.passthrough()`):
`i18n_custom_id` on Status / CaseField / ResultField / CaseType / Template;
`RoleSchema.is_project_admin`; `PlanEntrySchema.dynamic_filters`; and
`has_expected` / `has_actual` / `has_additional` / `has_reference` on step-style
field-config options.

### Added

- **Skill version auto-sync (`replaceFrontmatterVersion`).**
  `scripts/generate-skill.ts` now rewrites the `version:` field inside
  `skill/SKILL.md`'s YAML frontmatter to match `package.json` on every
  `npm run skill` regeneration, so the bundled skill can no longer drift out
  of sync with the published package version.
- **Install-verification test for the real bundled skill.**
  `tests/install-skill.test.ts` now installs the actual repo `skill/SKILL.md`
  (not just the synthetic fixture used elsewhere in that file) into a temp
  target and asserts the installed frontmatter's `name` / `description` /
  `version` / `license` / `homepage` are all populated and that `version`
  exactly matches `package.json`.
- **Gate D — SDK-to-CLI coverage gate.** `scripts/generate-mapping.ts` /
  `scripts/mapping-renderer.ts` now enforce a fifth drift gate (the mirror
  image of gate C): every `@testrail`-tagged SDK method must be claimed by at
  least one `ActionSpec.apiEndpoint`, with no exemption escape hatch, closing
  the gap where the SDK→CLI half of the layer-coverage invariant was
  previously upheld only in manual review.

### Documentation

- **`skill/SKILL.md` documents the CLI-to-SDK fallback rule.** A new
  "Falling back to the programmatic SDK" section clarifies that agents
  should only drop to the programmatic SDK on CLI-side rejections that
  never reach the network (unrecognized flag, stricter payload validation,
  unsurfaced operations) — never on TestRail API errors, auth failures, or
  rate limits, which fail identically through either surface.

## [5.2.0] — 2026-06-21 — #242 bulk-case wire-shape fixes

All three TestRail bulk-case endpoints were broken (each always threw); confirmed
first-hand by a live canary probe against a real instance, which also corrected the
exact wire shapes. None of these methods could succeed before, so no working caller
is affected — except the `copyCasesToSection` return type, which narrows.

### Fixed

- **`cases.addCases` — request and response wrappers.** The request body is now
  sent as `{ cases: [...] }` (a bare array is rejected by TestRail with
  `400 "Field :cases is a required field."`), and the response is unwrapped from
  `{ cases: [...] }` (the server wraps under `cases`, not `added_cases`). The
  caller still passes a plain array — only the wire shape changed.
- **`cases.updateCases` — response wrapper.** The response is now unwrapped from
  `{ updated_cases: [...] }` instead of a bare array.

### Changed (breaking for `copyCasesToSection` return type)

- **`cases.copyCasesToSection` now returns `void`** (was `Promise<Case[]>`).
  TestRail returns `HTTP 200` with an empty body, so the prior bare-array schema
  always threw. The method resolves to `void`; its JSDoc is corrected.

## [5.1.0] — 2026-06-21 — Live-audit corrections

Findings from a read-only/structural audit of the client against a real TestRail
Cloud instance. All changes are backward-compatible except the pagination guard
noted below.

### Added

- **`TestRailLicenseError` (subclass of `TestRailApiError`).** A `403` carrying
  TestRail's `{"error":"Not an Enterprise license/subscription."}` body (observed
  on `get_datasets` / `get_variables` on non-Enterprise instances) is now thrown
  as `TestRailLicenseError`, so callers can branch on license gating with
  `instanceof`. It IS-A `TestRailApiError`, so existing `catch` handlers are
  unaffected; ordinary `403`s remain plain `TestRailApiError`. Exported from the
  package root.
- **Server-extra response fields now modeled.** The audit observed real fields
  the response schemas didn't declare (carried opaquely via `.passthrough()`).
  They are now typed `.nullish()` fields so typed consumers can reach them:
  `is_archived` / `archived_on` / `dynamic_filters` on Run; `is_archived` /
  `archived_on` on Plan; `refs_data` / `ai_automated_test` on Case;
  `comments` on history entries; `case_id` / `quality_rating` / `defects_data` /
  `attachment_ids` on Result; `sections_display_order` / `cases_display_order` /
  `refs_data` / `case_comments` / `ai_automated_test` on Test. Typed where the
  wire capture supported it, `unknown` where the value shape was never observed.

### Changed

- **Pagination `limit` is now bounded client-side at 250 (behavior change).**
  TestRail rejects `limit` outside `[1, 250]` with a `400`. `validatePaginationParams`
  already rejected `limit <= 0`; it now also rejects `limit > 250` with
  `TestRailValidationError`. A too-large `limit` that previously round-tripped to
  the server (and `400`'d) now throws before the request.

### Documentation

- README notes that TestRail Cloud emits no rate-limit headers under normal load,
  so the client's `Retry-After` handling is dormant in practice and the
  sliding-window limiter is the effective throttle.

## [5.0.2] — 2026-06-07 — Piped stdin for write commands

Backward-compatible bug fix; no public API, type, or CLI surface changed.

### Fixed

- **Piped stdin now accepted as a request body for write commands (#226).** The
  body-source gate used `isTTY === false`, but Node leaves `isTTY` `undefined`
  (never `false`) for a pipe, so `echo '{…}' | testrail run add …` always failed
  with "Body required". The gate now fires on `isTTY !== true`, and only when
  neither `--data` nor `--data-file` is supplied, so an explicit body flag still
  wins in non-interactive environments (CI, Docker, cron). Mirrors the
  `--api-key-stdin` fix from #221.

### Maintenance

- `package.json` `bin.testrail` is now `"dist/cli.js"` (was `"./dist/cli.js"`).
  npm strips the leading `./` from `bin` entries on publish, so the old value
  triggered a `script name … was invalid and removed` warning; the published
  `bin` value and CLI behavior are unchanged.

## [5.0.1] — 2026-06-04 — Accumulated CLI + cache fixes

First patch on the `5.0.0` line. Every change is a backward-compatible bug fix;
no public API, type, or CLI surface changed.

### Fixed

- **Stale GET cache repopulation after writes (#217).** A GET issued before a
  mutating request could land in the cache _after_ that write's `clearCache()`,
  re-seeding a pre-write entry; the invalidation is now honored for both raw and
  schema-parsed GET cache keys.
- **`case list` now forwards `--limit` / `--offset` (#219).** `handleCaseList`
  parsed only `--project-id` / `--suite-id` and silently dropped the pagination
  flags, making it impossible to page past the first `get_cases` result set from
  the CLI. Both flags are now parsed via `optInt` and forwarded to `getCases()`,
  matching every other paginated `list` subcommand.
- **Piped stdin accepted for `--api-key-stdin` (#221).** The gate used
  `isTTY !== false`, but Node leaves `isTTY` `undefined` (never `false`) for a
  pipe, so the documented `echo $KEY | testrail … --api-key-stdin` usage was
  always rejected. It now rejects only an interactive terminal (`isTTY === true`).
- **YAML output quotes scalars with a leading quote character (#218).**
  `--format yaml` emitted a string beginning with `'` as a bare scalar, which a
  conforming parser reads as an unterminated single-quoted scalar. Such values
  (e.g. a case title like `'Login' button is disabled`) are now double-quoted.
- **`uninstall-skill` no longer crashes on a dangling symlink (#222).** The command
  gated on `existsSync`, which follows symlinks and returns `false` for a broken
  link, so a dangling skill symlink slipped past the guard. It now uses the
  canonical `lstat`/`ENOENT` pattern: a dangling symlink reaches the existing
  symlink-refusal path, while a genuinely absent target stays the ordinary no-op.

### Maintenance

- Updated funding metadata format and bumped devDependencies (#220). No change to
  the published runtime artifact.

## [5.0.0] — 2026-06-02 — Namespaced client + everything accumulated since 4.1.0

First npm release since `4.1.0` (2026-05-21). This major collapses the entire
unreleased line that had built up on `main` (previously numbered `5.0.0` through
`7.1.0`) into one bump. SemVer is measured from what consumers last installed —
`4.1.0` — so every breaking change since then is bundled under this single major.
No source was reverted; only the version number and this changelog were reconciled.

### Changed (BREAKING)

- **Flat `TestRailClient` facade removed (ARCH #7).** The ~131 flat pass-through
  methods on the client are gone; the 18 namespaced domain modules
  (`client.projects.*`, `client.runs.*`, `client.results.*`, …) are now the single
  access path. This is a pure call-path rename — no signature, argument, or
  behaviour change.

    **Migration.** Insert the owning module field between `client` and the method:
    `client.getProject(1)` → `client.projects.getProject(1)`. The non-obvious maps
    are the metadata reads (`getStatuses`, `getCaseFields`, `getPriorities`, …) →
    `client.metadata.*` and the group methods (`getGroups`, `addGroup`, …) →
    `client.users.*`.

- **Plan-entry attachment `entryId` is a GUID string, not a number.**
  `attachments.getAttachmentsForPlanEntry` / `addAttachmentToPlanEntry` — and the
  CLI `attachment list-for-plan-entry` / `add-to-plan-entry` — now take a UUID
  string, matching what `get_plan` actually returns (a numeric id was rejected by
  the server with HTTP 400).

- **Validation/URL delegate methods removed (ARCH #6).** The validation and
  URL-building helpers previously delegated through the client were extracted to
  standalone leaf modules; import the pure helpers directly instead of calling them
  on a client instance.

- **Stale public type aliases dropped.** Dead re-exported type aliases were removed
  from the public surface.

### Added

- **camelCase list-filter options** for `getPlans`, `getResults`, `getTests`, and
  `getMilestones` (`createdAfter`, `createdBy`, `statusId`, `milestoneId`,
  `isCompleted`, …), aligning them with `getCases` / `getRuns`. The original
  snake_case keys remain as `@deprecated` aliases for one major.
- **UUID attachment ids** accepted by `attachments.getAttachment` /
  `deleteAttachment` and the CLI `attachment get` / `attachment delete` (TestRail
  7.1+ RFC-4122 GUID ids), alongside the existing integer ids.
- Additional response-schema fields for TestRail 7.3+ / Enterprise and SPEC-driven
  schema parity, plus an injectable `fetch` adapter and an injectable DNS lookup
  for restricted-DNS environments.

### Fixed

- **`users.getGroups()` parses the paginated wrapper.** `get_groups` returns
  `{ offset, limit, size, _links, groups: [...] }`, not a bare array; the schema now
  mirrors `getUsers()` and returns `groups ?? []`.
- **Programmatic list-filter ID arrays are now validated before fetch.** `getPlans`,
  `getTests`, and the `getResults*` methods previously serialized `createdBy`,
  `statusId`, and `milestoneId` arrays straight into the URL, so values like `0`
  or `-1` crossed the network despite the client's "all numeric IDs validated before
  any request" contract. These methods now reject invalid filter items locally with
  `TestRailValidationError`, matching `getRuns()` and the CLI's strict ID parsing.
- **`metadata.getRoles()` parses the paginated wrapper.** `get_roles` (TestRail 7.3+)
  is a bulk-API endpoint and returns `{ offset, limit, size, _links, roles: [...] }`
  from the version it was introduced — never a bare array. The schema parsed
  `z.array(RoleSchema)`, so every call (and the `role list` CLI command) threw
  `TestRailValidationError` against a real server; the unit test passed only because
  it mocked a bare array. Now parses the wrapper and returns `roles ?? []` — the
  same fix class as `getGroups` above.
- **`suites.getSuites()` accepts both the bare-array and paginated-wrapper shapes.**
  `get_suites` returns a bare array up to TestRail 9.3.0 and a
  `{ offset, limit, size, _links, suites: [...] }` wrapper from 9.3.1+ (documented
  breaking change). The client now accepts either, so it works regardless of server
  version.
- **`variables.getVariables()` and `datasets.getDatasets()` parse the paginated
  wrapper.** `get_variables` and `get_datasets` are bulk-API endpoints and return
  `{ offset, limit, size, _links, variables: [...] }` /
  `{ ..., datasets: [...] }` — the standard pagination envelope every bulk endpoint
  has emitted since TestRail 6.7, never a bare array. Both schemas parsed
  `z.array(...)`, so every call (and the `variable list` / `dataset list` CLI
  commands) threw `TestRailValidationError` against a real server; the unit tests
  passed only because they mocked a bare array. Now parses the wrapper and returns
  `variables ?? []` / `datasets ?? []` — the same fix class as `getRoles` /
  `getGroups` above.
- **LRU cache** no longer evicts an innocent entry on a re-set at capacity, and the
  **rate limiter** now records retries without spuriously rejecting a retried
  request as a local 429.
- **`--format table` no longer drops columns missing from the first row.** The
  table renderer derived its column set from `rows[0]` only, so any field present
  on a later row but omitted from the first was silently dropped — data and all.
  This was reachable with real TestRail data: response schemas use `.nullish()`,
  so the API omits unset fields, and a list's first entity can legitimately lack a
  key (e.g. `milestone_id`) that a later one carries. The renderer now takes the
  union of keys across all rows (first-seen order), matching `--format csv`; the
  omitting row renders an empty cell instead of losing the column. `--format json`
  / `csv` were already correct.

### Security

- Unified HTTP pipeline with manual-redirect blocking (SSRF guard), response-body
  byte caps and wall-clock deadlines, additional IPv6 SSRF ranges,
  multipart-upload hardening, opt-in process signal handlers, and supply-chain
  hardening (`.npmrc` + lockfile-lint, OIDC trusted publishing with provenance).

## [4.1.0] — 2026-05-21

Published directly to npm (no GitHub release or git tag); backfilled here so the
changelog matches the registry.

### Fixed

- **Accept nullable TestRail response fields.** Response schemas were widened to
  `.nullish()` wherever TestRail may return `null` or omit a key, so otherwise
  valid API responses with null or absent fields no longer fail validation.

## [4.0.0] — 2026-05-20 — CLI hardening release

First npm publish since `2.1.0` (2026-05-13). Closes the CLI/library safety
cluster opened across the unpublished 3.x line and ships every additive
feature accumulated since the last release in a single major bump.

**Why a major version jump from 2.1.0?** Seven `!`-tagged commits land
breaking changes across the `testrail` CLI binary — which is part of the
package surface and thus governed by SemVer. The library API also gains
one breaker: process signal handlers are now opt-in
(`registerProcessHandlers: true`, default `false`) so the client no longer
hijacks the host process's shutdown chain (SEC #8). Two distinct waves of
breakage justify the gap from `2.1.0`:

- **Wave 1 (would have been 3.x):** CLI security cluster — `--api-key`
  removed in favor of `--api-key-stdin`, unknown-flag rejection, `--yes`
  gate on `run close` and single-entity destructive deletes, stdin body
  cap at 1 MiB, terminal-control-char stripping, SSRF/3xx-redirect block,
  retry policy tightened on writes, response-body byte + wall-clock caps.
- **Wave 2 (this 4.0):** destructive-ops env-var gate
  (`TESTRAIL_ALLOW_DESTRUCTIVE=1`) — every destructive CLI action now
  requires the env var **in addition to** `--yes`. New exit code `2` to
  let CI branch on "missing env var" vs other failures.

Nothing 3.x was ever published to npm; consumers leap `2.1.0` → `4.0.0` in
one hop. Per-version chronology preserved in [3.0.0]–[3.5.0] entries below
so the breaker timeline is auditable.

### Added

- **CLI binary stdio (`-` sentinel) for attachments and BDD.** `--file -`
  streams a binary upload from `process.stdin`; `--out -` streams the
  download to `process.stdout` while the JSON ack is rerouted to stderr.
  Enables pipeline composition without temp files
  (e.g. `curl … | testrail attachment add-to-case 42 --file -`,
  `testrail attachment get 17 --out - | xxd`).
- **`MAX_STDIN_UPLOAD_BYTES`** (100 MiB) and **`STDIN_READ_TIMEOUT_MS`**
  (30 s) constants gate the stdin reader. The byte cap defends against
  memory exhaustion; the wall-clock deadline (via `stream.destroy()`
  surfaced through the async iterator) defends against slowloris-style
  producers that never EOF — partial mitigation of `SEC #24` for the
  binary-upload path. `readBoundedStdin` (text body / `--api-key-stdin`)
  still has no deadline; that follow-up remains open.
- **`HandlerContext.err` / `HandlerContext.errRaw`** — quiet-aware stderr
  writers passed to handlers so the `--out -` JSON ack can land on stderr
  without bypassing `--quiet`.

### Security

- **`--file -` mutex gates:** rejected on non-upload actions, alongside
  `--data` / `--data-file`, alongside `--api-key-stdin`, or when stdin is
  a TTY. Each conflict surfaces a structured stderr error before any API
  call is issued.
- **`--out -` rejects `--format table`** (binary is binary; the format
  hint is meaningless and was previously a silent foot-gun).
- **TTY warning on `--out -`** when stdout is a terminal — emitted to
  stderr, not blocking, so intentional pipelines to `xxd` / `hexdump`
  still work.

### Added (continued)

- **CLI: `--format yaml` and `--format csv` output formats.** Closes [BACKLOG CLI
  format yaml/csv](docs/archive/BACKLOG-ARCHIVE.md). Every read, list, and write action now
  accepts `--format <json|table|yaml|csv>` (default unchanged: `json`).
    - `yaml` emits a zero-dependency YAML 1.2 document with 2-space indent.
      Strings that could parse as numbers, booleans, null tokens, or carry
      reserved YAML leaders (`-`, `?`, `:`, `#`, `|`, `>`, etc.) are
      force-quoted in double-quoted form with full C-style escapes. NaN /
      Infinity are emitted as the YAML 1.2 sentinels (`.nan`, `.inf`,
      `-.inf`). No new runtime dependency — the emitter is hand-rolled to
      respect the project's zero-runtime-dep policy.
    - `csv` emits RFC 4180 with CRLF line terminators. Headers are the
      sorted union of top-level keys across rows (deterministic output for
      diff-friendly exports). Nested objects/arrays are JSON-stringified
      into a single cell (no dot-path flattening) so the column count is
      stable regardless of payload shape. Single-object responses become a
      1-row CSV preserving insertion order.
    - Unknown `--format` values now exit 1 with a clear error listing the
      valid values, instead of silently falling through to JSON.
    - See `README.md` for the format matrix and pipeline examples
      (`yq`-piping for YAML, spreadsheet exports for CSV).
- **Programmatic TypeScript API recipes** in `skill/SKILL.md`. A new
  `## Programmatic TypeScript API` section gives copy-paste-runnable
  snippets for every major resource (projects, suites, sections, cases,
  runs, results, milestones, attachments, plans, users, datasets,
  variables, groups, shared steps, configurations) using `TestRailClient`
  directly. Each snippet compiles against the published types — no
  pseudo-code. Includes an `instanceof`-narrowing pattern for
  `TestRailApiError` / `TestRailValidationError` and a tuning example
  covering retries, rate limits, body caps, and `registerProcessHandlers`.
- **Cursor rule** at `.cursor/rules/testrail.mdc`. Auto-generated from
  the same source as `skill/SKILL.md`; includes the standard
  `description` / `globs` / `alwaysApply` frontmatter per the
  [Cursor rules spec](https://docs.cursor.com/context/rules-for-ai).
  Regenerate via `npm run cursor-rules`. CI drift gate:
  `npm run cursor-rules:check` (wired into `pretest`).
- **Continue rule** at `.continue/rules/testrail.md`. Plain-markdown
  format per [continue.dev rules spec](https://docs.continue.dev/customization/rules).
  Regenerate via `npm run continue-rules`. CI drift gate:
  `npm run continue-rules:check`.
- **Vendor-neutral `AGENTS.md`** at the repo root, following the
  [agents.md](https://agents.md/) convention. Acts as a "what every AI
  agent should know" entry point that doesn't bind to a specific
  harness. Regenerate via `npm run agents-md`. CI drift gate:
  `npm run agents-md:check`.
- **`testrail uninstall-skill`** — symmetric reverse of `install-skill`.
  Removes a previously-installed skill from `./.claude/skills/testrail-cli/`
  (default) or `~/.claude/skills/testrail-cli/` (`--global`). Best-effort
  cleanup of the empty `testrail-cli/` directory after unlinking the
  skill file. Does NOT touch `.cursor/rules/testrail.mdc`,
  `.continue/rules/testrail.md`, or `AGENTS.md` — those have an
  independent lifecycle (generated from `src/cli/metadata.ts` and live
  alongside other agent-tool configuration). HELP text and README
  document this boundary.
- **Shared `scripts/rules-content.mjs` module** — single source of truth
  for the body of the three rule artifacts. Each format wraps the shared
  body in its own header/frontmatter so usage guidance lives in one
  place.

### Safety

The new `uninstall-skill` command uses TOCTOU-aware filesystem checks
that mirror the existing `install-skill` patterns:

- `lstat` (not `stat`) so symlinks are detected without following.
- Refuses to unlink anything that is a symlink — `install-skill` only
  ever produces regular files via `copyFileSync`, so anything else
  indicates either tampering or unrelated user-managed content.
- Refuses to unlink non-files (e.g. a directory planted at the target
  path).
- After unlinking the skill, attempts to remove the parent
  `testrail-cli/` directory ONLY if empty — never touches
  `.claude/skills/` or higher.

Related backlog: SEC #5 (TOCTOU symlink-clobber on `install-skill`
target) remains open as a separate, pre-existing concern. This PR does
not introduce a parallel hazard but does not fix the existing one.

### Tooling / CI

- Four new npm scripts plus `:check` drift-gate variants:
  `cursor-rules`, `continue-rules`, `agents-md`, and the existing
  `skill` script unchanged.
- `pretest` now also runs `cursor-rules:check`, `continue-rules:check`,
  and `agents-md:check`. PRs that update `src/cli/metadata.ts` without
  regenerating fail in CI.
- All generated files are deterministic (no timestamps, no random IDs,
  stable iteration order). `tests/generate-rules.test.ts` asserts
  byte-equality of committed vs. re-rendered output.

### Tests

- `tests/uninstall-skill.test.ts` (12 cases): happy paths (project +
  global), missing-file, quiet semantics, install/uninstall round-trip,
  TOCTOU defenses (symlink refusal + non-file refusal), sibling-file
  preservation, lifecycle messaging.
- `tests/generate-rules.test.ts` (13 cases): pure-renderer determinism,
  frontmatter shape (cursor has YAML; continue does not),
  `AGENTS.md` self-references, committed-output drift checks.
- `tests/cli.test.ts` adds a smoke test confirming `uninstall-skill` is
  reachable via `--help` (full behaviour coverage lives in the unit
  test where the filesystem can be sandboxed).

### Added (CLI bulk case creation, run watcher, attachment pagination)

- **`case add-bulk` CLI action + `addCases()` programmatic method** for
  bulk-creating cases under a section in one API call (TestRail 7.5+).
  Wraps `POST add_cases/{section_id}`; the `--data` body is a JSON array of
  case payloads (each item the same shape as `AddCasePayload`). Empty arrays
  and array items that fail `AddCasePayloadSchema` are rejected client-side
  before any network call. **Version-aware error wrap:** older TestRail
  servers return 400/404 with `"Invalid uri"` because the endpoint doesn't
  exist; the module rethrows that as `TestRailApiError(status, 'TestRail server >= 7.5 required for add_cases bulk endpoint', <original response>)`
  so callers can tell "your TestRail is too old" from "your payload is
  malformed". `--dry-run` previews the parsed array with a `count` field.
- **`run watch <run_id>` CLI action** — long-running command that polls
  `GET get_run/{run_id}` on a configurable interval (default 30s;
  `--interval N` where N is in `[5, 600]`; `--once` for single poll then
  exit) and emits a compact JSON event line per poll. Diff detection runs
  over a closed set of fields (`is_completed`, `untested_count`,
  `passed_count`, `failed_count`, `retest_count`, `blocked_count`) so
  mutable timestamps don't trigger noise. Exits 0 when TestRail flips
  `is_completed=true`; exits 130 on SIGINT (writes a one-line `interrupted`
  summary to stderr before the client's signal handler runs). Polling uses
  recursive `setTimeout` (not `setInterval`) so a slow poll can't stack
  pending timers; transient `getRun` rejections surface to stderr but don't
  abort the watcher.
- **Pagination on `attachment list-for-{case,run,test}` CLI actions and
  the corresponding programmatic methods** — `getAttachmentsForCase` /
  `getAttachmentsForRun` / `getAttachmentsForTest` now accept
  `GetAttachmentsOptions { limit?, offset? }`. `--limit` and `--offset`
  forward to TestRail's `&limit=` / `&offset=` query params (server
  default page size 250). Plan-scoped variants (`list-for-plan`,
  `list-for-plan-entry`) intentionally don't paginate — TestRail returns
  the full tree.

### Changed

- New types exported from package root: `AddCasesBulkPayload`,
  `AddCasesBulkPayloadSchema`, `GetAttachmentsOptions`.
- New CLI flags: `--interval <seconds>`, `--once` (both consumed only by
  `run watch`); attachment list actions now honor the existing `--limit` /
  `--offset` flags.
- **`requestMultipart` now streams file uploads from disk** instead of buffering the entire payload into the heap. The CLI (`testrail attachment add-to-* --file …`, `testrail bdd add --file …`) and any programmatic caller using the new `{ path: string; type?: string }` input shape pull bytes via `node:fs.openAsBlob`, so `fetch` reads the file on demand and the process never materializes the whole attachment in memory. Benchmark on a 100 MB file: heap +2.30 MB / RSS +175.61 MB before → heap +0.00 MB / RSS +0.02 MB after.
- Public API is backwards compatible. `addAttachmentToCase`, `addAttachmentToResult`, `addAttachmentToRun`, `addAttachmentToPlan`, `addAttachmentToPlanEntry`, and `addBdd` accept the existing `Blob | Uint8Array | File` inputs plus the new `{ path }` descriptor. In-memory inputs are unchanged.
- The CLI's `resolveFile()` no longer returns `contents`; the `read` option on `ResolveFileOptions` is preserved for source-compat but is now a no-op (the multipart pipeline reads from disk lazily).
- Upload invariants are preserved: no retry on 5xx/429/network errors, `AbortSignal` honored throughout the body upload, DNS-pin/SSRF guard still applied before fetch, 3xx still rejected by `assertNotRedirect`.

### Changed (BREAKING) — Destructive-ops env-var gate

Closes [BACKLOG CLI: destructive env-var gate](docs/archive/BACKLOG-ARCHIVE.md). Adds a
**second gate** for destructive CLI actions (`*:delete`, `run close`,
`plan close`): a `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable that
must be set **in addition to** the existing `--yes` flag. The check runs in
the dispatcher (`src/cli/dispatch.ts`) before the handler is invoked — so
even a future destructive handler added without an `if (!confirmDestructive)`
check cannot escape the env-var gate (defense-in-depth).

- **BREAKING — Destructive CLI actions now require `TESTRAIL_ALLOW_DESTRUCTIVE=1`
  in addition to `--yes`.** Existing CI users must set this environment
  variable before any destructive command. The env var must be **exactly**
  the string `'1'` (not `'true'` / `'yes'` / `'on'` / `'1 '` with whitespace).
- **New exit code `2`** for "destructive action blocked by missing env var".
  Distinct from the generic exit code `1` (used for argv / auth / validation
  / HTTP failures) so CI can branch on "needs `TESTRAIL_ALLOW_DESTRUCTIVE`"
  vs everything else.
- `--dry-run` continues to bypass both gates (preview is non-destructive by
  definition; no API call leaves the process). Use `--dry-run` for safe CI
  preview without setting up the gates.

### Migration (env-var gate)

> Migration guidance for the **other** Wave-1 breakers (`--api-key`
> removal, `--yes` on `run close`, unknown-flag rejection, stdin body cap,
> `registerProcessHandlers` opt-in) lives in the [3.0.0]–[3.5.0] entries
> below — each unpublished 3.x section retains its own migration notes
> intact for auditability.

**For CI users running destructive `testrail` commands:**

Add the env var to your CI step (export it once; it applies to every
subsequent destructive command in that step):

```bash
# Before (3.5.x):
testrail run delete 5 --yes

# After (4.0.0+):
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail run delete 5 --yes
```

Or as a one-liner:

```bash
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes
```

**Affected actions** (all currently destructive resources): `case delete`,
`case delete-bulk`, `run delete`, `run close`, `section delete`,
`suite delete`, `milestone delete`, `project delete`, `plan close`,
`plan delete`, `plan delete-entry`, `plan delete-run-from-entry`,
`variable delete`, `group delete`, `dataset delete`, `shared-step delete`,
`configuration delete`, `configuration-group delete`, `attachment delete`.

**For agents / scripts using `--dry-run`:** No action required. `--dry-run`
bypasses the env-var gate (and the `--yes` gate) so CI preview workflows
continue to work without configuration.

**For programmatic library users (`TestRailClient.deleteRun(…)` etc.):** No
action required. The gate only applies to the CLI dispatcher — the
programmatic API surface is unchanged.

### Why two gates?

The env var is a **process-wide, audit-friendly switch** (visible in
`printenv`, CI step logs, crash dumps). The `--yes` flag is **per-invocation
explicit intent**. Together they make accidental destructive operations
meaningfully harder:

- A script run with a stale env still needs `--yes`.
- A typo with `--yes` still needs the env var.
- A handler added without `--yes` validation still can't escape the dispatcher.

The strict `'1'` comparison (no `'true'` / `'yes'` aliasing) keeps the
audit trail unambiguous: in CI logs you can tell `unset` from `set-to-wrong-value`
from `set-to-allow` at a glance.

### Unchanged (env-var gate)

- Per-handler `--yes` semantics and exit-1 behavior on missing `--yes`.
- `--dry-run` wins-over-`--yes` precedence (preview without API call).
- `--soft` server-side preview semantics on soft-capable deletes.
- Programmatic library API (`TestRailClient.deleteRun(…)`, etc.) — no env
  var required for direct client calls.

## [3.5.0] — 2026-05-18 — Stop hijacking host signal handling (opt-in process handlers)

Closes [BACKLOG SEC #8](docs/archive/BACKLOG-ARCHIVE.md). Before this release, **every**
`TestRailClient` construction silently registered three process-level listeners
(`exit`, `SIGINT`, `SIGTERM`) on the Node.js `process` object. The SIGINT and
SIGTERM handlers additionally called `process.exit(130)` / `process.exit(143)`.
For library consumers — Express servers, NestJS apps, background daemons,
Electron processes, or any host that already manages graceful shutdown — this
meant:

- The host's own SIGINT/SIGTERM handler chain ran in an indeterminate order
  alongside the client's, and the client could shortcut the process via
  `process.exit()` before the host finished closing sockets, flushing logs,
  rolling back transactions, or persisting state.
- The host could not opt out: the side effect ran inside the constructor.
- A test that instantiated the client polluted the process for the rest of
  the worker's lifetime (handlers cannot be safely deregistered without
  ownership tracking across all clients in the process).

### Fixed

- **New `registerProcessHandlers?: boolean` option on `TestRailConfig`,
  defaulting to `false`.** No process listeners are installed unless the
  caller explicitly opts in. Library consumers now get an inert client that
  leaves `exit`/`SIGINT`/`SIGTERM` to the host.
- **The bundled CLI (`testrail` binary) opts in** by passing
  `registerProcessHandlers: true`, preserving the established CLI behavior
  (`destroy()` on Ctrl-C, conventional 130/143 exit codes) for users of the
  shipped command.
- **Existing behavior is unchanged once the flag is set to `true`** — the
  handler implementation, the `activeClients` registry it iterates, and the
  exit codes it emits are all preserved.

### Migration

- **CLI users:** no action required. The `testrail` binary opts in on your
  behalf and behaves identically to previous releases.
- **Library users who relied on the implicit handlers** (rare — the behavior
  was undocumented): add `registerProcessHandlers: true` to your
  `TestRailConfig` to keep the prior shutdown contract. The recommended path
  is to call `client.destroy()` explicitly from your own shutdown hook
  instead; that has always been the supported lifecycle API.
- **Library users embedding the client in a server/daemon:** no action
  required. The opt-out you've been working around is now the default; your
  signal handling and exit codes are no longer overridden.

### Unchanged

- `destroy()` semantics, the `activeClients` registry, the cache cleanup
  timer, and the credential-zeroing behavior are all identical to 3.4.0.
- The handler-install path itself is bit-identical when the flag is `true`;
  this release adds a single guard in the constructor.

## [3.4.0] — 2026-05-18 — Block HTTP redirects to close SSRF guard bypass

Closes [BACKLOG #4](BACKLOG.md). Before this release, the SSRF guard
(`validateBaseUrl` + DNS pin) validated only the **initial** request host.
`fetch` follows redirects by default, so a TestRail server (or any reverse
proxy in front of it) that returned a `301`/`302`/`303`/`307`/`308` with a
`Location` pointing at a private IP — `127.0.0.1`, `169.254.169.254`
(cloud metadata), `10.0.0.0/8`, link-local, etc. — would silently make the
client issue a request to the protected host, leaking credentials and
returning the attacker-controlled body to the caller. The guard was bypassed
without ever surfacing an error.

### Fixed

- **All four fetch sites (`request<T>`, `requestText`, `requestMultipart`,
  `requestBinary`) now set `redirect: 'manual'`** so the runtime never
  follows a `Location` header automatically.
- **3xx responses are rejected as `TestRailApiError`** via a new private
  `assertNotRedirect()` helper. The error preserves the original `status`
  and `statusText`; the `response` field embeds the `Location` value
  (when present) so callers can diagnose a misconfigured `baseUrl` or
  reverse proxy without losing the redirect target.
- **3xx never retries.** A redirect is not transient: retrying would either
  loop or amplify the SSRF surface if `redirect: 'manual'` were ever
  removed. Affects all four fetch sites uniformly.
- **3xx never poisons the GET cache.** The redirect rejection fires before
  any cache write, so a single redirected request cannot serve a bad value
  for the full TTL.

### Unchanged

- `GET` retry behavior for `5xx`/`429`/network errors is unchanged.
- The existing SSRF allow-list (`allowPrivateHosts`) and the DNS-pin behavior
  are unchanged — this release closes the redirect-shaped hole next to them.
- The TestRail JSON API itself does not return `3xx` for `/index.php?/api/v2/...`
  endpoints, so no real call site loses functionality.

### Migration

No code changes required for callers hitting standard TestRail instances.
If your deployment fronts TestRail with a redirecting reverse proxy
(e.g. a `301` from an old hostname to a new one), update `baseUrl` to the
final URL. The error body now includes the blocked `Location` value, making
this trivial to diagnose.

## [3.3.0] — 2026-05-18 — Stop retrying non-idempotent writes on 5xx and network errors

Closes [BACKLOG #13](BACKLOG.md). Before this release, every retryable failure
(`5xx`, `429`, network error) triggered a transparent retry up to `maxRetries`,
regardless of HTTP method. For mutating requests this masked a data-integrity
hazard: when a TestRail POST returned `502`/`503` or the connection reset
mid-flight, the server may already have processed the write. The retry then
produced a duplicate record — duplicate runs, duplicate cases, duplicate
results — with no warning to the caller.

### Fixed

- **`request<T>()` and `requestText()` no longer retry non-`GET` methods on
  `5xx` responses or network errors.** A `503` returned for `add_case`,
  `update_run`, `delete_milestone`, etc. now surfaces immediately to the caller
  as a `TestRailApiError`, preventing silent duplicate writes. Likewise, a
  `fetch` `TypeError` (e.g. `ECONNRESET`) during a mutating request throws
  rather than retrying, because the request bytes may already have reached
  the server.

### Unchanged

- `429` (rate limit) still retries for **all methods**, including writes.
  TestRail's rate limiter rejects requests before they execute, so a retry
  on a 429-blocked write cannot duplicate state. `Retry-After` handling is
  unchanged.
- `GET` retry behavior is unchanged: `5xx`, `429`, and network errors all
  retry up to `maxRetries`.
- `requestUpload()` (attachment POST) already opted out of retry entirely
  prior to this change.

### Migration

No code changes required. Calling code that previously succeeded after a
transient `5xx` retry on a write will now see the original error surface.
The recommended fix is application-level idempotency (check whether the
resource already exists before retrying) — masking the failure inside the
client was unsafe.

## [3.2.0] — 2026-05-18 — Fix schema-invalid responses poisoning the GET cache

Closes [BACKLOG #9](docs/archive/BACKLOG-ARCHIVE.md). Before this release, the GET cache
recorded the raw JSON-parsed response **before** the module validated it with
Zod. When TestRail returned a schema-invalid body, the bad data persisted for
the full TTL — every subsequent identical GET returned the same poisoned
value and re-threw the same `TestRailValidationError`, with no way to recover
short of calling `clearCache()` or waiting out the TTL. The failure mode
masked transient upstream bugs as permanent client failures.

### Fixed

- **GET cache no longer stores schema-invalid responses.** Validation now
  happens before the cache write, so a malformed payload triggers a single
  `TestRailValidationError` and the next call re-fetches fresh. Previously
  malformed responses stuck for `cacheTtl` ms (5 minutes by default).

### Added

- `TestRailClientCore.requestParsed<T>(method, endpoint, schema, data?)` —
  new public method that performs the request, validates the response
  against a Zod schema, and writes the GET cache only after validation
  succeeds. Used internally by every domain module that returns a typed
  response. Prefer this over the legacy `parse(schema, await request(...))`
  pattern in new code. Validated responses live in a separate cache
  namespace (`PARSED:GET:${endpoint}`) so they cannot collide with raw
  entries written by direct `request()` callers — neither side can poison
  the other, even when both target the same endpoint.

### Changed

- All 17 domain modules now use `requestParsed` for typed responses.
  `request()` and `parse()` remain public and back-compatible — external
  callers that invoke them directly retain the previous semantics, including
  the legacy GET cache-write inside `request()`.

### Migration

No action required. The behavior change is strictly opt-out of a buggy
caching path: every existing caller benefits automatically. Custom code that
imports `request()` + `parse()` from `TestRailClientCore` directly continues
to work; switch to `requestParsed` to opt into the cache-poisoning fix on
your own endpoints.

## [3.1.0] — 2026-05-18 — Destructive single-entity delete CLI surface

Closes the remaining destructive-delete gap in the CLI surface. The
programmatic API gains optional `{ soft?: boolean }` overloads on four
delete methods; all changes are additive — no breaking changes.

### Added

#### Six new destructive CLI actions

```sh
testrail case      delete <case_id>      [--soft] --yes
testrail run       delete <run_id>       [--soft] --yes
testrail suite     delete <suite_id>     [--soft] --yes
testrail section   delete <section_id>   [--soft] --yes
testrail milestone delete <milestone_id>         --yes   # --soft NOT supported
testrail project   delete <project_id>           --yes   # --soft NOT supported; highest blast radius
```

Each follows the destructive-ops convention locked in by `attachment
delete` / `case delete-bulk` / `run close`: `--yes` gates execution;
`--dry-run` wins over `--yes` (preview with no API call); the skill
generator surfaces `destructive: true` so agents see the gate up front.

`--soft` invokes TestRail's `?soft=1` server-side preview — the API
call still happens but nothing is deleted; TestRail returns counts of
affected entities (`affected_tests`, `affected_cases`, `affected_sections`,
`affected_runs`, `affected_plans`, …). Distinct from `--dry-run` which
short-circuits before any API call. `milestone delete` and `project
delete` reject `--soft` explicitly — TestRail's endpoints don't accept
it, and silently dropping the flag would mask a destructive intent
mismatch.

#### Programmatic API

`deleteCase`, `deleteRun`, `deleteSection`, `deleteSuite` gain
`{ soft?: boolean }` overloads mirroring the existing `deleteCases`
precedent. The hard-delete signature is unchanged. The soft-mode return
type is the new shared `SoftDeletePreview` (Zod-derived, `.passthrough()`).

```ts
// Hard delete (unchanged)
await client.deleteCase(42);

// Soft preview (new)
const preview = await client.deleteCase(42, { soft: true });
// preview: { affected_tests?, affected_cases?, ... } — all optional, passthrough preserves unknown counters
```

#### New public exports

- `SoftDeletePreview` — type (re-exported from package root)
- `SoftDeletePreviewSchema` — Zod schema (re-exported)
- `SoftDeleteOptions` — `{ soft?: boolean }` interface (in `types.js`)

### Changed

`DeleteCasesOptions` and `DeleteCasesPreview` (in `src/modules/cases.ts`)
are now `@deprecated` type aliases for `SoftDeleteOptions` and
`SoftDeletePreview` respectively. Existing imports continue to work —
the alias preserves source compatibility.

### Fixed

- CODEMAP.md size sanity bound raised from 200 KB to 256 KB
  (`tests/generate-codemap.test.ts`). Legitimate growth from the new
  public API surface pushed the file to ~201 KB; bumping to 256 KB
  gives headroom for the next several releases.

## [3.0.0] — 2026-05-18 — CLI safety cluster

Hardens the `testrail` CLI surface against several CTF-audit findings.
The programmatic library API (`new TestRailClient({ apiKey, … })`) is
**unchanged** — these breaking changes affect CLI invocations only.

### BREAKING CHANGES

#### `--api-key <key>` argv flag removed (CTF #11)

Argv is visible via `/proc/<pid>/cmdline`, shell history, CI step logs
(retained 30+ days on most providers, project-readable), container
audit trails (`kubectl get pod -o yaml`, auditd, cloud audit), and
crash/sysdig dumps. CWE-214 — the same class that drove
`docker login --password-stdin`.

**Migration:** use the env var (recommended) or pipe the key on stdin.

```sh
# Before (v2.x):
testrail project list --api-key sk-xxx --email me@example.com --base-url …

# After (v3.0) — option A, env var (recommended):
export TESTRAIL_API_KEY=sk-xxx
testrail project list --email me@example.com --base-url …

# After (v3.0) — option B, stdin:
echo "$TESTRAIL_API_KEY" | testrail project list --api-key-stdin \
    --email me@example.com --base-url …
```

Note: `--api-key-stdin` consumes `fd 0`, so JSON write bodies for the
same invocation must come from `--data` or `--data-file`, **not** piped
stdin. Pick one channel for stdin per command.

#### `run close` now requires `--yes` (CTF #6)

Closing a run is irreversible (TestRail offers no `open_run` endpoint
and the web UI has no reopen action). Joins the destructive-ops
convention introduced in v2.2 (`--yes` gates anything the API can't
undo; `--dry-run` wins for preview) that previously covered only
`attachment delete` and `case delete-bulk`.

**Migration:**

```sh
# Before (v2.x):
testrail run close 42

# After (v3.0):
testrail run close 42 --yes
# Or preview without API call:
testrail run close 42 --yes --dry-run
```

#### Unknown / typo'd flags now exit 1 (CTF #10)

`parseArgs` is invoked with `strict: false` for defensive future-Node
tolerance, but a post-parse strict gate now rejects any flag not in
the canonical `KNOWN_FLAGS` set. Previously a typo like `--dryrun`
(missing hyphen) was silently accepted as a free-form key while
`values['dry-run']` stayed undefined — so a user-intended preview
executed for real on a destructive command.

**Migration:** fix the typo. Errors are now of the form
`Error: unknown flag '--dryrun'. Run --help for the full list.`

#### Stdin body reads capped at 1 MiB (CTF #24)

`readFileSync(0, 'utf-8')` was unbounded; pipes larger than container
memory (typical CI runner: 512 MB–1 GB) OOM-killed the process.
1 MiB covers the largest realistic JSON body (bulk case payloads with
thousands of cases) while making OOM impossible.

**Migration:** split oversized payloads across multiple requests, or
write to a file and pass `--data-file <path>` (which is read with the
host's normal file-read semantics, unaffected by this cap).

### Fixed (non-breaking)

- **CTF #16** — strip terminal control chars (C0/C1/DEL) from stderr
  error messages. Defends against ANSI/OSC injection where a
  TestRail-controlled string (server error body, validation echo) or
  argv-controlled string (typo'd flag name) embeds escape sequences
  the user's terminal would then execute — colour overrides, cursor
  moves, window-title spoofing, OSC 7/9 / iTerm2 dynamic-action codes
  that can chain into command injection on terminals that honour them.
- **CTF #18** — same sanitization on the `--format table` success
  path. Every cell value and column key routes through
  `sanitizeForTerminal` before concatenation.

### Internal

- New modules: `src/cli/flags.ts` (single source of truth for the
  `parseArgs` options table + derived `KNOWN_FLAGS`), `src/cli/sanitize.ts`
  (control-char stripper), `src/cli/stdin.ts` (`readBoundedStdin` helper).
- `docs/archive/BACKLOG-ARCHIVE.md` security findings #6, #10, #11, #16, #18, #24 marked
  `[SHIPPED]`.
- Coverage: 97.23% global / 100% on new modules.

### Known limitations

- The stdin cap (`readBoundedStdin`) addresses **memory-exhaustion DoS**
  only. A producer that keeps the pipe open without ever sending more
  than 1 MiB (e.g. `tail -f`, a FIFO writer that never closes) still
  causes the CLI to block indefinitely on the read. Wall-clock deadline
  for stdin reads is tracked separately in `BACKLOG.md` as a follow-up
  on CTF #24.

## [2.2.0] — earlier

See [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md) Decision Log section.
