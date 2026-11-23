# CLI guide

Use `testrail` for shell scripts, CI jobs, and individual API requests.
The CLI requires Node.js 26 or newer.
Install the package with `npm install @dichovsky/testrail-api-client`. The examples in this guide use `npx` to run that local installation.
To run a command without a local installation, use `npm exec --package=@dichovsky/testrail-api-client -- testrail --help`.

[Authentication](#authentication) · [Writes](#write-payloads) · [Destructive actions](#destructive-actions) · [Pagination](#pagination) · [Output](#output-and-exit-codes) · [Diagnostics](#diagnostic-files)

Find all actions and flags in the [command reference](../skill/reference/commands.md), or use the [worked recipes](../skill/reference/recipes.md).
Run `npx testrail <resource> --help` for one resource, or `npx testrail --help` for all commands.

## Authentication

| Setting       | Environment variable | Alternative        |
| ------------- | -------------------- | ------------------ |
| TestRail URL  | `TESTRAIL_BASE_URL`  | `--base-url <url>` |
| Account email | `TESTRAIL_EMAIL`     | `--email <email>`  |
| API key       | `TESTRAIL_API_KEY`   | `--api-key-stdin`  |

Set these variables in your shell or CI secret configuration. Explicit URL and email flags override their environment variables.
Never put the API key in command arguments or logs. If you cannot use `TESTRAIL_API_KEY`, pipe the API key through stdin:

```bash
printf '%s' "$KEY" | npx testrail project list --api-key-stdin
```

With `--api-key-stdin`, supply JSON payloads through `--data` or `--data-file`. Stdin can have only one purpose.
If credentials are missing, the CLI fails before it sends an API request.

Set `--timeout <ms>` or `TESTRAIL_TIMEOUT` to limit each network attempt until the client gets the response headers.
If you set both, the flag takes precedence.
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
The CLI validates writes with Zod, keeps `custom_*` fields, and does not convert types: `"5"` fails where a number is required.
A new result requires at least one of `status_id`, `comment`, or `assignedto_id`.
See the [payload reference](../skill/reference/payload-schemas.yaml) for field details and [recipes](../skill/reference/recipes.md) for complete payloads.

JSON from stdin or `--data-file` has a 1 MiB limit. Stdin reads wait for the pipe to close (on Linux and macOS, for at most 30 seconds). If stdin can stay open (for example, in some CI runners or with `docker run -i`), do one of these steps:

- Pass `--data` or `--data-file`.
- Redirect `</dev/null`.

Use `--data-file` when a producer can leave its pipe open.

String flags need a value. For a value that starts with `--`, use `--flag=--value`.
Boolean flags take no value: use `--dry-run`, not `--dry-run=true`.
Unknown flags, flags that the action does not support, and missing required flags fail before authentication or execution.

## Destructive actions

Deletion commands, `run close`, and `plan close` require both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`.
The environment value must be exactly `1`. When you close a run or plan, the change is permanent. TestRail cannot reopen a closed run or plan.

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
Use `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes` to limit the collection.
All six flags require `--all`. Do not combine `--all` with `--page`, `--limit`, or `--offset`.

The defaults allow 100 pages, 25,000 items, five minutes, and 100 MiB.
The default page size is 250 items, and the default start offset is zero.
See [pagination limits and supported endpoints](SDK.md#pagination) for maximum values and endpoint exceptions.
Legacy bare-array responses stop after one page. Aggregate reads bypass the cache. They cannot guarantee a server-wide snapshot.

Global user lists support all three modes:

```bash
npx testrail user list --limit 25 --offset 0
npx testrail user list --page --limit 25 --offset 0
npx testrail user list --all --page-size 100 --max-items 10000
```

The TestRail 10.10.1 release notes list `get_users` as a paginated endpoint.
An older server can ignore `--limit` and `--offset` and return all users in one response.

With `--project-id`, `user list` keeps its existing single-response behavior. Non-admin users must supply `--project-id`.
The CLI rejects any pagination flag with `--project-id` before authentication.
These flags are `--page`, `--all`, `--limit`, `--offset`, `--page-size`, `--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes`.

Shared-step history, datasets, variables, roles, groups, and case statuses use response-driven pagination.
These endpoints reject `--page-size` and `--start-offset`. Page mode also rejects `--limit` and `--offset`.
Read the `--help` output of the resource to make sure that it supports `--page` or `--all`.

## Response validation

Entity-field mismatches produce advisory warnings by default. Paginated list endpoints still reject malformed outer structures.
The CLI prints up to 10 unique warnings to stderr, then reports how many it suppressed.
Warnings contain the HTTP method, CLI resource/action, issue codes, and paths in which `*` replaces each segment.
They exclude endpoint URLs, field names, record keys, issue messages, and raw responses.

Use `--strict-responses` or `TESTRAIL_STRICT_RESPONSES=1` to fail on the first mismatch:

```bash
npx testrail case get 42 --strict-responses
```

Strict mode exits with code `1`. A read mismatch throws `TestRailValidationError`. A write mismatch throws a redacted `TestRailApiError` with an indeterminate-outcome message.
Do not automatically retry a write because its response failed validation. The write can already have executed.
Single-request commands emit no mismatched value. Aggregate commands emit no partial array.
`run watch` can emit successful polls before a subsequent failure. The command cannot retract those events.

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
The CLI removes terminal control characters from table cells and stderr messages. Use JSON when you need to keep embedded newlines or tabs.
To protect spreadsheet users, CSV output adds a single quote before potentially executable text cells.

| Exit code | Meaning                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| `0`       | Success                                                                             |
| `1`       | Failure, including invalid input, authentication, HTTP errors, or a missing `--yes` |
| `2`       | Destructive command blocked by missing or invalid `TESTRAIL_ALLOW_DESTRUCTIVE`      |

Errors usually use `Error: <message>` on stderr. The CLI installs signal handlers and destroys its client automatically.
The SDK's [cache and retry policy](SDK.md#caching-and-retries) also applies to API commands. `run watch` disables caching, so that each poll sends a request.

### Upload and download files

Use `--file <path>` for uploads. Binary stdin uploads use `--file -`, with a 100 MiB limit and a 30-second timeout.
Use the [attachment recipes](../skill/reference/recipes.md#15-attach-a-playwright-screenshot-to-a-test-result) for command-specific arguments.

Downloads accept regular files through `--out <path>`. With `--force`, the CLI can overwrite an existing regular file.
The CLI rejects symlinks, FIFOs, and device paths such as `/dev/null`.
Use `--out -` to send the download to stdout and the JSON acknowledgement to stderr:

```bash
npx testrail attachment get 42 --out - > attachment.bin
npx testrail bdd get 42 --out - > case.feature
```

To discard a download, redirect `--out -` to `/dev/null`. Binary downloads to a terminal also produce a warning.

## Diagnostic files

Add `--diagnostic-file <new-path>` to the original command when you need structured error details:

```bash
npx testrail case-field add --data-file field.json --diagnostic-file ./field-error.json
```

The CLI reserves a new regular file with `0600` permissions before the command handler runs.
The directory of the file must exist. The CLI rejects existing paths, symlinks, and destinations that `--out` also uses.
On Windows, the CLI rejects the flag before it reads stdin or resolves authentication. The CLI cannot guarantee equivalent private permissions on Windows.
`--dry-run` ignores the destination on all platforms. A dry run does not create a file, and it does not validate or change an existing destination.

On success, the CLI removes the unused reservation. When the process exits, including on `SIGINT` and `SIGTERM`, the CLI also tries to do this cleanup.
A permission or I/O failure can leave an empty file. The presence of the file does not prove an API failure.
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
`messages` contains nonblank redacted strings in encounter order, without object keys or field-to-message mappings. Safe text keeps the original escaping of the server.

Input processing stops at 64 KiB. The record has a 16 KiB limit.
Malformed, non-JSON, or oversized bodies produce an omission state.
If messages exceed the record limit, the CLI keeps complete messages that fit and sets `truncated: true`.
Diagnostic and cleanup failures do not change the exit status of the command. They produce warnings unless `--quiet` suppresses them.
Diagnostics do not change requests or retries. Never repeat a failed write only to create a diagnostic file.

For implementation details, see [diagnostic file permissions](ARCHITECTURE.md#65-cross-cutting-cli-infrastructure).
For delayed case-field discovery, see [case-field readiness](CASE-FIELD-READINESS.md). Keep the creation result. Do not create the field again.

## Agent skill

The package includes a Claude Code skill and its references:

```bash
npx testrail install-skill
```

This command installs the skill into `.claude/skills/testrail-cli/`. Add `--global` to install into `~/.claude/skills/testrail-cli/`.
After you upgrade the package, run `npx testrail install-skill --force` to refresh the installed files.
For a global installation, include `--global` when you update the files.
The [skill body](../skill/SKILL.md) contains agent usage rules. The skill references include commands, payload schemas, and recipes.
