# TASKS

Atomic backlog of gaps, bugs, improvements.

**Priority:** P0=Critical | P1=High(write ops) | P2=Medium(filters/pagination) | P3=Low(new features) | P4=Maintenance

---

## P0 — Critical

### TASK-001 · Cache not invalidated after mutations [Done]
After mutation, cache entry for affected resource removed. Tests cover each mutation→read scenario.

### TASK-002 · `AddCasePayload.section_id` is a path parameter [Done]
`section_id` removed from payload type; exists as URL segment only.

### TASK-003 · `Retry-After` header ignored on 429 [In Progress]
Parse `Retry-After` header (seconds or HTTP-date); use instead of exponential backoff when present. Test: mock 429 with/without header.

### TASK-004 · Pagination silently truncates large result sets
All list endpoints return only first page (default 250). Add optional `limit`/`offset` params OR auto-paginating `getAll*` variant. Types: `PaginatedResponse<T>`.

---

## P1 — High (Write Operations)

### TASK-005 · `updatePlan(planId, payload)`
Implement PUT /update_plan/{plan_id}. Add `UpdatePlanPayload` (name?, description?, milestone_id?, assignedto_id?). Validate ID.

### TASK-006 · Plan entries CRUD (`addPlanEntry`/`updatePlanEntry`/`deletePlanEntry`)
Create/update/delete test runs within plans. Validate planId (number), entryId (non-empty string GUID).

### TASK-007 · `updateRun(runId, payload)`
Implement POST /update_run/{run_id}. Add `UpdateRunPayload` (name?, description?, milestone_id?, assignedto_id?, include_all?, case_ids?, refs?).

### TASK-008 · Project CRUD (`addProject`/`updateProject`/`deleteProject`)
Projects readable but not writable. Add payloads: `AddProjectPayload` (name, announcement?, show_announcement?, suite_mode?), `UpdateProjectPayload`.

### TASK-009 · Suite CRUD (`addSuite`/`updateSuite`/`deleteSuite`)
Suites readable but not writable. Add `AddSuitePayload` (name, description?), `UpdateSuitePayload` (name?, description?).

### TASK-010 · Section CRUD (`addSection`/`updateSection`/`deleteSection`)
Sections readable but not writable. Add `AddSectionPayload` (name, suite_id?, parent_id?, description?), `UpdateSectionPayload` (name?, description?).

### TASK-011 · Milestone CRUD (`addMilestone`/`updateMilestone`/`deleteMilestone`)
Milestones readable but not writable. Add `AddMilestonePayload` (name, description?, due_on?, start_on?, parent_id?, refs?), `UpdateMilestonePayload`.

---

## P2 — Medium (Filters/Lookups)

### TASK-012 · Filters for `getCases()`
Expose: type_id, priority_id, template_id, milestone_id, created_after/before, updated_after/before, limit, offset. Add `GetCasesOptions` interface.

### TASK-013 · Filters for `getRuns()`
Expose same filter set as getCases plus status filters.

### TASK-014 · Filters for `getPlans()`
Expose: is_completed, milestone_id, created_after/before, updated_after/before.

### TASK-015 · Filters for `getTests()`
Expose: type_id, priority_id, case_type_id, assignee_id, creator_id, is_passed, label_ids, search, sort_order, limit, offset.

### TASK-016 · Filters for `getResults*()`
`getResults(runId)`: status_id, created_after/before, updated_after/before. `getResultsForCase(caseId)`: same + user filters.

### TASK-017 · Filters for `getMilestones()`
Expose: is_completed, search.

### TASK-018 · `project_id` filter for `getUsers()`
Add project_id query param to filter users by project membership.

### TASK-019 · `getCurrentUser()`
GET /get_current_user endpoint not implemented.

### TASK-020 · `getCaseFields()` and `getCaseTypes()`
Lookup endpoints for case fields metadata and available case types per project.

### TASK-021 · `getResultFields()`
Lookup endpoint for result field metadata.

### TASK-022 · `getTemplates(projectId)`
GET /get_templates/{project_id} not implemented.

---

## P3 — Low (New Features)

### TASK-023 · Configurations CRUD
Full create/update/delete/list for test configurations. Add payload types.

### TASK-024 · User management (`addUser`/`updateUser`)
GET /get_user/{id} exists; missing add/update endpoints with proper user payloads.

### TASK-025 · `getRoles()`
GET /get_roles endpoint not implemented for role-based access control queries.

### TASK-026 · Groups CRUD (`addGroup`/`updateGroup`/`deleteGroup`/`addGroupUser`/`removeGroupUser`)
Groups API partially missing. Add all CRUD operations with group membership management.

### TASK-027 · Attachments API (`uploadAttachmentToCase`/`getAttachmentsForCase`)
File upload/download for test cases not implemented. Handle multipart/form-data.

### TASK-028 · Shared Steps CRUD (`addSharedStep`/`updateSharedStep`/`deleteSharedStep`)
Centralized reusable steps feature not exposed in client.

### TASK-029 · Variables CRUD (`addRunVariable`/`updateRunVariable`/`deleteRunVariable`)
Test run variables for parameterized testing not implemented.

### TASK-030 · Datasets CRUD (`getDatasets`/`addDataset`/`updateDataset`/`deleteDataset`)
Data sets for bulk test creation missing from client.

### TASK-031 · Reports API (`getReports`/`runReport`)
Custom report generation and retrieval endpoints not implemented.

---

## P4 — Maintenance

### TASK-032 · Export `RateLimiterConfig` from `index.ts`
Type exported for external configuration usage.

### TASK-033 · Remove unused `TestRailResponse<T>` type
Interface added but never used; clean up dead code.

### TASK-034 · Verify URL construction for all endpoints
Audit endpoint paths: no leading slash, query params appended correctly (e.g., `get_user_by_email&email=...`).

### TASK-035 · Replace `as never` workaround in tests with proper mock typing
Test mocks use type assertion hacks; implement proper type-safe mocking.

### TASK-036 · Fix `build` script for cross-platform compatibility
npm build script uses platform-specific commands; ensure Windows/Unix compatibility.

### TASK-037 · `getSections()` filter by `parent_id`
Add parent_id query parameter for hierarchical section queries.

### TASK-038 · `status_id` optional in `AddResultPayload`
Currently marked required but TestRail API allows omission (auto-detect from test status).

### TASK-039 · Add JSDoc `@since` and `@version` tags
Document version-gated endpoints with metadata.

### TASK-040 · Bulk result methods (`updateResults`/`addResults`)
Batch update/create results for multiple tests in single API call.

---

## Security / Reliability

### TASK-041 · SIGINT/SIGTERM handlers swallow signal — process cannot be stopped
Cleanup handlers prevent default signal behavior; restore after cleanup completes.

### TASK-042 · `Math.min(...rateLimiter.requests)` stack overflow with large arrays
Spread operator fails on arrays > ~130k elements. Use loop or `Array.prototype.reduce()`.

### TASK-043 · Unbounded response body read enables memory exhaustion
Read entire body into memory without size limit. Add 10MB max buffer; reject oversized responses.

### TASK-045 · No CommonJS build — breaks `require()` consumers
Only ESM output (`dist/**/*.js` with `.js` imports). Add dual package: `package.json` `"exports"` field or separate CJS build.

### TASK-046 · Missing `sideEffects: false` in `package.json`
Optimization hint for bundlers (tree-shaking); add to package.json.

### TASK-047 · Rate limiter creates new array on every API request
`this.rateLimiter.requests = [...]` allocates fresh array per call. Optimize in-place mutation.

### TASK-048 · `User-Agent` header version hardcoded as `1.0.0`, mismatches `package.json`
Version string `"1.0.0"` vs actual `"2.3.5"`. Import from package.json or use environment variable.

### TASK-049 · `console.warn` in library not suppressible by consumers
HTTP protocol warning always logged. Add opt-out via config option.

### TASK-050 · Module-level state causes test isolation failures
`activeClients` set and `processHandlersRegistered` flag persist across tests. Add `_resetModuleState()` for tests or use per-instance cleanup tracking.

---

## Test Quality

### TASK-051 · Coverage thresholds not enforced in `vitest.config.ts`
Config has thresholds but they don't fail CI. Set `coverage.thresholds.autoUpdate: false`, enforce 95%+.

### TASK-052 · Payload arguments not validated as non-null objects
Callers can pass null/undefined; validate all payload params before API call, throw validation error.

### TASK-053 · Test files leak `TestRailClient` instances without `destroy()`
Inline client creation in tests accumulates in `activeClients`. Ensure destroy() called after each test using try/finally.

### TASK-054 · `types.test.ts` only calls `toBeDefined()` — no structural validation
Tests verify type exists but not shape. Add assertions: required fields present, optional fields truly optional, correct types.

---

## Documentation

### TASK-055 · README has duplicate "Error Handling" section
Copy-paste error; remove one instance and consolidate examples.

### TASK-056 · README incorrectly states rate limiter "queues requests"
Documentation says queueing happens; actual behavior throws `TestRailApiError` when limit exceeded. Correct description.

### TASK-057 · No code formatting configuration (Prettier)
ESLint present but no formatter. Install Prettier, add format/format:check scripts, integrate with CI.

### TASK-058 · No dedicated `CHANGELOG.md` file
Changelog embedded in README under non-standard location. Move to separate CHANGELOG.md following Keep a Changelog format.

---

## Packaging

### TASK-059 · `declarationMap: true` generates `.d.ts.map` files not useful to most consumers
TS config generates source maps for types (`.d.ts.map`). Decision needed: keep (requires src in published package) or remove (smaller bundle).

---

*Last updated: 2026-04-08 | Total tasks: 59*
