# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

HTTP and endpoint metadata for facade methods are inferred from delegated module implementations in `src/modules/*`.

## API Endpoint Methods (`src/client.ts`)

| Method                       | HTTP | Endpoint                                              | Line                        |
| ---------------------------- | ---- | ----------------------------------------------------- | --------------------------- |
| `getProject`                 | GET  | `get_project/${projectId}`                            | [146](src/client.ts#L146)   |
| `getProjects`                | GET  | `get_projects&...`                                    | [155](src/client.ts#L155)   |
| `addProject`                 | POST | `add_project`                                         | [163](src/client.ts#L163)   |
| `updateProject`              | POST | `update_project/${projectId}`                         | [172](src/client.ts#L172)   |
| `deleteProject`              | POST | `delete_project/${projectId}`                         | [181](src/client.ts#L181)   |
| `getSuite`                   | GET  | `get_suite/${suiteId}`                                | [192](src/client.ts#L192)   |
| `getSuites`                  | GET  | `get_suites/${projectId}`                             | [201](src/client.ts#L201)   |
| `addSuite`                   | POST | `add_suite/${projectId}`                              | [210](src/client.ts#L210)   |
| `updateSuite`                | POST | `update_suite/${suiteId}`                             | [219](src/client.ts#L219)   |
| `deleteSuite`                | POST | `delete_suite/${suiteId}`                             | [228](src/client.ts#L228)   |
| `getSection`                 | GET  | `get_section/${sectionId}`                            | [239](src/client.ts#L239)   |
| `getSections`                | GET  | `get_sections/${projectId}&...`                       | [251](src/client.ts#L251)   |
| `addSection`                 | POST | `add_section/${projectId}`                            | [263](src/client.ts#L263)   |
| `updateSection`              | POST | `update_section/${sectionId}`                         | [272](src/client.ts#L272)   |
| `deleteSection`              | POST | `delete_section/${sectionId}`                         | [281](src/client.ts#L281)   |
| `getCase`                    | GET  | `get_case/${caseId}`                                  | [292](src/client.ts#L292)   |
| `getCases`                   | GET  | `get_cases/${projectId}&...`                          | [313](src/client.ts#L313)   |
| `addCase`                    | POST | `add_case/${sectionId}`                               | [322](src/client.ts#L322)   |
| `updateCase`                 | POST | `update_case/${caseId}`                               | [331](src/client.ts#L331)   |
| `deleteCase`                 | POST | `delete_case/${caseId}`                               | [340](src/client.ts#L340)   |
| `getPlan`                    | GET  | `get_plan/${planId}`                                  | [351](src/client.ts#L351)   |
| `getPlans`                   | GET  | `get_plans/${projectId}&...`                          | [363](src/client.ts#L363)   |
| `addPlan`                    | POST | `add_plan/${projectId}`                               | [372](src/client.ts#L372)   |
| `updatePlan`                 | POST | `update_plan/${planId}`                               | [381](src/client.ts#L381)   |
| `closePlan`                  | POST | `close_plan/${planId}`                                | [390](src/client.ts#L390)   |
| `deletePlan`                 | POST | `delete_plan/${planId}`                               | [399](src/client.ts#L399)   |
| `addPlanEntry`               | POST | `add_plan_entry/${planId}`                            | [408](src/client.ts#L408)   |
| `updatePlanEntry`            | POST | `update_plan_entry/${planId}/${entryId}`              | [417](src/client.ts#L417)   |
| `deletePlanEntry`            | POST | `delete_plan_entry/${planId}/${entryId}`              | [426](src/client.ts#L426)   |
| `getRun`                     | GET  | `get_run/${runId}`                                    | [437](src/client.ts#L437)   |
| `getRuns`                    | GET  | `get_runs/${projectId}&...`                           | [449](src/client.ts#L449)   |
| `addRun`                     | POST | `add_run/${projectId}`                                | [458](src/client.ts#L458)   |
| `updateRun`                  | POST | `update_run/${runId}`                                 | [467](src/client.ts#L467)   |
| `closeRun`                   | POST | `close_run/${runId}`                                  | [476](src/client.ts#L476)   |
| `deleteRun`                  | POST | `delete_run/${runId}`                                 | [485](src/client.ts#L485)   |
| `getTest`                    | GET  | `get_test/${testId}`                                  | [496](src/client.ts#L496)   |
| `getTests`                   | GET  | `get_tests/${runId}&...`                              | [507](src/client.ts#L507)   |
| `getResults`                 | GET  | `get_results/${testId}&...`                           | [521](src/client.ts#L521)   |
| `getResultsForCase`          | GET  | `get_results_for_case/${runId}/${caseId}&...`         | [534](src/client.ts#L534)   |
| `getResultsForRun`           | GET  | `get_results_for_run/${runId}&...`                    | [546](src/client.ts#L546)   |
| `addResult`                  | POST | `add_result/${testId}`                                | [555](src/client.ts#L555)   |
| `addResultForCase`           | POST | `add_result_for_case/${runId}/${caseId}`              | [564](src/client.ts#L564)   |
| `addResultsForCases`         | POST | `add_results_for_cases/${runId}`                      | [573](src/client.ts#L573)   |
| `getMilestone`               | GET  | `get_milestone/${milestoneId}`                        | [584](src/client.ts#L584)   |
| `getMilestones`              | GET  | `get_milestones/${projectId}&...`                     | [596](src/client.ts#L596)   |
| `addMilestone`               | POST | `add_milestone/${projectId}`                          | [608](src/client.ts#L608)   |
| `updateMilestone`            | POST | `update_milestone/${milestoneId}`                     | [620](src/client.ts#L620)   |
| `deleteMilestone`            | POST | `delete_milestone/${milestoneId}`                     | [631](src/client.ts#L631)   |
| `getUser`                    | GET  | `get_user/${userId}`                                  | [644](src/client.ts#L644)   |
| `getUserByEmail`             | GET  | `get_user_by_email&...`                               | [655](src/client.ts#L655)   |
| `getUsers`                   | GET  | `get_users/${projectId}&... or get_users&...`         | [668](src/client.ts#L668)   |
| `getCurrentUser`             | GET  | `get_current_user`                                    | [676](src/client.ts#L676)   |
| `addUser`                    | POST | `add_user`                                            | [686](src/client.ts#L686)   |
| `updateUser`                 | POST | `update_user/${userId}`                               | [698](src/client.ts#L698)   |
| `getStatuses`                | GET  | `get_statuses`                                        | [708](src/client.ts#L708)   |
| `getPriorities`              | GET  | `get_priorities`                                      | [718](src/client.ts#L718)   |
| `getResultFields`            | GET  | `get_result_fields`                                   | [728](src/client.ts#L728)   |
| `getCaseFields`              | GET  | `get_case_fields`                                     | [738](src/client.ts#L738)   |
| `getCaseTypes`               | GET  | `get_case_types`                                      | [746](src/client.ts#L746)   |
| `getTemplates`               | GET  | `get_templates/${projectId}`                          | [759](src/client.ts#L759)   |
| `getConfigurations`          | GET  | `get_configs/${projectId}`                            | [772](src/client.ts#L772)   |
| `addConfigurationGroup`      | POST | `add_config_group/${projectId}`                       | [784](src/client.ts#L784)   |
| `updateConfigurationGroup`   | POST | `update_config_group/${configGroupId}`                | [796](src/client.ts#L796)   |
| `deleteConfigurationGroup`   | POST | `delete_config_group/${configGroupId}`                | [810](src/client.ts#L810)   |
| `addConfiguration`           | POST | `add_config/${configGroupId}`                         | [822](src/client.ts#L822)   |
| `updateConfiguration`        | POST | `update_config/${configId}`                           | [834](src/client.ts#L834)   |
| `deleteConfiguration`        | POST | `delete_config/${configId}`                           | [845](src/client.ts#L845)   |
| `getRoles`                   | GET  | `get_roles`                                           | [855](src/client.ts#L855)   |
| `getGroup`                   | GET  | `get_group/${groupId}`                                | [868](src/client.ts#L868)   |
| `getGroups`                  | GET  | `get_groups`                                          | [876](src/client.ts#L876)   |
| `addGroup`                   | POST | `add_group`                                           | [886](src/client.ts#L886)   |
| `updateGroup`                | POST | `update_group/${groupId}`                             | [898](src/client.ts#L898)   |
| `deleteGroup`                | POST | `delete_group/${groupId}`                             | [909](src/client.ts#L909)   |
| `getAttachmentsForCase`      | GET  | `get_attachments_for_case/${caseId}`                  | [922](src/client.ts#L922)   |
| `getAttachmentsForRun`       | GET  | `get_attachments_for_run/${runId}`                    | [933](src/client.ts#L933)   |
| `getAttachmentsForTest`      | GET  | `get_attachments_for_test/${testId}`                  | [944](src/client.ts#L944)   |
| `getAttachmentsForPlan`      | GET  | `get_attachments_for_plan/${planId}`                  | [955](src/client.ts#L955)   |
| `getAttachmentsForPlanEntry` | GET  | `get_attachments_for_plan_entry/${planId}/${entryId}` | [967](src/client.ts#L967)   |
| `getAttachment`              | GET  | `get_attachment/${attachmentId}`                      | [978](src/client.ts#L978)   |
| `addAttachmentToCase`        | POST | `add_attachment_to_case/${caseId}`                    | [991](src/client.ts#L991)   |
| `addAttachmentToResult`      | POST | `add_attachment_to_result/${resultId}`                | [1008](src/client.ts#L1008) |
| `addAttachmentToRun`         | POST | `add_attachment_to_run/${runId}`                      | [1025](src/client.ts#L1025) |
| `addAttachmentToPlan`        | POST | `add_attachment_to_plan/${planId}`                    | [1042](src/client.ts#L1042) |
| `addAttachmentToPlanEntry`   | POST | `add_attachment_to_plan_entry/${planId}/${entryId}`   | [1060](src/client.ts#L1060) |
| `deleteAttachment`           | POST | `delete_attachment/${attachmentId}`                   | [1076](src/client.ts#L1076) |
| `getSharedStep`              | GET  | `get_shared_step/${sharedStepId}`                     | [1089](src/client.ts#L1089) |
| `getSharedSteps`             | GET  | `get_shared_steps/${projectId}`                       | [1100](src/client.ts#L1100) |
| `addSharedStep`              | POST | `add_shared_step/${projectId}`                        | [1112](src/client.ts#L1112) |
| `updateSharedStep`           | POST | `update_shared_step/${sharedStepId}`                  | [1124](src/client.ts#L1124) |
| `deleteSharedStep`           | POST | `delete_shared_step/${sharedStepId}`                  | [1135](src/client.ts#L1135) |
| `getVariables`               | GET  | `get_variables/${projectId}`                          | [1148](src/client.ts#L1148) |
| `addVariable`                | POST | `add_variable/${projectId}`                           | [1160](src/client.ts#L1160) |
| `updateVariable`             | POST | `update_variable/${variableId}`                       | [1172](src/client.ts#L1172) |
| `deleteVariable`             | POST | `delete_variable/${variableId}`                       | [1183](src/client.ts#L1183) |
| `getDataset`                 | GET  | `get_dataset/${datasetId}`                            | [1196](src/client.ts#L1196) |
| `getDatasets`                | GET  | `get_datasets/${projectId}`                           | [1207](src/client.ts#L1207) |
| `addDataset`                 | POST | `add_dataset/${projectId}`                            | [1219](src/client.ts#L1219) |
| `updateDataset`              | POST | `update_dataset/${datasetId}`                         | [1231](src/client.ts#L1231) |
| `deleteDataset`              | POST | `delete_dataset/${datasetId}`                         | [1242](src/client.ts#L1242) |
| `getReports`                 | GET  | `get_reports/${projectId}`                            | [1255](src/client.ts#L1255) |
| `runReport`                  | GET  | `run_report/${reportTemplateId}`                      | [1266](src/client.ts#L1266) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol          | Line                           |
| --------------- | ------------------------------ |
| `constructor`   | [180](src/client-core.ts#L180) |
| `validateId`    | [399](src/client-core.ts#L399) |
| `buildEndpoint` | [438](src/client-core.ts#L438) |
| `clearCache`    | [493](src/client-core.ts#L493) |
| `destroy`       | [538](src/client-core.ts#L538) |
| `request`       | [565](src/client-core.ts#L565) |

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
| `TestRailConfig`                  | [10](src/types.ts#L10)   |
| `Case`                            | [49](src/types.ts#L49)   |
| `Suite`                           | [70](src/types.ts#L70)   |
| `AddSuitePayload`                 | [82](src/types.ts#L82)   |
| `UpdateSuitePayload`              | [87](src/types.ts#L87)   |
| `Section`                         | [92](src/types.ts#L92)   |
| `Project`                         | [102](src/types.ts#L102) |
| `Plan`                            | [114](src/types.ts#L114) |
| `PlanEntry`                       | [141](src/types.ts#L141) |
| `Run`                             | [153](src/types.ts#L153) |
| `Test`                            | [185](src/types.ts#L185) |
| `Result`                          | [202](src/types.ts#L202) |
| `Milestone`                       | [217](src/types.ts#L217) |
| `User`                            | [233](src/types.ts#L233) |
| `Status`                          | [242](src/types.ts#L242) |
| `Priority`                        | [254](src/types.ts#L254) |
| `GetCasesOptions`                 | [269](src/types.ts#L269) |
| `AddPlanPayload`                  | [296](src/types.ts#L296) |
| `UpdatePlanPayload`               | [303](src/types.ts#L303) |
| `AddPlanEntryPayload`             | [310](src/types.ts#L310) |
| `UpdatePlanEntryPayload`          | [321](src/types.ts#L321) |
| `AddSectionPayload`               | [336](src/types.ts#L336) |
| `UpdateSectionPayload`            | [343](src/types.ts#L343) |
| `AddMilestonePayload`             | [348](src/types.ts#L348) |
| `UpdateMilestonePayload`          | [359](src/types.ts#L359) |
| `GetRunsOptions`                  | [372](src/types.ts#L372) |
| `ResultFieldConfig`               | [393](src/types.ts#L393) |
| `ResultField`                     | [407](src/types.ts#L407) |
| `CaseFieldConfig`                 | [429](src/types.ts#L429) |
| `CaseField`                       | [444](src/types.ts#L444) |
| `CaseType`                        | [464](src/types.ts#L464) |
| `Template`                        | [473](src/types.ts#L473) |
| `Configuration`                   | [482](src/types.ts#L482) |
| `ConfigurationGroup`              | [489](src/types.ts#L489) |
| `AddConfigurationGroupPayload`    | [496](src/types.ts#L496) |
| `UpdateConfigurationGroupPayload` | [501](src/types.ts#L501) |
| `AddConfigurationPayload`         | [506](src/types.ts#L506) |
| `UpdateConfigurationPayload`      | [511](src/types.ts#L511) |
| `CacheEntry`                      | [516](src/types.ts#L516) |
| `RateLimiterConfig`               | [521](src/types.ts#L521) |
| `AddProjectPayload`               | [526](src/types.ts#L526) |
| `UpdateProjectPayload`            | [533](src/types.ts#L533) |
| `GetPlansOptions`                 | [544](src/types.ts#L544) |
| `GetTestsOptions`                 | [564](src/types.ts#L564) |
| `GetResultsOptions`               | [577](src/types.ts#L577) |
| `GetMilestonesOptions`            | [595](src/types.ts#L595) |
| `AddUserPayload`                  | [607](src/types.ts#L607) |
| `UpdateUserPayload`               | [621](src/types.ts#L621) |
| `Role`                            | [637](src/types.ts#L637) |
| `Group`                           | [649](src/types.ts#L649) |
| `AddGroupPayload`                 | [659](src/types.ts#L659) |
| `UpdateGroupPayload`              | [667](src/types.ts#L667) |
| `Attachment`                      | [677](src/types.ts#L677) |
| `SharedStep`                      | [697](src/types.ts#L697) |
| `AddSharedStepPayload`            | [719](src/types.ts#L719) |
| `UpdateSharedStepPayload`         | [727](src/types.ts#L727) |
| `Variable`                        | [737](src/types.ts#L737) |
| `AddVariablePayload`              | [745](src/types.ts#L745) |
| `UpdateVariablePayload`           | [751](src/types.ts#L751) |
| `Dataset`                         | [759](src/types.ts#L759) |
| `AddDatasetPayload`               | [773](src/types.ts#L773) |
| `UpdateDatasetPayload`            | [779](src/types.ts#L779) |
| `Report`                          | [787](src/types.ts#L787) |
| `ReportResult`                    | [799](src/types.ts#L799) |
