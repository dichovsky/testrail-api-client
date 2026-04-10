# TASKS

Atomic, prioritized backlog of all known gaps, bugs, and improvements.

**Priority scale:**

- **P0** — Critical: correctness bugs affecting existing behaviour
- **P1** — High: missing write operations for already-supported entities
- **P2** — Medium: missing API surface (filters, pagination, lookup endpoints)
- **P3** — Low: entirely new feature domains not yet started
- **P4** — Maintenance: types, exports, test quality, tooling

---

## P2 — Medium (Filters, Lookup Endpoints, API Completeness)

### TASK-012 · Add filter parameters to `getCases()` [In Progress]

**Category:** Feature / Cases  
**Description:**  
`GET /get_cases/{project_id}` supports additional filters: `type_id`, `priority_id`, `template_id`, `milestone_id`, `created_after`, `created_before`, `updated_after`, `updated_before`, `limit`, `offset`. None are currently exposed.

**Acceptance Criteria:**

- [ ] `getCases(projectId, options?: GetCasesOptions)` signature updated
- [ ] `GetCasesOptions` interface with all supported filter fields added to `types.ts` and exported
- [ ] Filters appended to query string only when provided
- [ ] Unit tests for various filter combinations

---

### TASK-013 · Add filter parameters to `getRuns()` [Done]

**Category:** Feature / Runs  
**Description:**  
`GET /get_runs/{project_id}` supports `created_after`, `created_before`, `created_by`, `is_completed`, `milestone_id`, `refs_filter`, `suite_id`, `limit`, `offset` filters.

**Acceptance Criteria:**

- [x] `getRuns(projectId, options?: GetRunsOptions)` signature updated
- [x] `GetRunsOptions` interface added, exported
- [x] Unit tests for filter combinations

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
