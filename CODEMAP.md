# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [48](src/client.ts#L48) |
| `getProjects` | ? | `?` | [58](src/client.ts#L58) |
| `getSuite` | GET | `get_suite/${suiteId}` | [72](src/client.ts#L72) |
| `getSuites` | GET | `get_suites/${projectId}` | [82](src/client.ts#L82) |
| `getSection` | GET | `get_section/${sectionId}` | [94](src/client.ts#L94) |
| `getSections` | GET | `get_sections/${projectId}&...` | [107](src/client.ts#L107) |
| `addSection` | POST | `add_section/${projectId}` | [127](src/client.ts#L127) |
| `updateSection` | POST | `update_section/${sectionId}` | [137](src/client.ts#L137) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [147](src/client.ts#L147) |
| `getCase` | GET | `get_case/${caseId}` | [159](src/client.ts#L159) |
| `getCases` | ? | `?` | [173](src/client.ts#L173) |
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
| `getUserByEmail` | ? | `?` | [526](src/client.ts#L526) |
| `getUsers` | ? | `?` | [541](src/client.ts#L541) |
| `getStatuses` | GET | `get_statuses` | [554](src/client.ts#L554) |
| `getPriorities` | GET | `get_priorities` | [564](src/client.ts#L564) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [97](src/client-core.ts#L97) |
| `validateId` | [286](src/client-core.ts#L286) |
| `buildEndpoint` | [325](src/client-core.ts#L325) |
| `clearCache` | [380](src/client-core.ts#L380) |
| `destroy` | [83](src/client-core.ts#L83) |
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
| `Section` | [94](src/types.ts#L94) |
| `Project` | [104](src/types.ts#L104) |
| `Plan` | [116](src/types.ts#L116) |
| `PlanEntry` | [143](src/types.ts#L143) |
| `Run` | [155](src/types.ts#L155) |
| `Test` | [187](src/types.ts#L187) |
| `Result` | [204](src/types.ts#L204) |
| `Milestone` | [219](src/types.ts#L219) |
| `User` | [235](src/types.ts#L235) |
| `Status` | [244](src/types.ts#L244) |
| `Priority` | [256](src/types.ts#L256) |
| `AddCasePayload` | [264](src/types.ts#L264) |
| `UpdateCasePayload` | [275](src/types.ts#L275) |
| `AddPlanPayload` | [286](src/types.ts#L286) |
| `UpdatePlanPayload` | [293](src/types.ts#L293) |
| `AddPlanEntryPayload` | [300](src/types.ts#L300) |
| `UpdatePlanEntryPayload` | [311](src/types.ts#L311) |
| `AddRunPayload` | [322](src/types.ts#L322) |
| `UpdateRunPayload` | [333](src/types.ts#L333) |
| `AddResultPayload` | [343](src/types.ts#L343) |
| `AddResultsForCasesPayload` | [354](src/types.ts#L354) |
| `AddResultForCasePayload` | [358](src/types.ts#L358) |
| `AddSectionPayload` | [362](src/types.ts#L362) |
| `UpdateSectionPayload` | [369](src/types.ts#L369) |
| `CacheEntry` | [374](src/types.ts#L374) |
| `RateLimiterConfig` | [379](src/types.ts#L379) |
