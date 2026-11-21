# CLI guide

Use `testrail` for shell scripts, CI jobs, and individual API calls.
Requires Node.js 26 or newer.
Install with `npm install @dichovsky/testrail-api-client`; the examples below use `npx` to run that local installation.
For a command without installing locally, use `npm exec --package=@dichovsky/testrail-api-client -- testrail --help`.

[Authentication](#authentication) · [Writes](#write-payloads) · [Destructive actions](#destructive-actions) · [Pagination](#pagination) · [Output](#output-and-exit-codes) · [Diagnostics](#diagnostic-files)

Find every action and option in the [command reference](../skill/reference/commands.md), or use the [worked recipes](../skill/reference/recipes.md).
Run `npx testrail <resource> --help` for one resource, or `npx testrail --help` for all commands.

## Authentication

| Setting       | Environment variable | Alternative        |
| ------------- | -------------------- | ------------------ |
| TestRail URL  | `TESTRAIL_BASE_URL`  | `--base-url <url>` |
| Account email | `TESTRAIL_EMAIL`     | `--email <email>`  |
| API key       | `TESTRAIL_API_KEY`   | `--api-key-stdin`  |

Set these variables in your shell or CI secret configuration. Explicit URL and email flags override their environment variables.
Never put the API key in command arguments or logs. If you cannot use its environment variable, pipe it through stdin:

```bash
printf '%s' "$KEY" | npx testrail project list --api-key-stdin
```

With `--api-key-stdin`, supply JSON payloads through `--data` or `--data-file`; stdin can have only one purpose.
Missing credentials fail before an API request.

Set `--timeout <ms>` or `TESTRAIL_TIMEOUT` to bound each network attempt through response headers; the flag takes precedence.
The same value sets a separate response-body deadline. Use a positive integer up to `300000` milliseconds.
See [SDK configuration](SDK.md#configuration) for timeout behavior and response-body limits.

## Write payloads

Use exactly one JSON source for an action that needs a body:

```bash
# Inline JSON
npx testrail case add 5 --data '{"title":"Login accepts SSO"}' --dry-run

# A file
npx testrail case add 5 --data-file case.json --dry-run

# A pipe
printf '%s' '{"title":"Login accepts SSO"}' | npx testrail case add 5 --dry-run
```

`--dry-run` validates the payload and prints a local preview. Remove it to send the write.
The CLI validates writes with Zod, preserves `custom_*` fields, and does not convert types: `"5"` fails where a number is required.
A new result requires at least one of `status_id`, `comment`, or `assignedto_id`.
See the [payload reference](../skill/reference/payload-schemas.yaml) for field details and [recipes](../skill/reference/recipes.md) for complete payloads.

JSON from stdin or `--data-file` has a 1 MiB limit. Stdin reads wait for the pipe to close (on Linux and macOS, for at most 30 seconds). If stdin might stay open (some CI runners, `docker run -i`), pass `--data` or `--data-file`, or redirect `</dev/null`.
Use `--data-file` when a producer might leave its pipe open.

String flags need a value. For a value beginning with `--`, use `--flag=--value`.
Boolean flags take no value: use `--dry-run`, not `--dry-run=true`.
Unknown flags, unsupported options, and missing required flags fail before authentication or execution.

## Destructive actions

Deletion commands, `run close`, and `plan close` require both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
The environment value must be exactly `1`. Closing a run or plan is permanent; TestRail cannot reopen it.

| Mode                           | Calls TestRail?               | Requirements                                                     |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------- |
| `--dry-run`                    | No                            | Neither destructive gate; overrides `--yes` and previews locally |
| Normal destructive command     | Yes                           | `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`                       |
| Supported delete with `--soft` | Yes, for affected-item counts | Both destructive gates                                           |

```bash
# Inspect the command locally.
npx testrail run delete 100 --dry-run

# Send the deletion only after reviewing it.
TESTRAIL_ALLOW_DESTRUCTIVE=1 npx testrail run delete 100 --yes
```

`--soft` is available on `case delete`, `case delete-bulk`, `run delete`, `section delete`, and `suite delete`.
It sends `soft=1` to TestRail. Use `--dry-run` for a preview without a network request.

## Pagination

Supported list actions offer three modes:

| Need                    | Example                                             | Output                                                           |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| One response            | `npx testrail project list --limit 25 --offset 0`   | Item array                                                       |
| One page with metadata  | `npx testrail project list --page --limit 25`       | `Page<T>`; envelope pages include offset, limit, size, and links |
| All pages within limits | `npx testrail project list --all --max-items 10000` | Combined array; no partial result on failure                     |

Use `--page-size` and `--start-offset` with `--all` to control requests.
Use `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes` to bound the collection.
All six flags require `--all`. Do not combine `--all` with `--page`, `--limit`, or `--offset`.

Defaults allow 100 pages, 25,000 items, five minutes, and 100 MiB, using 250 items per page from offset zero.
See [pagination limits and supported endpoints](SDK.md#pagination) for maximum values and endpoint exceptions.
Legacy bare-array responses stop after one page. Aggregate reads bypass the cache; they cannot guarantee a server-wide snapshot.

Shared-step history, datasets, variables, roles, groups, and case statuses use response-driven pagination.
These endpoints reject `--page-size` and `--start-offset`; page mode also rejects `--limit` and `--offset`.
Check the resource's `--help` before assuming it supports `--page` or `--all`.

## Response validation

Entity-field mismatches produce advisory warnings by default. Paginated list endpoints still reject malformed outer structures.
The CLI prints up to 10 unique warnings to stderr, then reports how many it suppressed.
Warnings contain the HTTP method, CLI resource/action, issue codes, and paths with every segment masked as `*`.
They exclude endpoint URLs, field names, record keys, issue messages, and raw responses.

Use `--strict-responses` or `TESTRAIL_STRICT_RESPONSES=1` to fail on the first mismatch:

```bash
npx testrail case get 42 --strict-responses
```

Strict mode exits with code `1`. Read mismatches raise `TestRailValidationError`; write mismatches raise a redacted `TestRailApiError` with an indeterminate-outcome message.
A write may already have executed. Do not retry it automatically because its response failed validation.
Single-request commands emit no mismatched value; aggregate commands emit no partial array.
`run watch` can emit successful earlier polls before a later failure, and cannot retract those events.

`TESTRAIL_STRICT_RESPONSES` accepts only `1`, `0`, empty, or unset.
Other values fail before authentication, even when the flag is present. The flag takes no value.
See [SDK response validation](SDK.md#response-validation) for type guarantees and hook behavior.

## Output and exit codes

JSON goes to stdout by default. Select another format with `--format table`, `--format yaml`, or `--format csv`.
Use `jq` to select fields when you need smaller output:

```bash
npx testrail run get 5 | jq '{id, name, passed_count}'
```

`--quiet` suppresses ordinary output, errors, and warnings. It still permits requested diagnostic files and raw downloads through `--out -`.
Table cells and stderr messages strip terminal control characters. Use JSON when you need to preserve embedded newlines or tabs.
CSV protects spreadsheet users by prefixing potentially executable text cells with a single quote.

| Exit code | Meaning                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| `0`       | Success                                                                             |
| `1`       | Failure, including invalid input, authentication, HTTP errors, or a missing `--yes` |
| `2`       | Destructive command blocked by missing or invalid `TESTRAIL_ALLOW_DESTRUCTIVE`      |

Errors normally use `Error: <message>` on stderr. The CLI installs signal handlers and cleans up its client automatically.
The SDK's [cache and retry policy](SDK.md#caching-and-retries) also applies to API commands; `run watch` disables caching for fresh polls.

### Upload and download files

Use `--file <path>` for uploads. Binary stdin uploads use `--file -`, with a 100 MiB limit and a 30-second timeout.
Use the [attachment recipes](../skill/reference/recipes.md#15-attach-a-playwright-screenshot-to-a-test-result) for command-specific arguments.

Downloads accept regular files through `--out <path>`; `--force` permits overwriting an existing regular file.
The CLI rejects symlinks, FIFOs, and device paths such as `/dev/null`.
Use `--out -` to send the payload to stdout and the JSON acknowledgement to stderr:

```bash
npx testrail attachment get 42 --out - > attachment.bin
npx testrail bdd get 42 --out - > case.feature
```

To discard a download, redirect `--out -` to `/dev/null`. Binary downloads to a terminal also produce a warning.

## Diagnostic files

Add `--diagnostic-file <new-path>` to the original invocation when you need structured error details:

```bash
npx testrail case-field add --data-file field.json --diagnostic-file ./field-error.json
```

The CLI reserves a new regular file with `0600` permissions before the command handler runs.
Its directory must exist. Existing paths, symlinks, and destinations shared with `--out` are rejected.
Windows rejects the flag before stdin or authentication because equivalent private permissions cannot be guaranteed.
`--dry-run` ignores the destination on every platform: it neither creates a file nor validates or changes an existing destination.

On success, the CLI removes the unused reservation. Process exit, including `SIGINT` and `SIGTERM`, also attempts cleanup.
Permission or I/O failures can leave an empty file; its existence alone does not establish an API failure.
Early argument and authentication failures produce no file.

Failures after reservation produce a `version: 1` JSON record:

| Field              | Meaning                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `kind`             | Error category                                                                     |
| `status`           | HTTP status, when available                                                        |
| `operationOutcome` | `"not_dispatched"` before handler execution; otherwise `"failed_or_indeterminate"` |
| `server`           | Validation details: `state`, `messages`, and `truncated`                           |

`"not_dispatched"` describes a known failure before handler execution, such as invalid client configuration.
After the handler starts, neither the record nor the error class proves whether a write executed.

Only recognized structured validation details enter the record.
The CLI redacts known credentials and common encoded variants, omits sensitive nested keys, and excludes raw bodies, headers, payloads, and stacks.
`messages` contains nonblank redacted strings in encounter order, without object keys or field-to-message mappings. Safe text retains the server's original escaping.

Input processing stops at 64 KiB; the record has a 16 KiB limit.
Malformed, non-JSON, or oversized bodies produce an omission state.
If messages exceed the record limit, the CLI retains complete messages that fit and sets `truncated: true`.
Diagnostic and cleanup failures preserve the command's exit status and produce warnings unless `--quiet` suppresses them.
Diagnostics do not change requests or retries. Never repeat a failed write solely to create a diagnostic file.

For implementation details, see [diagnostic file permissions](ARCHITECTURE.md#65-cross-cutting-cli-infrastructure).
For delayed case-field discovery, see [case-field readiness](CASE-FIELD-READINESS.md); keep the creation result instead of creating the field again.

## Agent skill

The package includes a Claude Code skill and its references:

```bash
npx testrail install-skill
```

This installs into `.claude/skills/testrail-cli/`. Add `--global` for `~/.claude/skills/testrail-cli/`.
After upgrading the package, run `npx testrail install-skill --force` to refresh the installed files.
For a global installation, include `--global` when updating.
The [skill body](../skill/SKILL.md) contains agent usage rules; its references include commands, payload schemas, and recipes.
