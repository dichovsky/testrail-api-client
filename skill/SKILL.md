---
name: testrail-cli
description: Use the `testrail` CLI to query and write TestRail projects, suites, cases, runs, plans, results, milestones, and users from the shell. Trigger when the user asks to look up, list, fetch, count, inspect, create, update, or publish TestRail entities.
license: MIT
compatibility: Requires Node.js 26+ and network access to a configured TestRail instance.
metadata:
  version: 10.1.0
  homepage: https://github.com/dichovsky/testrail-api-client
---

# `testrail` CLI

`testrail` is a Node.js CLI for the TestRail REST API. It has one runtime dependency: Zod.
Use this CLI to read (`get`, `list`) and write (`add`, `update`, `add-bulk`, `add-entry`, `close`) TestRail entities.
Supported entities include projects, suites, cases, runs, plans, results, milestones, and users.

This skill gives coding agents the rules to run shell commands.
Use the official TestRail documentation for browser UI workflows.

## When to use this skill

- The user mentions TestRail or asks about test cases, test runs, test results, or test plans in TestRail.
- The user wants to look up, list, fetch, count, inspect, create, update, or publish TestRail entities from the shell or CI.

## Install and verify

The npm package `@dichovsky/testrail-api-client` supplies the `testrail` binary.
It requires Node.js 26 or newer (`engines.node: ">=26"`). Version `9.0.0` supports Node.js 24.
Version `7.2.0` supports Node.js 20 and 22.
1. Install the package locally.
2. Make sure that the binary runs:

```bash
npm install @dichovsky/testrail-api-client
npx testrail --version
```

Run `npx testrail` to use the local installation without a global install.
To run a single command without a local installation, specify the scoped package:

```bash
npm exec --package=@dichovsky/testrail-api-client -- testrail --version
```

## Authentication

Set the TestRail URL, account email, and API key. Use an environment variable for the API key:

| Purpose       | Env var             | Flag                                                                  |
| ------------- | ------------------- | --------------------------------------------------------------------- |
| TestRail URL  | `TESTRAIL_BASE_URL` | `--base-url <url>`                                                    |
| Account email | `TESTRAIL_EMAIL`    | `--email <email>`                                                     |
| API key       | `TESTRAIL_API_KEY`  | `--api-key-stdin` (pipe key on stdin; `--api-key <key>` removed v3.0) |

Version 3.0 removed `--api-key <key>` because process arguments are visible in `/proc/<pid>/cmdline`, shell history, CI logs, and crash dumps.
If you cannot use `TESTRAIL_API_KEY`, pipe the key to stdin: `echo "$KEY" | testrail ... --api-key-stdin`.
`--api-key-stdin` reads from stdin. Pass JSON write payloads with `--data` or `--data-file` when you use `--api-key-stdin`.

If credentials are missing, the CLI writes `Error: Missing auth...` to stderr and exits with code 1.
Do not echo or log the API key.

## Reference files

This file contains the rules required to run commands safely.
Read the reference files only when your task requires detailed lookup data:

| File | Read it when |
| --- | --- |
| `./reference/commands.md` | You need the full command surface or the complete CLI option list. |
| `./reference/recipes.md` | You need a worked example for a specific task. Each command has a numbered recipe. |
| `./reference/payload-schemas.yaml` | You need field-level details for a write payload. |
| `./reference/typescript-api.md` | You write TypeScript or JavaScript, or you need client configuration and lifecycle control. |

Run `testrail <resource> --help` (for example, `testrail case --help`) to list actions for one resource.
Run `testrail --help` to list all commands.

## Body input for write actions

For write actions that require a request body, supply the JSON payload through **one** source:

```bash
# (a) inline string — best for short payloads, agent-generated
testrail case add 5 --data '{"title":"New case"}'

# (b) file — best for large/repeated payloads, reviewable in git
testrail case add 5 --data-file payload.json

# (c) piped stdin — best for shell composition with jq / curl / etc.
echo '{"title":"New case"}' | testrail case add 5
```

If you supply zero or multiple body sources, the CLI exits with code 1.
JSON input from stdin and `--data-file` has a 1 MiB limit. Split larger payloads into smaller requests.
Do not use stdin for the JSON body when you pass `--api-key-stdin`. Only one input source can read file descriptor 0.

### `--dry-run`

Pass `--dry-run` to validate the payload and print a local preview. The dry run sends no API request and uses no TestRail quota.

```bash
testrail case add 5 --data '{"title":"x"}' --dry-run
```

## Destructive operations

Each destructive CLI action requires both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
Destructive CLI actions include all `delete` commands, `run close`, and `plan close`.

1. **`--yes` flag**: The flag confirms one command. Pass `--yes` on each destructive command. Without `--yes`, the CLI exits with code `1` and prints `Destructive action; pass --yes to confirm.`
2. **`TESTRAIL_ALLOW_DESTRUCTIVE=1` env var**: The variable unlocks destructive actions for the process. Set this variable to the exact string `'1'`. The CLI rejects `'true'`, `'yes'`, `'on'`, and `'1 '`. If this variable is missing or invalid, the CLI exits with code `2`.

TestRail cannot reopen a closed run or plan.

```bash
# Blocked: --yes set, env var missing → exit code 2
testrail run delete 5 --yes

# Blocked: env var set, --yes missing → exit code 1
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5

# Proceeds: both gates satisfied
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes
```

`--dry-run` bypasses both gates and sends no API request:

```bash
# Safe in any environment — no gates required, no API call made
testrail run delete 5 --dry-run
```

**`--soft` (server-side preview)** applies to `case delete`, `case delete-bulk`, `run delete`, `section delete`, and `suite delete`.
`--soft` sends an API request and requires both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
Use `--dry-run` if you want a local preview with no API request.

## Payload schemas

Each write action validates its request body against a Zod schema with `.passthrough()`.
Required fields must match the expected types with no coercion (for example, `"5"` fails where `5` is required).
TestRail `custom_*` fields pass through without modification.

The schema index lists field names only. Cross-field rules also apply.
Each new result (`result add`, `add-by-test`, `add-bulk`, and `add-bulk-by-test`) requires `status_id`, `comment`, or `assignedto_id`.
`result edit` requires at least one field.

Check the compact index below first. Read `./reference/payload-schemas.yaml` only when you need full field details.

<!-- GENERATED:payload-schemas -->
```yaml
# compact schema index
schemas:
- {s: AddCasePayloadSchema, a: "case add", req: [title], opt: 9, ref: "./reference/payload-schemas.yaml#addcasepayloadschema"}
- {s: AddCasesBulkPayloadSchema, a: "case add-bulk", container: array, item_req: [title], item_opt: 9, ref: "./reference/payload-schemas.yaml#addcasesbulkpayloadschema"}
- {s: UpdateCasePayloadSchema, a: "case update", req: [], opt: 11, ref: "./reference/payload-schemas.yaml#updatecasepayloadschema"}
- {s: UpdateCasesPayloadSchema, a: "case update-bulk", req: [case_ids], opt: 11, ref: "./reference/payload-schemas.yaml#updatecasespayloadschema"}
- {s: DeleteCasesPayloadSchema, a: "case delete-bulk", req: [case_ids], opt: 0, ref: "./reference/payload-schemas.yaml#deletecasespayloadschema"}
- {s: CopyCasesToSectionPayloadSchema, a: "case copy-to-section", req: [case_ids], opt: 0, ref: "./reference/payload-schemas.yaml#copycasestosectionpayloadschema"}
- {s: MoveCasesToSectionPayloadSchema, a: "case move-to-section", req: [case_ids, suite_id], opt: 0, ref: "./reference/payload-schemas.yaml#movecasestosectionpayloadschema"}
- {s: AddRunPayloadSchema, a: "run add", req: [name], opt: 10, ref: "./reference/payload-schemas.yaml#addrunpayloadschema"}
- {s: UpdateRunPayloadSchema, a: "run update", req: [], opt: 10, ref: "./reference/payload-schemas.yaml#updaterunpayloadschema"}
- {s: UpdateTestLabelsPayloadSchema, a: "test update-labels", req: [labels], opt: 0, ref: "./reference/payload-schemas.yaml#updatetestlabelspayloadschema"}
- {s: UpdateTestsLabelsPayloadSchema, a: "test update-labels-bulk", req: [test_ids, labels], opt: 0, ref: "./reference/payload-schemas.yaml#updatetestslabelspayloadschema"}
- {s: AddResultPayloadSchema, a: "result add", req: [], opt: 7, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
- {s: AddResultsForCasesPayloadSchema, a: "result add-bulk", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultsforcasespayloadschema"}
- {s: AddResultsPayloadSchema, a: "result add-bulk-by-test", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultspayloadschema"}
- {s: AddResultPayloadSchema, a: "result add-by-test", req: [], opt: 7, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
- {s: EditResultPayloadSchema, a: "result edit", req: [], opt: 7, ref: "./reference/payload-schemas.yaml#editresultpayloadschema"}
- {s: AddPlanPayloadSchema, a: "plan add", req: [name], opt: 6, ref: "./reference/payload-schemas.yaml#addplanpayloadschema"}
- {s: UpdatePlanPayloadSchema, a: "plan update", req: [], opt: 6, ref: "./reference/payload-schemas.yaml#updateplanpayloadschema"}
- {s: AddPlanEntryPayloadSchema, a: "plan add-entry", req: [], opt: 12, ref: "./reference/payload-schemas.yaml#addplanentrypayloadschema"}
- {s: AddRunToPlanEntryPayloadSchema, a: "plan add-run-to-entry", req: [config_ids], opt: 8, ref: "./reference/payload-schemas.yaml#addruntoplanentrypayloadschema"}
- {s: UpdatePlanEntryPayloadSchema, a: "plan update-entry", req: [], opt: 9, ref: "./reference/payload-schemas.yaml#updateplanentrypayloadschema"}
- {s: UpdateRunInPlanEntryPayloadSchema, a: "plan update-run-in-entry", req: [], opt: 8, ref: "./reference/payload-schemas.yaml#updateruninplanentrypayloadschema"}
- {s: AddSectionPayloadSchema, a: "section add", req: [name], opt: 3, ref: "./reference/payload-schemas.yaml#addsectionpayloadschema"}
- {s: UpdateSectionPayloadSchema, a: "section update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesectionpayloadschema"}
- {s: MoveSectionPayloadSchema, a: "section move", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#movesectionpayloadschema"}
- {s: AddProjectPayloadSchema, a: "project add", req: [name], opt: 3, ref: "./reference/payload-schemas.yaml#addprojectpayloadschema"}
- {s: UpdateProjectPayloadSchema, a: "project update", req: [], opt: 7, ref: "./reference/payload-schemas.yaml#updateprojectpayloadschema"}
- {s: AddSuitePayloadSchema, a: "suite add", req: [name], opt: 1, ref: "./reference/payload-schemas.yaml#addsuitepayloadschema"}
- {s: UpdateSuitePayloadSchema, a: "suite update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesuitepayloadschema"}
- {s: AddMilestonePayloadSchema, a: "milestone add", req: [name], opt: 5, ref: "./reference/payload-schemas.yaml#addmilestonepayloadschema"}
- {s: UpdateMilestonePayloadSchema, a: "milestone update", req: [], opt: 8, ref: "./reference/payload-schemas.yaml#updatemilestonepayloadschema"}
- {s: UserAddPayloadSchema, a: "user add", req: [name, email], opt: 8, ref: "./reference/payload-schemas.yaml#useraddpayloadschema"}
- {s: UserUpdatePayloadSchema, a: "user update", req: [], opt: 10, ref: "./reference/payload-schemas.yaml#userupdatepayloadschema"}
- {s: AddSharedStepPayloadSchema, a: "shared-step add", req: [title], opt: 1, ref: "./reference/payload-schemas.yaml#addsharedsteppayloadschema"}
- {s: UpdateSharedStepPayloadSchema, a: "shared-step update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatesharedsteppayloadschema"}
- {s: AddCaseFieldPayloadSchema, a: "case-field add", req: [type, name, label, configs], opt: 4, ref: "./reference/payload-schemas.yaml#addcasefieldpayloadschema"}
- {s: AddVariablePayloadSchema, a: "variable add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addvariablepayloadschema"}
- {s: UpdateVariablePayloadSchema, a: "variable update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updatevariablepayloadschema"}
- {s: AddGroupPayloadSchema, a: "group add", req: [name], opt: 1, ref: "./reference/payload-schemas.yaml#addgrouppayloadschema"}
- {s: UpdateGroupPayloadSchema, a: "group update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updategrouppayloadschema"}
- {s: AddDatasetPayloadSchema, a: "dataset add", req: [name], opt: 1, ref: "./reference/payload-schemas.yaml#adddatasetpayloadschema"}
- {s: UpdateDatasetPayloadSchema, a: "dataset update", req: [], opt: 2, ref: "./reference/payload-schemas.yaml#updatedatasetpayloadschema"}
- {s: AddConfigurationGroupPayloadSchema, a: "configuration-group add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addconfigurationgrouppayloadschema"}
- {s: UpdateConfigurationGroupPayloadSchema, a: "configuration-group update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updateconfigurationgrouppayloadschema"}
- {s: AddConfigurationPayloadSchema, a: "configuration add", req: [name], opt: 0, ref: "./reference/payload-schemas.yaml#addconfigurationpayloadschema"}
- {s: UpdateConfigurationPayloadSchema, a: "configuration update", req: [], opt: 1, ref: "./reference/payload-schemas.yaml#updateconfigurationpayloadschema"}
- {s: AddLabelPayloadSchema, a: "label add", req: [title], opt: 0, ref: "./reference/payload-schemas.yaml#addlabelpayloadschema"}
- {s: UpdateLabelPayloadSchema, a: "label update", req: [project_id, title], opt: 0, ref: "./reference/payload-schemas.yaml#updatelabelpayloadschema"}
- {s: DeleteLabelsPayloadSchema, a: "label delete-bulk", req: [label_ids], opt: 0, ref: "./reference/payload-schemas.yaml#deletelabelspayloadschema"}
```
<!-- /GENERATED:payload-schemas -->

To validate dynamic SDK input at runtime, import the payload schema. Then call `.parse(input)` before you call the method.

## Output

By default, `testrail` writes formatted JSON to stdout.
Pass `--format table` for human-readable table output.
Pass `--quiet` to suppress standard output, error messages, and advisory warnings. Check the exit code for the result.
When you pass `--out -`, the CLI still writes the downloaded bytes to stdout and suppresses only the JSON acknowledgment.

```bash
testrail project get 1                  # JSON (default)
testrail project list --format table    # Table
testrail run get 5 --quiet              # Exit code 0/1 only
```

### Filter output

The CLI outputs complete entities. Filter large responses in the shell to keep only the fields that the task needs.

Use `jq` if it is available:

```bash
testrail run get 5 | jq '.passed_count'
testrail case list --project-id 1 | jq '.[] | {id, title}'
```

Otherwise, use Node.js:

```bash
testrail run get 5 | node -e 'const d=JSON.parse(require("fs").readFileSync(0));console.log(d.passed_count)'
```

### Pagination modes

Registered list actions support three output modes:

```bash
# Backward-compatible default: one response, emitted as an item array.
testrail project list --limit 25 --offset 0

# One response with offset/limit/size/_links metadata.
testrail project list --page --limit 25 --offset 0

# Every response page, emitted as one bounded item array.
testrail project list --all --page-size 100 --max-items 10000
```

Do not combine `--page` and `--all`.
Do not combine `--all` with `--limit` or `--offset`. Use `--page-size` and `--start-offset` with `--all`.

The aggregate safety flags are `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes`.
The default limits are 250 items per page, offset 0, 100 pages, 25,000 items, 5 minutes, and 100 MiB.
The hard maximums are 250 items per page, 5 minutes, and 1 GiB.
The CLI prints no partial array if a limit, continuation, request, or page check fails.
In the SDK, pagination failures throw `TestRailPaginationError` with reason `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, or `non_progress`.

The pagination registry includes cases, case history, project BDDs, projects, suites, sections, plans, runs, tests, and milestones.
It also includes all three result lists, labels, shared steps, shared-step history, and case/run/plan attachments.
It also includes global users, datasets, variables, roles, groups, and case statuses.
Shared-step history, datasets, variables, roles, groups, and case statuses use response-driven pagination.
For these endpoints, `--all` accepts safety limits but rejects `--page-size` and `--start-offset`. The `--page` mode rejects `--limit` and `--offset`.
Test attachments, plan-entry attachments, project user lists, and standard metadata, configuration, and report lists do not support `--page` or `--all`.

For `user list`, use pagination only when you omit `--project-id`.
With `--project-id`, the CLI keeps its existing single-response behavior and rejects all pagination flags before authentication.

In the SDK, `get*()` returns one response array. `get*Page()` returns `Page<T>`. `getAll*()` returns the complete array within safety limits.

`_links.next` controls continuation. The client extracts only validated query parameters and rebuilds the known endpoint path.
It never follows the host or path from `_links.next`.
Legacy bare arrays stop pagination. `getAll*()` bypasses the GET cache so it does not mix pages from different times.
`get*Page()` uses a separate strict-schema cache namespace so legacy list reads cannot corrupt `Page<T>` reads.

### Response validation policy

Entity-field response mismatches produce advisory warnings in the CLI by default.
The command continues, writes up to 10 unique warnings to stderr, and prints a summary count of suppressed warnings.
Each warning contains only the HTTP method, known resource and action, normalized issue codes, and masked shape paths.
Warnings never include the endpoint URL, field names, issue messages, or raw response data.

Pass `--strict-responses` or set `TESTRAIL_STRICT_RESPONSES=1` in CI to exit with code 1 on the first mismatch.
Read mismatches throw `TestRailValidationError`.
Write-response mismatches throw a redacted `TestRailApiError` that states that the result of the write is unknown. Do not retry that write automatically.

Single-request commands emit no mismatched output, and `--all` commands emit no partial array.
A streaming `run watch` command keeps events that completed in earlier polls.

`TESTRAIL_STRICT_RESPONSES` accepts `1`, `0`, an empty string, or unset. The CLI rejects other values before authentication or network requests.
Do not pass a value to `--strict-responses` (such as `--strict-responses=true`). Pass `--quiet` to suppress advisory warnings.

Response types match the declared schema keys.
Only `Case`, `Test`, and `Result` have flat `custom_*` index access, which returns `unknown`. Narrow the value before you use it.
The nested `custom_fields` property is deprecated.
Stable fields include `Test.refs_data`, `Test.case_title`, `Result.case_title`, `Result.case_refs`, case/result field system flags, and recursive milestone children.

## Errors and exit codes

| Exit | Meaning                                                                            |
| ---- | ---------------------------------------------------------------------------------- |
| `0`  | Success                                                                            |
| `1`  | Failure: bad auth, invalid args, validation, 4xx/5xx HTTP, rate limit, timeout |
| `2`  | Destructive action blocked by a missing or invalid `TESTRAIL_ALLOW_DESTRUCTIVE` unlock |

The CLI writes errors to stderr in the format `Error: <message>`. `--quiet` suppresses these messages.
Common error messages:

- `Missing auth.`: Set the required authentication environment variables or flags.
- `<param> must be a positive integer`: Pass a positive integer for the path argument (not `project get abc`).
- `Unknown resource '<x>'. Use: …`: Run `testrail --help` to see valid resource names.
- `Unknown action '<a>' for <r>. Use: get, list, …`: Run `testrail <r> --help` to see valid actions for that resource.
- `Body required.`: Pass `--data`, `--data-file`, or piped stdin to the write action.
- `Invalid JSON: …`: Fix the JSON syntax in the request body.
- `Cannot read stdin: stdin read timed out after 30000ms (producer did not close the pipe).`: Stdin stayed open. Pass `--data` or `--data-file`, or redirect `</dev/null`.
- `Payload validation failed: …`: Make sure the request body matches the Zod schema.
- `TestRail API error: 404 Not Found …`: The TestRail server returned a 4xx or 5xx HTTP response.
- `<resource> <action> requires --file <path|->.`: Pass `--file` for attachment or BDD upload actions.
- `<resource> <action> requires --out <path|->.`: Pass `--out` for `attachment get` or `bdd get`.
- `Refusing to overwrite '<path>'; pass --force to overwrite.`: The `--out` file already exists. Pass `--force` to overwrite it.
- `Destructive action; pass --yes to confirm.`: Pass `--yes` for destructive actions such as `attachment delete`, `case delete-bulk`, or `run close`.
- `unknown flag '--<name>'. Run --help for the full list.`: Fix the misspelled flag (for example, change `--dryrun` to `--dry-run`).
- `--filename requires a value, but the next argument was the flag --dry-run.`: Supply a filename value. Use `--filename=--dry-run` only for a literal filename.
- `--api-key-stdin requires the API key to be piped on stdin (…).`: Pipe the API key to stdin when you pass `--api-key-stdin`.
- `Input exceeds maximum 1048576 bytes. …`: Keep the stdin body or `--api-key-stdin` input under 1 MiB.

### Save error diagnostics

Pass `--diagnostic-file <new-path>` to write bounded, redacted server error details to a JSON file:

```bash
testrail case-field list --diagnostic-file ./testrail-error.json
```

The CLI creates a private file before the command runs and rejects existing file paths.
On failure, the file records the HTTP status, whether handler execution started, and allowlisted messages from JSON error responses.
It excludes raw request and response bodies, headers, stack traces, and credentials.
On success, the CLI removes the reserved file.

With `--quiet`, the CLI still writes a requested diagnostic file. `--dry-run` skips diagnostic file creation.
The CLI rejects `--diagnostic-file` on Windows because this implementation cannot apply private file permissions there.

Do not repeat a failed write command only to capture a diagnostic file.

## Limits

- **Rate limit:** The default limit is 100 requests per 60 seconds. The CLI throws an error immediately when a request exceeds the limit.
- **GET cache:** The client caches eligible GET responses in memory for 5 minutes. Each write that the client sends to TestRail clears the entire cache, even when the write fails. `run watch` disables the cache so that each poll sends a request to TestRail. `getAll*()` bypasses the cache and request coalescing. `get*Page()` uses a separate strict-schema cache namespace.
- **Retry:** Ordinary GET requests retry on 5xx responses, 429 responses, and network errors. Report execution GETs (`report run` and `report run-cross-project`) retry only on 429. JSON write requests retry only on 429 to prevent duplicate writes. Multipart uploads never retry. The client retries up to 3 times with exponential backoff and uses `Retry-After`. It does not retry other 4xx errors, timeouts, redirects, or body-limit errors.
- **No coercion on write payloads:** The CLI does not convert `"5"` to `5`. This rule catches type errors before the CLI sends an API request.
- **`custom_*` fields:** Zod `.passthrough()` schemas keep custom fields. Only `Case`, `Test`, and `Result` expose flat `custom_*` bracket access as `unknown`. Narrow these values before you use them.
- **Terminal output sanitization (v3.0):** The CLI strips C0, C1, and DEL control bytes from stderr messages and `--format table` cells. This sanitization prevents terminal escape-sequence injection. As a result, `--format table` removes literal `\n` and `\t` characters from cell values. Use `--format json` to keep them. JSON output writes each C0, C1, and DEL control character as an escape, such as `\n`, `\t`, or `\u009b`. Thus, the parsed value is unchanged, and no control byte reaches the terminal.
- **Input bounds:** JSON stdin, API-key stdin, and `--data-file` have a 1 MiB limit. Binary `--file -` uploads have a 100 MiB limit and a 30-second timeout. Stdin reads wait for the pipe to close (on Linux and macOS, for at most 30 seconds). If stdin can stay open, use `--data` or `--data-file`, or redirect `</dev/null`.
- **Strict flag parsing (v3.0):** Unknown or misspelled flags (such as `--dryrun`) cause the CLI to exit with code 1.

## Falling back to the programmatic SDK

Fix CLI syntax or payload validation errors before you switch to the SDK.
The SDK uses the same payload types at compile time, but it does not validate payloads at runtime.
Neither interface converts `"5"` to `5`.

Only the CLI applies cross-field rules at runtime. For example, a new result requires `status_id`, `comment`, or `assignedto_id`.
If the CLI rejects a payload, fix the payload. Do not send it through the SDK.

Use the exported Zod schemas to parse dynamic input in SDK code.
Each documented SDK endpoint has a matching CLI action in `./reference/commands.md`.
Read `./reference/typescript-api.md` when you write TypeScript or JavaScript, or when you need client lifecycle control.

Do not switch to the SDK when TestRail returns an HTTP 4xx/5xx error, authentication failure, or rate-limit error.
The SDK calls the same TestRail endpoints and returns the same error.

```bash
# CLI rejects this before touching the network: priority_id is a string,
# and the CLI does not coerce "3" to 3.
testrail case add 12 --data '{"title": "Login page accepts SSO redirect", "priority_id": "3"}'
# Error: Payload validation failed: …

# Correct the value and validate the intended write locally.
testrail case add 12 --data '{"title": "Login page accepts SSO redirect", "priority_id": 3}' --dry-run
```

## When to use another interface

- **Unsupported CRUD operations:** `./reference/commands.md` lists all supported endpoints. Operations missing from that table are also absent from the SDK. Use the TestRail web UI for unsupported operations. For example, case statuses are read-only in both the CLI and SDK.
- **Browser UI workflows:** This CLI is non-interactive.

The CLI supports attachment upload, download, and deletion, plus BDD (`.feature`) upload and download.
See `./reference/commands.md` for the command list and `./reference/recipes.md` for file I/O examples.
For TypeScript or JavaScript code that imports the package, read `./reference/typescript-api.md`.

## See also

- [Package README](https://github.com/dichovsky/testrail-api-client/blob/main/README.md): installation and quick starts
- [CLI guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/CLI.md): human-readable usage and troubleshooting
- [SDK guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/SDK.md): client configuration and response handling
- [Networking guide](https://github.com/dichovsky/testrail-api-client/blob/main/docs/NETWORKING.md): private servers, DNS, proxies, and certificates
- [Source symbol index](https://github.com/dichovsky/testrail-api-client/blob/main/CODEMAP.md): public methods, types, errors, and constants
- `./reference/payload-schemas.yaml`: shipped write-payload field reference
- TestRail API docs: <https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API>
