# Architecture

`@dichovsky/testrail-api-client` — type-safe TypeScript client for the TestRail API. Zero runtime dependencies (Zod is the only `dependencies` entry). ESM only (`type: "module"`). Ships both a programmatic library and a `testrail` CLI binary.

This document describes how the code is organized, why the layers are split the way they are, and the invariants each layer guarantees. For a per-symbol index see [CODEMAP.md](../CODEMAP.md); for day-to-day editing rules see [CLAUDE.md](../CLAUDE.md).

---

## 1. Layered View

```
┌─────────────────────────────────────────────────────────────────┐
│  CLI layer        src/cli/                                      │
│  ── argv → dispatch → handler → TestRailClient                  │
│  ── flags, body resolution, output rendering, file I/O          │
├─────────────────────────────────────────────────────────────────┤
│  Public barrel    src/index.ts                                  │
│  ── TestRailClient, errors, Zod schemas, types                  │
├─────────────────────────────────────────────────────────────────┤
│  Facade           src/client.ts            TestRailClient       │
│  ── extends core; composes 18 domain modules                    │
│  ── thin wrapper methods delegate to modules                    │
├─────────────────────────────────────────────────────────────────┤
│  Domain modules   src/modules/*.ts         18 namespaces        │
│  ── stateless; one per TestRail resource                        │
│  ── constructor-injected reference to the core                  │
├─────────────────────────────────────────────────────────────────┤
│  Core             src/client-core.ts       TestRailClientCore   │
│  ── HTTP pipeline: cache, rate limit, retry, timeout, SSRF      │
│  ── lifecycle, validation primitives, endpoint builder          │
├─────────────────────────────────────────────────────────────────┤
│  Types / schemas  src/schemas.ts (Zod) + src/types.ts           │
│  ── payloads + parsed responses (Zod), config + DTOs (TS)       │
├─────────────────────────────────────────────────────────────────┤
│  Foundations      src/errors.ts, src/constants.ts, src/utils.ts │
└─────────────────────────────────────────────────────────────────┘
```

Two access paths exist for every endpoint: flat (`client.getProject(id)`) and namespaced (`client.projects.getProject(id)`). They are equivalent — the flat one is a one-line wrapper.

---

## 2. Core — `src/client-core.ts`

`TestRailClientCore` (`client-core.ts:180`) owns every cross-cutting concern. It is not exported from the public barrel; consumers see only its subclass, `TestRailClient`.

### 2.1 Public surface (consumed by modules)

| Method | Purpose |
| --- | --- |
| `request<T>()` (`:617`) | JSON pipeline (GET / POST / PUT / DELETE) |
| `requestText()` (`:773`) | Plain-text endpoint (currently only `get_bdd`) |
| `requestMultipart<T>()` (`:868`) | Attachment uploads — never retried |
| `requestBinary()` (`:956`) | Attachment downloads |
| `requestParsed<T>()` (`:1073`) | `request` + Zod parse, separate cache namespace |
| `parse<T>()` (`:1040`) | Standalone Zod parse with `handleZodError` wrapping |
| `validateId()` / `validateEntryId()` / `validatePaginationParams()` (`:444+`) | Pre-flight integer guards |
| `buildEndpoint()` (`:483`) | TestRail-specific URL composer (`&` not `?` for params) |
| `clearCache()` (`:538`) / `destroy()` (`:583`) | Cache / lifecycle |

These are declared `public` (not `protected`) because modules consume them by composition, not inheritance — see §3.

### 2.2 HTTP pipeline (`request<T>()`)

For a single call, the operations run in this fixed order:

1. **Destroyed guard** — throws plain `Error` if `destroy()` was called.
2. **DNS revalidation** — fresh `dns.lookup` of the configured hostname, fail-closed. Re-run per request to defeat DNS rebinding (`:1024`).
3. **Cache lookup** — GET only, key `GET:{endpoint}`. LRU touch on hit (delete + re-insert at end of `Map`).
4. **Rate-limit check** — sliding window over `rateLimiter.requests: number[]`; throws synthetic `TestRailApiError(429, …)` *before* fetch when full.
5. **URL + headers** — `{baseUrl}/index.php?/api/v2/{endpoint}`, Basic auth header, User-Agent.
6. **`AbortController` + `setTimeout`** — per-call timeout via abort signal.
7. **`fetch` with `redirect: 'manual'`** — all four fetch sites use manual redirect handling.
8. **`assertNotRedirect`** (`:398`) — any 3xx → `TestRailApiError` with the blocked `Location` embedded in `response`. Never retried, thrown before any cache write, so the LRU cannot be poisoned with a redirected payload.
9. **Error branch** — non-2xx: read body, decide retry (see §2.4), throw `TestRailApiError(status, statusText, errorText)`. Raw body lands in the structured `response` field only — never in `message` — because callers commonly log `.message` and bodies may contain stack traces or secrets.
10. **Cache invalidation on writes** — any non-GET calls `clearCache()` *before* parsing the body, so empty 204-style responses still invalidate.
11. **Body parse** — `response.text()` → empty-body shortcut → `JSON.parse`.
12. **Cache write** — GET only, with TTL.

Catch handlers convert `AbortError` to `TestRailApiError(408, …)` (never retried) and `TypeError` (network error) to a retryable failure for GET only.

### 2.3 LRU cache

- Insertion-ordered `Map<string, { data, expiry }>`.
- Two key namespaces: `GET:{endpoint}` for `request<T>()` and `PARSED:GET:{endpoint}` for `requestParsed<T>()`. Separation prevents (a) returning a raw cached value to a Zod-validated caller and (b) returning a Zod-stripped value to a raw caller (`:1074`).
- Touch on hit (LRU semantics on a plain `Map`).
- Eviction at `maxCacheSize`: oldest key dropped.
- Background `setInterval` cleanup; `unref?.()` so the timer does not hold the event loop open.
- `requestText` and `requestBinary` neither read nor write the cache. Non-GET text/multipart calls still invalidate, to keep the JSON cache consistent.

### 2.4 Retry policy (the GET / write asymmetry)

| Failure | GET | POST / PUT / DELETE |
| --- | --- | --- |
| 429 (rate limit) | retry | retry |
| 5xx | retry | **surface immediately** |
| Network `TypeError` | retry | **surface immediately** |
| `AbortError` (timeout) | never | never |

Rationale: a `TypeError` from `fetch` may fire after request bytes are already on the wire (e.g. `ECONNRESET` post-send). Retrying a write risks duplicate server-side processing. 429s remain safe because they are rejected pre-flight by the rate limiter, before any byte leaves the process. 5xx is explicitly *not* safe — server state is ambiguous (`:740`).

`requestMultipart` (uploads) never retries — uploads are non-idempotent and bandwidth-expensive. `requestBinary` retries 5xx / 429 / network errors for its single GET method.

Backoff: `min(BASE_RETRY_DELAY_MS × 2^n, MAX_RETRY_DELAY_MS)` — currently `min(1000 × 2^n, 10000)` ms. `Retry-After` (numeric or HTTP-date) is honored, capped to `MAX_RETRY_DELAY_MS` to defend against a malicious server pinning the client with a huge value.

### 2.5 SSRF guard — two layers

1. **Synchronous** in `validateConfig` (`:273`): regex against `PRIVATE_HOST_PATTERNS` — loopback, RFC1918, link-local, IPv6 ULA/link-local, `0.0.0.0/8`.
2. **Per-request DNS pin** via `awaitDnsValidation` → `validatePublicHost` (`:98`): fresh `dns.lookup({ all: true })` before every request; each address checked with `isPrivateOrLoopbackIP` (handles IPv4-mapped IPv6 `::ffff:…`). Lookup errors are fail-closed.

Plus: HTTPS-only unless `allowInsecure: true` (cleartext Basic auth concern), and redirect blocking (§2.2 step 8) closes the loophole where a `Location` header pointing at a private/metadata IP would bypass both DNS and config validation.

### 2.6 Lifecycle

- Module-level `activeClients: Set<TestRailClientCore>` (`:147`). Constructor adds `this`.
- Process signal handlers (`exit`, `SIGINT`, `SIGTERM`) registered lazily, once per process, behind a `processHandlersRegistered` guard. SIGINT exits 130, SIGTERM exits 143.
- `destroy()` is idempotent: sets `isDestroyed`, stops the cleanup timer, clears the cache, zeroes `auth`, removes `this` from `activeClients`. Subsequent `request*` calls throw a plain `Error` (not `TestRailApiError`) — calling a destroyed client is a programmer error, not a network failure.

---

## 3. Domain modules — `src/modules/*.ts`

Eighteen stateless namespaces, one per TestRail resource:

| Module | Domain |
| --- | --- |
| `projects.ts` | Projects |
| `suites.ts` | Test suites |
| `sections.ts` | Sections (+ move) |
| `cases.ts` | Cases (CRUD, bulk update / copy / move, soft-delete, history) |
| `plans.ts` | Plans + plan entries + runs within entries |
| `runs.ts` | Runs (CRUD, close, soft-delete) |
| `tests.ts` | Tests inside runs (read-only) |
| `results.ts` | Results (per-test, per-case, batch) |
| `milestones.ts` | Milestones |
| `users.ts` | Users + groups |
| `metadata.ts` | Statuses, priorities, case/result fields, case types, templates |
| `configurations.ts` | Configuration groups + configurations |
| `attachments.ts` | Upload / list / download / delete (binary I/O) |
| `bdd.ts` | BDD scenarios (text response — uses `requestText`) |
| `sharedSteps.ts` | Shared steps (+ history) |
| `variables.ts` | Project variables |
| `datasets.ts` | Datasets |
| `reports.ts` | Reports (list + trigger) |

### 3.1 Composition pattern

Modules do **not** extend `TestRailClientCore`. Each holds an injected reference:

```ts
constructor(private readonly client: TestRailClientCore) {}
```

…and calls `this.client.validateId(...)`, `this.client.requestParsed<T>(...)`, `this.client.buildEndpoint(...)`, etc. (See `modules/cases.ts:30`, `modules/runs.ts:7`, `modules/attachments.ts:6`.) The typed parameter is `TestRailClientCore`, but at runtime each module receives the full `TestRailClient` subclass — `this` is downcast to the base type by the constructor signature.

This is **composition by dependency injection on top of inheritance**: the facade inherits the core, then injects itself (typed as core) into each module. Modules carry no per-module state, only a back-reference.

### 3.2 Facade — `src/client.ts`

`TestRailClient` (`client.ts:114`):

1. `extends TestRailClientCore` — inherits the whole HTTP pipeline.
2. Declares each module as `public readonly` field (`:116-133`).
3. Constructs them in the body: `super(args); this.projects = new ProjectModule(this); …` (`:135`).
4. Exposes hand-written wrappers for every endpoint, each forwarding to the module:

```ts
async getProject(projectId: number): Promise<Project> {
    return this.projects.getProject(projectId);
}
```

The wrappers exist so callers do not have to remember which module owns which endpoint, and so the public method-completion surface mirrors the resource taxonomy of the TestRail REST API. No `Object.assign`, no `Proxy`, no prototype mixing — explicit delegation is what keeps `client.ts` at 1517 lines, and it is intentional: each wrapper carries its own JSDoc and types.

---

## 4. Type system — `schemas.ts` + `types.ts`

| Concern | Lives in | Source of truth? |
| --- | --- | --- |
| Write payloads (`AddCasePayload`, `UpdateRunPayload`, …) | `schemas.ts` (Zod) | yes |
| Parsed response shapes (when validated via `requestParsed`) | `schemas.ts` (Zod) | yes |
| Hand-written response interfaces (`Case`, `Run`, `Project`, …) | `types.ts` | yes (consumed by `client.ts`) |
| `TestRailConfig`, `RateLimiterConfig` | `types.ts` | yes |
| `Get*Options` DTOs (`GetCasesOptions`, `GetPlansOptions`, …) | `types.ts` | yes |
| Payloads not yet migrated to Zod (`AddUserPayload`, `AddVariablePayload`, …) | `types.ts` | yes |

Convention: **payloads → `schemas.ts`; responses → `types.ts`**, even though Zod can infer response shapes too. There is intentional duplication on response shapes: `client.ts` imports response types from `./types.js` while payload types come from `./schemas.js`. The split keeps Zod usage focused on the validation boundary (writes in, parsed responses out) rather than letting it own every type in the codebase.

`schemas.ts:3` defines `zObject = z.object(shape).passthrough()` — every payload schema accepts unknown keys, so TestRail's `custom_*` fields and forward-compatible additions flow through without breaking validation.

---

## 5. Public barrel — `src/index.ts`

Exported:
- `TestRailClient` (the facade) — and only the facade.
- Errors: `TestRailApiError`, `TestRailValidationError`, `handleZodError`.
- Every Zod schema **value** (so consumers can re-validate).
- Every payload **type** (`AddCasePayload`, `UpdateRunPayload`, …).
- Every response / option **type** from `types.ts`.
- Three module-local option types: `DeleteCasesOptions`, `DeleteCasesPreview`, `GetHistoryForCaseOptions`, `GetSharedStepHistoryOptions`.

Deliberately not exported:
- `TestRailClientCore` — internal base class.
- Individual `XxxModule` classes — accessed via `client.projects`, `client.runs`, …
- `constants.ts`, `utils.ts` — implementation detail.
- CLI symbols — separate `./cli` subpath export.

---

## 6. CLI — `src/cli/`

Twin distribution: `bin: testrail` installs a binary, and `./cli` subpath export lets dependents `import` the entrypoint.

### 6.1 Entrypoint chain

```
package.json:bin
  → dist/cli.js  (shebang + import)
    → src/cli.ts                  one-line re-export
      → src/cli/index.ts:main()
        → parseArgs (Node util, strict:false + allowPositionals)
        → KNOWN_FLAGS gate         rejects --typoed-flag
        → --version | --help | install-skill short-circuits
        → readBoundedStdin (if --api-key-stdin)
        → resolveAuth (flags override env)
        → build HandlerArgs + BodyInput (BodyInput.readStdin is a thunk)
        → dispatch(resource, action)
        → new TestRailClient(config)
        → await handler(ctx)
        → client.destroy() in finally
```

`src/cli.ts` exists purely so the `./cli` subpath export resolves while the actual code lives one directory deeper.

### 6.2 Dispatch — `src/cli/dispatch.ts`

`HANDLERS: Record<'resource:action', Handler>` is a flat object literal, 60 entries (`dispatch.ts:63`). `RESOURCES` is derived from the keys via an IIFE bucketing on `:`. `dispatch(resource, action)` returns a tagged union (`{ ok: true, handler } | { ok: false, error }`) with three distinct error messages: unknown resource, unknown action, no handler registered.

### 6.3 Metadata — `src/cli/metadata.ts`

`ACTIONS: readonly ActionSpec[]` (`metadata.ts:81`) is a flat, declarative array parallel to `HANDLERS`. Each `ActionSpec` carries:

- `resource`, `action`, `summary`.
- `pathParams: readonly PathParam[]` — `{ name, description }` tuples.
- `bodySchema?` — Zod schema for `--data` / `--data-file` / stdin payloads. Absent for reads, no-body POSTs (`run close`), and file-input actions.
- `fileInput?` / `fileOutput?` — binary I/O flags (`--file <path>` / `--out <path>`).
- `outputKind?: 'binary' | 'text'` — encoding hint.
- `isWrite: boolean`, `destructive?: boolean` — affects dry-run applicability and `--yes` gating.

Consumers:
1. The skill generator (`scripts/generate-skill.js`) renders the command table and payload-schema section in `skill/SKILL.md`.
2. Drift tests assert metadata ↔ dispatch correspondence in both directions.
3. `getActionSpec(resource, action)` is called by `index.ts` to decide whether to suppress the stdin body thunk for file-input actions.

HELP text is hand-maintained in `src/cli/index.ts:23-137`, not generated.

### 6.4 Handler conventions — `src/cli/handlers/`

Every handler matches `Handler = (ctx: HandlerContext) => Promise<void>`. `HandlerContext` bundles `client`, `args`, `bodyInput`, `dryRun`, `force`, `confirmDestructive`, `out`.

Three shapes:

**Read handler** (e.g. `handlers/project.ts`):
1. `parseId(ctx.args.pathParams[N], 'name')` — throws `IdParseError` on non-positive integers.
2. Optional `optInt(ctx.args.limit)` for pagination.
3. `ctx.out(await ctx.client.method(...))`.

**Write handler** (e.g. `handlers/case-write.ts`):
1. `parseId` for path params.
2. `resolveBody(ctx.bodyInput, SchemaName)` — picks exactly one of `--data` / `--data-file` / stdin, JSON-parses, Zod-validates.
3. If `ctx.dryRun`: emit `{ dryRun: true, action, ...ids, payload, source }` and return *before* any client call.
4. Otherwise call the client and `ctx.out(result)`.

**Destructive handler** (e.g. `attachment-write.ts`, `project-write.ts`):
1. `parseId` + incompatible-flag rejection (e.g. `project delete` refuses `--soft`).
2. `if (dryRun)` preview branch — runs first, regardless of other flags.
3. `if (!confirmDestructive)` → throw `Destructive action; pass --yes to confirm.`.
4. Execute. `--soft` branch (where supported) passes `{ soft: true }` to the client; non-soft branch emits `{ deleted: true }`.

Attachment uploads share a `setupUpload()` helper that calls `resolveFile()` with `read: !ctx.dryRun` — dry-run does a stat-only check so large files are never loaded into memory just to be discarded.

### 6.5 Cross-cutting CLI infrastructure

| File | Role |
| --- | --- |
| `auth.ts` | `resolveAuth(flags, env)` — flag overrides env; returns tagged union. |
| `output.ts` | `createOutput({quiet, format})` → `{ out, err }`. JSON via `safeJsonStringify` (handles circular refs), table via `renderTable` (padded). Every cell goes through `sanitizeForTerminal`. |
| `flags.ts` | `CLI_OPTIONS` (parseArgs table) + `KNOWN_FLAGS` (Set). Single source of truth — tests lock it against drift. |
| `ids.ts` | `parseId` / `optInt` with consistent error shapes. |
| `body.ts` | `resolveBody` — picks exactly one source from `--data` / `--data-file` / stdin; Zod-validates. |
| `stdin.ts` | `readBoundedStdin(maxBytes)` — `readSync` in chunks with a hard cap; rejects multi-GB payloads. |
| `file-input.ts` | `resolveFile` — stats `--file`, rejects non-regular files, reads bytes only when `read: true`. |
| `file-output.ts` | `resolveOut` — uses `lstatSync` (not `existsSync`) so symlinks cannot bypass overwrite protection. |
| `sanitize.ts` | `sanitizeForTerminal` — strips C0 / DEL / C1 control bytes; blocks ANSI / OSC injection. |
| `safe-write.ts` | `O_CREAT \| O_EXCL` (`wx` flag) by default; re-`lstat` before write under `--force` to close the TOCTOU window. |
| `handler-context.ts` | Type definitions for `HandlerArgs`, `BodyInput`, `HandlerContext`, `Handler`. `BodyInput.readStdin` is a thunk. |
| `install-skill.ts` | `install-skill` meta-command — copies `skill/SKILL.md` into `./.claude/skills/testrail-cli/` (or `~/…` with `--global`). Bypasses dispatch entirely. |

### 6.6 `--dry-run`, `--yes`, `--soft` semantics

- **`--dry-run` is client-side.** Every write / destructive handler checks `if (ctx.dryRun)` *before* the `--yes` gate and *before* any client call. No HTTP request leaves the process. File-input handlers pass `read: !ctx.dryRun` so even disk reads are skipped on dry-run.
- **`--yes` gates destructive ops.** Every handler whose metadata sets `destructive: true` throws `Destructive action; pass --yes to confirm.` when `!ctx.confirmDestructive`.
- **`--soft` is server-side.** Only on `case delete`, `case delete-bulk`, `run delete`, `section delete`, `suite delete`. The handler *does* hit the API — TestRail returns affected-entity counts without performing the deletion (`soft=1` query param). Explicitly rejected on `project delete`.
- **Dry-run wins.** The `if (ctx.dryRun)` branch returns before either `--yes` or `--soft` matter. Dry-run output for soft-capable deletes still records `soft` in the preview JSON for audit, but makes zero network calls.

---

## 7. Errors

| Class | Thrown for | Carries |
| --- | --- | --- |
| `TestRailApiError` | HTTP non-2xx, network error, rate limit, timeout (408), invalid JSON, blocked redirect | `status`, `statusText`, `response` |
| `TestRailValidationError` | Bad config (baseUrl / email / apiKey), invalid ID, invalid params, Zod failure via `handleZodError` | — |
| `Error` (plain) | Call after `destroy()` | — |

The split is intentional: `TestRailApiError` represents anything the *server* (or network) said; `TestRailValidationError` represents anything the *caller* got wrong. Plain `Error` for destroyed-client signals a programmer mistake, not a recoverable condition.

---

## 8. Testing — `tests/`

Vitest + V8 coverage. 538 cases, 98%+ coverage. Highlights:

| File | Covers |
| --- | --- |
| `client-endpoints.test.ts` | All API methods, CRUD paths |
| `client-features.test.ts` | Cache, rate limiter, retry, lifecycle |
| `client-edge-cases.test.ts` | Signal handlers, error paths, redirect blocking, SSRF guard |
| `cli.test.ts` | CLI as subprocess — dispatch, auth, rendering, exit codes |
| `cli-helpers.test.ts` | Pure helpers: `parseId`, `optInt`, `resolveAuth`, `renderTable`, `safeJsonStringify`, `sanitizeForTerminal`, dispatch |
| `cli-write-handlers.test.ts` | Write-handler unit shape: happy / dry-run / body-reject / path-param-reject |
| `cli-attachment-handlers.test.ts` | Binary I/O paths + `--yes` gating + dry-run-wins-over-soft |
| `payload-schemas.test.ts` | Zod write-payload schemas: parse / reject / `custom_*` passthrough |
| `exports.test.ts` | Public API stability, inheritance contract |
| `performance.test.ts` | Concurrent request throughput |

Subprocess-based CLI tests are deliberate — they verify the real entrypoint, argv parsing, exit codes, and stdout/stderr framing end-to-end, not a mocked surface.

---

## 9. Generated artifacts

| Artifact | Generator | Drift guard |
| --- | --- | --- |
| `CODEMAP.md` | `scripts/generate-codemap.js` (TS Compiler API; deterministic JSON-in-Markdown) | `npm run codemap:check` (pretest + CI) |
| `skill/SKILL.md` | `scripts/generate-skill.js` (consumes `ACTIONS` from `src/cli/metadata.ts`) | `npm run skill:check` (git diff exit code) |

Both are committed. Both are verified in `pretest` / `prepublishOnly`. Drift fails the build.

---

## 10. Invariants worth preserving

Each of these closes a real failure mode and exists because the obvious alternative had a bug:

1. **Public — not protected — core methods.** Modules are composed (constructor-injected), not subclassed. Hiding `request` behind `protected` would force the inheritance pattern we deliberately rejected.
2. **Separate `GET:` and `PARSED:GET:` cache namespaces.** Prevents validated and unvalidated values for the same endpoint from cross-contaminating callers.
3. **Cache invalidation precedes body read on writes.** A 204-style empty response still wipes stale GET entries.
4. **Per-request DNS pin.** Stops DNS rebinding from converting a public-looking baseUrl into a metadata-service request mid-session.
5. **`redirect: 'manual'` on every fetch site.** Closes the SSRF hole where a 3xx `Location` to a private IP would bypass `validateBaseUrl` and DNS pinning.
6. **GET-only retry of 5xx and network errors.** Prevents duplicate writes on `ECONNRESET`-after-send. Rate-limited writes (429) are still retried because they are rejected pre-flight.
7. **`Retry-After` capped to `MAX_RETRY_DELAY_MS`.** A malicious server cannot freeze the client.
8. **Raw error bodies in the structured field only, never in `message`.** Bodies may contain stack traces or secrets; `.message` flows to loggers.
9. **`requestText` bypasses the JSON cache.** A shared key with `request<T>()` would collide if both ever hit the same path.
10. **Dry-run checked before `--yes` and before any disk read.** No surprise side effects from a flag intended to preview.
11. **`safe-write` re-`lstat` under `--force`.** Closes the network-round-trip TOCTOU window on attachment downloads.
12. **`KNOWN_FLAGS` gate.** `parseArgs` with `strict: false` accepts anything; the gate catches typos like `--dryrun` that would otherwise silently skip the dry-run branch.

---

## 11. Conventions in one place

- **No runtime dependencies** beyond Zod. Adding one requires deliberate justification.
- **No `any`.** Use `unknown` + narrowing.
- **No mutation.** Return new objects.
- **No hardcoded numbers.** Everything lives in `src/constants.ts`.
- **ID validation before every API call.** `this.client.validateId(id, 'name')` is non-negotiable.
- **One module per resource.** When adding endpoints, extend the existing module — do not create per-endpoint files.
- **Add to `metadata.ts` + `dispatch.ts` together.** Drift tests will fail otherwise.
- **`npm run codemap` + `npm run skill` after any public-surface change.** Both are committed; both are CI-checked.
