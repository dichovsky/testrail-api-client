# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [64](src/client.ts#L64) |
| `getProjects` | GET | `get_projects&...` | [74](src/client.ts#L74) |
| `addProject` | POST | `add_project` | [85](src/client.ts#L85) |
| `updateProject` | POST | `update_project/${projectId}` | [94](src/client.ts#L94) |
| `deleteProject` | POST | `delete_project/${projectId}` | [104](src/client.ts#L104) |
| `getSuite` | GET | `get_suite/${suiteId}` | [116](src/client.ts#L116) |
| `getSuites` | GET | `get_suites/${projectId}` | [126](src/client.ts#L126) |
| `addSuite` | POST | `add_suite/${projectId}` | [136](src/client.ts#L136) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [146](src/client.ts#L146) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [156](src/client.ts#L156) |
| `getSection` | GET | `get_section/${sectionId}` | [168](src/client.ts#L168) |
| `getSections` | GET | `get_sections/${projectId}&...` | [181](src/client.ts#L181) |
| `addSection` | POST | `add_section/${projectId}` | [201](src/client.ts#L201) |
| `updateSection` | POST | `update_section/${sectionId}` | [211](src/client.ts#L211) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [221](src/client.ts#L221) |
| `getCase` | GET | `get_case/${caseId}` | [233](src/client.ts#L233) |
| `getCases` | GET | `get_cases/${projectId}&...` | [247](src/client.ts#L247) |
| `addCase` | POST | `add_case/${sectionId}` | [275](src/client.ts#L275) |
| `updateCase` | POST | `update_case/${caseId}` | [285](src/client.ts#L285) |
| `deleteCase` | POST | `delete_case/${caseId}` | [295](src/client.ts#L295) |
| `getPlan` | GET | `get_plan/${planId}` | [307](src/client.ts#L307) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [317](src/client.ts#L317) |
| `addPlan` | POST | `add_plan/${projectId}` | [330](src/client.ts#L330) |
| `updatePlan` | POST | `update_plan/${planId}` | [340](src/client.ts#L340) |
| `closePlan` | POST | `close_plan/${planId}` | [350](src/client.ts#L350) |
| `deletePlan` | POST | `delete_plan/${planId}` | [360](src/client.ts#L360) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [370](src/client.ts#L370) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [380](src/client.ts#L380) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [391](src/client.ts#L391) |
| `getRun` | GET | `get_run/${runId}` | [404](src/client.ts#L404) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [414](src/client.ts#L414) |
| `addRun` | POST | `add_run/${projectId}` | [427](src/client.ts#L427) |
| `updateRun` | POST | `update_run/${runId}` | [437](src/client.ts#L437) |
| `closeRun` | POST | `close_run/${runId}` | [447](src/client.ts#L447) |
| `deleteRun` | POST | `delete_run/${runId}` | [457](src/client.ts#L457) |
| `getTest` | GET | `get_test/${testId}` | [469](src/client.ts#L469) |
| `getTests` | GET | `get_tests/${runId}&...` | [479](src/client.ts#L479) |
| `getResults` | GET | `get_results/${testId}&...` | [494](src/client.ts#L494) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [507](src/client.ts#L507) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [519](src/client.ts#L519) |
| `addResult` | POST | `add_result/${testId}` | [532](src/client.ts#L532) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [542](src/client.ts#L542) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [553](src/client.ts#L553) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [565](src/client.ts#L565) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [575](src/client.ts#L575) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [588](src/client.ts#L588) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [598](src/client.ts#L598) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [608](src/client.ts#L608) |
| `getUser` | GET | `get_user/${userId}` | [620](src/client.ts#L620) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [630](src/client.ts#L630) |
| `getUsers` | GET | `get_users/${projectId}` | [646](src/client.ts#L646) |
| `getCurrentUser` | GET | `get_current_user` | [660](src/client.ts#L660) |
| `getStatuses` | GET | `get_statuses` | [670](src/client.ts#L670) |
| `getPriorities` | GET | `get_priorities` | [680](src/client.ts#L680) |
| `getResultFields` | GET | `get_result_fields` | [690](src/client.ts#L690) |
| `getCaseFields` | GET | `get_case_fields` | [700](src/client.ts#L700) |
| `getCaseTypes` | GET | `get_case_types` | [708](src/client.ts#L708) |
| `getTemplates` | GET | `get_templates/${projectId}` | [719](src/client.ts#L719) |
| `getConfigurations` | GET | `get_configs/${projectId}` | [731](src/client.ts#L731) |
| `addConfigurationGroup` | POST | `add_config_group/${projectId}` | [741](src/client.ts#L741) |
| `updateConfigurationGroup` | POST | `update_config_group/${configGroupId}` | [754](src/client.ts#L754) |
| `deleteConfigurationGroup` | POST | `delete_config_group/${configGroupId}` | [767](src/client.ts#L767) |
| `addConfiguration` | POST | `add_config/${configGroupId}` | [777](src/client.ts#L777) |
| `updateConfiguration` | POST | `update_config/${configId}` | [787](src/client.ts#L787) |
| `deleteConfiguration` | POST | `delete_config/${configId}` | [797](src/client.ts#L797) |

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
| `CaseFieldConfig` | [444](src/types.ts#L444) |
| `CaseField` | [459](src/types.ts#L459) |
| `CaseType` | [479](src/types.ts#L479) |
| `Template` | [488](src/types.ts#L488) |
| `Configuration` | [497](src/types.ts#L497) |
| `ConfigurationGroup` | [504](src/types.ts#L504) |
| `AddConfigurationGroupPayload` | [511](src/types.ts#L511) |
| `UpdateConfigurationGroupPayload` | [516](src/types.ts#L516) |
| `AddConfigurationPayload` | [521](src/types.ts#L521) |
| `UpdateConfigurationPayload` | [526](src/types.ts#L526) |
| `CacheEntry` | [531](src/types.ts#L531) |
| `RateLimiterConfig` | [536](src/types.ts#L536) |
| `AddProjectPayload` | [541](src/types.ts#L541) |
| `UpdateProjectPayload` | [548](src/types.ts#L548) |
