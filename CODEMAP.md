# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [65](src/client.ts#L65) |
| `getProjects` | GET | `get_projects&...` | [75](src/client.ts#L75) |
| `addProject` | POST | `add_project` | [86](src/client.ts#L86) |
| `updateProject` | POST | `update_project/${projectId}` | [95](src/client.ts#L95) |
| `deleteProject` | POST | `delete_project/${projectId}` | [105](src/client.ts#L105) |
| `getSuite` | GET | `get_suite/${suiteId}` | [117](src/client.ts#L117) |
| `getSuites` | GET | `get_suites/${projectId}` | [127](src/client.ts#L127) |
| `addSuite` | POST | `add_suite/${projectId}` | [137](src/client.ts#L137) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [147](src/client.ts#L147) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [157](src/client.ts#L157) |
| `getSection` | GET | `get_section/${sectionId}` | [169](src/client.ts#L169) |
| `getSections` | GET | `get_sections/${projectId}&...` | [182](src/client.ts#L182) |
| `addSection` | POST | `add_section/${projectId}` | [202](src/client.ts#L202) |
| `updateSection` | POST | `update_section/${sectionId}` | [212](src/client.ts#L212) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [222](src/client.ts#L222) |
| `getCase` | GET | `get_case/${caseId}` | [234](src/client.ts#L234) |
| `getCases` | GET | `get_cases/${projectId}&...` | [248](src/client.ts#L248) |
| `addCase` | POST | `add_case/${sectionId}` | [276](src/client.ts#L276) |
| `updateCase` | POST | `update_case/${caseId}` | [286](src/client.ts#L286) |
| `deleteCase` | POST | `delete_case/${caseId}` | [296](src/client.ts#L296) |
| `getPlan` | GET | `get_plan/${planId}` | [308](src/client.ts#L308) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [318](src/client.ts#L318) |
| `addPlan` | POST | `add_plan/${projectId}` | [331](src/client.ts#L331) |
| `updatePlan` | POST | `update_plan/${planId}` | [341](src/client.ts#L341) |
| `closePlan` | POST | `close_plan/${planId}` | [351](src/client.ts#L351) |
| `deletePlan` | POST | `delete_plan/${planId}` | [361](src/client.ts#L361) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [371](src/client.ts#L371) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [381](src/client.ts#L381) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [392](src/client.ts#L392) |
| `getRun` | GET | `get_run/${runId}` | [405](src/client.ts#L405) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [418](src/client.ts#L418) |
| `addRun` | POST | `add_run/${projectId}` | [453](src/client.ts#L453) |
| `updateRun` | POST | `update_run/${runId}` | [463](src/client.ts#L463) |
| `closeRun` | POST | `close_run/${runId}` | [473](src/client.ts#L473) |
| `deleteRun` | POST | `delete_run/${runId}` | [483](src/client.ts#L483) |
| `getTest` | GET | `get_test/${testId}` | [495](src/client.ts#L495) |
| `getTests` | GET | `get_tests/${runId}&...` | [505](src/client.ts#L505) |
| `getResults` | GET | `get_results/${testId}&...` | [520](src/client.ts#L520) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}` | [533](src/client.ts#L533) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [545](src/client.ts#L545) |
| `addResult` | POST | `add_result/${testId}` | [558](src/client.ts#L558) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [568](src/client.ts#L568) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [579](src/client.ts#L579) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [591](src/client.ts#L591) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [601](src/client.ts#L601) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [614](src/client.ts#L614) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [624](src/client.ts#L624) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [634](src/client.ts#L634) |
| `getUser` | GET | `get_user/${userId}` | [646](src/client.ts#L646) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [656](src/client.ts#L656) |
| `getUsers` | GET | `get_users` / `get_users/${projectId}&...` | [674](src/client.ts#L674) |
| `getCurrentUser` | GET | `get_current_user` | [691](src/client.ts#L691) |
| `getStatuses` | GET | `get_statuses` | [701](src/client.ts#L701) |
| `getPriorities` | GET | `get_priorities` | [711](src/client.ts#L711) |
| `getResultFields` | GET | `get_result_fields` | [721](src/client.ts#L721) |
| `getCaseFields` | GET | `get_case_fields` | [731](src/client.ts#L731) |
| `getCaseTypes` | GET | `get_case_types` | [739](src/client.ts#L739) |
| `getTemplates` | GET | `get_templates/${projectId}` | [750](src/client.ts#L750) |
| `getConfigurations` | GET | `get_configs/${projectId}` | [762](src/client.ts#L762) |
| `addConfigurationGroup` | POST | `add_config_group/${projectId}` | [772](src/client.ts#L772) |
| `updateConfigurationGroup` | POST | `update_config_group/${configGroupId}` | [782](src/client.ts#L782) |
| `deleteConfigurationGroup` | POST | `delete_config_group/${configGroupId}` | [795](src/client.ts#L795) |
| `addConfiguration` | POST | `add_config/${configGroupId}` | [805](src/client.ts#L805) |
| `updateConfiguration` | POST | `update_config/${configId}` | [815](src/client.ts#L815) |
| `deleteConfiguration` | POST | `delete_config/${configId}` | [825](src/client.ts#L825) |

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
| `CaseFieldConfig` | [465](src/types.ts#L465) |
| `CaseField` | [480](src/types.ts#L480) |
| `CaseType` | [500](src/types.ts#L500) |
| `Template` | [509](src/types.ts#L509) |
| `Configuration` | [518](src/types.ts#L518) |
| `ConfigurationGroup` | [525](src/types.ts#L525) |
| `AddConfigurationGroupPayload` | [532](src/types.ts#L532) |
| `UpdateConfigurationGroupPayload` | [537](src/types.ts#L537) |
| `AddConfigurationPayload` | [542](src/types.ts#L542) |
| `UpdateConfigurationPayload` | [547](src/types.ts#L547) |
| `CacheEntry` | [552](src/types.ts#L552) |
| `RateLimiterConfig` | [557](src/types.ts#L557) |
| `AddProjectPayload` | [562](src/types.ts#L562) |
| `UpdateProjectPayload` | [569](src/types.ts#L569) |
