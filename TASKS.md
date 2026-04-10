# TASKS

Atomic, prioritized backlog of all known gaps, bugs, and improvements.

**Priority scale:**

- **P0** — Critical: correctness bugs affecting existing behaviour
- **P1** — High: missing write operations for already-supported entities
- **P2** — Medium: missing API surface (filters, pagination, lookup endpoints)
- **P3** — Low: entirely new feature domains not yet started
- **P4** — Maintenance: types, exports, test quality, tooling

---

## P0 — Critical

### TASK-001 · Cache not invalidated after mutations [Done]

**Category:** Bug / Caching  
**Description:**  
`request()` caches all successful `GET` responses. Mutations (`POST` to `update_*`, `delete_*`, `add_*`) do not invalidate any related cache entries. After calling `updateCase(1, {...})`, a subsequent `getCase(1)` returns the stale cached value until TTL expires (up to 5 minutes by default).

**Acceptance Criteria:**

- [x] After any mutating call (add/update/delete) the cache entry for the affected resource is removed
- [x] After `deleteCase(caseId)` calling `getCase(caseId)` hits the network, not cache
- [x] After `addCase(sectionId, ...)` calling `getCases(projectId)` hits the network, not cache
- [x] After `updateRun(runId, ...)` calling `getRun(runId)` hits the network, not cache
- [x] Tests added covering each mutation→read stale-cache scenario

---

### TASK-002 · `AddCasePayload.section_id` is a path parameter, not a body field [Done]

**Category:** Bug / Types  
**Description:**  
`AddCasePayload` (src/types.ts:472) includes an optional `section_id` field. The TestRail API endpoint `POST add_case/{section_id}` takes `section_id` as a URL segment, not in the request body. Including it in the payload type is misleading and may cause unexpected behaviour if a caller passes both.

**Acceptance Criteria:**

- [x] `section_id` removed from `AddCasePayload`
- [x] No compilation errors or test failures after removal
- [x] `addCase(sectionId, payload)` signature unchanged

---

### TASK-003 · `Retry-After` response header not respected on 429 [Done]

**Category:** Bug / Retry Logic  
**Description:**  
When TestRail returns HTTP 429, it may include a `Retry-After` header specifying the exact wait time. The current implementation ignores this header and uses its own exponential backoff, which may retry too early (causing another 429) or wait unnecessarily long.

**Acceptance Criteria:**

- [ ] On 429 response, parse `Retry-After` header (seconds integer or HTTP-date)
- [ ] Use `Retry-After` wait time instead of exponential backoff when the header is present
- [ ] Fall back to exponential backoff when header is absent
- [ ] Unit test: mock 429 with `Retry-After: 5` header, assert sleep called with ~5000 ms
- [ ] Unit test: mock 429 without header, assert exponential backoff used

---

### TASK-004 · Pagination silently truncates large result sets [Done]

**Category:** Bug / Pagination  
**Description:**  
All list endpoints that use the TestRail v2 paginated envelope (`get_projects`, `get_cases`, `get_runs`, `get_plans`, `get_tests`, `get_results`, `get_sections`, `get_milestones`, `get_users`) only return the first page (default limit 250). Callers have no way to know results were truncated, and no way to fetch remaining pages.

**Acceptance Criteria:**

- [ ] All paginated list methods accept optional `limit` and `offset` parameters
- [ ] Returned data includes pagination metadata (`offset`, `limit`, `size`, `_links`) OR
- [ ] A separate auto-paginating `getAll*` variant is provided that fetches all pages automatically
- [ ] Unit tests verify: single-page response, multi-page auto-pagination, and explicit offset/limit
- [ ] TypeScript types for paginated response envelope (`PaginatedResponse<T>`) added to `types.ts`

---

## P1 — High (Missing Write Operations for Existing Entities)

### TASK-005 · Add `updatePlan(planId, payload)` [Done]

**Category:** Feature / Plans  
**Description:**  
`PUT /update_plan/{plan_id}` endpoint is not implemented. Users can create and close plans but cannot modify them.

**Acceptance Criteria:**

- [x] `updatePlan(planId: number, payload: UpdatePlanPayload): Promise<Plan>` added to client
- [x] `UpdatePlanPayload` interface added to `types.ts` with `name?`, `description?`, `milestone_id?`, `assignedto_id?`
- [x] `planId` validated as positive integer
- [x] `UpdatePlanPayload` exported from `index.ts`
- [x] Unit tests: success case, invalid ID, API error

---

### TASK-006 · Add `addPlanEntry(planId, payload)` / `updatePlanEntry` / `deletePlanEntry` [Done]

**Category:** Feature / Plans  
**Description:**  
Plan entries (test runs within a plan) can be created, updated, and deleted via dedicated endpoints but none are implemented.

**Acceptance Criteria:**

- [x] `addPlanEntry(planId: number, payload: AddPlanEntryPayload): Promise<PlanEntry>` implemented
- [x] `updatePlanEntry(planId: number, entryId: string, payload: UpdatePlanEntryPayload): Promise<PlanEntry>` implemented
- [x] `deletePlanEntry(planId: number, entryId: string): Promise<void>` implemented
- [x] `UpdatePlanEntryPayload` interface added and exported
- [x] `planId` and `entryId` validated; `entryId` is a non-empty string (GUID), not a number
- [x] Unit tests for each method: success, invalid IDs, API error

---

### TASK-007 · Add `updateRun(runId, payload)` [Done]

**Category:** Feature / Runs  
**Description:**  
`POST /update_run/{run_id}` is not implemented. Callers can create and close runs but cannot rename or modify them.

**Acceptance Criteria:**

- [x] `updateRun(runId: number, payload: UpdateRunPayload): Promise<Run>` added
- [x] `UpdateRunPayload` interface with `name?`, `description?`, `milestone_id?`, `assignedto_id?`, `include_all?`, `case_ids?`, `refs?` added to `types.ts` and exported from `index.ts`
- [x] Unit tests: success, invalid ID, API error

---

### TASK-008 · Add project CRUD: `addProject`, `updateProject`, `deleteProject` [Done]

**Category:** Feature / Projects  
**Description:**  
Projects can be read but not created, updated, or deleted.

**Acceptance Criteria:**

- [x] `addProject(payload: AddProjectPayload): Promise<Project>` implemented
- [x] `updateProject(projectId: number, payload: UpdateProjectPayload): Promise<Project>` implemented
- [x] `deleteProject(projectId: number): Promise<void>` implemented
- [x] `AddProjectPayload` with `name`, `announcement?`, `show_announcement?`, `suite_mode?` added and exported
- [x] `UpdateProjectPayload` with all optional fields added and exported
- [x] Unit tests for each: success, invalid ID, API error

---

### TASK-009 · Add suite CRUD: `addSuite`, `updateSuite`, `deleteSuite` [Done by agent-q7m4pz]

**Category:** Feature / Suites  
**Description:**  
Suites can be read but not created, updated, or deleted.

**Acceptance Criteria:**

- [x] `addSuite(projectId: number, payload: AddSuitePayload): Promise<Suite>` implemented
- [x] `updateSuite(suiteId: number, payload: UpdateSuitePayload): Promise<Suite>` implemented
- [x] `deleteSuite(suiteId: number): Promise<void>` implemented
- [x] `AddSuitePayload` with `name`, `description?` added and exported
- [x] `UpdateSuitePayload` with `name?`, `description?` added and exported
- [x] Unit tests for each method

---

### TASK-010 · Add section CRUD: `addSection`, `updateSection`, `deleteSection` [Done]

**Category:** Feature / Sections  
**Description:**  
Sections can be read but not created, updated, or deleted.

**Acceptance Criteria:**

- [x] `addSection(projectId: number, payload: AddSectionPayload): Promise<Section>` implemented
- [x] `updateSection(sectionId: number, payload: UpdateSectionPayload): Promise<Section>` implemented
- [x] `deleteSection(sectionId: number): Promise<void>` implemented
- [x] `AddSectionPayload` with `name`, `suite_id?`, `parent_id?`, `description?` added and exported
- [x] `UpdateSectionPayload` with `name?`, `description?` added and exported
- [x] Unit tests for each method

---

### TASK-011 · Add milestone CRUD: `addMilestone`, `updateMilestone`, `deleteMilestone` [Done]

**Category:** Feature / Milestones  
**Description:**  
Milestones can be read but not created, updated, or deleted.

**Acceptance Criteria:**

- [x] `addMilestone(projectId: number, payload: AddMilestonePayload): Promise<Milestone>` implemented
- [x] `updateMilestone(milestoneId: number, payload: UpdateMilestonePayload): Promise<Milestone>` implemented
- [x] `deleteMilestone(milestoneId: number): Promise<void>` implemented
- [x] `AddMilestonePayload` with `name`, `description?`, `due_on?`, `start_on?`, `parent_id?`, `refs?` added and exported
- [x] `UpdateMilestonePayload` with all optional fields added and exported
- [x] Unit tests for each method

---

## P2 — Medium (Filters, Lookup Endpoints, API Completeness)

### TASK-012 · Add filter parameters to `getCases()`

**Category:** Feature / Cases  
**Description:**  
`GET /get_cases/{project_id}` supports additional filters: `type_id`, `priority_id`, `template_id`, `milestone_id`, `created_after`, `created_before`, `updated_after`, `updated_before`, `limit`, `offset`. None are currently exposed.

**Acceptance Criteria:**

- [ ] `getCases(projectId, options?: GetCasesOptions)` signature updated
- [ ] `GetCasesOptions` interface with all supported filter fields added to `types.ts` and exported
- [ ] Filters appended to query string only when provided
- [ ] Unit tests for various filter combinations

---

### TASK-013 · Add filter parameters to `getRuns()`

**Category:** Feature / Runs  
**Description:**  
`GET /get_runs/{project_id}` supports `created_after`, `created_before`, `created_by`, `is_completed`, `milestone_id`, `refs_filter`, `suite_id`, `limit`, `offset` filters.

**Acceptance Criteria:**

- [ ] `getRuns(projectId, options?: GetRunsOptions)` signature updated
- [ ] `GetRunsOptions` interface added, exported
- [ ] Unit tests for filter combinations

---

### TASK-014 · Add filter parameters to `getPlans()`

**Category:** Feature / Plans  
**Description:**  
`GET /get_plans/{project_id}` supports `created_after`, `created_before`, `created_by`, `is_completed`, `milestone_id`, `limit`, `offset` filters.

**Acceptance Criteria:**

- [ ] `getPlans(projectId, options?: GetPlansOptions)` signature updated
- [ ] `GetPlansOptions` interface added, exported
- [ ] Unit tests for filter combinations

---

### TASK-015 · Add filter parameters to `getTests()`

**Category:** Feature / Tests  
**Description:**  
`GET /get_tests/{run_id}` supports `status_id` (comma-separated list), `limit`, `offset` filters.

**Acceptance Criteria:**

- [ ] `getTests(runId, options?: GetTestsOptions)` signature updated
- [ ] `GetTestsOptions` interface with `status_id?: number[]`, `limit?`, `offset?` added and exported
- [ ] Unit tests

---

### TASK-016 · Add filter parameters to `getResults()`, `getResultsForCase()`, `getResultsForRun()`

**Category:** Feature / Results  
**Description:**  
All three result list endpoints support `created_after`, `created_before`, `created_by`, `limit`, `offset`, `status_id` filters.

**Acceptance Criteria:**

- [ ] All three methods accept `options?: GetResultsOptions`
- [ ] `GetResultsOptions` interface added and exported
- [ ] Unit tests for filter combinations on each method

---

### TASK-017 · Add filter parameters to `getMilestones()`

**Category:** Feature / Milestones  
**Description:**  
`GET /get_milestones/{project_id}` supports `is_completed`, `limit`, `offset` filters.

**Acceptance Criteria:**

- [ ] `getMilestones(projectId, options?: GetMilestonesOptions)` signature updated
- [ ] `GetMilestonesOptions` interface added and exported
- [ ] Unit tests

---

### TASK-018 · Add `project_id` filter to `getUsers()`

**Category:** Feature / Users  
**Description:**  
`GET /get_users/{project_id}` accepts an optional project ID to scope users to a project. The current `getUsers()` always calls the global endpoint.

**Acceptance Criteria:**

- [ ] `getUsers(projectId?: number): Promise<User[]>` updated to accept optional `projectId`
- [ ] When `projectId` is provided, endpoint is `get_users/{projectId}`; otherwise `get_users`
- [ ] `projectId` validated when provided
- [ ] Unit tests for both variants

---

### TASK-019 · Add `getCurrentUser()`

**Category:** Feature / Users  
**Description:**  
`GET /get_current_user` returns the currently authenticated user. Useful for verifying credentials.

**Acceptance Criteria:**

- [ ] `getCurrentUser(): Promise<User>` added
- [ ] Unit test: success, API error

---

### TASK-020 · Add `getCaseFields()` and `getCaseTypes()`

**Category:** Feature / Metadata  
**Description:**  
`GET /get_case_fields` and `GET /get_case_types` return available custom case fields and case types. Required for dynamic form generation and type-safe custom field handling.

**Acceptance Criteria:**

- [ ] `getCaseFields(): Promise<CaseField[]>` implemented
- [ ] `getCaseTypes(): Promise<CaseType[]>` implemented
- [ ] `CaseField` and `CaseType` interfaces defined in `types.ts` with known fields and exported
- [ ] Unit tests for both

---

### TASK-021 · Add `getResultFields()` [Done]

**Category:** Feature / Metadata  
**Description:**  
`GET /get_result_fields` returns available custom result fields.

**Acceptance Criteria:**

- [x] `getResultFields(): Promise<ResultField[]>` implemented
- [x] `ResultField` interface defined and exported
- [x] Unit test

---

### TASK-022 · Add `getTemplates(projectId)`

**Category:** Feature / Metadata  
**Description:**  
`GET /get_templates/{project_id}` returns available case templates for a project (requires TestRail 5.2+).

**Acceptance Criteria:**

- [ ] `getTemplates(projectId: number): Promise<Template[]>` implemented
- [ ] `Template` interface with `id`, `name`, `is_default` defined and exported
- [ ] Unit test

---

### TASK-023 · Add Configurations CRUD

**Category:** Feature / Configurations  
**Description:**  
Configurations allow run variants (e.g. OS, browser). No configuration endpoints are implemented. Required: `getConfigurations`, `addConfigurationGroup`, `updateConfigurationGroup`, `deleteConfigurationGroup`, `addConfiguration`, `updateConfiguration`, `deleteConfiguration`.

**Acceptance Criteria:**

- [ ] `getConfigurations(projectId: number): Promise<ConfigurationGroup[]>` implemented
- [ ] `addConfigurationGroup(projectId, payload): Promise<ConfigurationGroup>` implemented
- [ ] `updateConfigurationGroup(configGroupId, payload): Promise<ConfigurationGroup>` implemented
- [ ] `deleteConfigurationGroup(configGroupId): Promise<void>` implemented
- [ ] `addConfiguration(configGroupId, payload): Promise<Configuration>` implemented
- [ ] `updateConfiguration(configId, payload): Promise<Configuration>` implemented
- [ ] `deleteConfiguration(configId): Promise<void>` implemented
- [ ] `ConfigurationGroup`, `Configuration`, and all payload types defined and exported
- [ ] Unit tests for each method

---

## P3 — Low (New Feature Domains)

### TASK-024 · Add User management: `addUser`, `updateUser`

**Category:** Feature / Users  
**Description:**  
`POST /add_user` (TestRail 7.3+) and `POST /update_user/{user_id}` allow user management via API.

**Acceptance Criteria:**

- [ ] `addUser(payload: AddUserPayload): Promise<User>` implemented
- [ ] `updateUser(userId: number, payload: UpdateUserPayload): Promise<User>` implemented
- [ ] `AddUserPayload` and `UpdateUserPayload` defined and exported
- [ ] Unit tests for each

---

### TASK-025 · Add Roles: `getRoles()`

**Category:** Feature / Roles  
**Description:**  
`GET /get_roles` returns available user roles (requires TestRail 7.3+).

**Acceptance Criteria:**

- [ ] `getRoles(): Promise<Role[]>` implemented
- [ ] `Role` interface with `id`, `name`, `is_default` defined and exported
- [ ] Unit test

---

### TASK-026 · Add Groups CRUD

**Category:** Feature / Groups  
**Description:**  
Full CRUD for user groups (requires TestRail 7.5+): `getGroup`, `getGroups`, `addGroup`, `updateGroup`, `deleteGroup`.

**Acceptance Criteria:**

- [ ] `getGroup(groupId: number): Promise<Group>` implemented
- [ ] `getGroups(): Promise<Group[]>` implemented
- [ ] `addGroup(payload: AddGroupPayload): Promise<Group>` implemented
- [ ] `updateGroup(groupId, payload: UpdateGroupPayload): Promise<Group>` implemented
- [ ] `deleteGroup(groupId: number): Promise<void>` implemented
- [ ] `Group`, `AddGroupPayload`, `UpdateGroupPayload` defined and exported
- [ ] Unit tests for each

---

### TASK-027 · Add Attachments API

**Category:** Feature / Attachments  
**Description:**  
TestRail supports file attachments on cases, results, runs, and plans. None of the attachment endpoints are implemented. Includes binary file upload (multipart/form-data) and download.

**Acceptance Criteria:**

- [ ] `getAttachmentsForCase(caseId): Promise<Attachment[]>` implemented
- [ ] `getAttachmentsForRun(runId): Promise<Attachment[]>` implemented
- [ ] `getAttachmentsForTest(testId): Promise<Attachment[]>` implemented
- [ ] `getAttachmentsForPlan(planId): Promise<Attachment[]>` implemented
- [ ] `getAttachmentsForPlanEntry(planId, entryId): Promise<Attachment[]>` implemented
- [ ] `getAttachment(attachmentId): Promise<ArrayBuffer>` implemented (returns raw binary)
- [ ] `addAttachmentToCase(caseId, file): Promise<Attachment>` implemented (multipart upload)
- [ ] `addAttachmentToResult(resultId, file): Promise<Attachment>` implemented
- [ ] `addAttachmentToRun(runId, file): Promise<Attachment>` implemented
- [ ] `addAttachmentToPlan(planId, file): Promise<Attachment>` implemented (TestRail 6.5.2+)
- [ ] `addAttachmentToPlanEntry(planId, entryId, file): Promise<Attachment>` implemented
- [ ] `deleteAttachment(attachmentId): Promise<void>` implemented
- [ ] `Attachment` interface defined and exported
- [ ] Upload accepts `Blob | Buffer | File` cross-platform input
- [ ] Unit tests for each method

---

### TASK-028 · Add Shared Steps CRUD

**Category:** Feature / Shared Steps  
**Description:**  
Shared steps (reusable step sequences across cases, TestRail 7.0+) have no implementation.

**Acceptance Criteria:**

- [ ] `getSharedStep(sharedStepId: number): Promise<SharedStep>` implemented
- [ ] `getSharedSteps(projectId: number): Promise<SharedStep[]>` implemented
- [ ] `addSharedStep(projectId, payload): Promise<SharedStep>` implemented
- [ ] `updateSharedStep(sharedStepId, payload): Promise<SharedStep>` implemented
- [ ] `deleteSharedStep(sharedStepId): Promise<void>` implemented
- [ ] `SharedStep` and payload types defined and exported
- [ ] Unit tests for each

---

### TASK-029 · Add Variables CRUD

**Category:** Feature / Variables  
**Description:**  
Variables (used in data-driven testing) have no implementation: `getVariables`, `addVariable`, `updateVariable`, `deleteVariable`.

**Acceptance Criteria:**

- [ ] `getVariables(projectId: number): Promise<Variable[]>` implemented
- [ ] `addVariable(projectId, payload): Promise<Variable>` implemented
- [ ] `updateVariable(variableId, payload): Promise<Variable>` implemented
- [ ] `deleteVariable(variableId): Promise<void>` implemented
- [ ] `Variable` and payload types defined and exported
- [ ] Unit tests for each

---

### TASK-030 · Add Datasets CRUD

**Category:** Feature / Datasets  
**Description:**  
Datasets (test data sets for data-driven testing) have no implementation.

**Acceptance Criteria:**

- [ ] `getDataset(datasetId: number): Promise<Dataset>` implemented
- [ ] `getDatasets(projectId: number): Promise<Dataset[]>` implemented
- [ ] `addDataset(projectId, payload): Promise<Dataset>` implemented
- [ ] `updateDataset(datasetId, payload): Promise<Dataset>` implemented
- [ ] `deleteDataset(datasetId): Promise<void>` implemented
- [ ] `Dataset` and payload types defined and exported
- [ ] Unit tests for each

---

### TASK-031 · Add Reports API: `getReports`, `runReport`

**Category:** Feature / Reports  
**Description:**  
`GET /get_reports/{project_id}` lists available report templates; `GET /run_report/{report_template_id}` executes a report and returns URLs to the generated HTML/PDF.

**Acceptance Criteria:**

- [ ] `getReports(projectId: number): Promise<Report[]>` implemented
- [ ] `runReport(reportTemplateId: number): Promise<ReportResult>` implemented
- [ ] `Report` and `ReportResult` interfaces defined and exported
- [ ] Unit tests for both

---

## P4 — Maintenance

### TASK-032 · Export `RateLimiterConfig` from `index.ts`

**Category:** Maintenance / Exports  
**Description:**  
`RateLimiterConfig` is defined in `types.ts` and used in `TestRailConfig.rateLimiter`, but it is not re-exported from `index.ts`. Users who import the type for explicit typing cannot access it from the package entry point.

**Acceptance Criteria:**

- [ ] `RateLimiterConfig` added to the export list in `index.ts`
- [ ] `CacheEntry` removed from public exports in `index.ts` (internal implementation detail)
- [ ] Compilation passes; no other changes needed

---

### TASK-033 · Remove unused `TestRailResponse<T>` type

**Category:** Maintenance / Types  
**Description:**  
`TestRailResponse<T>` is defined in `types.ts` and exported from `index.ts` but is never used anywhere in the implementation. It creates API surface noise.

**Acceptance Criteria:**

- [ ] `TestRailResponse<T>` removed from `types.ts`
- [ ] Removed from `index.ts` exports
- [ ] No compilation errors; no test changes needed

---

### TASK-034 · Verify URL construction for all request endpoints

**Category:** Maintenance / Tests  
**Description:**  
Tests currently assert return values but do not verify what URL was passed to `fetch`. Several edge-case URL constructions (e.g. `get_user_by_email&email=...`, `get_sections/1&suite_id=2`) are untested at the URL level. A regression in URL building would be silently missed.

**Acceptance Criteria:**

- [ ] Unit tests for `getUserByEmail` verify `fetch` called with URL containing `get_user_by_email&email=encoded%40email.com`
- [ ] Unit tests for `getSections` with `suiteId` verify URL contains `&suite_id=N`
- [ ] Unit tests for `getCases` with `suiteId` + `sectionId` verify correct URL query string
- [ ] Tests use `expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(...), ...)` pattern

---

### TASK-035 · Replace `as never` type workaround in tests with proper mock typing

**Category:** Maintenance / Tests  
**Description:**  
Test files use `as never` to cast mock fetch responses (e.g., `mockFetch.mockResolvedValueOnce({...} as never)`). This suppresses TypeScript type checking on mocks and hides type errors. The correct approach is a typed helper or `satisfies Response`.

**Acceptance Criteria:**

- [ ] A `mockResponse(body: string, status?: number)` helper created in a `tests/helpers.ts` test utility
- [ ] All `as never` casts in test files replaced with the typed helper
- [ ] No reduction in test coverage; all tests still pass

---

### TASK-036 · Fix `build` script for cross-platform compatibility

**Category:** Maintenance / Tooling  
**Description:**  
`package.json` build script is `"rm -rf dist && tsc"`. `rm -rf` does not exist on Windows CMD. Even in Git Bash it works, but fails in PowerShell or non-Unix CI environments.

**Acceptance Criteria:**

- [ ] Replace `rm -rf dist` with a cross-platform solution (e.g. install `rimraf` as a dev dependency, or use `tsc --build --clean`)
- [ ] `npm run build` succeeds on Windows CMD, PowerShell, and bash

---

### TASK-037 · Add `getSections()` filter by `parent_id`

**Category:** Maintenance / API Completeness  
**Description:**  
The `GET /get_sections/{project_id}` endpoint supports filtering by `parent_id`. The current `getSections(projectId, suiteId?)` signature has no way to pass this filter.

**Acceptance Criteria:**

- [ ] `getSections(projectId, options?: GetSectionsOptions)` where `GetSectionsOptions` includes `suite_id?` and `parent_id?`
- [ ] `GetSectionsOptions` added to `types.ts` and exported from `index.ts`
- [ ] Backward-compatible: existing callers passing `suiteId` as second positional arg continue to work OR a migration note is added
- [ ] Unit tests for `suite_id` filter and `parent_id` filter

---

### TASK-038 · Add `status_id` to `AddResultPayload` as optional (not required)

**Category:** Maintenance / Types  
**Description:**  
`AddResultPayload.status_id` is currently required (`status_id: number`). The TestRail API treats it as optional — a result can be added with just a comment without changing the test status. The required constraint is overly strict.

**Acceptance Criteria:**

- [ ] `status_id` changed to `status_id?: number` in `AddResultPayload`
- [ ] All existing tests still compile and pass
- [ ] Unit test verifying a result can be added with only `comment` (no `status_id`)

---

### TASK-039 · Add JSDoc `@since` and `@version` tags for version-gated endpoints

**Category:** Maintenance / Documentation  
**Description:**  
Some TestRail API endpoints require minimum versions (e.g. Groups require 7.5+, Roles/addUser require 7.3+, Shared Steps require 7.0+, Attachments require 5.7+, Templates require 5.2+). This is not documented anywhere in the client. Callers have no way to know at development time.

**Acceptance Criteria:**

- [ ] All methods that require a minimum TestRail version include a `@since TestRail X.Y` JSDoc tag
- [ ] Methods with version requirements are noted in the method's `@throws` or `@remarks` JSDoc section
- [ ] Applies to: `getTemplates` (5.2+), `getAttachment` (5.7+), `getSharedStep` (7.0+), `getRoles` (7.3+), `addUser` (7.3+), `getGroup/getGroups/addGroup/updateGroup/deleteGroup` (7.5+)

---

### TASK-041 · Add CLI support (`testrail-cli`) [Done]

**Category:** Feature / CLI  
**Description:**  
Expose the client's API methods as an interactive command-line tool so users can query and mutate TestRail without writing code. The CLI should ship as an optional `bin` entry in the same package (or a companion `@dichovsky/testrail-cli` package) and authenticate via environment variables or a config file.

**Design decisions to make before implementation:**

- Single package with `bin` entry vs. separate companion package
- Config resolution order: `TESTRAIL_*` env vars → `.testrailrc` file → CLI flags
- Output formats: JSON (default, scriptable), table (human-readable), quiet (exit-code only)

**Acceptance Criteria:**

- [ ] Binary entry `testrail` (or `testrail-cli`) registered in `package.json` `bin` field
- [ ] Auth resolved from `TESTRAIL_BASE_URL`, `TESTRAIL_EMAIL`, `TESTRAIL_API_KEY` env vars; overridable via `--base-url`, `--email`, `--api-key` flags
- [ ] Subcommand structure: `testrail <resource> <action> [id] [--flag value]`  
       Example: `testrail project get 1`, `testrail case list --project-id 1 --suite-id 2`
- [ ] Core subcommands implemented: `project`, `suite`, `case`, `run`, `result`, `milestone`, `user`
- [ ] `--format json|table` output flag with JSON as default
- [ ] `--quiet` flag: suppress output, use exit code 0 (success) / 1 (error)
- [ ] Errors print to stderr; success data to stdout
- [ ] `--help` and `--version` flags
- [ ] Zero new runtime dependencies beyond `node:` built-ins (arg parsing via a tiny bundled parser or `util.parseArgs`)
- [ ] Unit tests for: auth resolution, output formatting, error-to-stderr routing, `--quiet` mode
- [ ] Integration test: spawn CLI as child process, verify stdout/exit code

---

### TASK-040 · Add `updateResults` / `addResults` bulk result methods

**Category:** Maintenance / API Completeness  
**Description:**  
The current `addResultsForCases(runId, payload)` adds results for specific cases. The API also provides `POST /add_results/{run_id}` which adds results by test ID (not case ID). This is distinct from `addResultsForCases` and is missing.

**Acceptance Criteria:**

- [ ] `addResults(runId: number, payload: AddResultsPayload): Promise<Result[]>` implemented
- [ ] `AddResultsPayload` with `results: AddResultForTestPayload[]` defined (where `AddResultForTestPayload` extends `AddResultPayload` with `test_id: number`)
- [ ] `AddResultsPayload` and `AddResultForTestPayload` exported
- [ ] Unit tests

---

---

## P0 — Security / Production Blockers (Audit Pass)

### TASK-041 · SIGINT/SIGTERM handlers swallow the signal — process cannot be stopped

**Category:** Security / Architecture

**Description:**
`registerProcessHandlers()` registers `process.on('SIGINT', ...)` and `process.on('SIGTERM', ...)`. Adding a listener for SIGINT/SIGTERM overrides Node.js's default exit behaviour. The current handlers call `cleanupAllClients()` but do **not** call `process.exit()` or re-raise the signal afterward. The result: pressing Ctrl+C or sending SIGTERM (e.g., from Docker, Kubernetes, or a process manager) runs cleanup but leaves the process alive indefinitely. This is a reliability and container-shutdown blocker.

**Files:**

- `src/client.ts` (lines 96–103)

**Action:**

1. After `cleanupAllClients()`, call `process.exit(130)` for SIGINT (128 + 2) and `process.exit(143)` for SIGTERM (128 + 15) — these are the conventional exit codes.
2. Alternatively, remove the signal handlers entirely (leave only `process.on('exit', ...)`) and let Node.js default signal behaviour terminate the process, since `exit` fires before the process ends regardless.

**Acceptance Criteria:**

- [ ] Sending SIGINT to a process using this library causes the process to exit within 1 second
- [ ] Sending SIGTERM to a process using this library causes the process to exit within 1 second
- [ ] Exit code is 130 for SIGINT and 143 for SIGTERM (or equivalent conventional codes)
- [ ] Unit test: verify cleanup is called before exit on each signal
- [ ] `process.on('exit', cleanupAllClients)` still fires for normal exits

---

### TASK-042 · `Math.min(...rateLimiter.requests)` causes stack overflow with large arrays

**Category:** Security / Performance

**Description:**
`checkRateLimit()` in `src/client.ts` (line ~271) calls `Math.min(...this.rateLimiter.requests)` using the spread operator to find the oldest timestamp. Spreading a large array into a variadic function consumes one stack frame per element. With `maxRequests: 10000` and `windowMs: 3600000` (1 hour), the requests array can contain up to 10 000 entries, causing `RangeError: Maximum call stack size exceeded`. An attacker who controls `TestRailConfig` can craft a configuration that crashes the process at the rate limit check. Even without malicious intent, a misconfigured high-throughput client will crash.

Additionally, since `checkRateLimit()` calls `this.rateLimiter.requests.filter(...)` before the spread, the filtered array is always in insertion order — meaning `this.rateLimiter.requests[0]` is always the oldest entry, making `Math.min` unnecessary.

**Files:**

- `src/client.ts` (checkRateLimit method)

**Action:**

1. Replace `const oldestRequest = Math.min(...this.rateLimiter.requests)` with `const oldestRequest = this.rateLimiter.requests[0]` — after the filter, index 0 is always the chronologically oldest.
2. Assert `this.rateLimiter.requests.length > 0` before accessing index 0 (guarded by the `>= maxRequests` check above it).

**Acceptance Criteria:**

- [ ] `Math.min(...array)` spread pattern removed from `checkRateLimit()`
- [ ] Replacement uses `this.rateLimiter.requests[0]` (O(1), no stack growth)
- [ ] Unit test: configure `maxRequests: 10000` and make 10 000 requests without stack overflow
- [ ] Existing rate-limit tests continue to pass

---

### TASK-043 · Unbounded response body read enables memory exhaustion

**Category:** Security / Performance

**Description:**
`request()` calls `await response.text()` with no size guard. A malicious or misbehaving TestRail server (or a man-in-the-middle) can return a multi-gigabyte response body, exhausting heap memory and crashing the Node.js process. This is especially dangerous when `maxRetries > 0`, as the oversized body could be read on each retry attempt.

**Files:**

- `src/client.ts` (request method, `response.text()` calls)

**Action:**

1. Read `Content-Length` header first; if it exceeds a configurable `maxResponseSize` (default: 50 MB), throw a `TestRailApiError` with status-like message without reading the body.
2. If `Content-Length` is absent, stream and accumulate response bytes up to `maxResponseSize`, then abort if exceeded.
3. Add `maxResponseSize?: number` to `TestRailConfig` (default `52428800` = 50 MB).
4. Export `maxResponseSize` in the config documentation.

**Acceptance Criteria:**

- [ ] `TestRailConfig.maxResponseSize` option added (default 50 MB)
- [ ] Response bodies exceeding `maxResponseSize` throw `TestRailApiError` without consuming further memory
- [ ] Unit test: mock a response with `Content-Length: 999999999`, assert `TestRailApiError` thrown before body read
- [ ] Unit test: mock a streaming response exceeding limit without `Content-Length`, assert error thrown

---

## P1 — High (Architecture & Packaging — Audit Pass)

### TASK-044 · `moduleResolution: "node"` is incorrect for `"module": "ES2022"`

**Category:** Architecture / Packaging

**Description:**
`tsconfig.json` specifies `"module": "ES2022"` with `"moduleResolution": "node"`. TypeScript 4.7+ requires `"moduleResolution": "node16"`, `"nodenext"`, or `"bundler"` when using modern ES module syntax. Using `"node"` with `"ES2022"` is a deprecated combination: TypeScript does not validate `.js` import extensions properly, does not honour the `exports` field in `package.json` of dependencies, and may produce incorrect `.d.ts` output for consumers using native Node.js ESM. This can cause subtle import resolution failures in downstream consumers.

**Files:**

- `tsconfig.json`
- `tsconfig.eslint.json`

**Action:**

1. Change `"moduleResolution": "node"` to `"moduleResolution": "bundler"` (recommended for libraries) or `"node16"` (for Node.js-first distribution).
2. Update `tsconfig.eslint.json` to extend from the updated `tsconfig.json`.
3. Run `npm run typecheck` and fix any new errors surfaced by stricter resolution.
4. Verify the built `dist/` output still imports correctly.

**Acceptance Criteria:**

- [ ] `tsconfig.json` uses `moduleResolution: "bundler"` or `"node16"`
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run build` produces valid ESM output
- [ ] No new `import` errors in source files after resolution upgrade

---

### TASK-045 · No CommonJS build — breaks `require()` consumers

**Category:** Packaging / Architecture

**Description:**
The package sets `"type": "module"` and only exports ESM (`"import"` condition in `exports`). There is no `"require"` condition and no CJS build artifact. Any consumer using `require('@dichovsky/testrail-api-client')` in a CommonJS project (Node.js without `"type": "module"`, Jest without transform, older toolchains) receives a `ERR_REQUIRE_ESM` error. This is a hard blocker for a significant portion of the Node.js ecosystem.

**Files:**

- `package.json`
- `tsconfig.json`

**Action:**

1. Add a second TypeScript config (`tsconfig.cjs.json`) targeting `"module": "CommonJS"`, `"outDir": "./dist/cjs"`.
2. Add a `build:cjs` script that compiles the CJS build.
3. Update the `build` script to run both ESM and CJS compilation.
4. Add `"require"` condition to the `exports` map: `"require": "./dist/cjs/index.js"`.
5. Add `"main": "dist/cjs/index.js"` for legacy `require()` fallback.
6. Ensure both build artifacts are included in the `files` array.

**Acceptance Criteria:**

- [ ] `require('@dichovsky/testrail-api-client')` works in a CJS project
- [ ] `import { TestRailClient } from '@dichovsky/testrail-api-client'` works in an ESM project
- [ ] `package.json` `exports` map includes both `"import"` and `"require"` conditions with `"types"` for each
- [ ] `dist/cjs/` artifacts present in published package
- [ ] CI adds a smoke test that requires the package in both module systems

---

### TASK-046 · Missing `sideEffects: false` in `package.json`

**Category:** Packaging / Performance

**Description:**
The `package.json` does not declare `"sideEffects": false`. Without this field, bundlers (webpack, Rollup, esbuild) cannot safely tree-shake the package — they must assume every module has side effects and include it all. The library has no intentional side effects (module-level `activeClients` and `processHandlersRegistered` are internal state only accessed via class construction, not on import). Marking it side-effect-free enables up to 100% elimination of unused exports in consumer bundles.

Note: The module-level `cleanupAllClients` and `registerProcessHandlers` execute only when `new TestRailClient()` is called, not on `import`, so `"sideEffects": false` is accurate.

**Files:**

- `package.json`

**Action:**

1. Add `"sideEffects": false` to `package.json`.
2. Verify with a bundler analysis (e.g., `rollup --input src/index.ts --plugin rollup-plugin-visualizer`) that only used exports are included in a consumer bundle.

**Acceptance Criteria:**

- [ ] `"sideEffects": false` added to `package.json`
- [ ] A Rollup or esbuild bundle of a minimal consumer importing only `TestRailClient` does not include `TestRailValidationError` when the latter is unused

---

### TASK-047 · Rate limiter creates a new array on every API request

**Category:** Performance

**Description:**
`checkRateLimit()` in `src/client.ts` assigns `this.rateLimiter.requests = this.rateLimiter.requests.filter(...)` on every single API call. `Array.prototype.filter` always allocates a new array. For a client making 100 requests/second, this creates 100 short-lived arrays per second, producing constant GC pressure. The correct approach is to remove stale entries from the front of the array in-place using `splice` or a pointer.

**Files:**

- `src/client.ts` (checkRateLimit)

**Action:**

1. Replace `this.rateLimiter.requests = this.rateLimiter.requests.filter(time => time > windowStart)` with an in-place cleanup: count how many leading entries are expired, then `this.rateLimiter.requests.splice(0, count)`.
2. This maintains the chronological ordering invariant (entries are always appended at the end via `push`).
3. See also TASK-042: after this fix, `this.rateLimiter.requests[0]` is still the oldest entry.

**Acceptance Criteria:**

- [ ] `filter` call replaced with in-place `splice` from the head of the array
- [ ] No new array object allocated by `checkRateLimit` on each call
- [ ] All existing rate-limiter tests pass
- [ ] A benchmark (or heap snapshot test) shows zero allocation in `checkRateLimit` hot path for requests within the window

---

## P2 — Medium (Architecture, DX, Testing — Audit Pass)

### TASK-048 · `User-Agent` header version hardcoded as `1.0.0`, mismatches `package.json`

**Category:** DX / Architecture

**Description:**
`request()` in `src/client.ts` sets `'User-Agent': 'TestRail API Client TypeScript/1.0.0'`. The `package.json` version is `1.1.0`. The hardcoded version string will fall further out of sync with every release, making server-side request analytics unreliable and confusing.

**Files:**

- `src/client.ts` (request method headers)

**Action:**

1. Import version from `package.json` using `import { version } from '../package.json' with { type: 'json' }` (requires `"resolveJsonModule": true` — already set in tsconfig).
2. Replace the hardcoded `1.0.0` with the imported `version` constant.
3. Alternatively, inject the version via a build-time constant (`__VERSION__`) using the build tool.

**Acceptance Criteria:**

- [ ] `User-Agent` header value matches the `version` field in `package.json` at build time
- [ ] After version bump in `package.json`, no manual update to `src/client.ts` is required
- [ ] Unit test verifies the `User-Agent` header starts with `TestRail API Client TypeScript/` followed by the package version

---

### TASK-049 · `console.warn` in library is not suppressible by consumers

**Category:** Architecture / DX

**Description:**
`validateConfig()` calls `console.warn(...)` directly when HTTP is detected (`src/client.ts`, line ~198). Libraries must not write to `console` without the consumer's consent — it pollutes stdout/stderr in production applications, interferes with structured logging, and cannot be silenced without monkey-patching `console`. This also violates the principle of least surprise.

**Files:**

- `src/client.ts` (validateConfig)

**Action:**

1. Add an optional `onWarning?: (message: string) => void` callback to `TestRailConfig`.
2. In `validateConfig()`, call `this.config.onWarning?.(message)` if provided; otherwise do nothing (or provide a default no-op).
3. For backward compatibility, default `onWarning` to `(msg) => console.warn(msg)` so existing behaviour is preserved unless the consumer opts out.
4. Document `onWarning` in README and JSDoc.

**Acceptance Criteria:**

- [ ] `TestRailConfig.onWarning?: (message: string) => void` added and exported
- [ ] When `onWarning` is set to a no-op, no `console.warn` output occurs
- [ ] When `onWarning` is omitted, default behaviour (console.warn) is preserved for backward compatibility
- [ ] Unit test: construct client with `baseUrl: 'http://...'` and `onWarning: vi.fn()`, assert spy called with HTTP warning message

---

### TASK-050 · Module-level `activeClients` and `processHandlersRegistered` cause test isolation failures

**Category:** Architecture / Testing

**Description:**
`activeClients` (a `Set<TestRailClient>`) and `processHandlersRegistered` (a `boolean`) are declared at module scope in `src/client.ts`. Because vitest runs all test files in the same Node.js process (unless `--pool=forks`), and because ES modules are cached after first import, both variables persist across test files. Consequences:

- `processHandlersRegistered` is set to `true` by the first test file and never reset, making it impossible to test the registration logic in isolation.
- `activeClients` accumulates clients from tests that don't call `destroy()`, bloating the set and causing `cleanupAllClients()` to operate on stale instances.

**Files:**

- `src/client.ts`

**Action:**

1. Expose a `_resetModuleState()` function (export with underscore convention as internal/test-only) that resets `activeClients` and `processHandlersRegistered` to initial values.
2. Alternatively, restructure so that process handler registration is lazy and per-test-overridable (e.g., accept an optional `processEventEmitter` in config for injection during testing).
3. Call `_resetModuleState()` in `beforeEach` / `afterEach` in test files that test process handler behaviour.

**Acceptance Criteria:**

- [ ] Test file `coverage-improvement.test.ts` can verify `process.on` is called exactly once across multiple client creations, without interference from other test files
- [ ] A `_resetModuleState()` (or equivalent) exists and is used in the process handler test suite
- [ ] `activeClients` is empty at the start of each test file that tests cleanup behaviour

---

### TASK-051 · Coverage thresholds not enforced in `vitest.config.ts`

**Category:** Testing

**Description:**
`vitest.config.ts` configures coverage reporters (`text`, `json`, `html`) but defines no `thresholds`. The README claims 97.6%+ statement coverage and 98.7% branch coverage, but nothing prevents CI from passing with lower coverage after a future change removes a test. If coverage drops, no build failure occurs.

**Files:**

- `vitest.config.ts`

**Action:**

1. Add a `thresholds` block to `vitest.config.ts`:
    ```ts
    thresholds: {
      statements: 97,
      branches: 98,
      functions: 100,
      lines: 97,
    }
    ```
2. Choose threshold values slightly below the current metrics to allow minor fluctuation without blocking routine work.
3. Confirm `npm run test:coverage` fails when thresholds are not met.

**Acceptance Criteria:**

- [ ] `vitest.config.ts` includes `coverage.thresholds` with `statements >= 97`, `branches >= 98`, `functions >= 100`, `lines >= 97`
- [ ] `npm run test:coverage` exits with code 1 when coverage drops below thresholds
- [ ] CI pipeline fails on coverage regression

---

### TASK-052 · Payload arguments not validated as non-null objects

**Category:** Architecture / Validation

**Description:**
Methods such as `addCase(sectionId, payload)`, `addRun(projectId, payload)`, `addResult(testId, payload)`, and all other mutating methods accept a `payload` argument typed as an interface but do not validate at runtime that the value is a non-null object. Callers who pass `null`, `undefined`, or a primitive (possible when consuming the library from untyped JavaScript) will silently send a malformed JSON body to the TestRail API, producing a confusing server-side error rather than a clear client-side validation error.

**Files:**

- `src/client.ts` (all public mutating methods)

**Action:**

1. Add a private `validatePayload(payload: unknown, paramName: string): void` method that checks `typeof payload === 'object' && payload !== null`.
2. Throw `TestRailValidationError` with message `"${paramName} must be a non-null object"` on failure.
3. Call `validatePayload(payload, 'payload')` at the top of each mutating method before `validateId`.
4. Add unit tests for `addCase(1, null as any)`, `addRun(1, undefined as any)`, etc.

**Acceptance Criteria:**

- [ ] All public POST methods call `validatePayload` before making any network request
- [ ] Passing `null` or `undefined` as a payload throws `TestRailValidationError` synchronously
- [ ] Unit tests cover `null`, `undefined`, and primitive payload values for at least three mutating methods

---

### TASK-053 · Several test files create `TestRailClient` instances without calling `destroy()`

**Category:** Testing

**Description:**
`tests/coverage-improvement.test.ts` creates multiple inline `TestRailClient` instances (e.g., lines 169, 407, ~496) within `it()` blocks but does not call `destroy()` afterward. These instances are added to the module-level `activeClients` set and never removed, leaking into subsequent tests. With the current implementation this causes no functional failure, but it accumulates cleanup timers and inflates the `activeClients` set, making process-exit handler tests unreliable (see TASK-050).

**Files:**

- `tests/coverage-improvement.test.ts`
- `tests/enhanced-features.test.ts`

**Action:**

1. Wrap each inline client creation in a `try/finally` block and call `client.destroy()` in `finally`.
2. Or assign each client to a variable in the test and add `afterEach(() => client?.destroy())`.
3. Review all test files and ensure every `new TestRailClient(...)` is matched by a `destroy()` call in `afterEach` or `finally`.

**Acceptance Criteria:**

- [ ] Every `new TestRailClient(...)` in the test suite is paired with a `destroy()` call
- [ ] After all tests run, `activeClients` set is empty (verifiable via `_resetModuleState` from TASK-050)
- [ ] No open handle warnings from vitest `--detectOpenHandles`

---

## P3 — Low (Documentation, DX, Tooling — Audit Pass)

### TASK-054 · `types.test.ts` only calls `toBeDefined()` — no structural type validation

**Category:** Testing

**Description:**
Every test in `tests/types.test.ts` constructs a typed variable and asserts `expect(variable).toBeDefined()`. This catches only whether a type can be instantiated at all; it provides no protection against field renames, missing required properties being accidentally made optional, or incorrect field types. The tests would all still pass even if `Case.created_by` was renamed to `createdBy`.

**Files:**

- `tests/types.test.ts`

**Action:**

1. Replace `toBeDefined()` assertions with assertions that verify specific required fields have the correct shape. For example:
    ```ts
    expect(testCase.id).toBe(1);
    expect(testCase.title).toBe('Test');
    expect(typeof testCase.created_by).toBe('number');
    ```
2. Add negative-shape tests using `// @ts-expect-error` to confirm that omitting required fields causes a compile error:
    ```ts
    // @ts-expect-error — title is required
    const badCase: Case = { id: 1 };
    ```
3. Focus on the public types most likely to drift: `Case`, `Run`, `Plan`, `Result`, `User`.

**Acceptance Criteria:**

- [ ] Each type test asserts at least two specific field values, not just `toBeDefined()`
- [ ] At least five `// @ts-expect-error` compile-time guards added for missing required fields
- [ ] All tests still pass after changes

---

### TASK-055 · README has a duplicate "Error Handling" section

**Category:** Documentation

**Description:**
The README contains two separate "## Error Handling" sections — one at approximately line 129 and another at approximately line 347. Both contain largely the same code example showing `TestRailApiError` / `TestRailValidationError` usage. This confuses readers navigating the document and wastes space.

**Files:**

- `README.md`

**Action:**

1. Remove the second (duplicate) "Error Handling" section.
2. Merge any unique content from the second section into the first.
3. Ensure the table of contents (if any) and internal links remain valid.

**Acceptance Criteria:**

- [ ] Exactly one "Error Handling" section in README.md
- [ ] All content from both original sections is preserved in the single merged section
- [ ] No broken anchor links

---

### TASK-056 · README incorrectly states the rate limiter "queues requests"

**Category:** Documentation

**Description:**
The README "Advanced Features → Rate Limiting" section states: "Automatic request queuing". This is factually incorrect — the rate limiter throws a `TestRailApiError` immediately when the limit is exceeded; it does **not** queue or delay requests. A consumer who reads this documentation will expect queuing behaviour and be surprised when their code throws instead.

**Files:**

- `README.md`

**Action:**

1. Replace "Automatic request queuing" with an accurate description such as: "Throws `TestRailApiError` with a wait time message when the configured limit is exceeded."
2. Add a code example showing how to handle the error and retry after waiting:
    ```ts
    // If rate limit is exceeded, wait and retry
    catch (error) {
      if (error instanceof TestRailApiError && error.message.startsWith('Rate limit exceeded')) { ... }
    }
    ```

**Acceptance Criteria:**

- [ ] "Automatic request queuing" text removed from README
- [ ] Accurate description of throw-on-exceed behaviour included
- [ ] Optional: code example showing error handling for rate limit exceeded

---

### TASK-057 · No code formatting configuration (Prettier or equivalent)

**Category:** DX / Tooling

**Description:**
The project has ESLint for linting but no formatter configured. Without a formatter, contributors produce inconsistent whitespace, quote styles, and trailing commas, leading to noisy diffs and style-only review comments. ESLint is not a formatter replacement — it doesn't enforce consistent indentation or line length uniformly.

**Action:**

1. Install `prettier` as a dev dependency.
2. Create `.prettierrc.json` with project-appropriate settings (e.g., `{ "singleQuote": true, "trailingComma": "es5", "printWidth": 100 }`).
3. Add a `"format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""` script to `package.json`.
4. Add `"format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\""` script.
5. Add the format check step to the CI workflow after linting.
6. Install `eslint-config-prettier` and add it as the last entry in the ESLint config to disable formatting rules that conflict with Prettier.

**Acceptance Criteria:**

- [ ] `npm run format` formats all source and test files without errors
- [ ] `npm run format:check` exits with code 1 when files are not formatted
- [ ] CI fails when unformatted code is pushed
- [ ] `eslint-config-prettier` disables conflicting ESLint formatting rules

---

### TASK-058 · No dedicated `CHANGELOG.md` file

**Category:** DX / Documentation

**Description:**
Release notes are embedded inside `README.md` under "## Changelog". This non-standard location is not picked up by npm's changelog viewer, GitHub Releases, or tools like `conventional-changelog`. Consumers who want to know what changed between versions cannot find it via the standard path.

**Action:**

1. Create a `CHANGELOG.md` file in the repository root following the [Keep a Changelog](https://keepachangelog.com) format.
2. Move the existing changelog content from `README.md` into `CHANGELOG.md`.
3. Remove the changelog section from `README.md`, replacing it with a link: `See [CHANGELOG.md](CHANGELOG.md) for release history.`
4. Add `CHANGELOG.md` to the `files` array in `package.json` so it is included in the published package.

**Acceptance Criteria:**

- [ ] `CHANGELOG.md` exists in the repository root with content from the previous README changelog section
- [ ] `README.md` no longer contains changelog content; contains a link to `CHANGELOG.md` instead
- [ ] `CHANGELOG.md` is listed in `package.json` `files` array
- [ ] Format follows Keep a Changelog (version headers, Added/Changed/Fixed categories)

---

### TASK-059 · `declarationMap: true` generates `.d.ts.map` files not useful to most consumers

**Category:** Packaging

**Description:**
`tsconfig.json` sets `"declarationMap": true`, which generates `.d.ts.map` files alongside every `.d.ts` declaration file in `dist/`. These source-map files allow IDEs to "go to definition" and jump directly to the `.ts` source instead of the `.d.ts`. However, this only works if the consumer has the `src/` directory available — which they do (it's in `files`). The downside is that `.d.ts.map` files add roughly 50% overhead to the types distribution size with no benefit for consumers who do not have the source. Evaluate whether this is intentional and document the decision either way.

**Files:**

- `tsconfig.json`
- `package.json` (`files`)

**Action (if removing is preferred):**

1. Set `"declarationMap": false` in `tsconfig.json`.
2. Remove `.d.ts.map` entries from `dist/` (handled by the clean build).
3. Update `files` in `package.json` if `.map` files were explicitly listed.

**Action (if keeping is preferred):**

1. Add a comment in `tsconfig.json` explaining why `declarationMap` is enabled.
2. Confirm `src/**/*.ts` is in `package.json` `files` so the maps are resolvable.

**Acceptance Criteria:**

- [ ] An explicit decision is made and documented in a tsconfig comment or ADR
- [ ] If removed: `dist/` contains only `.js`, `.d.ts`, and `.js.map` files; no `.d.ts.map`
- [ ] If kept: `src/` is confirmed present in the published package and IDE "go to definition" is tested to work on the installed package

---

_Last updated: 2026-04-06 | Total tasks: 59_
