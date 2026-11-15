# Architecture

`@dichovsky/testrail-api-client` is a type-safe TypeScript client for the
TestRail API. It has one runtime dependency: Zod. It uses ESM only
(`type: "module"`) and provides both a programmatic library and a `testrail` CLI
binary.

This document describes the code structure, the layer boundaries, and the
invariants that each layer enforces. See [CODEMAP.md](../CODEMAP.md) for a
per-symbol index. See [CLAUDE.md](../CLAUDE.md) for editing rules.

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

Callers reach every endpoint through its domain module. Examples include
`client.projects.getProject(id)`, `client.runs.addRun(projectId, payload)`, and
`client.results.addResultForCase(runId, caseId, payload)`. The 19 module fields
are the only access path. Version 5.0.0 removed the flat facade (see
`CHANGELOG.md` for the migration map). The test suite in `tests/exports.test.ts`
verifies the module count.

---

## 2. Core — `src/client-core.ts`

`TestRailClientCore` (in `src/client-core.ts`) coordinates request behavior
across all modules. The internal `RequestCache` module manages cache storage,
request coalescing, invalidation, and cleanup behind one interface. The public
barrel exports neither class. Consumers interact only with the `TestRailClient`
subclass.

The sliding-window rate limiter stays inside `TestRailClientCore` by design.
Rate-limit admission runs immediately before each `fetch` attempt and shares
retry and upstream-request counters. Moving its two operations into a separate
file would only add a pass-through wrapper. Extract the limiter only if it
gains an independent admission policy.

### 2.1 Public surface (consumed by modules)

| Method                             | Purpose                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `request<T>(spec: RequestSpec<T>)` | Single HTTP entry point for GET, POST, PUT, and DELETE (JSON, text, or binary responses; Zod checks; multipart uploads) |
| `parse<T>()`                       | Advisory Zod check: returns the raw body and calls `onSchemaMismatch` on mismatch (never throws on its own)             |
| `clearCache()` / `destroy()`       | Cache clearing and client disposal                                                                                      |

`TestRailClientCore` marks these methods `public` instead of `protected` because
domain modules call them through composition, not inheritance (see §3).

The pure leaf module `src/validation.ts` provides preflight ID checks. The pure
leaf module `src/url.ts` builds TestRail endpoint paths and query strings.

`request<T>(spec)` replaced the earlier `request`, `requestText`,
`requestMultipart`, `requestBinary`, and `requestParsed` methods. A `RequestSpec<T>` object in `src/http-pipeline-types.ts` specifies `method` and `endpoint`.
It also accepts an optional `body` (`json` or `multipart`), response `schema`, and `intent`.
`responseKind` accepts `'json' | 'text' | 'binary'` and defaults to `'json'`.

`RequestSpec` does not include a retry field. Instead, `deriveRetryPolicy()`
selects the retry policy from `body.kind`, `responseKind`, and `intent`. This
design prevents invalid combinations, such as a multipart POST retrying on HTTP 429. The `intent` field also controls caching: `'side-effecting-read'` marks a
GET that changes server state, and `'fresh-read'` marks a GET that bypasses the
cache.

`RequestSpec` also omits wall-clock timeout fields. Instead, `request()` creates
one `RequestBudget` (`src/request-budget.ts`) from the optional `deadlineAt`
value and passes it through every phase and retry. As a result, retries never
reset elapsed time. `RequestBudget` manages timeout clipping, promise racing,
retry delays, and `408` timeout errors.

Setting `cacheVariant: 'page'` selects the strict page cache namespace. First,
`request()` computes the cache key and passes a loader and cache policy to
`RequestCache.resolve()`. A valid standard GET caches under
`PARSED:GET:{endpoint}`, whereas an explicit page read caches under
`PAGE:PARSED:GET:{endpoint}`. This separation prevents a legacy list response
from polluting the stricter page cache. If a GET response fails schema validation, the loader returns the raw body with `cacheable: false`.
The next call fetches from the server and reports any mismatch again. A GET without
a schema caches under `GET:{endpoint}`. Non-GET calls omit the cache key and
clear the cache when they succeed. For cache misses, the loader creates a
`PipelineSpec` and calls `executePipeline()`.

### 2.2 HTTP pipeline (`request<T>()`)

Each request executes these steps in order:

1. **Destroyed and spec guard**: throws a plain `Error` if the client is
   destroyed and validates internal timeout and deadline parameters.
2. **`RequestCache.resolve()`**: returns a cloned LRU entry or joins an
   in-flight request for keyed JSON GET calls. On a cache miss, it starts one
   loader under the current invalidation generation. All-page, text, binary, and
   write calls do not use a cache key.
3. **URL and headers**: builds `{baseUrl}/index.php?/api/v2/{endpoint}`, sets
   the Basic `Authorization` header, and sets `User-Agent` to
   `testrail-api-client/<version>`. The client omits the npm scope because `@`
   and `/` are invalid in RFC 7230 §3.2.6 product tokens.
4. **`AbortController` and `setTimeout`**: creates a per-attempt abort signal.
   The timer starts **before** DNS resolution so `timeout` bounds the entire
   attempt.
5. **DNS revalidation**: runs `dns.lookup` for the configured hostname before each fetch attempt, including retries.
   It races the lookup against the abort signal from step 4. Cache hits and coalesced waiters return before
   this step. Because `dns.lookup` has no built-in timeout, starting the timer
   in step 4 ensures that a dropped DNS packet cannot block the caller
   indefinitely. Although the underlying libuv lookup cannot be cancelled, it
   cannot delay the caller past `timeout`.
6. **Body preparation**: serializes JSON or prepares the multipart body before
   rate-limit admission.
7. **Rate-limit admission**: checks the sliding window in
   `rateLimiter.requests: number[]`. If the window is full, the limiter throws a
   synthetic `TestRailApiError(429, …)` before calling `fetch`.
8. **`fetch` with `redirect: 'manual'`**: calls `fetch` with manual redirect
   handling for all request types. When private-host protection is active, the
   dispatcher connects directly to the validated DNS snapshot instead of
   resolving the hostname again.
9. **`assertNotRedirect`**: throws `TestRailApiError` on any 3xx status and
   stores the blocked `Location` header in `response`. The client never retries
   or caches a redirect.
10. **Error branch**: on a non-2xx status, reads the response body, checks the
    retry policy (see §2.4), and throws
    `TestRailApiError(status, statusText, errorText)`. The client stores the raw
    error body only in `error.response`, never in `error.message`, because error
    bodies can contain stack traces or secrets.
11. **Cache invalidation on writes**: calls `clearCache()` on any successful
    non-GET response _before_ parsing the body. Consequently, empty `204`
    responses still invalidate cached and in-flight GET entries.
12. **Body read and parse**: calls `readBodyWithLimits()` to drain the response
    stream iteratively within byte and deadline limits. For JSON responses, the
    pipeline then handles empty bodies, runs `JSON.parse`, and runs optional
    advisory schema validation.
13. **Conditional cache write**: clones and stores the result in `RequestCache`
    only if the response is cacheable and the invalidation generation has not
    changed.

Error handlers convert `AbortError` into `TestRailApiError(408, …)` (never
retried) and convert network `TypeError` failures into retryable errors for GET
requests only.

### 2.3 Request cache

- `RequestCache.resolve()` is the single public method on the cache. It
  encapsulates the entry map, the in-flight map, and the invalidation generation
  counter.
- The cache stores entries in an insertion-ordered `Map<string, { data, expiry }>`
  and calls `structuredClone` on both writes and reads.
- The cache uses three key prefixes: `GET:{endpoint}` for unvalidated GETs,
  `PARSED:GET:{endpoint}` for schema-validated GETs, and
  `PAGE:PARSED:GET:{endpoint}` for strict page reads.
- Reading an entry refreshes its position in the `Map` to provide LRU eviction.
- When the cache reaches `maxCacheSize`, it evicts the oldest key.
- A background `setInterval` timer removes expired entries and calls `unref?.()`
  so it does not keep the Node.js event loop open. `cacheCleanupInterval`
  accepts integers from `0` to `2_147_483_647` (`0` disables the timer), which
  prevents 32-bit timer overflow in Node.js.
- In-flight requests coalesce even when cache storage is disabled, provided
  their effective request and body timeouts match. `withTimeout()` views share
  completed cache entries without inheriting another caller's deadline. The
  cache does not publish deadline-bounded requests for unbounded callers, and
  bounded waiters can time out without cancelling a shared request.
- `invalidate()` clears stored entries, drops in-flight references, and
  increments the generation counter. A GET started before a write can still
  return to its original caller, but it cannot write stale data into the cache.
- Text and binary GETs (`responseKind: 'text' | 'binary'`) do not read or write
  the cache. All non-GET requests invalidate the cache on success.
- `getAll*()` calls set `intent: 'fresh-read'`, so they bypass the cache and do
  not coalesce with other in-flight GETs. `get*Page()` calls use the cache under
  the `PAGE:PARSED:GET:{endpoint}` namespace.

### 2.4 Retry policy (the GET / write asymmetry)

| Failure                | GET   | POST / PUT / DELETE     |
| ---------------------- | ----- | ----------------------- |
| 429 (rate limit)       | retry | retry                   |
| 5xx                    | retry | **surface immediately** |
| Network `TypeError`    | retry | **surface immediately** |
| `AbortError` (timeout) | never | never                   |

A `TypeError` from `fetch` can occur after the client has already sent the
request bytes over the socket (for example, `ECONNRESET`). Retrying a write
after a network error or a 5xx response can create duplicate records on the
server. In contrast, retrying a 429 response is safe because rate limiting
rejects the request before the server processes the write.

`deriveRetryPolicy()` (in `src/retry-policy.ts`) selects the retry behavior from
the request shape rather than a caller parameter. Multipart uploads never retry
because file uploads are non-idempotent and large. If a `5xx` error occurs
mid-upload, the server may have already saved the attachment. Deriving the
policy from `body.kind === 'multipart'` guarantees that every upload endpoint
disables retries automatically. Binary GET downloads retry on 5xx, 429, and
network errors.

Report generation endpoints are an exception to the GET retry rule. `runReport`
and `runCrossProjectReport` set `intent: 'side-effecting-read'`. Because these
GET endpoints generate a new report and can send emails, they bypass the cache
and never retry on 5xx or network errors. They still retry on 429 (honoring
`Retry-After`) because a rate-limited request has not generated a report yet.

**Streaming upload bodies.** A multipart `request<T>(spec)` call
(`body.kind === 'multipart'`) accepts either in-memory data (`Blob`,
`Uint8Array`, or `File`) or a `{ path: string; type?: string }` file descriptor.
For file descriptors, the client calls `node:fs.openAsBlob` to create a
file-backed `Blob` that streams bytes on demand. Consequently, uploading a
100 MB file does not buffer the entire file in heap memory. The CLI always
passes a file descriptor for `--file <path>`, while SDK callers can pass
in-memory bytes directly. File-open errors (`ENOENT`, `EACCES`, `EISDIR`) throw
`TestRailApiError(0, 'Network error: …')`.

The retry delay uses exponential backoff:
`min(BASE_RETRY_DELAY_MS × 2^n, MAX_RETRY_DELAY_MS)` (1,000 ms base, 10,000 ms
maximum). When a 429 response includes `Retry-After` (seconds or HTTP-date), the
client uses that delay up to `MAX_RETRY_DELAY_MS`.

### 2.5 SSRF guard — two layers

1. **Synchronous config check** (`validateTestRailConfig`):
   `isPrivateHostLiteral` rejects `localhost` and any IP literal that the shared
   `net.BlockList` marks as private. Blocked IPv4 ranges include loopback, RFC 1918 private addresses, RFC 6598 CGNAT (`100.64.0.0/10`), link-local, and `0.0.0.0/8`.
   They also include RFC 2544 benchmarking (`198.18.0.0/15`), multicast (`224.0.0.0/4`), and RFC 1112 reserved addresses (`240.0.0.0/4`, including `255.255.255.255`).
   Blocked IPv6 ranges include unspecified, loopback, ULA, link-local, site-local, and 6to4 addresses.
   NAT64 `64:ff9b::/96` and RFC 8215 local NAT64 `64:ff9b:1::/48` are also blocked.
2. **Per-fetch DNS check** (`awaitDnsValidation` → `validatePublicHost`): calls
   `dns.lookup({ all: true })` before each upstream fetch attempt and checks
   every returned address with `isPrivateOrLoopbackIP`. `BlockList.check()` also
   matches IPv4-mapped IPv6 addresses in both dotted (`::ffff:127.0.0.1`) and
   hex (`::ffff:7f00:1`) forms. Cache hits and coalesced requests skip this
   lookup. Any DNS resolution failure rejects the request.

The client requires `https://` unless `allowInsecure: true` is set.
It blocks all 3xx redirects (§2.2 step 9).
A `Location` header cannot redirect a request to a private IP address.

`src/pinned-dispatcher.ts` implements a custom dispatcher using Node.js `http`
and `https` modules. Its lookup function returns only the validated DNS snapshot
and never performs a second OS DNS lookup. It preserves the original hostname
for the `Host` header, TLS SNI, and certificate verification. Connection pools
key sockets by the validated address set so a later request cannot reuse a
socket connected to a different IP set. Native `fetch` still handles multipart
encoding, response decompression, and redirect detection.

The pinned dispatcher connects directly to the origin server. If you inject a
custom `fetch` function, that function must honor the supplied dispatcher or
enforce equivalent destination, abort, and redirect rules. Because the pinned
dispatcher bypasses Undici's global dispatcher, it ignores global `ProxyAgent`
or `EnvHttpProxyAgent` instances and `NODE_USE_ENV_PROXY=1` / `--use-env-proxy`.
To trust a custom certificate authority on direct connections, set
`NODE_EXTRA_CA_CERTS` when starting Node.js.

To use an HTTP proxy, inject a custom `fetch` adapter and configure the proxy
itself to block private destination IP addresses. Local DNS validation cannot
control how an external proxy resolves hostnames. See
[Proxies and custom certificate authorities](../README.md#proxies-and-custom-certificate-authorities)
for an example. Setting `allowPrivateHosts: true` disables DNS validation and
address pinning for trusted internal networks; do not use it as a proxy
workaround.

Custom `dnsLookup` functions must return `{ address, family }` objects where
`family` is `4` or `6` and matches the IP literal. Missing or mismatched
`family` values fail validation even for public IP addresses. See
[Custom DNS resolvers](../README.md#custom-dns-resolvers) for a complete
example.

### 2.6 Lifecycle

- The module tracks active instances in `activeClients: Set<TestRailClientCore>`.
  The constructor adds `this` to the set.
- Process signal handlers (`exit`, `SIGINT`, and `SIGTERM`) are opt-in via
  `registerProcessHandlers: true` on `TestRailConfig` (default `false`). When
  enabled, the client registers the handlers once per process. `SIGINT` exits
  with code 130, and `SIGTERM` exits with code 143. Library callers leave this
  option disabled so the host application controls process signals, whereas the
  CLI enables it.
- `destroy()` is idempotent. It sets `isDestroyed`, disposes `RequestCache`,
  clears credentials from memory, and removes `this` from `activeClients`.
  Calling `request()` after `destroy()` throws a plain `Error` instead of
  `TestRailApiError`.

`trackOperation(callback)` returns `{ result, settled }`. The `result` promise
settles with the callback return value or rejection. The `settled` promise never
rejects and resolves only after the callback and all child transport operations
finish. `src/operation-tracking.ts` uses Node.js `AsyncLocalStorage` to isolate
concurrent and nested calls. Every cache loader creates its own tracking scope,
and coalesced callers wait for that loader's settlement.

The first call to `trackOperation` enables `AsyncLocalStorage` tracking for the
rest of the process lifetime. On Node 24+, enabling `AsyncLocalStorage` activates
`AsyncContextFrame` across the process. Before the first `trackOperation` call,
`startOperation` returns a handle whose `settled` promise simply follows the
callback. Multipart uploads also enter an `AsyncLocalStorage` scope in
`src/upload-transport.ts` to correlate Node.js diagnostic events with the upload
attempt. If an operation is already in flight when `trackOperation` is called
for the first time, callers can join its result but not its post-result cleanup.

The client registers every async resource (DNS lookup, `fetch`, retry timer,
body stream read, and stream cancellation) before racing against a timeout. If a
timeout fires first, the resource promise stays tracked until the underlying I/O
settles or cancels.

`src/upload-source.ts` manages file-backed multipart uploads from start to
finish: path normalization, `openAsBlob`, `FormData` construction, stream
wrapping, and closing the file descriptor. Its `build()` method can run only once.
A second call throws an error.
Thus, a retry cannot reopen `file.path` after the original file descriptor closes. During upload cleanup, the pipeline aborts the transport.
The pinned dispatcher or `src/upload-transport.ts` must confirm that socket transmission has stopped before active stream wrappers close cleanly. For HTTP/1, cleanup destroys the socket only if it
still belongs to the aborted request. For HTTP/2, cleanup destroys only the
stream that matches the upload request and leaves the shared session open. Sometimes the client cannot confirm that transport has stopped, for example, when a custom `fetch` ignores abort.
In that case, cleanup puts the stream wrapper into an error state.
The multipart encoder then cannot emit a valid closing boundary after a truncated file.

Neither `trackOperation()` nor `destroy()` aborts in-flight requests. Callers
must return their workflow promise from the `trackOperation` callback.

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

Domain modules do **not** extend `TestRailClientCore`. Instead, each module
receives the core client in its constructor:

```ts
constructor(private readonly client: TestRailClientCore) {}
```

Each method validates its inputs with helpers from `src/validation.ts` and
`src/url.ts`, and then calls `this.client.request<T>({ …, schema })`. Although
the constructor parameter type is `TestRailClientCore`, `TestRailClient` passes
`this` at runtime. Modules store no state of their own.

### 3.2 Composition root — `src/client.ts`

`TestRailClient` performs three tasks:

1. Extends `TestRailClientCore` to inherit the HTTP pipeline.
2. Declares each of the 19 domain modules as a `public readonly` field.
3. Calls `super(...args)`, builds a shared module map with
   `createModuleBindings()`, and assigns each module field.

Callers invoke methods on the module namespaces:

```ts
const project = await client.projects.getProject(1);
const run = await client.runs.addRun(projectId, payload);
```

`withTimeout()` views reuse the same module binding map through `Object.assign`
without `Proxy` objects or prototype mutation.

In `src/modules/tests.ts`, `tests.getTest(id, { withData: '1' })` separates
advisory entity validation from outer wrapper normalization. The response
wrapper must contain a `test` object and array or nullish `results` and
`attachments` properties. Null or omitted collections normalize to `[]` even if
a field on `test` fails advisory schema validation. If the outer wrapper itself
is malformed, `getTest` throws `TestRailApiError` (unless a strict
`onSchemaMismatch` hook throws first).

> Version 5.0.0 removed the flat methods on `TestRailClient` (such as
> `client.getProject(id)`). Use the module namespaces instead. See
> `CHANGELOG.md` for the migration table.

### 3.3 Pagination projections

Endpoints that declare a `pagination` object in `docs/testrail-endpoints.json`
(mirrored in `src/cli/metadata/paginated-endpoints.ts`) provide three methods:

- `get*()` sends one request and returns `T[]`.
- `get*Page()` sends one request and returns `Page<T>`, which preserves
  `offset`, `limit`, `size`, and `_links` (or `kind: 'legacy-array'` for a bare
  array).
- `getAll*()` calls `collectAllPages()` and returns a single array of all items
  within the configured safety bounds. It never returns partial results.

Each paginated module defines a typed descriptor next to its public methods. The
descriptor's `prepare()` function validates IDs and filter options synchronously
and returns `{ operation, pathParameters, query }`.
`createPaginatedListExecutor()` verifies the operation name, clones and freezes
the prepared inputs, builds the endpoint path, prebuilds the list and page
schemas, and runs the request. Aggregate helpers copy only `pageSize`,
`startOffset`, and safety bounds (or only safety bounds when
`requestControls: false`), ignoring extra properties on the options object.

Only `_links.next` continues pagination. `parsePaginationContinuation()`
extracts the `offset` and optional `limit` query parameters from `_links.next`
and discards the URL host and path. The executor then rebuilds the request using
the validated path parameters and original filters. A bare array response stops
pagination immediately. Default aggregate bounds are 250 items per page, offset
0, 100 pages, 25,000 items, 300,000 ms, and 100 MiB of UTF-8 JSON. Hard ceilings
are 250 items per page, 300,000 ms, and 1 GiB. When a pagination check fails,
the client throws `TestRailPaginationError` with reason `max_pages`,
`max_items`, `max_duration`, `max_bytes`, `invalid_page`,
`invalid_continuation`, or `non_progress`.

The 24 registered endpoints include cases, case history, project BDDs, projects, suites, sections, plans, runs, tests, and milestones.
They also include three result lists, labels, shared steps, shared-step history, and case/run/plan attachments.
The remaining endpoints are datasets, variables, roles, groups, and case statuses. `tests/pagination-descriptor-inventory.test.ts`
verifies this list, the collection keys, the response shapes, and the 18/6
`requestControls` split against `docs/testrail-endpoints.json`. Shared-step
history, datasets, variables, roles, groups, and case statuses set
`requestControls: false`. Test attachments, plan-entry attachments, users, and
other metadata, configuration, and report lists do not use this pagination
contract.

---

## 4. Type system — `schemas/*.ts` + `types.ts`

| Concern                                                      | Lives in                         | Source of truth?                       |
| ------------------------------------------------------------ | -------------------------------- | -------------------------------------- |
| Write payloads (`AddCasePayload`, `UpdateRunPayload`, …)     | `schemas/*.ts` (Zod)             | yes                                    |
| Parsed response shapes and declared public keys              | `schemas/*.ts` (Zod)             | yes                                    |
| Public response aliases and custom-field access              | `types.ts`                       | derived from schemas                   |
| `TestRailConfig`, `RateLimiterConfig`                        | `types.ts` + `schemas/common.ts` | compile-time type + runtime validation |
| `Get*Options` DTOs (`GetCasesOptions`, `GetPlansOptions`, …) | `types.ts`                       | yes                                    |

Define payload and response schemas in `src/schemas/*.ts`, and define
configuration, query options, and schema-derived aliases in `src/types.ts`. The
barrel file `src/schemas.ts` re-exports all domain schemas. Payload types are
inferred from Zod schemas so CLI validation and SDK types stay synchronized.
Response aliases use `KnownResponse` to expose only declared schema keys in
TypeScript while keeping `.passthrough()` at runtime.

`TestRailConfigSchema` validates the structure and numeric ranges of client
options at runtime. It uses `satisfies` against `TestRailConfig`, while
`validateTestRailConfig()` checks URL security rules and throws
`TestRailValidationError`. Both checks use `TESTRAIL_CONFIG_EMAIL_PATTERN` and
bound `cacheCleanupInterval` to `0..MAX_NODE_TIMER_DELAY_MS`.
`PaginationRequestSchema` validates `limit` and `offset` request parameters,
while the older `PaginationSchema` alias remains for backward compatibility.

`src/schemas/common.ts` defines `zObject = z.object(shape).passthrough()` so
parsed objects retain unknown fields from newer TestRail versions. In
TypeScript, only `Case`, `Test`, and `Result` include a `custom_*`
template-literal index signature (typed as `unknown`). Their nested
`custom_fields` property remains deprecated. Response schemas also include
`Test.refs_data`, `Test.case_title`, `Result.case_title`, `Result.case_refs`,
`CaseField.is_indexed`, `CaseField.is_system`, `ResultField.is_system`, writable
`AddCaseFieldPayload.is_indexed`, and recursive `Milestone.milestones`.

---

## 5. Public barrel — `src/index.ts`

Exported symbols:

- `TestRailClient` (the facade class).
- Error classes and helpers: `TestRailApiError`, `TestRailValidationError`,
  `TestRailPaginationError`, and `handleZodError`.
- Pagination types, safety option types, default constants, and hard byte
  bounds.
- All Zod schema values (for runtime validation).
- All payload types (`AddCasePayload`, `UpdateRunPayload`, and others).
- All response and option types from `src/types.ts`.
- Module-specific `*Page` and `getAll*` option types.

Not exported from `src/index.ts`:

- `TestRailClientCore` (internal base class).
- Domain module classes (`ProjectsModule`, `RunsModule`, and others; access them
  through `client.projects`, `client.runs`, and so on).
- Internal constants and pagination collector helpers.
- CLI internals (exported separately under `./cli`).

---

## 6. CLI — `src/cli/`

`package.json` exposes the CLI in two ways: the `testrail` binary under `bin`
and the `./cli` subpath export.

### 6.1 Entrypoint chain

```
package.json:bin
  → dist/cli.js  (shebang + import)
    → src/cli.ts                  builds the CliRuntime, assigns process.exitCode
                                  (the only file in src/ that names the process streams)
      → src/cli/index.ts:runCli(runtime)   exported; a test calls it directly
        → parseCliArgv (Node parseArgs, strict:false + per-occurrence tokens)
        → KNOWN_FLAGS gate         rejects --typoed-flag
        → validateSuppliedFlagTypes rejects missing values, swallowed flags,
          and boolean flags with values
        → --version | --help short-circuits (a known leading resource
          scopes help to that resource; anything else prints the full listing)
        → install-skill | uninstall-skill validates its own allowed flags,
          then short-circuits before API dispatch
        → dispatch(resource, action) returns its ActionSpec
        → resolveActionInvocation rejects known-but-irrelevant or missing
          required flags and projects catalogued handler/pagination inputs
        → diagnostic platform + strict-response + destructive env gates
          + path-param count check (pagination was resolved with invocation)
        → readBoundedStdin (if --api-key-stdin)
        → resolveAuth (flags override env)
        → build BodyInput (BodyInput.readStdin is a thunk)
        → parse timeout
        → withDiagnostics(request, deps, work) — reserves (unless --dry-run),
          registers its exit listener, and owns everything below
            → new TestRailClient(config)
            → scope.markDispatched()   outcome is indeterminate past here
            → await handler(ctx)
            → client.destroy()         before the reservation is finalized
          on failure: report, write the record, rethrow the original error
          always: remove the exit listener, finish or remove the reservation
```

`src/cli.ts` is a thin wrapper for the `./cli` subpath export and delegates to
`src/cli/index.ts`.

Flag type validation inspects every token before `--help`, skill commands, or
API dispatch. A string flag cannot consume the next `--` token as its value:
both `--filename --dry-run` and `--filter --dry-run --filter abc` fail
validation. To pass a literal value that starts with `--`, use `--filter=--all`.
Negative numbers, `-`, and `--` remain valid.

### 6.2 Dispatch — `src/cli/dispatch.ts`

At module load, `src/cli/dispatch.ts` builds
`ACTION_SPECS: Record<'resource:action', ActionSpec>` and `RESOURCES` directly
from `ACTIONS`. Because each `ActionSpec` includes its `handler` function, there
is no separate handler lookup table. `dispatch(resource, action)` returns a
tagged union (`{ ok: true, spec, handler } | { ok: false, error }`) with
separate error messages for unknown resources and unknown actions.

### 6.3 Metadata — `src/cli/metadata.ts`

`ACTIONS: readonly ActionSpec[]` is the single source of truth for the CLI.
`src/cli/metadata.ts` combines the per-resource arrays from
`src/cli/metadata/{resource}.ts`. Each `ActionSpec` contains:

- `resource`, `action`, and `summary`.
- `handler`: the `Handler` function for `resource:action`.
- `flags?`: action-specific flags and whether each flag is required. Shared
  pagination, body, file, and write flags come from capability metadata.
- `apiEndpoint`: the TestRail route (`'METHOD path'`), which the mapping
  generator checks against the module method's `@testrail` JSDoc tag.
- `pathParams: readonly PathParam[]`: `{ name, description }` tuples.
- `bodySchema?`: Zod schema for `--data`, `--data-file`, or stdin JSON payloads.
- `fileInput?` and `fileOutput?`: binary I/O flags (`--file <path>` and
  `--out <path>`).
- `outputKind?: 'binary' | 'text'`: output encoding hint.
- `isWrite: boolean` and `destructive?: boolean`: controls `--dry-run` and
  `--yes` gates.
- `softMode?: 'optional' | 'reject'`: controls whether `--soft` is allowed
  (defaults to `'reject'`).

Pagination is not stored on `ActionSpec`. Instead, the CLI looks up
`apiEndpoint` in `src/cli/metadata/paginated-endpoints.ts`.

Five subsystems consume `ACTIONS`:

1. `src/cli/dispatch.ts` builds `ACTION_SPECS` and `RESOURCES` from `ACTIONS`.
2. `src/cli/help.ts` generates the global and per-resource `--help` output from
   `ACTIONS` and `CLI_OPTION_DOCUMENTATION` (in `src/cli/flags.ts`).
3. `scripts/generate-skill.ts` generates `skill/reference/commands.md`,
   `skill/reference/payload-schemas.yaml`, and the generated sections of
   `skill/SKILL.md`.
4. `scripts/generate-mapping.ts` checks `apiEndpoint` against `@testrail` tags
   (gate C) and verifies that every `@testrail` method has at least one
   `ActionSpec` (gate D).
5. `resolveActionInvocation()` checks allowed and required flags against the
   action metadata before authentication or disk writes.

### 6.4 Handler conventions — `src/cli/handlers/`

Every handler implements `Handler = (ctx: HandlerContext) => Promise<void>`.
`HandlerContext` provides `actionSpec`, `client`, `args`, `pagination`,
`bodyInput`, `dryRun`, `force`, `confirmDestructive`, and the output writers.

Handlers follow three patterns:

**Read handler** (for example, `src/cli/handlers/project.ts`):

1. Call `parseId(ctx.args.pathParams[N], 'name')`, which throws `IdParseError`
   if the value is not a positive integer.
2. Read optional `limit` and `offset` values from `ctx.pagination`.
3. For paginated list actions, call `outputPaginated()` with the item, page, and
   all-page callbacks.
4. For single-entity reads, call `ctx.out(await ctx.client.method(...))`.

List handlers use explicit per-module closures rather than dynamic method-name
lookup so TypeScript checks every method signature at compile time.

**Write handler** — created with `createWriteHandler(spec)` in
`src/cli/write-handler-factory.ts`:

1. Validate path parameters with `parseId`.
2. Call `resolveBody(ctx.bodyInput, spec.bodySchema)` to read `--data`,
   `--data-file`, or stdin, parse the JSON, and validate it with Zod
   (`allowEmptyBody` defaults an omitted body to `{}`).
3. If `ctx.dryRun` is `true`, output `{ dryRun: true, action, ...ids, payload, source }`
   and return before calling the client.
4. Call `spec.call(client, ids, body, entry)` and write the response.

**Destructive handler** — created with `createDestructiveHandler(spec)`. Before
invoking the handler, `checkDestructiveEnvGate` verifies
`TESTRAIL_ALLOW_DESTRUCTIVE=1` (unless `--dry-run` is set) and exits with code 2
if the variable is unset. Inside the handler:

1. Parse path parameters and resolve `soft` from `ctx.actionSpec.softMode` and
   `--soft`.
2. If `ctx.dryRun` is `true`, emit the dry-run preview and return immediately.
3. Reject `--soft` when `softMode === 'reject'`.
4. If `!ctx.confirmDestructive`, throw
   `Destructive action; pass --yes to confirm.`.
5. Call the client method and emit the result.

Irregular actions use custom handlers: `case delete-bulk`, attachment uploads,
`attachment delete`, and `group add`. Attachment upload handlers call
`setupUpload()`, which passes `read: !ctx.dryRun` to `resolveFile()`.

### 6.5 Cross-cutting CLI infrastructure

| File                     | Role                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`                | `resolveAuth(flags, env)`: CLI flags override environment variables; returns a tagged union.                                                                     |
| `output.ts`              | Controls all CLI output via `createOutput(...)` (`out`, `outRaw`, `outPayload`, `err`, `errRaw`), `safeJsonStringify`, `renderTable`, and `sanitizeForTerminal`. |
| `flags.ts`               | Primitive flag catalog, per-occurrence token validation, capability groups, and typed handler and pagination projections.                                        |
| `action-invocation.ts`   | Validates allowed and required flags for each action or skill command before authentication or file writes.                                                      |
| `ids.ts`                 | `parseId` and `optInt` integer parsers.                                                                                                                          |
| `pagination.ts`          | Validates CLI pagination flags and dispatches item, page, or all-page output.                                                                                    |
| `response-validation.ts` | Resolves `--strict-responses` / `TESTRAIL_STRICT_RESPONSES` and builds the privacy-safe mismatch warning hook.                                                   |
| `diagnostics.ts`         | Implements `withDiagnostics(request, deps, work)` to reserve, write, redact, and clean up `--diagnostic-file` records.                                           |
| `body.ts`                | `resolveBody`: selects `--data`, `--data-file`, or stdin and validates the payload with Zod.                                                                     |
| `stdin.ts`               | `readBoundedStdin(maxBytes)`: reads stdin in chunks up to a hard byte limit.                                                                                     |
| `file-input.ts`          | `resolveFile`: opens `--file` with `O_NONBLOCK` and `O_NOFOLLOW` where supported, verifies a regular file, and bounds `--file -` stdin reads.                    |
| `file-output.ts`         | `resolveOut`: checks target paths with `lstatSync` so symlinks cannot bypass overwrite checks.                                                                   |
| `sanitize.ts`            | `sanitizeForTerminal`: strips C0, DEL, and C1 control characters to prevent terminal escape injection.                                                           |
| `safe-write.ts`          | Writes output files with `O_CREAT \| O_EXCL` (`wx`) by default; with `--force`, validates an open file descriptor before truncating and writing it.              |
| `handler-context.ts`     | Defines `HandlerArgs`, `BodyInput`, `HandlerContext`, and `Handler`.                                                                                             |
| `install-skill.ts`       | `install-skill` command: stages `skill/SKILL.md` and `skill/reference/` before replacing `./.claude/skills/testrail-cli/` (or `~/…` with `--global`).            |
| `uninstall-skill.ts`     | `uninstall-skill` command: removes `SKILL.md` and bundled reference files while leaving user-added files untouched.                                              |

Pagination flag validation runs before authentication and client creation. By
default, list commands emit `T[]`. Passing `--page` emits `Page<T>`, and passing
`--all` emits the concatenated array across pages. `--page` and `--all` are
mutually exclusive. `--all` rejects `--limit` and `--offset`. The flags
`--page-size`, `--start-offset`, `--max-pages`, `--max-items`,
`--max-duration-ms`, and `--max-bytes` require `--all`. Endpoints with
`requestControls: false` reject `--page-size`, `--start-offset`, `--limit`, and
`--offset`.

By default, CLI response schema mismatches log a warning to `stderr`. Each warning prints only the HTTP method, resource and action name, Zod issue codes, and masked path depth.
It never prints URLs, field names, or response values.
The reporter deduplicates warnings by fingerprint and prints at most 10 unique
warnings, followed by a suppressed count. Passing `--strict-responses` or
setting `TESTRAIL_STRICT_RESPONSES=1` turns the first read mismatch into a
validation error and turns a write response mismatch into an
indeterminate-outcome `TestRailApiError`. Setting `TESTRAIL_STRICT_RESPONSES` to
`0` or empty keeps advisory mode, while any other value fails before
authentication. Passing `--quiet` suppresses advisory warnings.

Passing `--diagnostic-file <path>` writes a private JSON error record when a
command fails. Before constructing the client, `runCli` reserves a new regular
file with mode `0600` and rejects existing files, symlinks, or paths that match
`--out`. Windows rejects `--diagnostic-file` before reading stdin or
authenticating, and `--dry-run` skips file reservation. If the command succeeds,
the CLI removes the reserved file on exit.

A version-1 diagnostic record contains the error kind, HTTP status,
`operationOutcome` (`not_dispatched` before the handler starts, or
`failed_or_indeterminate` after), and redacted validation messages. It omits raw
bodies, headers, payloads, and stack traces, and caps the output file at 16 KiB.
See [Error handling](../README.md#error-handling) in `README.md` for details.

### 6.6 `--dry-run`, `--yes`, `--soft`, `TESTRAIL_ALLOW_DESTRUCTIVE` semantics

Destructive CLI commands require two separate gates before calling the API:

1. **`TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable**: checked in
   `src/cli/dispatch.ts:checkDestructiveEnvGate` before authentication. The
   value must equal `'1'` (`'true'`, `'yes'`, and `'on'` are rejected). If this
   check fails, the CLI exits with code **2**.
2. **`--yes` flag**: checked inside the handler. If `!ctx.confirmDestructive`,
   the handler throws `Destructive action; pass --yes to confirm.` and the CLI
   exits with code **1**.

Both gates apply only to the CLI, not to programmatic `TestRailClient` calls.

- **`--dry-run` is client-side.** Write and destructive handlers check
  `if (ctx.dryRun)` before checking `--yes` or calling the client. No network
  request is sent. `--dry-run` also bypasses the `TESTRAIL_ALLOW_DESTRUCTIVE=1`
  check so callers can preview destructive commands safely.
- **`--soft` is server-side.** Only `case delete`, `case delete-bulk`,
  `run delete`, `section delete`, and `suite delete` set `softMode: 'optional'`.
  When `--soft` is set without `--dry-run`, the CLI sends the API request with
  `soft=1` to return affected entity counts, and still requires `--yes` and
  `TESTRAIL_ALLOW_DESTRUCTIVE=1`. All other destructive commands reject `--soft`.
- **`--dry-run` takes precedence.** Combining `--dry-run` with `--yes` or
  `--soft` returns the local preview JSON without making a network call.

---

### 6.7 Output ownership

`src/cli/output.ts` formats all CLI output, and `src/cli.ts` is the only file in
`src/` allowed to reference `process.stdout` or `process.stderr`. ESLint's
`no-restricted-properties` rule blocks `process.stdout`, `process.stderr`, and
`process.argv` in all other source files. `createOutput` requires explicit
stream arguments, and `HandlerContext` passes the five writer functions to every
handler:

| Writer       | Stream | `--quiet` | Notes                                                        |
| ------------ | ------ | --------- | ------------------------------------------------------------ |
| `out`        | stdout | gated     | Formats output as JSON or a table.                           |
| `outRaw`     | stdout | gated     | Writes preformatted text (such as an installed skill path).  |
| `outPayload` | both   | see below | For `--out -`: writes payload to stdout, JSON ack to stderr. |
| `err`        | stderr | gated     | Prefixes `Error: ` and sanitizes terminal control bytes.     |
| `errRaw`     | stderr | gated     | Writes raw text to stderr; the caller must sanitize it.      |

For `--out -`, `outPayload` always writes the downloaded payload to `stdout`
even when `--quiet` is set, and suppresses only the JSON acknowledgement on
`stderr`.

File downloads for attachments and BDD scenarios use `src/cli/safe-write.ts`.
Without `--force`, `safe-write.ts` opens the path with `wx` (`O_CREAT | O_EXCL`)
and fails if the path exists. With `--force`, it opens the file without truncation.
It verifies that the descriptor refers to a regular file at the same path.
Then it truncates and writes through that descriptor. Consequently,
`--force` rejects device nodes such as `/dev/null`, FIFOs, and symlinks. To
discard downloaded bytes, redirect stdout in the shell with `--out - > /dev/null`.

When writing to a terminal (`stdoutIsTTY`), `outPayload` warns if the payload is
a `Uint8Array` (binary attachment) and never warns for a `string` (BDD text).

`tests/cli-output-ownership.test.ts` verifies that all CLI output goes through
the injected writers and never touches `process.stdout` or `process.stderr`
directly.

## 7. Errors

| Class                     | Thrown for                                                                         | Carries                            |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP/network/protocol error, including malformed successful default-list structure | `status`, `statusText`, `response` |
| `TestRailPaginationError` | Invalid page/continuation, non-progress, or aggregate bound                        | reason + progress counters         |
| `TestRailValidationError` | Bad config or caller arguments                                                     | `details`                          |
| `Error` (plain)           | Call after `destroy()`                                                             | —                                  |

Entity-field schema mismatches are advisory by default and invoke
`onSchemaMismatch`. Outer list and page envelopes have strict protocol contracts.
Default list methods throw `TestRailApiError` if the collection is missing or is not an array.
`--page` and `--all` methods throw `TestRailPaginationError` for invalid page metadata or continuation links. If a
custom `onSchemaMismatch` hook throws an error, that error propagates first.
Because `TestRailPaginationError` extends `TestRailValidationError`, check
`instanceof TestRailPaginationError` before `instanceof TestRailValidationError`.

---

## 8. Testing — `tests/`

The test suite uses Vitest and V8 coverage (see [CODEMAP.md](../CODEMAP.md) for
the full file list):

| File                              | Covers                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `client-endpoints.test.ts`        | All API methods, CRUD paths                                                                                           |
| `client-features.test.ts`         | Request-cache integration, rate limiter, retry, lifecycle                                                             |
| `request-cache.test.ts`           | Cache cloning, TTL/LRU, coalescing, invalidation generations, deadline sharing, disposal                              |
| `client-edge-cases.test.ts`       | Signal handlers, error paths, redirect blocking, SSRF guard                                                           |
| `client-ssrf-coverage.test.ts`    | Shared host classification for literal/DNS IPv4, IPv6, mapped addresses, CGNAT, and transition ranges                 |
| `cli.test.ts`                     | In-process CLI reimports — dispatch, auth, rendering, exit codes                                                      |
| `cli-action-invocation.test.ts`   | Flag applicability, required values, and per-occurrence rejection of swallowed flags                                  |
| `cli-diagnostic*.test.ts`         | Diagnostic redaction/bounds, private file lifecycle, path races, ACLs, and process-signal cleanup                     |
| `case-field-readiness.test.ts`    | GET-only readiness example: identity/configuration checks, cancellation, deadlines, and retained creation results     |
| `scripts/package-smoke.ts`        | Packed executable subprocess smoke tests, run as platform-specific CI jobs                                            |
| `cli-helpers.test.ts`             | Pure helpers: `parseId`, `optInt`, `resolveAuth`, `renderTable`, `safeJsonStringify`, `sanitizeForTerminal`, dispatch |
| `cli-write-handlers.test.ts`      | Write-handler unit shape: happy / dry-run / body-reject / path-param-reject                                           |
| `cli-attachment-handlers.test.ts` | Binary I/O paths + `--yes` gating + dry-run-wins-over-soft                                                            |
| `payload-schemas.test.ts`         | Zod write-payload schemas: parse / reject / `custom_*` passthrough                                                    |
| `pagination-core.test.ts`         | Page decoding, safe continuations, bounds, progress, deadlines, and cache bypass                                      |
| `cli-pagination.test.ts`          | CLI pagination mode conflicts and numeric control parsing                                                             |
| `exports.test.ts`                 | Public API stability, inheritance contract                                                                            |
| `performance.test.ts`             | Concurrent request throughput                                                                                         |

In-process CLI tests run `runCli()` directly for fast execution, while
`scripts/package-smoke.ts` tests the packed tarball and CLI binary in child
processes across CI platforms.

---

## 9. Generated artifacts

| Artifact                                                                                | Generator                                                                                                     | Drift guard                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `CODEMAP.md`                                                                            | `scripts/generate-codemap.ts` (TS Compiler API; deterministic JSON-in-Markdown)                               | `npm run codemap:check` (verify + CI)                       |
| `skill/SKILL.md`, `skill/reference/commands.md`, `skill/reference/payload-schemas.yaml` | `scripts/generate-skill.ts` (consumes source `ACTIONS` and `CLI_OPTION_DOCUMENTATION` directly through `tsx`) | `npm run skill:check` (in-memory render/content comparison) |
| `docs/API-MAPPING.md`                                                                   | `scripts/generate-mapping.ts` (TS Compiler API + JSDoc walk; gates A/B/C/C2/D)                                | `npm run mapping:check` (verify + CI)                       |
| `AGENTS.md`                                                                             | `npm run agents-md` (consumes `ACTIONS`)                                                                      | `npm run agents-md:check` (verify + CI)                     |

All four generated artifacts are committed to git. `npm run verify` and CI run
the `*:check` scripts and fail if any generated file is out of date.

---

## 10. Invariants worth preserving

Each invariant below prevents a specific bug:

1. **Public — not protected — core methods.** Domain modules use composition
   (constructor injection), not inheritance, to call `request()`.
2. **Separate `GET:` and `PARSED:GET:` cache namespaces.** Prevents unvalidated
   and schema-validated responses for the same endpoint from mixing in the
   cache.
3. **Cache invalidation precedes body read on writes.** Ensures that empty `204`
   write responses still clear cached GET entries.
4. **Per-upstream-fetch DNS validation.** Prevents DNS rebinding attacks before
   each network attempt without running DNS lookups on cache hits.
5. **`redirect: 'manual'` on the pipeline fetch.** Blocks 3xx redirects so a
   `Location` header cannot redirect a request to a private IP address.
6. **GET-only retry of 5xx and network errors.** Prevents duplicate writes when
   a connection drops after sending the request. HTTP 429 writes still retry
   because the rate limiter rejects them before execution.
7. **`Retry-After` capped to `MAX_RETRY_DELAY_MS`.** Prevents a server from
   stalling the client with a large `Retry-After` header.
8. **Raw error bodies in the structured field only, never in `message`.**
   Prevents sensitive response bodies from leaking into application logs via
   `error.message`.
9. **Text and binary responses bypass the JSON cache.** Prevents cache collisions
   with JSON GET requests and avoids caching large binary payloads.
10. **Dry-run prevents API dispatch and bypasses destructive gates.** Allows
    callers to preview write and destructive commands locally without draining
    binary stdin or sending network requests.
11. **Forced output validates and writes one held descriptor.** Prevents symlink
    or path-replacement races before file truncation.
12. **Known flags plus per-occurrence type validation.** Rejects unknown flags
    (such as `--dryrun`) and string flags that accidentally consume a following
    flag (such as `--filter --dry-run`).
13. **Continuation host/path is discarded.** Extracts only `offset` and `limit`
    from `_links.next` and rebuilds the endpoint from validated parameters.
14. **All-page reads bypass the GET cache.** Prevents `getAll*()` from combining
    stale cached pages with fresh pages.

---

## 11. Conventions in one place

- **One runtime dependency: Zod.** Do not add new runtime dependencies.
- **No `any`.** Use `unknown` and narrow the type.
- **No mutation.** Return new objects instead of mutating inputs.
- **No hardcoded numbers.** Define constants in `src/constants.ts`.
- **Validate IDs before every API call.** Import `validateId` from
  `../validation.js` and call `validateId(id, 'name')` (or `validateEntryId` for
  plan-entry UUIDs).
- **One module per resource.** Add new endpoints to the existing resource module
  instead of creating per-endpoint files.
- **Add CLI actions to `src/cli/metadata/{resource}.ts`.** Dispatch, help output,
  API mapping, and skill files all derive from `ACTIONS`.
- **Regenerate artifacts after public changes.** Run `npm run codemap`,
  `npm run mapping`, `npm run skill`, and `npm run agents-md`.
