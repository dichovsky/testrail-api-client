# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

HTTP and endpoint metadata for facade methods are inferred from delegated module implementations in `src/modules/*`.

## API Endpoint Methods (`src/client.ts`)

| Method                       | HTTP | Endpoint                                              | Line                        |
| ---------------------------- | ---- | ----------------------------------------------------- | --------------------------- |
| `getProject`                 | GET  | `get_project/${projectId}`                            | [144](src/client.ts#L144)   |
| `getProjects`                | GET  | `get_projects&...`                                    | [153](src/client.ts#L153)   |
| `addProject`                 | POST | `add_project`                                         | [161](src/client.ts#L161)   |
| `updateProject`              | POST | `update_project/${projectId}`                         | [170](src/client.ts#L170)   |
| `deleteProject`              | POST | `delete_project/${projectId}`                         | [179](src/client.ts#L179)   |
| `getSuite`                   | GET  | `get_suite/${suiteId}`                                | [190](src/client.ts#L190)   |
| `getSuites`                  | GET  | `get_suites/${projectId}`                             | [199](src/client.ts#L199)   |
| `addSuite`                   | POST | `add_suite/${projectId}`                              | [208](src/client.ts#L208)   |
| `updateSuite`                | POST | `update_suite/${suiteId}`                             | [217](src/client.ts#L217)   |
| `deleteSuite`                | POST | `delete_suite/${suiteId}`                             | [226](src/client.ts#L226)   |
| `getSection`                 | GET  | `get_section/${sectionId}`                            | [237](src/client.ts#L237)   |
| `getSections`                | GET  | `get_sections/${projectId}&...`                       | [249](src/client.ts#L249)   |
| `addSection`                 | POST | `add_section/${projectId}`                            | [261](src/client.ts#L261)   |
| `updateSection`              | POST | `update_section/${sectionId}`                         | [270](src/client.ts#L270)   |
| `deleteSection`              | POST | `delete_section/${sectionId}`                         | [279](src/client.ts#L279)   |
| `getCase`                    | GET  | `get_case/${caseId}`                                  | [290](src/client.ts#L290)   |
| `getCases`                   | GET  | `get_cases/${projectId}&...`                          | [311](src/client.ts#L311)   |
| `addCase`                    | POST | `add_case/${sectionId}`                               | [320](src/client.ts#L320)   |
| `updateCase`                 | POST | `update_case/${caseId}`                               | [329](src/client.ts#L329)   |
| `deleteCase`                 | POST | `delete_case/${caseId}`                               | [338](src/client.ts#L338)   |
| `getPlan`                    | GET  | `get_plan/${planId}`                                  | [349](src/client.ts#L349)   |
| `getPlans`                   | GET  | `get_plans/${projectId}&...`                          | [361](src/client.ts#L361)   |
| `addPlan`                    | POST | `add_plan/${projectId}`                               | [370](src/client.ts#L370)   |
| `updatePlan`                 | POST | `update_plan/${planId}`                               | [379](src/client.ts#L379)   |
| `closePlan`                  | POST | `close_plan/${planId}`                                | [388](src/client.ts#L388)   |
| `deletePlan`                 | POST | `delete_plan/${planId}`                               | [397](src/client.ts#L397)   |
| `addPlanEntry`               | POST | `add_plan_entry/${planId}`                            | [406](src/client.ts#L406)   |
| `updatePlanEntry`            | POST | `update_plan_entry/${planId}/${entryId}`              | [415](src/client.ts#L415)   |
| `deletePlanEntry`            | POST | `delete_plan_entry/${planId}/${entryId}`              | [424](src/client.ts#L424)   |
| `getRun`                     | GET  | `get_run/${runId}`                                    | [435](src/client.ts#L435)   |
| `getRuns`                    | GET  | `get_runs/${projectId}&...`                           | [447](src/client.ts#L447)   |
| `addRun`                     | POST | `add_run/${projectId}`                                | [456](src/client.ts#L456)   |
| `updateRun`                  | POST | `update_run/${runId}`                                 | [465](src/client.ts#L465)   |
| `closeRun`                   | POST | `close_run/${runId}`                                  | [474](src/client.ts#L474)   |
| `deleteRun`                  | POST | `delete_run/${runId}`                                 | [483](src/client.ts#L483)   |
| `getTest`                    | GET  | `get_test/${testId}`                                  | [494](src/client.ts#L494)   |
| `getTests`                   | GET  | `get_tests/${runId}&...`                              | [505](src/client.ts#L505)   |
| `getResults`                 | GET  | `get_results/${testId}&...`                           | [519](src/client.ts#L519)   |
| `getResultsForCase`          | GET  | `get_results_for_case/${runId}/${caseId}&...`         | [532](src/client.ts#L532)   |
| `getResultsForRun`           | GET  | `get_results_for_run/${runId}&...`                    | [544](src/client.ts#L544)   |
| `addResult`                  | POST | `add_result/${testId}`                                | [553](src/client.ts#L553)   |
| `addResultForCase`           | POST | `add_result_for_case/${runId}/${caseId}`              | [562](src/client.ts#L562)   |
| `addResultsForCases`         | POST | `add_results_for_cases/${runId}`                      | [571](src/client.ts#L571)   |
| `getMilestone`               | GET  | `get_milestone/${milestoneId}`                        | [582](src/client.ts#L582)   |
| `getMilestones`              | GET  | `get_milestones/${projectId}&...`                     | [594](src/client.ts#L594)   |
| `addMilestone`               | POST | `add_milestone/${projectId}`                          | [606](src/client.ts#L606)   |
| `updateMilestone`            | POST | `update_milestone/${milestoneId}`                     | [618](src/client.ts#L618)   |
| `deleteMilestone`            | POST | `delete_milestone/${milestoneId}`                     | [629](src/client.ts#L629)   |
| `getUser`                    | GET  | `get_user/${userId}`                                  | [642](src/client.ts#L642)   |
| `getUserByEmail`             | GET  | `get_user_by_email&...`                               | [652](src/client.ts#L652)   |
| `getUsers`                   | GET  | `get_users/${projectId}&... or get_users&...`         | [665](src/client.ts#L665)   |
| `getCurrentUser`             | GET  | `get_current_user`                                    | [673](src/client.ts#L673)   |
| `addUser`                    | POST | `add_user`                                            | [683](src/client.ts#L683)   |
| `updateUser`                 | POST | `update_user/${userId}`                               | [695](src/client.ts#L695)   |
| `getStatuses`                | GET  | `get_statuses`                                        | [705](src/client.ts#L705)   |
| `getPriorities`              | GET  | `get_priorities`                                      | [715](src/client.ts#L715)   |
| `getResultFields`            | GET  | `get_result_fields`                                   | [725](src/client.ts#L725)   |
| `getCaseFields`              | GET  | `get_case_fields`                                     | [735](src/client.ts#L735)   |
| `getCaseTypes`               | GET  | `get_case_types`                                      | [743](src/client.ts#L743)   |
| `getTemplates`               | GET  | `get_templates/${projectId}`                          | [756](src/client.ts#L756)   |
| `getConfigurations`          | GET  | `get_configs/${projectId}`                            | [769](src/client.ts#L769)   |
| `addConfigurationGroup`      | POST | `add_config_group/${projectId}`                       | [781](src/client.ts#L781)   |
| `updateConfigurationGroup`   | POST | `update_config_group/${configGroupId}`                | [793](src/client.ts#L793)   |
| `deleteConfigurationGroup`   | POST | `delete_config_group/${configGroupId}`                | [807](src/client.ts#L807)   |
| `addConfiguration`           | POST | `add_config/${configGroupId}`                         | [819](src/client.ts#L819)   |
| `updateConfiguration`        | POST | `update_config/${configId}`                           | [831](src/client.ts#L831)   |
| `deleteConfiguration`        | POST | `delete_config/${configId}`                           | [842](src/client.ts#L842)   |
| `getRoles`                   | GET  | `get_roles`                                           | [852](src/client.ts#L852)   |
| `getGroup`                   | GET  | `get_group/${groupId}`                                | [865](src/client.ts#L865)   |
| `getGroups`                  | GET  | `get_groups`                                          | [873](src/client.ts#L873)   |
| `addGroup`                   | POST | `add_group`                                           | [883](src/client.ts#L883)   |
| `updateGroup`                | POST | `update_group/${groupId}`                             | [895](src/client.ts#L895)   |
| `deleteGroup`                | POST | `delete_group/${groupId}`                             | [906](src/client.ts#L906)   |
| `getAttachmentsForCase`      | GET  | `get_attachments_for_case/${caseId}`                  | [919](src/client.ts#L919)   |
| `getAttachmentsForRun`       | GET  | `get_attachments_for_run/${runId}`                    | [930](src/client.ts#L930)   |
| `getAttachmentsForTest`      | GET  | `get_attachments_for_test/${testId}`                  | [941](src/client.ts#L941)   |
| `getAttachmentsForPlan`      | GET  | `get_attachments_for_plan/${planId}`                  | [952](src/client.ts#L952)   |
| `getAttachmentsForPlanEntry` | GET  | `get_attachments_for_plan_entry/${planId}/${entryId}` | [964](src/client.ts#L964)   |
| `getAttachment`              | GET  | `get_attachment/${attachmentId}`                      | [975](src/client.ts#L975)   |
| `addAttachmentToCase`        | POST | `add_attachment_to_case/${caseId}`                    | [988](src/client.ts#L988)   |
| `addAttachmentToResult`      | POST | `add_attachment_to_result/${resultId}`                | [1005](src/client.ts#L1005) |
| `addAttachmentToRun`         | POST | `add_attachment_to_run/${runId}`                      | [1022](src/client.ts#L1022) |
| `addAttachmentToPlan`        | POST | `add_attachment_to_plan/${planId}`                    | [1039](src/client.ts#L1039) |
| `addAttachmentToPlanEntry`   | POST | `add_attachment_to_plan_entry/${planId}/${entryId}`   | [1057](src/client.ts#L1057) |
| `deleteAttachment`           | POST | `delete_attachment/${attachmentId}`                   | [1073](src/client.ts#L1073) |
| `getSharedStep`              | GET  | `get_shared_step/${sharedStepId}`                     | [1086](src/client.ts#L1086) |
| `getSharedSteps`             | GET  | `get_shared_steps/${projectId}`                       | [1097](src/client.ts#L1097) |
| `addSharedStep`              | POST | `add_shared_step/${projectId}`                        | [1109](src/client.ts#L1109) |
| `updateSharedStep`           | POST | `update_shared_step/${sharedStepId}`                  | [1121](src/client.ts#L1121) |
| `deleteSharedStep`           | POST | `delete_shared_step/${sharedStepId}`                  | [1132](src/client.ts#L1132) |
| `getVariables`               | GET  | `get_variables/${projectId}`                          | [1145](src/client.ts#L1145) |
| `addVariable`                | POST | `add_variable/${projectId}`                           | [1157](src/client.ts#L1157) |
| `updateVariable`             | POST | `update_variable/${variableId}`                       | [1169](src/client.ts#L1169) |
| `deleteVariable`             | POST | `delete_variable/${variableId}`                       | [1180](src/client.ts#L1180) |
| `getDataset`                 | GET  | `get_dataset/${datasetId}`                            | [1193](src/client.ts#L1193) |
| `getDatasets`                | GET  | `get_datasets/${projectId}`                           | [1204](src/client.ts#L1204) |
| `addDataset`                 | POST | `add_dataset/${projectId}`                            | [1216](src/client.ts#L1216) |
| `updateDataset`              | POST | `update_dataset/${datasetId}`                         | [1228](src/client.ts#L1228) |
| `deleteDataset`              | POST | `delete_dataset/${datasetId}`                         | [1239](src/client.ts#L1239) |
| `getReports`                 | GET  | `get_reports/${projectId}`                            | [1252](src/client.ts#L1252) |
| `runReport`                  | GET  | `run_report/${reportTemplateId}`                      | [1263](src/client.ts#L1263) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol          | Line                           |
| --------------- | ------------------------------ |
| `constructor`   | [181](src/client-core.ts#L181) |
| `validateId`    | [400](src/client-core.ts#L400) |
| `buildEndpoint` | [439](src/client-core.ts#L439) |
| `clearCache`    | [494](src/client-core.ts#L494) |
| `destroy`       | [539](src/client-core.ts#L539) |
| `request`       | [566](src/client-core.ts#L566) |

## Error Classes (`src/errors.ts`)

| Class                     | Line                    |
| ------------------------- | ----------------------- |
| `TestRailApiError`        | [6](src/errors.ts#L6)   |
| `TestRailValidationError` | [20](src/errors.ts#L20) |
| `handleZodError`          | [33](src/errors.ts#L33) |

## Constants (`src/constants.ts`)

| Constant                             | Value           | Line                       |
| ------------------------------------ | --------------- | -------------------------- |
| `BASE_RETRY_DELAY_MS`                | `1000`          | [2](src/constants.ts#L2)   |
| `MAX_RETRY_DELAY_MS`                 | `10000`         | [3](src/constants.ts#L3)   |
| `MAX_TIMEOUT_MS`                     | `5 * 60 * 1000` | [6](src/constants.ts#L6)   |
| `DEFAULT_TIMEOUT_MS`                 | `30000`         | [9](src/constants.ts#L9)   |
| `DEFAULT_MAX_RETRIES`                | `3`             | [10](src/constants.ts#L10) |
| `DEFAULT_CACHE_TTL_MS`               | `300000`        | [11](src/constants.ts#L11) |
| `DEFAULT_CACHE_CLEANUP_INTERVAL_MS`  | `60000`         | [12](src/constants.ts#L12) |
| `DEFAULT_MAX_CACHE_SIZE`             | `1000`          | [13](src/constants.ts#L13) |
| `DEFAULT_RATE_LIMIT_MAX_REQUESTS`    | `100`           | [14](src/constants.ts#L14) |
| `DEFAULT_RATE_LIMIT_WINDOW_MS`       | `60000`         | [15](src/constants.ts#L15) |
| `DEFAULT_DNS_VALIDATION_MAX_WAIT_MS` | `2000`          | [16](src/constants.ts#L16) |

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
