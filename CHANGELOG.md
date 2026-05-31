# Changelog

All notable changes to `@dichovsky/testrail-api-client` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.1.0] — Doc-audit correctness fixes + camelCase option ergonomics

A batch of non-breaking fixes surfaced by an upstream-doc audit and an internal
review (PRs #200–#203). No public API was removed; all changes are additive or
internal.

### Fixed

- **`users.getGroups()` parses the paginated wrapper** (#200). `get_groups`
  returns `{ offset, limit, size, _links, groups: [...] }` (TestRail 6.7+ /
  Cloud), not a bare array; the previous bare `z.array(GroupSchema)` schema
  threw on the wrapper. Now mirrors `getUsers()` and returns `groups ?? []`.
  Return type is unchanged (`Promise<Group[]>`).
- **`attachments.getAttachment()` / `deleteAttachment()` accept UUID ids** (#203).
  TestRail 7.1+ attachment ids are RFC-4122 GUID strings (older/Cloud use
  integers); `AttachmentSchema.id` already accepted both, but the input methods
  only took `number`, so a UUID-id attachment could not be downloaded or
  deleted. The `attachmentId` parameter is widened to `number | string` and
  validated by the new `validateAttachmentId` (positive integer **or** UUID,
  path-traversal-safe). The CLI `attachment get` / `attachment delete` commands
  accept the same via a new `parseAttachmentId`. Backward compatible — existing
  numeric callers are unaffected.
- **LRU cache no longer evicts an innocent entry on a re-set at capacity** (#201).
  `setCachedData` now deletes an already-present key before the size/eviction
  check, so updating a cached key while the cache is full cannot drop a
  different entry.
- **Rate limiter no longer rejects retries** (#201). `checkRateLimit` is split
  into enforce + record: the initial attempt enforces the limit (may throw 429),
  while retries are still **recorded** (the sliding-window count stays accurate
  and the server-side limit is still respected) but are never locally rejected.
  Prevents a retryable 5xx from surfacing as a spurious local 429.

### Added

- **camelCase list-filter options** (#202). `GetPlansOptions`, `GetResultsOptions`,
  `GetTestsOptions`, and `GetMilestonesOptions` now expose camelCase fields
  (`createdAfter`, `createdBy`, `statusId`, `milestoneId`, `defectsFilter`, …),
  bringing them in line with `GetCasesOptions` / `GetRunsOptions`. The
  "completed" filter is now `isCompleted?: boolean` (matching `getRuns`),
  converted to TestRail's `0|1` internally. The original snake_case keys
  (`created_after`, `status_id`, `is_completed: 0|1`, …) remain as `@deprecated`
  aliases and will be removed in a future major.

### Docs

- Corrected the test-count/coverage note in `CLAUDE.md` (#201).

## [7.0.0] — Plan-entry attachment `entryId` is a GUID string, not a number

TestRail plan-entry ids are RFC-4122 GUID strings (`get_plan` → `entries[].id`,
e.g. `"3933d74b-…"`), the same id already used by `plans.updatePlanEntry` /
`deletePlanEntry` / `addRunToPlanEntry`. The two plan-entry attachment methods
mistyped it as a numeric `number`, mirroring an error in TestRail's Attachments
API doc (which labels `entry_id` `integer` while the Plans doc and the `get_plan`
response show a GUID). Because `get_plan` never returns a numeric entry id, the
old signatures could not be called with a real id — and a numeric value is
rejected by the server with HTTP 400 `Field :entry_id is not a valid test plan
entry` (verified against a live TestRail instance).

### Changed (BREAKING)

- **`attachments.getAttachmentsForPlanEntry(planId, entryId)`** — `entryId` is now
  `string` (UUID) instead of `number`; it is validated as a GUID (`validateEntryId`).
- **`attachments.addAttachmentToPlanEntry(planId, entryId, file, filename)`** — same
  change to `entryId`.
- **CLI** `attachment list-for-plan-entry` / `add-to-plan-entry` — the `<entry_id>`
  argument is now parsed as a UUID (`parseEntryId`); a numeric value is rejected
  client-side with `entry_id must be a UUID string` before any request.

### Migration

```ts
// Before (6.0.0) — never actually worked against a real server
await client.attachments.getAttachmentsForPlanEntry(planId, 2);

// After (7.0.0) — pass the entry GUID from get_plan
const plan = await client.plans.getPlan(planId);
const entryId = plan.entries![0]!.id; // GUID string
await client.attachments.getAttachmentsForPlanEntry(planId, entryId);
```

## [6.0.0] — Validation/URL delegate methods removed (ARCH #6, phase 2)

Phase 2 of ARCH #6. The four `@deprecated` delegate methods introduced in 5.1.0
are removed. Internal callers were already migrated in 5.1.0, so this PR is
a small surgical removal — no behaviour change beyond the surface contraction.

### Removed (BREAKING)

- **`TestRailClient.validateId(id, name)`** — gone. The leaf function lives in
  `src/validation.ts` but is intentionally not re-exported from the package
  barrel; external callers should roll their own check
  (`Number.isInteger(id) && id > 0`).
- **`TestRailClient.validateEntryId(entryId)`** — gone. Same disposition; the
  leaf function (`src/validation.ts`) stays internal. The SEC #29 UUID rule
  (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) is the
  contract external callers should replicate if they need to pre-validate.
- **`TestRailClient.validatePaginationParams(limit?, offset?)`** — gone. The
  rule is `limit > 0` integer and `offset >= 0` integer; both must be integers
  or omitted.
- **`TestRailClient.buildEndpoint(base, params)`** — gone. The leaf function
  (`src/url.ts`) stays internal. TestRail's URL quirk is documented in
  CLAUDE.md if a caller genuinely needs to mirror it; in practice every public
  endpoint method on the namespaced modules already handles URL construction.

### Migration

Most callers never used these methods — they were thin internal helpers that
happened to be typed `public` on `TestRailClientCore`. If you imported them:

```ts
// Before (5.1.0, deprecated)
client.validateId(id, 'caseId');
// After (6.0.0)
if (!Number.isInteger(id) || id <= 0) {
    throw new Error('caseId must be a positive integer');
}
```

Or simply trust the endpoint methods on the namespaced modules — they all call
`validateId` internally before any network request, so a malformed id surfaces
as `TestRailValidationError` at the call site.

### Notes

- `tests/client-delegates.test.ts` (added in 5.1.0 to keep coverage ≥99% while
  the delegates existed) is deleted in this PR — the leaf-function tests in
  `tests/validation.test.ts` and `tests/url.test.ts` are the canonical
  coverage.
- ARCH #6 is now fully shipped and removed from `BACKLOG.md`.

## [5.1.0] — Validation/URL helpers extracted (ARCH #6, phase 1)

Internal refactor. **No public API or CLI behaviour change.** Phase 1 of a
two-phase split (phase 2 ships as 6.0.0).

### Changed (internal)

- **`validateId` / `validateEntryId` / `validatePaginationParams` extracted to
  `src/validation.ts`.** The three validators are now pure functions; their
  former homes on `TestRailClientCore` are thin one-line delegates marked
  `@deprecated` with a 6.0.0 removal note. Internal callers in
  `src/modules/*.ts` (18 files, 158 sites across all 4 helpers) now import
  directly from the leaf module rather than routing through
  `this.client.<helper>(...)`. Behaviour, error messages, error classes, and
  thrown types are byte-identical to 5.0.0.
- **`buildEndpoint` extracted to `src/url.ts`.** Same pattern — pure function
  in a leaf module, internal callers in `src/modules/*.ts` migrated, public
  method on `TestRailClientCore` becomes a one-line `@deprecated` delegate.
- **`ENTRY_ID_RE` is now a single source of truth.** Both
  `src/validation.ts:validateEntryId` and `src/cli/ids.ts:parseEntryId` import
  the same exported constant from `src/validation.ts`. The duplicated regex
  is gone, and so is the apologetic comment in `cli/ids.ts` that explained
  why it had been kept in sync as a module-level const ("avoid pulling the
  entire HTTP layer into the CLI layer") — `validation.ts` is a leaf module,
  so the original concern no longer applies.

### Deprecated

- `TestRailClient.validateId`, `validateEntryId`, `validatePaginationParams`,
  `buildEndpoint` — will be removed in 6.0.0 (ARCH #6 phase 2). There is no
  public replacement; the helpers were always internal validation machinery.
  External callers (if any) should roll their own — `validateId` is one line:
  `Number.isInteger(id) && id > 0`.

### Added (tests)

- `tests/validation.test.ts` (~25 cases) — direct unit coverage for the three
  validators, including the path-traversal-rejection case for `validateEntryId`
  (SEC #29).
- `tests/url.test.ts` (~12 cases) — direct unit coverage for `buildEndpoint`,
  including parameter-injection-encoding cases.

## [5.0.0] — Facade collapse release

One library-API breaking change ships in this major: the flat client facade is
gone. Everything else in 5.0.0 is internal refactoring carried over from the
unreleased 4.x line — no other public API or CLI behaviour change.

### Removed (BREAKING)

- **The flat `TestRailClient` facade is removed (ARCH #7).** Every endpoint used
  to be reachable two ways — flat (`client.getProject(1)`) and namespaced
  (`client.projects.getProject(1)`). The ~131 flat wrapper methods on
  `client.ts` were pure pass-throughs to the module fields and have been
  deleted. The 18 `public readonly` domain modules
  (`client.projects`, `client.runs`, `client.results`, …) are now the **single
  access path**. This is a **pure rename — no behaviour, signature, argument, or
  return-type change**; only the call path moved from `client.<method>(…)` to
  `client.<module>.<method>(…)`.

    **Migration.** Insert the owning module field between `client` and the method
    name. Most flat names map to the namesake module (`getProject` →
    `projects.getProject`); the non-obvious ones are: the metadata reads
    (`getStatuses`, `getCaseStatuses`, `getPriorities`, `getResultFields`,
    `getCaseFields`, `addCaseField`, `getCaseTypes`, `getTemplates`, `getRoles`)
    → `metadata.*`; the group methods (`getGroup`, `getGroups`, `addGroup`,
    `updateGroup`, `deleteGroup`) → `users.*`; the plan-entry run methods
    (`addRunToPlanEntry`, `updateRunInPlanEntry`, `deleteRunFromPlanEntry`) →
    `plans.*`; and the BDD methods (`getBdd`, `addBdd`) → `bdd.*`.

    A mechanical rename covers the common case (run per flat method name):

    ```bash
    # e.g. for the projects module
    sed -i '' -E 's/\bclient\.(getProject|getProjects|addProject|updateProject|deleteProject)\b/client.projects.\1/g' your-file.ts
    ```

    Full mapping, grouped by module:

        <details>
        <summary>117 flat methods → namespaced (click to expand)</summary>

    #### `projects`

    | Before (removed)          | After                              |
    | ------------------------- | ---------------------------------- |
    | `client.getProject(…)`    | `client.projects.getProject(…)`    |
    | `client.getProjects(…)`   | `client.projects.getProjects(…)`   |
    | `client.addProject(…)`    | `client.projects.addProject(…)`    |
    | `client.updateProject(…)` | `client.projects.updateProject(…)` |
    | `client.deleteProject(…)` | `client.projects.deleteProject(…)` |

    #### `suites`

    | Before (removed)        | After                          |
    | ----------------------- | ------------------------------ |
    | `client.getSuite(…)`    | `client.suites.getSuite(…)`    |
    | `client.getSuites(…)`   | `client.suites.getSuites(…)`   |
    | `client.addSuite(…)`    | `client.suites.addSuite(…)`    |
    | `client.updateSuite(…)` | `client.suites.updateSuite(…)` |
    | `client.deleteSuite(…)` | `client.suites.deleteSuite(…)` |

    #### `sections`

    | Before (removed)          | After                              |
    | ------------------------- | ---------------------------------- |
    | `client.getSection(…)`    | `client.sections.getSection(…)`    |
    | `client.getSections(…)`   | `client.sections.getSections(…)`   |
    | `client.addSection(…)`    | `client.sections.addSection(…)`    |
    | `client.updateSection(…)` | `client.sections.updateSection(…)` |
    | `client.deleteSection(…)` | `client.sections.deleteSection(…)` |
    | `client.moveSection(…)`   | `client.sections.moveSection(…)`   |

    #### `cases`

    | Before (removed)               | After                                |
    | ------------------------------ | ------------------------------------ |
    | `client.getCase(…)`            | `client.cases.getCase(…)`            |
    | `client.getCases(…)`           | `client.cases.getCases(…)`           |
    | `client.addCase(…)`            | `client.cases.addCase(…)`            |
    | `client.addCases(…)`           | `client.cases.addCases(…)`           |
    | `client.updateCase(…)`         | `client.cases.updateCase(…)`         |
    | `client.updateCases(…)`        | `client.cases.updateCases(…)`        |
    | `client.deleteCase(…)`         | `client.cases.deleteCase(…)`         |
    | `client.deleteCases(…)`        | `client.cases.deleteCases(…)`        |
    | `client.copyCasesToSection(…)` | `client.cases.copyCasesToSection(…)` |
    | `client.moveCasesToSection(…)` | `client.cases.moveCasesToSection(…)` |
    | `client.getHistoryForCase(…)`  | `client.cases.getHistoryForCase(…)`  |

    #### `plans`

    | Before (removed)                   | After                                    |
    | ---------------------------------- | ---------------------------------------- |
    | `client.getPlan(…)`                | `client.plans.getPlan(…)`                |
    | `client.getPlans(…)`               | `client.plans.getPlans(…)`               |
    | `client.addPlan(…)`                | `client.plans.addPlan(…)`                |
    | `client.updatePlan(…)`             | `client.plans.updatePlan(…)`             |
    | `client.closePlan(…)`              | `client.plans.closePlan(…)`              |
    | `client.deletePlan(…)`             | `client.plans.deletePlan(…)`             |
    | `client.addPlanEntry(…)`           | `client.plans.addPlanEntry(…)`           |
    | `client.updatePlanEntry(…)`        | `client.plans.updatePlanEntry(…)`        |
    | `client.deletePlanEntry(…)`        | `client.plans.deletePlanEntry(…)`        |
    | `client.addRunToPlanEntry(…)`      | `client.plans.addRunToPlanEntry(…)`      |
    | `client.updateRunInPlanEntry(…)`   | `client.plans.updateRunInPlanEntry(…)`   |
    | `client.deleteRunFromPlanEntry(…)` | `client.plans.deleteRunFromPlanEntry(…)` |

    #### `runs`

    | Before (removed)      | After                      |
    | --------------------- | -------------------------- |
    | `client.getRun(…)`    | `client.runs.getRun(…)`    |
    | `client.getRuns(…)`   | `client.runs.getRuns(…)`   |
    | `client.addRun(…)`    | `client.runs.addRun(…)`    |
    | `client.updateRun(…)` | `client.runs.updateRun(…)` |
    | `client.closeRun(…)`  | `client.runs.closeRun(…)`  |
    | `client.deleteRun(…)` | `client.runs.deleteRun(…)` |

    #### `tests`

    | Before (removed)     | After                      |
    | -------------------- | -------------------------- |
    | `client.getTest(…)`  | `client.tests.getTest(…)`  |
    | `client.getTests(…)` | `client.tests.getTests(…)` |

    #### `results`

    | Before (removed)               | After                                  |
    | ------------------------------ | -------------------------------------- |
    | `client.getResults(…)`         | `client.results.getResults(…)`         |
    | `client.getResultsForCase(…)`  | `client.results.getResultsForCase(…)`  |
    | `client.getResultsForRun(…)`   | `client.results.getResultsForRun(…)`   |
    | `client.addResult(…)`          | `client.results.addResult(…)`          |
    | `client.addResultForCase(…)`   | `client.results.addResultForCase(…)`   |
    | `client.addResultsForCases(…)` | `client.results.addResultsForCases(…)` |
    | `client.addResults(…)`         | `client.results.addResults(…)`         |

    #### `milestones`

    | Before (removed)            | After                                  |
    | --------------------------- | -------------------------------------- |
    | `client.getMilestone(…)`    | `client.milestones.getMilestone(…)`    |
    | `client.getMilestones(…)`   | `client.milestones.getMilestones(…)`   |
    | `client.addMilestone(…)`    | `client.milestones.addMilestone(…)`    |
    | `client.updateMilestone(…)` | `client.milestones.updateMilestone(…)` |
    | `client.deleteMilestone(…)` | `client.milestones.deleteMilestone(…)` |

    #### `users` (includes groups)

    | Before (removed)           | After                            |
    | -------------------------- | -------------------------------- |
    | `client.getUser(…)`        | `client.users.getUser(…)`        |
    | `client.getUserByEmail(…)` | `client.users.getUserByEmail(…)` |
    | `client.getUsers(…)`       | `client.users.getUsers(…)`       |
    | `client.getCurrentUser(…)` | `client.users.getCurrentUser(…)` |
    | `client.addUser(…)`        | `client.users.addUser(…)`        |
    | `client.updateUser(…)`     | `client.users.updateUser(…)`     |
    | `client.getGroup(…)`       | `client.users.getGroup(…)`       |
    | `client.getGroups(…)`      | `client.users.getGroups(…)`      |
    | `client.addGroup(…)`       | `client.users.addGroup(…)`       |
    | `client.updateGroup(…)`    | `client.users.updateGroup(…)`    |
    | `client.deleteGroup(…)`    | `client.users.deleteGroup(…)`    |

    #### `metadata` (statuses, priorities, fields, types, templates, roles)

    | Before (removed)            | After                                |
    | --------------------------- | ------------------------------------ |
    | `client.getStatuses(…)`     | `client.metadata.getStatuses(…)`     |
    | `client.getCaseStatuses(…)` | `client.metadata.getCaseStatuses(…)` |
    | `client.getPriorities(…)`   | `client.metadata.getPriorities(…)`   |
    | `client.getResultFields(…)` | `client.metadata.getResultFields(…)` |
    | `client.getCaseFields(…)`   | `client.metadata.getCaseFields(…)`   |
    | `client.addCaseField(…)`    | `client.metadata.addCaseField(…)`    |
    | `client.getCaseTypes(…)`    | `client.metadata.getCaseTypes(…)`    |
    | `client.getTemplates(…)`    | `client.metadata.getTemplates(…)`    |
    | `client.getRoles(…)`        | `client.metadata.getRoles(…)`        |

    #### `configurations`

    | Before (removed)                     | After                                               |
    | ------------------------------------ | --------------------------------------------------- |
    | `client.getConfigurations(…)`        | `client.configurations.getConfigurations(…)`        |
    | `client.addConfigurationGroup(…)`    | `client.configurations.addConfigurationGroup(…)`    |
    | `client.updateConfigurationGroup(…)` | `client.configurations.updateConfigurationGroup(…)` |
    | `client.deleteConfigurationGroup(…)` | `client.configurations.deleteConfigurationGroup(…)` |
    | `client.addConfiguration(…)`         | `client.configurations.addConfiguration(…)`         |
    | `client.updateConfiguration(…)`      | `client.configurations.updateConfiguration(…)`      |
    | `client.deleteConfiguration(…)`      | `client.configurations.deleteConfiguration(…)`      |

    #### `attachments`

    | Before (removed)                       | After                                              |
    | -------------------------------------- | -------------------------------------------------- |
    | `client.getAttachmentsForCase(…)`      | `client.attachments.getAttachmentsForCase(…)`      |
    | `client.getAttachmentsForRun(…)`       | `client.attachments.getAttachmentsForRun(…)`       |
    | `client.getAttachmentsForTest(…)`      | `client.attachments.getAttachmentsForTest(…)`      |
    | `client.getAttachmentsForPlan(…)`      | `client.attachments.getAttachmentsForPlan(…)`      |
    | `client.getAttachmentsForPlanEntry(…)` | `client.attachments.getAttachmentsForPlanEntry(…)` |
    | `client.getAttachment(…)`              | `client.attachments.getAttachment(…)`              |
    | `client.addAttachmentToCase(…)`        | `client.attachments.addAttachmentToCase(…)`        |
    | `client.addAttachmentToResult(…)`      | `client.attachments.addAttachmentToResult(…)`      |
    | `client.addAttachmentToRun(…)`         | `client.attachments.addAttachmentToRun(…)`         |
    | `client.addAttachmentToPlan(…)`        | `client.attachments.addAttachmentToPlan(…)`        |
    | `client.addAttachmentToPlanEntry(…)`   | `client.attachments.addAttachmentToPlanEntry(…)`   |
    | `client.deleteAttachment(…)`           | `client.attachments.deleteAttachment(…)`           |

    #### `bdd`

    | Before (removed)   | After                  |
    | ------------------ | ---------------------- |
    | `client.getBdd(…)` | `client.bdd.getBdd(…)` |
    | `client.addBdd(…)` | `client.bdd.addBdd(…)` |

    #### `sharedSteps`

    | Before (removed)                 | After                                        |
    | -------------------------------- | -------------------------------------------- |
    | `client.getSharedStep(…)`        | `client.sharedSteps.getSharedStep(…)`        |
    | `client.getSharedSteps(…)`       | `client.sharedSteps.getSharedSteps(…)`       |
    | `client.addSharedStep(…)`        | `client.sharedSteps.addSharedStep(…)`        |
    | `client.updateSharedStep(…)`     | `client.sharedSteps.updateSharedStep(…)`     |
    | `client.deleteSharedStep(…)`     | `client.sharedSteps.deleteSharedStep(…)`     |
    | `client.getSharedStepHistory(…)` | `client.sharedSteps.getSharedStepHistory(…)` |

    #### `variables`

    | Before (removed)           | After                                |
    | -------------------------- | ------------------------------------ |
    | `client.getVariables(…)`   | `client.variables.getVariables(…)`   |
    | `client.addVariable(…)`    | `client.variables.addVariable(…)`    |
    | `client.updateVariable(…)` | `client.variables.updateVariable(…)` |
    | `client.deleteVariable(…)` | `client.variables.deleteVariable(…)` |

    #### `datasets`

    | Before (removed)          | After                              |
    | ------------------------- | ---------------------------------- |
    | `client.getDataset(…)`    | `client.datasets.getDataset(…)`    |
    | `client.getDatasets(…)`   | `client.datasets.getDatasets(…)`   |
    | `client.addDataset(…)`    | `client.datasets.addDataset(…)`    |
    | `client.updateDataset(…)` | `client.datasets.updateDataset(…)` |
    | `client.deleteDataset(…)` | `client.datasets.deleteDataset(…)` |

    #### `reports`

    | Before (removed)       | After                          |
    | ---------------------- | ------------------------------ |
    | `client.getReports(…)` | `client.reports.getReports(…)` |
    | `client.runReport(…)`  | `client.reports.runReport(…)`  |

        </details>

### Changed

- **HTTP pipeline unified behind a single `request<T>(spec)` method.** The
  five historical entry points (`request` / `requestText` / `requestMultipart`
  / `requestBinary` / `requestParsed`) collapsed into one `request<T>(spec: RequestSpec<T>)`
  that drives a shared `executePipeline`. `RequestSpec` carries the method,
  endpoint, optional body (`json` / `multipart`), optional response `schema`,
  `responseKind` (`'json' | 'text' | 'binary'`), and a named `retry` policy.
  Behavioural defaults (cache namespaces, retry asymmetry, upload no-retry)
  are preserved exactly.
- **`schemas.ts` and `cli/metadata.ts` split by domain** into `src/schemas/*.ts`
  and `src/cli/metadata/*.ts`. Barrel re-exports (`src/schemas.ts`,
  `src/cli/metadata.ts`) preserve every existing import path.
- **`ACTIONS` promoted to the single source of truth for the CLI.** Each
  `ActionSpec` now carries its `handler`; `dispatch.ts` derives the `HANDLERS`
  map and `--help` text (`src/cli/help.ts`) from `ACTIONS`, so adding an action
  is a one-line metadata edit enforced by the TypeScript compiler rather than a
  drift test.
- **CLI write handlers collapsed into `createWriteHandler` /
  `createDestructiveHandler` factories** (`src/cli/write-handler-factory.ts`).
  The repeated parse / validate / dry-run / call / emit skeleton lives in the
  factory once; genuinely irregular handlers stay hand-written.

### Removed

- **Dead error subclasses** — only `TestRailApiError`, `TestRailValidationError`,
  and the `handleZodError` helper remain in `src/errors.ts`.
- **`run-destructive.ts`** — superseded by `createDestructiveHandler`.
- **All rule suppressions** (`eslint-disable`, `c8`/`v8 ignore`) removed from
  `src/`; the lint and coverage gates are satisfied without local opt-outs.

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
