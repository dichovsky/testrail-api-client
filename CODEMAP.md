# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method               | HTTP | Endpoint                                  | Line                      |
| -------------------- | ---- | ----------------------------------------- | ------------------------- |
| `getProject`         | GET  | `get_project/${projectId}`                | [54](src/client.ts#L54)   |
| `getProjects`        | GET  | `get_projects&...`                        | [64](src/client.ts#L64)   |
| `addProject`         | POST | `add_project`                             | [75](src/client.ts#L75)   |
| `updateProject`      | POST | `update_project/${projectId}`             | [84](src/client.ts#L84)   |
| `deleteProject`      | POST | `delete_project/${projectId}`             | [94](src/client.ts#L94)   |
| `getSuite`           | GET  | `get_suite/${suiteId}`                    | [106](src/client.ts#L106) |
| `getSuites`          | GET  | `get_suites/${projectId}`                 | [116](src/client.ts#L116) |
| `addSuite`           | POST | `add_suite/${projectId}`                  | [126](src/client.ts#L126) |
| `updateSuite`        | POST | `update_suite/${suiteId}`                 | [136](src/client.ts#L136) |
| `deleteSuite`        | POST | `delete_suite/${suiteId}`                 | [146](src/client.ts#L146) |
| `getSection`         | GET  | `get_section/${sectionId}`                | [158](src/client.ts#L158) |
| `getSections`        | GET  | `get_sections/${projectId}&...`           | [171](src/client.ts#L171) |
| `addSection`         | POST | `add_section/${projectId}`                | [191](src/client.ts#L191) |
| `updateSection`      | POST | `update_section/${sectionId}`             | [201](src/client.ts#L201) |
| `deleteSection`      | POST | `delete_section/${sectionId}`             | [211](src/client.ts#L211) |
| `getCase`            | GET  | `get_case/${caseId}`                      | [223](src/client.ts#L223) |
| `getCases`           | GET  | `get_cases/${projectId}&...`              | [237](src/client.ts#L237) |
| `addCase`            | POST | `add_case/${sectionId}`                   | [265](src/client.ts#L265) |
| `updateCase`         | POST | `update_case/${caseId}`                   | [275](src/client.ts#L275) |
| `deleteCase`         | POST | `delete_case/${caseId}`                   | [285](src/client.ts#L285) |
| `getPlan`            | GET  | `get_plan/${planId}`                      | [297](src/client.ts#L297) |
| `getPlans`           | GET  | `get_plans/${projectId}&...`              | [307](src/client.ts#L307) |
| `addPlan`            | POST | `add_plan/${projectId}`                   | [320](src/client.ts#L320) |
| `updatePlan`         | POST | `update_plan/${planId}`                   | [330](src/client.ts#L330) |
| `closePlan`          | POST | `close_plan/${planId}`                    | [340](src/client.ts#L340) |
| `deletePlan`         | POST | `delete_plan/${planId}`                   | [350](src/client.ts#L350) |
| `addPlanEntry`       | POST | `add_plan_entry/${planId}`                | [360](src/client.ts#L360) |
| `updatePlanEntry`    | POST | `update_plan_entry/${planId}/${entryId}`  | [370](src/client.ts#L370) |
| `deletePlanEntry`    | POST | `delete_plan_entry/${planId}/${entryId}`  | [381](src/client.ts#L381) |
| `getRun`             | GET  | `get_run/${runId}`                        | [394](src/client.ts#L394) |
| `getRuns`            | GET  | `get_runs/${projectId}&...`               | [404](src/client.ts#L404) |
| `addRun`             | POST | `add_run/${projectId}`                    | [417](src/client.ts#L417) |
| `updateRun`          | POST | `update_run/${runId}`                     | [427](src/client.ts#L427) |
| `closeRun`           | POST | `close_run/${runId}`                      | [437](src/client.ts#L437) |
| `deleteRun`          | POST | `delete_run/${runId}`                     | [447](src/client.ts#L447) |
| `getTest`            | GET  | `get_test/${testId}`                      | [459](src/client.ts#L459) |
| `getTests`           | GET  | `get_tests/${runId}&...`                  | [469](src/client.ts#L469) |
| `getResults`         | GET  | `get_results/${testId}&...`               | [484](src/client.ts#L484) |
| `getResultsForCase`  | GET  | `get_results_for_case/${runId}/${caseId}` | [497](src/client.ts#L497) |
| `getResultsForRun`   | GET  | `get_results_for_run/${runId}&...`        | [509](src/client.ts#L509) |
| `addResult`          | POST | `add_result/${testId}`                    | [522](src/client.ts#L522) |
| `addResultForCase`   | POST | `add_result_for_case/${runId}/${caseId}`  | [532](src/client.ts#L532) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}`          | [543](src/client.ts#L543) |
| `getMilestone`       | GET  | `get_milestone/${milestoneId}`            | [555](src/client.ts#L555) |
| `getMilestones`      | GET  | `get_milestones/${projectId}&...`         | [565](src/client.ts#L565) |
| `addMilestone`       | POST | `add_milestone/${projectId}`              | [578](src/client.ts#L578) |
| `updateMilestone`    | POST | `update_milestone/${milestoneId}`         | [588](src/client.ts#L588) |
| `deleteMilestone`    | POST | `delete_milestone/${milestoneId}`         | [598](src/client.ts#L598) |
| `getUser`            | GET  | `get_user/${userId}`                      | [610](src/client.ts#L610) |
| `getUserByEmail`     | GET  | `get_user_by_email&...`                   | [620](src/client.ts#L620) |
| `getUsers`           | GET  | `get_users&...`                           | [635](src/client.ts#L635) |
| `getStatuses`        | GET  | `get_statuses`                            | [648](src/client.ts#L648) |
| `getPriorities`      | GET  | `get_priorities`                          | [658](src/client.ts#L658) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol          | Line                           |
| --------------- | ------------------------------ |
| `constructor`   | [99](src/client-core.ts#L99)   |
| `validateId`    | [288](src/client-core.ts#L288) |
| `buildEndpoint` | [327](src/client-core.ts#L327) |
| `clearCache`    | [382](src/client-core.ts#L382) |
| `destroy`       | [427](src/client-core.ts#L427) |
| `request`       | [454](src/client-core.ts#L454) |

## Error Classes (`src/errors.ts`)

| Class                     | Line                    |
| ------------------------- | ----------------------- |
| `TestRailApiError`        | [8](src/errors.ts#L8)   |
| `TestRailValidationError` | [23](src/errors.ts#L23) |

## Constants (`src/constants.ts`)

| Constant                            | Value           | Line                       |
| ----------------------------------- | --------------- | -------------------------- |
| `BASE_RETRY_DELAY_MS`               | `1000`          | [2](src/constants.ts#L2)   |
| `MAX_RETRY_DELAY_MS`                | `10000`         | [3](src/constants.ts#L3)   |
| `MAX_TIMEOUT_MS`                    | `5 * 60 * 1000` | [6](src/constants.ts#L6)   |
| `DEFAULT_TIMEOUT_MS`                | `30000`         | [9](src/constants.ts#L9)   |
| `DEFAULT_MAX_RETRIES`               | `3`             | [10](src/constants.ts#L10) |
| `DEFAULT_CACHE_TTL_MS`              | `300000`        | [11](src/constants.ts#L11) |
| `DEFAULT_CACHE_CLEANUP_INTERVAL_MS` | `60000`         | [12](src/constants.ts#L12) |
| `DEFAULT_MAX_CACHE_SIZE`            | `1000`          | [13](src/constants.ts#L13) |
| `DEFAULT_RATE_LIMIT_MAX_REQUESTS`   | `100`           | [14](src/constants.ts#L14) |
| `DEFAULT_RATE_LIMIT_WINDOW_MS`      | `60000`         | [15](src/constants.ts#L15) |

## Types (`src/types.ts`)

| Type                        | Line                     |
| --------------------------- | ------------------------ |
| `TestRailConfig`            | [4](src/types.ts#L4)     |
| `TestRailResponse`          | [43](src/types.ts#L43)   |
| `PaginatedResponse`         | [48](src/types.ts#L48)   |
| `Case`                      | [61](src/types.ts#L61)   |
| `Suite`                     | [82](src/types.ts#L82)   |
| `AddSuitePayload`           | [94](src/types.ts#L94)   |
| `UpdateSuitePayload`        | [99](src/types.ts#L99)   |
| `Section`                   | [104](src/types.ts#L104) |
| `Project`                   | [114](src/types.ts#L114) |
| `Plan`                      | [126](src/types.ts#L126) |
| `PlanEntry`                 | [153](src/types.ts#L153) |
| `Run`                       | [165](src/types.ts#L165) |
| `Test`                      | [197](src/types.ts#L197) |
| `Result`                    | [214](src/types.ts#L214) |
| `Milestone`                 | [229](src/types.ts#L229) |
| `User`                      | [245](src/types.ts#L245) |
| `Status`                    | [254](src/types.ts#L254) |
| `Priority`                  | [266](src/types.ts#L266) |
| `AddCasePayload`            | [274](src/types.ts#L274) |
| `UpdateCasePayload`         | [285](src/types.ts#L285) |
| `AddPlanPayload`            | [296](src/types.ts#L296) |
| `UpdatePlanPayload`         | [303](src/types.ts#L303) |
| `AddPlanEntryPayload`       | [310](src/types.ts#L310) |
| `UpdatePlanEntryPayload`    | [321](src/types.ts#L321) |
| `AddRunPayload`             | [332](src/types.ts#L332) |
| `UpdateRunPayload`          | [343](src/types.ts#L343) |
| `AddResultPayload`          | [353](src/types.ts#L353) |
| `AddResultsForCasesPayload` | [364](src/types.ts#L364) |
| `AddResultForCasePayload`   | [368](src/types.ts#L368) |
| `AddSectionPayload`         | [372](src/types.ts#L372) |
| `UpdateSectionPayload`      | [379](src/types.ts#L379) |
| `AddMilestonePayload`       | [384](src/types.ts#L384) |
| `UpdateMilestonePayload`    | [395](src/types.ts#L395) |
| `CacheEntry`                | [408](src/types.ts#L408) |
| `RateLimiterConfig`         | [413](src/types.ts#L413) |
| `AddProjectPayload`         | [418](src/types.ts#L418) |
| `UpdateProjectPayload`      | [425](src/types.ts#L425) |
