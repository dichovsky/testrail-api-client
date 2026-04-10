# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [59](src/client.ts#L59) |
| `getProjects` | GET | `get_projects&...` | [69](src/client.ts#L69) |
| `addProject` | POST | `add_project` | [80](src/client.ts#L80) |
| `updateProject` | POST | `update_project/${projectId}` | [89](src/client.ts#L89) |
| `deleteProject` | POST | `delete_project/${projectId}` | [99](src/client.ts#L99) |
| `getSuite` | GET | `get_suite/${suiteId}` | [111](src/client.ts#L111) |
| `getSuites` | GET | `get_suites/${projectId}` | [121](src/client.ts#L121) |
| `addSuite` | POST | `add_suite/${projectId}` | [131](src/client.ts#L131) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [141](src/client.ts#L141) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [151](src/client.ts#L151) |
| `getSection` | GET | `get_section/${sectionId}` | [163](src/client.ts#L163) |
| `getSections` | GET | `get_sections/${projectId}&...` | [176](src/client.ts#L176) |
| `addSection` | POST | `add_section/${projectId}` | [196](src/client.ts#L196) |
| `updateSection` | POST | `update_section/${sectionId}` | [206](src/client.ts#L206) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [216](src/client.ts#L216) |
| `getCase` | GET | `get_case/${caseId}` | [228](src/client.ts#L228) |
| `getCases` | GET | `get_cases/${projectId}&...` | [242](src/client.ts#L242) |
| `addCase` | POST | `add_case/${sectionId}` | [270](src/client.ts#L270) |
| `updateCase` | POST | `update_case/${caseId}` | [280](src/client.ts#L280) |
| `deleteCase` | POST | `delete_case/${caseId}` | [290](src/client.ts#L290) |
| `getPlan` | GET | `get_plan/${planId}` | [302](src/client.ts#L302) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [315](src/client.ts#L315) |
| `addPlan` | POST | `add_plan/${projectId}` | [336](src/client.ts#L336) |
| `updatePlan` | POST | `update_plan/${planId}` | [346](src/client.ts#L346) |
| `closePlan` | POST | `close_plan/${planId}` | [356](src/client.ts#L356) |
| `deletePlan` | POST | `delete_plan/${planId}` | [366](src/client.ts#L366) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [376](src/client.ts#L376) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [386](src/client.ts#L386) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [397](src/client.ts#L397) |
| `getRun` | GET | `get_run/${runId}` | [410](src/client.ts#L410) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [420](src/client.ts#L420) |
| `addRun` | POST | `add_run/${projectId}` | [433](src/client.ts#L433) |
| `updateRun` | POST | `update_run/${runId}` | [443](src/client.ts#L443) |
| `closeRun` | POST | `close_run/${runId}` | [453](src/client.ts#L453) |
| `deleteRun` | POST | `delete_run/${runId}` | [463](src/client.ts#L463) |
| `getTest` | GET | `get_test/${testId}` | [475](src/client.ts#L475) |
| `getTests` | GET | `get_tests/${runId}&...` | [487](src/client.ts#L487) |
| `getResults` | GET | `get_results/${testId}&...` | [509](src/client.ts#L509) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}&...` | [533](src/client.ts#L533) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [557](src/client.ts#L557) |
| `addResult` | POST | `add_result/${testId}` | [577](src/client.ts#L577) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [587](src/client.ts#L587) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [598](src/client.ts#L598) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [610](src/client.ts#L610) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [622](src/client.ts#L622) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [639](src/client.ts#L639) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [649](src/client.ts#L649) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [659](src/client.ts#L659) |
| `getUser` | GET | `get_user/${userId}` | [671](src/client.ts#L671) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [681](src/client.ts#L681) |
| `getUsers` | GET | `get_users&...` | [696](src/client.ts#L696) |
| `getStatuses` | GET | `get_statuses` | [709](src/client.ts#L709) |
| `getPriorities` | GET | `get_priorities` | [719](src/client.ts#L719) |
| `getResultFields` | GET | `get_result_fields` | [729](src/client.ts#L729) |

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
| `ResultFieldConfig` | [408](src/types.ts#L408) |
| `ResultField` | [422](src/types.ts#L422) |
| `CacheEntry` | [441](src/types.ts#L441) |
| `RateLimiterConfig` | [446](src/types.ts#L446) |
| `AddProjectPayload` | [451](src/types.ts#L451) |
| `UpdateProjectPayload` | [458](src/types.ts#L458) |
| `GetPlansOptions` | [469](src/types.ts#L469) |
| `GetTestsOptions` | [489](src/types.ts#L489) |
| `GetResultsOptions` | [502](src/types.ts#L502) |
| `GetMilestonesOptions` | [520](src/types.ts#L520) |
