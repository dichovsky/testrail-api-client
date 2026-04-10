# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [50](src/client.ts#L50) |
| `getProjects` | GET | `get_projects&...` | [60](src/client.ts#L60) |
| `getSuite` | GET | `get_suite/${suiteId}` | [74](src/client.ts#L74) |
| `getSuites` | GET | `get_suites/${projectId}` | [84](src/client.ts#L84) |
| `addSuite` | POST | `add_suite/${projectId}` | [94](src/client.ts#L94) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [104](src/client.ts#L104) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [114](src/client.ts#L114) |
| `getSection` | GET | `get_section/${sectionId}` | [126](src/client.ts#L126) |
| `getSections` | GET | `get_sections/${projectId}&...` | [139](src/client.ts#L139) |
| `addSection` | POST | `add_section/${projectId}` | [159](src/client.ts#L159) |
| `updateSection` | POST | `update_section/${sectionId}` | [169](src/client.ts#L169) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [179](src/client.ts#L179) |
| `getCase` | GET | `get_case/${caseId}` | [191](src/client.ts#L191) |
| `getCases` | GET | `get_cases/${projectId}&...` | [205](src/client.ts#L205) |
| `addCase` | POST | `add_case/${sectionId}` | [233](src/client.ts#L233) |
| `updateCase` | POST | `update_case/${caseId}` | [243](src/client.ts#L243) |
| `deleteCase` | POST | `delete_case/${caseId}` | [253](src/client.ts#L253) |
| `getPlan` | GET | `get_plan/${planId}` | [265](src/client.ts#L265) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [275](src/client.ts#L275) |
| `addPlan` | POST | `add_plan/${projectId}` | [288](src/client.ts#L288) |
| `updatePlan` | POST | `update_plan/${planId}` | [298](src/client.ts#L298) |
| `closePlan` | POST | `close_plan/${planId}` | [308](src/client.ts#L308) |
| `deletePlan` | POST | `delete_plan/${planId}` | [318](src/client.ts#L318) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [328](src/client.ts#L328) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [338](src/client.ts#L338) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [349](src/client.ts#L349) |
| `getRun` | GET | `get_run/${runId}` | [362](src/client.ts#L362) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [372](src/client.ts#L372) |
| `addRun` | POST | `add_run/${projectId}` | [385](src/client.ts#L385) |
| `updateRun` | POST | `update_run/${runId}` | [395](src/client.ts#L395) |
| `closeRun` | POST | `close_run/${runId}` | [405](src/client.ts#L405) |
| `deleteRun` | POST | `delete_run/${runId}` | [415](src/client.ts#L415) |
| `getTest` | GET | `get_test/${testId}` | [427](src/client.ts#L427) |
| `getTests` | GET | `get_tests/${runId}&...` | [437](src/client.ts#L437) |
| `getResults` | GET | `get_results/${testId}&...` | [452](src/client.ts#L452) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [465](src/client.ts#L465) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [477](src/client.ts#L477) |
| `addResult` | POST | `add_result/${testId}` | [490](src/client.ts#L490) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [500](src/client.ts#L500) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [511](src/client.ts#L511) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [523](src/client.ts#L523) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [533](src/client.ts#L533) |
| `getUser` | GET | `get_user/${userId}` | [548](src/client.ts#L548) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [558](src/client.ts#L558) |
| `getUsers` | GET | `get_users&...` | [573](src/client.ts#L573) |
| `getStatuses` | GET | `get_statuses` | [586](src/client.ts#L586) |
| `getPriorities` | GET | `get_priorities` | [596](src/client.ts#L596) |

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
