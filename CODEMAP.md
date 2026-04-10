# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [48](src/client.ts#L48) |
| `getProjects` | GET | `get_projects&...` | [58](src/client.ts#L58) |
| `getSuite` | GET | `get_suite/${suiteId}` | [72](src/client.ts#L72) |
| `getSuites` | GET | `get_suites/${projectId}` | [82](src/client.ts#L82) |
| `addSuite` | POST | `add_suite/${projectId}` | [92](src/client.ts#L92) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [102](src/client.ts#L102) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [112](src/client.ts#L112) |
| `getSection` | GET | `get_section/${sectionId}` | [124](src/client.ts#L124) |
| `getSections` | GET | `get_sections/${projectId}&...` | [137](src/client.ts#L137) |
| `getCase` | GET | `get_case/${caseId}` | [159](src/client.ts#L159) |
| `getCases` | GET | `get_cases/${projectId}&...` | [173](src/client.ts#L173) |
| `addCase` | POST | `add_case/${sectionId}` | [201](src/client.ts#L201) |
| `updateCase` | POST | `update_case/${caseId}` | [211](src/client.ts#L211) |
| `deleteCase` | POST | `delete_case/${caseId}` | [221](src/client.ts#L221) |
| `getPlan` | GET | `get_plan/${planId}` | [233](src/client.ts#L233) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [243](src/client.ts#L243) |
| `addPlan` | POST | `add_plan/${projectId}` | [256](src/client.ts#L256) |
| `updatePlan` | POST | `update_plan/${planId}` | [266](src/client.ts#L266) |
| `closePlan` | POST | `close_plan/${planId}` | [276](src/client.ts#L276) |
| `deletePlan` | POST | `delete_plan/${planId}` | [286](src/client.ts#L286) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [296](src/client.ts#L296) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [306](src/client.ts#L306) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [317](src/client.ts#L317) |
| `getRun` | GET | `get_run/${runId}` | [330](src/client.ts#L330) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [340](src/client.ts#L340) |
| `addRun` | POST | `add_run/${projectId}` | [353](src/client.ts#L353) |
| `updateRun` | POST | `update_run/${runId}` | [363](src/client.ts#L363) |
| `closeRun` | POST | `close_run/${runId}` | [373](src/client.ts#L373) |
| `deleteRun` | POST | `delete_run/${runId}` | [383](src/client.ts#L383) |
| `getTest` | GET | `get_test/${testId}` | [395](src/client.ts#L395) |
| `getTests` | GET | `get_tests/${runId}&...` | [405](src/client.ts#L405) |
| `getResults` | GET | `get_results/${testId}&...` | [420](src/client.ts#L420) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [433](src/client.ts#L433) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [445](src/client.ts#L445) |
| `addResult` | POST | `add_result/${testId}` | [458](src/client.ts#L458) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [468](src/client.ts#L468) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [479](src/client.ts#L479) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [491](src/client.ts#L491) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [501](src/client.ts#L501) |
| `getUser` | GET | `get_user/${userId}` | [516](src/client.ts#L516) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [526](src/client.ts#L526) |
| `getUsers` | GET | `get_users&...` | [541](src/client.ts#L541) |
| `getStatuses` | GET | `get_statuses` | [554](src/client.ts#L554) |
| `getPriorities` | GET | `get_priorities` | [564](src/client.ts#L564) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [97](src/client-core.ts#L97) |
| `validateId` | [286](src/client-core.ts#L286) |
| `buildEndpoint` | [325](src/client-core.ts#L325) |
| `clearCache` | [380](src/client-core.ts#L380) |
| `destroy` | [425](src/client-core.ts#L425) |
| `request` | [452](src/client-core.ts#L452) |

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
| `CacheEntry` | [372](src/types.ts#L372) |
| `RateLimiterConfig` | [377](src/types.ts#L377) |
