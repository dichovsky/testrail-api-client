# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [43](src/client.ts#L43) |
| `getProjects` | GET | `get_projects` | [52](src/client.ts#L52) |
| `getSuite` | GET | `get_suite/${suiteId}` | [64](src/client.ts#L64) |
| `getSuites` | GET | `get_suites/${projectId}` | [74](src/client.ts#L74) |
| `getSection` | GET | `get_section/${sectionId}` | [86](src/client.ts#L86) |
| `getSections` | GET | `get_sections/${projectId}&...` | [97](src/client.ts#L97) |
| `addSection` | POST | `add_section/${projectId}` | [112](src/client.ts#L112) |
| `updateSection` | POST | `update_section/${sectionId}` | [122](src/client.ts#L122) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [132](src/client.ts#L132) |
| `getCase` | GET | `get_case/${caseId}` | [144](src/client.ts#L144) |
| `getCases` | GET | `get_cases/${projectId}&...` | [156](src/client.ts#L156) |
| `addCase` | POST | `add_case/${sectionId}` | [177](src/client.ts#L177) |
| `updateCase` | POST | `update_case/${caseId}` | [187](src/client.ts#L187) |
| `deleteCase` | POST | `delete_case/${caseId}` | [197](src/client.ts#L197) |
| `getPlan` | GET | `get_plan/${planId}` | [209](src/client.ts#L209) |
| `getPlans` | GET | `get_plans/${projectId}` | [219](src/client.ts#L219) |
| `addPlan` | POST | `add_plan/${projectId}` | [230](src/client.ts#L230) |
| `closePlan` | POST | `close_plan/${planId}` | [240](src/client.ts#L240) |
| `deletePlan` | POST | `delete_plan/${planId}` | [250](src/client.ts#L250) |
| `getRun` | GET | `get_run/${runId}` | [262](src/client.ts#L262) |
| `getRuns` | GET | `get_runs/${projectId}` | [272](src/client.ts#L272) |
| `addRun` | POST | `add_run/${projectId}` | [283](src/client.ts#L283) |
| `closeRun` | POST | `close_run/${runId}` | [293](src/client.ts#L293) |
| `deleteRun` | POST | `delete_run/${runId}` | [303](src/client.ts#L303) |
| `getTest` | GET | `get_test/${testId}` | [315](src/client.ts#L315) |
| `getTests` | GET | `get_tests/${runId}` | [325](src/client.ts#L325) |
| `getResults` | GET | `get_results/${testId}` | [338](src/client.ts#L338) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [349](src/client.ts#L349) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}` | [361](src/client.ts#L361) |
| `addResult` | POST | `add_result/${testId}` | [372](src/client.ts#L372) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [382](src/client.ts#L382) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [393](src/client.ts#L393) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [405](src/client.ts#L405) |
| `getMilestones` | GET | `get_milestones/${projectId}` | [415](src/client.ts#L415) |
| `getUser` | GET | `get_user/${userId}` | [428](src/client.ts#L428) |
| `getUserByEmail` | ? | `?` | [438](src/client.ts#L438) |
| `getUsers` | GET | `get_users` | [451](src/client.ts#L451) |
| `getStatuses` | GET | `get_statuses` | [462](src/client.ts#L462) |
| `getPriorities` | GET | `get_priorities` | [472](src/client.ts#L472) |

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
| `AddSectionPayload` | [321](src/types.ts#L321) |
| `UpdateSectionPayload` | [328](src/types.ts#L328) |
