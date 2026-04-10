# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method               | HTTP | Endpoint                                  | Line                      |
| -------------------- | ---- | ----------------------------------------- | ------------------------- |
| `getProject`         | GET  | `get_project/${projectId}`                | [55](src/client.ts#L55)   |
| `getProjects`        | GET  | `get_projects&...`                        | [65](src/client.ts#L65)   |
| `addProject`         | POST | `add_project`                             | [76](src/client.ts#L76)   |
| `updateProject`      | POST | `update_project/${projectId}`             | [85](src/client.ts#L85)   |
| `deleteProject`      | POST | `delete_project/${projectId}`             | [95](src/client.ts#L95)   |
| `getSuite`           | GET  | `get_suite/${suiteId}`                    | [107](src/client.ts#L107) |
| `getSuites`          | GET  | `get_suites/${projectId}`                 | [117](src/client.ts#L117) |
| `addSuite`           | POST | `add_suite/${projectId}`                  | [127](src/client.ts#L127) |
| `updateSuite`        | POST | `update_suite/${suiteId}`                 | [137](src/client.ts#L137) |
| `deleteSuite`        | POST | `delete_suite/${suiteId}`                 | [147](src/client.ts#L147) |
| `getSection`         | GET  | `get_section/${sectionId}`                | [159](src/client.ts#L159) |
| `getSections`        | GET  | `get_sections/${projectId}&...`           | [172](src/client.ts#L172) |
| `addSection`         | POST | `add_section/${projectId}`                | [192](src/client.ts#L192) |
| `updateSection`      | POST | `update_section/${sectionId}`             | [202](src/client.ts#L202) |
| `deleteSection`      | POST | `delete_section/${sectionId}`             | [212](src/client.ts#L212) |
| `getCase`            | GET  | `get_case/${caseId}`                      | [224](src/client.ts#L224) |
| `getCases`           | GET  | `get_cases/${projectId}&...`              | [238](src/client.ts#L238) |
| `addCase`            | POST | `add_case/${sectionId}`                   | [266](src/client.ts#L266) |
| `updateCase`         | POST | `update_case/${caseId}`                   | [276](src/client.ts#L276) |
| `deleteCase`         | POST | `delete_case/${caseId}`                   | [286](src/client.ts#L286) |
| `getPlan`            | GET  | `get_plan/${planId}`                      | [298](src/client.ts#L298) |
| `getPlans`           | GET  | `get_plans/${projectId}&...`              | [308](src/client.ts#L308) |
| `addPlan`            | POST | `add_plan/${projectId}`                   | [321](src/client.ts#L321) |
| `updatePlan`         | POST | `update_plan/${planId}`                   | [331](src/client.ts#L331) |
| `closePlan`          | POST | `close_plan/${planId}`                    | [341](src/client.ts#L341) |
| `deletePlan`         | POST | `delete_plan/${planId}`                   | [351](src/client.ts#L351) |
| `addPlanEntry`       | POST | `add_plan_entry/${planId}`                | [361](src/client.ts#L361) |
| `updatePlanEntry`    | POST | `update_plan_entry/${planId}/${entryId}`  | [371](src/client.ts#L371) |
| `deletePlanEntry`    | POST | `delete_plan_entry/${planId}/${entryId}`  | [382](src/client.ts#L382) |
| `getRun`             | GET  | `get_run/${runId}`                        | [395](src/client.ts#L395) |
| `getRuns`            | GET  | `get_runs/${projectId}&...`               | [408](src/client.ts#L408) |
| `addRun`             | POST | `add_run/${projectId}`                    | [442](src/client.ts#L442) |
| `updateRun`          | POST | `update_run/${runId}`                     | [452](src/client.ts#L452) |
| `closeRun`           | POST | `close_run/${runId}`                      | [462](src/client.ts#L462) |
| `deleteRun`          | POST | `delete_run/${runId}`                     | [472](src/client.ts#L472) |
| `getTest`            | GET  | `get_test/${testId}`                      | [484](src/client.ts#L484) |
| `getTests`           | GET  | `get_tests/${runId}&...`                  | [494](src/client.ts#L494) |
| `getResults`         | GET  | `get_results/${testId}&...`               | [509](src/client.ts#L509) |
| `getResultsForCase`  | GET  | `get_results_for_case/${runId}/${caseId}` | [522](src/client.ts#L522) |
| `getResultsForRun`   | GET  | `get_results_for_run/${runId}&...`        | [534](src/client.ts#L534) |
| `addResult`          | POST | `add_result/${testId}`                    | [547](src/client.ts#L547) |
| `addResultForCase`   | POST | `add_result_for_case/${runId}/${caseId}`  | [557](src/client.ts#L557) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}`          | [568](src/client.ts#L568) |
| `getMilestone`       | GET  | `get_milestone/${milestoneId}`            | [580](src/client.ts#L580) |
| `getMilestones`      | GET  | `get_milestones/${projectId}&...`         | [590](src/client.ts#L590) |
| `addMilestone`       | POST | `add_milestone/${projectId}`              | [603](src/client.ts#L603) |
| `updateMilestone`    | POST | `update_milestone/${milestoneId}`         | [613](src/client.ts#L613) |
| `deleteMilestone`    | POST | `delete_milestone/${milestoneId}`         | [623](src/client.ts#L623) |
| `getUser`            | GET  | `get_user/${userId}`                      | [635](src/client.ts#L635) |
| `getUserByEmail`     | GET  | `get_user_by_email&...`                   | [645](src/client.ts#L645) |
| `getUsers`           | GET  | `get_users&...`                           | [660](src/client.ts#L660) |
| `getStatuses`        | GET  | `get_statuses`                            | [673](src/client.ts#L673) |
| `getPriorities`      | GET  | `get_priorities`                          | [683](src/client.ts#L683) |

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
| `GetRunsOptions`            | [408](src/types.ts#L408) |
| `CacheEntry`                | [429](src/types.ts#L429) |
| `RateLimiterConfig`         | [434](src/types.ts#L434) |
| `AddProjectPayload`         | [439](src/types.ts#L439) |
| `UpdateProjectPayload`      | [446](src/types.ts#L446) |
