# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [41](src/client.ts#L41) |
| `getProjects` | GET | `get_projects` | [50](src/client.ts#L50) |
| `getSuite` | GET | `get_suite/${suiteId}` | [62](src/client.ts#L62) |
| `getSuites` | GET | `get_suites/${projectId}` | [72](src/client.ts#L72) |
| `getSection` | GET | `get_section/${sectionId}` | [84](src/client.ts#L84) |
| `getSections` | GET | `get_sections/${projectId}&...` | [95](src/client.ts#L95) |
| `getCase` | GET | `get_case/${caseId}` | [112](src/client.ts#L112) |
| `getCases` | GET | `get_cases/${projectId}&...` | [124](src/client.ts#L124) |
| `addCase` | POST | `add_case/${sectionId}` | [145](src/client.ts#L145) |
| `updateCase` | POST | `update_case/${caseId}` | [155](src/client.ts#L155) |
| `deleteCase` | POST | `delete_case/${caseId}` | [165](src/client.ts#L165) |
| `getPlan` | GET | `get_plan/${planId}` | [177](src/client.ts#L177) |
| `getPlans` | GET | `get_plans/${projectId}` | [187](src/client.ts#L187) |
| `addPlan` | POST | `add_plan/${projectId}` | [198](src/client.ts#L198) |
| `closePlan` | POST | `close_plan/${planId}` | [208](src/client.ts#L208) |
| `deletePlan` | POST | `delete_plan/${planId}` | [218](src/client.ts#L218) |
| `getRun` | GET | `get_run/${runId}` | [230](src/client.ts#L230) |
| `getRuns` | GET | `get_runs/${projectId}` | [240](src/client.ts#L240) |
| `addRun` | POST | `add_run/${projectId}` | [251](src/client.ts#L251) |
| `closeRun` | POST | `close_run/${runId}` | [261](src/client.ts#L261) |
| `deleteRun` | POST | `delete_run/${runId}` | [271](src/client.ts#L271) |
| `getTest` | GET | `get_test/${testId}` | [283](src/client.ts#L283) |
| `getTests` | GET | `get_tests/${runId}` | [293](src/client.ts#L293) |
| `getResults` | GET | `get_results/${testId}` | [306](src/client.ts#L306) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [317](src/client.ts#L317) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}` | [329](src/client.ts#L329) |
| `addResult` | POST | `add_result/${testId}` | [340](src/client.ts#L340) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [350](src/client.ts#L350) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [361](src/client.ts#L361) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [373](src/client.ts#L373) |
| `getMilestones` | GET | `get_milestones/${projectId}` | [383](src/client.ts#L383) |
| `getUser` | GET | `get_user/${userId}` | [396](src/client.ts#L396) |
| `getUserByEmail` | ? | `?` | [406](src/client.ts#L406) |
| `getUsers` | GET | `get_users` | [419](src/client.ts#L419) |
| `getStatuses` | GET | `get_statuses` | [430](src/client.ts#L430) |
| `getPriorities` | GET | `get_priorities` | [440](src/client.ts#L440) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [62](src/client-core.ts#L62) |
| `validateId` | [205](src/client-core.ts#L205) |
| `buildEndpoint` | [216](src/client-core.ts#L216) |
| `clearCache` | [269](src/client-core.ts#L269) |
| `destroy` | [314](src/client-core.ts#L314) |
| `request` | [338](src/client-core.ts#L338) |

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
