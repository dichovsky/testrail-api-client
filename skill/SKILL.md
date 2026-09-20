---
name: testrail-cli
description: Use the `testrail` CLI to query and write TestRail projects, suites, cases, runs, plans, results, milestones, and users from the shell. Trigger when the user asks to look up, list, fetch, count, inspect, create, update, or publish TestRail entities, or when TESTRAIL_BASE_URL / TESTRAIL_EMAIL / TESTRAIL_API_KEY are set in the environment.
version: 8.0.0
license: MIT
homepage: https://github.com/dichovsky/testrail-api-client
---

# `testrail` CLI

A Node CLI for the TestRail REST API with one runtime dependency: Zod. Covers query (`get`,
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
exposes the `testrail` binary. Requires Node.js 24 or newer
(`engines.node: ">=24"` as of 8.0.0; pin `7.2.0` for Node 20/22). Install it
locally and verify the binary:

```bash
npm install @dichovsky/testrail-api-client
npx testrail --version
```

`npx testrail` runs that local copy without a global install. For a one-off
invocation without a local installation, name the scoped package explicitly:

```bash
npm exec --package=@dichovsky/testrail-api-client -- testrail --version
```

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

## Reference files

This body carries everything needed to decide whether and how to act safely.
Bulk lookup material lives beside it and should be read only when the task
actually needs it:

| File | Read it when |
| --- | --- |
| `./reference/commands.md` | You need the full command surface or the complete CLI option list. |
| `./reference/recipes.md` | You want a worked example for a specific task; numbered recipes cover every command. |
| `./reference/payload-schemas.yaml` | You need field-level detail for a write payload. |
| `./reference/typescript-api.md` | The CLI cannot express the task and you are falling back to the SDK. |


## Body input for write actions

For body-bearing write actions, provide the JSON payload via **exactly one**
of:

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
- {s: AddResultPayloadSchema, a: "result add", req: [status_id], opt: 6, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
- {s: AddResultsForCasesPayloadSchema, a: "result add-bulk", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultsforcasespayloadschema"}
- {s: AddResultsPayloadSchema, a: "result add-bulk-by-test", req: [results], opt: 0, ref: "./reference/payload-schemas.yaml#addresultspayloadschema"}
- {s: AddResultPayloadSchema, a: "result add-by-test", req: [status_id], opt: 6, ref: "./reference/payload-schemas.yaml#addresultpayloadschema"}
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

For the authoritative type definitions, see `src/schemas.ts` in the
package source.

## Output

By default, `testrail` emits pretty-printed JSON to stdout. Use `--format
table` for column-aligned human-readable output. Use `--quiet` to
suppress normal output and advisory warnings (rely on exit code). One
exception: `--out -` payload bytes are an explicit request and still go to
stdout; only its JSON ack is suppressed.

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

### Pagination modes

Registered list actions have three output modes:

```bash
# Backward-compatible default: one response, emitted as an item array.
testrail project list --limit 25 --offset 0

# One response with offset/limit/size/_links metadata.
testrail project list --page --limit 25 --offset 0

# Every response page, emitted as one bounded item array.
testrail project list --all --page-size 100 --max-items 10000
```

`--page` and `--all` conflict. `--all` also rejects `--limit` and
`--offset`; use `--page-size` and `--start-offset`. Aggregate-only
controls are `--max-pages`, `--max-items`, `--max-duration-ms`, and
`--max-bytes`. Defaults are 250/page, offset 0, 100 pages, 25,000
items, five minutes, and 100 MiB; hard ceilings are 250/page, five
minutes, and 1 GiB. No partial array is printed when a bound,
continuation, request, or structural page check fails. Programmatic
failures are `TestRailPaginationError` with reasons `max_pages`,
`max_items`, `max_duration`, `max_bytes`, `invalid_page`,
`invalid_continuation`, or `non_progress`.

The registry covers cases/history and project BDDs; projects, suites, sections, plans,
runs, tests, milestones; all three result lists; labels; shared
steps/history; case/run/plan attachments; datasets, variables, roles,
groups, and case statuses. Shared-step history, datasets, variables,
roles, groups, and case statuses are response-driven: `--all` accepts
safety bounds but rejects `--page-size`/`--start-offset`, and `--page`
rejects `--limit`/`--offset`. Test attachments, plan-entry attachments,
users, and ordinary metadata/configuration/report lists do not expose
`--page`/`--all`.

Programmatically, the same contract is `get*()` for a one-response
array, `get*Page()` for `Page<T>`, and `getAll*()` for a bounded full
array. `_links.next` decides continuation, but the client extracts only
validated controls and rebuilds the known endpoint; it never follows
the link's host/path. Legacy bare arrays are terminal, and all-page
walks bypass the GET cache to avoid mixing differently aged pages. Page reads
use normal caching in a separate strict-schema namespace, so a collection-only
legacy wrapper cannot poison `Page<T>` reads.

### Response validation policy

Entity-field response mismatches are advisory in the CLI. By default the
command continues and writes at most 10 unique, deduplicated warnings to stderr,
then a safe suppressed-count summary. Warnings contain only the HTTP method,
known resource/action, normalized issue codes, and shape-only paths whose
segments are all masked. They never include the endpoint, field/record keys,
issue messages, or raw response data.

Use `--strict-responses` or `TESTRAIL_STRICT_RESPONSES=1` in CI to stop at the
first mismatch with exit code 1. Read mismatches raise
`TestRailValidationError`; successful mutating-response mismatches raise a
privacy-safe `TestRailApiError` whose message says the write outcome is
indeterminate—do not retry it blindly. One-shot commands emit no mismatched
value and bounded aggregates emit no partial array. A streaming `run watch` can
retain completed events from earlier polls. The environment variable accepts
`1`, `0`, an empty value, or unset; any other value is rejected before
authentication or a network request. `--strict-responses=<value>` forms are
rejected. `--quiet` suppresses advisory warnings.

Response types derive from declared schema keys. Only `Case`, `Test`,
and `Result` declare flat `custom_*` bracket access, returning
`unknown`; narrow it before use. Their nested `custom_fields` member is
deprecated. Stable fields include `Test.refs_data`/`case_title`,
`Result.case_title`/`case_refs`, case/result field system flags, and
recursively typed milestone children.

## Destructive actions

Destructive actions (`attachment delete`, `case delete`, `case delete-bulk`,
`run close`, `run delete`, `section delete`, `suite delete`, `milestone delete`,
`project delete`, `plan close`, `plan delete`, `plan delete-entry`,
`plan delete-run-from-entry`, `variable delete`, `dataset delete`,
`shared-step delete`, `group delete`, `configuration delete`,
`configuration-group delete`, `label delete`, and `label delete-bulk`) require
`TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes` to execute. A missing env unlock
exits 2. With the env unlock set but no `--yes`, the CLI exits 1 with
`Destructive action; pass --yes to confirm.` There is no interactive prompt
(by design; this skill targets agents, not humans).

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
| `1`  | Failure: bad auth, invalid args, validation, 4xx/5xx HTTP, rate limit, timeout |
| `2`  | Destructive action blocked by a missing or invalid `TESTRAIL_ALLOW_DESTRUCTIVE` unlock |

Errors are written to stderr in the form `Error: <message>`. Common
causes:

- `Missing auth.` → env vars / flags not set.
- `<param> must be a positive integer` → bad path arg (e.g. `project get abc`).
- `Unknown resource '<x>'. Use: …` → use a resource from `testrail --help`.
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
- `--filename requires a value, but the next argument was the flag --dry-run.` → supply the missing filename; use `--filename=--dry-run` only when that is the intended literal name.
- `--api-key-stdin requires the API key to be piped on stdin (…).` → `--api-key-stdin` passed without piped stdin.
- `Input exceeds maximum 1048576 bytes. …` → stdin body or `--api-key-stdin` payload exceeded the 1 MiB cap.

### Save error diagnostics

Add `--diagnostic-file <new-path>` to the original API command when you need
bounded, redacted server validation details in a JSON file:

```bash
testrail case-field list --diagnostic-file ./testrail-error.json
```

The CLI reserves a private file before the command handler runs and rejects
existing paths. Failure records include the HTTP status, whether handler execution started, and
allowlisted messages from JSON error responses. Raw request/response bodies,
headers, stacks, and known credentials are excluded. Success removes the
reserved file. `--quiet` still permits explicitly requested diagnostics.
`--dry-run` skips diagnostic paths entirely. The flag is unavailable on Windows
because this implementation cannot establish private-file permissions there.
Never replay a write just to collect a diagnostic file: a failure after
dispatch can have an indeterminate outcome.

## Limits & gotchas

- **Rate limit:** 100 requests / 60s by default (configurable on the
  programmatic client; the CLI uses defaults). The CLI throws an error
  rather than queueing on overflow.
- **GET cache:** GET responses are cached in-process for ~5 minutes by
  default. POSTs invalidate the entire cache. Polling actions opt out:
  `run watch` builds its client with the cache disabled, so every poll
  reaches TestRail at the requested interval. Programmatic `getAll*()` walks bypass cache reads/writes and
  pending-request coalescing; `get*Page()` uses normal caching in a separate
  strict-schema namespace from legacy one-response list reads.
- **Retry:** GET requests retry 5xx responses, 429s, and network errors — except `report run` / `report run-cross-project`, which are side-effecting GETs and retry 429 only.
  JSON writes retry only 429; write 5xx/network errors surface immediately
  to avoid duplicate writes. Multipart uploads never retry. The default is
  three retries after the initial attempt, with exponential backoff and
  `Retry-After` support. Other 4xx, timeouts, redirects, and body-limit
  failures are not retried.
- **No coercion on write payloads:** `"5"` is **not** silently converted
  to `5`. This is intentional — catches agent template-substitution
  bugs at the CLI boundary rather than the API call site.
- **`custom_*` fields:** Runtime `.passthrough()` schemas preserve them.
  Public response bracket access is declared only on `Case`, `Test`, and
  `Result`, returns `unknown`, and must be narrowed. The deprecated nested
  `custom_fields` record remains for older servers/proxies.
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

## Falling back to the programmatic SDK

Correct CLI syntax or payload errors before switching interfaces. Both the
CLI and SDK validate write payloads with the same schemas; neither coerces
`"5"` to `5`. Every documented SDK endpoint has a CLI action in the command
table. Use the programmatic API section when writing TypeScript/JavaScript
or when you need client configuration and lifecycle control.

Never fall back when the failure came back from TestRail itself: any
4xx/5xx HTTP status, an auth failure, or a rate limit. The SDK calls
the exact same TestRail endpoint the CLI does, so it will fail the
same way for the same reason — retrying through the SDK only burns a
cycle re-proving a failure you've already seen, not fixing it.

```bash
# CLI rejects this before touching the network: priority_id is a string,
# and the CLI does not coerce "3" to 3.
testrail case add 12 --data '{"title": "Login page accepts SSO redirect", "priority_id": "3"}'
# Error: Payload validation failed: …

# Correct the value and validate the intended write locally.
testrail case add 12 --data '{"title": "Login page accepts SSO redirect", "priority_id": 3}' --dry-run
```

```typescript
// The same corrected numeric field also works through the SDK.
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!,
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
});

try {
    const created = await client.cases.addCase(12, {
        title: 'Login page accepts SSO redirect',
        priority_id: 3,
    });
    console.log(created.id);
} finally {
    client.destroy();
}
```

## When NOT to use this skill

- **Structural CRUD beyond what the command table lists.** Treat the command
  table as the authoritative endpoint surface. Operations absent from it
  also lack documented SDK endpoint methods; use TestRail's supported UI
  workflow where available. Case statuses, for example, are read-only in
  both the CLI and SDK.
- **Browser/UI workflows.** This is a non-interactive CLI.

The CLI **does** support attachment upload/download/delete and BDD
(Gherkin .feature) upload/download — see the command table and file-I/O
recipes above. For code that imports the package, use the programmatic API
section, `README.md`, and `CODEMAP.md`.

## See also

- `README.md` — package install, programmatic API overview, configuration
- `CODEMAP.md` — every public method, type, error class, and constant
- `src/schemas.ts` — Zod payload schemas (source of truth)
- `BACKLOG.md` — deferred CLI/skill features tracked for future releases
- TestRail API docs: <https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API>

