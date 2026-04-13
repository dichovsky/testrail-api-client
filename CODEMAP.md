# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method                       | HTTP | Endpoint                                              | Line                        |
| ---------------------------- | ---- | ----------------------------------------------------- | --------------------------- |
| `getProject`                 | GET  | `get_project/${projectId}`                            | [118](src/client.ts#L118)   |
| `getProjects`                | GET  | `get_projects&...`                                    | [128](src/client.ts#L128)   |
| `addProject`                 | POST | `add_project`                                         | [142](src/client.ts#L142)   |
| `updateProject`              | POST | `update_project/${projectId}`                         | [151](src/client.ts#L151)   |
| `deleteProject`              | POST | `delete_project/${projectId}`                         | [164](src/client.ts#L164)   |
| `getSuite`                   | GET  | `get_suite/${suiteId}`                                | [176](src/client.ts#L176)   |
| `getSuites`                  | GET  | `get_suites/${projectId}`                             | [186](src/client.ts#L186)   |
| `addSuite`                   | POST | `add_suite/${projectId}`                              | [196](src/client.ts#L196)   |
| `updateSuite`                | POST | `update_suite/${suiteId}`                             | [206](src/client.ts#L206)   |
| `deleteSuite`                | POST | `delete_suite/${suiteId}`                             | [216](src/client.ts#L216)   |
| `getSection`                 | GET  | `get_section/${sectionId}`                            | [228](src/client.ts#L228)   |
| `getSections`                | GET  | `get_sections/${projectId}&...`                       | [241](src/client.ts#L241)   |
| `addSection`                 | POST | `add_section/${projectId}`                            | [264](src/client.ts#L264)   |
| `updateSection`              | POST | `update_section/${sectionId}`                         | [277](src/client.ts#L277)   |
| `deleteSection`              | POST | `delete_section/${sectionId}`                         | [290](src/client.ts#L290)   |
| `getCase`                    | GET  | `get_case/${caseId}`                                  | [302](src/client.ts#L302)   |
| `getCases`                   | GET  | `get_cases/${projectId}&...`                          | [324](src/client.ts#L324)   |
| `addCase`                    | POST | `add_case/${sectionId}`                               | [370](src/client.ts#L370)   |
| `updateCase`                 | POST | `update_case/${caseId}`                               | [380](src/client.ts#L380)   |
| `deleteCase`                 | POST | `delete_case/${caseId}`                               | [390](src/client.ts#L390)   |
| `getPlan`                    | GET  | `get_plan/${planId}`                                  | [402](src/client.ts#L402)   |
| `getPlans`                   | GET  | `get_plans/${projectId}&...`                          | [415](src/client.ts#L415)   |
| `addPlan`                    | POST | `add_plan/${projectId}`                               | [436](src/client.ts#L436)   |
| `updatePlan`                 | POST | `update_plan/${planId}`                               | [446](src/client.ts#L446)   |
| `closePlan`                  | POST | `close_plan/${planId}`                                | [456](src/client.ts#L456)   |
| `deletePlan`                 | POST | `delete_plan/${planId}`                               | [466](src/client.ts#L466)   |
| `addPlanEntry`               | POST | `add_plan_entry/${planId}`                            | [476](src/client.ts#L476)   |
| `updatePlanEntry`            | POST | `update_plan_entry/${planId}/${entryId}`              | [489](src/client.ts#L489)   |
| `deletePlanEntry`            | POST | `delete_plan_entry/${planId}/${entryId}`              | [503](src/client.ts#L503)   |
| `getRun`                     | GET  | `get_run/${runId}`                                    | [516](src/client.ts#L516)   |
| `getRuns`                    | GET  | `get_runs/${projectId}&...`                           | [529](src/client.ts#L529)   |
| `addRun`                     | POST | `add_run/${projectId}`                                | [564](src/client.ts#L564)   |
| `updateRun`                  | POST | `update_run/${runId}`                                 | [574](src/client.ts#L574)   |
| `closeRun`                   | POST | `close_run/${runId}`                                  | [584](src/client.ts#L584)   |
| `deleteRun`                  | POST | `delete_run/${runId}`                                 | [594](src/client.ts#L594)   |
| `getTest`                    | GET  | `get_test/${testId}`                                  | [606](src/client.ts#L606)   |
| `getTests`                   | GET  | `get_tests/${runId}&...`                              | [618](src/client.ts#L618)   |
| `getResults`                 | GET  | `get_results/${testId}&...`                           | [640](src/client.ts#L640)   |
| `getResultsForCase`          | GET  | `get_results_for_case/${runId}/${caseId}&...`         | [667](src/client.ts#L667)   |
| `getResultsForRun`           | GET  | `get_results_for_run/${runId}&...`                    | [694](src/client.ts#L694)   |
| `addResult`                  | POST | `add_result/${testId}`                                | [717](src/client.ts#L717)   |
| `addResultForCase`           | POST | `add_result_for_case/${runId}/${caseId}`              | [727](src/client.ts#L727)   |
| `addResultsForCases`         | POST | `add_results_for_cases/${runId}`                      | [741](src/client.ts#L741)   |
| `getMilestone`               | GET  | `get_milestone/${milestoneId}`                        | [756](src/client.ts#L756)   |
| `getMilestones`              | GET  | `get_milestones/${projectId}&...`                     | [771](src/client.ts#L771)   |
| `addMilestone`               | POST | `add_milestone/${projectId}`                          | [791](src/client.ts#L791)   |
| `updateMilestone`            | POST | `update_milestone/${milestoneId}`                     | [804](src/client.ts#L804)   |
| `deleteMilestone`            | POST | `delete_milestone/${milestoneId}`                     | [817](src/client.ts#L817)   |
| `getUser`                    | GET  | `get_user/${userId}`                                  | [829](src/client.ts#L829)   |
| `getUserByEmail`             | GET  | `get_user_by_email&...`                               | [839](src/client.ts#L839)   |
| `getUsers`                   | ?    | `?`                                                   | [860](src/client.ts#L860)   |
| `getCurrentUser`             | GET  | `get_current_user`                                    | [877](src/client.ts#L877)   |
| `getStatuses`                | GET  | `get_statuses`                                        | [887](src/client.ts#L887)   |
| `getPriorities`              | GET  | `get_priorities`                                      | [897](src/client.ts#L897)   |
| `getResultFields`            | GET  | `get_result_fields`                                   | [907](src/client.ts#L907)   |
| `getCaseFields`              | GET  | `get_case_fields`                                     | [920](src/client.ts#L920)   |
| `getCaseTypes`               | GET  | `get_case_types`                                      | [928](src/client.ts#L928)   |
| `getTemplates`               | GET  | `get_templates/${projectId}`                          | [939](src/client.ts#L939)   |
| `getConfigurations`          | GET  | `get_configs/${projectId}`                            | [954](src/client.ts#L954)   |
| `addConfigurationGroup`      | POST | `add_config_group/${projectId}`                       | [967](src/client.ts#L967)   |
| `updateConfigurationGroup`   | POST | `update_config_group/${configGroupId}`                | [980](src/client.ts#L980)   |
| `deleteConfigurationGroup`   | POST | `delete_config_group/${configGroupId}`                | [996](src/client.ts#L996)   |
| `addConfiguration`           | POST | `add_config/${configGroupId}`                         | [1006](src/client.ts#L1006) |
| `updateConfiguration`        | POST | `update_config/${configId}`                           | [1019](src/client.ts#L1019) |
| `deleteConfiguration`        | POST | `delete_config/${configId}`                           | [1032](src/client.ts#L1032) |
| `addUser`                    | POST | `add_user`                                            | [1043](src/client.ts#L1043) |
| `updateUser`                 | POST | `update_user/${userId}`                               | [1052](src/client.ts#L1052) |
| `getRoles`                   | GET  | `get_roles`                                           | [1063](src/client.ts#L1063) |
| `getGroup`                   | GET  | `get_group/${groupId}`                                | [1074](src/client.ts#L1074) |
| `getGroups`                  | GET  | `get_groups`                                          | [1083](src/client.ts#L1083) |
| `addGroup`                   | POST | `add_group`                                           | [1091](src/client.ts#L1091) |
| `updateGroup`                | POST | `update_group/${groupId}`                             | [1100](src/client.ts#L1100) |
| `deleteGroup`                | POST | `delete_group/${groupId}`                             | [1110](src/client.ts#L1110) |
| `getAttachmentsForCase`      | GET  | `get_attachments_for_case/${caseId}`                  | [1122](src/client.ts#L1122) |
| `getAttachmentsForRun`       | GET  | `get_attachments_for_run/${runId}`                    | [1138](src/client.ts#L1138) |
| `getAttachmentsForTest`      | GET  | `get_attachments_for_test/${testId}`                  | [1154](src/client.ts#L1154) |
| `getAttachmentsForPlan`      | GET  | `get_attachments_for_plan/${planId}`                  | [1170](src/client.ts#L1170) |
| `getAttachmentsForPlanEntry` | GET  | `get_attachments_for_plan_entry/${planId}/${entryId}` | [1186](src/client.ts#L1186) |
| `getAttachment`              | GET  | `get_attachment/${attachmentId}`                      | [1204](src/client.ts#L1204) |
| `addAttachmentToCase`        | POST | `add_attachment_to_case/${caseId}`                    | [1214](src/client.ts#L1214) |
| `addAttachmentToResult`      | POST | `add_attachment_to_result/${resultId}`                | [1228](src/client.ts#L1228) |
| `addAttachmentToRun`         | POST | `add_attachment_to_run/${runId}`                      | [1242](src/client.ts#L1242) |
| `addAttachmentToPlan`        | POST | `add_attachment_to_plan/${planId}`                    | [1256](src/client.ts#L1256) |
| `addAttachmentToPlanEntry`   | POST | `add_attachment_to_plan_entry/${planId}/${entryId}`   | [1270](src/client.ts#L1270) |
| `deleteAttachment`           | POST | `delete_attachment/${attachmentId}`                   | [1286](src/client.ts#L1286) |
| `getSharedStep`              | GET  | `get_shared_step/${sharedStepId}`                     | [1298](src/client.ts#L1298) |
| `getSharedSteps`             | GET  | `get_shared_steps/${projectId}`                       | [1311](src/client.ts#L1311) |
| `addSharedStep`              | POST | `add_shared_step/${projectId}`                        | [1324](src/client.ts#L1324) |
| `updateSharedStep`           | POST | `update_shared_step/${sharedStepId}`                  | [1337](src/client.ts#L1337) |
| `deleteSharedStep`           | POST | `delete_shared_step/${sharedStepId}`                  | [1350](src/client.ts#L1350) |
| `getVariables`               | GET  | `get_variables/${projectId}`                          | [1362](src/client.ts#L1362) |
| `addVariable`                | POST | `add_variable/${projectId}`                           | [1375](src/client.ts#L1375) |
| `updateVariable`             | POST | `update_variable/${variableId}`                       | [1388](src/client.ts#L1388) |
| `deleteVariable`             | POST | `delete_variable/${variableId}`                       | [1401](src/client.ts#L1401) |
| `getDataset`                 | GET  | `get_dataset/${datasetId}`                            | [1413](src/client.ts#L1413) |
| `getDatasets`                | GET  | `get_datasets/${projectId}`                           | [1423](src/client.ts#L1423) |
| `addDataset`                 | POST | `add_dataset/${projectId}`                            | [1436](src/client.ts#L1436) |
| `updateDataset`              | POST | `update_dataset/${datasetId}`                         | [1449](src/client.ts#L1449) |
| `deleteDataset`              | POST | `delete_dataset/${datasetId}`                         | [1462](src/client.ts#L1462) |
| `getReports`                 | GET  | `get_reports/${projectId}`                            | [1474](src/client.ts#L1474) |
| `runReport`                  | GET  | `run_report/${reportTemplateId}`                      | [1487](src/client.ts#L1487) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol          | Line                           |
| --------------- | ------------------------------ |
| `constructor`   | [168](src/client-core.ts#L168) |
| `validateId`    | [387](src/client-core.ts#L387) |
| `buildEndpoint` | [426](src/client-core.ts#L426) |
| `clearCache`    | [481](src/client-core.ts#L481) |
| `destroy`       | [526](src/client-core.ts#L526) |
| `request`       | [553](src/client-core.ts#L553) |

## Error Classes (`src/errors.ts`)

| Class                     | Line                    |
| ------------------------- | ----------------------- |
| `TestRailApiError`        | [6](src/errors.ts#L6)   |
| `TestRailValidationError` | [20](src/errors.ts#L20) |
| `handleZodError`          | [33](src/errors.ts#L33) |

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

| Type                              | Line                     |
| --------------------------------- | ------------------------ |
| `TestRailConfig`                  | [4](src/types.ts#L4)     |
| `Case`                            | [43](src/types.ts#L43)   |
| `Suite`                           | [64](src/types.ts#L64)   |
| `AddSuitePayload`                 | [76](src/types.ts#L76)   |
| `UpdateSuitePayload`              | [81](src/types.ts#L81)   |
| `Section`                         | [86](src/types.ts#L86)   |
| `Project`                         | [96](src/types.ts#L96)   |
| `Plan`                            | [108](src/types.ts#L108) |
| `PlanEntry`                       | [135](src/types.ts#L135) |
| `Run`                             | [147](src/types.ts#L147) |
| `Test`                            | [179](src/types.ts#L179) |
| `Result`                          | [196](src/types.ts#L196) |
| `Milestone`                       | [211](src/types.ts#L211) |
| `User`                            | [227](src/types.ts#L227) |
| `Status`                          | [236](src/types.ts#L236) |
| `Priority`                        | [248](src/types.ts#L248) |
| `AddCasePayload`                  | [256](src/types.ts#L256) |
| `UpdateCasePayload`               | [267](src/types.ts#L267) |
| `GetCasesOptions`                 | [282](src/types.ts#L282) |
| `AddPlanPayload`                  | [309](src/types.ts#L309) |
| `UpdatePlanPayload`               | [316](src/types.ts#L316) |
| `AddPlanEntryPayload`             | [323](src/types.ts#L323) |
| `UpdatePlanEntryPayload`          | [334](src/types.ts#L334) |
| `AddRunPayload`                   | [345](src/types.ts#L345) |
| `UpdateRunPayload`                | [356](src/types.ts#L356) |
| `AddResultPayload`                | [366](src/types.ts#L366) |
| `AddResultsForCasesPayload`       | [377](src/types.ts#L377) |
| `AddResultForCasePayload`         | [381](src/types.ts#L381) |
| `AddSectionPayload`               | [385](src/types.ts#L385) |
| `UpdateSectionPayload`            | [392](src/types.ts#L392) |
| `AddMilestonePayload`             | [397](src/types.ts#L397) |
| `UpdateMilestonePayload`          | [408](src/types.ts#L408) |
| `GetRunsOptions`                  | [421](src/types.ts#L421) |
| `ResultFieldConfig`               | [442](src/types.ts#L442) |
| `ResultField`                     | [456](src/types.ts#L456) |
| `CaseFieldConfig`                 | [478](src/types.ts#L478) |
| `CaseField`                       | [493](src/types.ts#L493) |
| `CaseType`                        | [513](src/types.ts#L513) |
| `Template`                        | [522](src/types.ts#L522) |
| `Configuration`                   | [531](src/types.ts#L531) |
| `ConfigurationGroup`              | [538](src/types.ts#L538) |
| `AddConfigurationGroupPayload`    | [545](src/types.ts#L545) |
| `UpdateConfigurationGroupPayload` | [550](src/types.ts#L550) |
| `AddConfigurationPayload`         | [555](src/types.ts#L555) |
| `UpdateConfigurationPayload`      | [560](src/types.ts#L560) |
| `CacheEntry`                      | [565](src/types.ts#L565) |
| `RateLimiterConfig`               | [570](src/types.ts#L570) |
| `AddProjectPayload`               | [575](src/types.ts#L575) |
| `UpdateProjectPayload`            | [582](src/types.ts#L582) |
| `GetPlansOptions`                 | [593](src/types.ts#L593) |
| `GetTestsOptions`                 | [613](src/types.ts#L613) |
| `GetResultsOptions`               | [626](src/types.ts#L626) |
| `GetMilestonesOptions`            | [644](src/types.ts#L644) |
| `AddUserPayload`                  | [656](src/types.ts#L656) |
| `UpdateUserPayload`               | [670](src/types.ts#L670) |
| `Role`                            | [686](src/types.ts#L686) |
| `Group`                           | [698](src/types.ts#L698) |
| `AddGroupPayload`                 | [708](src/types.ts#L708) |
| `UpdateGroupPayload`              | [716](src/types.ts#L716) |
| `Attachment`                      | [726](src/types.ts#L726) |
| `SharedStep`                      | [746](src/types.ts#L746) |
| `AddSharedStepPayload`            | [768](src/types.ts#L768) |
| `UpdateSharedStepPayload`         | [776](src/types.ts#L776) |
| `Variable`                        | [786](src/types.ts#L786) |
| `AddVariablePayload`              | [794](src/types.ts#L794) |
| `UpdateVariablePayload`           | [800](src/types.ts#L800) |
| `Dataset`                         | [808](src/types.ts#L808) |
| `AddDatasetPayload`               | [822](src/types.ts#L822) |
| `UpdateDatasetPayload`            | [828](src/types.ts#L828) |
| `Report`                          | [836](src/types.ts#L836) |
| `ReportResult`                    | [848](src/types.ts#L848) |
