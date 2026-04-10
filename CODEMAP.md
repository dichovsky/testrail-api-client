# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method | HTTP | Endpoint | Line |
|--------|------|----------|------|
| `getProject` | GET | `get_project/${projectId}` | [88](src/client.ts#L88) |
| `getProjects` | GET | `get_projects&...` | [98](src/client.ts#L98) |
| `addProject` | POST | `add_project` | [109](src/client.ts#L109) |
| `updateProject` | POST | `update_project/${projectId}` | [118](src/client.ts#L118) |
| `deleteProject` | POST | `delete_project/${projectId}` | [128](src/client.ts#L128) |
| `getSuite` | GET | `get_suite/${suiteId}` | [140](src/client.ts#L140) |
| `getSuites` | GET | `get_suites/${projectId}` | [150](src/client.ts#L150) |
| `addSuite` | POST | `add_suite/${projectId}` | [160](src/client.ts#L160) |
| `updateSuite` | POST | `update_suite/${suiteId}` | [170](src/client.ts#L170) |
| `deleteSuite` | POST | `delete_suite/${suiteId}` | [180](src/client.ts#L180) |
| `getSection` | GET | `get_section/${sectionId}` | [192](src/client.ts#L192) |
| `getSections` | GET | `get_sections/${projectId}&...` | [205](src/client.ts#L205) |
| `addSection` | POST | `add_section/${projectId}` | [225](src/client.ts#L225) |
| `updateSection` | POST | `update_section/${sectionId}` | [235](src/client.ts#L235) |
| `deleteSection` | POST | `delete_section/${sectionId}` | [245](src/client.ts#L245) |
| `getCase` | GET | `get_case/${caseId}` | [257](src/client.ts#L257) |
| `getCases` | GET | `get_cases/${projectId}&...` | [279](src/client.ts#L279) |
| `addCase` | POST | `add_case/${sectionId}` | [325](src/client.ts#L325) |
| `updateCase` | POST | `update_case/${caseId}` | [335](src/client.ts#L335) |
| `deleteCase` | POST | `delete_case/${caseId}` | [345](src/client.ts#L345) |
| `getPlan` | GET | `get_plan/${planId}` | [357](src/client.ts#L357) |
| `getPlans` | GET | `get_plans/${projectId}&...` | [370](src/client.ts#L370) |
| `addPlan` | POST | `add_plan/${projectId}` | [391](src/client.ts#L391) |
| `updatePlan` | POST | `update_plan/${planId}` | [401](src/client.ts#L401) |
| `closePlan` | POST | `close_plan/${planId}` | [411](src/client.ts#L411) |
| `deletePlan` | POST | `delete_plan/${planId}` | [421](src/client.ts#L421) |
| `addPlanEntry` | POST | `add_plan_entry/${planId}` | [431](src/client.ts#L431) |
| `updatePlanEntry` | POST | `update_plan_entry/${planId}/${entryId}` | [441](src/client.ts#L441) |
| `deletePlanEntry` | POST | `delete_plan_entry/${planId}/${entryId}` | [452](src/client.ts#L452) |
| `getRun` | GET | `get_run/${runId}` | [465](src/client.ts#L465) |
| `getRuns` | GET | `get_runs/${projectId}&...` | [478](src/client.ts#L478) |
| `addRun` | POST | `add_run/${projectId}` | [513](src/client.ts#L513) |
| `updateRun` | POST | `update_run/${runId}` | [523](src/client.ts#L523) |
| `closeRun` | POST | `close_run/${runId}` | [533](src/client.ts#L533) |
| `deleteRun` | POST | `delete_run/${runId}` | [543](src/client.ts#L543) |
| `getTest` | GET | `get_test/${testId}` | [555](src/client.ts#L555) |
| `getTests` | GET | `get_tests/${runId}&...` | [567](src/client.ts#L567) |
| `getResults` | GET | `get_results/${testId}&...` | [589](src/client.ts#L589) |
| `getResultsForCase` | GET | `get_results_for_case/${runId}/${caseId}&...` | [613](src/client.ts#L613) |
| `getResultsForRun` | GET | `get_results_for_run/${runId}&...` | [637](src/client.ts#L637) |
| `addResult` | POST | `add_result/${testId}` | [657](src/client.ts#L657) |
| `addResultForCase` | POST | `add_result_for_case/${runId}/${caseId}` | [667](src/client.ts#L667) |
| `addResultsForCases` | POST | `add_results_for_cases/${runId}` | [678](src/client.ts#L678) |
| `getMilestone` | GET | `get_milestone/${milestoneId}` | [690](src/client.ts#L690) |
| `getMilestones` | GET | `get_milestones/${projectId}&...` | [702](src/client.ts#L702) |
| `addMilestone` | POST | `add_milestone/${projectId}` | [719](src/client.ts#L719) |
| `updateMilestone` | POST | `update_milestone/${milestoneId}` | [729](src/client.ts#L729) |
| `deleteMilestone` | POST | `delete_milestone/${milestoneId}` | [739](src/client.ts#L739) |
| `getUser` | GET | `get_user/${userId}` | [751](src/client.ts#L751) |
| `getUserByEmail` | GET | `get_user_by_email&...` | [761](src/client.ts#L761) |
| `getUsers` | ? | `?` | [779](src/client.ts#L779) |
| `getCurrentUser` | GET | `get_current_user` | [796](src/client.ts#L796) |
| `getStatuses` | GET | `get_statuses` | [806](src/client.ts#L806) |
| `getPriorities` | GET | `get_priorities` | [816](src/client.ts#L816) |
| `getResultFields` | GET | `get_result_fields` | [826](src/client.ts#L826) |
| `getCaseFields` | GET | `get_case_fields` | [836](src/client.ts#L836) |
| `getCaseTypes` | GET | `get_case_types` | [844](src/client.ts#L844) |
| `getTemplates` | GET | `get_templates/${projectId}` | [855](src/client.ts#L855) |
| `getConfigurations` | GET | `get_configs/${projectId}` | [867](src/client.ts#L867) |
| `addConfigurationGroup` | POST | `add_config_group/${projectId}` | [877](src/client.ts#L877) |
| `updateConfigurationGroup` | POST | `update_config_group/${configGroupId}` | [887](src/client.ts#L887) |
| `deleteConfigurationGroup` | POST | `delete_config_group/${configGroupId}` | [900](src/client.ts#L900) |
| `addConfiguration` | POST | `add_config/${configGroupId}` | [910](src/client.ts#L910) |
| `updateConfiguration` | POST | `update_config/${configId}` | [920](src/client.ts#L920) |
| `deleteConfiguration` | POST | `delete_config/${configId}` | [930](src/client.ts#L930) |
| `addUser` | POST | `add_user` | [941](src/client.ts#L941) |
| `updateUser` | POST | `update_user/${userId}` | [950](src/client.ts#L950) |
| `getRoles` | GET | `get_roles` | [961](src/client.ts#L961) |
| `getGroup` | GET | `get_group/${groupId}` | [972](src/client.ts#L972) |
| `getGroups` | GET | `get_groups` | [981](src/client.ts#L981) |
| `addGroup` | POST | `add_group` | [989](src/client.ts#L989) |
| `updateGroup` | POST | `update_group/${groupId}` | [998](src/client.ts#L998) |
| `deleteGroup` | POST | `delete_group/${groupId}` | [1008](src/client.ts#L1008) |
| `getAttachmentsForCase` | GET | `get_attachments_for_case/${caseId}` | [1020](src/client.ts#L1020) |
| `getAttachmentsForRun` | GET | `get_attachments_for_run/${runId}` | [1031](src/client.ts#L1031) |
| `getAttachmentsForTest` | GET | `get_attachments_for_test/${testId}` | [1042](src/client.ts#L1042) |
| `getAttachmentsForPlan` | GET | `get_attachments_for_plan/${planId}` | [1053](src/client.ts#L1053) |
| `getAttachmentsForPlanEntry` | GET | `get_attachments_for_plan_entry/${planId}/${entryId}` | [1064](src/client.ts#L1064) |
| `getAttachment` | GET | `get_attachment/${attachmentId}` | [1080](src/client.ts#L1080) |
| `addAttachmentToCase` | POST | `add_attachment_to_case/${caseId}` | [1090](src/client.ts#L1090) |
| `addAttachmentToResult` | POST | `add_attachment_to_result/${resultId}` | [1104](src/client.ts#L1104) |
| `addAttachmentToRun` | POST | `add_attachment_to_run/${runId}` | [1118](src/client.ts#L1118) |
| `addAttachmentToPlan` | POST | `add_attachment_to_plan/${planId}` | [1132](src/client.ts#L1132) |
| `addAttachmentToPlanEntry` | POST | `add_attachment_to_plan_entry/${planId}/${entryId}` | [1146](src/client.ts#L1146) |
| `deleteAttachment` | POST | `delete_attachment/${attachmentId}` | [1162](src/client.ts#L1162) |
| `getSharedStep` | GET | `get_shared_step/${sharedStepId}` | [1174](src/client.ts#L1174) |
| `getSharedSteps` | GET | `get_shared_steps/${projectId}` | [1184](src/client.ts#L1184) |
| `addSharedStep` | POST | `add_shared_step/${projectId}` | [1194](src/client.ts#L1194) |
| `updateSharedStep` | POST | `update_shared_step/${sharedStepId}` | [1204](src/client.ts#L1204) |
| `deleteSharedStep` | POST | `delete_shared_step/${sharedStepId}` | [1214](src/client.ts#L1214) |
| `getVariables` | GET | `get_variables/${projectId}` | [1226](src/client.ts#L1226) |
| `addVariable` | POST | `add_variable/${projectId}` | [1236](src/client.ts#L1236) |
| `updateVariable` | POST | `update_variable/${variableId}` | [1246](src/client.ts#L1246) |
| `deleteVariable` | POST | `delete_variable/${variableId}` | [1256](src/client.ts#L1256) |
| `getDataset` | GET | `get_dataset/${datasetId}` | [1268](src/client.ts#L1268) |
| `getDatasets` | GET | `get_datasets/${projectId}` | [1278](src/client.ts#L1278) |
| `addDataset` | POST | `add_dataset/${projectId}` | [1288](src/client.ts#L1288) |
| `updateDataset` | POST | `update_dataset/${datasetId}` | [1298](src/client.ts#L1298) |
| `deleteDataset` | POST | `delete_dataset/${datasetId}` | [1308](src/client.ts#L1308) |
| `getReports` | GET | `get_reports/${projectId}` | [1320](src/client.ts#L1320) |
| `runReport` | GET | `run_report/${reportTemplateId}` | [1330](src/client.ts#L1330) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol | Line |
|--------|------|
| `constructor` | [99](src/client-core.ts#L99) |
| `validateId` | [293](src/client-core.ts#L293) |
| `buildEndpoint` | [332](src/client-core.ts#L332) |
| `clearCache` | [387](src/client-core.ts#L387) |
| `destroy` | [432](src/client-core.ts#L432) |
| `request` | [459](src/client-core.ts#L459) |

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
| `Case` | [43](src/types.ts#L43) |
| `Suite` | [64](src/types.ts#L64) |
| `AddSuitePayload` | [76](src/types.ts#L76) |
| `UpdateSuitePayload` | [81](src/types.ts#L81) |
| `Section` | [86](src/types.ts#L86) |
| `Project` | [96](src/types.ts#L96) |
| `Plan` | [108](src/types.ts#L108) |
| `PlanEntry` | [135](src/types.ts#L135) |
| `Run` | [147](src/types.ts#L147) |
| `Test` | [179](src/types.ts#L179) |
| `Result` | [196](src/types.ts#L196) |
| `Milestone` | [211](src/types.ts#L211) |
| `User` | [227](src/types.ts#L227) |
| `Status` | [236](src/types.ts#L236) |
| `Priority` | [248](src/types.ts#L248) |
| `AddCasePayload` | [256](src/types.ts#L256) |
| `UpdateCasePayload` | [267](src/types.ts#L267) |
| `GetCasesOptions` | [282](src/types.ts#L282) |
| `AddPlanPayload` | [309](src/types.ts#L309) |
| `UpdatePlanPayload` | [316](src/types.ts#L316) |
| `AddPlanEntryPayload` | [323](src/types.ts#L323) |
| `UpdatePlanEntryPayload` | [334](src/types.ts#L334) |
| `AddRunPayload` | [345](src/types.ts#L345) |
| `UpdateRunPayload` | [356](src/types.ts#L356) |
| `AddResultPayload` | [366](src/types.ts#L366) |
| `AddResultsForCasesPayload` | [377](src/types.ts#L377) |
| `AddResultForCasePayload` | [381](src/types.ts#L381) |
| `AddSectionPayload` | [385](src/types.ts#L385) |
| `UpdateSectionPayload` | [392](src/types.ts#L392) |
| `AddMilestonePayload` | [397](src/types.ts#L397) |
| `UpdateMilestonePayload` | [408](src/types.ts#L408) |
| `GetRunsOptions` | [421](src/types.ts#L421) |
| `ResultFieldConfig` | [442](src/types.ts#L442) |
| `ResultField` | [456](src/types.ts#L456) |
| `CaseFieldConfig` | [478](src/types.ts#L478) |
| `CaseField` | [493](src/types.ts#L493) |
| `CaseType` | [513](src/types.ts#L513) |
| `Template` | [522](src/types.ts#L522) |
| `Configuration` | [531](src/types.ts#L531) |
| `ConfigurationGroup` | [538](src/types.ts#L538) |
| `AddConfigurationGroupPayload` | [545](src/types.ts#L545) |
| `UpdateConfigurationGroupPayload` | [550](src/types.ts#L550) |
| `AddConfigurationPayload` | [555](src/types.ts#L555) |
| `UpdateConfigurationPayload` | [560](src/types.ts#L560) |
| `CacheEntry` | [565](src/types.ts#L565) |
| `RateLimiterConfig` | [570](src/types.ts#L570) |
| `AddProjectPayload` | [575](src/types.ts#L575) |
| `UpdateProjectPayload` | [582](src/types.ts#L582) |
| `GetPlansOptions` | [593](src/types.ts#L593) |
| `GetTestsOptions` | [613](src/types.ts#L613) |
| `GetResultsOptions` | [626](src/types.ts#L626) |
| `GetMilestonesOptions` | [644](src/types.ts#L644) |
| `AddUserPayload` | [656](src/types.ts#L656) |
| `UpdateUserPayload` | [670](src/types.ts#L670) |
| `Role` | [686](src/types.ts#L686) |
| `Group` | [698](src/types.ts#L698) |
| `AddGroupPayload` | [708](src/types.ts#L708) |
| `UpdateGroupPayload` | [716](src/types.ts#L716) |
| `Attachment` | [726](src/types.ts#L726) |
| `SharedStep` | [746](src/types.ts#L746) |
| `AddSharedStepPayload` | [768](src/types.ts#L768) |
| `UpdateSharedStepPayload` | [776](src/types.ts#L776) |
| `Variable` | [786](src/types.ts#L786) |
| `AddVariablePayload` | [794](src/types.ts#L794) |
| `UpdateVariablePayload` | [800](src/types.ts#L800) |
| `Dataset` | [808](src/types.ts#L808) |
| `AddDatasetPayload` | [822](src/types.ts#L822) |
| `UpdateDatasetPayload` | [828](src/types.ts#L828) |
| `Report` | [836](src/types.ts#L836) |
| `ReportResult` | [848](src/types.ts#L848) |
