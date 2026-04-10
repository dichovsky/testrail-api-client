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
| `PaginatedResponse` | [43](src/types.ts#L43) |
| `Case` | [56](src/types.ts#L56) |
| `Suite` | [77](src/types.ts#L77) |
| `AddSuitePayload` | [89](src/types.ts#L89) |
| `UpdateSuitePayload` | [94](src/types.ts#L94) |
| `Section` | [99](src/types.ts#L99) |
| `Project` | [109](src/types.ts#L109) |
| `Plan` | [121](src/types.ts#L121) |
| `PlanEntry` | [148](src/types.ts#L148) |
| `Run` | [160](src/types.ts#L160) |
| `Test` | [192](src/types.ts#L192) |
| `Result` | [209](src/types.ts#L209) |
| `Milestone` | [224](src/types.ts#L224) |
| `User` | [240](src/types.ts#L240) |
| `Status` | [249](src/types.ts#L249) |
| `Priority` | [261](src/types.ts#L261) |
| `AddCasePayload` | [269](src/types.ts#L269) |
| `UpdateCasePayload` | [280](src/types.ts#L280) |
| `GetCasesOptions` | [295](src/types.ts#L295) |
| `AddPlanPayload` | [322](src/types.ts#L322) |
| `UpdatePlanPayload` | [329](src/types.ts#L329) |
| `AddPlanEntryPayload` | [336](src/types.ts#L336) |
| `UpdatePlanEntryPayload` | [347](src/types.ts#L347) |
| `AddRunPayload` | [358](src/types.ts#L358) |
| `UpdateRunPayload` | [369](src/types.ts#L369) |
| `AddResultPayload` | [379](src/types.ts#L379) |
| `AddResultsForCasesPayload` | [390](src/types.ts#L390) |
| `AddResultForCasePayload` | [394](src/types.ts#L394) |
| `AddSectionPayload` | [398](src/types.ts#L398) |
| `UpdateSectionPayload` | [405](src/types.ts#L405) |
| `AddMilestonePayload` | [410](src/types.ts#L410) |
| `UpdateMilestonePayload` | [421](src/types.ts#L421) |
| `GetRunsOptions` | [434](src/types.ts#L434) |
| `ResultFieldConfig` | [455](src/types.ts#L455) |
| `ResultField` | [469](src/types.ts#L469) |
| `CaseFieldConfig` | [491](src/types.ts#L491) |
| `CaseField` | [506](src/types.ts#L506) |
| `CaseType` | [526](src/types.ts#L526) |
| `Template` | [535](src/types.ts#L535) |
| `Configuration` | [544](src/types.ts#L544) |
| `ConfigurationGroup` | [551](src/types.ts#L551) |
| `AddConfigurationGroupPayload` | [558](src/types.ts#L558) |
| `UpdateConfigurationGroupPayload` | [563](src/types.ts#L563) |
| `AddConfigurationPayload` | [568](src/types.ts#L568) |
| `UpdateConfigurationPayload` | [573](src/types.ts#L573) |
| `CacheEntry` | [578](src/types.ts#L578) |
| `RateLimiterConfig` | [583](src/types.ts#L583) |
| `AddProjectPayload` | [588](src/types.ts#L588) |
| `UpdateProjectPayload` | [595](src/types.ts#L595) |
| `GetPlansOptions` | [606](src/types.ts#L606) |
| `GetTestsOptions` | [626](src/types.ts#L626) |
| `GetResultsOptions` | [639](src/types.ts#L639) |
| `GetMilestonesOptions` | [657](src/types.ts#L657) |
| `AddUserPayload` | [669](src/types.ts#L669) |
| `UpdateUserPayload` | [683](src/types.ts#L683) |
| `Role` | [699](src/types.ts#L699) |
| `Group` | [711](src/types.ts#L711) |
| `AddGroupPayload` | [721](src/types.ts#L721) |
| `UpdateGroupPayload` | [729](src/types.ts#L729) |
| `Attachment` | [739](src/types.ts#L739) |
| `SharedStep` | [759](src/types.ts#L759) |
| `AddSharedStepPayload` | [781](src/types.ts#L781) |
| `UpdateSharedStepPayload` | [789](src/types.ts#L789) |
| `Variable` | [799](src/types.ts#L799) |
| `AddVariablePayload` | [807](src/types.ts#L807) |
| `UpdateVariablePayload` | [813](src/types.ts#L813) |
| `Dataset` | [821](src/types.ts#L821) |
| `AddDatasetPayload` | [835](src/types.ts#L835) |
| `UpdateDatasetPayload` | [841](src/types.ts#L841) |
| `Report` | [849](src/types.ts#L849) |
| `ReportResult` | [861](src/types.ts#L861) |
