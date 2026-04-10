# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [58](src/client.ts#L58) |
| `getProjects` | GET | `get_projects&...` | [68](src/client.ts#L68) |
| `addProject` | POST | `add_project` | [79](src/client.ts#L79) |
| `updateProject` | POST | `update_project/${projectId}` | [88](src/client.ts#L88) |
| `deleteProject` | POST | `delete_project/${projectId}` | [98](src/client.ts#L98) |
| `getSuite` | GET | `get_suite/${suiteId}` | [110](src/client.ts#L110) |
| `getSuites` | GET | `get_suites/${projectId}` | [120](src/client.ts#L120) |
| `addSuite` | POST | `add_suite/${projectId}` | [130](src/client.ts#L130) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [140](src/client.ts#L140) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [150](src/client.ts#L150) |
| `getSection` | GET | `get_section/${sectionId}` | [162](src/client.ts#L162) |
| `getSections` | GET | `get_sections/${projectId}&...` | [175](src/client.ts#L175) |
| `addSection` | POST | `add_section/${projectId}` | [195](src/client.ts#L195) |
| `updateSection` | POST | `update_section/${sectionId}` | [205](src/client.ts#L205) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [215](src/client.ts#L215) |
| `getCase` | GET | `get_case/${caseId}` | [227](src/client.ts#L227) |
| `getCases` | GET | `get_cases/${projectId}&...` | [241](src/client.ts#L241) |
| `addCase` | POST | `add_case/${sectionId}` | [269](src/client.ts#L269) |
| `updateCase` | POST | `update_case/${caseId}` | [279](src/client.ts#L279) |
| `deleteCase` | POST | `delete_case/${caseId}` | [289](src/client.ts#L289) |
| `getPlan` | GET | `get_plan/${planId}` | [301](src/client.ts#L301) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [314](src/client.ts#L314) |
| `addPlan` | POST | `add_plan/${projectId}` | [335](src/client.ts#L335) |
| `updatePlan` | POST | `update_plan/${planId}` | [345](src/client.ts#L345) |
| `closePlan` | POST | `close_plan/${planId}` | [355](src/client.ts#L355) |
| `deletePlan` | POST | `delete_plan/${planId}` | [365](src/client.ts#L365) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [375](src/client.ts#L375) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [385](src/client.ts#L385) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [396](src/client.ts#L396) |
| `getRun` | GET | `get_run/${runId}` | [409](src/client.ts#L409) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [419](src/client.ts#L419) |
| `addRun` | POST | `add_run/${projectId}` | [432](src/client.ts#L432) |
| `updateRun` | POST | `update_run/${runId}` | [442](src/client.ts#L442) |
| `closeRun` | POST | `close_run/${runId}` | [452](src/client.ts#L452) |
| `deleteRun` | POST | `delete_run/${runId}` | [462](src/client.ts#L462) |
| `getTest` | GET | `get_test/${testId}` | [474](src/client.ts#L474) |
| `getTests` | GET | `get_tests/${runId}&...` | [486](src/client.ts#L486) |
| `getResults` | GET | `get_results/${testId}&...` | [508](src/client.ts#L508) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}&...` | [532](src/client.ts#L532) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [556](src/client.ts#L556) |
| `addResult` | POST | `add_result/${testId}` | [576](src/client.ts#L576) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [586](src/client.ts#L586) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [597](src/client.ts#L597) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [609](src/client.ts#L609) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [621](src/client.ts#L621) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [638](src/client.ts#L638) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [648](src/client.ts#L648) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [658](src/client.ts#L658) |
| `getUser` | GET | `get_user/${userId}` | [670](src/client.ts#L670) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [680](src/client.ts#L680) |
| `getUsers` | GET | `get_users&...` | [695](src/client.ts#L695) |
| `getStatuses` | GET | `get_statuses` | [708](src/client.ts#L708) |
| `getPriorities` | GET | `get_priorities` | [718](src/client.ts#L718) |

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
| `CacheEntry` | [408](src/types.ts#L408) |
| `RateLimiterConfig` | [413](src/types.ts#L413) |
| `AddProjectPayload` | [418](src/types.ts#L418) |
| `UpdateProjectPayload` | [425](src/types.ts#L425) |
| `GetPlansOptions` | [436](src/types.ts#L436) |
| `GetTestsOptions` | [456](src/types.ts#L456) |
| `GetResultsOptions` | [469](src/types.ts#L469) |
| `GetMilestonesOptions` | [487](src/types.ts#L487) |
