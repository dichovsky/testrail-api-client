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

The CLI requires three credentials. Provide them either as environment
variables (preferred — keeps secrets out of argv and shell history) or as
flags:

| Purpose       | Env var             | Flag               |
| ------------- | ------------------- | ------------------ |
| TestRail URL  | `TESTRAIL_BASE_URL` | `--base-url <url>` |
| Account email | `TESTRAIL_EMAIL`    | `--email <email>`  |
| API key       | `TESTRAIL_API_KEY`  | `--api-key <key>`  |

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
| run | get | `<run_id>` | — | Fetch a single run by ID |
| run | list | — | — | List runs in a project (paginated) |
| result | list | — | — | List results for a run (paginated) |
| milestone | get | `<milestone_id>` | — | Fetch a single milestone by ID |
| milestone | list | — | — | List milestones in a project (paginated) |
| user | get | `<user_id>` | — | Fetch a single user by ID |
| user | list | — | — | List users (paginated) |
| plan | get | `<plan_id>` | — | Fetch a single test plan by ID |
| plan | list | — | — | List plans in a project (paginated) |
| case | add | `<section_id>` | `AddCasePayloadSchema` | Create a new test case under a section |
| case | update | `<case_id>` | `UpdateCasePayloadSchema` | Update an existing test case (partial fields) |
| run | add | `<project_id>` | `AddRunPayloadSchema` | Create a new test run in a project |
| run | close | `<run_id>` | — (no body) | Close a test run (no body) |
| result | add | `<run_id>` `<case_id>` | `AddResultPayloadSchema` | Record a single result for a case in a run |
| result | add-bulk | `<run_id>` | `AddResultsForCasesPayloadSchema` | Record multiple results for cases in one API call |
| plan | add | `<project_id>` | `(body)` | Create a new test plan in a project (optionally with nested entries) |
| plan | update | `<plan_id>` | `(body)` | Update an existing test plan (partial fields) |
| plan | add-entry | `<plan_id>` | `(body)` | Add an entry (suite + optional runs) to an existing test plan |
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

### `(body)` (used by `plan add`)

```jsonc
{
    "name": "string (required)",
    "description": "string?",
    "milestone_id": "number?",
    "entries": "object[]?"
}
```

### `(body)` (used by `plan update`)

```jsonc
{
    "name": "string?",
    "description": "string?",
    "milestone_id": "number?",
    "assignedto_id": "number?"
}
```

### `(body)` (used by `plan add-entry`)

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

```bash
testrail user list --limit 1 --quiet && echo "auth OK" || echo "auth FAILED"
```

Exit code 0 = creds resolve and TestRail responds; 1 = anything broken.

### 2. Fetch a project

```bash
testrail project get 5
```

### 3. List projects with pagination

```bash
testrail project list --limit 25 --offset 0
```

### 4. List suites under a project

```bash
testrail suite list --project-id 5
```

### 5. List cases in a specific suite

```bash
testrail case list --project-id 5 --suite-id 12
```

### 6. Extract just the IDs from any list (generic pattern)

```bash
testrail case list --project-id 5 | jq '.[].id'
```

### 7. Count pass/fail for a run

```bash
testrail run get 42 | jq '{passed: .passed_count, failed: .failed_count}'
```

### 8. Page through a large result list

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

```bash
testrail case add 12 --data '{
    "title": "Login page accepts SSO redirect",
    "type_id": 1,
    "priority_id": 3,
    "refs": "JIRA-1234"
}'
```

### 10. Update a test case (partial fields)

```bash
testrail case update 87 --data '{"title": "Renamed", "priority_id": 4}'
```

### 11. Create a CI test run

```bash
RUN=$(testrail run add 5 --data '{
    "name": "CI build #'"$CI_BUILD_NUMBER"'",
    "include_all": false,
    "case_ids": [42, 43, 44]
}')
RUN_ID=$(echo "$RUN" | jq '.id')
```

### 12. Publish bulk results from a CI run

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

```bash
testrail run close "$RUN_ID"
```

### 14. Validate a payload before sending (`--dry-run`)

```bash
testrail result add 100 42 --data '{"status_id":1,"comment":"sanity check"}' --dry-run
```

Prints the parsed payload + a `"dryRun": true` marker; no API call made.

### 15. Attach a Playwright screenshot to a test result

```bash
RESULT=$(testrail result add "$RUN_ID" 42 --data '{"status_id":5,"comment":"failed"}')
RESULT_ID=$(echo "$RESULT" | jq '.id')
testrail attachment add-to-result "$RESULT_ID" --file ./test-results/screenshot.png
```

Output is `{ "attachment_id": <id> }`. Filename uploaded is `screenshot.png`
(basename of `--file`). Use `--filename <name>` to rename on upload.

### 16. Attach a repro file to a test case

```bash
testrail attachment add-to-case 42 --file ./repro.zip --filename "bug-1234-repro.zip"
```

`--filename` overrides the path basename so the attachment shows up with a
meaningful name in the TestRail UI even when the local file is generic.

### 17. Download the latest attachment on a case to inspect locally

```bash
LATEST_ID=$(testrail attachment list-for-case 42 | jq 'max_by(.attachment_id).attachment_id')
testrail attachment get "$LATEST_ID" --out ./fetched.bin
```

`--out` is required. Refuses to overwrite an existing file; pass `--force`
to overwrite. JSON ack on stdout includes `attachmentId`, `out`, and `size`.

### 18. Audit then delete attachments on a deprecated case

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

```bash
testrail plan get 50
```

### 20. List active plans for a project

```bash
# `plan list` is paginated; --limit / --offset are the only filters exposed.
# To filter by milestone or completion status, paginate and filter client-side.
testrail plan list --project-id 1 --limit 25
```

### 21. Create an empty test plan

```bash
testrail plan add 1 --data '{
    "name": "Release 1.0",
    "description": "Smoke + regression for the 1.0 cut",
    "milestone_id": 4
}'
```

### 22. Create a plan with nested entries (matrix testing in one call)

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

```bash
# Use this for plans that grow over a release cycle. Returns the new entry
# (including its UUID-style `id` and the runs auto-created for any configs).
testrail plan add-entry 50 --data '{
    "suite_id": 2,
    "include_all": true,
    "assignedto_id": 7
}'
```

## Destructive actions

Destructive actions (currently `attachment delete`) require `--yes` to
execute. Without `--yes`, the CLI exits 1 with `Destructive action; pass
--yes to confirm.` This is the only gate — there is no interactive prompt
(by design; this skill targets agents, not humans).

`--dry-run` always wins over `--yes`: `attachment delete 42 --yes --dry-run`
emits a preview (`"destructive": true`) without calling the API, so agents
can validate the call shape safely before committing.

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
- `Destructive action; pass --yes to confirm.` → `attachment delete` without `--yes`.

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

## When NOT to use this skill

- **Writing TypeScript/JavaScript code that imports the package.**
  This skill documents the CLI surface only. For programmatic use,
  read `README.md` and `CODEMAP.md` in the package — the programmatic
  API exposes 101 methods, far beyond what the CLI covers.
- **Project / suite / section / milestone / user CRUD** beyond the 6
  write actions listed above. Use the TestRail web UI for structural
  setup (or the programmatic API).
- **Deletes** of any kind. The CLI deliberately does not expose `delete`
  actions to keep agents away from irrecoverable operations.
- **Attachments** (upload/download). Not in the CLI surface; use the
  programmatic API.
- **Browser/UI workflows.** This is a non-interactive CLI.

## See also

- `README.md` — package install, programmatic API overview, configuration
- `CODEMAP.md` — every public method, type, error class, and constant
- `src/schemas.ts` — Zod payload schemas (source of truth)
- `BACKLOG.md` — deferred CLI/skill features tracked for future releases
- TestRail API docs: <https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API>
