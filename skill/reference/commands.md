# `testrail` command reference

Every resource:action the CLI exposes, and every option the parser accepts.
Read this when you need the full surface; `SKILL.md` carries the policy you
need before acting.

## Command surface

Compact table legend:

- `Mode`: `R` read, `W` write, `D` destructive write (`--yes` + env gate).
- `Input`: `-` none, `none` write with no body, `none+yes` destructive no-body,
  `file`, `out:text`, `out:binary`, or a payload schema name.

<!-- GENERATED:command-table -->
| Cmd | Mode | Args | Input |
| --- | --- | --- | --- |
| `project get` | R | `<project_id>` | - |
| `project list` | R | - | - |
| `suite get` | R | `<suite_id>` | - |
| `suite list` | R | `--project-id <id>` | - |
| `case get` | R | `<case_id>` | - |
| `case list` | R | `--project-id <id>` | - |
| `case history` | R | `<case_id>` | - |
| `case titles` | R | `<case_ids>` | - |
| `run get` | R | `<run_id>` | - |
| `run list` | R | `--project-id <id>` | - |
| `run watch` | R | `<run_id>` | - |
| `test get` | R | `<test_id>` | - |
| `test list` | R | `<run_id>` | - |
| `result list` | R | `--run-id <id>` | - |
| `result list-for-test` | R | `<test_id>` | - |
| `result list-for-case` | R | `<run_id>` `<case_id>` | - |
| `milestone get` | R | `<milestone_id>` | - |
| `milestone list` | R | `--project-id <id>` | - |
| `user get` | R | `<user_id>` | - |
| `user list` | R | - | - |
| `user get-by-email` | R | `--user-email <email>` | - |
| `user get-current` | R | - | - |
| `plan get` | R | `<plan_id>` | - |
| `plan list` | R | `--project-id <id>` | - |
| `section get` | R | `<section_id>` | - |
| `section list` | R | `<project_id>` | - |
| `case add` | W | `<section_id>` | AddCasePayloadSchema |
| `case add-bulk` | W | `<section_id>` | AddCasesBulkPayloadSchema |
| `case update` | W | `<case_id>` | UpdateCasePayloadSchema |
| `case update-bulk` | W | `<suite_id>` | UpdateCasesPayloadSchema |
| `case delete` | D | `<case_id>` | none+yes |
| `case delete-bulk` | D | `<suite_id>` `--project-id <id>` | DeleteCasesPayloadSchema |
| `case copy-to-section` | W | `<section_id>` | CopyCasesToSectionPayloadSchema |
| `case move-to-section` | W | `<section_id>` | MoveCasesToSectionPayloadSchema |
| `run add` | W | `<project_id>` | AddRunPayloadSchema |
| `run update` | W | `<run_id>` | UpdateRunPayloadSchema |
| `run close` | D | `<run_id>` | none+yes |
| `run delete` | D | `<run_id>` | none+yes |
| `test update-labels` | W | `<test_id>` | UpdateTestLabelsPayloadSchema |
| `test update-labels-bulk` | W | - | UpdateTestsLabelsPayloadSchema |
| `result add` | W | `<run_id>` `<case_id>` | AddResultPayloadSchema |
| `result add-bulk` | W | `<run_id>` | AddResultsForCasesPayloadSchema |
| `result add-bulk-by-test` | W | `<run_id>` | AddResultsPayloadSchema |
| `result add-by-test` | W | `<test_id>` | AddResultPayloadSchema |
| `result edit` | W | `<result_id>` | EditResultPayloadSchema |
| `plan add` | W | `<project_id>` | AddPlanPayloadSchema |
| `plan update` | W | `<plan_id>` | UpdatePlanPayloadSchema |
| `plan add-entry` | W | `<plan_id>` | AddPlanEntryPayloadSchema |
| `plan add-run-to-entry` | W | `<plan_id>` `<entry_id>` | AddRunToPlanEntryPayloadSchema |
| `plan update-entry` | W | `<plan_id>` `<entry_id>` | UpdatePlanEntryPayloadSchema |
| `plan update-run-in-entry` | W | `<run_id>` | UpdateRunInPlanEntryPayloadSchema |
| `plan close` | D | `<plan_id>` | none+yes |
| `plan delete` | D | `<plan_id>` | none+yes |
| `plan delete-entry` | D | `<plan_id>` `<entry_id>` | none+yes |
| `plan delete-run-from-entry` | D | `<run_id>` | none+yes |
| `section add` | W | `<project_id>` | AddSectionPayloadSchema |
| `section update` | W | `<section_id>` | UpdateSectionPayloadSchema |
| `section move` | W | `<section_id>` | MoveSectionPayloadSchema |
| `section delete` | D | `<section_id>` | none+yes |
| `project add` | W | - | AddProjectPayloadSchema |
| `project update` | W | `<project_id>` | UpdateProjectPayloadSchema |
| `project delete` | D | `<project_id>` | none+yes |
| `suite add` | W | `<project_id>` | AddSuitePayloadSchema |
| `suite update` | W | `<suite_id>` | UpdateSuitePayloadSchema |
| `suite delete` | D | `<suite_id>` | none+yes |
| `milestone add` | W | `<project_id>` | AddMilestonePayloadSchema |
| `milestone update` | W | `<milestone_id>` | UpdateMilestonePayloadSchema |
| `milestone delete` | D | `<milestone_id>` | none+yes |
| `user add` | W | - | UserAddPayloadSchema |
| `user update` | W | `<user_id>` | UserUpdatePayloadSchema |
| `shared-step get` | R | `<shared_step_id>` | - |
| `shared-step list` | R | `--project-id <id>` | - |
| `shared-step history` | R | `<shared_step_id>` | - |
| `report list` | R | `<project_id>` | - |
| `report run` | R | `<report_template_id>` | - |
| `report list-cross-project` | R | - | - |
| `report run-cross-project` | R | `<report_template_id>` | - |
| `shared-step add` | W | `<project_id>` | AddSharedStepPayloadSchema |
| `shared-step update` | W | `<shared_step_id>` | UpdateSharedStepPayloadSchema |
| `shared-step delete` | D | `<shared_step_id>` | none+yes |
| `case-status list` | R | - | - |
| `case-field list` | R | - | - |
| `result-field list` | R | - | - |
| `status list` | R | - | - |
| `template list` | R | `<project_id>` | - |
| `role list` | R | - | - |
| `priority list` | R | - | - |
| `case-type list` | R | - | - |
| `version get` | R | - | - |
| `dynamic-filter-field list` | R | `<project_id>` | - |
| `case-field add` | W | - | AddCaseFieldPayloadSchema |
| `attachment list-for-case` | R | `<case_id>` | - |
| `attachment list-for-run` | R | `<run_id>` | - |
| `attachment list-for-test` | R | `<test_id>` | - |
| `attachment list-for-plan` | R | `<plan_id>` | - |
| `attachment list-for-plan-entry` | R | `<plan_id>` `<entry_id>` | - |
| `attachment get` | R | `<attachment_id>` `--out <path\|->` | out:binary |
| `attachment add-to-case` | W | `<case_id>` `--file <path\|->` | file |
| `attachment add-to-result` | W | `<result_id>` `--file <path\|->` | file |
| `attachment add-to-run` | W | `<run_id>` `--file <path\|->` | file |
| `attachment add-to-plan` | W | `<plan_id>` `--file <path\|->` | file |
| `attachment add-to-plan-entry` | W | `<plan_id>` `<entry_id>` `--file <path\|->` | file |
| `attachment delete` | D | `<attachment_id>` | none+yes |
| `bdd get` | R | `<case_id>` `--out <path\|->` | out:text |
| `bdd list` | R | `--project-id <id>` | - |
| `bdd add` | W | `<section_id>` `--file <path\|->` | file |
| `bdd update` | W | `<case_id>` `--file <path\|->` | file |
| `variable list` | R | `<project_id>` | - |
| `variable add` | W | `<project_id>` | AddVariablePayloadSchema |
| `variable update` | W | `<variable_id>` | UpdateVariablePayloadSchema |
| `variable delete` | D | `<variable_id>` | none+yes |
| `group get` | R | `<group_id>` | - |
| `group list` | R | - | - |
| `group add` | W | - | AddGroupPayloadSchema |
| `group update` | W | `<group_id>` | UpdateGroupPayloadSchema |
| `group delete` | D | `<group_id>` | none+yes |
| `dataset get` | R | `<dataset_id>` | - |
| `dataset list` | R | `<project_id>` | - |
| `dataset add` | W | `<project_id>` | AddDatasetPayloadSchema |
| `dataset update` | W | `<dataset_id>` | UpdateDatasetPayloadSchema |
| `dataset delete` | D | `<dataset_id>` | none+yes |
| `configuration list` | R | `<project_id>` | - |
| `configuration-group add` | W | `<project_id>` | AddConfigurationGroupPayloadSchema |
| `configuration-group update` | W | `<config_group_id>` | UpdateConfigurationGroupPayloadSchema |
| `configuration-group delete` | D | `<config_group_id>` | none+yes |
| `configuration add` | W | `<config_group_id>` | AddConfigurationPayloadSchema |
| `configuration update` | W | `<config_id>` | UpdateConfigurationPayloadSchema |
| `configuration delete` | D | `<config_id>` | none+yes |
| `label get` | R | `<label_id>` | - |
| `label list` | R | `<project_id>` | - |
| `label add` | W | `<project_id>` | AddLabelPayloadSchema |
| `label update` | W | `<label_id>` | UpdateLabelPayloadSchema |
| `label delete` | D | `<label_id>` | none+yes |
| `label delete-bulk` | D | - | DeleteLabelsPayloadSchema |
<!-- /GENERATED:command-table -->

## CLI option reference

Use the `Applies to` column to avoid passing a recognized option to an
action that does not consume it. This table is generated from the same typed
registry as `testrail --help`, so every parser-recognized option is present.

Flags are checked before authentication, stdin reads, or API calls. Every
string flag needs a value; a following argument beginning with `--` and at
least one more character is rejected, including misspelled flags and earlier
occurrences of repeated options. For example, `--filename --dry-run` fails
instead of uploading a file with the preview flag consumed as its name.
Pass a literal value beginning with `--` inline, such as `--filter=--all`.
Shell quoting alone (`--filter '--all'`) does not change this rule. Boolean
flags take no value: use `--strict-responses`, not `--strict-responses=true`.

<!-- GENERATED:option-reference -->
| Option | Applies to | Agent guidance |
| --- | --- | --- |
| `--base-url <url>` | All API commands | TestRail base URL; overrides TESTRAIL_BASE_URL. |
| `--email <email>` | All API commands | Authentication email; overrides TESTRAIL_EMAIL. It is not the user lookup filter. |
| `--user-email <email>` | user get-by-email | Email address of the user to look up without changing the authentication identity. |
| `--api-key-stdin` | All API commands | Read one API key from piped stdin. It cannot share stdin with a JSON body or --file -; prefer TESTRAIL_API_KEY. |
| `--format <json\|table\|yaml\|csv>` | Commands that emit structured output | Select output format; default json. Binary/text --out files are not reformatted. |
| `--timeout <ms>` | All API commands | Per-attempt timeout in milliseconds, covering DNS resolution as well as the request; overrides TESTRAIL_TIMEOUT. Default 30000, maximum 300000. |
| `--strict-responses` | All API commands | Fail on the first response-schema mismatch instead of emitting advisory warnings. |
| `--diagnostic-file <path>` | All API commands | Save bounded, redacted error JSON to a new private file. Existing paths are rejected before dispatch; success leaves no file. |
| `--quiet` | All commands | Suppress normal output and advisory warnings; rely on the exit code. |
| `--help` | Top level | Print CLI help and exit. |
| `--version` | Top level | Print the package CLI version and exit. |
| `--project-id <id>` | case, suite, run, plan, milestone, shared-step, user, and bdd lists; case delete-bulk | Select the TestRail project for actions whose endpoint does not carry project_id positionally. |
| `--suite-id <ids>` | case, section, bdd, and run list actions | Filter by suite. run list accepts comma-separated IDs; other consumers require one ID. |
| `--section-id <id>` | case list; bdd list | Filter results to one section. |
| `--run-id <id>` | result list | Select the run whose results should be listed. |
| `--type-id <ids>` | case list | Filter by comma-separated case type IDs. |
| `--priority-id <ids>` | case list | Filter by comma-separated priority IDs. |
| `--template-id <ids>` | case list | Filter by comma-separated template IDs. |
| `--milestone-id <ids>` | case, run, and plan list actions | Filter by comma-separated milestone IDs. |
| `--created-after <timestamp>` | case, run, plan, and shared-step lists; result list | Return entities created after this Unix timestamp. |
| `--created-before <timestamp>` | case, run, plan, and shared-step lists; result list | Return entities created before this Unix timestamp. |
| `--created-by <ids>` | case, run, plan, and shared-step lists; result list | Filter by comma-separated creator user IDs. |
| `--updated-after <timestamp>` | case list; shared-step list | Return entities updated after this Unix timestamp. |
| `--updated-before <timestamp>` | case list; shared-step list | Return entities updated before this Unix timestamp. |
| `--updated-by <ids>` | case list | Filter by comma-separated updater user IDs. |
| `--label-id <ids>` | case, bdd, and test list actions | Filter by comma-separated label IDs. |
| `--refs <refs>` | case, bdd, run, plan, and shared-step list actions | Filter by references. case and bdd lists accept comma-separated TestRail 10.7 refs; run, plan, and shared-step lists accept one reference. |
| `--filter <text>` | case list | Filter by case-title substring. |
| `--include-plan-runs` | run list | Include runs owned by test plans. |
| `--is-completed <true\|false\|1\|0>` | project, run, plan, and milestone list actions | Filter by completion state. |
| `--is-started <true\|false\|1\|0>` | milestone list | Filter milestones by started state. |
| `--with-data <0\|1>` | test get | Request the enriched test projection with 1, or the ordinary response with 0. |
| `--limit <n>` | Supported list actions in default or --page mode | Maximum items requested from one response; incompatible with --all. |
| `--offset <n>` | Supported list actions in default or --page mode | Zero-based response offset; incompatible with --all. |
| `--page` | Registered paginated list actions | Return one strict page envelope with items and pagination metadata; incompatible with --all. |
| `--all` | Registered paginated list actions | Follow validated continuations and return one bounded item array; incompatible with --page/--limit/--offset. |
| `--page-size <n>` | --all on request-controlled paginated actions | Per-request page size; default and maximum 250. |
| `--start-offset <n>` | --all on request-controlled paginated actions | Initial aggregate offset; default 0. |
| `--max-pages <n>` | --all | Maximum pages fetched; default 100. |
| `--max-items <n>` | --all | Maximum accumulated items; default 25000. |
| `--max-duration-ms <ms>` | --all | Aggregate wall-clock deadline; default and maximum 300000. |
| `--max-bytes <bytes>` | --all | Maximum serialized aggregate size; default 104857600, hard maximum 1073741824. |
| `--status-id <ids>` | test list; result list/list-for-test/list-for-case | Filter by comma-separated TestRail status IDs. |
| `--defects-filter <text>` | result list/list-for-test/list-for-case | Filter results whose defects field contains the supplied substring. |
| `--data <json>` | Body-bearing write actions | Provide an inline JSON body. Exactly one of --data, --data-file, or piped JSON stdin is required. |
| `--data-file <path>` | Body-bearing write actions | Read the JSON body from a file; useful for large payloads and secrets. |
| `--dry-run` | Write and file-output actions; run watch | Validate and preview locally without an API call. It bypasses destructive confirmation gates. |
| `--file <path\|->` | Attachment uploads; bdd add/update | Read upload content from a file, or from piped stdin with '-'. |
| `--filename <name>` | File-input actions | Override the uploaded filename; defaults to the local basename or stdin. |
| `--out <path\|->` | attachment get; bdd get | Write downloaded bytes/text to a file, or stream them to stdout with '-'. |
| `--force` | File-output actions; install-skill | Overwrite an existing output file or installed SKILL.md. |
| `--yes` | Destructive actions | Per-invocation confirmation; real destructive calls also require TESTRAIL_ALLOW_DESTRUCTIVE=1. |
| `--soft` | case delete/delete-bulk; run, section, and suite delete | Request TestRail server-side deletion preview. It still calls the API and requires both destructive gates. |
| `--keep-in-cases <true\|false\|1\|0>` | shared-step delete | Choose whether deleted shared-step content remains in referencing cases; TestRail defaults to true. |
| `--interval <seconds>` | run watch | Polling interval; default 30, minimum 5, maximum 600. |
| `--once` | run watch | Poll once and exit instead of waiting for completion. |
| `--global` | install-skill; uninstall-skill | Use the user-level skill directory instead of the current project. |
| `--print-path` | install-skill | Print the bundled SKILL.md path and exit without installing. |
<!-- /GENERATED:option-reference -->
