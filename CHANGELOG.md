# Changelog

All notable changes to `@dichovsky/testrail-api-client` are documented here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0] — 2026-05-18 — Stop hijacking host signal handling (opt-in process handlers)

Closes [BACKLOG SEC #8](BACKLOG-ARCHIVE.md). Before this release, **every**
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

Closes [BACKLOG #9](BACKLOG.archive.md). Before this release, the GET cache
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
- `BACKLOG.archive.md` security findings #6, #10, #11, #16, #18, #24 marked
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

See `BACKLOG.archive.md` Decision Log section.
