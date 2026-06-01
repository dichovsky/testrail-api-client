# Changelog

All notable changes to `@dichovsky/testrail-api-client` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Published to npm:** `1.0.0`, `2.1.0`, `4.0.0`, `4.1.0`, `5.0.0`. Other
> version headers in this file (`2.0.0`/`2.2.0` and the `3.x` line) were internal
> or unreleased and never reached the registry. The `5.0.0` entry below collapses a
> large body of unreleased work — previously carried on `main` as `5.0.0` through
> `7.1.0` — into a single major bump from the last published release, `4.1.0`. No
> source was reverted in that reconciliation; only the version number and this log
> were realigned with what npm actually shipped.

## [5.0.0] — Namespaced client + everything accumulated since 4.1.0

First npm release since `4.1.0` (2026-05-21). This major collapses the entire
unreleased line that had built up on `main` (previously numbered `5.0.0` through
`7.1.0`) into one bump. SemVer is measured from what consumers last installed —
`4.1.0` — so every breaking change since then is bundled under this single major.
No source was reverted; only the version number and this changelog were reconciled.

### Changed (BREAKING)

- **Flat `TestRailClient` facade removed (ARCH #7).** The ~131 flat pass-through
  methods on the client are gone; the 18 namespaced domain modules
  (`client.projects.*`, `client.runs.*`, `client.results.*`, …) are now the single
  access path. This is a pure call-path rename — no signature, argument, or
  behaviour change.

    **Migration.** Insert the owning module field between `client` and the method:
    `client.getProject(1)` → `client.projects.getProject(1)`. The non-obvious maps
    are the metadata reads (`getStatuses`, `getCaseFields`, `getPriorities`, …) →
    `client.metadata.*` and the group methods (`getGroups`, `addGroup`, …) →
    `client.users.*`.

- **Plan-entry attachment `entryId` is a GUID string, not a number.**
  `attachments.getAttachmentsForPlanEntry` / `addAttachmentToPlanEntry` — and the
  CLI `attachment list-for-plan-entry` / `add-to-plan-entry` — now take a UUID
  string, matching what `get_plan` actually returns (a numeric id was rejected by
  the server with HTTP 400).

- **Validation/URL delegate methods removed (ARCH #6).** The validation and
  URL-building helpers previously delegated through the client were extracted to
  standalone leaf modules; import the pure helpers directly instead of calling them
  on a client instance.

- **Stale public type aliases dropped.** Dead re-exported type aliases were removed
  from the public surface.

### Added

- **camelCase list-filter options** for `getPlans`, `getResults`, `getTests`, and
  `getMilestones` (`createdAfter`, `createdBy`, `statusId`, `milestoneId`,
  `isCompleted`, …), aligning them with `getCases` / `getRuns`. The original
  snake_case keys remain as `@deprecated` aliases for one major.
- **UUID attachment ids** accepted by `attachments.getAttachment` /
  `deleteAttachment` and the CLI `attachment get` / `attachment delete` (TestRail
  7.1+ RFC-4122 GUID ids), alongside the existing integer ids.
- Additional response-schema fields for TestRail 7.3+ / Enterprise and SPEC-driven
  schema parity, plus an injectable `fetch` adapter and an injectable DNS lookup
  for restricted-DNS environments.

### Fixed

- **`users.getGroups()` parses the paginated wrapper.** `get_groups` returns
  `{ offset, limit, size, _links, groups: [...] }`, not a bare array; the schema now
  mirrors `getUsers()` and returns `groups ?? []`.
- **`metadata.getRoles()` parses the paginated wrapper.** `get_roles` (TestRail 7.3+)
  is a bulk-API endpoint and returns `{ offset, limit, size, _links, roles: [...] }`
  from the version it was introduced — never a bare array. The schema parsed
  `z.array(RoleSchema)`, so every call (and the `role list` CLI command) threw
  `TestRailValidationError` against a real server; the unit test passed only because
  it mocked a bare array. Now parses the wrapper and returns `roles ?? []` — the
  same fix class as `getGroups` above.
- **`suites.getSuites()` accepts both the bare-array and paginated-wrapper shapes.**
  `get_suites` returns a bare array up to TestRail 9.3.0 and a
  `{ offset, limit, size, _links, suites: [...] }` wrapper from 9.3.1+ (documented
  breaking change). The client now accepts either, so it works regardless of server
  version.
- **`variables.getVariables()` and `datasets.getDatasets()` parse the paginated
  wrapper.** `get_variables` and `get_datasets` are bulk-API endpoints and return
  `{ offset, limit, size, _links, variables: [...] }` /
  `{ ..., datasets: [...] }` — the standard pagination envelope every bulk endpoint
  has emitted since TestRail 6.7, never a bare array. Both schemas parsed
  `z.array(...)`, so every call (and the `variable list` / `dataset list` CLI
  commands) threw `TestRailValidationError` against a real server; the unit tests
  passed only because they mocked a bare array. Now parses the wrapper and returns
  `variables ?? []` / `datasets ?? []` — the same fix class as `getRoles` /
  `getGroups` above.
- **LRU cache** no longer evicts an innocent entry on a re-set at capacity, and the
  **rate limiter** now records retries without spuriously rejecting a retried
  request as a local 429.
- **`--format table` no longer drops columns missing from the first row.** The
  table renderer derived its column set from `rows[0]` only, so any field present
  on a later row but omitted from the first was silently dropped — data and all.
  This was reachable with real TestRail data: response schemas use `.nullish()`,
  so the API omits unset fields, and a list's first entity can legitimately lack a
  key (e.g. `milestone_id`) that a later one carries. The renderer now takes the
  union of keys across all rows (first-seen order), matching `--format csv`; the
  omitting row renders an empty cell instead of losing the column. `--format json`
  / `csv` were already correct.

### Security

- Unified HTTP pipeline with manual-redirect blocking (SSRF guard), response-body
  byte caps and wall-clock deadlines, additional IPv6 SSRF ranges,
  multipart-upload hardening, opt-in process signal handlers, and supply-chain
  hardening (`.npmrc` + lockfile-lint, OIDC trusted publishing with provenance).

## [4.1.0] — 2026-05-21

Published directly to npm (no GitHub release or git tag); backfilled here so the
changelog matches the registry.

### Fixed

- **Accept nullable TestRail response fields.** Response schemas were widened to
  `.nullish()` wherever TestRail may return `null` or omit a key, so otherwise
  valid API responses with null or absent fields no longer fail validation.

## [4.0.0] — 2026-05-20 — CLI hardening release

First npm publish since `2.1.0` (2026-05-13). Closes the CLI/library safety
cluster opened across the unpublished 3.x line and ships every additive
feature accumulated since the last release in a single major bump.

**Why a major version jump from 2.1.0?** Seven `!`-tagged commits land
breaking changes across the `testrail` CLI binary — which is part of the
package surface and thus governed by SemVer. The library API also gains
one breaker: process signal handlers are now opt-in
(`registerProcessHandlers: true`, default `false`) so the client no longer
hijacks the host process's shutdown chain (SEC #8). Two distinct waves of
breakage justify the gap from `2.1.0`:

- **Wave 1 (would have been 3.x):** CLI security cluster — `--api-key`
  removed in favor of `--api-key-stdin`, unknown-flag rejection, `--yes`
  gate on `run close` and single-entity destructive deletes, stdin body
  cap at 1 MiB, terminal-control-char stripping, SSRF/3xx-redirect block,
  retry policy tightened on writes, response-body byte + wall-clock caps.
- **Wave 2 (this 4.0):** destructive-ops env-var gate
  (`TESTRAIL_ALLOW_DESTRUCTIVE=1`) — every destructive CLI action now
  requires the env var **in addition to** `--yes`. New exit code `2` to
  let CI branch on "missing env var" vs other failures.

Nothing 3.x was ever published to npm; consumers leap `2.1.0` → `4.0.0` in
one hop. Per-version chronology preserved in [3.0.0]–[3.5.0] entries below
so the breaker timeline is auditable.

### Added

- **CLI binary stdio (`-` sentinel) for attachments and BDD.** `--file -`
  streams a binary upload from `process.stdin`; `--out -` streams the
  download to `process.stdout` while the JSON ack is rerouted to stderr.
  Enables pipeline composition without temp files
  (e.g. `curl … | testrail attachment add-to-case 42 --file -`,
  `testrail attachment get 17 --out - | xxd`).
- **`MAX_STDIN_UPLOAD_BYTES`** (100 MiB) and **`STDIN_READ_TIMEOUT_MS`**
  (30 s) constants gate the stdin reader. The byte cap defends against
  memory exhaustion; the wall-clock deadline (via `stream.destroy()`
  surfaced through the async iterator) defends against slowloris-style
  producers that never EOF — partial mitigation of `SEC #24` for the
  binary-upload path. `readBoundedStdin` (text body / `--api-key-stdin`)
  still has no deadline; that follow-up remains open.
- **`HandlerContext.err` / `HandlerContext.errRaw`** — quiet-aware stderr
  writers passed to handlers so the `--out -` JSON ack can land on stderr
  without bypassing `--quiet`.

### Security

- **`--file -` mutex gates:** rejected on non-upload actions, alongside
  `--data` / `--data-file`, alongside `--api-key-stdin`, or when stdin is
  a TTY. Each conflict surfaces a structured stderr error before any API
  call is issued.
- **`--out -` rejects `--format table`** (binary is binary; the format
  hint is meaningless and was previously a silent foot-gun).
- **TTY warning on `--out -`** when stdout is a terminal — emitted to
  stderr, not blocking, so intentional pipelines to `xxd` / `hexdump`
  still work.

### Added (continued)

- **CLI: `--format yaml` and `--format csv` output formats.** Closes [BACKLOG CLI
  format yaml/csv](docs/archive/BACKLOG-ARCHIVE.md). Every read, list, and write action now
  accepts `--format <json|table|yaml|csv>` (default unchanged: `json`).
    - `yaml` emits a zero-dependency YAML 1.2 document with 2-space indent.
      Strings that could parse as numbers, booleans, null tokens, or carry
      reserved YAML leaders (`-`, `?`, `:`, `#`, `|`, `>`, etc.) are
      force-quoted in double-quoted form with full C-style escapes. NaN /
      Infinity are emitted as the YAML 1.2 sentinels (`.nan`, `.inf`,
      `-.inf`). No new runtime dependency — the emitter is hand-rolled to
      respect the project's zero-runtime-dep policy.
    - `csv` emits RFC 4180 with CRLF line terminators. Headers are the
      sorted union of top-level keys across rows (deterministic output for
      diff-friendly exports). Nested objects/arrays are JSON-stringified
      into a single cell (no dot-path flattening) so the column count is
      stable regardless of payload shape. Single-object responses become a
      1-row CSV preserving insertion order.
    - Unknown `--format` values now exit 1 with a clear error listing the
      valid values, instead of silently falling through to JSON.
    - See `README.md` for the format matrix and pipeline examples
      (`yq`-piping for YAML, spreadsheet exports for CSV).
- **Programmatic TypeScript API recipes** in `skill/SKILL.md`. A new
  `## Programmatic TypeScript API` section gives copy-paste-runnable
  snippets for every major resource (projects, suites, sections, cases,
  runs, results, milestones, attachments, plans, users, datasets,
  variables, groups, shared steps, configurations) using `TestRailClient`
  directly. Each snippet compiles against the published types — no
  pseudo-code. Includes an `instanceof`-narrowing pattern for
  `TestRailApiError` / `TestRailValidationError` and a tuning example
  covering retries, rate limits, body caps, and `registerProcessHandlers`.
- **Cursor rule** at `.cursor/rules/testrail.mdc`. Auto-generated from
  the same source as `skill/SKILL.md`; includes the standard
  `description` / `globs` / `alwaysApply` frontmatter per the
  [Cursor rules spec](https://docs.cursor.com/context/rules-for-ai).
  Regenerate via `npm run cursor-rules`. CI drift gate:
  `npm run cursor-rules:check` (wired into `pretest`).
- **Continue rule** at `.continue/rules/testrail.md`. Plain-markdown
  format per [continue.dev rules spec](https://docs.continue.dev/customization/rules).
  Regenerate via `npm run continue-rules`. CI drift gate:
  `npm run continue-rules:check`.
- **Vendor-neutral `AGENTS.md`** at the repo root, following the
  [agents.md](https://agents.md/) convention. Acts as a "what every AI
  agent should know" entry point that doesn't bind to a specific
  harness. Regenerate via `npm run agents-md`. CI drift gate:
  `npm run agents-md:check`.
- **`testrail uninstall-skill`** — symmetric reverse of `install-skill`.
  Removes a previously-installed skill from `./.claude/skills/testrail-cli/`
  (default) or `~/.claude/skills/testrail-cli/` (`--global`). Best-effort
  cleanup of the empty `testrail-cli/` directory after unlinking the
  skill file. Does NOT touch `.cursor/rules/testrail.mdc`,
  `.continue/rules/testrail.md`, or `AGENTS.md` — those have an
  independent lifecycle (generated from `src/cli/metadata.ts` and live
  alongside other agent-tool configuration). HELP text and README
  document this boundary.
- **Shared `scripts/rules-content.mjs` module** — single source of truth
  for the body of the three rule artifacts. Each format wraps the shared
  body in its own header/frontmatter so usage guidance lives in one
  place.

### Safety

The new `uninstall-skill` command uses TOCTOU-aware filesystem checks
that mirror the existing `install-skill` patterns:

- `lstat` (not `stat`) so symlinks are detected without following.
- Refuses to unlink anything that is a symlink — `install-skill` only
  ever produces regular files via `copyFileSync`, so anything else
  indicates either tampering or unrelated user-managed content.
- Refuses to unlink non-files (e.g. a directory planted at the target
  path).
- After unlinking the skill, attempts to remove the parent
  `testrail-cli/` directory ONLY if empty — never touches
  `.claude/skills/` or higher.

Related backlog: SEC #5 (TOCTOU symlink-clobber on `install-skill`
target) remains open as a separate, pre-existing concern. This PR does
not introduce a parallel hazard but does not fix the existing one.

### Tooling / CI

- Four new npm scripts plus `:check` drift-gate variants:
  `cursor-rules`, `continue-rules`, `agents-md`, and the existing
  `skill` script unchanged.
- `pretest` now also runs `cursor-rules:check`, `continue-rules:check`,
  and `agents-md:check`. PRs that update `src/cli/metadata.ts` without
  regenerating fail in CI.
- All generated files are deterministic (no timestamps, no random IDs,
  stable iteration order). `tests/generate-rules.test.ts` asserts
  byte-equality of committed vs. re-rendered output.

### Tests

- `tests/uninstall-skill.test.ts` (12 cases): happy paths (project +
  global), missing-file, quiet semantics, install/uninstall round-trip,
  TOCTOU defenses (symlink refusal + non-file refusal), sibling-file
  preservation, lifecycle messaging.
- `tests/generate-rules.test.ts` (13 cases): pure-renderer determinism,
  frontmatter shape (cursor has YAML; continue does not),
  `AGENTS.md` self-references, committed-output drift checks.
- `tests/cli.test.ts` adds a smoke test confirming `uninstall-skill` is
  reachable via `--help` (full behaviour coverage lives in the unit
  test where the filesystem can be sandboxed).

### Added (CLI bulk case creation, run watcher, attachment pagination)

- **`case add-bulk` CLI action + `addCases()` programmatic method** for
  bulk-creating cases under a section in one API call (TestRail 7.5+).
  Wraps `POST add_cases/{section_id}`; the `--data` body is a JSON array of
  case payloads (each item the same shape as `AddCasePayload`). Empty arrays
  and array items that fail `AddCasePayloadSchema` are rejected client-side
  before any network call. **Version-aware error wrap:** older TestRail
  servers return 400/404 with `"Invalid uri"` because the endpoint doesn't
  exist; the module rethrows that as `TestRailApiError(status, 'TestRail server >= 7.5 required for add_cases bulk endpoint', <original response>)`
  so callers can tell "your TestRail is too old" from "your payload is
  malformed". `--dry-run` previews the parsed array with a `count` field.
- **`run watch <run_id>` CLI action** — long-running command that polls
  `GET get_run/{run_id}` on a configurable interval (default 30s;
  `--interval N` where N is in `[5, 600]`; `--once` for single poll then
  exit) and emits a compact JSON event line per poll. Diff detection runs
  over a closed set of fields (`is_completed`, `untested_count`,
  `passed_count`, `failed_count`, `retest_count`, `blocked_count`) so
  mutable timestamps don't trigger noise. Exits 0 when TestRail flips
  `is_completed=true`; exits 130 on SIGINT (writes a one-line `interrupted`
  summary to stderr before the client's signal handler runs). Polling uses
  recursive `setTimeout` (not `setInterval`) so a slow poll can't stack
  pending timers; transient `getRun` rejections surface to stderr but don't
  abort the watcher.
- **Pagination on `attachment list-for-{case,run,test}` CLI actions and
  the corresponding programmatic methods** — `getAttachmentsForCase` /
  `getAttachmentsForRun` / `getAttachmentsForTest` now accept
  `GetAttachmentsOptions { limit?, offset? }`. `--limit` and `--offset`
  forward to TestRail's `&limit=` / `&offset=` query params (server
  default page size 250). Plan-scoped variants (`list-for-plan`,
  `list-for-plan-entry`) intentionally don't paginate — TestRail returns
  the full tree.

### Changed

- New types exported from package root: `AddCasesBulkPayload`,
  `AddCasesBulkPayloadSchema`, `GetAttachmentsOptions`.
- New CLI flags: `--interval <seconds>`, `--once` (both consumed only by
  `run watch`); attachment list actions now honor the existing `--limit` /
  `--offset` flags.
- **`requestMultipart` now streams file uploads from disk** instead of buffering the entire payload into the heap. The CLI (`testrail attachment add-to-* --file …`, `testrail bdd add --file …`) and any programmatic caller using the new `{ path: string; type?: string }` input shape pull bytes via `node:fs.openAsBlob`, so `fetch` reads the file on demand and the process never materializes the whole attachment in memory. Benchmark on a 100 MB file: heap +2.30 MB / RSS +175.61 MB before → heap +0.00 MB / RSS +0.02 MB after.
- Public API is backwards compatible. `addAttachmentToCase`, `addAttachmentToResult`, `addAttachmentToRun`, `addAttachmentToPlan`, `addAttachmentToPlanEntry`, and `addBdd` accept the existing `Blob | Uint8Array | File` inputs plus the new `{ path }` descriptor. In-memory inputs are unchanged.
- The CLI's `resolveFile()` no longer returns `contents`; the `read` option on `ResolveFileOptions` is preserved for source-compat but is now a no-op (the multipart pipeline reads from disk lazily).
- Upload invariants are preserved: no retry on 5xx/429/network errors, `AbortSignal` honored throughout the body upload, DNS-pin/SSRF guard still applied before fetch, 3xx still rejected by `assertNotRedirect`.

### Changed (BREAKING) — Destructive-ops env-var gate

Closes [BACKLOG CLI: destructive env-var gate](docs/archive/BACKLOG-ARCHIVE.md). Adds a
**second gate** for destructive CLI actions (`*:delete`, `run close`,
`plan close`): a `TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable that
must be set **in addition to** the existing `--yes` flag. The check runs in
the dispatcher (`src/cli/dispatch.ts`) before the handler is invoked — so
even a future destructive handler added without an `if (!confirmDestructive)`
check cannot escape the env-var gate (defense-in-depth).

- **BREAKING — Destructive CLI actions now require `TESTRAIL_ALLOW_DESTRUCTIVE=1`
  in addition to `--yes`.** Existing CI users must set this environment
  variable before any destructive command. The env var must be **exactly**
  the string `'1'` (not `'true'` / `'yes'` / `'on'` / `'1 '` with whitespace).
- **New exit code `2`** for "destructive action blocked by missing env var".
  Distinct from the generic exit code `1` (used for argv / auth / validation
  / HTTP failures) so CI can branch on "needs `TESTRAIL_ALLOW_DESTRUCTIVE`"
  vs everything else.
- `--dry-run` continues to bypass both gates (preview is non-destructive by
  definition; no API call leaves the process). Use `--dry-run` for safe CI
  preview without setting up the gates.

### Migration (env-var gate)

> Migration guidance for the **other** Wave-1 breakers (`--api-key`
> removal, `--yes` on `run close`, unknown-flag rejection, stdin body cap,
> `registerProcessHandlers` opt-in) lives in the [3.0.0]–[3.5.0] entries
> below — each unpublished 3.x section retains its own migration notes
> intact for auditability.

**For CI users running destructive `testrail` commands:**

Add the env var to your CI step (export it once; it applies to every
subsequent destructive command in that step):

```bash
# Before (3.5.x):
testrail run delete 5 --yes

# After (4.0.0+):
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail run delete 5 --yes
```

Or as a one-liner:

```bash
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes
```

**Affected actions** (all currently destructive resources): `case delete`,
`case delete-bulk`, `run delete`, `run close`, `section delete`,
`suite delete`, `milestone delete`, `project delete`, `plan close`,
`plan delete`, `plan delete-entry`, `plan delete-run-from-entry`,
`variable delete`, `group delete`, `dataset delete`, `shared-step delete`,
`configuration delete`, `configuration-group delete`, `attachment delete`.

**For agents / scripts using `--dry-run`:** No action required. `--dry-run`
bypasses the env-var gate (and the `--yes` gate) so CI preview workflows
continue to work without configuration.

**For programmatic library users (`TestRailClient.deleteRun(…)` etc.):** No
action required. The gate only applies to the CLI dispatcher — the
programmatic API surface is unchanged.

### Why two gates?

The env var is a **process-wide, audit-friendly switch** (visible in
`printenv`, CI step logs, crash dumps). The `--yes` flag is **per-invocation
explicit intent**. Together they make accidental destructive operations
meaningfully harder:

- A script run with a stale env still needs `--yes`.
- A typo with `--yes` still needs the env var.
- A handler added without `--yes` validation still can't escape the dispatcher.

The strict `'1'` comparison (no `'true'` / `'yes'` aliasing) keeps the
audit trail unambiguous: in CI logs you can tell `unset` from `set-to-wrong-value`
from `set-to-allow` at a glance.

### Unchanged (env-var gate)

- Per-handler `--yes` semantics and exit-1 behavior on missing `--yes`.
- `--dry-run` wins-over-`--yes` precedence (preview without API call).
- `--soft` server-side preview semantics on soft-capable deletes.
- Programmatic library API (`TestRailClient.deleteRun(…)`, etc.) — no env
  var required for direct client calls.

## [3.5.0] — 2026-05-18 — Stop hijacking host signal handling (opt-in process handlers)

Closes [BACKLOG SEC #8](docs/archive/BACKLOG-ARCHIVE.md). Before this release, **every**
`TestRailClient` construction silently registered three process-level listeners
(`exit`, `SIGINT`, `SIGTERM`) on the Node.js `process` object. The SIGINT and
SIGTERM handlers additionally called `process.exit(130)` / `process.exit(143)`.
For library consumers — Express servers, NestJS apps, background daemons,
Electron processes, or any host that already manages graceful shutdown — this
meant:

- The host's own SIGINT/SIGTERM handler chain ran in an indeterminate order
  alongside the client's, and the client could shortcut the process via
  `process.exit()` before the host finished closing sockets, flushing logs,
  rolling back transactions, or persisting state.
- The host could not opt out: the side effect ran inside the constructor.
- A test that instantiated the client polluted the process for the rest of
  the worker's lifetime (handlers cannot be safely deregistered without
  ownership tracking across all clients in the process).

### Fixed

- **New `registerProcessHandlers?: boolean` option on `TestRailConfig`,
  defaulting to `false`.** No process listeners are installed unless the
  caller explicitly opts in. Library consumers now get an inert client that
  leaves `exit`/`SIGINT`/`SIGTERM` to the host.
- **The bundled CLI (`testrail` binary) opts in** by passing
  `registerProcessHandlers: true`, preserving the established CLI behavior
  (`destroy()` on Ctrl-C, conventional 130/143 exit codes) for users of the
  shipped command.
- **Existing behavior is unchanged once the flag is set to `true`** — the
  handler implementation, the `activeClients` registry it iterates, and the
  exit codes it emits are all preserved.

### Migration

- **CLI users:** no action required. The `testrail` binary opts in on your
  behalf and behaves identically to previous releases.
- **Library users who relied on the implicit handlers** (rare — the behavior
  was undocumented): add `registerProcessHandlers: true` to your
  `TestRailConfig` to keep the prior shutdown contract. The recommended path
  is to call `client.destroy()` explicitly from your own shutdown hook
  instead; that has always been the supported lifecycle API.
- **Library users embedding the client in a server/daemon:** no action
  required. The opt-out you've been working around is now the default; your
  signal handling and exit codes are no longer overridden.

### Unchanged

- `destroy()` semantics, the `activeClients` registry, the cache cleanup
  timer, and the credential-zeroing behavior are all identical to 3.4.0.
- The handler-install path itself is bit-identical when the flag is `true`;
  this release adds a single guard in the constructor.

## [3.4.0] — 2026-05-18 — Block HTTP redirects to close SSRF guard bypass

Closes [BACKLOG #4](BACKLOG.md). Before this release, the SSRF guard
(`validateBaseUrl` + DNS pin) validated only the **initial** request host.
`fetch` follows redirects by default, so a TestRail server (or any reverse
proxy in front of it) that returned a `301`/`302`/`303`/`307`/`308` with a
`Location` pointing at a private IP — `127.0.0.1`, `169.254.169.254`
(cloud metadata), `10.0.0.0/8`, link-local, etc. — would silently make the
client issue a request to the protected host, leaking credentials and
returning the attacker-controlled body to the caller. The guard was bypassed
without ever surfacing an error.

### Fixed

- **All four fetch sites (`request<T>`, `requestText`, `requestMultipart`,
  `requestBinary`) now set `redirect: 'manual'`** so the runtime never
  follows a `Location` header automatically.
- **3xx responses are rejected as `TestRailApiError`** via a new private
  `assertNotRedirect()` helper. The error preserves the original `status`
  and `statusText`; the `response` field embeds the `Location` value
  (when present) so callers can diagnose a misconfigured `baseUrl` or
  reverse proxy without losing the redirect target.
- **3xx never retries.** A redirect is not transient: retrying would either
  loop or amplify the SSRF surface if `redirect: 'manual'` were ever
  removed. Affects all four fetch sites uniformly.
- **3xx never poisons the GET cache.** The redirect rejection fires before
  any cache write, so a single redirected request cannot serve a bad value
  for the full TTL.

### Unchanged

- `GET` retry behavior for `5xx`/`429`/network errors is unchanged.
- The existing SSRF allow-list (`allowPrivateHosts`) and the DNS-pin behavior
  are unchanged — this release closes the redirect-shaped hole next to them.
- The TestRail JSON API itself does not return `3xx` for `/index.php?/api/v2/...`
  endpoints, so no real call site loses functionality.

### Migration

No code changes required for callers hitting standard TestRail instances.
If your deployment fronts TestRail with a redirecting reverse proxy
(e.g. a `301` from an old hostname to a new one), update `baseUrl` to the
final URL. The error body now includes the blocked `Location` value, making
this trivial to diagnose.

## [3.3.0] — 2026-05-18 — Stop retrying non-idempotent writes on 5xx and network errors

Closes [BACKLOG #13](BACKLOG.md). Before this release, every retryable failure
(`5xx`, `429`, network error) triggered a transparent retry up to `maxRetries`,
regardless of HTTP method. For mutating requests this masked a data-integrity
hazard: when a TestRail POST returned `502`/`503` or the connection reset
mid-flight, the server may already have processed the write. The retry then
produced a duplicate record — duplicate runs, duplicate cases, duplicate
results — with no warning to the caller.

### Fixed

- **`request<T>()` and `requestText()` no longer retry non-`GET` methods on
  `5xx` responses or network errors.** A `503` returned for `add_case`,
  `update_run`, `delete_milestone`, etc. now surfaces immediately to the caller
  as a `TestRailApiError`, preventing silent duplicate writes. Likewise, a
  `fetch` `TypeError` (e.g. `ECONNRESET`) during a mutating request throws
  rather than retrying, because the request bytes may already have reached
  the server.

### Unchanged

- `429` (rate limit) still retries for **all methods**, including writes.
  TestRail's rate limiter rejects requests before they execute, so a retry
  on a 429-blocked write cannot duplicate state. `Retry-After` handling is
  unchanged.
- `GET` retry behavior is unchanged: `5xx`, `429`, and network errors all
  retry up to `maxRetries`.
- `requestUpload()` (attachment POST) already opted out of retry entirely
  prior to this change.

### Migration

No code changes required. Calling code that previously succeeded after a
transient `5xx` retry on a write will now see the original error surface.
The recommended fix is application-level idempotency (check whether the
resource already exists before retrying) — masking the failure inside the
client was unsafe.

## [3.2.0] — 2026-05-18 — Fix schema-invalid responses poisoning the GET cache

Closes [BACKLOG #9](docs/archive/BACKLOG-ARCHIVE.md). Before this release, the GET cache
recorded the raw JSON-parsed response **before** the module validated it with
Zod. When TestRail returned a schema-invalid body, the bad data persisted for
the full TTL — every subsequent identical GET returned the same poisoned
value and re-threw the same `TestRailValidationError`, with no way to recover
short of calling `clearCache()` or waiting out the TTL. The failure mode
masked transient upstream bugs as permanent client failures.

### Fixed

- **GET cache no longer stores schema-invalid responses.** Validation now
  happens before the cache write, so a malformed payload triggers a single
  `TestRailValidationError` and the next call re-fetches fresh. Previously
  malformed responses stuck for `cacheTtl` ms (5 minutes by default).

### Added

- `TestRailClientCore.requestParsed<T>(method, endpoint, schema, data?)` —
  new public method that performs the request, validates the response
  against a Zod schema, and writes the GET cache only after validation
  succeeds. Used internally by every domain module that returns a typed
  response. Prefer this over the legacy `parse(schema, await request(...))`
  pattern in new code. Validated responses live in a separate cache
  namespace (`PARSED:GET:${endpoint}`) so they cannot collide with raw
  entries written by direct `request()` callers — neither side can poison
  the other, even when both target the same endpoint.

### Changed

- All 17 domain modules now use `requestParsed` for typed responses.
  `request()` and `parse()` remain public and back-compatible — external
  callers that invoke them directly retain the previous semantics, including
  the legacy GET cache-write inside `request()`.

### Migration

No action required. The behavior change is strictly opt-out of a buggy
caching path: every existing caller benefits automatically. Custom code that
imports `request()` + `parse()` from `TestRailClientCore` directly continues
to work; switch to `requestParsed` to opt into the cache-poisoning fix on
your own endpoints.

## [3.1.0] — 2026-05-18 — Destructive single-entity delete CLI surface

Closes the remaining destructive-delete gap in the CLI surface. The
programmatic API gains optional `{ soft?: boolean }` overloads on four
delete methods; all changes are additive — no breaking changes.

### Added

#### Six new destructive CLI actions

```sh
testrail case      delete <case_id>      [--soft] --yes
testrail run       delete <run_id>       [--soft] --yes
testrail suite     delete <suite_id>     [--soft] --yes
testrail section   delete <section_id>   [--soft] --yes
testrail milestone delete <milestone_id>         --yes   # --soft NOT supported
testrail project   delete <project_id>           --yes   # --soft NOT supported; highest blast radius
```

Each follows the destructive-ops convention locked in by `attachment
delete` / `case delete-bulk` / `run close`: `--yes` gates execution;
`--dry-run` wins over `--yes` (preview with no API call); the skill
generator surfaces `destructive: true` so agents see the gate up front.

`--soft` invokes TestRail's `?soft=1` server-side preview — the API
call still happens but nothing is deleted; TestRail returns counts of
affected entities (`affected_tests`, `affected_cases`, `affected_sections`,
`affected_runs`, `affected_plans`, …). Distinct from `--dry-run` which
short-circuits before any API call. `milestone delete` and `project
delete` reject `--soft` explicitly — TestRail's endpoints don't accept
it, and silently dropping the flag would mask a destructive intent
mismatch.

#### Programmatic API

`deleteCase`, `deleteRun`, `deleteSection`, `deleteSuite` gain
`{ soft?: boolean }` overloads mirroring the existing `deleteCases`
precedent. The hard-delete signature is unchanged. The soft-mode return
type is the new shared `SoftDeletePreview` (Zod-derived, `.passthrough()`).

```ts
// Hard delete (unchanged)
await client.deleteCase(42);

// Soft preview (new)
const preview = await client.deleteCase(42, { soft: true });
// preview: { affected_tests?, affected_cases?, ... } — all optional, passthrough preserves unknown counters
```

#### New public exports

- `SoftDeletePreview` — type (re-exported from package root)
- `SoftDeletePreviewSchema` — Zod schema (re-exported)
- `SoftDeleteOptions` — `{ soft?: boolean }` interface (in `types.js`)

### Changed

`DeleteCasesOptions` and `DeleteCasesPreview` (in `src/modules/cases.ts`)
are now `@deprecated` type aliases for `SoftDeleteOptions` and
`SoftDeletePreview` respectively. Existing imports continue to work —
the alias preserves source compatibility.

### Fixed

- CODEMAP.md size sanity bound raised from 200 KB to 256 KB
  (`tests/generate-codemap.test.ts`). Legitimate growth from the new
  public API surface pushed the file to ~201 KB; bumping to 256 KB
  gives headroom for the next several releases.

## [3.0.0] — 2026-05-18 — CLI safety cluster

Hardens the `testrail` CLI surface against several CTF-audit findings.
The programmatic library API (`new TestRailClient({ apiKey, … })`) is
**unchanged** — these breaking changes affect CLI invocations only.

### BREAKING CHANGES

#### `--api-key <key>` argv flag removed (CTF #11)

Argv is visible via `/proc/<pid>/cmdline`, shell history, CI step logs
(retained 30+ days on most providers, project-readable), container
audit trails (`kubectl get pod -o yaml`, auditd, cloud audit), and
crash/sysdig dumps. CWE-214 — the same class that drove
`docker login --password-stdin`.

**Migration:** use the env var (recommended) or pipe the key on stdin.

```sh
# Before (v2.x):
testrail project list --api-key sk-xxx --email me@example.com --base-url …

# After (v3.0) — option A, env var (recommended):
export TESTRAIL_API_KEY=sk-xxx
testrail project list --email me@example.com --base-url …

# After (v3.0) — option B, stdin:
echo "$TESTRAIL_API_KEY" | testrail project list --api-key-stdin \
    --email me@example.com --base-url …
```

Note: `--api-key-stdin` consumes `fd 0`, so JSON write bodies for the
same invocation must come from `--data` or `--data-file`, **not** piped
stdin. Pick one channel for stdin per command.

#### `run close` now requires `--yes` (CTF #6)

Closing a run is irreversible (TestRail offers no `open_run` endpoint
and the web UI has no reopen action). Joins the destructive-ops
convention introduced in v2.2 (`--yes` gates anything the API can't
undo; `--dry-run` wins for preview) that previously covered only
`attachment delete` and `case delete-bulk`.

**Migration:**

```sh
# Before (v2.x):
testrail run close 42

# After (v3.0):
testrail run close 42 --yes
# Or preview without API call:
testrail run close 42 --yes --dry-run
```

#### Unknown / typo'd flags now exit 1 (CTF #10)

`parseArgs` is invoked with `strict: false` for defensive future-Node
tolerance, but a post-parse strict gate now rejects any flag not in
the canonical `KNOWN_FLAGS` set. Previously a typo like `--dryrun`
(missing hyphen) was silently accepted as a free-form key while
`values['dry-run']` stayed undefined — so a user-intended preview
executed for real on a destructive command.

**Migration:** fix the typo. Errors are now of the form
`Error: unknown flag '--dryrun'. Run --help for the full list.`

#### Stdin body reads capped at 1 MiB (CTF #24)

`readFileSync(0, 'utf-8')` was unbounded; pipes larger than container
memory (typical CI runner: 512 MB–1 GB) OOM-killed the process.
1 MiB covers the largest realistic JSON body (bulk case payloads with
thousands of cases) while making OOM impossible.

**Migration:** split oversized payloads across multiple requests, or
write to a file and pass `--data-file <path>` (which is read with the
host's normal file-read semantics, unaffected by this cap).

### Fixed (non-breaking)

- **CTF #16** — strip terminal control chars (C0/C1/DEL) from stderr
  error messages. Defends against ANSI/OSC injection where a
  TestRail-controlled string (server error body, validation echo) or
  argv-controlled string (typo'd flag name) embeds escape sequences
  the user's terminal would then execute — colour overrides, cursor
  moves, window-title spoofing, OSC 7/9 / iTerm2 dynamic-action codes
  that can chain into command injection on terminals that honour them.
- **CTF #18** — same sanitization on the `--format table` success
  path. Every cell value and column key routes through
  `sanitizeForTerminal` before concatenation.

### Internal

- New modules: `src/cli/flags.ts` (single source of truth for the
  `parseArgs` options table + derived `KNOWN_FLAGS`), `src/cli/sanitize.ts`
  (control-char stripper), `src/cli/stdin.ts` (`readBoundedStdin` helper).
- `docs/archive/BACKLOG-ARCHIVE.md` security findings #6, #10, #11, #16, #18, #24 marked
  `[SHIPPED]`.
- Coverage: 97.23% global / 100% on new modules.

### Known limitations

- The stdin cap (`readBoundedStdin`) addresses **memory-exhaustion DoS**
  only. A producer that keeps the pipe open without ever sending more
  than 1 MiB (e.g. `tail -f`, a FIFO writer that never closes) still
  causes the CLI to block indefinitely on the read. Wall-clock deadline
  for stdin reads is tracked separately in `BACKLOG.md` as a follow-up
  on CTF #24.

## [2.2.0] — earlier

See [`docs/archive/BACKLOG-ARCHIVE.md`](docs/archive/BACKLOG-ARCHIVE.md) Decision Log section.
