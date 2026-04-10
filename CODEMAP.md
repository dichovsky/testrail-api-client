# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [43](src/client.ts#L43) |
| `getProjects` | GET | `get_projects` | [52](src/client.ts#L52) |
| `addProject` | POST | `add_project` | [61](src/client.ts#L61) |
| `updateProject` | POST | `update_project/${projectId}` | [70](src/client.ts#L70) |
| `deleteProject` | POST | `delete_project/${projectId}` | [80](src/client.ts#L80) |
| `getSuite` | GET | `get_suite/${suiteId}` | [92](src/client.ts#L92) |
| `getSuites` | GET | `get_suites/${projectId}` | [102](src/client.ts#L102) |
| `getSection` | GET | `get_section/${sectionId}` | [114](src/client.ts#L114) |
| `getSections` | GET | `get_sections/${projectId}&...` | [125](src/client.ts#L125) |
| `getCase` | GET | `get_case/${caseId}` | [142](src/client.ts#L142) |
| `getCases` | GET | `get_cases/${projectId}&...` | [154](src/client.ts#L154) |
| `addCase` | POST | `add_case/${sectionId}` | [175](src/client.ts#L175) |
| `updateCase` | POST | `update_case/${caseId}` | [185](src/client.ts#L185) |
| `deleteCase` | POST | `delete_case/${caseId}` | [195](src/client.ts#L195) |
| `getPlan` | GET | `get_plan/${planId}` | [207](src/client.ts#L207) |
| `getPlans` | GET | `get_plans/${projectId}` | [217](src/client.ts#L217) |
| `addPlan` | POST | `add_plan/${projectId}` | [228](src/client.ts#L228) |
| `closePlan` | POST | `close_plan/${planId}` | [238](src/client.ts#L238) |
| `deletePlan` | POST | `delete_plan/${planId}` | [248](src/client.ts#L248) |
| `getRun` | GET | `get_run/${runId}` | [260](src/client.ts#L260) |
| `getRuns` | GET | `get_runs/${projectId}` | [270](src/client.ts#L270) |
| `addRun` | POST | `add_run/${projectId}` | [281](src/client.ts#L281) |
| `closeRun` | POST | `close_run/${runId}` | [291](src/client.ts#L291) |
| `deleteRun` | POST | `delete_run/${runId}` | [301](src/client.ts#L301) |
| `getTest` | GET | `get_test/${testId}` | [313](src/client.ts#L313) |
| `getTests` | GET | `get_tests/${runId}` | [323](src/client.ts#L323) |
| `getResults` | GET | `get_results/${testId}` | [336](src/client.ts#L336) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [347](src/client.ts#L347) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}` | [359](src/client.ts#L359) |
| `addResult` | POST | `add_result/${testId}` | [370](src/client.ts#L370) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [380](src/client.ts#L380) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [391](src/client.ts#L391) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [403](src/client.ts#L403) |
| `getMilestones` | GET | `get_milestones/${projectId}` | [413](src/client.ts#L413) |
| `getUser` | GET | `get_user/${userId}` | [426](src/client.ts#L426) |
| `getUserByEmail` | ? | `?` | [436](src/client.ts#L436) |
| `getUsers` | GET | `get_users` | [449](src/client.ts#L449) |
| `getStatuses` | GET | `get_statuses` | [460](src/client.ts#L460) |
| `getPriorities` | GET | `get_priorities` | [470](src/client.ts#L470) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [62](src/client-core.ts#L62) |
| `validateId` | [177](src/client-core.ts#L177) |
| `buildEndpoint` | [188](src/client-core.ts#L188) |
| `clearCache` | [241](src/client-core.ts#L241) |
| `destroy` | [286](src/client-core.ts#L286) |
| `request` | [310](src/client-core.ts#L310) |

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
| `TestRailResponse` | [33](src/types.ts#L33) |
| `Case` | [38](src/types.ts#L38) |
| `Suite` | [59](src/types.ts#L59) |
| `Section` | [71](src/types.ts#L71) |
| `Project` | [81](src/types.ts#L81) |
| `Plan` | [93](src/types.ts#L93) |
| `PlanEntry` | [120](src/types.ts#L120) |
| `Run` | [132](src/types.ts#L132) |
| `Test` | [164](src/types.ts#L164) |
| `Result` | [181](src/types.ts#L181) |
| `Milestone` | [196](src/types.ts#L196) |
| `User` | [212](src/types.ts#L212) |
| `Status` | [221](src/types.ts#L221) |
| `Priority` | [233](src/types.ts#L233) |
| `AddCasePayload` | [241](src/types.ts#L241) |
| `UpdateCasePayload` | [252](src/types.ts#L252) |
| `AddPlanPayload` | [263](src/types.ts#L263) |
| `AddPlanEntryPayload` | [270](src/types.ts#L270) |
| `AddRunPayload` | [281](src/types.ts#L281) |
| `AddResultPayload` | [292](src/types.ts#L292) |
| `AddResultsForCasesPayload` | [303](src/types.ts#L303) |
| `AddResultForCasePayload` | [307](src/types.ts#L307) |
| `CacheEntry` | [311](src/types.ts#L311) |
| `RateLimiterConfig` | [316](src/types.ts#L316) |
| `AddProjectPayload` | [321](src/types.ts#L321) |
| `UpdateProjectPayload` | [328](src/types.ts#L328) |
