# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [60](src/client.ts#L60) |
| `getProjects` | GET | `get_projects&...` | [70](src/client.ts#L70) |
| `addProject` | POST | `add_project` | [81](src/client.ts#L81) |
| `updateProject` | POST | `update_project/${projectId}` | [90](src/client.ts#L90) |
| `deleteProject` | POST | `delete_project/${projectId}` | [100](src/client.ts#L100) |
| `getSuite` | GET | `get_suite/${suiteId}` | [112](src/client.ts#L112) |
| `getSuites` | GET | `get_suites/${projectId}` | [122](src/client.ts#L122) |
| `addSuite` | POST | `add_suite/${projectId}` | [132](src/client.ts#L132) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [142](src/client.ts#L142) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [152](src/client.ts#L152) |
| `getSection` | GET | `get_section/${sectionId}` | [164](src/client.ts#L164) |
| `getSections` | GET | `get_sections/${projectId}&...` | [177](src/client.ts#L177) |
| `addSection` | POST | `add_section/${projectId}` | [197](src/client.ts#L197) |
| `updateSection` | POST | `update_section/${sectionId}` | [207](src/client.ts#L207) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [217](src/client.ts#L217) |
| `getCase` | GET | `get_case/${caseId}` | [229](src/client.ts#L229) |
| `getCases` | GET | `get_cases/${projectId}&...` | [243](src/client.ts#L243) |
| `addCase` | POST | `add_case/${sectionId}` | [271](src/client.ts#L271) |
| `updateCase` | POST | `update_case/${caseId}` | [281](src/client.ts#L281) |
| `deleteCase` | POST | `delete_case/${caseId}` | [291](src/client.ts#L291) |
| `getPlan` | GET | `get_plan/${planId}` | [303](src/client.ts#L303) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [316](src/client.ts#L316) |
| `addPlan` | POST | `add_plan/${projectId}` | [337](src/client.ts#L337) |
| `updatePlan` | POST | `update_plan/${planId}` | [347](src/client.ts#L347) |
| `closePlan` | POST | `close_plan/${planId}` | [357](src/client.ts#L357) |
| `deletePlan` | POST | `delete_plan/${planId}` | [367](src/client.ts#L367) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [377](src/client.ts#L377) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [387](src/client.ts#L387) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [398](src/client.ts#L398) |
| `getRun` | GET | `get_run/${runId}` | [411](src/client.ts#L411) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [424](src/client.ts#L424) |
| `addRun` | POST | `add_run/${projectId}` | [459](src/client.ts#L459) |
| `updateRun` | POST | `update_run/${runId}` | [469](src/client.ts#L469) |
| `closeRun` | POST | `close_run/${runId}` | [479](src/client.ts#L479) |
| `deleteRun` | POST | `delete_run/${runId}` | [489](src/client.ts#L489) |
| `getTest` | GET | `get_test/${testId}` | [501](src/client.ts#L501) |
| `getTests` | GET | `get_tests/${runId}&...` | [513](src/client.ts#L513) |
| `getResults` | GET | `get_results/${testId}&...` | [535](src/client.ts#L535) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}&...` | [559](src/client.ts#L559) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [583](src/client.ts#L583) |
| `addResult` | POST | `add_result/${testId}` | [603](src/client.ts#L603) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [613](src/client.ts#L613) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [624](src/client.ts#L624) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [636](src/client.ts#L636) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [648](src/client.ts#L648) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [665](src/client.ts#L665) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [675](src/client.ts#L675) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [685](src/client.ts#L685) |
| `getUser` | GET | `get_user/${userId}` | [697](src/client.ts#L697) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [707](src/client.ts#L707) |
| `getUsers` | GET | `get_users&...` | [722](src/client.ts#L722) |
| `getStatuses` | GET | `get_statuses` | [735](src/client.ts#L735) |
| `getPriorities` | GET | `get_priorities` | [745](src/client.ts#L745) |
| `getResultFields` | GET | `get_result_fields` | [755](src/client.ts#L755) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [99](src/client-core.ts#L99) |
| `validateId` | [288](src/client-core.ts#L288) |
| `buildEndpoint` | [327](src/client-core.ts#L327) |
| `clearCache` | [382](src/client-core.ts#L382) |
| `destroy` | [427](src/client-core.ts#L427) |
| `request` | [454](src/client-core.ts#L454) |

## Error Classes (`src/errors.ts`)

| Class | Line |
|-------|------|
| `TestRailApiError` | [8](src/errors.ts#L8) |
| `TestRailValidationError` | [23](src/errors.ts#L23) |

## Constants (`src/constants.ts`)

| Constant | Value | Line |
|----------|-------|------|
| `BASE_RETRY_DELAY_MS` | `1000` | [2](src/constants.ts#L2) |
| `MAX_RETRY_DELAY_MS` | `10000` | [3](src/constants.ts#L3) |
| `MAX_TIMEOUT_MS` | `5 * 60 * 1000` | [6](src/constants.ts#L6) |
| `DEFAULT_TIMEOUT_MS` | `30000` | [9](src/constants.ts#L9) |
| `DEFAULT_MAX_RETRIES` | `3` | [10](src/constants.ts#L10) |
| `DEFAULT_CACHE_TTL_MS` | `300000` | [11](src/constants.ts#L11) |
| `DEFAULT_CACHE_CLEANUP_INTERVAL_MS` | `60000` | [12](src/constants.ts#L12) |
| `DEFAULT_MAX_CACHE_SIZE` | `1000` | [13](src/constants.ts#L13) |
| `DEFAULT_RATE_LIMIT_MAX_REQUESTS` | `100` | [14](src/constants.ts#L14) |
| `DEFAULT_RATE_LIMIT_WINDOW_MS` | `60000` | [15](src/constants.ts#L15) |

## Types (`src/types.ts`)

| Type | Line |
|------|------|
| `TestRailConfig` | [4](src/types.ts#L4) |
| `TestRailResponse` | [43](src/types.ts#L43) |
| `PaginatedResponse` | [48](src/types.ts#L48) |
| `Case` | [61](src/types.ts#L61) |
| `Suite` | [82](src/types.ts#L82) |
| `AddSuitePayload` | [94](src/types.ts#L94) |
| `UpdateSuitePayload` | [99](src/types.ts#L99) |
| `Section` | [104](src/types.ts#L104) |
| `Project` | [114](src/types.ts#L114) |
| `Plan` | [126](src/types.ts#L126) |
| `PlanEntry` | [153](src/types.ts#L153) |
| `Run` | [165](src/types.ts#L165) |
| `Test` | [197](src/types.ts#L197) |
| `Result` | [214](src/types.ts#L214) |
| `Milestone` | [229](src/types.ts#L229) |
| `User` | [245](src/types.ts#L245) |
| `Status` | [254](src/types.ts#L254) |
| `Priority` | [266](src/types.ts#L266) |
| `AddCasePayload` | [274](src/types.ts#L274) |
| `UpdateCasePayload` | [285](src/types.ts#L285) |
| `AddPlanPayload` | [296](src/types.ts#L296) |
| `UpdatePlanPayload` | [303](src/types.ts#L303) |
| `AddPlanEntryPayload` | [310](src/types.ts#L310) |
| `UpdatePlanEntryPayload` | [321](src/types.ts#L321) |
| `AddRunPayload` | [332](src/types.ts#L332) |
| `UpdateRunPayload` | [343](src/types.ts#L343) |
| `AddResultPayload` | [353](src/types.ts#L353) |
| `AddResultsForCasesPayload` | [364](src/types.ts#L364) |
| `AddResultForCasePayload` | [368](src/types.ts#L368) |
| `AddSectionPayload` | [372](src/types.ts#L372) |
| `UpdateSectionPayload` | [379](src/types.ts#L379) |
| `AddMilestonePayload` | [384](src/types.ts#L384) |
| `UpdateMilestonePayload` | [395](src/types.ts#L395) |
| `GetRunsOptions` | [408](src/types.ts#L408) |
| `ResultFieldConfig` | [429](src/types.ts#L429) |
| `ResultField` | [443](src/types.ts#L443) |
| `CacheEntry` | [462](src/types.ts#L462) |
| `RateLimiterConfig` | [467](src/types.ts#L467) |
| `AddProjectPayload` | [472](src/types.ts#L472) |
| `UpdateProjectPayload` | [479](src/types.ts#L479) |
| `GetPlansOptions` | [490](src/types.ts#L490) |
| `GetTestsOptions` | [510](src/types.ts#L510) |
| `GetResultsOptions` | [523](src/types.ts#L523) |
| `GetMilestonesOptions` | [541](src/types.ts#L541) |
