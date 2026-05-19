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

<!-- GENERATED:command-table -->
| Resource | Action | Path args | Body | Description |
| --- | --- | --- | --- | --- |
| project | get | `<project_id>` | — | Fetch a single project by ID |
| project | list | — | — | List all projects (paginated) |
| suite | get | `<suite_id>` | — | Fetch a single suite by ID |
| suite | list | — | — | List suites in a project |
| case | get | `<case_id>` | — | Fetch a single test case by ID |
| case | list | — | — | List cases in a project (optionally filtered by suite) |
| case | history | `<case_id>` | — | List edit history for a test case (paginated; TestRail 7.5+) |
| run | get | `<run_id>` | — | Fetch a single run by ID |
| run | list | — | — | List runs in a project (paginated) |
| test | get | `<test_id>` | — | Fetch a single test (run instance of a case) by ID |
| test | list | `<run_id>` | — | List tests in a run (optionally filtered by status, paginated) |
| result | list | — | — | List results for a run (paginated) |
| result | list-for-test | `<test_id>` | — | List results for a single test (paginated; --status-id / --defects-filter supported) |
| result | list-for-case | `<run_id>` `<case_id>` | — | List results for a case within a run (paginated; --status-id / --defects-filter supported) |
| milestone | get | `<milestone_id>` | — | Fetch a single milestone by ID |
| milestone | list | — | — | List milestones in a project (paginated) |
| user | get | `<user_id>` | — | Fetch a single user by ID |
| user | list | — | — | List users (paginated) |
| plan | get | `<plan_id>` | — | Fetch a single test plan by ID |
| plan | list | — | — | List plans in a project (paginated) |
| section | get | `<section_id>` | — | Fetch a single section by ID |
| section | list | `<project_id>` | — | List sections in a project (optionally filtered by suite; paginated) |
| case | add | `<section_id>` | `AddCasePayloadSchema` | Create a new test case under a section |
| case | update | `<case_id>` | `UpdateCasePayloadSchema` | Update an existing test case (partial fields) |
| case | update-bulk | `<suite_id>` | `UpdateCasesPayloadSchema` | Bulk-update many cases in a suite with the same field values |
| case | delete | `<case_id>` | — (no body, requires `--yes`) | Delete a single test case (requires --yes; --soft for server-side preview that returns affected counts without deleting) |
| case | delete-bulk | `<suite_id>` | `DeleteCasesPayloadSchema` | Bulk-delete cases in a suite (requires --project-id and --yes; --soft for server-side preview without deletion) |
| case | copy-to-section | `<section_id>` | `CopyCasesToSectionPayloadSchema` | Copy cases into a target section (returns the new case copies) |
| case | move-to-section | `<section_id>` | `MoveCasesToSectionPayloadSchema` | Move cases into a target section (suite_id required in body) |
| run | add | `<project_id>` | `AddRunPayloadSchema` | Create a new test run in a project |
| run | update | `<run_id>` | `UpdateRunPayloadSchema` | Update an existing test run (all fields optional) |
| run | close | `<run_id>` | — (no body, requires `--yes`) | Close a test run permanently — irreversible (no body; requires --yes) |
| run | delete | `<run_id>` | — (no body, requires `--yes`) | Delete a test run and all associated results (requires --yes; --soft for server-side preview without deletion) |
| result | add | `<run_id>` `<case_id>` | `AddResultPayloadSchema` | Record a single result for a case in a run |
| result | add-bulk | `<run_id>` | `AddResultsForCasesPayloadSchema` | Record multiple results for cases in one API call |
| result | add-bulk-by-test | `<run_id>` | `AddResultsPayloadSchema` | Record multiple results for tests (by test_id) in one API call |
| plan | add | `<project_id>` | `AddPlanPayloadSchema` | Create a new test plan in a project (optionally with nested entries) |
| plan | update | `<plan_id>` | `UpdatePlanPayloadSchema` | Update an existing test plan (partial fields) |
| plan | add-entry | `<plan_id>` | `AddPlanEntryPayloadSchema` | Add an entry (suite + optional runs) to an existing test plan |
| plan | add-run-to-entry | `<plan_id>` `<entry_id>` | `AddRunToPlanEntryPayloadSchema` | Add a config-specific run to an existing plan entry (config_ids required) |
| plan | update-entry | `<plan_id>` `<entry_id>` | `UpdatePlanEntryPayloadSchema` | Update an existing plan entry (partial fields; applies to every run in the entry) |
| plan | update-run-in-entry | `<run_id>` | `UpdateRunInPlanEntryPayloadSchema` | Update a single config-specific run inside a plan entry (description/assignee/case selection only) |
| plan | close | `<plan_id>` | — (no body, requires `--yes`) | Close a test plan permanently — irreversible (no body; requires --yes) |
| plan | delete | `<plan_id>` | — (no body, requires `--yes`) | Delete a test plan and all of its entries and runs (requires --yes; --soft NOT supported by TestRail) |
| plan | delete-entry | `<plan_id>` `<entry_id>` | — (no body, requires `--yes`) | Delete a single plan entry and its runs (requires --yes; --soft NOT supported by TestRail). entry_id is a UUID-style string. |
| plan | delete-run-from-entry | `<run_id>` | — (no body, requires `--yes`) | Delete a single run from its plan entry, leaving sibling runs intact (requires --yes; --soft NOT supported by TestRail) |
| section | add | `<project_id>` | `AddSectionPayloadSchema` | Create a new section in a project (suite_id required for multi-suite-mode projects) |
| section | update | `<section_id>` | `UpdateSectionPayloadSchema` | Update an existing section (partial fields) |
| section | move | `<section_id>` | `MoveSectionPayloadSchema` | Move a section to a new parent and/or position (TestRail 6.5.2+) |
| section | delete | `<section_id>` | — (no body, requires `--yes`) | Delete a section (recursively removes subsections and cases; requires --yes; --soft for server-side preview) |
| project | add | — | `AddProjectPayloadSchema` | Create a new project (no path params, payload-only) |
| project | update | `<project_id>` | `UpdateProjectPayloadSchema` | Update an existing project (partial fields) |
| project | delete | `<project_id>` | — (no body, requires `--yes`) | Delete a project and everything inside it (highest blast radius; requires --yes; --soft NOT supported by TestRail) |
| suite | add | `<project_id>` | `AddSuitePayloadSchema` | Create a new test suite in a project |
| suite | update | `<suite_id>` | `UpdateSuitePayloadSchema` | Update an existing test suite (partial fields) |
| suite | delete | `<suite_id>` | — (no body, requires `--yes`) | Delete a suite and everything inside it (sections, cases, runs, plans; requires --yes; --soft for server-side preview) |
| milestone | add | `<project_id>` | `AddMilestonePayloadSchema` | Create a new milestone in a project |
| milestone | update | `<milestone_id>` | `UpdateMilestonePayloadSchema` | Update an existing milestone (partial fields, including is_completed/is_started toggles) |
| milestone | delete | `<milestone_id>` | — (no body, requires `--yes`) | Delete a milestone (requires --yes; --soft NOT supported by TestRail) |
| shared-step | get | `<shared_step_id>` | — | Fetch a single shared step by ID |
| shared-step | list | — | — | List shared steps in a project |
| shared-step | history | `<shared_step_id>` | — | List revision history for a shared step (paginated) |
| shared-step | add | `<project_id>` | `AddSharedStepPayloadSchema` | Create a new shared step set in a project (TestRail 7.0+) |
| shared-step | update | `<shared_step_id>` | `UpdateSharedStepPayloadSchema` | Update an existing shared step set (partial fields; TestRail 7.0+) |
| shared-step | delete | `<shared_step_id>` | — (no body, requires `--yes`) | Delete a shared step set — referencing cases keep their content but lose the step-set link (requires --yes; --soft NOT supported by TestRail; TestRail 7.0+) |
| case-status | list | — | — | List case-level lifecycle statuses (TestRail 7.5+) |
| case-field | add | — | `AddCaseFieldPayloadSchema` | Create a custom case field (admin-only); no path params, payload-only |
| attachment | list-for-case | `<case_id>` | — | List attachments on a test case |
| attachment | list-for-run | `<run_id>` | — | List attachments on a test run |
| attachment | list-for-test | `<test_id>` | — | List attachments on a test (run instance of a case) |
| attachment | list-for-plan | `<plan_id>` | — | List attachments on a test plan |
| attachment | list-for-plan-entry | `<plan_id>` `<entry_id>` | — | List attachments on a plan entry |
| attachment | get | `<attachment_id>` | `--out <path>` (binary) | Download an attachment by ID to --out <path> |
| attachment | add-to-case | `<case_id>` | `--file <path>` | Upload an attachment to a test case |
| attachment | add-to-result | `<result_id>` | `--file <path>` | Upload an attachment to a test result |
| attachment | add-to-run | `<run_id>` | `--file <path>` | Upload an attachment to a test run |
| attachment | add-to-plan | `<plan_id>` | `--file <path>` | Upload an attachment to a test plan |
| attachment | add-to-plan-entry | `<plan_id>` `<entry_id>` | `--file <path>` | Upload an attachment to a plan entry |
| attachment | delete | `<attachment_id>` | — (no body, requires `--yes`) | Delete an attachment by ID (requires --yes) |
| bdd | get | `<case_id>` | `--out <path>` (text) | Download a case's BDD (Gherkin .feature) content to --out <path> |
| bdd | add | `<case_id>` | `--file <path>` | Upload a .feature file as the BDD content for a case |
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

## Payload schemas

Each write action validates its body against a Zod schema with
`.passthrough()` — required fields must match types exactly (no
coercion; `"5"` is rejected where `5` is expected), and TestRail
`custom_*` fields pass through untouched.

<!-- GENERATED:payload-schemas -->
### `AddCasePayloadSchema` (used by `case add`)

```jsonc
{
    "title": "string (required)",
    "template_id": "number?",
    "type_id": "number?",
    "priority_id": "number?",
    "estimate": "string?",
    "milestone_id": "number?",
    "refs": "string?",
    "custom_fields": "Record<string, unknown>?"
}
```

### `UpdateCasePayloadSchema` (used by `case update`)

```jsonc
{
    "title": "string?",
    "template_id": "number?",
    "type_id": "number?",
    "priority_id": "number?",
    "estimate": "string?",
    "milestone_id": "number?",
    "refs": "string?",
    "custom_fields": "Record<string, unknown>?"
}
```

### `UpdateCasesPayloadSchema` (used by `case update-bulk`)

```jsonc
{
    "case_ids": "number[] (required)",
    "title": "string?",
    "template_id": "number?",
    "type_id": "number?",
    "priority_id": "number?",
    "estimate": "string?",
    "milestone_id": "number?",
    "refs": "string?",
    "custom_fields": "Record<string, unknown>?"
}
```

### `DeleteCasesPayloadSchema` (used by `case delete-bulk`)

```jsonc
{
    "case_ids": "number[] (required)"
}
```

### `CopyCasesToSectionPayloadSchema` (used by `case copy-to-section`)

```jsonc
{
    "case_ids": "number[] (required)"
}
```

### `MoveCasesToSectionPayloadSchema` (used by `case move-to-section`)

```jsonc
{
    "case_ids": "number[] (required)",
    "suite_id": "number (required)"
}
```

### `AddRunPayloadSchema` (used by `run add`)

```jsonc
{
    "name": "string (required)",
    "suite_id": "number?",
    "description": "string?",
    "milestone_id": "number?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?",
    "refs": "string?"
}
```

### `UpdateRunPayloadSchema` (used by `run update`)

```jsonc
{
    "name": "string?",
    "description": "string?",
    "milestone_id": "number?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?",
    "refs": "string?"
}
```

### `AddResultPayloadSchema` (used by `result add`)

```jsonc
{
    "status_id": "number (required)",
    "comment": "string?",
    "version": "string?",
    "elapsed": "string?",
    "defects": "string?",
    "assignedto_id": "number?",
    "custom_fields": "Record<string, unknown>?"
}
```

### `AddResultsForCasesPayloadSchema` (used by `result add-bulk`)

```jsonc
{
    "results": "object[] (required)"
}
```

### `AddResultsPayloadSchema` (used by `result add-bulk-by-test`)

```jsonc
{
    "results": "object[] (required)"
}
```

### `AddPlanPayloadSchema` (used by `plan add`)

```jsonc
{
    "name": "string (required)",
    "description": "string?",
    "milestone_id": "number?",
    "entries": "object[]?"
}
```

### `UpdatePlanPayloadSchema` (used by `plan update`)

```jsonc
{
    "name": "string?",
    "description": "string?",
    "milestone_id": "number?",
    "assignedto_id": "number?"
}
```

### `AddPlanEntryPayloadSchema` (used by `plan add-entry`)

```jsonc
{
    "suite_id": "number (required)",
    "name": "string?",
    "description": "string?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?",
    "config_ids": "number[]?",
    "runs": "object[]?"
}
```

### `AddRunToPlanEntryPayloadSchema` (used by `plan add-run-to-entry`)

```jsonc
{
    "config_ids": "number[] (required)",
    "description": "string?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?",
    "refs": "string?"
}
```

### `UpdatePlanEntryPayloadSchema` (used by `plan update-entry`)

```jsonc
{
    "suite_id": "number?",
    "name": "string?",
    "description": "string?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?",
    "config_ids": "number[]?",
    "runs": "object[]?"
}
```

### `UpdateRunInPlanEntryPayloadSchema` (used by `plan update-run-in-entry`)

```jsonc
{
    "description": "string?",
    "assignedto_id": "number?",
    "include_all": "boolean?",
    "case_ids": "number[]?"
}
```

### `AddSectionPayloadSchema` (used by `section add`)

```jsonc
{
    "name": "string (required)",
    "suite_id": "number?",
    "parent_id": "number?",
    "description": "string?"
}
```

### `UpdateSectionPayloadSchema` (used by `section update`)

```jsonc
{
    "name": "string?",
    "description": "string?"
}
```

### `MoveSectionPayloadSchema` (used by `section move`)

```jsonc
{
    "parent_id": "number?",
    "after_id": "number?"
}
```

### `AddProjectPayloadSchema` (used by `project add`)

```jsonc
{
    "name": "string (required)",
    "announcement": "string?",
    "show_announcement": "boolean?",
    "suite_mode": "number?"
}
```

### `UpdateProjectPayloadSchema` (used by `project update`)

```jsonc
{
    "name": "string?",
    "announcement": "string?",
    "show_announcement": "boolean?",
    "suite_mode": "number?"
}
```

### `AddSuitePayloadSchema` (used by `suite add`)

```jsonc
{
    "name": "string (required)",
    "description": "string?"
}
```

### `UpdateSuitePayloadSchema` (used by `suite update`)

```jsonc
{
    "name": "string?",
    "description": "string?"
}
```

### `AddMilestonePayloadSchema` (used by `milestone add`)

```jsonc
{
    "name": "string (required)",
    "description": "string?",
    "due_on": "number?",
    "start_on": "number?",
    "parent_id": "number?",
    "refs": "string?"
}
```

### `UpdateMilestonePayloadSchema` (used by `milestone update`)

```jsonc
{
    "name": "string?",
    "description": "string?",
    "due_on": "number?",
    "start_on": "number?",
    "parent_id": "number?",
    "refs": "string?",
    "is_completed": "boolean?",
    "is_started": "boolean?"
}
```

### `AddSharedStepPayloadSchema` (used by `shared-step add`)

```jsonc
{
    "title": "string (required)",
    "custom_steps_separated": "Record<string, unknown>[]?"
}
```

### `UpdateSharedStepPayloadSchema` (used by `shared-step update`)

```jsonc
{
    "title": "string?",
    "custom_steps_separated": "Record<string, unknown>[]?"
}
```

### `AddCaseFieldPayloadSchema` (used by `case-field add`)

```jsonc
{
    "type": "string (required)",
    "name": "string (required)",
    "label": "string (required)",
    "description": "string?",
    "include_all": "boolean?",
    "template_ids": "number[]?",
    "configs": "object[] (required)"
}
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

## Destructive actions

Destructive actions (`attachment delete`, `case delete`, `case delete-bulk`,
`run close`, `run delete`, `section delete`, `suite delete`, `milestone delete`,
`project delete`, `plan close`, `plan delete`, `plan delete-entry`,
`plan delete-run-from-entry`) require `--yes` to execute. Without `--yes`,
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
