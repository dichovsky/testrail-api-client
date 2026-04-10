# CODEMAP

Auto-generated symbol index. Run `npm run codemap` to regenerate.

## API Endpoint Methods (`src/client.ts`)

| Method                       | HTTP | Endpoint                                      | Line                        |
| ---------------------------- | ---- | --------------------------------------------- | --------------------------- |
| `getProject`                 | GET  | `get_project/${projectId}`                    | [87](src/client.ts#L87)     |
| `getProjects`                | GET  | `get_projects&...`                            | [97](src/client.ts#L97)     |
| `addProject`                 | POST | `add_project`                                 | [108](src/client.ts#L108)   |
| `updateProject`              | POST | `update_project/${projectId}`                 | [117](src/client.ts#L117)   |
| `deleteProject`              | POST | `delete_project/${projectId}`                 | [127](src/client.ts#L127)   |
| `getSuite`                   | GET  | `get_suite/${suiteId}`                        | [139](src/client.ts#L139)   |
| `getSuites`                  | GET  | `get_suites/${projectId}`                     | [149](src/client.ts#L149)   |
| `addSuite`                   | POST | `add_suite/${projectId}`                      | [159](src/client.ts#L159)   |
| `updateSuite`                | POST | `update_suite/${suiteId}`                     | [169](src/client.ts#L169)   |
| `deleteSuite`                | POST | `delete_suite/${suiteId}`                     | [179](src/client.ts#L179)   |
| `getSection`                 | GET  | `get_section/${sectionId}`                    | [191](src/client.ts#L191)   |
| `getSections`                | GET  | `get_sections/${projectId}&...`               | [204](src/client.ts#L204)   |
| `addSection`                 | POST | `add_section/${projectId}`                    | [224](src/client.ts#L224)   |
| `updateSection`              | POST | `update_section/${sectionId}`                 | [234](src/client.ts#L234)   |
| `deleteSection`              | POST | `delete_section/${sectionId}`                 | [244](src/client.ts#L244)   |
| `getCase`                    | GET  | `get_case/${caseId}`                          | [256](src/client.ts#L256)   |
| `getCases`                   | GET  | `get_cases/${projectId}&...`                  | [270](src/client.ts#L270)   |
| `addCase`                    | POST | `add_case/${sectionId}`                       | [298](src/client.ts#L298)   |
| `updateCase`                 | POST | `update_case/${caseId}`                       | [308](src/client.ts#L308)   |
| `deleteCase`                 | POST | `delete_case/${caseId}`                       | [318](src/client.ts#L318)   |
| `getPlan`                    | GET  | `get_plan/${planId}`                          | [330](src/client.ts#L330)   |
| `getPlans`                   | GET  | `get_plans/${projectId}&...`                  | [343](src/client.ts#L343)   |
| `addPlan`                    | POST | `add_plan/${projectId}`                       | [364](src/client.ts#L364)   |
| `updatePlan`                 | POST | `update_plan/${planId}`                       | [374](src/client.ts#L374)   |
| `closePlan`                  | POST | `close_plan/${planId}`                        | [384](src/client.ts#L384)   |
| `deletePlan`                 | POST | `delete_plan/${planId}`                       | [394](src/client.ts#L394)   |
| `addPlanEntry`               | POST | `add_plan_entry/${planId}`                    | [404](src/client.ts#L404)   |
| `updatePlanEntry`            | POST | `update_plan_entry/${planId}/${entryId}`      | [414](src/client.ts#L414)   |
| `deletePlanEntry`            | POST | `delete_plan_entry/${planId}/${entryId}`      | [425](src/client.ts#L425)   |
| `getRun`                     | GET  | `get_run/${runId}`                            | [438](src/client.ts#L438)   |
| `getRuns`                    | GET  | `get_runs/${projectId}&...`                   | [451](src/client.ts#L451)   |
| `addRun`                     | POST | `add_run/${projectId}`                        | [486](src/client.ts#L486)   |
| `updateRun`                  | POST | `update_run/${runId}`                         | [496](src/client.ts#L496)   |
| `closeRun`                   | POST | `close_run/${runId}`                          | [506](src/client.ts#L506)   |
| `deleteRun`                  | POST | `delete_run/${runId}`                         | [516](src/client.ts#L516)   |
| `getTest`                    | GET  | `get_test/${testId}`                          | [528](src/client.ts#L528)   |
| `getTests`                   | GET  | `get_tests/${runId}&...`                      | [540](src/client.ts#L540)   |
| `getResults`                 | GET  | `get_results/${testId}&...`                   | [562](src/client.ts#L562)   |
| `getResultsForCase`          | GET  | `get_results_for_case/${runId}/${caseId}&...` | [586](src/client.ts#L586)   |
| `getResultsForRun`           | GET  | `get_results_for_run/${runId}&...`            | [610](src/client.ts#L610)   |
| `addResult`                  | POST | `add_result/${testId}`                        | [630](src/client.ts#L630)   |
| `addResultForCase`           | POST | `add_result_for_case/${runId}/${caseId}`      | [640](src/client.ts#L640)   |
| `addResultsForCases`         | POST | `add_results_for_cases/${runId}`              | [651](src/client.ts#L651)   |
| `getMilestone`               | GET  | `get_milestone/${milestoneId}`                | [663](src/client.ts#L663)   |
| `getMilestones`              | GET  | `get_milestones/${projectId}&...`             | [675](src/client.ts#L675)   |
| `addMilestone`               | POST | `add_milestone/${projectId}`                  | [692](src/client.ts#L692)   |
| `updateMilestone`            | POST | `update_milestone/${milestoneId}`             | [702](src/client.ts#L702)   |
| `deleteMilestone`            | POST | `delete_milestone/${milestoneId}`             | [712](src/client.ts#L712)   |
| `getUser`                    | GET  | `get_user/${userId}`                          | [724](src/client.ts#L724)   |
| `getUserByEmail`             | GET  | `get_user_by_email&...`                       | [734](src/client.ts#L734)   |
| `getUsers`                   | GET  | `get_current_user`                            | [752](src/client.ts#L752)   |
| `getCurrentUser`             | GET  | `get_current_user`                            | [769](src/client.ts#L769)   |
| `getStatuses`                | GET  | `get_statuses`                                | [779](src/client.ts#L779)   |
| `getPriorities`              | GET  | `get_priorities`                              | [789](src/client.ts#L789)   |
| `getResultFields`            | GET  | `get_result_fields`                           | [799](src/client.ts#L799)   |
| `getCaseFields`              | GET  | `get_case_fields`                             | [809](src/client.ts#L809)   |
| `getCaseTypes`               | GET  | `get_case_types`                              | [817](src/client.ts#L817)   |
| `getTemplates`               | GET  | `get_templates/${projectId}`                  | [828](src/client.ts#L828)   |
| `getConfigurations`          | GET  | `get_configs/${projectId}`                    | [840](src/client.ts#L840)   |
| `addConfigurationGroup`      | POST | `add_config_group/${projectId}`               | [850](src/client.ts#L850)   |
| `updateConfigurationGroup`   | POST | `update_config_group/${configGroupId}`        | [860](src/client.ts#L860)   |
| `deleteConfigurationGroup`   | POST | `delete_config_group/${configGroupId}`        | [873](src/client.ts#L873)   |
| `addConfiguration`           | POST | `add_config/${configGroupId}`                 | [883](src/client.ts#L883)   |
| `updateConfiguration`        | POST | `update_config/${configId}`                   | [893](src/client.ts#L893)   |
| `deleteConfiguration`        | POST | `delete_config/${configId}`                   | [903](src/client.ts#L903)   |
| `addUser`                    | POST | `add_user`                                    | [914](src/client.ts#L914)   |
| `updateUser`                 | POST | `update_user/${userId}`                       | [923](src/client.ts#L923)   |
| `getRoles`                   | GET  | `get_roles`                                   | [934](src/client.ts#L934)   |
| `getGroup`                   | GET  | `get_group/${groupId}`                        | [945](src/client.ts#L945)   |
| `getGroups`                  | GET  | `get_groups`                                  | [954](src/client.ts#L954)   |
| `addGroup`                   | POST | `add_group`                                   | [962](src/client.ts#L962)   |
| `updateGroup`                | POST | `update_group/${groupId}`                     | [971](src/client.ts#L971)   |
| `deleteGroup`                | POST | `delete_group/${groupId}`                     | [981](src/client.ts#L981)   |
| `getAttachmentsForCase`      | GET  | `get_attachments_for_case/${caseId}`          | [993](src/client.ts#L993)   |
| `getAttachmentsForRun`       | GET  | `get_attachments_for_run/${runId}`            | [1004](src/client.ts#L1004) |
| `getAttachmentsForTest`      | GET  | `get_attachments_for_test/${testId}`          | [1015](src/client.ts#L1015) |
| `getAttachmentsForPlan`      | GET  | `get_attachments_for_plan/${planId}`          | [1026](src/client.ts#L1026) |
| `getAttachmentsForPlanEntry` | ?    | `?`                                           | [1037](src/client.ts#L1037) |
| `getAttachment`              | ?    | `?`                                           | [1053](src/client.ts#L1053) |
| `addAttachmentToCase`        | ?    | `?`                                           | [1063](src/client.ts#L1063) |
| `addAttachmentToResult`      | ?    | `?`                                           | [1077](src/client.ts#L1077) |
| `addAttachmentToRun`         | ?    | `?`                                           | [1091](src/client.ts#L1091) |
| `addAttachmentToPlan`        | ?    | `?`                                           | [1105](src/client.ts#L1105) |
| `addAttachmentToPlanEntry`   | POST | `delete_attachment/${attachmentId}`           | [1119](src/client.ts#L1119) |
| `deleteAttachment`           | POST | `delete_attachment/${attachmentId}`           | [1135](src/client.ts#L1135) |
| `getSharedStep`              | GET  | `get_shared_step/${sharedStepId}`             | [1147](src/client.ts#L1147) |
| `getSharedSteps`             | GET  | `get_shared_steps/${projectId}`               | [1157](src/client.ts#L1157) |
| `addSharedStep`              | POST | `add_shared_step/${projectId}`                | [1167](src/client.ts#L1167) |
| `updateSharedStep`           | POST | `update_shared_step/${sharedStepId}`          | [1177](src/client.ts#L1177) |
| `deleteSharedStep`           | POST | `delete_shared_step/${sharedStepId}`          | [1187](src/client.ts#L1187) |
| `getVariables`               | GET  | `get_variables/${projectId}`                  | [1199](src/client.ts#L1199) |
| `addVariable`                | POST | `add_variable/${projectId}`                   | [1209](src/client.ts#L1209) |
| `updateVariable`             | POST | `update_variable/${variableId}`               | [1219](src/client.ts#L1219) |
| `deleteVariable`             | POST | `delete_variable/${variableId}`               | [1229](src/client.ts#L1229) |
| `getDataset`                 | GET  | `get_dataset/${datasetId}`                    | [1241](src/client.ts#L1241) |
| `getDatasets`                | GET  | `get_datasets/${projectId}`                   | [1251](src/client.ts#L1251) |
| `addDataset`                 | POST | `add_dataset/${projectId}`                    | [1261](src/client.ts#L1261) |
| `updateDataset`              | POST | `update_dataset/${datasetId}`                 | [1271](src/client.ts#L1271) |
| `deleteDataset`              | POST | `delete_dataset/${datasetId}`                 | [1281](src/client.ts#L1281) |
| `getReports`                 | GET  | `get_reports/${projectId}`                    | [1293](src/client.ts#L1293) |
| `runReport`                  | GET  | `run_report/${reportTemplateId}`              | [1303](src/client.ts#L1303) |

## Core Infrastructure (`src/client-core.ts`)

| Symbol          | Line                           |
| --------------- | ------------------------------ |
| `constructor`   | [99](src/client-core.ts#L99)   |
| `validateId`    | [289](src/client-core.ts#L289) |
| `buildEndpoint` | [328](src/client-core.ts#L328) |
| `clearCache`    | [383](src/client-core.ts#L383) |
| `destroy`       | [428](src/client-core.ts#L428) |
| `request`       | [455](src/client-core.ts#L455) |

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

| Type                              | Line                     |
| --------------------------------- | ------------------------ |
| `TestRailConfig`                  | [4](src/types.ts#L4)     |
| `PaginatedResponse`               | [43](src/types.ts#L43)   |
| `Case`                            | [56](src/types.ts#L56)   |
| `Suite`                           | [77](src/types.ts#L77)   |
| `AddSuitePayload`                 | [89](src/types.ts#L89)   |
| `UpdateSuitePayload`              | [94](src/types.ts#L94)   |
| `Section`                         | [99](src/types.ts#L99)   |
| `Project`                         | [109](src/types.ts#L109) |
| `Plan`                            | [121](src/types.ts#L121) |
| `PlanEntry`                       | [148](src/types.ts#L148) |
| `Run`                             | [160](src/types.ts#L160) |
| `Test`                            | [192](src/types.ts#L192) |
| `Result`                          | [209](src/types.ts#L209) |
| `Milestone`                       | [224](src/types.ts#L224) |
| `User`                            | [240](src/types.ts#L240) |
| `Status`                          | [249](src/types.ts#L249) |
| `Priority`                        | [261](src/types.ts#L261) |
| `AddCasePayload`                  | [269](src/types.ts#L269) |
| `UpdateCasePayload`               | [280](src/types.ts#L280) |
| `AddPlanPayload`                  | [291](src/types.ts#L291) |
| `UpdatePlanPayload`               | [298](src/types.ts#L298) |
| `AddPlanEntryPayload`             | [305](src/types.ts#L305) |
| `UpdatePlanEntryPayload`          | [316](src/types.ts#L316) |
| `AddRunPayload`                   | [327](src/types.ts#L327) |
| `UpdateRunPayload`                | [338](src/types.ts#L338) |
| `AddResultPayload`                | [348](src/types.ts#L348) |
| `AddResultsForCasesPayload`       | [359](src/types.ts#L359) |
| `AddResultForCasePayload`         | [363](src/types.ts#L363) |
| `AddSectionPayload`               | [367](src/types.ts#L367) |
| `UpdateSectionPayload`            | [374](src/types.ts#L374) |
| `AddMilestonePayload`             | [379](src/types.ts#L379) |
| `UpdateMilestonePayload`          | [390](src/types.ts#L390) |
| `GetRunsOptions`                  | [403](src/types.ts#L403) |
| `ResultFieldConfig`               | [424](src/types.ts#L424) |
| `ResultField`                     | [438](src/types.ts#L438) |
| `CaseFieldConfig`                 | [460](src/types.ts#L460) |
| `CaseField`                       | [475](src/types.ts#L475) |
| `CaseType`                        | [495](src/types.ts#L495) |
| `Template`                        | [504](src/types.ts#L504) |
| `Configuration`                   | [513](src/types.ts#L513) |
| `ConfigurationGroup`              | [520](src/types.ts#L520) |
| `AddConfigurationGroupPayload`    | [527](src/types.ts#L527) |
| `UpdateConfigurationGroupPayload` | [532](src/types.ts#L532) |
| `AddConfigurationPayload`         | [537](src/types.ts#L537) |
| `UpdateConfigurationPayload`      | [542](src/types.ts#L542) |
| `CacheEntry`                      | [547](src/types.ts#L547) |
| `RateLimiterConfig`               | [552](src/types.ts#L552) |
| `AddProjectPayload`               | [557](src/types.ts#L557) |
| `UpdateProjectPayload`            | [564](src/types.ts#L564) |
| `GetPlansOptions`                 | [575](src/types.ts#L575) |
| `GetTestsOptions`                 | [595](src/types.ts#L595) |
| `GetResultsOptions`               | [608](src/types.ts#L608) |
| `GetMilestonesOptions`            | [626](src/types.ts#L626) |
| `AddUserPayload`                  | [638](src/types.ts#L638) |
| `UpdateUserPayload`               | [652](src/types.ts#L652) |
| `Role`                            | [668](src/types.ts#L668) |
| `Group`                           | [680](src/types.ts#L680) |
| `AddGroupPayload`                 | [690](src/types.ts#L690) |
| `UpdateGroupPayload`              | [698](src/types.ts#L698) |
| `Attachment`                      | [708](src/types.ts#L708) |
| `SharedStep`                      | [728](src/types.ts#L728) |
| `AddSharedStepPayload`            | [750](src/types.ts#L750) |
| `UpdateSharedStepPayload`         | [758](src/types.ts#L758) |
| `Variable`                        | [768](src/types.ts#L768) |
| `AddVariablePayload`              | [776](src/types.ts#L776) |
| `UpdateVariablePayload`           | [782](src/types.ts#L782) |
| `Dataset`                         | [790](src/types.ts#L790) |
| `AddDatasetPayload`               | [804](src/types.ts#L804) |
| `UpdateDatasetPayload`            | [810](src/types.ts#L810) |
| `Report`                          | [818](src/types.ts#L818) |
| `ReportResult`                    | [830](src/types.ts#L830) |
