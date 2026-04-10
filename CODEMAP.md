# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [52](src/client.ts#L52) |
| `getProjects` | GET | `get_projects&...` | [62](src/client.ts#L62) |
| `addProject` | POST | `add_project` | [73](src/client.ts#L73) |
| `updateProject` | POST | `update_project/${projectId}` | [82](src/client.ts#L82) |
| `deleteProject` | POST | `delete_project/${projectId}` | [92](src/client.ts#L92) |
| `getSuite` | GET | `get_suite/${suiteId}` | [104](src/client.ts#L104) |
| `getSuites` | GET | `get_suites/${projectId}` | [114](src/client.ts#L114) |
| `addSuite` | POST | `add_suite/${projectId}` | [124](src/client.ts#L124) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [134](src/client.ts#L134) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [144](src/client.ts#L144) |
| `getSection` | GET | `get_section/${sectionId}` | [156](src/client.ts#L156) |
| `getSections` | GET | `get_sections/${projectId}&...` | [169](src/client.ts#L169) |
| `addSection` | POST | `add_section/${projectId}` | [189](src/client.ts#L189) |
| `updateSection` | POST | `update_section/${sectionId}` | [199](src/client.ts#L199) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [209](src/client.ts#L209) |
| `getCase` | GET | `get_case/${caseId}` | [221](src/client.ts#L221) |
| `getCases` | GET | `get_cases/${projectId}&...` | [235](src/client.ts#L235) |
| `addCase` | POST | `add_case/${sectionId}` | [263](src/client.ts#L263) |
| `updateCase` | POST | `update_case/${caseId}` | [273](src/client.ts#L273) |
| `deleteCase` | POST | `delete_case/${caseId}` | [283](src/client.ts#L283) |
| `getPlan` | GET | `get_plan/${planId}` | [295](src/client.ts#L295) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [305](src/client.ts#L305) |
| `addPlan` | POST | `add_plan/${projectId}` | [318](src/client.ts#L318) |
| `updatePlan` | POST | `update_plan/${planId}` | [328](src/client.ts#L328) |
| `closePlan` | POST | `close_plan/${planId}` | [338](src/client.ts#L338) |
| `deletePlan` | POST | `delete_plan/${planId}` | [348](src/client.ts#L348) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [358](src/client.ts#L358) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [368](src/client.ts#L368) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [379](src/client.ts#L379) |
| `getRun` | GET | `get_run/${runId}` | [392](src/client.ts#L392) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [402](src/client.ts#L402) |
| `addRun` | POST | `add_run/${projectId}` | [415](src/client.ts#L415) |
| `updateRun` | POST | `update_run/${runId}` | [425](src/client.ts#L425) |
| `closeRun` | POST | `close_run/${runId}` | [435](src/client.ts#L435) |
| `deleteRun` | POST | `delete_run/${runId}` | [445](src/client.ts#L445) |
| `getTest` | GET | `get_test/${testId}` | [457](src/client.ts#L457) |
| `getTests` | GET | `get_tests/${runId}&...` | [467](src/client.ts#L467) |
| `getResults` | GET | `get_results/${testId}&...` | [482](src/client.ts#L482) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [495](src/client.ts#L495) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [507](src/client.ts#L507) |
| `addResult` | POST | `add_result/${testId}` | [520](src/client.ts#L520) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [530](src/client.ts#L530) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [541](src/client.ts#L541) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [553](src/client.ts#L553) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [563](src/client.ts#L563) |
| `getUser` | GET | `get_user/${userId}` | [578](src/client.ts#L578) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [588](src/client.ts#L588) |
| `getUsers` | GET | `get_users&...` | [603](src/client.ts#L603) |
| `getStatuses` | GET | `get_statuses` | [616](src/client.ts#L616) |
| `getPriorities` | GET | `get_priorities` | [626](src/client.ts#L626) |

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
| `AddSectionPayload` | [372](src/types.ts#L372) |
| `UpdateSectionPayload` | [379](src/types.ts#L379) |
| `CacheEntry` | [384](src/types.ts#L384) |
| `RateLimiterConfig` | [389](src/types.ts#L389) |
| `AddProjectPayload` | [394](src/types.ts#L394) |
| `UpdateProjectPayload` | [401](src/types.ts#L401) |
