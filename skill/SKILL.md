---
name: testrail-cli
description: Use the `testrail` CLI to query and write TestRail projects, suites, cases, runs, plans, results, milestones, and users from the shell. Trigger when the user asks to look up, list, fetch, count, inspect, create, update, or publish TestRail entities, or when TESTRAIL_BASE_URL / TESTRAIL_EMAIL / TESTRAIL_API_KEY are set in the environment.
version: 2.1.0
license: MIT
homepage: https://github.com/dichovsky/testrail-api-client
---

# `testrail` CLI

A zero-dependency Node CLI for the TestRail REST API. Covers query (`get`,
`list`) and write (`add`, `update`, `add-bulk`, `add-entry`, `close`)
operations across projects, suites, cases, runs, plans, results,
milestones, and users.

This skill is designed for **coding agents** running shell commands. It is
not a TestRail user manual. For the browser UI, see TestRail's own docs.

## When to use this skill

- The user mentions TestRail by name, or asks about test cases, test runs,
  test results, or test plans in a TestRail context.
- `TESTRAIL_BASE_URL` / `TESTRAIL_EMAIL` / `TESTRAIL_API_KEY` are set in the
  environment.
- The user wants to: look up, list, fetch, count, inspect, create, update,
  or publish TestRail entities from the shell or from CI.

## Install / verify

The CLI ships with the npm package `@dichovsky/testrail-api-client` and
exposes the `testrail` binary. Verify it is available:

```bash
npx testrail --version
```

If you installed the package locally, `npx testrail` runs the local copy
without a global install.

## Authentication

The CLI requires three credentials. Environment variables are the only
recommended channel for the API key (CTF #11, v3.0):

| Purpose       | Env var             | Flag                                                                  |
| ------------- | ------------------- | --------------------------------------------------------------------- |
| TestRail URL  | `TESTRAIL_BASE_URL` | `--base-url <url>`                                                    |
| Account email | `TESTRAIL_EMAIL`    | `--email <email>`                                                     |
| API key       | `TESTRAIL_API_KEY`  | `--api-key-stdin` (pipe key on stdin; `--api-key <key>` removed v3.0) |

`--api-key <key>` was removed in v3.0 because argv is visible to other
processes via `/proc/<pid>/cmdline`, shell history, CI step logs,
container audit trails, and crash dumps. If you can't use the env var,
pipe the key: `echo "$KEY" | testrail ... --api-key-stdin`. Note that
`--api-key-stdin` consumes stdin, so JSON bodies for write actions must
come from `--data` or `--data-file`, not stdin.

If credentials are missing, the CLI exits 1 with `Error: Missing auth...`
on stderr. Never echo or log the API key.

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
| `suite list` | R | - | - |
| `case get` | R | `<case_id>` | - |
| `case list` | R | - | - |
| `case history` | R | `<case_id>` | - |
| `run get` | R | `<run_id>` | - |
| `run list` | R | - | - |
| `run watch` | R | `<run_id>` | - |
| `test get` | R | `<test_id>` | - |
| `test list` | R | `<run_id>` | - |
| `result list` | R | - | - |
| `result list-for-test` | R | `<test_id>` | - |
| `result list-for-case` | R | `<run_id>` `<case_id>` | - |
| `milestone get` | R | `<milestone_id>` | - |
| `milestone list` | R | - | - |
| `user get` | R | `<user_id>` | - |
| `user list` | R | - | - |
| `user get-by-email` | R | - | - |
| `user get-current` | R | - | - |
| `plan get` | R | `<plan_id>` | - |
| `plan list` | R | - | - |
| `section get` | R | `<section_id>` | - |
| `section list` | R | `<project_id>` | - |
| `case add` | W | `<section_id>` | AddCasePayloadSchema |
| `case add-bulk` | W | `<section_id>` | AddCasesBulkPayloadSchema |
| `case update` | W | `<case_id>` | UpdateCasePayloadSchema |
| `case update-bulk` | W | `<suite_id>` | UpdateCasesPayloadSchema |
| `case delete` | D | `<case_id>` | none+yes |
| `case delete-bulk` | D | `<suite_id>` | DeleteCasesPayloadSchema |
| `case copy-to-section` | W | `<section_id>` | CopyCasesToSectionPayloadSchema |
| `case move-to-section` | W | `<section_id>` | MoveCasesToSectionPayloadSchema |
| `run add` | W | `<project_id>` | AddRunPayloadSchema |
| `run update` | W | `<run_id>` | UpdateRunPayloadSchema |
| `run close` | D | `<run_id>` | none+yes |
| `run delete` | D | `<run_id>` | none+yes |
| `result add` | W | `<run_id>` `<case_id>` | AddResultPayloadSchema |
| `result add-bulk` | W | `<run_id>` | AddResultsForCasesPayloadSchema |
| `result add-bulk-by-test` | W | `<run_id>` | AddResultsPayloadSchema |
| `result add-by-test` | W | `<test_id>` | AddResultPayloadSchema |
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
| `shared-step list` | R | - | - |
| `shared-step history` | R | `<shared_step_id>` | - |
| `report list` | R | `<project_id>` | - |
| `report run` | R | `<report_template_id>` | - |
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
| `case-field add` | W | - | AddCaseFieldPayloadSchema |
| `attachment list-for-case` | R | `<case_id>` | - |
| `attachment list-for-run` | R | `<run_id>` | - |
| `attachment list-for-test` | R | `<test_id>` | - |
| `attachment list-for-plan` | R | `<plan_id>` | - |
| `attachment list-for-plan-entry` | R | `<plan_id>` `<entry_id>` | - |
| `attachment get` | R | `<attachment_id>` | out:binary |
| `attachment add-to-case` | W | `<case_id>` | file |
| `attachment add-to-result` | W | `<result_id>` | file |
| `attachment add-to-run` | W | `<run_id>` | file |
| `attachment add-to-plan` | W | `<plan_id>` | file |
| `attachment add-to-plan-entry` | W | `<plan_id>` `<entry_id>` | file |
| `attachment delete` | D | `<attachment_id>` | none+yes |
| `bdd get` | R | `<case_id>` | out:text |
| `bdd add` | W | `<case_id>` | file |
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
<!-- /GENERATED:command-table -->

## Body input for write actions

For body-bearing write actions (all except `run close`), provide the JSON
payload via **exactly one** of:

```bash
# (a) inline string — best for short payloads, agent-generated
testrail case add 5 --data '{"title":"New case"}'

# (b) file — best for large/repeated payloads, reviewable in git
testrail case add 5 --data-file payload.json

# (c) piped stdin — best for shell composition with jq / curl / etc.
echo '{"title":"New case"}' | testrail case add 5
```

The CLI exits 1 if zero or more than one body source is provided.
Stdin reads are capped at 1 MiB (v3.0); for larger payloads use
`--data-file` (file reads are not subject to the cap). Stdin is
unavailable for body input when `--api-key-stdin` is also passed —
fd 0 can only be consumed by one source per invocation.

### `--dry-run`

Add `--dry-run` to validate the payload against the Zod schema and print
what _would_ be sent, without making an API call. Useful for verifying
payload shape before consuming TestRail rate limit.

```bash
testrail case add 5 --data '{"title":"x"}' --dry-run
```

## Destructive operations

Every destructive CLI action (any `delete` plus `run close` / `plan close`) is
protected by a **two-gate model** as of v4.0.0. Both gates must be satisfied
before a destructive call reaches the API:

1. **`--yes` flag** — per-invocation explicit confirmation. Required on every
   destructive command. Missing `--yes` exits with code `1` and the message
   `Destructive action; pass --yes to confirm.`
2. **`TESTRAIL_ALLOW_DESTRUCTIVE=1` env var** — process-wide unlock. Must be
   set in the environment before invoking destructive commands. The env var
   must be **exactly** the string `'1'` — `'true'`, `'yes'`, `'on'`, `'1 '`
   (whitespace) are all rejected. Missing/wrong env value exits with code
   `2` (distinct from the generic `1`) so CI can distinguish "blocked by
   env gate" from "wrong flag / bad JSON / 4xx".

Either gate alone is insufficient.

```bash
# Blocked: --yes set, env var missing → exit code 2
testrail run delete 5 --yes

# Blocked: env var set, --yes missing → exit code 1
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5

# Proceeds: both gates satisfied
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes
```

**`--dry-run` bypasses BOTH gates.** Preview is non-destructive by definition
(no API call leaves the process), so CI agents can safely preview destructive
commands without unlocking either gate:

```bash
# Safe in any environment — no gates required, no API call made
testrail run delete 5 --dry-run
```

**Recommended CI pattern** — export the env var once at the top of the
destructive step, then run any number of destructive commands within that
step:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail run delete 5 --yes
testrail case delete 10 --yes
```

**`--soft` (server-side preview)** on soft-capable deletes (`case delete`,
`case delete-bulk`, `run delete`, `section delete`, `suite delete`) still
hits the API and remains gated by both `--yes` and
`TESTRAIL_ALLOW_DESTRUCTIVE=1`. Distinct from `--dry-run` which makes no
API call at all.

## Payload schemas

Each write action validates its body against a Zod schema with
`.passthrough()` — required fields must match types exactly (no
coercion; `"5"` is rejected where `5` is expected), and TestRail
`custom_*` fields pass through untouched.

Router pattern: use the compact index below first; open
`./reference/payload-schemas.yaml` only when you need full field-level details.

<!-- GENERATED:payload-schemas -->
```yaml
# compact schema index
schemas:
- {s: AddCasePayloadSchema, a: "case add", req: [title], opt: 7, ref: "./reference/payload-schemas.yaml#addcasepayloadschema"}
- {s: AddCasesBulkPayloadSchema, a: "case add-bulk", req: "schema_shape_unavailable", opt: "schema_shape_unavailable", ref: "./reference/payload-schemas.yaml#addcasesbulkpayloadschema"}
- {s: UpdateCasePayloadSchema, a: "case update", req: [], opt: 8, ref: "./reference/payload-schemas.yaml#updatecasepayloadschema"}
- {s: UpdateCasesPayloadSchema, a: "case update-bulk", req: [case_ids], opt: 8, ref: "./reference/payload-schemas.yaml#updatecasespayloadschema"}
- {s: DeleteCasesPayloadSchema, a: "case delete-bulk", req: [case_ids], opt: 0, ref: "./reference/payload-schemas.yaml#deletecasespayloadschema"}
- {s: CopyCasesToSectionPayloadSchema, a: "case copy-to-section", req: [case_ids], opt: 0, ref: "./reference/payload-schemas.yaml#copycasestosectionpayloadschema"}
- {s: MoveCasesToSectionPayloadSchema, a: "case move-to-section", req: [case_ids, suite_id], opt: 0, ref: "./reference/payload-schemas.yaml#movecasestosectionpayloadschema"}
- {s: AddRunPayloadSchema, a: "run add", req: [name], opt: 7, ref: "./reference/payload-schemas.yaml#addrunpayloadschema"}
- {s: UpdateRunPayloadSchema, a: "run update", req: [], opt: 7, ref: "./reference/payload-schemas.yaml#updaterunpayloadschema"}
- {s: AddResultPayloadSchema, a: "result add", req: [status_id], opt: 6, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
- {s: AddResultsForCasesPayloadSchema, a: "result add-bulk", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultsforcasespayloadschema"}
- {s: AddResultsPayloadSchema, a: "result add-bulk-by-test", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultspayloadschema"}
- {s: AddResultPayloadSchema, a: "result add-by-test", req: [status_id], opt: 6, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
- {s: AddPlanPayloadSchema, a: "plan add", req: [name], opt: 5, ref: "./reference/payload-schemas.yaml#addplanpayloadschema"}
- {s: UpdatePlanPayloadSchema, a: "plan update", req: [], opt: 6, ref: "./reference/payload-schemas.yaml#updateplanpayloadschema"}
- {s: AddPlanEntryPayloadSchema, a: "plan add-entry", req: [suite_id], opt: 10, ref: "./reference/payload-schemas.yaml#addplanentrypayloadschema"}
- {s: AddRunToPlanEntryPayloadSchema, a: "plan add-run-to-entry", req: [config_ids], opt: 5, ref: "./reference/payload-schemas.yaml#addruntoplanentrypayloadschema"}
- {s: UpdatePlanEntryPayloadSchema, a: "plan update-entry", req: [], opt: 11, ref: "./reference/payload-schemas.yaml#updateplanentrypayloadschema"}
- {s: UpdateRunInPlanEntryPayloadSchema, a: "plan update-run-in-entry", req: [], opt: 4, ref: "./reference/payload-schemas.yaml#updateruninplanentrypayloadschema"}
- {s: AddSectionPayloadSchema, a: "section add", req: [name], opt: 3, ref: "./reference/payload-schemas.yaml#addsectionpayloadschema"}
- {s: UpdateSectionPayloadSchema, a: "section update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesectionpayloadschema"}
- {s: MoveSectionPayloadSchema, a: "section move", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#movesectionpayloadschema"}
- {s: AddProjectPayloadSchema, a: "project add", req: [name], opt: 3, ref: "./reference/payload-schemas.yaml#addprojectpayloadschema"}
- {s: UpdateProjectPayloadSchema, a: "project update", req: [], opt: 4, ref: "./reference/payload-schemas.yaml#updateprojectpayloadschema"}
- {s: AddSuitePayloadSchema, a: "suite add", req: [name], opt: 1, ref: "./reference/payload-schemas.yaml#addsuitepayloadschema"}
- {s: UpdateSuitePayloadSchema, a: "suite update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesuitepayloadschema"}
- {s: AddMilestonePayloadSchema, a: "milestone add", req: [name], opt: 5, ref: "./reference/payload-schemas.yaml#addmilestonepayloadschema"}
- {s: UpdateMilestonePayloadSchema, a: "milestone update", req: [], opt: 8, ref: "./reference/payload-schemas.yaml#updatemilestonepayloadschema"}
- {s: UserAddPayloadSchema, a: "user add", req: [name, email, password], opt: 6, ref: "./reference/payload-schemas.yaml#useraddpayloadschema"}
- {s: UserUpdatePayloadSchema, a: "user update", req: [], opt: 9, ref: "./reference/payload-schemas.yaml#userupdatepayloadschema"}
- {s: AddSharedStepPayloadSchema, a: "shared-step add", req: [title], opt: 1, ref: "./reference/payload-schemas.yaml#addsharedsteppayloadschema"}
- {s: UpdateSharedStepPayloadSchema, a: "shared-step update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesharedsteppayloadschema"}
- {s: AddCaseFieldPayloadSchema, a: "case-field add", req: [type, name, label, configs], opt: 3, ref: "./reference/payload-schemas.yaml#addcasefieldpayloadschema"}
- {s: AddVariablePayloadSchema, a: "variable add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addvariablepayloadschema"}
- {s: UpdateVariablePayloadSchema, a: "variable update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updatevariablepayloadschema"}
- {s: AddGroupPayloadSchema, a: "group add", req: [name], opt: 1, ref: "./reference/payload-schemas.yaml#addgrouppayloadschema"}
- {s: UpdateGroupPayloadSchema, a: "group update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updategrouppayloadschema"}
- {s: AddDatasetPayloadSchema, a: "dataset add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#adddatasetpayloadschema"}
- {s: UpdateDatasetPayloadSchema, a: "dataset update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updatedatasetpayloadschema"}
- {s: AddConfigurationGroupPayloadSchema, a: "configuration-group add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addconfigurationgrouppayloadschema"}
- {s: UpdateConfigurationGroupPayloadSchema, a: "configuration-group update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updateconfigurationgrouppayloadschema"}
- {s: AddConfigurationPayloadSchema, a: "configuration add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addconfigurationpayloadschema"}
- {s: UpdateConfigurationPayloadSchema, a: "configuration update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updateconfigurationpayloadschema"}
```
<!-- /GENERATED:payload-schemas -->

For the authoritative type definitions, see `src/schemas.ts` in the
package source.

## Output

By default, `testrail` emits pretty-printed JSON to stdout. Use `--format
table` for column-aligned human-readable output. Use `--quiet` to
suppress stdout entirely (rely on exit code).

```bash
testrail project get 1                  # JSON (default)
testrail project list --format table    # Table
testrail run get 5 --quiet              # Exit code 0/1 only
```

### Filtering output (preserve context budget)

The CLI emits the full JSON object for each entity. For list endpoints
with hundreds of items, that can blow the agent's context window. Filter
at the shell when possible:

**Preferred:** `jq` (if available — most dev/CI environments have it):

```bash
testrail run get 5 | jq '.passed_count'
testrail case list --project-id 1 | jq '.[] | {id, title}'
```

**Fallback:** Node one-liner (always available since the package itself
is a Node CLI):

```bash
testrail run get 5 | node -e 'const d=JSON.parse(require("fs").readFileSync(0));console.log(d.passed_count)'
```

## Recipes

### 1. Smoke-test auth & connectivity

<!-- recipe-for: user:list -->

```bash
testrail user list --limit 1 --quiet && echo "auth OK" || echo "auth FAILED"
```

Exit code 0 = creds resolve and TestRail responds; 1 = anything broken.

### 2. Fetch a project

<!-- recipe-for: project:get -->

```bash
testrail project get 5
```

### 3. List projects with pagination

<!-- recipe-for: project:list -->

```bash
testrail project list --limit 25 --offset 0
```

### 4. List suites under a project

<!-- recipe-for: suite:list -->

```bash
testrail suite list --project-id 5
```

### 5. List cases in a specific suite

<!-- recipe-for: case:list -->

```bash
testrail case list --project-id 5 --suite-id 12
```

### 6. Extract just the IDs from any list (generic pattern)

```bash
testrail case list --project-id 5 | jq '.[].id'
```

### 7. Count pass/fail for a run

<!-- recipe-for: run:get -->

```bash
testrail run get 42 | jq '{passed: .passed_count, failed: .failed_count}'
```

### 8. Page through a large result list

<!-- recipe-for: result:list -->

```bash
offset=0
while true; do
    page=$(testrail result list --run-id 100 --limit 100 --offset $offset)
    count=$(echo "$page" | jq 'length')
    [ "$count" -eq 0 ] && break
    echo "$page" | jq -c '.[]'
    offset=$((offset + count))
done
```

### 9. Author a new test case

<!-- recipe-for: case:add -->

```bash
testrail case add 12 --data '{
    "title": "Login page accepts SSO redirect",
    "type_id": 1,
    "priority_id": 3,
    "refs": "JIRA-1234"
}'
```

### 10. Update a test case (partial fields)

<!-- recipe-for: case:update -->

```bash
testrail case update 87 --data '{"title": "Renamed", "priority_id": 4}'
```

### 11. Create a CI test run

<!-- recipe-for: run:add -->

```bash
RUN=$(testrail run add 5 --data '{
    "name": "CI build #'"$CI_BUILD_NUMBER"'",
    "include_all": false,
    "case_ids": [42, 43, 44]
}')
RUN_ID=$(echo "$RUN" | jq '.id')
```

### 12. Publish bulk results from a CI run

<!-- recipe-for: result:add-bulk -->

```bash
testrail result add-bulk "$RUN_ID" --data-file /tmp/results.json
```

Where `/tmp/results.json` has shape:

```json
{
    "results": [
        { "case_id": 42, "status_id": 1, "comment": "passed" },
        { "case_id": 43, "status_id": 5, "comment": "failed: timeout" }
    ]
}
```

### 13. Close a run when CI finishes

<!-- recipe-for: run:close -->

```bash
testrail run close "$RUN_ID" --yes
```

Destructive: closing a run is irreversible (TestRail has no `open_run`).
The `--yes` gate prevents accidental closure from agent-issued commands.
Combine with `--dry-run` (preview wins) to confirm the target before
committing.

### 14. Validate a payload before sending (`--dry-run`)

<!-- recipe-for: result:add -->

```bash
testrail result add 100 42 --data '{"status_id":1,"comment":"sanity check"}' --dry-run
```

Prints the parsed payload + a `"dryRun": true` marker; no API call made.

### 15. Attach a Playwright screenshot to a test result

<!-- recipe-for: result:add, attachment:add-to-result -->

```bash
RESULT=$(testrail result add "$RUN_ID" 42 --data '{"status_id":5,"comment":"failed"}')
RESULT_ID=$(echo "$RESULT" | jq '.id')
testrail attachment add-to-result "$RESULT_ID" --file ./test-results/screenshot.png
```

Output is `{ "attachment_id": <id> }`. Filename uploaded is `screenshot.png`
(basename of `--file`). Use `--filename <name>` to rename on upload.

### 16. Attach a repro file to a test case

<!-- recipe-for: attachment:add-to-case -->

```bash
testrail attachment add-to-case 42 --file ./repro.zip --filename "bug-1234-repro.zip"
```

`--filename` overrides the path basename so the attachment shows up with a
meaningful name in the TestRail UI even when the local file is generic.

### 17. Download the latest attachment on a case to inspect locally

<!-- recipe-for: attachment:list-for-case, attachment:get -->

```bash
LATEST_ID=$(testrail attachment list-for-case 42 | jq 'max_by(.attachment_id).attachment_id')
testrail attachment get "$LATEST_ID" --out ./fetched.bin
```

`--out` is required. Refuses to overwrite an existing file; pass `--force`
to overwrite. JSON ack on stdout includes `attachmentId`, `out`, and `size`.

`attachment list-for-case` / `list-for-run` / `list-for-test` accept
`--limit N` and `--offset N` for cases with hundreds of attachments
(TestRail's server default page size is 250). The plan-scoped variants
(`list-for-plan`, `list-for-plan-entry`) intentionally don't paginate —
TestRail returns the full attachment tree under the plan.

```bash
# Page through every attachment on a long-lived case (50/request):
offset=0
while :; do
    page=$(testrail attachment list-for-case 42 --limit 50 --offset $offset)
    count=$(echo "$page" | jq 'length')
    [ "$count" -eq 0 ] && break
    echo "$page" | jq -c '.[]'
    offset=$((offset + count))
done
```

### 18. Audit then delete attachments on a deprecated case

<!-- recipe-for: attachment:list-for-case, attachment:delete -->

```bash
# 1. List + audit
testrail attachment list-for-case 42

# 2. Dry-run each delete to preview intent without calling the API.
#    Passing --yes alongside --dry-run is optional but recommended:
#    dry-run wins (no API call either way), and including --yes here
#    means step 3 differs only by dropping --dry-run — minimum delta
#    between test and real invocation.
for ID in 101 102 103; do
    testrail attachment delete "$ID" --yes --dry-run
done

# 3. Real delete (drop --dry-run)
for ID in 101 102 103; do
    testrail attachment delete "$ID" --yes
done
```

### 19. Fetch a single test plan

<!-- recipe-for: plan:get -->

```bash
testrail plan get 50
```

### 20. List active plans for a project

<!-- recipe-for: plan:list -->

```bash
# `plan list` is paginated; --limit / --offset are the only filters exposed.
# To filter by milestone or completion status, paginate and filter client-side.
testrail plan list --project-id 1 --limit 25
```

### 21. Create an empty test plan

<!-- recipe-for: plan:add -->

```bash
testrail plan add 1 --data '{
    "name": "Release 1.0",
    "description": "Smoke + regression for the 1.0 cut",
    "milestone_id": 4
}'
```

### 22. Create a plan with nested entries (matrix testing in one call)

<!-- recipe-for: plan:add, plan:update -->

```bash
# Each entry is a suite to run. `config_ids` slot the entry into a TestRail
# configuration matrix (e.g., Linux + macOS). The nested `runs[]` overrides
# per config — name is auto-derived from the config, so omit it.
testrail plan add 1 --data '{
    "name": "Release 1.0 — Cross-platform",
    "entries": [
        {
            "suite_id": 1,
            "include_all": true,
            "config_ids": [10, 11],
            "runs": [
                { "config_ids": [10], "assignedto_id": 7 },
                { "config_ids": [11], "assignedto_id": 8 }
            ]
        }
    ]
}'

# Rename the plan after creation:
testrail plan update 50 --data '{"name":"Release 1.0 — final"}'
```

### 23. Add an entry to an existing plan

<!-- recipe-for: plan:add-entry -->

```bash
# Use this for plans that grow over a release cycle. Returns the new entry
# (including its UUID-style `id` and the runs auto-created for any configs).
testrail plan add-entry 50 --data '{
    "suite_id": 2,
    "include_all": true,
    "assignedto_id": 7
}'
```

### 24. Results pipeline — choosing per-test vs per-case vs bulk endpoints

<!-- recipe-for: result:list-for-test -->
<!-- recipe-for: result:list-for-case -->

TestRail exposes four ways to fetch results; the right one depends on what
IDs you already have and the granularity you need. Decision tree:

1. **You have a `test_id`** (a test is the run-instance of a case in a
   specific run) → `result list-for-test <test_id>`. Returns the full
   result history for that one test. Cheapest call when you already
   resolved the test from a previous `get_tests` / `get_test` lookup.

    ```bash
    testrail result list-for-test 4242 --limit 50 --status-id 1,5
    ```

2. **You have a `run_id` and `case_id` but no `test_id`** →
   `result list-for-case <run_id> <case_id>`. TestRail resolves the
   test internally. Use this from CI when the test runner only knows the
   case ID (e.g. tagged in the test file) and the run it published to.

    ```bash
    # Find the most recent failure for case 87 in run 100, filtered by JIRA ticket
    testrail result list-for-case 100 87 --limit 1 --status-id 5 --defects-filter JIRA-1234
    ```

3. **You want every result in the run** (audit, export, dashboard) →
   `result list --run-id <id>`. Already-shipped batch read; paginate
   through with `--limit` / `--offset`. Prefer this over N calls to
   `list-for-test` when N is the size of the run.

    ```bash
    testrail result list --run-id 100 --limit 100 --offset 0
    ```

4. **You're writing, not reading** → `result add` (one), `result
   add-bulk` (many by `case_id`), or `result add-bulk-by-test` (many by
   `test_id`). Already shipped; mirror the per-test / per-case split on
   the write side.

Filter flags shared by `list-for-test` and `list-for-case`:

- `--status-id 1,5` — comma-separated status IDs (1 = passed,
  5 = failed; project-specific values via `case-status list`).
- `--defects-filter JIRA-1234` — substring match on the result's
  `defects` field.
- `--limit N` / `--offset N` — pagination (TestRail caps `limit` at 250
  server-side).

Rule of thumb: prefer `list-for-test` when you already have a `test_id`
(one fewer server-side join); fall back to `list-for-case` when CI only
knows the case; reach for `list` only when you actually need every result
in the run.

### 25. Plan entries lifecycle (add → add-run → update → delete cascade)

<!-- recipe-for: plan:close -->
<!-- recipe-for: plan:delete -->
<!-- recipe-for: plan:delete-entry -->
<!-- recipe-for: plan:delete-run-from-entry -->

End-to-end walkthrough of a plan's lifecycle, showing where each
destructive operation fits. Every step is idempotent in isolation; the
cascade order (run → entry → plan) matters because `delete_plan` removes
everything inside it but `delete_plan_entry` only removes its own runs.

```bash
# 1. Create the plan
PLAN=$(testrail plan add 1 --data '{
    "name": "Release 1.0 — Cross-platform",
    "milestone_id": 4
}')
PLAN_ID=$(echo "$PLAN" | jq '.id')

# 2. Add an entry (a suite to run, optionally split across configs)
ENTRY=$(testrail plan add-entry "$PLAN_ID" --data '{
    "suite_id": 1,
    "include_all": true,
    "config_ids": [10, 11],
    "runs": [
        { "config_ids": [10], "assignedto_id": 7 },
        { "config_ids": [11], "assignedto_id": 8 }
    ]
}')
ENTRY_ID=$(echo "$ENTRY" | jq -r '.id')     # UUID-style string, NOT numeric

# 3. Add a fresh run to the entry (e.g. a newly-added platform).
#    If your CLI build is older than the one that shipped
#    `plan add-run-to-entry`, recreate the entry with the new
#    config_ids instead.
NEW_RUN=$(testrail plan add-run-to-entry "$PLAN_ID" "$ENTRY_ID" --data '{
    "config_ids": [12],
    "assignedto_id": 9
}')
NEW_RUN_ID=$(echo "$NEW_RUN" | jq '.id')

# 4. Update the entry's name/assignee/include_all across all its runs.
testrail plan update-entry "$PLAN_ID" "$ENTRY_ID" --data '{
    "name": "Cross-platform smoke (renamed)",
    "include_all": true
}'

# 5. Update a single run inside the entry (e.g. swap the assignee).
testrail plan update-run-in-entry "$NEW_RUN_ID" --data '{
    "assignedto_id": 10
}'

# 6. Delete cascade — narrowest first, widest last
#    a) Remove one specific run from its entry; siblings remain.
testrail plan delete-run-from-entry "$NEW_RUN_ID" --yes

#    b) Remove the entire entry (all of its remaining runs).
testrail plan delete-entry "$PLAN_ID" "$ENTRY_ID" --yes

#    c) Either close the plan (irreversible — preferred when results
#       need to be preserved) …
testrail plan close "$PLAN_ID" --yes

#    … or delete it outright (also irreversible; loses all results).
#    `delete_plan` does NOT support TestRail's --soft preview, so the
#    only safe rehearsal is --dry-run (client-side, no API call).
testrail plan delete "$PLAN_ID" --yes --dry-run    # preview
testrail plan delete "$PLAN_ID" --yes              # commit
```

Notes:

- `entry_id` is a UUID-style string TestRail mints server-side; pass it
  verbatim. The CLI rejects empty or whitespace-only values before
  calling the API.
- `--dry-run` always wins over `--yes`. Use it in CI to confirm the
  target before committing — `--yes --dry-run` emits a preview marked
  `"destructive": true` and makes no API call.
- `plan close` is irreversible — TestRail has no `open_plan`. Prefer it
  over `plan delete` when historical results matter (closed plans stay
  queryable; deleted plans take their runs and results with them).
- The chain `delete-run-from-entry → delete-entry → delete/close plan`
  is the safe top-down ordering. Reversing it (`delete plan` first)
  works but skips the audit trail of touching each layer; not
  recommended in shared/production projects.

### 26. Bulk case delete with `--soft` server-side preview

<!-- recipe-for: case:delete-bulk -->

Use `case delete-bulk` for mass cleanup (sunset features, deprecated
suites) or project archival where deleting cases one-by-one would burn
through the 100 req/60s rate budget. The action wraps TestRail's
`POST delete_cases/{suite_id}&project_id={project_id}` and accepts a
`case_ids: number[]` payload.

Three independent safety layers stack on top of each other; understand
which one runs where before invoking:

| Layer       | Side       | API call?     | What it does                                                       |
| ----------- | ---------- | ------------- | ------------------------------------------------------------------ |
| `--dry-run` | client     | no            | Short-circuits before the request; emits a parsed-payload preview  |
| `--soft`    | server     | yes (`soft=1`)| TestRail returns affected-test counts but does **not** delete      |
| `--yes`     | client     | n/a           | Gate flag; without it the CLI exits 1 before any API call          |

`--dry-run` always wins over `--yes` and over `--soft`. `--soft` only
takes effect when an actual API call is made (i.e. `--yes` without
`--dry-run`).

Recommended workflow — preview server-side first, then commit:

```bash
# 1. Server-side preview: hit the API with soft=1 so TestRail returns
#    affected-test counts WITHOUT deleting. Confirms the IDs resolve in
#    the target suite/project and surfaces the blast radius (e.g. how
#    many tests inside open runs would be touched).
testrail case delete-bulk 12 --project-id 5 \
    --soft --yes \
    --data '{"case_ids":[101,102,103]}'

# 2. Review the returned preview. If the affected-test counts look
#    wrong (e.g. far more than expected, hitting active runs), STOP
#    and reconcile the case_ids list before continuing.

# 3. Real delete — drop --soft. This is irreversible.
testrail case delete-bulk 12 --project-id 5 \
    --yes \
    --data '{"case_ids":[101,102,103]}'
```

Flag-interaction matrix (verified against `handleCaseDeleteBulk`):

```bash
# (a) --dry-run --yes --soft → client-side preview, NO API call.
#     The preview JSON includes "destructive": true and "soft": true so
#     audit logs distinguish it from a plain dry-run. Safe in CI to
#     validate payload shape before consuming rate budget.
testrail case delete-bulk 12 --project-id 5 --yes --dry-run --soft \
    --data '{"case_ids":[101,102,103]}'

# (b) --soft --yes (no --dry-run) → real API call with soft=1.
#     Server returns affected-test counts; nothing is deleted.
#     Output: { "suiteId": 12, "projectId": 5, "soft": true,
#               "deleted": false, "preview": {...} }
testrail case delete-bulk 12 --project-id 5 --yes --soft \
    --data '{"case_ids":[101,102,103]}'

# (c) --yes (no --soft, no --dry-run) → real delete. Irreversible.
#     Output: { "suiteId": 12, "projectId": 5, "soft": false,
#               "deleted": true }
testrail case delete-bulk 12 --project-id 5 --yes \
    --data '{"case_ids":[101,102,103]}'

# (d) (no --yes) → exits 1: "Destructive action; pass --yes to confirm."
```

CI/automation pattern — fail loud if the soft preview indicates a
blast radius outside expectations:

```bash
# Pin the expected count of affected cases. If TestRail reports a
# different number, bail before the real delete. Adjust the jq path
# (`.preview.cases_to_delete` here) to whatever the soft response
# returns for your TestRail version.
EXPECTED=3
PREVIEW=$(testrail case delete-bulk 12 --project-id 5 --yes --soft \
    --data '{"case_ids":[101,102,103]}')
ACTUAL=$(echo "$PREVIEW" | jq '.preview.cases_to_delete // (.preview | length)')
if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "Bulk delete preview mismatch: expected $EXPECTED, got $ACTUAL" >&2
    exit 1
fi
testrail case delete-bulk 12 --project-id 5 --yes \
    --data '{"case_ids":[101,102,103]}'
```

Recovery if a delete fires by mistake:

- **No client-side recovery.** The CLI does not stage or buffer the
  request; once `--yes` (without `--dry-run`) is sent, TestRail deletes
  the cases server-side and returns 200.
- **TestRail audit log** (admin-only, web UI) records the delete with
  the acting user and timestamp. Use it to identify which cases were
  removed and replay their definitions from version control if the
  case bodies live in a repo (e.g. BDD `.feature` files committed
  alongside the test suite).
- **TestRail support recovery** is best-effort and depends on backup
  cadence (TestRail Cloud) or your self-hosted backup policy. Open a
  ticket immediately; don't wait — backups roll off.

The takeaway: treat `--soft --yes` as the rehearsal step in every CI
pipeline that touches bulk delete, and never invoke the no-`--soft`
form without a recent backup or a versioned definition of the cases
being removed.

### 27. Configuration groups & configs hierarchy management

<!-- recipe-for: configuration:list -->
<!-- recipe-for: configuration-group:add -->
<!-- recipe-for: configuration-group:delete -->
<!-- recipe-for: configuration:add -->
<!-- recipe-for: configuration:delete -->

TestRail models the test-environment matrix as a two-level tree:

```
project
└── config_group        (e.g. "Browsers", "Operating Systems")
    └── config (leaf)   (e.g. "Chrome", "Firefox", "Safari")
```

Plan entries reference individual `config_id` values to spin up
per-environment runs (see recipe 22 — "Plan entries with config matrices").
The CLI surfaces both layers via two resources:

- `configuration-group <action>` — operates on the group (parent).
- `configuration <action>` — operates on the leaf config OR lists the
  whole tree (`configuration list <project_id>` returns every group with
  its nested `configs[]` in one call; there is no separate
  list-configs-in-group endpoint upstream).

End-to-end walkthrough — create a matrix, list it, mutate it, then
tear it down in parent-after-child order:

```bash
# 1. Create a group at the project level.
GROUP=$(testrail configuration-group add 5 --data '{"name":"Browsers"}')
GROUP_ID=$(echo "$GROUP" | jq '.id')

# 2. Add leaf configs to the group. Each is independently addressable
#    by its own config_id and can be referenced from plan entries.
CHROME=$(testrail configuration add "$GROUP_ID" --data '{"name":"Chrome"}')
FIREFOX=$(testrail configuration add "$GROUP_ID" --data '{"name":"Firefox"}')
CHROME_ID=$(echo "$CHROME" | jq '.id')
FIREFOX_ID=$(echo "$FIREFOX" | jq '.id')

# 3. List the whole tree (one API call returns all groups + all configs).
testrail configuration list 5 | jq '.[] | {id, name, configs: [.configs[].name]}'

# 4. Rename a leaf config (e.g. clarify a version).
testrail configuration update "$CHROME_ID" --data '{"name":"Chrome (stable)"}'

# 5. Rename the group itself (configs underneath keep their IDs).
testrail configuration-group update "$GROUP_ID" --data '{"name":"Desktop Browsers"}'

# 6. Delete cascade — parent-after-child is the safe ordering.
#    a) Remove individual configs first. Any plan entry that referenced
#       this config loses it from its config selection; sibling configs
#       in the group are unaffected.
testrail configuration delete "$FIREFOX_ID" --yes

#    b) Then drop the whole group (TestRail cascades the remaining
#       configs server-side). Doing this first works but skips the
#       per-config audit trail.
testrail configuration-group delete "$GROUP_ID" --yes
```

Notes:

- `configuration-group delete` and `configuration delete` are both
  destructive: gated by `--yes`, no `--soft` server-side preview
  upstream (TestRail does NOT support `soft=1` on either endpoint).
  Use `--dry-run` (client-side, no API call) to validate the target
  before committing — `--yes --dry-run` emits a preview marked
  `"destructive": true`.
- Deleting a group cascades to every config in it. If you only need
  to retire a subset, delete the individual configs first
  (`configuration delete <config_id>`) and leave the group standing.
- Cascade caveat: deleting a config invalidates that selection on any
  plan entry referencing it. Existing runs/results in those entries
  survive (TestRail keeps historical results even when their config is
  removed), but new runs added to those plan entries will no longer
  offer the deleted config in their `config_ids[]` shortlist.
- Configurations are project-scoped; the same group/config name in a
  different project is a different ID. Always pair list/mutate calls
  with the project context.

### 28. Shared step propagation + history audit

<!-- recipe-for: shared-step:add -->
<!-- recipe-for: shared-step:update -->
<!-- recipe-for: shared-step:delete -->
<!-- recipe-for: shared-step:history -->

Shared steps let a single step block be reused across many test cases.
Editing the shared step updates **every case that references it** — the
change is server-side and propagates immediately, so a single
`shared-step update` can mutate hundreds of cases in one call. That
power cuts both ways: an unchecked edit is a fan-out blast radius.
Always audit references with `shared-step history` before any update or
delete.

Lifecycle walkthrough — create, reference from cases, update,
audit the blast radius, then retire safely:

```bash
# 1. Create the shared step at the project level. `custom_steps_separated`
#    is a free-form array of step objects (passthrough); TestRail
#    accepts whatever keys your project template defines (typically
#    `content`, `expected`, `additional_info`).
STEP=$(testrail shared-step add 5 --data '{
  "title": "Log in as admin",
  "custom_steps_separated": [
    {"content": "Navigate to /login", "expected": "Login form renders"},
    {"content": "Submit admin credentials", "expected": "Redirected to /dashboard"}
  ]
}')
SHARED_STEP_ID=$(echo "$STEP" | jq '.id')

# 2. Reference the shared step from a test case. In `custom_steps_separated`,
#    a step entry with `shared_step_id` points to the shared block;
#    TestRail expands it server-side when the case is rendered or copied
#    into a run. Mix inline steps and shared-step references freely.
testrail case add "$SECTION_ID" --data "{
  \"title\": \"Admin can delete users\",
  \"custom_steps_separated\": [
    {\"shared_step_id\": $SHARED_STEP_ID},
    {\"content\": \"Open /users\", \"expected\": \"User list renders\"},
    {\"content\": \"Click 'Delete' on a user row\", \"expected\": \"User removed\"}
  ]
}"

# 3. Audit BEFORE you mutate. `shared-step history` returns every prior
#    revision (timestamps + `user_id` + the `custom_steps_separated`
#    snapshot at that point) so you can see who last touched it and what
#    the cases inherited. Paginate with --limit / --offset on long
#    histories.
testrail shared-step history "$SHARED_STEP_ID" --limit 50

# 4. Update the shared step. Every case referencing it now picks up the
#    new content on its next read (no per-case patch needed). The
#    history endpoint records this revision so future audits can trace
#    when behavior changed.
testrail shared-step update "$SHARED_STEP_ID" --data '{
  "title": "Log in as admin (MFA)",
  "custom_steps_separated": [
    {"content": "Navigate to /login", "expected": "Login form renders"},
    {"content": "Submit admin credentials", "expected": "MFA prompt shown"},
    {"content": "Enter TOTP code", "expected": "Redirected to /dashboard"}
  ]
}'

# 5. Confirm the revision landed and inspect the diff against the
#    previous entry before letting CI run any cases that reference it.
testrail shared-step history "$SHARED_STEP_ID" --limit 1

# 6. Retire the shared step. `--dry-run` (client-side, no API call)
#    previews the destructive call without touching the server; pair
#    with `--yes` for the real delete. There is no `--soft` server-side
#    preview — TestRail's `delete_shared_step` does not accept `soft=1`.
testrail shared-step delete "$SHARED_STEP_ID" --yes --dry-run
testrail shared-step delete "$SHARED_STEP_ID" --yes
```

Notes:

- **Propagation is immediate and server-side.** Updates to a shared
  step take effect the next time any referencing case is read by the
  API, the UI, or a run. There is no per-case cache to invalidate on
  the client side; the GET-LRU in this client keys by endpoint, so
  `case get` for a referencing case must be re-fetched (or cache
  bypassed) after `shared-step update` to see the new content.
- **Delete does NOT cascade to test cases.** Per TestRail's documented
  behavior for `delete_shared_step` (and pinned in
  `src/cli/handlers/shared-step-write.ts`), test cases that referenced
  the deleted shared step are **not** deleted — those cases lose the reference to the step block.
  The case row survives; the expanded steps that came from the shared
  block disappear from `custom_steps_separated` on that case's next
  read. Existing runs that already executed the case keep their
  historical step text and results unchanged.
- **Audit before every mutation.** `shared-step history` is the only
  reliable way to see how many revisions a shared step has accumulated
  and who touched it last. A high revision count on a step
  referenced by hundreds of cases means an update has a wide blast
  radius — review the inline steps before pushing. The history
  endpoint is paginated; combine `--limit` + `--offset` to walk long
  histories without exceeding the response-body cap.
- **No bulk reference lookup upstream.** TestRail does not expose a
  "list cases referencing shared step X" endpoint. To estimate impact
  before an update, page through `case list` for the project/suite
  and `jq` over `custom_steps_separated[]?.shared_step_id` looking
  for the target ID. The walk is read-only and cache-friendly.
- **Empty update payloads are accepted.** `UpdateSharedStepPayloadSchema`
  intentionally allows `{}` (every field optional, matching
  `UpdateMilestonePayloadSchema`) — TestRail treats it as a no-op.
  This is a schema-layer decision; if you want non-empty enforcement,
  validate above the CLI before invoking.
- **`shared-step delete` is destructive, gated by `--yes`.** Mirrors
  `milestone delete` / `plan delete`: no `--soft` server-side preview
  upstream, so the only preview mechanism is client-side `--dry-run`.
  `--dry-run` wins
  over `--yes` so `--yes --dry-run` always short-circuits without
  hitting the API.


### 29. Data-driven runs via Variables + Datasets

<!-- recipe-for: dataset:get -->
<!-- recipe-for: dataset:list -->
<!-- recipe-for: dataset:add -->
<!-- recipe-for: dataset:update -->
<!-- recipe-for: dataset:delete -->

TestRail's data-driven testing pairs two project-scoped resources:

- **Variables** — named placeholders referenced inside case steps using
  `${var_name}` syntax (e.g. `${env}`, `${region}`). Manage with
  `variable add | update | delete` and list with `variable list`.
- **Datasets** — named collections of variable-value rows bound to a
  run via a plan entry. Each row drives one execution of every case
  in the run, substituting `${var_name}` with that row's value.

Together they let one test case run N times against N environments
without duplicating the case definition. Workflow:

```bash
# 1. Define the variables at project level (one-time setup).
#    The variable IDs returned here are referenced by the dataset rows.
ENV=$(testrail variable add 5 --data '{"name":"env"}')
REGION=$(testrail variable add 5 --data '{"name":"region"}')
ENV_ID=$(echo "$ENV" | jq '.id')
REGION_ID=$(echo "$REGION" | jq '.id')

# 2. Create a dataset shell in the same project. The CLI surface only
#    exposes `name` on add/update — actual row population (variable_id
#    + value matrices) happens through the TestRail web UI today;
#    the public API surface for row CRUD is not yet stable.
DATASET=$(testrail dataset add 5 --data '{"name":"Staging matrix"}')
DATASET_ID=$(echo "$DATASET" | jq '.id')

# 3. Reference variables in case steps with ${name} placeholders.
#    Example case step content:
#      "Navigate to ${env}.example.com and select region ${region}."
#    The web UI populates the dataset rows; each row becomes one
#    execution when the run is triggered against this dataset.

# 4. Inspect the dataset definitions in a project (id + name only).
testrail dataset list 5

# 5. Fetch a single dataset by ID to confirm the shell exists before
#    binding it to a plan entry in TestRail's UI.
testrail dataset get "$DATASET_ID"

# 6. Rename the dataset (e.g. after promoting from staging to prod).
testrail dataset update "$DATASET_ID" --data '{"name":"Production matrix"}'

# 7. Tear down — variables and datasets are independently deletable.
#    Both deletes are destructive (no --soft, --yes required).
testrail dataset delete "$DATASET_ID" --yes
testrail variable delete "$REGION_ID" --yes
testrail variable delete "$ENV_ID" --yes
```

Example payload — minimal `dataset add` body (the only required field
is `name`; `custom_*` extras pass through `.passthrough()` unchanged):

```jsonc
{
    "name": "Staging matrix",
    "custom_owner": "qa-team"
}
```

Notes:

- **CLI scope is metadata-only.** `dataset add | update` accept `name`
  only; the per-row variable values that drive substitution are managed
  through TestRail's web UI for now (the upstream row-CRUD endpoints
  are not part of the documented public API surface). Use this CLI to
  provision dataset shells and rename them; switch to the web UI for
  the actual data matrix population.
- **Variable references use `${name}` syntax inside case steps.** The
  literal `${env}` in a step's `content`, `expected`, or `additional_info`
  field is substituted at run-execution time with the value from the
  current dataset row. Misspelled placeholders render verbatim — there
  is no validation hop between case definition and run execution.
- **Datasets bind to plan entries, not to runs directly.** Trigger a
  data-driven run by creating a plan with an entry that references the
  dataset (the binding lives in the plan entry's `config_ids[]` /
  dataset selection — see recipe 22 for plan-entry config matrices and
  recipe 23 for `plan add-entry`).
- **Per-row execution semantics.** Each dataset row creates one test
  execution per case in the run, with all `${var_name}` placeholders
  substituted. Results are recorded per-row, so `result list-for-case`
  returns N entries (one per row) rather than one.
- **Destructive lifecycle.** `dataset delete` follows the locked-in
  destructive pattern: `--yes` required, `--dry-run` wins for
  preview-without-API, and `--soft` is rejected (TestRail's
  `delete_dataset` does not support soft preview — mirrors
  `variable delete` / `milestone delete` / `project delete`). Deleting
  a dataset that's bound to an active plan entry invalidates that
  entry's data-driven configuration; existing historical results
  survive but new runs lose the substitution matrix.
- **Project-scoped IDs.** Both variables and datasets are addressed by
  global IDs but scoped to a project. The same `name` in a different
  project is a different ID; always pair list/mutate calls with the
  project context (`variable list <project_id>` /
  `dataset list <project_id>`).


### 30. Bulk-author cases under a section in one API call

<!-- recipe-for: case:add-bulk -->

Use `case add-bulk` to seed many cases at once (e.g. importing a CSV /
generating cases from a spec document) without burning through the
100 req/60s rate budget one POST at a time. The body is a **JSON array**
of case payloads — each item has the same shape as `case add`.

```bash
# Author 3 cases under section 12 in one round-trip.
testrail case add-bulk 12 --data '[
    {"title": "Login form rejects invalid email", "type_id": 1, "priority_id": 3},
    {"title": "Login form rejects empty password", "type_id": 1, "priority_id": 3},
    {"title": "Login form respects redirect_to query param", "type_id": 1, "priority_id": 2}
]'
```

```bash
# Or from a file when the array is large.
testrail case add-bulk 12 --data-file ./cases-to-import.json
```

`--dry-run` validates the array (and each item) against Zod **without**
calling the API — useful for previewing the parsed payload before
committing a multi-hundred-case import. The dry-run preview includes a
`count` field so agents can confirm the array length matches their
source data.

**Server version gate:** TestRail 7.5+ is required — older instances
return 400 / 404 with `"Invalid uri"` because the endpoint does not
exist. The CLI rethrows that as a clearer "TestRail server >= 7.5
required for add_cases bulk endpoint" message so you can distinguish
"my TestRail is too old" from "my payload is malformed". On version
mismatch, fall back to issuing N separate `case add` calls — slower
(rate-limited), but works on any 6.x+ instance.

### 31. Watch a run until completion (CI integration)

<!-- recipe-for: run:watch -->

`run watch` polls `get_run/{run_id}` on a fixed interval (default 30s)
and emits an event each time one of the watched counters changes. With
`--format json` the event is structured JSON; with `--format table` the
same event object is rendered as a table row. The watcher exits with code 0 the moment TestRail
flips `is_completed` to `true` — useful for CI pipelines that need to
block until a manual / external run completes before publishing
reports, sending notifications, or promoting a deploy.

Watched fields (closed set; mutable timestamps like `completed_on` are
intentionally ignored to avoid noisy events):

- `is_completed`
- `passed_count` / `failed_count` / `retest_count`
- `blocked_count` / `untested_count`

```bash
# Block until run 42 completes; emit per-change diffs along the way.
testrail run watch 42
```

```bash
# Tight CI loop: poll every 10 seconds instead of the default 30.
# Interval bounds are [5, 600] seconds — outside that range the CLI
# exits 1 fail-fast before any API call. 5s is the floor to protect
# the default 100 req/60s rate budget under fleet usage.
testrail run watch 42 --interval 10
```

```bash
# One-shot status check: poll once, emit the snapshot, exit 0
# regardless of is_completed. Useful when you want the watcher's
# rendering without a long-running process.
testrail run watch 42 --once
```

Example event output (`--format json`):

```json
{
  "event": "snapshot",
  "runId": 42,
  "is_completed": false
}
{
  "event": "change",
  "runId": 42,
  "changes": [{ "field": "passed_count", "from": 7, "to": 8 }]
}
{
  "event": "completed",
  "runId": 42,
  "is_completed": true
}
```

SIGINT (Ctrl-C) is handled gracefully: the watcher cancels the pending
timeout, writes a one-line `interrupted` summary with the last seen
snapshot to **stderr**, and exits with code 130 (POSIX convention).
Subsequent transient `getRun` failures (network blip, 5xx) surface on
stderr but do not abort the watcher — only an unrecoverable rejection
(e.g. auth lost mid-watch) propagates and triggers exit 1.

### 32. Create a user (TestRail 7.3+)

<!-- recipe-for: user:add -->

`user add` calls `POST add_user` and returns the created `User` object.
Three fields are required: `name`, `email`, and `password`. All other
fields (`is_active`, `role_id`, `group_ids`, `mfa_required`, `language`,
`email_notifications`) are optional and pass through `.passthrough()` so
future TestRail fields are preserved without a schema bump.

**Security:** never pass `--data '{"password":"..."}` on the command line —
the secret appears in shell history and `ps` output. Use `--data-file` or
stdin pipe instead.

```bash
# Recommended: read the payload from a file (password stays off the command line)
testrail user add --data-file ./new-user.json
# new-user.json: {"name":"Alice Smith","email":"alice@example.com","password":"s3cr3t","role_id":3}
```

```bash
# Pipe via stdin (also keeps password out of shell history)
echo '{"name":"Bob","email":"bob@example.com","password":"hunter2"}' | testrail user add --data -
```

```bash
# Dry-run: validate the payload without hitting the API
testrail user add --data-file ./new-user.json --dry-run
# → {"dryRun":true,"action":"user add","payload":{...},"source":"file"}
```

```typescript
// Programmatic equivalent
import { TestRailClient } from '@dichovsky/testrail-api-client';
const client = new TestRailClient({ baseUrl, email, apiKey });
const user = await client.users.addUser({ name: 'Alice Smith', email: 'alice@example.com', password: 's3cr3t', role_id: 3 });
console.log(user.id); // assigned user ID
```

### 33. Update a user (TestRail 7.3+)

<!-- recipe-for: user:update -->

`user update <user_id>` calls `POST update_user/{user_id}` and returns the
updated `User` object. All fields are optional (PATCH semantics): send only
the fields you want to change. An empty `{}` body is accepted by TestRail
and returns the user unchanged. Pass `password` via `--data-file` or stdin
to avoid shell-history exposure.

```bash
# Deactivate a user
testrail user update 42 --data '{"is_active":false}'
```

```bash
# Change display name and role
testrail user update 42 --data '{"name":"Alice Smith-Jones","role_id":5}'
```

```bash
# Change password safely (keeps secret off the command line)
testrail user update 42 --data-file ./pw-update.json
# pw-update.json: {"password":"newSecret99"}
```

```bash
# Dry-run: verify what would be sent without making an API call
testrail user update 42 --data '{"name":"Preview Name"}' --dry-run
# → {"dryRun":true,"action":"user update","userId":42,"payload":{"name":"Preview Name"},"source":"data"}
```

```typescript
// Programmatic equivalent
const updated = await client.users.updateUser(42, { name: 'Alice Smith-Jones', role_id: 5 });
```

### 34. Add a single test result by test ID

<!-- recipe-for: result:add-by-test -->

`result add-by-test` wraps `POST add_result/{test_id}` — the lightest write
path when you already hold a `test_id` (the run-scoped instance of a case).
Unlike the per-case endpoint (`result add`), this path does not require a
`run_id`; the `test_id` alone identifies the target unambiguously.

```bash
testrail result add-by-test 123 --data '{"status_id":1,"comment":"PASS — verified","elapsed":"45s","version":"2.4.1"}'
```

Default `status_id` mapping (project-specific values may differ — verify with
`testrail status list`):

| ID | Meaning   |
|----|-----------|
| 1  | Passed    |
| 2  | Blocked   |
| 3  | Untested  |
| 4  | Retest    |
| 5  | Failed    |

**When to use per-test vs alternatives:**

- `result add-by-test <test_id>` — one result, you already have the `test_id`
  (e.g. captured from `testrail test list --run-id <id>`). Fewest API calls.
- `result add <run_id> <case_id>` — one result, you have `run_id` + `case_id`
  but no `test_id`. TestRail resolves the test internally.
- `result add-bulk-by-case <run_id>` — many results, identified by `case_id`.
  Prefer this for CI pipelines that report by case, not by test instance.
- `result add-bulk-by-test <run_id>` — many results, identified by `test_id`.
  Use when you have the full test-instance list (e.g. from `test list`).

**Dry-run preview (no API call):**

```bash
testrail result add-by-test 123 --dry-run --data '{"status_id":5,"comment":"Failed on step 3"}'
```

**Custom fields** pass through transparently (`.passthrough()` schema):

```bash
testrail result add-by-test 123 --data '{"status_id":1,"custom_env":"staging","custom_browser":"chrome"}'
```

### 35. Attachment lifecycle (entry types: plan, plan-entry, run, test)

<!-- recipe-for: attachment:list-for-plan -->
<!-- recipe-for: attachment:list-for-plan-entry -->
<!-- recipe-for: attachment:list-for-run -->
<!-- recipe-for: attachment:list-for-test -->
<!-- recipe-for: attachment:add-to-plan -->
<!-- recipe-for: attachment:add-to-plan-entry -->
<!-- recipe-for: attachment:add-to-run -->

Attachments can be stored on four entry types beyond cases and results:
test plans, plan entries, test runs, and individual tests. This recipe
covers the listing and upload workflows for each. Like recipe 16/17/18,
uploads use `--file <path>` (or `--file -` for stdin) and `--filename`
overrides the basename.

**Upload workflow — add attachments to a plan and plan entry:**

```bash
# Upload a requirements document to a test plan.
testrail attachment add-to-plan 100 --file ./requirements.pdf

# Upload a config matrix reference to a plan entry
# (entry_id is a UUID-style string, NOT an integer).
testrail attachment add-to-plan-entry 100 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6' \
  --file ./config-matrix.xlsx
```

**Upload workflow — add attachments to a run and individual tests:**

```bash
# Upload a build log to the entire run.
testrail attachment add-to-run 42 --file ./build.log

# Upload a screenshot to a single test (run instance of a case).
testrail attachment add-to-test 1337 --file ./screenshot.png
```

**Listing workflow — pagination support varies:**

```bash
# List all attachments on a plan (no pagination — TestRail returns
# the full tree; if it's unwieldy, filter on the CLI side).
testrail attachment list-for-plan 100 | jq '.[] | {id, filename, size}'

# List all attachments on a plan entry (also full tree, no pagination).
testrail attachment list-for-plan-entry 100 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6' \
  | jq '.[] | {id, filename, size}'

# List attachments on a run (supports --limit / --offset pagination).
testrail attachment list-for-run 42 --limit 50 --offset 0

# List attachments on a test (also supports --limit / --offset).
testrail attachment list-for-test 1337 --limit 50
```

**Dry-run preview — validate the upload path before committing:**

```bash
testrail attachment add-to-plan 100 --file ./doc.pdf --dry-run
```

**Destructive gate — delete attachments from any entry type:**

Deletion is the same across all entry types (there is no per-entry-type
delete command):

```bash
# Retrieve attachment IDs first.
PLAN_ATTACHMENTS=$(testrail attachment list-for-plan 100)
ATTACH_ID=$(echo "$PLAN_ATTACHMENTS" | jq '.[0].id')

# Dry-run.
testrail attachment delete "$ATTACH_ID" --yes --dry-run

# Real delete.
testrail attachment delete "$ATTACH_ID" --yes
```

Notes:

- **Entry types and scope.** Cases and results are the most common
  attachment targets (`attachment add-to-case`, `add-to-result` from
  recipes 16–18). Plan-scoped attachment listing
  (`list-for-plan`, `list-for-plan-entry`) is useful for attaching
  requirements matrices or config docs that apply to the whole plan or
  a specific plan entry. Run and test attachments are less common but
  mirror the case/result patterns: use `add-to-run` for run-wide
  artifacts and `add-to-test` for test-specific logs or media.
- **Pagination on listing.** `list-for-plan` and `list-for-plan-entry`
  do not paginate (TestRail returns the full attachment tree). All four
  listing actions accept `--format json` (default) or `--format table`.
  `list-for-run` and `list-for-test` support `--limit` and `--offset`
  for pagination (TestRail's server default page size is 250).
- **Upload options.** Both `--file <path>` (local file) and
  `--file -` (stdin) are supported. `--filename <name>` overrides the
  basename; omit it to use the local filename. See recipe 16 for the
  `--filename` pattern.
- **Dry-run and destructive gates.** All write actions (`add-to-*`)
  support `--dry-run` (client-side validation, no API call). Delete
  requires `--yes`; `--dry-run --yes` emits a preview.

### 36. Variable CRUD lifecycle

<!-- recipe-for: variable:list -->
<!-- recipe-for: variable:add -->
<!-- recipe-for: variable:update -->
<!-- recipe-for: variable:delete -->

Variables are project-scoped named placeholders for data-driven testing
(see recipe 29 for the full workflow with datasets). This recipe covers
the metadata-only variable CRUD — renaming and lifecycle.

**Create variables:**

```bash
# Add a variable to a project (name is required; custom_* extras passthrough).
ENV=$(testrail variable add 5 --data '{"name":"env"}')
ENV_ID=$(echo "$ENV" | jq '.id')

# With custom fields.
REGION=$(testrail variable add 5 --data '{"name":"region","custom_owner":"qa-team"}')
REGION_ID=$(echo "$REGION" | jq '.id')
```

**List variables in a project:**

```bash
# All variables in the project.
testrail variable list 5

# Extract IDs for downstream operations.
testrail variable list 5 | jq '.[] | {id, name}'
```

**Update (rename) a variable:**

```bash
# The `update` endpoint only accepts `name` (and custom_* fields).
testrail variable update "$ENV_ID" --data '{"name":"environment"}'
```

**Delete variables (destructive):**

```bash
# Dry-run — no API call, just validate the shape.
testrail variable delete "$ENV_ID" --yes --dry-run

# Real delete — irreversible.
testrail variable delete "$ENV_ID" --yes
```

**Example — data-driven test provisioning:**

```bash
# Provision variables for a staging test matrix.
ENVS=$(testrail variable add 5 --data '{"name":"env"}' | jq '.id')
REGIONS=$(testrail variable add 5 --data '{"name":"region"}' | jq '.id')

# Reference them in case steps with ${env}, ${region}.
# (The web UI or API step-insertion workflow adds the case content.)

# Tear down at end of test cycle.
testrail variable delete "$ENVS" --yes
testrail variable delete "$REGIONS" --yes
```

Notes:

- **Project-scoped IDs.** Each variable's ID is global but the variable
  is scoped to a project. The same `name` in a different project is a
  different ID. Always pair list/mutate calls with the project context
  (`variable list <project_id>`).
- **Metadata-only on CLI.** The CLI `add/update` operations accept
  `name` and `custom_*` fields only. Actual variable values are
  managed through plan entry datasets in the web UI or API (row-level
  CRUD is not yet part of the documented public API surface).
- **Destructive gate.** `variable delete` is irreversible — requires
  `--yes` and does not support `--soft` server-side preview (TestRail's
  `delete_variable` endpoint does not expose a soft mode). Use
  `--dry-run` to validate intent before committing.
- **Linked to datasets.** Variables are referenced by name inside
  dataset rows (the binding happens in the web UI or via row-CRUD
  endpoints on the API). Deleting a variable does not invalidate
  existing dataset rows — they retain the literal `${var_name}` text
  and fail to substitute at run time if the variable is missing.

### 37. Configuration mutation: update configuration & configuration-group

<!-- recipe-for: configuration:update -->
<!-- recipe-for: configuration-group:update -->

This recipe covers the update (rename) path for configurations and
configuration groups. For the full hierarchy lifecycle (add, list, delete),
see recipe 27. Updates are the narrow case — partial field mutations
on existing configs/groups.

**Update a configuration group (rename):**

```bash
# Fetch the ID (from configuration list or earlier add).
testrail configuration-group update 7 --data '{"name":"Desktop Browsers"}'
```

**Update a configuration (leaf; rename):**

```bash
# Configuration update takes a config_id (NOT a config_group_id).
testrail configuration update 12 --data '{"name":"Chrome (v120+)"}'
```

**Verify changes:**

```bash
# List the entire tree to confirm the rename propagated.
testrail configuration list 5 | jq '.[] | {id, name, configs: [.configs[].name]}'
```

**Programmatic perspective — TypeScript:**

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({...});

// Rename a configuration group.
await client.configurations.updateConfigurationGroup(7, { name: 'Desktop Browsers' });

// Rename a leaf configuration.
await client.configurations.updateConfiguration(12, { name: 'Chrome (v120+)' });

// List the tree to verify.
const groups = await client.configurations.getConfigurations(5);
groups.forEach((g) => console.log(g.name, g.configs.map((c) => c.name)));
```

Notes:

- **Update is rename-only (on CLI).** The `update_config` and
  `update_config_group` endpoints accept only the `name` field.
  Custom fields are NOT supported (the configuration API does not
  expose a `custom_*` passthrough). If you need to reorder or manage
  other metadata, use the TestRail web UI.
- **Leaf vs parent scope.** Configuration groups (`configuration-group`)
  and individual configs (`configuration`) are separate resources with
  different ID spaces. Renaming a group does not affect its children;
  renaming a config does not affect its siblings.
- **Impact on plan entries.** Renaming a config invalidates the human-
  readable shortlist in plan-entry UIs (the config remains functional —
  the ID is stable, only the display name changes). Existing runs and
  results that reference the old name survive unchanged; the new name
  applies to future selections.
- **Non-destructive.** Updates are safe — TestRail keeps the ID and
  does not cascade or require `--yes` confirmation. Pair with
  `configuration list <project_id>` to inspect the tree before renaming.


### 38. Plan entry extensions — add/update runs within existing entries

<!-- recipe-for: plan:add-run-to-entry -->
<!-- recipe-for: plan:update-entry -->
<!-- recipe-for: plan:update-run-in-entry -->

Once a plan entry exists (created with `plan add-entry`), extend it by adding new config-specific runs (when
you add support for a new platform mid-cycle) and by mutating the entry's metadata (name, assignee, case
selection) across all its runs.

**Add a fresh run to an entry (new platform):**

```bash
# Plan 100, entry a1b2c3d4e5f6... already has runs for Chrome & Firefox.
# Add a fresh run for Safari.
RESULT=$(testrail plan add-run-to-entry 100 a1b2c3d4e5f6 --data '{
    "config_ids": [3],
    "assignedto_id": 9
}')
echo "$RESULT" | jq '.id'  # New run_id, can be used in `result add` or `run watch`
```

Payload keys:

- `config_ids` (required) — TestRail configuration IDs for this run (array of integers).
- `assignedto_id` (optional) — User ID to assign the run to.
- `include_all` (optional) — If `true`, include all cases in the suite; if `false`, include only
  cases specified by `case_ids`.
- `case_ids` (optional) — Array of case IDs to include (ignored if `include_all: true`).

**Update entry metadata across all its runs:**

```bash
# Rename the entry & swap assignee (applies to every run in the entry)
testrail plan update-entry 100 a1b2c3d4e5f6 --data '{
    "name": "Smoke tests (renamed)",
    "assignedto_id": 10,
    "include_all": false,
    "case_ids": [1, 2, 3, 5]
}'
```

Payload keys:

- `name` (optional) — New entry name.
- `assignedto_id` (optional) — New assignee user ID.
- `include_all` (optional) — Toggle case selection mode (`true` = all; `false` = selection).
- `case_ids` (optional) — If `include_all: false`, which cases to include.

**Update a single run inside an entry (swap assignee, refine case selection):**

```bash
# Reassign Safari run to user 11 and include only specific cases
SAFARI_RUN_ID=42
testrail plan update-run-in-entry "$SAFARI_RUN_ID" --data '{
    "description": "Safari smoke suite",
    "assignedto_id": 11,
    "include_all": false,
    "case_ids": [1, 2, 3, 5]
}'
```

Payload keys (only these fields are mutable for runs inside entries):

- `description` (optional) — Run description.
- `assignedto_id` (optional) — Assignee user ID.
- `include_all` (optional) — Case selection mode toggle.
- `case_ids` (optional) — Case IDs if `include_all: false`.

**Dry-run preview:**

```bash
testrail plan update-entry 100 a1b2c3d4e5f6 --dry-run --data '{"name": "New name"}'
```

See also recipe #25 for the full plan lifecycle (add → entry → runs → close/delete cascade).

### 39. Run lifecycle — list active runs, update metadata, close and delete

<!-- recipe-for: run:list -->
<!-- recipe-for: run:update -->
<!-- recipe-for: run:delete -->

Runs are the execution containers for test cases. Typical workflows: enumerate active runs for a project,
update run metadata (milestone, assignee), and eventually close or delete the run and its associated results.

**List all runs in a project (with pagination):**

```bash
# Page 1: first 250 (default limit)
testrail run list 5 | jq '.[] | {id, name, is_completed, passed_count, failed_count}'

# Page 2 with custom limit
testrail run list 5 --offset 250 --limit 100 | jq '.[] | select(.is_completed == false)'

# Filter by status using jq post-processing
testrail run list 5 | jq '.[] | select(.is_completed == false) | {id, name}'
```

`run list` returns an array of run objects with:

- `id` (number) — Run ID.
- `name` (string) — Run name.
- `is_completed` (boolean) — Whether the run is closed.
- `passed_count`, `failed_count`, `blocked_count`, `untested_count` (numbers) — Result summary.
- `completed_on` (number | null) — Timestamp if closed.
- `milestone_id` (number | null) — Associated milestone ID.
- `assignedto_id` (number | null) — Assigned user ID.

**Update run metadata:**

```bash
# Re-assign, add milestone, update description
testrail run update 42 --data '{
    "name": "Chrome desktop @ v2.0",
    "milestone_id": 7,
    "assignedto_id": 9,
    "description": "Updated to cover 2.0 release"
}'

# Dry-run (no API call)
testrail run update 42 --dry-run --data '{"milestone_id": 8}'
```

Payload keys (all optional):

- `name` — New run name.
- `description` — Run description.
- `milestone_id` — Milestone to associate (or `null` to clear).
- `assignedto_id` — Assignee user ID (or `null` to clear).
- `include_all` — Redefine case selection (rarely done post-creation).
- `case_ids` — Case selection if `include_all: false`.

**Close a run (irreversible — preferred when preserving results):**

```bash
# Close the run — results stay queryable, but no new results can be added
testrail run close 42 --yes

# Dry-run preview
testrail run close 42 --yes --dry-run
```

A closed run's `is_completed` flag becomes `true` and `completed_on` is set to the current timestamp.
TestRail has no `open_run` endpoint; closing is not reversible.

**Delete a run (irreversible — removes run and all results):**

```bash
# Delete the run and every result in it
testrail run delete 42 --yes

# Server-side preview (TestRail returns affected-test count without deleting)
testrail run delete 42 --yes --soft

# Dry-run (client-side preview, no API call)
testrail run delete 42 --yes --dry-run
```

Differences:

- `--soft` — Test TestRail's soft-delete preview (API call made, no deletion).
- `--dry-run` — Client-side prediction only (no API call); overrides `--yes`.
- `--yes` — Required gate for destructive operation.

**Status check from `run list` output:**

```bash
# Count active vs closed runs
RUNS=$(testrail run list 5)
ACTIVE=$(echo "$RUNS" | jq '[.[] | select(.is_completed == false)] | length')
CLOSED=$(echo "$RUNS" | jq '[.[] | select(.is_completed == true)] | length')
echo "Active: $ACTIVE, Closed: $CLOSED"
```

See recipe #31 for polling a run until completion with `run watch`.

### 40. Milestone lifecycle — read, list, create, update, close and delete

<!-- recipe-for: milestone:get -->
<!-- recipe-for: milestone:list -->
<!-- recipe-for: milestone:add -->
<!-- recipe-for: milestone:update -->
<!-- recipe-for: milestone:delete -->

Milestones group runs and plans into named release checkpoints. This recipe covers the complete CRUD
lifecycle: fetch individual milestones, list them per project, create new ones, update metadata
(including `is_completed` / `is_started` toggles), and delete old milestones.

**Fetch a single milestone:**

```bash
testrail milestone get 7 | jq '{id, name, description, is_completed, is_started}'
```

Returns a milestone object with:

- `id` (number) — Milestone ID.
- `name` (string) — Milestone name.
- `description` (string) — Milestone description.
- `due_on` (number | null) — Unix timestamp of deadline.
- `is_completed` (boolean) — Whether marked complete.
- `is_started` (boolean) — Whether marked started (TestRail 7.5+).
- `completed_on` (number | null) — Timestamp when completed.
- `project_id` (number) — Parent project ID.

**List all milestones in a project (paginated):**

```bash
# All milestones, any status
testrail milestone list 5 | jq '.[] | {id, name, is_completed}'

# Filter to active milestones (not completed)
testrail milestone list 5 | jq '.[] | select(.is_completed == false)'

# Pagination example
testrail milestone list 5 --offset 250 --limit 50
```

**Create a new milestone:**

```bash
MILESTONE=$(testrail milestone add 5 --data '{
    "name": "Release 2.0",
    "description": "Q2 2025 feature release",
    "due_on": 1718736000
}')
MILESTONE_ID=$(echo "$MILESTONE" | jq '.id')
echo "Created milestone $MILESTONE_ID"
```

Payload keys:

- `name` (required) — Milestone name.
- `description` (optional) — Milestone description.
- `due_on` (optional) — Unix timestamp deadline.
- `parent_id` (optional) — Parent milestone ID for hierarchy (TestRail 6.5+).
- `is_started` (optional) — Mark as started (TestRail 7.5+).

**Update milestone metadata:**

```bash
# Rename, adjust deadline, or mark as started
testrail milestone update 7 --data '{
    "name": "Release 2.0 (delayed)",
    "due_on": 1725312000,
    "is_started": true
}'

# Mark complete
testrail milestone update 7 --data '{"is_completed": true}'

# Dry-run preview
testrail milestone update 7 --dry-run --data '{"is_completed": true}'
```

Payload keys (all optional):

- `name` — New milestone name.
- `description` — New description.
- `due_on` — New deadline (Unix timestamp, or `null` to clear).
- `is_completed` — Mark as complete (`true`) or reopen (`false`).
- `is_started` — Mark as started (TestRail 7.5+).

**Delete a milestone (irreversible):**

```bash
# Delete the milestone (associated runs/plans are unaffected)
testrail milestone delete 7 --yes

# Server-side soft-preview (TestRail returns referencing-run count without deleting)
testrail milestone delete 7 --yes --soft

# Dry-run (client-side prediction, no API call)
testrail milestone delete 7 --yes --dry-run
```

When a milestone is deleted, runs/plans that reference it keep their `milestone_id` field but the
milestone record itself is removed. A subsequent `milestone list` will not include it.

**Workflow example — release versioning:**

```bash
# Create milestones for the quarter
M1=$(testrail milestone add 5 --data '{"name":"2.0 alpha","due_on":1718736000}' | jq -r '.id')
M2=$(testrail milestone add 5 --data '{"name":"2.0 beta","due_on":1721328000}' | jq -r '.id')
M3=$(testrail milestone add 5 --data '{"name":"2.0 GA","due_on":1723920000}' | jq -r '.id')

# As work progresses, mark milestones started/complete
testrail milestone update "$M1" --data '{"is_started":true}'
testrail milestone update "$M1" --data '{"is_completed":true}'   # alpha done
testrail milestone update "$M2" --data '{"is_started":true}'     # beta starts

# Clean up old milestones from previous quarter
OLD_MILESTONE=$(testrail milestone list 5 | jq -r '.[] | select(.name == "1.9 GA") | .id')
test -n "$OLD_MILESTONE" && testrail milestone delete "$OLD_MILESTONE" --yes
```

### 41. User lookups: current session, by ID, by email

<!-- recipe-for: user:get-current -->
<!-- recipe-for: user:get -->
<!-- recipe-for: user:get-by-email -->

The three user lookups serve distinct use cases. All return a single `User` object
with fields like `id`, `name`, `email`, `role_id`, `group_ids`, `is_active`.

**Get current session user** (auth-bound; TestRail 6.6+):

`user get-current` calls `GET get_current_user` and returns the user identified by
the API key you authenticated with. Requires no path args and always reflects your
own account. Useful to bootstrap a session or verify permissions:

```bash
testrail user get-current
# → {"id":5,"name":"Alice Smith","email":"alice@example.com","role_id":3,"is_active":true,...}
```

```bash
# Check your own role to determine what you can do
testrail user get-current | jq '.role_id'
```

**Get user by ID** (any user, universal):

`user get <user_id>` calls `GET get_user/{user_id}` and returns a user by their
numeric ID. Works for any user on the instance:

```bash
testrail user get 5
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

**Get user by email** (email-based lookup):

`user get-by-email` calls `GET get_user_by_email` and finds a user by their
email address. Takes no path args; requires `--email <address>` flag:

```bash
testrail user get-by-email --email alice@example.com
# → {"id":5,"name":"Alice Smith","email":"alice@example.com",...}
```

```bash
# Combine with jq to extract just the user ID
testrail user get-by-email --email alice@example.com | jq '.id'
```

**When to use each:**

- `user get-current` — you want info about your own account (always works,
  bound to auth credentials).
- `user get <user_id>` — you already know the numeric ID (direct, fast).
- `user get-by-email <email>` — you have an email address and need to find
  the user's ID or other metadata (e.g. provisioning workflows that resolve
  email → user_id before assigning to a group).

**Programmatic equivalents:**

```typescript
const current = await client.users.getCurrentUser();
const user = await client.users.getUser(5);
const userByEmail = await client.users.getUserByEmail('alice@example.com');
```

### 42. Group CRUD lifecycle (TestRail 7.5+)

<!-- recipe-for: group:get -->
<!-- recipe-for: group:list -->
<!-- recipe-for: group:add -->
<!-- recipe-for: group:update -->
<!-- recipe-for: group:delete -->

User groups are instance-level resources that organize users into permission sets.
All group actions require TestRail 7.5+. The CRUD shape mirrors suites/milestones:
`get` and `list` are reads; `add`, `update`, `delete` are writes. `delete`
is destructive and requires `--yes`.

**Get a single group by ID:**

`group get <group_id>` calls `GET get_group/{group_id}` and returns the group
object with `id`, `name`, `user_ids` (array of user IDs in the group).

```bash
testrail group get 12
# → {"id":12,"name":"QA Team","user_ids":[5,6,7]}
```

**List all groups on the instance:**

`group list` calls `GET get_groups` (no path args) and returns an array of
all user groups defined on the TestRail instance:

```bash
testrail group list
# → [{"id":1,"name":"Admins","user_ids":[1,2]},{"id":12,"name":"QA Team","user_ids":[5,6,7]}]
```

```bash
# Count groups
testrail group list | jq 'length'
```

**Create a new group (payload-only):**

`group add` calls `POST add_group` and takes no path args. Body requires `name`
(string) and optional `user_ids` (array of numeric user IDs to add on creation).
Returns the created group object with assigned `id`:

```bash
testrail group add --data '{"name":"QA West","user_ids":[5,6]}'
# → {"id":12,"name":"QA West","user_ids":[5,6]}
```

```bash
# Dry-run: validate the payload without creating the group
testrail group add --data '{"name":"QA West"}' --dry-run
# → {"dryRun":true,"action":"group add","payload":{"name":"QA West"},"source":"data"}
```

**Update an existing group (partial fields):**

`group update <group_id>` calls `POST update_group/{group_id}` and allows
partial updates. You can change `name`, `user_ids`, or both. An empty `{}`
body is accepted and returns the group unchanged (PATCH semantics):

```bash
# Rename a group
testrail group update 12 --data '{"name":"QA West + Central"}'
```

```bash
# Replace the group membership (all users in one call)
testrail group update 12 --data '{"user_ids":[5,6,8,10]}'
```

```bash
# Change both name and members
testrail group update 12 --data '{"name":"QA","user_ids":[5,6]}'
```

**Delete a group (requires `--yes`):**

`group delete <group_id>` calls `POST delete_group/{group_id}` and is destructive.
Pass `--yes` to confirm:

```bash
testrail group delete 12 --yes
# → (empty response; group is gone)
```

```bash
# Dry-run: preview what would be deleted without making the API call
testrail group delete 12 --dry-run
# → {"destructive":true,"dryRun":true,"action":"group delete","groupId":12}
```

**Programmatic equivalents:**

```typescript
const group = await client.users.getGroup(12);
const allGroups = await client.users.getGroups();
const created = await client.users.addGroup({ name: 'QA West', user_ids: [5, 6] });
const updated = await client.users.updateGroup(12, { name: 'QA West + Central' });
await client.users.deleteGroup(12);
```

### 43. Role list (TestRail permission roles)

<!-- recipe-for: role:list -->

`role list` calls `GET get_roles` (no path args) and returns an array of all
user roles defined on the TestRail instance. Each role has an `id` (numeric),
`name` (string), and `is_admin` (boolean) flag.

Standard TestRail roles (instance-specific IDs may vary; query to be sure):

```bash
testrail role list
# → [{"id":1,"name":"Admin","is_admin":true},{"id":2,"name":"Analyst","is_admin":false},...]
```

```bash
# Extract role IDs and names as a lookup table
testrail role list | jq 'map({id, name}) | from_entries'
# → {"Admin":"1","Analyst":"2",...}
```

```bash
# Find the admin role
testrail role list | jq '.[] | select(.is_admin == true)'
# → {"id":1,"name":"Admin","is_admin":true}
```

Use role IDs when creating or updating users (`user add`, `user update`)
to assign a specific permission level:

```bash
# Assign admin role (assuming role_id=1) when creating a user
testrail user add --data '{"name":"Charlie","email":"charlie@example.com","password":"secret","role_id":1}'
```

**Programmatic equivalent:**

```typescript
const roles = await client.metadata.getRoles();
```



### 44. Case lifecycle: read, edit history, copy, move, and bulk update

<!-- recipe-for: case:get -->
<!-- recipe-for: case:history -->
<!-- recipe-for: case:copy-to-section -->
<!-- recipe-for: case:move-to-section -->
<!-- recipe-for: case:update-bulk -->

This recipe combines the main case read and mutation patterns: fetch a single
case, audit its edit history, duplicate it to another section, move a batch
into a new home, and bulk-update many cases in a suite to the same field values.

**Fetch a single case by ID:**

```bash
testrail case get 1337 | jq '{id, title, section_id, type_id, priority_id, assigned_to_id}'
```

The response includes every custom field defined on the TestRail instance
(those starting with `custom_`). Pipe to `jq` to extract fields of interest.

**Audit edit history (TestRail 7.5+):**

History is paginated; use `--limit` and `--offset` to page through large changelogs:

```bash
# Fetch the 50 most recent edits to case 1337.
testrail case history 1337 --limit 50

# Page backward through 500 edits (10 pages of 50).
for offset in 0 50 100 150 200 250 300 350 400 450; do
    testrail case history 1337 --limit 50 --offset "$offset" | jq -c '.[]'
done
```

Each history entry includes: `id`, `created_by`, `created_on` (Unix timestamp),
`action` (e.g., "created", "updated"), and `changes` (list of field mutations).
Use this before any destructive update or delete to confirm no other user
has modified the case recently.

**Copy a case (or batch) to a new section:**

`case copy-to-section` creates independent clones in the destination; the
original case remains in its source section. Useful for duplicating a case
across multiple test suites or sections without disturbing the original.

```bash
# Copy case 1337 into section 99. Specify the target section in the path;
# the payload identifies the source case(s).
testrail case copy-to-section 99 --data '{
    "case_ids": [1337, 1338]
}'
```

The response is the array of newly created case objects. Each has a fresh `id`
and inherits custom fields from the source.

**Move a batch of cases to a new section (requires suite context):**

Unlike copy, move is destructive — the cases leave their source section and
land in the destination (same suite only). The `suite_id` in the payload tells
TestRail which suite contains both source and destination sections.

```bash
# Move cases 1337, 1338 from their current section into section 99.
# suite_id identifies the suite scope (both sections must be in the same suite).
testrail case move-to-section 99 --data '{
    "case_ids": [1337, 1338],
    "suite_id": 12
}'
```

**Bulk-update many cases to the same field values:**

`case update-bulk` is a mass-mutation tool: update `priority_id`, `assigned_to_id`,
`custom_*` fields, etc. across a suite's cases in a single API call. Apply the
same logic to a list of case IDs without burning rate budget on N individual
`case update` calls.

```bash
# Promote the priority on three cases at once.
testrail case update-bulk 12 --data '{
    "case_ids": [1337, 1338, 1339],
    "priority_id": 2
}'
```

Bulk updates can include custom fields (pass them as top-level keys in the
payload, using the field ID as the key — e.g., `"custom_rfc": "RFC-5678"`).

**CI/scripting pattern — list all cases in a suite, then bulk-promote by priority:**

```bash
# Extract case IDs where assigned_to_id is null (unassigned).
CASES=$(testrail case list --project-id 5 --suite-id 12 | \
    jq -r '.[] | select(.assigned_to_id == null) | .id')

# Convert to a JSON array and bulk-update.
CASE_IDS=$(echo "$CASES" | jq -Rs 'split("\n") | map(select(. != "") | tonumber)')

testrail case update-bulk 12 --data "$(jq -n --argjson ids "$CASE_IDS" '{
    "case_ids": $ids,
    "priority_id": 4
}')"
```

### 45. Case field configuration and discovery

<!-- recipe-for: case-field:list -->
<!-- recipe-for: case-field:add -->

Custom case fields are instance-level metadata: once defined, they appear
on every case in every project and persist across suite/section mutations.
Use `case-field list` to discover fields and their type/config; use `case-field add`
(admin-only) to define new fields.

**List all custom case fields on the instance:**

```bash
testrail case-field list | jq '.[] | {id, label, type_id, configs}'
```

Each entry has:
- `id` — numeric field ID (use this when writing payloads)
- `label` — display name
- `type_id` — field type (see below)
- `configs` — if a dropdown/checkbox field, the list of valid option IDs
- `is_global` — whether the field is instance-wide (true) or project-scoped (false)

Common type IDs:

| type_id | Meaning      | Payload shape              |
|---------|--------------|----------------------------|
| 1       | String       | `"custom_myfield": "value"`|
| 2       | Integer      | `"custom_myfield": 42`     |
| 3       | Text (multi) | `"custom_myfield": "text"` |
| 4       | URL          | `"custom_myfield": "http..."`|
| 5       | Checkbox     | `"custom_myfield": true`   |
| 6       | Dropdown     | `"custom_myfield": "opt_id"` or array `[id1, id2]` for multi-select|
| 7       | User         | `"custom_myfield": user_id` (or null)|
| 8       | Date         | `"custom_myfield": "2025-05-20"` (RFC 3339 or YYYY-MM-DD)|

**Create a new custom case field (admin-only):**

```bash
# Add a string field named "RFC Reference".
testrail case-field add --data '{
    "type_id": 1,
    "label": "RFC Reference",
    "description": "Link to design RFC in internal wiki"
}'
```

On success, TestRail returns the new field object with an assigned `id`.
You can then use `"custom_<id>": "value"` in case payloads going forward.

Note: `response.configs` is returned as a JSON-encoded string — use
`JSON.parse(result.configs)` to access the structured config objects
(this differs from the array shape returned by `get_case_fields`).

Common field creation options:

```bash
# A dropdown field with options (e.g., environment tier).
testrail case-field add --data '{
    "type_id": 6,
    "label": "Environment Tier",
    "configs": [
        {"id": "opt_1", "name": "dev"},
        {"id": "opt_2", "name": "staging"},
        {"id": "opt_3", "name": "prod"}
    ]
}'

# A date field.
testrail case-field add --data '{
    "type_id": 8,
    "label": "Target Release Date"
}'
```

Note: field IDs are instance-global; once created, they exist across all
projects. Always `case-field list` first to avoid duplicate definitions.

### 46. Case metadata lookups: types and statuses

<!-- recipe-for: case-type:list -->
<!-- recipe-for: case-status:list -->

`case-type list` and `case-status list` are reference-data queries: discover
the built-in and custom case types and statuses available in your TestRail
instance. These are typically used at startup to seed a mapping or in
validation logic before writing cases.

**List all case types (readonly):**

Case types categorize the intent of a case (e.g., Automated, Manual, Exploratory).

```bash
testrail case-type list
```

Output:

```json
[
    {"id": 1, "name": "Automated", "is_builtin": true},
    {"id": 2, "name": "Manual", "is_builtin": true},
    {"id": 3, "name": "Exploratory", "is_builtin": true},
    {"id": 4, "name": "Performance", "is_builtin": false}
]
```

Use these IDs in `type_id` when creating or updating cases:

```bash
testrail case add 42 --data '{"title": "Login flow", "type_id": 1}'
```

**List all case-level statuses (TestRail 7.5+):**

Case-level statuses (distinct from result statuses) model the lifecycle of
a case itself: Draft, Active, Deprecated, etc. This is different from a
result status (Passed/Failed) and is rarely used on cloud instances; more
common in on-premise with custom lifecycle policies.

```bash
testrail case-status list
```

If the instance supports case-level statuses, the response is an array with
`id`, `name`, `color` (hex code for UI rendering), and metadata. If not
supported (cloud instances < 7.5), the API returns an empty array or 400.

Compatibility note: always check the length of the response before assuming
the feature is available — do not hardcode status IDs.

### 47. Delete a single test case with safety gates

<!-- recipe-for: case:delete -->

`case delete` removes a single case and all its associated history, results,
and attachments. It is **irreversible** — TestRail does not provide soft-delete
or transaction rollback. The CLI gates deletion behind two safety layers:
`--yes` (client-side) and `--soft` (server-side preview).

**Destructive-action gate (`--yes` + env var):**

All destructive CLI actions (case delete, run delete, suite delete, etc.)
require both:
1. The `--yes` flag (client-side gate)
2. The `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable (second layer)

Omitting either prevents the API call:

```bash
# Without --yes: exits 1.
testrail case delete 1337
# Error: Destructive action; pass --yes to confirm.

# Without env var: exits 1.
testrail case delete 1337 --yes
# Error: Destructive action requires TESTRAIL_ALLOW_DESTRUCTIVE=1.
```

Both must be present:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes
```

**Server-side preview with `--soft` (hits API, no deletion):**

The `--soft` flag (independent of `--yes`) tells TestRail to return a preview
of affected entities without actually deleting. This is distinct from `--dry-run`
(client-side, no API call):

```bash
# Server-side preview: hit the API, receive affected-entity count, no deletion.
# Still requires --yes gate; still consumes one API request.
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes --soft
```

Response (no deletion occurred):

```json
{
    "caseId": 1337,
    "soft": true,
    "deleted": false,
    "preview": {
        "cases_affected": 1,
        "results_affected": 42,
        "attachments_affected": 3
    }
}
```

**Client-side preview with `--dry-run` (no API call):**

`--dry-run` short-circuits before any request and emits a client-side validation
preview. Useful for CI pipelines to confirm the ID parses before consuming rate
budget:

```bash
testrail case delete 1337 --dry-run --yes
```

Output:

```json
{
    "caseId": 1337,
    "destructive": true,
    "dry_run": true,
    "soft": false
}
```

**Three safety layers in order of precedence (from highest to lowest):**

| Flag         | Side       | API call? | Effect                              |
|--------------|------------|-----------|------------------------------------|
| `--dry-run`  | client     | no        | Parses ID, emits preview, exits 0  |
| `--soft`     | server     | yes       | TestRail returns preview, no delete|
| `--yes`      | client     | n/a       | Gate; without it, exits 1          |

`--dry-run` always wins: if present, neither `--soft` nor any API happens.

**Recommended CI pattern — audit before commit:**

```bash
# Step 1: Client-side validation (no API call, no rate-limit impact).
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail case delete 1337 --yes --dry-run

# Step 2: Server-side preview (costs 1 API request, returns counts).
PREVIEW=$(testrail case delete 1337 --yes --soft)
RESULTS_AFFECTED=$(echo "$PREVIEW" | jq '.preview.results_affected')

if [ "$RESULTS_AFFECTED" -gt 100 ]; then
    echo "Too many results affected; aborting." >&2
    exit 1
fi

# Step 3: Real delete (irreversible).
testrail case delete 1337 --yes
```

**Recovery if a delete fires by mistake:**

- **No client-side recovery.** Once `--yes --soft` is omitted and the CLI
  sends the request, TestRail deletes the case server-side immediately.
- **TestRail audit log** (admin panel, Web UI) records the deletion with
  the acting user and timestamp. Use this to identify when the case was
  removed and by whom.
- **TestRail support recovery** (Cloud/on-premise) depends on backup
  cadence. Open a support ticket immediately; backups roll off after
  7–30 days depending on your plan.

**Idempotence and race conditions:**

If the case ID does not exist, TestRail returns 404 / "Case not found".
The CLI exits 1 with that error; it does not "succeed" on missing IDs.
In CI pipelines, account for this:

```bash
export TESTRAIL_ALLOW_DESTRUCTIVE=1

if testrail case delete 1337 --yes; then
    echo "Case 1337 deleted."
elif [ $? -eq 1 ]; then
    # Could be 404 (not found) or a network error — check stderr
    if testrail case delete 1337 --dry-run 2>&1 | grep -q "not found"; then
        echo "Case 1337 does not exist; skipping."
    else
        echo "Delete failed; aborting." >&2
        exit 1
    fi
fi
```



### 48. Section CRUD lifecycle (get → list → add → move → update → delete)

<!-- recipe-for: section:get -->
<!-- recipe-for: section:list -->
<!-- recipe-for: section:add -->
<!-- recipe-for: section:move -->
<!-- recipe-for: section:update -->
<!-- recipe-for: section:delete -->

Sections are containers for test cases within a suite. This walkthrough
shows the full lifecycle: discover sections, create new ones, reorder
them, update metadata, and delete when no longer needed.

**1. Fetch a single section by ID:**

```bash
testrail section get 42
```

Returns `{ id: 42, project_id: 5, suite_id: 12, parent_id: null, name: "Login", depth: 0, display_order: 1 }` etc.

**2. List all sections in a project (optionally filtered by suite):**

```bash
# All sections in the project
testrail section list 5

# Sections in a specific suite (multi-suite mode projects only)
testrail section list 5 --suite-id 12
```

**3. Create a new section:**

For multi-suite mode projects, `suite_id` is required. Single-suite mode
projects will use their default suite if omitted.

```bash
testrail section add 5 --data '{
    "name": "Authentication",
    "suite_id": 12,
    "description": "Login, SSO, session handling"
}'
```

**4. Move a section to reorder or reparent (TestRail 6.5.2+):**

```bash
# Move to a different parent section or top-level position
testrail section move 42 --data '{
    "parent_id": 50,
    "display_order": 2
}'

# Move to top level (no parent)
testrail section move 42 --data '{
    "parent_id": null,
    "display_order": 1
}'
```

The `move_section` endpoint accepts partial payloads — omit fields you
don't want to change.

**5. Update section metadata (name, description):**

```bash
testrail section update 42 --data '{
    "name": "Authentication (renamed)",
    "description": "Updated scope"
}'
```

**6. Delete a section (destructive; requires --yes):**

```bash
testrail section delete 42 --yes
```

TestRail's `delete_section` cascade behavior:
- Deletes the section and all child sections (if nested).
- Deletes all cases under those sections.
- **Does NOT** automatically reassign cases to a different section —
  you must explicitly `case move-to-section` before deleting if you
  want to preserve them.

Use `--dry-run` to preview the call shape without deleting:

```bash
testrail section delete 42 --yes --dry-run
```

### 49. Suite CRUD lifecycle (get → add → update → delete)

<!-- recipe-for: suite:get -->
<!-- recipe-for: suite:add -->
<!-- recipe-for: suite:update -->
<!-- recipe-for: suite:delete -->

Suites are the top-level test organization container. They separate test
cases into independent test inventories within a project. This recipe
covers the full lifecycle.

**1. Fetch a single suite by ID:**

```bash
testrail suite get 12
```

Returns `{ id: 12, project_id: 5, name: "Web API", is_master: false, is_baseline: false, ... }` etc.

**2. Create a new suite in a project:**

```bash
testrail suite add 5 --data '{
    "name": "Mobile App",
    "description": "iOS and Android test cases"
}'
```

The `is_master` and `is_baseline` flags are read-only and cannot be set on
creation — they are managed by TestRail internally.

**3. Update suite metadata (name, description):**

```bash
testrail suite update 12 --data '{
    "name": "Web API (renamed)",
    "description": "REST and GraphQL endpoints"
}'
```

**4. Delete a suite (destructive; requires --yes):**

```bash
testrail suite delete 12 --yes
```

TestRail's `delete_suite` removes:
- The suite itself.
- All sections and cases inside the suite.
- All runs, tests, and results associated with cases in that suite.

This is irreversible. Use `--dry-run` to validate the call before
executing:

```bash
testrail suite delete 12 --yes --dry-run
```

**Gotcha:** If a project is in **multi-suite mode**, you cannot delete
all suites. At least one suite must exist. Attempting to delete the
last suite returns a 400 / `"Invalid request"` error.

### 50. Shared steps (get → list)

<!-- recipe-for: shared-step:get -->
<!-- recipe-for: shared-step:list -->

Shared steps are reusable step templates that appear in cases as
single-instance references (TestRail 7.0+). This recipe covers
discovering and fetching them. For creation/update/deletion, see
the existing recipes for `shared-step:add`, `shared-step:update`,
and `shared-step:delete`.

**1. Fetch a single shared step set by ID:**

```bash
testrail shared-step get 100
```

Returns `{ id: 100, project_id: 5, name: "Navigate to login", steps: [...] }` etc. The `steps` array contains the step definitions.

**2. List all shared step sets in a project:**

```bash
testrail shared-step list 5
```

Includes all shared step sets, paginated. Use `--limit` and `--offset` for pagination:

```bash
testrail shared-step list 5 --limit 50 --offset 100
```

**Example workflow:** Look up a shared step to verify its ID before
embedding it in a case:

```bash
# Find the shared step ID
STEP_ID=$(testrail shared-step list 5 | jq '.[] | select(.name == "Navigate to login") | .id')

# Use it when adding a case
testrail case add 42 --data "{
    \"title\": \"Login flow\",
    \"type_id\": 1,
    \"custom_steps\": [
        {\"content\": \"{step_id: ${STEP_ID}}\"}
    ]
}"
```

### 51. BDD scenarios (get → add)

<!-- recipe-for: bdd:get -->
<!-- recipe-for: bdd:add -->

TestRail's BDD (Behavior-Driven Development) mode stores Gherkin
.feature files as case content. This recipe covers downloading and
uploading Gherkin scenarios.

**1. Download a case's BDD (Gherkin .feature) content to a file:**

```bash
testrail bdd get 1337 --out scenario.feature
```

The output is UTF-8 plain text in Gherkin syntax:

```gherkin
Feature: Login
  Scenario: Valid credentials
    Given I am on the login page
    When I enter email "user@example.com"
    And I enter password "secret123"
    Then I should see the dashboard
```

Use `--force` to overwrite an existing file:

```bash
testrail bdd get 1337 --out scenario.feature --force
```

**2. Upload a .feature file as the BDD content for a case:**

```bash
testrail bdd add 1337 --file scenario.feature
```

The file must be valid UTF-8 Gherkin. TestRail validates the syntax
before accepting the upload. If the file is malformed, the CLI returns
a 400 / validation error with details.

**Dry-run preview:**

```bash
testrail bdd add 1337 --file scenario.feature --dry-run
```

Shows the parsed file size and mimetype without uploading.

**Integration pattern:** Maintain scenarios in version control, then
sync to TestRail:

```bash
for feature in features/*.feature; do
    CASE_ID=$(echo "$feature" | sed 's/.*-\([0-9]*\)\.feature/\1/')
    testrail bdd add "$CASE_ID" --file "$feature" --yes
done
```

### 52. Test case templates (template list)

<!-- recipe-for: template:list -->

Test case templates define the default fields and custom-field layout
when creating a new case. This recipe shows how to list available
templates in a project — useful for understanding which custom fields
are required or optional when authoring cases.

```bash
testrail template list 5
```

Returns an array of templates, each with:

```json
{
    "id": 1,
    "name": "Test Case",
    "is_default": true
}
```

**Use case:** Before bulk-creating cases with `case add-bulk`, inspect
the templates to see which custom fields (`custom_*`) the project expects:

```bash
testrail template list 5 | jq '.[] | select(.is_default) | .id'
```

The default template (if any) is marked with `is_default: true`. Custom
fields attached to the template are not exposed via the CLI's `template
list` endpoint — to see them, use the programmatic API or the TestRail
web UI.



### 53. Record multiple results for tests in one API call

<!-- recipe-for: result:add-bulk-by-test -->

`result add-bulk-by-test` wraps `POST add_results/{run_id}` and records
multiple test results keyed by `test_id` in a single API call. Use this
when you have the full list of test instances (e.g. from `testrail test list
--run-id <id>`) and want to record outcomes for many tests at once.

Recipe #24 already discusses choosing between bulk endpoints; this path is
optimal when:

- You already have `test_id` values (the run-scoped instance of a case).
- You're publishing results from an environment that captures test instances
  from a prior run query.
- You want to minimize round-trips (one call for N results).

**Single-file example — bulk write via stdin:**

```bash
# Fetch the test list, map to results, and publish all at once.
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "comment": "✓ unit tests passed"},
  {"test_id": 101, "status_id": 5, "comment": "✗ integration failed on step 2"},
  {"test_id": 102, "status_id": 1, "elapsed": "2m15s", "version": "3.1.4"}
]'
```

**Dry-run preview (validate payload structure without hitting the API):**

```bash
testrail result add-bulk-by-test 42 --dry-run --data '[
  {"test_id": 100, "status_id": 1},
  {"test_id": 101, "status_id": 5}
]'
```

**Custom fields and optional fields pass through transparently:**

```bash
testrail result add-bulk-by-test 42 --data '[
  {"test_id": 100, "status_id": 1, "custom_env": "prod", "custom_browser": "safari"},
  {"test_id": 101, "status_id": 5, "defects": "BUG-123"}
]'
```

**When to choose alternatives:**

- One result, you have `test_id` → `result add-by-test <test_id>` (lighter).
- Many results, you have `run_id` + `case_id` pairs → `result add-bulk <run_id>`
  (per-case keying).
- You're unsure of status ID values → `testrail status list` (below in recipe 36).

### 54. Reference data and metadata lookups

<!-- recipe-for: result-field:list -->
<!-- recipe-for: status:list -->
<!-- recipe-for: priority:list -->

TestRail exposes three read-only reference-data endpoints that return
instance-wide metadata for use in dropdowns, validation, and result/case
payloads. All three take no positional arguments and return a JSON array of
small objects.

**List all custom result fields (instance-level metadata):**

```bash
testrail result-field list --format json
```

Output structure:

```json
[
  {
    "id": 1,
    "name": "Environment",
    "system_name": "custom_env",
    "type_id": 1,
    "configs": [1, 2, 3]
  },
  {
    "id": 2,
    "name": "Browser",
    "system_name": "custom_browser",
    "type_id": 2,
    "configs": [1]
  }
]
```

Use the `system_name` (e.g. `custom_env`) as the key when writing results:

```bash
testrail result add-by-test 123 --data '{"status_id": 1, "custom_env": "staging"}'
```

**List all result statuses (used in `result add*` payloads):**

```bash
testrail status list --format json | jq '.[] | {id, label}'
```

Output:

```json
[
  { "id": 1, "label": "Passed" },
  { "id": 2, "label": "Blocked" },
  { "id": 3, "label": "Untested" },
  { "id": 4, "label": "Retest" },
  { "id": 5, "label": "Failed" }
]
```

These IDs (e.g. `1` for "Passed", `5` for "Failed") are required in
`result add` / `result add-bulk` / `result add-bulk-by-test` payloads.
Instance configuration may differ, so always query the endpoint to validate
before hardcoding values in CI.

**List all case priorities (used in case and plan payloads):**

```bash
testrail priority list --format json | jq '.[] | {id, name}'
```

Output:

```json
[
  { "id": 1, "name": "None" },
  { "id": 2, "name": "Low" },
  { "id": 3, "name": "Medium" },
  { "id": 4, "name": "High" },
  { "id": 5, "name": "Critical" }
]
```

Use these IDs in `case add` / `case update` / `plan add` payloads:

```bash
testrail case add 456 --data '{"title": "Critical path test", "priority_id": 5}'
```

**Programmatic access (TypeScript/JavaScript):**

All three return typed arrays from the client:

```typescript
const resultFields = await client.metadata.getResultFields();
const statuses = await client.metadata.getStatuses();
const priorities = await client.metadata.getPriorities();

// Find status ID for "Failed"
const failedStatus = statuses.find(s => s.label === 'Failed');
console.log(failedStatus?.id); // 5 (typically)
```

### 55. Reports — list templates and trigger generation

<!-- recipe-for: report:list -->
<!-- recipe-for: report:run -->

TestRail exposes pre-configured report templates. You can list the templates
available in a project and trigger an async generation job that returns
downloadable report URLs.

**List report templates in a project:**

```bash
testrail report list 5 --format json | jq '.[] | {id, name, is_global}'
```

Output:

```json
[
  {
    "id": 1,
    "name": "Test Results Summary",
    "is_global": true
  },
  {
    "id": 8,
    "name": "Custom Defect Report",
    "is_global": false
  }
]
```

**Trigger a report generation:**

`report run` wraps `GET run_report/{report_template_id}` and initiates an
async report-generation job. The endpoint returns a JSON object containing
URLs for both HTML and PDF versions (generation may take a few seconds).

```bash
testrail report run 8
```

Output:

```json
{
  "report_url": "https://instance.testrail.io/reports/index.html?user_id=1",
  "report_url_pdf": "https://instance.testrail.io/reports/index.pdf?user_id=1"
}
```

**Saving a report to a file:**

Use `--out <path>` to download the HTML report directly (if your TestRail
instance supports direct binary downloads; consult your admin):

```bash
# Note: The API returns URLs; to download, use curl or wget
URLS=$(testrail report run 8)
REPORT_URL=$(echo "$URLS" | jq -r '.report_url')
curl -o report.html "$REPORT_URL"
```

**When to use reports in automation:**

- **CI integration** — Trigger a report at the end of a test run so
  stakeholders have a snapshot. Embed the report URL in Slack, email, or a
  build artifact.
- **Test result audit** — Generate a compliance report after a critical
  release.
- **Dashboard refresh** — Periodically regenerate the same template on a
  schedule.

### 56. Project lifecycle: add, update, delete

<!-- recipe-for: project:add -->
<!-- recipe-for: project:update -->
<!-- recipe-for: project:delete -->

The project resource sits at the root of every TestRail hierarchy
(project → suite → section → case → run → result). Use `project add` to
spin up a workspace, `project update` to rename or change suite-mode
settings, and `project delete` to retire it. Both writes accept arbitrary
`custom_*` fields through `.passthrough()`.

```bash
# Create a new project (single-suite mode = 1, multi-suite = 3)
testrail project add --data '{"name":"Mobile App QA","announcement":"Pre-release suite for v3.0","show_announcement":true,"suite_mode":1}'
```

```bash
# Rename + flip announcement flag
testrail project update 5 --data '{"name":"Mobile QA (renamed)","show_announcement":false}'
```

```bash
# Dry-run to preview the payload that would be sent
testrail project update 5 --data '{"is_completed":true}' --dry-run
```

**Suite-mode reference (set once at creation, cannot be changed later
without admin intervention):**

| `suite_mode` | Meaning |
|---|---|
| 1 | Single-suite (project has exactly one suite) |
| 2 | Single-suite + baselines (single suite with versioned baselines) |
| 3 | Multi-suite (project can hold multiple independent suites) |

**Destructive delete with safety gates** — `project delete` is irreversible.
The CLI requires `--yes` to actually delete; `--dry-run` short-circuits
client-side; `--soft` is **not** supported by TestRail for projects.

```bash
# Preview a delete with no API call
testrail project delete 5 --dry-run

# Hard delete (requires --yes; otherwise rejected)
testrail project delete 5 --yes
```

```typescript
// Programmatic equivalents
const created = await client.projects.addProject({ name: 'Mobile QA', suite_mode: 1 });
const renamed = await client.projects.updateProject(created.id, { name: 'Mobile QA v2' });
await client.projects.deleteProject(renamed.id);
```

### 57. Tests: fetch by ID and list per run

<!-- recipe-for: test:get -->
<!-- recipe-for: test:list -->

A *test* in TestRail is the run-scoped instance of a case (one case + one
run = one test). `test get` returns a single test by `test_id`;
`test list` enumerates every test in a run (the canonical way to walk
all cases assigned to a run, including their current `status_id`).

```bash
# Fetch a single test instance
testrail test get 1337
```

```bash
# List every test in a run
testrail test list 42

# Filter by current status (e.g. Failed=5)
testrail test list 42 --status-id 5
```

```bash
# Common pattern — extract test_ids ready for per-test result writes
testrail test list 42 | jq '.[] | select(.status_id == 3) | .id'
```

**When you reach for `test:list` vs alternatives:**

- `test list <run_id>` — enumerate every test in a run; canonical input
  for per-test result loops (pair with `result add-by-test`)
- `case list --project-id <id> --suite-id <id>` — enumerate the case
  catalog (not run-scoped); use when designing a run, not executing one
- `result list --run-id <id>` — enumerate results (not tests); use when
  you want the latest verdict per test, not the test definitions

```typescript
// Programmatic equivalent — drive a per-test CI publisher
const tests = await client.tests.getTests(42, { status_id: '3' }); // 3 = Untested
for (const t of tests) {
  await client.results.addResult(t.id, { status_id: 1, comment: 'auto-passed' });
}
```


## Programmatic TypeScript API

The `testrail` CLI is a thin wrapper over `TestRailClient`. If you are
writing TypeScript or JavaScript that needs typed responses, retry /
rate-limit / cache reuse across many calls, or precise error handling,
import the client directly instead of shelling out.

```bash
npm install @dichovsky/testrail-api-client
```

```typescript
import {
    TestRailClient,
    TestRailApiError,
    TestRailValidationError,
} from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!,
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
});

try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
} catch (e) {
    if (e instanceof TestRailApiError) {
        // HTTP/network errors carry .status / .statusText / .response.
        console.error(`HTTP ${e.status}: ${e.statusText}`);
    } else if (e instanceof TestRailValidationError) {
        // Bad config or invalid args (caught before any network call).
        console.error(`Invalid input: ${e.message}`);
    }
    throw e;
} finally {
    // Stops the cache cleanup timer, clears the cache, and zeroes the
    // credential. Library callers MUST do this in their shutdown hook
    // (the CLI does it automatically via `registerProcessHandlers: true`).
    client.destroy();
}
```

Each snippet below is self-contained and uses only published types — copy,
paste, and adjust the IDs. All methods return `Promise<T>`; all errors
inherit from `Error` (`TestRailApiError` for HTTP/network, `TestRailValidationError`
for bad input).

### Projects

```typescript
// List projects (paginated by TestRail; the client returns the full page).
const projects = await client.projects.getProjects();

// Fetch one.
const project = await client.projects.getProject(1);

// Create (Zod-validated against AddProjectPayloadSchema).
const created = await client.projects.addProject({ name: 'CI', suite_mode: 1 });

// Update (partial fields).
await client.projects.updateProject(created.id, { name: 'CI (renamed)' });

// Delete — destructive; the client method runs immediately, so wrap it
// behind your own --yes equivalent.
await client.projects.deleteProject(created.id);
```

### Suites & sections

```typescript
const suites = await client.suites.getSuites(1); // by project_id
const suite = await client.suites.addSuite(1, { name: 'Smoke' });

const sections = await client.sections.getSections(1, { suite_id: suite.id });
const section = await client.sections.addSection(1, {
    suite_id: suite.id,
    name: 'Login',
});
```

### Cases

```typescript
const cases = await client.cases.getCases(1, { suite_id: 5 });
const c = await client.cases.getCase(42);

const created = await client.cases.addCase(section.id, {
    title: 'Login page accepts SSO redirect',
    type_id: 1,
    priority_id: 3,
});

// Bulk update many cases in a suite to the same field values.
await client.cases.updateCases(suite.id, {
    case_ids: [1, 2, 3],
    priority_id: 4,
});

// Edit history (TestRail 7.5+; paginated).
const history = await client.cases.getHistoryForCase(42, { limit: 100 });
```

### Runs

```typescript
const run = await client.runs.addRun(1, {
    name: `CI build ${process.env.CI_BUILD_NUMBER}`,
    include_all: false,
    case_ids: [42, 43, 44],
});

const runs = await client.runs.getRuns(1, { limit: 25 });
await client.runs.updateRun(run.id, { milestone_id: 7 });

// Close is irreversible — TestRail has no open_run.
await client.runs.closeRun(run.id);
```

### Results

```typescript
// One result at a time.
const r1 = await client.results.addResultForCase(run.id, 42, {
    status_id: 1,
    comment: 'passed',
});

// Bulk by case_id.
await client.results.addResultsForCases(run.id, {
    results: [
        { case_id: 42, status_id: 1 },
        { case_id: 43, status_id: 5, comment: 'failed: timeout' },
    ],
});

// Bulk by test_id (already-known test instances inside the run).
await client.results.addResults(run.id, {
    results: [{ test_id: 1001, status_id: 1 }],
});

// Read.
const results = await client.results.getResultsForRun(run.id, { limit: 100 });
const forCase = await client.results.getResultsForCase(run.id, 42);
```

### Milestones

```typescript
const m = await client.milestones.addMilestone(1, {
    name: 'v2.0',
    description: 'Q2 release',
});
await client.milestones.updateMilestone(m.id, { is_completed: true });
const milestones = await client.milestones.getMilestones(1);
```

### Attachments

```typescript
import { readFileSync } from 'node:fs';

// Upload — pass a Buffer (or a Blob) plus a filename.
const buf = readFileSync('./screenshot.png');
const ack = await client.attachments.addAttachmentToCase(42, buf, 'screenshot.png');
console.log(ack.attachment_id);

// Download — returns a Buffer; the caller writes to disk.
const blob = await client.attachments.getAttachment(ack.attachment_id);
// blob is Uint8Array | ArrayBuffer | Buffer depending on Node version;
// see CODEMAP.md for the exact return type on your Node target.

// Listings come from the case/run/test/plan/plan-entry the attachment is on.
const list = await client.attachments.getAttachmentsForCase(42);

// Destructive — no built-in --yes gate; guard yourself.
await client.attachments.deleteAttachment(ack.attachment_id);
```

### Plans

```typescript
const plan = await client.plans.addPlan(1, {
    name: 'Release smoke',
    entries: [{ suite_id: 5, include_all: true }],
});

// Add a config-specific run to an existing plan entry. Entry IDs are
// UUID-style strings (NOT integers) — use the value from plan.entries[].id.
await client.plans.addRunToPlanEntry(plan.id, plan.entries[0].id, {
    config_ids: [101, 102],
});

await client.plans.updatePlanEntry(plan.id, plan.entries[0].id, {
    name: 'Smoke (config matrix)',
});

// Close + delete are irreversible / destructive — guard with your own
// confirmation step.
await client.plans.closePlan(plan.id);
```

### Users

```typescript
const me = await client.users.getCurrentUser(); // TestRail 6.6+
const byEmail = await client.users.getUserByEmail('alice@example.com');
const user = await client.users.getUser(7);
const users = await client.users.getUsers({ limit: 100 });
```

### Datasets & variables (data-driven testing)

```typescript
// Variables live on the project; datasets reference them by name.
const v = await client.variables.addVariable(1, { name: 'env' });
const d = await client.datasets.addDataset(1, { name: 'Staging matrix' });

const datasets = await client.datasets.getDatasets(1);
await client.datasets.updateDataset(d.id, { name: 'Production matrix' });
```

### Groups (TestRail 7.5+)

```typescript
// Instance-scoped — no project_id path param.
const group = await client.users.addGroup({ name: 'QA', user_ids: [1, 2, 3] });
const groups = await client.users.getGroups();
await client.users.updateGroup(group.id, { name: 'QA (renamed)' });
```

### Shared steps (TestRail 7.0+)

```typescript
const step = await client.sharedSteps.addSharedStep(1, {
    title: 'Login as admin',
    custom_steps_separated: [
        { content: 'Open /login', expected: '200 OK' },
        { content: 'Submit creds', expected: 'Redirect to /dashboard' },
    ],
});

// Cases reference shared steps via the `custom_steps_separated[].shared_step_id`
// field. Revising a shared step propagates to every referencing case on
// the next read.
await client.sharedSteps.updateSharedStep(step.id, { title: 'Login as admin (v2)' });
```

### Configuration matrix (project → config_groups → configs)

```typescript
// Tree fetch — one call returns groups with nested configs.
const groups = await client.configurations.getConfigurations(1);

// Create a group (e.g. "Browsers") then a leaf config (e.g. "Chrome").
const browsers = await client.configurations.addConfigurationGroup(1, { name: 'Browsers' });
const chrome = await client.configurations.addConfiguration(browsers.id, { name: 'Chrome' });

// Wire into a plan entry's config matrix:
//   plan_entry.config_ids = [chrome.id, ...]
```

### Configuration & client tuning

```typescript
// Override defaults from src/constants.ts. All values are optional.
const tuned = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!,
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
    timeout: 60_000, // header timeout (ms)
    bodyTimeout: 60_000, // body-read wall-clock deadline (ms)
    maxRetries: 5,
    rateLimiter: { maxRequests: 200, windowMs: 60_000 },
    maxJsonResponseBytes: 20 * 1024 * 1024, // 20 MiB cap
    // Library callers should leave this off and call destroy() from their
    // own shutdown hook. The CLI opts in.
    registerProcessHandlers: false,
});
```

### Error narrowing pattern

```typescript
async function safelyDeleteCase(id: number) {
    try {
        await client.cases.deleteCase(id);
        return { ok: true as const };
    } catch (e) {
        if (e instanceof TestRailApiError) {
            // HTTP layer: 4xx/5xx, network, rate limit, timeout, body cap,
            // 3xx blocked redirects.
            return { ok: false as const, kind: 'api', status: e.status, msg: e.statusText };
        }
        if (e instanceof TestRailValidationError) {
            // Pre-flight: bad ID, missing config, schema rejection.
            return { ok: false as const, kind: 'validation', msg: e.message };
        }
        throw e; // unexpected — re-throw
    }
}
```

See `CODEMAP.md` for the exhaustive list of methods (every public symbol
indexed with `file:line` links). See `docs/API-MAPPING.md` for the
endpoint ↔ method ↔ CLI command coverage matrix.


## Destructive actions

Destructive actions (`attachment delete`, `case delete`, `case delete-bulk`,
`run close`, `run delete`, `section delete`, `suite delete`, `milestone delete`,
`project delete`, `plan close`, `plan delete`, `plan delete-entry`,
`plan delete-run-from-entry`, `variable delete`, `dataset delete`,
`shared-step delete`, `configuration delete`,
`configuration-group delete`) require `--yes` to execute. Without `--yes`,
the CLI exits 1 with `Destructive action; pass --yes to confirm.` This is
the only gate — there is no interactive prompt (by design; this skill
targets agents, not humans).

`run close` and `plan close` are irreversible: TestRail has no `open_run`
or `open_plan` endpoint and the web UI offers no reopen action. Once
closed, the run/plan accepts no new results, no edits to existing ones,
and no re-association — only reads.

`--dry-run` always wins over `--yes`: `case delete-bulk 5 --project-id 9
--yes --dry-run --data '{"case_ids":[1]}'` emits a preview
(`"destructive": true`) without calling the API, so agents can validate
the call shape safely before committing. The same pattern applies to
`run close 42 --yes --dry-run`.

## Errors & exit codes

| Exit | Meaning                                                                            |
| ---- | ---------------------------------------------------------------------------------- |
| `0`  | Success                                                                            |
| `1`  | Any failure: bad auth, invalid args, validation, 4xx/5xx HTTP, rate limit, timeout |

Errors are written to stderr in the form `Error: <message>`. Common
causes:

- `Missing auth.` → env vars / flags not set.
- `<param> must be a positive integer` → bad path arg (e.g. `project get abc`).
- `Unknown resource '<x>'. Use: project, suite, case, run, result, milestone, user, attachment`
- `Unknown action '<a>' for <r>. Use: get, list, …`
- `Body required.` → write action invoked with no `--data` / `--data-file` / stdin.
- `Invalid JSON: …` → malformed body.
- `Payload validation failed: …` → body shape doesn't match the Zod schema.
- `TestRail API error: 404 Not Found …` → 4xx/5xx response from TestRail.
- `--file <path> required for upload actions.` → attachment upload missing `--file`.
- `--out <path> required for binary download.` → `attachment get` missing `--out`.
- `Refusing to overwrite '<path>'; pass --force to overwrite.` → `--out` target exists.
- `Destructive action; pass --yes to confirm.` → `attachment delete`, `case delete-bulk`, or `run close` without `--yes`.
- `unknown flag '--<name>'. Run --help for the full list.` → typo'd flag (e.g. `--dryrun` for `--dry-run`); strict gate added v3.0 to prevent silent bypass of `--dry-run` / `--soft` gates.
- `--api-key-stdin requires the API key to be piped on stdin (…).` → `--api-key-stdin` passed without piped stdin.
- `Input exceeds maximum 1048576 bytes. …` → stdin body or `--api-key-stdin` payload exceeded the 1 MiB cap.

## Limits & gotchas

- **Rate limit:** 100 requests / 60s by default (configurable on the
  programmatic client; the CLI uses defaults). The CLI throws an error
  rather than queueing on overflow.
- **GET cache:** GET responses are cached in-process for ~5 minutes by
  default. POSTs invalidate the entire cache. Stale reads are possible
  if the same `testrail` invocation re-fetches the same endpoint within
  the TTL.
- **Retry:** 5xx responses, 429s, and network errors are retried with
  exponential backoff (max 3 attempts). 4xx and timeout errors are not
  retried.
- **No coercion on write payloads:** `"5"` is **not** silently converted
  to `5`. This is intentional — catches agent template-substitution
  bugs at the CLI boundary rather than the API call site.
- **`custom_*` fields:** Pass through `.passthrough()` schemas unchanged.
  Field naming follows TestRail's `custom_<field-system-name>` convention.
- **Terminal output sanitization (v3.0):** stderr error messages and
  `--format table` cell values strip C0/C1/DEL control bytes before
  writing. Defends against TestRail-controlled strings carrying ANSI/OSC
  escape sequences that would otherwise execute on the user's terminal.
  Side-effect: a TestRail field value containing a literal `\n` or
  `\t` renders without the whitespace under `--format table`. Switch
  to `--format json` (the default) if you need the raw byte sequence
  preserved.
- **Stdin 1 MiB cap (v3.0):** piped stdin (for body or `--api-key-stdin`)
  is bounded at 1 MiB. Larger payloads must use `--data-file` (file
  reads are unbounded). The cap addresses memory-exhaustion DoS only;
  a producer that holds the pipe open without sending data (e.g.
  `tail -f`) still blocks the CLI — open follow-up.
- **Strict flag parsing (v3.0):** typo'd flags (e.g. `--dryrun` for
  `--dry-run`) exit 1 with `unknown flag '--<name>'` rather than
  silently no-op'ing. Previously a typo on a safety flag could
  silently bypass the gate it was supposed to enable.

## When NOT to use this skill

- **Writing TypeScript/JavaScript code that imports the package.**
  This skill documents the CLI surface only. For programmatic use,
  read `README.md` and `CODEMAP.md` in the package — the programmatic
  API exposes 100+ methods, a superset of the CLI surface.
- **Structural CRUD beyond what the command table lists.** The CLI
  surfaces project/suite/section/milestone create+update, but no
  per-entity delete (other than `case delete-bulk` and `attachment
  delete`). User CRUD and case-status CRUD are read-only via the CLI.
  Use the TestRail web UI or the programmatic API for unsurfaced ops.
- **Browser/UI workflows.** This is a non-interactive CLI.

The CLI **does** support attachment upload/download/delete and BDD
(Gherkin .feature) upload/download — see the command table above and
the file-I/O recipes below.

## See also

- `README.md` — package install, programmatic API overview, configuration
- `CODEMAP.md` — every public method, type, error class, and constant
- `src/schemas.ts` — Zod payload schemas (source of truth)
- `BACKLOG.md` — deferred CLI/skill features tracked for future releases
- TestRail API docs: <https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API>
