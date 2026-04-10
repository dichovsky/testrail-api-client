# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [69](src/client.ts#L69) |
| `getProjects` | GET | `get_projects&...` | [79](src/client.ts#L79) |
| `addProject` | POST | `add_project` | [90](src/client.ts#L90) |
| `updateProject` | POST | `update_project/${projectId}` | [99](src/client.ts#L99) |
| `deleteProject` | POST | `delete_project/${projectId}` | [109](src/client.ts#L109) |
| `getSuite` | GET | `get_suite/${suiteId}` | [121](src/client.ts#L121) |
| `getSuites` | GET | `get_suites/${projectId}` | [131](src/client.ts#L131) |
| `addSuite` | POST | `add_suite/${projectId}` | [141](src/client.ts#L141) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [151](src/client.ts#L151) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [161](src/client.ts#L161) |
| `getSection` | GET | `get_section/${sectionId}` | [173](src/client.ts#L173) |
| `getSections` | GET | `get_sections/${projectId}&...` | [186](src/client.ts#L186) |
| `addSection` | POST | `add_section/${projectId}` | [206](src/client.ts#L206) |
| `updateSection` | POST | `update_section/${sectionId}` | [216](src/client.ts#L216) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [226](src/client.ts#L226) |
| `getCase` | GET | `get_case/${caseId}` | [238](src/client.ts#L238) |
| `getCases` | GET | `get_cases/${projectId}&...` | [252](src/client.ts#L252) |
| `addCase` | POST | `add_case/${sectionId}` | [280](src/client.ts#L280) |
| `updateCase` | POST | `update_case/${caseId}` | [290](src/client.ts#L290) |
| `deleteCase` | POST | `delete_case/${caseId}` | [300](src/client.ts#L300) |
| `getPlan` | GET | `get_plan/${planId}` | [312](src/client.ts#L312) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [325](src/client.ts#L325) |
| `addPlan` | POST | `add_plan/${projectId}` | [346](src/client.ts#L346) |
| `updatePlan` | POST | `update_plan/${planId}` | [356](src/client.ts#L356) |
| `closePlan` | POST | `close_plan/${planId}` | [366](src/client.ts#L366) |
| `deletePlan` | POST | `delete_plan/${planId}` | [376](src/client.ts#L376) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [386](src/client.ts#L386) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [396](src/client.ts#L396) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [407](src/client.ts#L407) |
| `getRun` | GET | `get_run/${runId}` | [420](src/client.ts#L420) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [433](src/client.ts#L433) |
| `addRun` | POST | `add_run/${projectId}` | [468](src/client.ts#L468) |
| `updateRun` | POST | `update_run/${runId}` | [478](src/client.ts#L478) |
| `closeRun` | POST | `close_run/${runId}` | [488](src/client.ts#L488) |
| `deleteRun` | POST | `delete_run/${runId}` | [498](src/client.ts#L498) |
| `getTest` | GET | `get_test/${testId}` | [510](src/client.ts#L510) |
| `getTests` | GET | `get_tests/${runId}&...` | [522](src/client.ts#L522) |
| `getResults` | GET | `get_results/${testId}&...` | [544](src/client.ts#L544) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}&...` | [568](src/client.ts#L568) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [592](src/client.ts#L592) |
| `addResult` | POST | `add_result/${testId}` | [612](src/client.ts#L612) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [622](src/client.ts#L622) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [633](src/client.ts#L633) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [645](src/client.ts#L645) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [657](src/client.ts#L657) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [674](src/client.ts#L674) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [684](src/client.ts#L684) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [694](src/client.ts#L694) |
| `getUser` | GET | `get_user/${userId}` | [706](src/client.ts#L706) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [716](src/client.ts#L716) |
| `getUsers` | GET | `get_current_user` | [734](src/client.ts#L734) |
| `getCurrentUser` | GET | `get_current_user` | [751](src/client.ts#L751) |
| `getStatuses` | GET | `get_statuses` | [761](src/client.ts#L761) |
| `getPriorities` | GET | `get_priorities` | [771](src/client.ts#L771) |
| `getResultFields` | GET | `get_result_fields` | [781](src/client.ts#L781) |
| `getCaseFields` | GET | `get_case_fields` | [791](src/client.ts#L791) |
| `getCaseTypes` | GET | `get_case_types` | [799](src/client.ts#L799) |
| `getTemplates` | GET | `get_templates/${projectId}` | [810](src/client.ts#L810) |
| `getConfigurations` | GET | `get_configs/${projectId}` | [822](src/client.ts#L822) |
| `addConfigurationGroup` | POST | `add_config_group/${projectId}` | [832](src/client.ts#L832) |
| `updateConfigurationGroup` | POST | `update_config_group/${configGroupId}` | [842](src/client.ts#L842) |
| `deleteConfigurationGroup` | POST | `delete_config_group/${configGroupId}` | [855](src/client.ts#L855) |
| `addConfiguration` | POST | `add_config/${configGroupId}` | [865](src/client.ts#L865) |
| `updateConfiguration` | POST | `update_config/${configId}` | [875](src/client.ts#L875) |
| `deleteConfiguration` | POST | `delete_config/${configId}` | [885](src/client.ts#L885) |

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
| `GetPlansOptions` | [580](src/types.ts#L580) |
| `GetTestsOptions` | [600](src/types.ts#L600) |
| `GetResultsOptions` | [613](src/types.ts#L613) |
| `GetMilestonesOptions` | [631](src/types.ts#L631) |
