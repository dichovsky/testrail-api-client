# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [56](src/client.ts#L56) |
| `getProjects` | GET | `get_projects&...` | [66](src/client.ts#L66) |
| `addProject` | POST | `add_project` | [77](src/client.ts#L77) |
| `updateProject` | POST | `update_project/${projectId}` | [86](src/client.ts#L86) |
| `deleteProject` | POST | `delete_project/${projectId}` | [96](src/client.ts#L96) |
| `getSuite` | GET | `get_suite/${suiteId}` | [108](src/client.ts#L108) |
| `getSuites` | GET | `get_suites/${projectId}` | [118](src/client.ts#L118) |
| `addSuite` | POST | `add_suite/${projectId}` | [128](src/client.ts#L128) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [138](src/client.ts#L138) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [148](src/client.ts#L148) |
| `getSection` | GET | `get_section/${sectionId}` | [160](src/client.ts#L160) |
| `getSections` | GET | `get_sections/${projectId}&...` | [173](src/client.ts#L173) |
| `addSection` | POST | `add_section/${projectId}` | [193](src/client.ts#L193) |
| `updateSection` | POST | `update_section/${sectionId}` | [203](src/client.ts#L203) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [213](src/client.ts#L213) |
| `getCase` | GET | `get_case/${caseId}` | [225](src/client.ts#L225) |
| `getCases` | GET | `get_cases/${projectId}&...` | [239](src/client.ts#L239) |
| `addCase` | POST | `add_case/${sectionId}` | [267](src/client.ts#L267) |
| `updateCase` | POST | `update_case/${caseId}` | [277](src/client.ts#L277) |
| `deleteCase` | POST | `delete_case/${caseId}` | [287](src/client.ts#L287) |
| `getPlan` | GET | `get_plan/${planId}` | [299](src/client.ts#L299) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [309](src/client.ts#L309) |
| `addPlan` | POST | `add_plan/${projectId}` | [322](src/client.ts#L322) |
| `updatePlan` | POST | `update_plan/${planId}` | [332](src/client.ts#L332) |
| `closePlan` | POST | `close_plan/${planId}` | [342](src/client.ts#L342) |
| `deletePlan` | POST | `delete_plan/${planId}` | [352](src/client.ts#L352) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [362](src/client.ts#L362) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [372](src/client.ts#L372) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [383](src/client.ts#L383) |
| `getRun` | GET | `get_run/${runId}` | [396](src/client.ts#L396) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [409](src/client.ts#L409) |
| `addRun` | POST | `add_run/${projectId}` | [444](src/client.ts#L444) |
| `updateRun` | POST | `update_run/${runId}` | [454](src/client.ts#L454) |
| `closeRun` | POST | `close_run/${runId}` | [464](src/client.ts#L464) |
| `deleteRun` | POST | `delete_run/${runId}` | [474](src/client.ts#L474) |
| `getTest` | GET | `get_test/${testId}` | [486](src/client.ts#L486) |
| `getTests` | GET | `get_tests/${runId}&...` | [496](src/client.ts#L496) |
| `getResults` | GET | `get_results/${testId}&...` | [511](src/client.ts#L511) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [524](src/client.ts#L524) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [536](src/client.ts#L536) |
| `addResult` | POST | `add_result/${testId}` | [549](src/client.ts#L549) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [559](src/client.ts#L559) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [570](src/client.ts#L570) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [582](src/client.ts#L582) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [592](src/client.ts#L592) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [605](src/client.ts#L605) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [615](src/client.ts#L615) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [625](src/client.ts#L625) |
| `getUser` | GET | `get_user/${userId}` | [637](src/client.ts#L637) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [647](src/client.ts#L647) |
| `getUsers` | GET | `get_users&...` | [662](src/client.ts#L662) |
| `getStatuses` | GET | `get_statuses` | [675](src/client.ts#L675) |
| `getPriorities` | GET | `get_priorities` | [685](src/client.ts#L685) |
| `getResultFields` | GET | `get_result_fields` | [695](src/client.ts#L695) |

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
