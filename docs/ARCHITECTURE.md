# Architecture

`@dichovsky/testrail-api-client` — type-safe TypeScript client for the TestRail API. One runtime dependency: Zod. ESM only (`type: "module"`). Ships both a programmatic library and a `testrail` CLI binary.

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
│  ── extends core; composes 19 domain modules                    │
│  ── namespaced modules are the endpoint access path             │
├─────────────────────────────────────────────────────────────────┤
│  Domain modules   src/modules/*.ts         19 namespaces        │
│  ── stateless; one per TestRail resource                        │
│  ── constructor-injected reference to the core                  │
├─────────────────────────────────────────────────────────────────┤
│  Core             src/client-core.ts       TestRailClientCore   │
│  ── request orchestration, rate limit, retry, timeout, SSRF     │
│  ── lifecycle, validation primitives, endpoint builder          │
├─────────────────────────────────────────────────────────────────┤
│  Types / schemas  src/schemas/*.ts (Zod) + src/types.ts         │
│  ── schema-derived responses, payloads, config + DTOs           │
├─────────────────────────────────────────────────────────────────┤
│  Foundations      request-cache, errors, pagination, validation │
└─────────────────────────────────────────────────────────────────┘
```

Every endpoint is reached through its domain module: `client.projects.getProject(id)`, `client.runs.addRun(projectId, payload)`, `client.results.addResultForCase(runId, caseId, payload)`. The 19 module fields are the single access path; there is no flat facade. (Removed in v5.0.0 — see CHANGELOG for the migration map.) The count is guarded by `tests/exports.test.ts`.

---

## 2. Core — `src/client-core.ts`

`TestRailClientCore` (in `client-core.ts`) coordinates cross-cutting request behavior. The internal `RequestCache` module owns cache storage, coalescing, invalidation, and cleanup behind one intent-level interface. Neither is exported from the public barrel; consumers see only the `TestRailClient` subclass.

The sliding-window limiter remains in the core deliberately: admission is a small, cohesive step immediately before each fetch attempt and shares retry/upstream-request accounting. Extracting its current two operations would create a shallow pass-through interface; it should move only if the limiter gains an independently testable admission policy.

### 2.1 Public surface (consumed by modules)

| Method                             | Purpose                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `request<T>(spec: RequestSpec<T>)` | The single HTTP entry point (GET/POST/PUT/DELETE; JSON, text, or binary responses; optional Zod validation; multipart uploads) |
| `parse<T>()`                       | Advisory Zod check: on a mismatch returns the raw body and notifies `onSchemaMismatch` (6.0.0; never throws on its own)        |
| `clearCache()` / `destroy()`       | Cache / lifecycle                                                                                                              |

These are declared `public` (not `protected`) because modules consume them by composition, not inheritance — see §3.

Pre-flight ID guards live in the pure `src/validation.ts` leaf module. TestRail-specific query construction lives in the pure `src/url.ts` leaf module.

`request<T>(spec)` (PR-E) replaced the historical `request` / `requestText` / `requestMultipart` / `requestBinary` / `requestParsed` quintet. One `RequestSpec<T>` (in `src/http-pipeline-types.ts`) carries `method`, `endpoint`, an optional `body` (`json` or `multipart`), an optional response `schema`, `responseKind` (`'json' | 'text' | 'binary'`, default `'json'`), and a `retry` policy name (default `'full'`; binary GETs use `'binaryGet'`, uploads use `'none'`). Internal `bypassCache` omits the cache key for all-page snapshots; `remainingTimeMs` clips both request phases to the aggregate deadline; `cacheVariant: 'page'` selects the strict page namespace. `request()` derives the key and supplies `RequestCache.resolve()` with a loader and a cacheability disposition. A schema-valid ordinary GET caches under `PARSED:GET:{endpoint}`, while an explicit page projection caches under `PAGE:PARSED:GET:{endpoint}`. This prevents a collection-only wrapper accepted by a legacy one-response method from poisoning the stricter page contract. A schema-invalid GET returns the raw body with `cacheable: false`, so the next call re-fetches and re-reports the mismatch. A GET without a schema caches the raw body under `GET:{endpoint}`, while non-GET calls omit the key and invalidate on success. The loader builds a cache-free `PipelineSpec` and runs it through `executePipeline()`.

### 2.2 HTTP pipeline (`request<T>()`)

For a single call, the operations run in this fixed order:

1. **Destroyed/spec guard** — throws plain `Error` after `destroy()` and validates internal timeout/deadline controls.
2. **`RequestCache.resolve()`** — a keyed JSON GET may return a cloned LRU hit or join ordinary in-flight work. A miss starts one loader under the current invalidation generation; all-page, text, binary, and write calls have no key.
3. **DNS revalidation for upstream work** — fresh `dns.lookup` of the configured hostname, fail-closed. It runs before each actual upstream fetch attempt, including retries; cache hits and in-flight joiners stop before DNS resolution.
4. **URL + headers** — `{baseUrl}/index.php?/api/v2/{endpoint}`, Basic auth header, User-Agent.
5. **`AbortController` + `setTimeout`** — per-call timeout via abort signal.
6. **Body preparation** — JSON serialization or multipart construction completes before admission.
7. **Rate-limit admission** — sliding window over `rateLimiter.requests: number[]`; throws synthetic `TestRailApiError(429, …)` immediately before fetch when full.
8. **`fetch` with `redirect: 'manual'`** — the single pipeline fetch site uses manual redirect handling for every request shape.
9. **`assertNotRedirect`** — any 3xx → `TestRailApiError` with the blocked `Location` embedded in `response`. Never retried and never reaches cache publication.
10. **Error branch** — non-2xx: read body, decide retry (see §2.4), throw `TestRailApiError(status, statusText, errorText)`. Raw body lands in the structured `response` field only — never in `message` — because callers commonly log `.message` and bodies may contain stack traces or secrets.
11. **Cache invalidation on writes** — any successful non-GET calls `clearCache()` _before_ parsing the body, so empty 204-style responses still invalidate stored and in-flight reads.
12. **Body read + parse** — `readBodyWithLimits()` enforces byte/deadline guards, then the JSON path applies the empty-body shortcut, `JSON.parse`, and optional advisory schema parsing.
13. **Conditional publication** — `RequestCache` clones and stores only cacheable loader results whose invalidation generation is still current.

Catch handlers convert `AbortError` to `TestRailApiError(408, …)` (never retried) and `TypeError` (network error) to a retryable failure for GET only.

### 2.3 Request cache

- `RequestCache.resolve()` is the only operational interface; its implementation hides the entry map, pending map, and invalidation generation.
- Insertion-ordered `Map<string, { data, expiry }>` with structured cloning on write and read.
- Three key namespaces: `GET:{endpoint}` for a GET without a schema, `PARSED:GET:{endpoint}` for ordinary schema-validated GETs, and `PAGE:PARSED:GET:{endpoint}` for strict page projections. Separation prevents raw/validated crossover and keeps collection-only legacy wrappers out of the page cache.
- Touch on hit (LRU semantics on a plain `Map`).
- Eviction at `maxCacheSize`: oldest key dropped.
- Background `setInterval` cleanup; `unref?.()` so the timer does not hold the event loop open. `cacheCleanupInterval` accepts integer `0..2_147_483_647` (`0` disables cleanup); the ceiling prevents Node from overflowing a larger delay into a 1 ms hot loop.
- In-flight requests coalesce even when storage is disabled. Deadline-bearing initiators are not published for later unbounded callers; bounded waiters may race an ordinary shared request without cancelling it.
- `invalidate()` clears entries and shared work and advances a generation, so a request started before a write may finish for its initiator but cannot repopulate stale data.
- Text and binary GETs (`responseKind: 'text' | 'binary'`) neither read nor write the cache. Non-GET calls still invalidate, to keep the JSON cache consistent.
- Bounded `getAll*()` reads set `bypassCache`: they neither consume nor populate the LRU and do not coalesce with another pending GET. A `get*Page()` call uses normal cache behavior in the separate strict-page namespace.

### 2.4 Retry policy (the GET / write asymmetry)

| Failure                | GET   | POST / PUT / DELETE     |
| ---------------------- | ----- | ----------------------- |
| 429 (rate limit)       | retry | retry                   |
| 5xx                    | retry | **surface immediately** |
| Network `TypeError`    | retry | **surface immediately** |
| `AbortError` (timeout) | never | never                   |

Rationale: a `TypeError` from `fetch` may fire after request bytes are already on the wire (e.g. `ECONNRESET` post-send). Retrying a write risks duplicate server-side processing. 429s remain safe because they are rejected pre-flight by the rate limiter, before any byte leaves the process. 5xx is explicitly _not_ safe — server state is ambiguous.

Retry behaviour is selected by the spec's `retry` policy name (`src/retry-policy.ts`). Multipart uploads (`retry: 'none'`) never retry — uploads are non-idempotent and bandwidth-expensive. A `5xx` mid-stream can leave the server with the attachment already persisted; retrying would duplicate the record. Binary GETs (`retry: 'binaryGet'`) retry 5xx / 429 / network errors for their single GET method.

**Streaming upload bodies.** A multipart `request<T>(spec)` (`body.kind === 'multipart'`) accepts either an in-memory variant (`Blob`, `Uint8Array`, `File`) or a `{ path: string; type?: string }` descriptor. The descriptor is resolved via `node:fs.openAsBlob`, which returns a file-backed `Blob` whose `.stream()` reads bytes on demand. `fetch` consumes the multipart `FormData` through that stream, so a 100 MB attachment grows process heap by ~0 MB instead of fully buffering. The CLI (`testrail attachment add-to-* --file …`, `testrail bdd add --file …`) always passes the descriptor; programmatic callers that already hold the bytes in memory may continue to pass them directly. File-open errors (ENOENT, EACCES, EISDIR, …) surface as `TestRailApiError(0, 'Network error: …')` — the open is performed inside the same try/catch that wraps `fetch`, so the error path is symmetric with a transport failure.

Backoff: `min(BASE_RETRY_DELAY_MS × 2^n, MAX_RETRY_DELAY_MS)` — currently `min(1000 × 2^n, 10000)` ms. `Retry-After` (numeric or HTTP-date) is honored, capped to `MAX_RETRY_DELAY_MS` to defend against a malicious server pinning the client with a huge value.

### 2.5 SSRF guard — two layers

1. **Synchronous** in `validateTestRailConfig`: regex against the private-host patterns — loopback, RFC1918, link-local, IPv6 ULA/link-local, `0.0.0.0/8`.
2. **Per-upstream-fetch DNS validation** via `awaitDnsValidation` → `validatePublicHost`: fresh `dns.lookup({ all: true })` before each actual fetch attempt, including retries; each address checked with `isPrivateOrLoopbackIP` (handles IPv4-mapped IPv6 `::ffff:…`). Cache hits and in-flight joiners do not repeat the lookup. Resolution errors are fail-closed.

Plus: HTTPS-only unless `allowInsecure: true` (cleartext Basic auth concern), and redirect blocking (§2.2 step 8) closes the loophole where a `Location` header pointing at a private/metadata IP would bypass both DNS and config validation.

### 2.6 Lifecycle

- Module-level `activeClients: Set<TestRailClientCore>`. Constructor adds `this`.
- Process signal handlers (`exit`, `SIGINT`, `SIGTERM`) are **opt-in** via `registerProcessHandlers: true` on `TestRailConfig` (default `false`, SEC #8). When opted in, they are registered lazily — once per process — behind a `processHandlersRegistered` guard. SIGINT exits 130, SIGTERM exits 143. Library consumers (servers, daemons, embedders) leave the flag off so the host owns the signal chain and the exit code; the bundled CLI opts in. Once installed for a process, handlers persist for its lifetime — safely deregistering would require ownership tracking across every client in the process.
- `destroy()` is idempotent: sets `isDestroyed`, disposes `RequestCache` (timer plus stored/in-flight state), zeroes `auth`, and removes `this` from `activeClients`. Subsequent `request()` calls throw a plain `Error` (not `TestRailApiError`) — calling a destroyed client is a programmer error, not a network failure.

---

## 3. Domain modules — `src/modules/*.ts`

There are 19 stateless namespaces, one per TestRail resource:

| Module              | Domain                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| `projects.ts`       | Projects                                                                    |
| `suites.ts`         | Test suites                                                                 |
| `sections.ts`       | Sections (+ move)                                                           |
| `cases.ts`          | Cases (CRUD, bulk update / copy / move, soft-delete, history)               |
| `plans.ts`          | Plans + plan entries + runs within entries                                  |
| `runs.ts`           | Runs (CRUD, close, soft-delete)                                             |
| `tests.ts`          | Tests inside runs (read-only)                                               |
| `results.ts`        | Results (per-test, per-case, batch)                                         |
| `milestones.ts`     | Milestones                                                                  |
| `users.ts`          | Users + groups                                                              |
| `metadata.ts`       | Statuses, priorities, case/result fields, case types, templates             |
| `configurations.ts` | Configuration groups + configurations                                       |
| `attachments.ts`    | Upload / list / download / delete (binary I/O)                              |
| `bdd.ts`            | BDD scenarios (text response — `request(spec)` with `responseKind: 'text'`) |
| `labels.ts`         | Labels + case/test label assignment                                         |
| `sharedSteps.ts`    | Shared steps (+ history)                                                    |
| `variables.ts`      | Project variables                                                           |
| `datasets.ts`       | Datasets                                                                    |
| `reports.ts`        | Reports (list + trigger)                                                    |

### 3.1 Composition pattern

Modules do **not** extend `TestRailClientCore`. Each holds an injected reference:

```ts
constructor(private readonly client: TestRailClientCore) {}
```

…and calls `this.client.request<T>({ …, schema })` after using pure helpers such as `validateId(...)` and `buildEndpoint(...)` from the leaf modules. Response validation therefore stays on the unified request path. The typed constructor parameter is `TestRailClientCore`, but at runtime each module receives the full `TestRailClient` subclass — `this` is downcast to the base type by the constructor signature.

This is **composition by dependency injection on top of inheritance**: the facade inherits the core, then injects itself (typed as core) into each module. Modules carry no per-module state, only a back-reference.

### 3.2 Composition root — `src/client.ts`

`TestRailClient`:

1. `extends TestRailClientCore` — inherits the whole HTTP pipeline.
2. Declares each module as a `public readonly` field.
3. Calls `super(...args)`, creates one shared binding map, and assigns every declared field from it.

That is the whole class — module composition only, no flat wrappers. Endpoints are reached through the module fields:

```ts
const project = await client.projects.getProject(1);
const run = await client.runs.addRun(projectId, payload);
```

Construction assigns the shared `createModuleBindings()` result explicitly; timeout views reuse that binding map through `Object.assign`. No `Proxy` or prototype mixing is used. The modules hold their own methods, JSDoc, and types, and the client is a thin composition root over `TestRailClientCore`. Method completion is scoped per resource (`client.runs.`), mirroring the resource taxonomy of the TestRail REST API.

> The flat facade (`client.getProject(id)`, …) that mirrored every endpoint directly on the client was removed in v5.0.0 (ARCH #7). The namespaced module surface is the single access path; see CHANGELOG for the flat→namespaced migration map.

### 3.3 Pagination projections

The machine-readable `pagination` entry on an endpoint in
`docs/testrail-endpoints.json`, mirrored by its CLI `ActionSpec`, opts that
endpoint into a three-method contract:

- Existing `get*()` methods issue one request and return that response's `T[]`.
- `get*Page()` issues one request and returns `Page<T>`, preserving a complete
  envelope's `offset`, `limit`, `size`, and `_links`; a legacy bare array is
  represented as `kind: 'legacy-array'`.
- `getAll*()` calls `collectAllPages()` and returns one bounded concatenated
  array. It never returns partial items.

Each participating domain module declares a typed descriptor beside its public
methods. Its `prepare()` adapter synchronously validates IDs and filters and
returns `{ operation, pathParameters, query }`. The shared
`createPaginatedListExecutor()` rejects an operation not declared by the
descriptor, clones/freezes the prepared values, constructs the endpoint path,
prebuilds list/page schemas once, and owns projection, strict-page cache
selection, aggregate bypass/deadline propagation, continuation controls,
decoding, and collection. Adapters read only declared filter fields. Aggregate
helpers copy only `pageSize`, `startOffset`, and safety bounds—or only safety
bounds for response-driven endpoints—without enumerating wider option objects,
so injected `limit`/`offset` and unrelated getters are inert. Public methods
remain explicit and pass the active client per call so `withTimeout()` views
keep their semantics.

`_links.next` alone determines continuation. `parsePaginationContinuation()`
extracts a canonical offset and optional limit, discards the supplied host/path,
and lets the shared executor rebuild a descriptor-declared operation with the
validated path parameters and original filters. A bare array has no trustworthy
continuation and is terminal.
Aggregate defaults are 250/page, offset 0, 100 pages, 25,000 items, 300,000 ms,
and 100 MiB of UTF-8 serialized items. Hard ceilings are 250/page, 300,000 ms,
and 1 GiB. Bound, structure, and progress failures use
`TestRailPaginationError` reasons `max_pages`, `max_items`, `max_duration`,
`max_bytes`, `invalid_page`, `invalid_continuation`, and `non_progress`.

The 24 registered endpoints are cases/history and project BDDs; projects,
suites, sections, plans, runs, tests, milestones; three result lists; labels;
shared steps/history; case/run/plan attachments; datasets, variables, roles,
groups, and case statuses. The count, collection keys, response shapes, and 18/6
request-control split are derived from `docs/testrail-endpoints.json` and checked
against all typed descriptor registrations by
`tests/pagination-descriptor-inventory.test.ts`.
Shared-step history, datasets, variables, roles, groups, and case statuses are
response-driven and declare `requestControls: false`. Test attachments,
plan-entry attachments, users, and ordinary metadata/configuration/report lists
remain outside this contract.

---

## 4. Type system — `schemas/*.ts` + `types.ts`

| Concern                                                      | Lives in                         | Source of truth?                       |
| ------------------------------------------------------------ | -------------------------------- | -------------------------------------- |
| Write payloads (`AddCasePayload`, `UpdateRunPayload`, …)     | `schemas/*.ts` (Zod)             | yes                                    |
| Parsed response shapes and declared public keys              | `schemas/*.ts` (Zod)             | yes                                    |
| Public response aliases and custom-field access              | `types.ts`                       | derived from schemas                   |
| `TestRailConfig`, `RateLimiterConfig`                        | `types.ts` + `schemas/common.ts` | compile-time type + runtime validation |
| `Get*Options` DTOs (`GetCasesOptions`, `GetPlansOptions`, …) | `types.ts`                       | yes                                    |

Convention: **payload and response field shapes → `schemas/*.ts`; config/options and schema-derived aliases → `types.ts`**. The domain files are re-exported through the `src/schemas.ts` barrel. Payload types are inferred from Zod so CLI validation and the programmatic API cannot drift. Response aliases use `KnownResponse` to infer only declared schema keys: runtime objects stay passthrough, but the public type does not acquire an unrestricted string index signature.

`TestRailConfigSchema` is the runtime structural/numeric authority for client
configuration. Its shape uses a `satisfies` constraint against every
`TestRailConfig` key, while `validateTestRailConfig()` adds URL security
semantics and translates schema failures to the stable
`TestRailValidationError` interface. Both paths share
`TESTRAIL_CONFIG_EMAIL_PATTERN`; `cacheCleanupInterval` is bounded to integer
`0..MAX_NODE_TIMER_DELAY_MS` so Node cannot turn an overflowing timer into a
1 ms loop. `PaginationRequestSchema` validates single-request `limit`/`offset`
controls; the ambiguous `PaginationSchema` name is retained as a deprecated,
permissive compatibility schema rather than silently tightening an exported
runtime validator.

`schemas/common.ts` defines `zObject = z.object(shape).passthrough()` — runtime response and payload parsing preserves forward-compatible additions. Flat response custom fields are modeled only on `Case`, `Test`, and `Result` with a template-literal `custom_*` index returning `unknown`; callers must narrow bracket-accessed values. Their nested `custom_fields` member is deprecated but retained. Stable 6.0 fields include `Test.refs_data`/`case_title`, `Result.case_title`/`case_refs`, `CaseField.is_indexed`/`is_system`, `ResultField.is_system`, writable `AddCaseFieldPayload.is_indexed`, and recursive `Milestone.milestones`.

---

## 5. Public barrel — `src/index.ts`

Exported:

- `TestRailClient` (the facade) — and only the facade.
- Errors: `TestRailApiError`, `TestRailValidationError`, `TestRailPaginationError`, `handleZodError`.
- Pagination types, safety options, defaults, and hard byte bound.
- Every Zod schema **value** (so consumers can re-validate).
- Every payload **type** (`AddCasePayload`, `UpdateRunPayload`, …).
- Every response / option **type** from `types.ts`.
- Module-local page/all option types for registered endpoints.

Deliberately not exported:

- `TestRailClientCore` — internal base class.
- Individual `XxxModule` classes — accessed via `client.projects`, `client.runs`, …
- Non-exported constants and low-level continuation/collector internals.
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
        → --version | --help short-circuits
        → install-skill | uninstall-skill validates its own allowed flags,
          then short-circuits before API dispatch
        → dispatch(resource, action) returns its ActionSpec
        → resolveActionInvocation rejects known-but-irrelevant or missing
          required flags and projects catalogued handler/pagination inputs
        → pagination + destructive env gates + path-param count check
        → readBoundedStdin (if --api-key-stdin)
        → resolveAuth (flags override env)
        → build BodyInput (BodyInput.readStdin is a thunk)
        → new TestRailClient(config)
        → await handler(ctx)
        → client.destroy() in finally
```

`src/cli.ts` exists purely so the `./cli` subpath export resolves while the actual code lives one directory deeper.

### 6.2 Dispatch — `src/cli/dispatch.ts`

`ACTION_SPECS: Record<'resource:action', ActionSpec>` is **derived from `ACTIONS`** at module load: each `ActionSpec` carries its handler and invocation capabilities, so there is no parallel dispatch registry. `RESOURCES` is bucketed from the same array. Adding an action is one metadata change, and the compiler enforces that every spec has a handler. `dispatch(resource, action)` returns a tagged union (`{ ok: true, spec, handler } | { ok: false, error }`) with distinct errors for unknown resource versus unknown action; downstream gates consume the same resolved spec.

### 6.3 Metadata — `src/cli/metadata.ts`

`ACTIONS: readonly ActionSpec[]` is the **single source of truth** (PR-C). It is composed in `src/cli/metadata.ts` from the per-resource modules in `src/cli/metadata/{resource}.ts`. Each `ActionSpec` carries:

- `resource`, `action`, `summary`.
- `handler` — the `Handler` function dispatched for this `resource:action`. `dispatch.ts` builds its `HANDLERS` map by iterating `ACTIONS`, so a spec without a handler is a TypeScript error, not a runtime drift bug.
- `flags?` — action-specific flag spellings plus requiredness. The type is derived from the primitive flag catalog; capability metadata still admits shared pagination/body/file/write flags without repeating them on every action.
- `apiEndpoint` — the TestRail endpoint (`'METHOD path'`); the API-mapping generator binds it to the linked module method's `@testrail` tag.
- `pathParams: readonly PathParam[]` — `{ name, description }` tuples.
- `bodySchema?` — Zod schema for `--data` / `--data-file` / stdin payloads. Absent for reads, no-body POSTs (`run close`), and file-input actions.
- `pagination?` — response shape, caller-control support, and collection key. Must match the endpoint inventory exactly (mapping gate E).
- `fileInput?` / `fileOutput?` — binary I/O flags (`--file <path>` / `--out <path>`).
- `outputKind?: 'binary' | 'text'` — encoding hint.
- `isWrite: boolean`, `destructive?: boolean` — affects dry-run applicability and `--yes` gating.
- `softMode?: 'optional' | 'reject'` — server-preview applicability; omission defaults to rejection. Help and pre-auth execution checks derive from the same fact.

Consumers:

1. `dispatch.ts` derives both `HANDLERS` and `RESOURCES` from `ACTIONS`.
2. `src/cli/help.ts` generates the action catalog from `ACTIONS`, grouping actions into sections by predicate (read / metadata / write / configuration / attachment / BDD). Its option reference comes from the typed `CLI_OPTION_DOCUMENTATION` registry in `src/cli/flags.ts`; only the non-option trailing guidance (binary stdio, meta, auth, and safety semantics) is hand-written.
3. The skill generator (`scripts/generate-skill.ts`) renders the command table and payload-schema sections from `ACTIONS`, and renders the complete CLI option reference from `CLI_OPTION_DOCUMENTATION`.
4. The API-mapping generator validates `apiEndpoint` against the `@testrail` tags (gate C), reverse-indexes every `apiEndpoint` to confirm each `@testrail`-tagged client method is claimed by at least one `ActionSpec` (gate D), and checks pagination metadata bidirectionally (gate E).
5. `resolveActionInvocation()` combines `flags` with capabilities derived from pagination/body/file/write/destructive metadata, rejects supplied known-but-irrelevant flags and missing required values before auth, and projects only catalogued handler/pagination inputs. The same seam validates meta-command applicability before install/uninstall can mutate disk.

### 6.4 Handler conventions — `src/cli/handlers/`

Every handler matches `Handler = (ctx: HandlerContext) => Promise<void>`. `HandlerContext` bundles the resolved `actionSpec`, `client`, action-only `args`, separately validated `pagination`, `bodyInput`, `dryRun`, `force`, `confirmDestructive`, and output functions.

Three shapes:

**Read handler** (e.g. `handlers/project.ts`):

1. `parseId(ctx.args.pathParams[N], 'name')` — throws `IdParseError` on non-positive integers.
2. Optional legacy `limit`/`offset` values come from the validated `ctx.pagination` projection; pagination controls are not duplicated in `HandlerArgs`.
3. For registered list actions, call `outputPaginated()` with item/page/all operations; the all operation obtains bounded controls from `getPaginatedRequestOptions()` or `getPaginationSafetyOptions()`.
4. Other reads call `ctx.out(await ctx.client.method(...))` directly.

List handlers intentionally remain typed per-domain adapters: action metadata owns flag applicability and prerequisites, but does not dynamically route SDK method names. The shared pagination/output seams own policy; explicit closures preserve compiler checking of each module's item/page/all signatures. A future consolidation should use typed factories or closures, never string-key client dispatch.

**Write handler** — built by the `createWriteHandler(spec)` factory (`src/cli/write-handler-factory.ts`, PR-D). Each `*-write.ts` file is now a small spec rather than a hand-rolled function; the shared skeleton (parse path params, resolve+validate body, branch on `--dry-run`, call the client, emit) lives in the factory once:

1. Parse path params via `parseId` (declared in the spec's `pathParams`).
2. `resolveBody(ctx.bodyInput, spec.bodySchema)` — picks exactly one of `--data` / `--data-file` / stdin, JSON-parses, Zod-validates (`allowEmptyBody` resolves an absent body to `{}` for PATCH-style updates).
3. If `ctx.dryRun`: emit `{ dryRun: true, action, ...ids, payload, source }` and return _before_ any client call.
4. Otherwise call `spec.call(client, ids, body, entry)` and emit (`spec.formatOutput` shapes void-endpoint acks).

**Destructive handler** — built by the `createDestructiveHandler(spec)` factory. Before the handler runs, the CLI entry point (`src/cli/index.ts` → `checkDestructiveEnvGate`) verifies `TESTRAIL_ALLOW_DESTRUCTIVE=1` (skipped under `--dry-run`); failure exits with code 2 and the handler is never reached. The factory then:

1. Parses path params and computes `soft` from `ctx.actionSpec.softMode` + `--soft`; handler-factory specs do not repeat that policy.
2. `if (dryRun)` preview branch — runs first, regardless of other flags.
3. Rejects `--soft` when `softMode === 'reject'` (normally already rejected by `resolveActionInvocation()` before auth).
4. `if (!confirmDestructive)` → throw `Destructive action; pass --yes to confirm.`.
5. Execute. `softMode === 'optional'` passes `{ soft }` and reports the preview vs. `{ deleted: true }`; `kind === 'close'` emits the returned entity.

Genuinely irregular handlers stay hand-written: `case delete-bulk` (body + `--project-id` + soft), attachment uploads, `attachment delete` (integer-or-UUID ID), and `group add`. Attachment uploads share a `setupUpload()` helper that calls `resolveFile()` with `read: !ctx.dryRun`: filesystem uploads stream through a validated file descriptor, stdin uploads are bounded in memory, and dry-run does not drain stdin.

### 6.5 Cross-cutting CLI infrastructure

| File                     | Role                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`                | `resolveAuth(flags, env)` — flag overrides env; returns tagged union.                                                                                                                    |
| `output.ts`              | `createOutput({quiet, format})` → `{ out, err }`. JSON via `safeJsonStringify` (handles circular refs), table via `renderTable` (padded). Every cell goes through `sanitizeForTerminal`. |
| `flags.ts`               | Primitive flag catalog; derives parse options, known spellings, capability groups, and typed handler/pagination projections.                                                             |
| `action-invocation.ts`   | Compiles accepted/required flags from metadata capabilities, preserves precise stdio/pagination diagnostics, and rejects invalid action/meta invocations before auth or mutation.        |
| `ids.ts`                 | `parseId` / `optInt` with consistent error shapes.                                                                                                                                       |
| `pagination.ts`          | CLI mode/conflict validation, bounded-control parsing, and item/page/all output dispatch.                                                                                                |
| `response-validation.ts` | Resolves strict-response flag/env policy and builds the bounded privacy-safe advisory mismatch reporter.                                                                                 |
| `body.ts`                | `resolveBody` — picks exactly one source from `--data` / `--data-file` / stdin; Zod-validates.                                                                                           |
| `stdin.ts`               | `readBoundedStdin(maxBytes)` — `readSync` in chunks with a hard cap; rejects multi-GB payloads.                                                                                          |
| `file-input.ts`          | `resolveFile` — opens `--file` with `O_NOFOLLOW`, rejects non-regular files, preserves an fd for streamed uploads, and bounds `--file -` stdin reads.                                    |
| `file-output.ts`         | `resolveOut` — uses `lstatSync` (not `existsSync`) so symlinks cannot bypass overwrite protection.                                                                                       |
| `sanitize.ts`            | `sanitizeForTerminal` — strips C0 / DEL / C1 control bytes; blocks ANSI / OSC injection.                                                                                                 |
| `safe-write.ts`          | `O_CREAT \| O_EXCL` (`wx` flag) by default; re-`lstat` before write under `--force` to close the TOCTOU window.                                                                          |
| `handler-context.ts`     | Type definitions for `HandlerArgs`, `BodyInput`, `HandlerContext`, `Handler`. `BodyInput.readStdin` is a thunk.                                                                          |
| `install-skill.ts`       | `install-skill` meta-command — copies `skill/SKILL.md` into `./.claude/skills/testrail-cli/` (or `~/…` with `--global`). Bypasses dispatch entirely.                                     |
| `uninstall-skill.ts`     | `uninstall-skill` meta-command — removes a previously installed Claude Code skill without touching unrelated agent configuration.                                                        |

Pagination validation runs before auth resolution and client construction.
Default mode emits the existing item array; `--page` emits `Page<T>` and
`--all` emits the bounded aggregate. `--page` and `--all` are mutually
exclusive. `--all` rejects `--limit`/`--offset`; `--page-size`,
`--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and
`--max-bytes` require `--all`. Endpoints with `requestControls: false` allow
aggregate safety bounds but reject caller-supplied page size/start offset (and
reject limit/offset in page mode).

CLI entity-field mismatch reporting is advisory by default. Its synchronous
hook emits only the HTTP method, already validated resource/action, normalized
issue codes, and path depth with every segment masked; it never prints the
endpoint, field/record keys, issue message, or response data. Fingerprints are deduplicated and capped so a
multi-page aggregate cannot flood stderr: at most 10 unique warnings are
printed, followed by a safe suppressed-count summary. `--strict-responses` or
`TESTRAIL_STRICT_RESPONSES=1` converts the first read mismatch to
`handleZodError(error)` and a successful mutating-response mismatch to an
indeterminate-outcome `TestRailApiError`; `0`, empty, and unset select advisory
mode, while other environment values fail before auth/network work. Boolean flag
value forms are rejected. `--quiet` suppresses advisory warnings. A strict
bounded aggregate emits no partial array; a streaming watch can retain completed
events emitted before a later mismatch.

### 6.6 `--dry-run`, `--yes`, `--soft`, `TESTRAIL_ALLOW_DESTRUCTIVE` semantics

Destructive CLI actions clear a **two-gate model** before reaching the API:

1. **`TESTRAIL_ALLOW_DESTRUCTIVE=1` env var** — process-wide, dispatch-level gate (`src/cli/dispatch.ts:checkDestructiveEnvGate`). Strict equality to the literal string `'1'`; no aliasing for `'true'` / `'yes'` / `'on'`. Failure exits with code **2** (distinct from the generic exit code 1). Runs **before** auth resolution and handler invocation, so a regression in any single handler cannot bypass it (defense-in-depth).
2. **`--yes` flag** — per-invocation, handler-level gate. Every handler whose metadata sets `destructive: true` throws `Destructive action; pass --yes to confirm.` when `!ctx.confirmDestructive`. Failure exits with code 1.

Both gates must clear. The env var is process-wide audit-friendly (visible in `printenv`); `--yes` is per-invocation explicit intent. Together they raise the bar for accidental destructive operations without making programmatic / library usage harder (the gate only applies to the CLI dispatcher).

- **`--dry-run` is client-side.** Every write / destructive handler checks `if (ctx.dryRun)` _before_ the `--yes` gate and _before_ any client call. No HTTP request leaves the process. File-input handlers pass `read: !ctx.dryRun`; filesystem inputs are opened and statted but not uploaded, while `--file -` stdin is not drained. **`--dry-run` bypasses the env-var gate too** — preview is non-destructive by definition, so CI agents can safely preview destructive commands without unlocking the env var.
- **`--soft` is server-side.** Only `case delete`, `case delete-bulk`, `run delete`, `section delete`, and `suite delete` declare `softMode: 'optional'`. The handler _does_ hit the API — TestRail returns affected-entity counts without performing the deletion (`soft=1` query param). It remains gated by both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`. Every other destructive action rejects a real `--soft` invocation before auth, including irreversible `run close` / `plan close`; `--dry-run --soft` remains a client-side preview with no API call.
- **Dry-run wins.** The `if (ctx.dryRun)` branch returns before `--yes` / `--soft` / env-var matter. Dry-run output for soft-capable deletes still records `soft` in the preview JSON for audit, but makes zero network calls.

---

## 7. Errors

| Class                     | Thrown for                                                                         | Carries                            |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP/network/protocol error, including malformed successful default-list structure | `status`, `statusText`, `response` |
| `TestRailPaginationError` | Invalid page/continuation, non-progress, or aggregate bound                        | reason + progress counters         |
| `TestRailValidationError` | Bad config or caller arguments                                                     | `details`                          |
| `Error` (plain)           | Call after `destroy()`                                                             | —                                  |

Entity-field Zod mismatches are advisory and use `onSchemaMismatch`. With a
non-throwing hook, outer list/page structure is a hard protocol invariant:
default list projections reject a missing/scalar collection with
`TestRailApiError`, while page/all projections use `TestRailPaginationError` for
partial metadata, malformed links, and unsafe continuations rather than silently
returning zero rows. A throwing hook propagates before those downstream decoders.
`TestRailPaginationError` extends `TestRailValidationError`, so subtype checks
come first. Plain `Error` for a destroyed client signals a programmer mistake.

---

## 8. Testing — `tests/`

Vitest + V8 coverage. Highlights (see the test suite and [CODEMAP.md](../CODEMAP.md) for the current inventory):

| File                              | Covers                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `client-endpoints.test.ts`        | All API methods, CRUD paths                                                                                           |
| `client-features.test.ts`         | Request-cache integration, rate limiter, retry, lifecycle                                                             |
| `request-cache.test.ts`           | Cache cloning, TTL/LRU, coalescing, invalidation generations, deadline sharing, disposal                              |
| `client-edge-cases.test.ts`       | Signal handlers, error paths, redirect blocking, SSRF guard                                                           |
| `cli.test.ts`                     | In-process CLI reimports — dispatch, auth, rendering, exit codes                                                      |
| `scripts/package-smoke.ts`        | Packed executable subprocess smoke tests, run as platform-specific CI jobs                                            |
| `cli-helpers.test.ts`             | Pure helpers: `parseId`, `optInt`, `resolveAuth`, `renderTable`, `safeJsonStringify`, `sanitizeForTerminal`, dispatch |
| `cli-write-handlers.test.ts`      | Write-handler unit shape: happy / dry-run / body-reject / path-param-reject                                           |
| `cli-attachment-handlers.test.ts` | Binary I/O paths + `--yes` gating + dry-run-wins-over-soft                                                            |
| `payload-schemas.test.ts`         | Zod write-payload schemas: parse / reject / `custom_*` passthrough                                                    |
| `pagination-core.test.ts`         | Page decoding, safe continuations, bounds, progress, deadlines, and cache bypass                                      |
| `cli-pagination.test.ts`          | CLI pagination mode conflicts and numeric control parsing                                                             |
| `exports.test.ts`                 | Public API stability, inheritance contract                                                                            |
| `performance.test.ts`             | Concurrent request throughput                                                                                         |

The in-process CLI suite keeps its large command matrix fast. `scripts/package-smoke.ts`, exercised by the platform CI jobs, separately verifies the packed executable, real entrypoint, argv parsing, and process-level stdout/stderr framing.

---

## 9. Generated artifacts

| Artifact                                                 | Generator                                                                                                     | Drift guard                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `CODEMAP.md`                                             | `scripts/generate-codemap.ts` (TS Compiler API; deterministic JSON-in-Markdown)                               | `npm run codemap:check` (pretest + CI)                      |
| `skill/SKILL.md`, `skill/reference/payload-schemas.yaml` | `scripts/generate-skill.ts` (consumes source `ACTIONS` and `CLI_OPTION_DOCUMENTATION` directly through `tsx`) | `npm run skill:check` (in-memory render/content comparison) |
| `docs/API-MAPPING.md`                                    | `scripts/generate-mapping.ts` (TS Compiler API + JSDoc walk; gates A/B/C/C2/D/E)                              | `npm run mapping:check` (pretest + CI)                      |
| `AGENTS.md`                                              | `npm run agents-md` (consumes `ACTIONS`)                                                                      | `npm run agents-md:check` (pretest + CI)                    |

All four artifacts are committed. Their drift guards run in `pretest` or the publish workflow. Drift fails the build.

---

## 10. Invariants worth preserving

Each of these closes a real failure mode and exists because the obvious alternative had a bug:

1. **Public — not protected — core methods.** Modules are composed (constructor-injected), not subclassed. Hiding `request` behind `protected` would force the inheritance pattern we deliberately rejected.
2. **Separate `GET:` and `PARSED:GET:` cache namespaces.** Prevents validated and unvalidated values for the same endpoint from cross-contaminating callers.
3. **Cache invalidation precedes body read on writes.** A 204-style empty response still wipes stale GET entries.
4. **Per-upstream-fetch DNS validation.** Stops DNS rebinding from converting a public-looking baseUrl into a metadata-service request mid-session without pretending cache hits or coalesced callers perform network work.
5. **`redirect: 'manual'` on the pipeline fetch.** The single `executePipeline` fetch handles every request shape; a 3xx `Location` to a private IP would otherwise bypass `validateBaseUrl` and DNS pinning.
6. **GET-only retry of 5xx and network errors.** Prevents duplicate writes on `ECONNRESET`-after-send. Rate-limited writes (429) are still retried because they are rejected pre-flight.
7. **`Retry-After` capped to `MAX_RETRY_DELAY_MS`.** A malicious server cannot freeze the client.
8. **Raw error bodies in the structured field only, never in `message`.** Bodies may contain stack traces or secrets; `.message` flows to loggers.
9. **Text and binary responses bypass the JSON cache.** A shared key with a JSON GET to the same path would collide; `responseKind: 'text' | 'binary'` never reads or writes the cache.
10. **Dry-run checked before `--yes` and before any disk read.** No surprise side effects from a flag intended to preview.
11. **`safe-write` re-`lstat` under `--force`.** Closes the network-round-trip TOCTOU window on attachment downloads.
12. **`KNOWN_FLAGS` gate.** `parseArgs` with `strict: false` accepts anything; the gate catches typos like `--dryrun` that would otherwise silently skip the dry-run branch.
13. **Continuation host/path is discarded.** Only canonical offset/limit controls survive; the shared executor rebuilds a descriptor-declared operation with validated path parameters and filters.
14. **All-page reads bypass the GET cache.** Aggregates must not combine independently cached pages into a false snapshot or populate the cache with a partial walk.

---

## 11. Conventions in one place

- **One runtime dependency: Zod.** Adding another requires deliberate justification.
- **No `any`.** Use `unknown` + narrowing.
- **No mutation.** Return new objects.
- **No hardcoded numbers.** Everything lives in `src/constants.ts`.
- **ID validation before every API call.** Import `validateId` from `../validation.js` and call `validateId(id, 'name')` (`validateEntryId` for plan-entry UUIDs).
- **One module per resource.** When adding endpoints, extend the existing module — do not create per-endpoint files.
- **Add CLI actions to `src/cli/metadata/{resource}.ts`.** `dispatch.ts`, help text, mapping, and skill generation derive from `ACTIONS`.
- **Regenerate affected artifacts after public-surface changes.** Use `npm run codemap`, `npm run mapping`, `npm run skill`, and `npm run agents-md` as applicable.
