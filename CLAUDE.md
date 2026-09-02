# CLAUDE.md

`@dichovsky/testrail-api-client` — type-safe TypeScript client for the TestRail API. One runtime dependency: Zod. ESM only (`type: "module"`).

## Commands

```bash
npm test                                          # Run all tests (Vitest)
npm run test:coverage                             # Coverage report
npm run build                                     # Native TypeScript 7 → dist/
npm run lint && npm run typecheck                 # Lint + TypeScript 7 check
npm run typecheck:ts6                             # TypeScript 6 compatibility check
npm run codemap                                   # Regenerate CODEMAP.md
npx vitest run tests/client-endpoints.test.ts    # Single file
```

## File Map

| File                                                                        | Purpose                                                                                                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/client-core.ts`                                                        | Request orchestration, HTTP pipeline, rate limiter, retry, lifecycle                                                                           |
| `src/request-cache.ts`                                                      | GET cache protocol: TTL/LRU storage, cloning, in-flight coalescing, invalidation generations, cleanup lifecycle                                |
| `src/client.ts`                                                             | `TestRailClient` composition root: 19 `public readonly` module fields, module composition only, no flat wrappers                               |
| `src/modules/*.ts`                                                          | Per-domain endpoint methods (cases, runs, results, projects, suites, sections, plans, tests, milestones, …)                                    |
| `src/types.ts`                                                              | Schema-derived response aliases, custom-field access, client config, and `Get*Options` DTOs                                                    |
| `src/schemas.ts`                                                            | Zod schemas for API responses **and** write payloads; source of truth for public response and payload types                                    |
| `src/pagination.ts`                                                         | `Page<T>` structural decoding, safe continuation parsing, bounded all-page collection                                                          |
| `src/errors.ts`                                                             | API, validation, license, and pagination errors plus `handleZodError`                                                                          |
| `src/body-reader.ts`                                                        | Streaming response-body reader with byte cap (SEC #12) + wall-clock deadline (SEC #21); shared by every response shape                         |
| `src/constants.ts`                                                          | Configuration defaults/limits, pagination and transport bounds, and the shared constructor-compatible email pattern                            |
| `src/config-validation.ts`                                                  | `TestRailConfigSchema` adapter: URL/SSRF semantics plus stable `TestRailValidationError` messages                                              |
| `src/utils.ts`                                                              | `base64Encode`, `sleep`                                                                                                                        |
| `src/cli.ts`                                                                | Binary entrypoint: 1-line re-export of `src/cli/index.ts` (preserves `bin: testrail` and `./cli` subpath export)                               |
| `src/cli/index.ts`                                                          | CLI entry: arg parse, dispatch, auth, handler invocation (wrapped in `async main()`)                                                           |
| `src/cli/{auth,output,ids,dispatch,handler-context,response-validation}.ts` | CLI infrastructure (env+flag resolution, JSON/table rendering, ID parsing, handler dispatch, mismatch policy)                                  |
| `src/cli/{file-input,file-output}.ts`                                       | Binary file-input resolver (`--file`) and binary download resolver (`--out`) for attachment actions                                            |
| `src/cli/handlers/*.ts`                                                     | One async handler per resource:action (project/suite/case/run/result/milestone/user/plan/attachment)                                           |
| `src/index.ts`                                                              | Public barrel exports                                                                                                                          |
| `CODEMAP.md`                                                                | AST-derived `codemap.v2` symbol index (auto-gen, JSON-in-Markdown, deterministic)                                                              |
| `codemap.config.json`                                                       | Generator config: `sourceDirs`, `entrypoints`, `exclude` globs, `maxSignatureLength`                                                           |
| `scripts/generate-codemap.ts`                                               | Regenerates CODEMAP.md via TS Compiler API; `--check` flag verifies committed file is up to date                                               |
| `docs/API-MAPPING.md`                                                       | Generated coverage matrix: TestRail endpoint ↔ client method ↔ CLI command ↔ skill recipe (auto-gen, deterministic, prettier-ignored)          |
| `docs/testrail-endpoints.json`                                              | Hand-curated upstream TestRail endpoint inventory (133 endpoints × 28 resources); Zod-validated by the mapping generator                       |
| `scripts/generate-mapping.ts`                                               | Regenerates `docs/API-MAPPING.md` via TS Compiler API + JSDoc walk; runs gates A/B/C/C2/D; `--check` flag for CI drift detection               |
| `scripts/mapping-renderer.ts`                                               | Pure helpers for the mapping generator: Zod schema, path normalization, `@testrail` tag parser, recipe parser, cell/section/document renderers |

## API Symbol Index

See **[CODEMAP.md](CODEMAP.md)** for every method, type, error class, and constant with exact file:line links. The file embeds a `codemap.v2` JSON block — agents can `JSON.parse` the fenced block, then look up symbols in `publicApi[]` (transitively re-exported from `src/index.ts` and `src/cli.ts`) or `files[]` (every declaration, including private). `npm run codemap:check` (run by `pretest` and CI) fails if the committed file drifts from source.

## API Coverage Matrix

See **[docs/API-MAPPING.md](docs/API-MAPPING.md)** for the per-resource table of TestRail endpoint ↔ client method ↔ CLI command ↔ skill recipe. `@testrail` JSDoc tags on each module method bind methods to endpoints; `apiEndpoint` on each `ActionSpec` binds CLI commands; `<!-- recipe-for: resource:action -->` HTML comments in `skill/SKILL.md` bind numbered recipes. `npm run mapping:check` (run by `pretest` and CI) enforces six drift gates:

- **A** — committed `docs/API-MAPPING.md` matches generator output.
- **B** — every `@testrail` tag references an endpoint in `docs/testrail-endpoints.json`.
- **C** — every `ActionSpec.apiEndpoint` matches a `@testrail` tag.
- **C2** — (bidirectional) every `recipe-for:` tag in `skill/SKILL.md` references an existing `ACTIONS` entry, **and** every `ACTIONS` entry has ≥1 `recipe-for:` binding unless `skillRecipeExempt: true` is set. The reverse direction is what enforces the CLI→skill half of the layer-coverage invariant below.
- **D** — every `@testrail`-tagged SDK method is claimed by at least one `ActionSpec.apiEndpoint`, with no exemption escape hatch — the mirror image of gate C, enforcing the SDK→CLI half of the layer-coverage invariant below.
- **E** — pagination metadata agrees bidirectionally between `docs/testrail-endpoints.json` and the matching `ActionSpec`; neither side can silently add, remove, or change the contract.

**Layer-coverage invariant (SDK ⇒ CLI ⇒ skill).** Beyond the drift gates above, this repo holds an absolute coverage rule: **every `@testrail`-tagged SDK method must be surfaced as ≥1 CLI command, and every CLI command must be reachable through ≥1 skill recipe.** A new endpoint method is not "done" until its CLI command and skill recipe land in the same change — there are no sanctioned exceptions (the `skillRecipeExempt` flag exists only as gate C2's mechanism and must stay unused; it is `0` today). Both halves are now machine-enforced: the SDK→CLI half by gate D, the CLI→skill half by gate C2 (reverse). Current coverage: 133 methods ⇒ 133 endpoints ⇒ 134 CLI commands ⇒ full recipe coverage (`get_run` is shared by `run get` and `run watch`).

## Architecture Invariants

**Class hierarchy:** `TestRailClientCore` (client-core.ts) → `TestRailClient` (client.ts). Infrastructure lives in core; endpoint methods live in the domain modules. `client.ts` is module composition only (19 `public readonly` fields, no flat wrappers) — the namespaced surface (`client.projects.getProject(id)`) is the single access path (flat facade removed in v5.0.0, ARCH #7). `tests/exports.test.ts` guards the count and constructor/timeout-view parity.

**Configuration validation:** `TestRailConfigSchema` in `src/schemas/common.ts` is the complete structural/numeric runtime contract and is compile-time checked against every `TestRailConfig` key. `validateTestRailConfig()` adds URL protocol, credential, and private-host semantics while preserving the constructor's `TestRailValidationError` messages. Schema and constructor validation share `TESTRAIL_CONFIG_EMAIL_PATTERN`. `maxCacheSize: 0`, `cacheCleanupInterval: 0`, `maxRetries: 0`, and `bodyTimeout: 0` are intentional sentinels; `cacheCleanupInterval` is restricted to integer `0..MAX_NODE_TIMER_DELAY_MS` (`2_147_483_647`) so Node cannot overflow the cleanup timer to a 1 ms loop. `PaginationRequestSchema` owns strict one-request `limit`/`offset` validation; the deprecated `PaginationSchema` retains its historical permissive runtime behavior for compatibility.

**Layer-coverage invariant (SDK ⇒ CLI ⇒ skill):** every `@testrail`-tagged SDK method ⇒ ≥1 CLI command ⇒ ≥1 skill recipe — absolute and exception-free. See [API Coverage Matrix](#api-coverage-matrix) for the binding mechanisms and which gates enforce each half.

**URL construction:** `{baseUrl}/index.php?/api/v2/{endpoint}`. Query params appended with `&` (not `?`): `get_sections/1&suite_id=2`. Use `buildEndpoint(base, params)`.

**Caching:** `RequestCache` owns the complete GET cache protocol behind one `resolve()` interface: TTL/LRU storage, cloning, in-flight coalescing, invalidation generations, stale-publication suppression, and cleanup lifecycle. `request(spec)` only derives the key and supplies a loader plus cacheability disposition. A GET with a Zod `schema` caches under `PARSED:GET:{endpoint}`, a raw GET under `GET:{endpoint}`, and an explicit page projection under `PAGE:PARSED:GET:{endpoint}`; non-GET methods and `responseKind: 'text' | 'binary'` / multipart bypass storage. Any successful write invalidates stored and in-flight reads before response parsing. The page namespace pairs with a strict page schema so collection-only legacy wrappers cannot poison `Page<T>` reads. `getAll*()` passes no key, bypassing reads, writes, and coalescing so an aggregate cannot mix snapshots. DNS validation runs immediately before every distinct upstream fetch attempt, including retries; cache hits and coalesced waiters stop before DNS resolution.

**Pagination contract:** the 24 endpoints carrying `pagination` metadata in `docs/testrail-endpoints.json` expose a trio. Existing `get*()` methods return the items from one response; `get*Page()` returns `Page<T>` with preserved envelope metadata; `getAll*()` follows response continuations and returns the complete bounded array. `_links.next` is authoritative, but only its validated offset and optional limit are extracted; the shared descriptor executor rebuilds a declared operation with its validated path parameters and preserved filters instead of following a supplied host/path. Legacy bare arrays are terminal. Aggregation returns no partial results and defaults to 250/page, offset 0, 100 pages, 25,000 items, 300,000 ms, and 100 MiB; hard ceilings are 250/page, 300,000 ms, and 1 GiB. `TestRailPaginationError.reason` is one of `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, or `non_progress`.

Typed pagination descriptors live beside their domain methods. Each `prepare()` adapter synchronously validates IDs/filters and returns `{ operation, pathParameters, query }`; `createPaginatedListExecutor()` rejects undeclared operations, clones/freezes the prepared values, constructs the path, prebuilds schemas once, and owns list/page/all projection, cache/deadline controls, continuation injection, decoding, and bounded collection. Adapters read only declared filter fields, while aggregate helpers whitelist only `pageSize`, `startOffset`, and safety bounds (or only safety bounds for response-driven endpoints) without enumerating wider option objects. `tests/pagination-descriptor-inventory.test.ts` checks all 24 registrations against the endpoint inventory.

Descriptor scope: cases/history and project BDDs; projects, suites, sections, plans, runs, tests, milestones; all three result lists; labels; shared steps/history; case/run/plan attachments; datasets, variables, roles, groups, and case statuses. Shared-step history, datasets, variables, roles, groups, and case statuses are response-driven (`requestControls: false`). Test attachments, plan-entry attachments, users, and ordinary metadata/configuration/report lists are excluded from the trio.

**CLI pagination:** validation runs before auth/client construction. Default mode emits the existing one-response array; `--page` emits `Page<T>`; `--all` emits the bounded aggregate. `--page` conflicts with `--all`; `--all` rejects `--limit`/`--offset`; `--page-size`, `--start-offset`, `--max-pages`, `--max-items`, `--max-duration-ms`, and `--max-bytes` require `--all`. Response-driven endpoints accept aggregate safety bounds but reject caller-controlled page size/start offset.

**CLI invocation contract:** `FLAG_CATALOG` owns primitive argv syntax and projections; each `ActionSpec.flags` entry owns action applicability and requiredness, while structural capabilities admit shared pagination/body/file/write flags. `resolveActionInvocation()` rejects irrelevant or missing required inputs before stdin, auth, client construction, or handler work. Required declarations feed both CLI help and the generated skill command table. `softMode` lives only on `ActionSpec`; omission rejects real `--soft` execution, including `run close`, while `--dry-run --soft` remains side-effect free. SDK method routing stays in typed per-domain handlers rather than string-key dispatch.

**CLI response validation:** entity-field mismatches are advisory and visible by
default. The CLI installs an `onSchemaMismatch` reporter that emits only
method, known resource/action, normalized Zod issue codes, and path depth (every
segment is `*`). It does not print `endpoint`, field/record keys, issue messages,
or `data`. Duplicate fingerprints are collapsed, at most 10 unique warnings are
printed, and a final safe count summarizes additional unique issues.
`--strict-responses` or `TESTRAIL_STRICT_RESPONSES=1` throws
`handleZodError(error)` for reads; a successful mutating request mismatch throws
an indeterminate-outcome `TestRailApiError`. `0`, empty, and unset are advisory,
while any other environment value fails before auth/network work; boolean flag
value forms (`--strict-responses=true`) are rejected. `--quiet` suppresses
warnings. Strict aggregate handlers emit no partial array; streaming watch
events already emitted for earlier polls remain visible.

**Rate limiter:** Sliding window on `rateLimiter.requests[]`. Throws `TestRailApiError` on limit exceeded. Default: 100 req/60s.

**Retry:** `min(1000 × 2^n, 10000)` ms backoff. **GET** retries on: 5xx, 429, network errors. **POST/PUT/DELETE** retries only on 429 (rate-limited writes are rejected before execution); 5xx and network errors surface immediately to prevent duplicate writes. No retry on: 4xx, AbortError (timeout). Multipart uploads (`retry: 'none'`) never retry. **`Retry-After`** (RFC 7231 §7.1.3) is honored on every retryable response — 429 for all methods, and 5xx on GET (including binary downloads via `retry: 'binaryGet'`). The header accepts delta-seconds or HTTP-date, is capped at `MAX_RETRY_DELAY_MS`, and falls back to exponential backoff when absent, zero, in the past, or unparseable so a buggy server cannot induce a hot retry loop.

**Redirects (3xx):** The unified `executePipeline()` fetch sets `redirect: 'manual'` for every response shape and pipes the response through `assertNotRedirect()`. A 3xx surfaces as `TestRailApiError` with the blocked `Location` embedded in `response`, never retries, and never poisons the GET cache. Closes the SSRF guard hole where a `Location` header pointing at a private/metadata IP would have bypassed config validation + DNS pinning.

**Response-body limits (SEC #12 + SEC #21):** Every fetch site reads the body through `readBodyWithLimits()` (`src/body-reader.ts`). Two caps apply: a **byte ceiling** (`maxJsonResponseBytes`, default 10 MiB — also used for text bodies and error payloads; `maxBinaryResponseBytes`, default 100 MiB — the `responseKind: 'binary'` success path only) and a **wall-clock deadline** (`bodyTimeout`, default = `timeout`). Exceeding either surfaces as `TestRailApiError(0, 'Response body too large' | 'Body read timeout', …)` with no retry. The header `timeout` is cleared after fetch returns; the body deadline is independent so a server that sends headers fast then dribbles bytes can no longer hold a socket open indefinitely. Config validator caps both byte limits at `MAX_RESPONSE_BYTES_LIMIT` (1 GiB) so a caller cannot disable the guard with `Number.MAX_SAFE_INTEGER`. A non-streaming fallback exists for Response-like objects without `body.getReader()` (test mocks); it deadline-races the read and enforces the byte cap after completion. An uncancellable fallback may continue reading in the background after the caller receives the timeout, but it cannot extend the caller-visible wait.

**Lifecycle:** Instances auto-register in module-level `activeClients Set`. `destroy()` disposes the root-owned `RequestCache` (timer plus stored/in-flight state), zeros the credential, and removes the client from the set. Process signal handlers (`exit`/`SIGINT`/`SIGTERM`) are **opt-in** via `registerProcessHandlers: true` on `TestRailConfig` (default `false`, SEC #8 — library consumers must not have their signal chain hijacked). When opted in, handlers call `destroy()` on every active instance; SIGINT/SIGTERM additionally `process.exit(130/143)`. The CLI (`src/cli/index.ts`) opts in; library callers should leave the flag off and call `destroy()` from their own shutdown hook. Once installed for a process, handlers persist for its lifetime (no safe deregistration without per-client ownership tracking).

**ID validation:** All numeric IDs checked as positive integers via the pure `validateId(id, name)` function in `src/validation.ts` before any API call. Plan-entry IDs (UUID strings, SEC #29) use `validateEntryId` from the same leaf module.

## Error Model

| Class                     | Thrown when                                                                   | Has                                |
| ------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP/network/protocol error, including malformed default-list outer structure | `status`, `statusText`, `response` |
| `TestRailPaginationError` | Malformed page/continuation or an aggregate safety bound                      | reason + progress counters         |
| `TestRailValidationError` | Bad config or invalid ID/params                                               | —                                  |
| `Error`                   | Call after `destroy()`                                                        | —                                  |

Entity-field response mismatches are advisory. With a non-throwing mismatch
hook, structural list/page invariants are not: a default projection rejects a
missing or scalar collection with `TestRailApiError`; explicit page/all
projections use `TestRailPaginationError` for incomplete metadata, malformed
links, and unsafe/non-advancing continuations. A throwing hook propagates before
these downstream decoders. Catch the pagination subtype before its
`TestRailValidationError` base when its reason matters.

## Schema authoring conventions (`src/schemas/*.ts`)

Five rules govern Zod schemas. The Results domain (`src/schemas/results.ts`) is the canonical exemplar for both directions.

1. **Naming** — `XSchema` = GET response (canonical entity, e.g. `ResultSchema`); `AddXPayloadSchema` / `UpdateXPayloadSchema` = POST request body; `AddXResponseSchema` = POST response **only** when it genuinely differs from the GET response (§5); `XEmbeddedSchema` / `XEntrySchema` / `XConfigSchema` = response sub-schemas nested inside `XSchema.field[]`.
2. **Nullability** — response fields use `.nullish()` (`T | null | undefined`) where TestRail may return `null` or omit the key; request fields use `.optional()` (`T | undefined`) for caller-omittable fields. The asymmetry is deliberate — a response `.optional()` fails to parse `{ field: null }`, and a request `.nullish()` widens the input with `null` for no reason.
3. **No `.extend()` across directions** — inline request fields rather than extending a response schema (or vice versa). `zObject = z.object(shape).passthrough()`, and `.extend()` + `.passthrough()` interact in non-obvious ways: the inferred type and the parse-time passthrough can drift. The `AddResultPayloadSchema` / `AddResultForCasePayloadSchema` / `AddResultForTestPayloadSchema` duplication is the intended trade-off.
4. **Sub-schema discipline** — response sub-schemas (`LabelEmbeddedSchema`, `PlanEntrySchema`, `HistoryEntrySchema`, …) are response-only by default. For request-side equivalents define a separate sub-schema (e.g. `AddPlanEntryRunPayloadSchema`); do not reuse a response sub-schema in a payload even when the field list looks similar — optionality and the writeable-field set almost always differ.
5. **Endpoint-level divergence** — when a POST/PUT response genuinely differs from the GET response (different fields/types), model it as a separate `AddXResponseSchema`. Reference case (PR #146): `add_case_field` returns `configs` as a JSON-encoded string while `get_case_fields` returns a structured array, so `AddCaseFieldResponseSchema` keeps the two distinct. The bar is _observed_ divergence backed by docs or response captures — not a hypothetical asymmetry.

Regression guard: `tests/schema-conventions.test.ts` statically enforces §2 (responses use `.nullish()`, never `.optional()`; no format/length validators on responses), §3 (no `.extend()` between directions), and §4 (payloads don't reference response base/sub-schemas).

**A "no bare required scalar on a response" rule was evaluated and deliberately rejected.** The audit found that most matches were primary keys, foreign keys, or `name` — fields present by construction — so the rule produced mostly false positives while still missing wrapper-shape and wire-type drift. Do not add it. Drift of that kind is caught by `onSchemaMismatch` at runtime, not by a syntactic gate.

## Response validation is advisory (6.0.0)

`TestRailClientCore.parse()` uses `safeParse`: a response that fails its schema is **returned raw** and reported to the optional `TestRailConfig.onSchemaMismatch` hook. It never throws on its own. A hook that throws restores fail-closed behavior and is the supported strict mode; because the hook is invoked outside any `try`, the throw propagates and also prevents the cache write. Use `onSchemaMismatch: ({ error }) => { throw handleZodError(error) }` for byte-for-byte pre-6.0.0 behavior — the bare `throw error` throws a `ZodError`, not the `TestRailValidationError` older versions raised, so `instanceof` handlers would silently stop matching.

Exception at the module boundary: `cases.addCases()` and `cases.updateCases()` perform a second hard check on their successful response shape. These non-idempotent writes may already have changed server state, so an unrecognized response reports through a non-throwing hook and then throws an indeterminate-outcome `TestRailApiError` instead of returning `[]` and inviting a duplicate retry. A caller hook that throws preempts the second check; never interpret that throw as proof the write did not happen. The bundled CLI's strict hook instead turns every successful mutating-response mismatch into an indeterminate-outcome `TestRailApiError`.

The hook is caller-supplied config and is validated as such: a non-function is rejected in the constructor, and one returning a thenable throws `TestRailValidationError` at the mismatch. An `async` hook satisfies the `void` return type but cannot restore fail-closed validation (its throw becomes a rejected promise nobody awaits) and its rejection would surface as a process-fatal unhandled rejection.

The bundled CLI supplies its own synchronous hook. Advisory mode writes a
bounded privacy-safe warning and continues; strict mode throws
`handleZodError(error)` for reads and an indeterminate-outcome
`TestRailApiError` for successful mutating requests. The warning is keyed by
HTTP method, the already validated CLI resource/action, recursively flattened
issue codes, and path depth with every segment masked, so multi-page reads
neither disclose endpoint/response values nor flood stderr with the same drift
on every page.

**A mismatched response is returned but never cached.** Caching it would pin a rejected body — including the `{}` that `executeJson` synthesizes for an empty 200 — for the full TTL with no further hook notifications, so a transient proxy blip would keep answering for minutes instead of self-healing on the next call as it did in 5.x. `parse()` delegates to a private `parseAdvisory()` that returns `{ value, matched }`; `request()` reports `cacheable: matched` to `RequestCache`, so rejected bodies are returned but never published.

**Wrapper-documented list reads must parse through `listOf()` / `unwrapList()`** (`src/modules/list.ts`), which accept both the paginated envelope and a bare top-level array. Mandatory for that class, not optional: an envelope-only schema meeting a bare array parses to the raw array under advisory validation, whose `.<key>` is `undefined`, so the `?? []` unwrap silently reports **zero rows** — worse than the throw it replaced. Never hand-roll `z.object({ key: z.array(X) })` for a wrapper-documented list GET, and use the pair for bulk list-returning _writes_ too (`addCases`, `updateCases`), where a silent `[]` misreports work the server actually did.

The rule is scoped to endpoints that may return a pagination wrapper. Endpoints whose response is a bare array to begin with correctly parse `z.array(...)` and must be left alone — `getStatuses`, `getPriorities`, `getCaseTypes`, `getTemplates`, `getCaseFields`, `getResultFields` (`metadata.ts`), `getConfigurations` (`configurations.ts`), `addResults`, `addResultsForCases` (`results.ts`). They do not tolerate an envelope: one would arrive raw, typed `T[]`, and a caller's `.map` would throw.

Not every list-shaped POST returns a list, either. `update_tests` returns an acknowledgement (`{ test_ids, labels }`), so it uses `UpdateTestsResponseSchema` rather than `listOf` — routing it through the list helper made every successful call resolve `[]`. Before reaching for `listOf` on a write, confirm the endpoint actually returns entities. `get_history_for_case` needs the third variant, `listOfNested`/`unwrapNestedList`, because its documented response wraps the envelope in an outer array.

Two invariants inside `listOf`/`unwrapList` carry the safety and must not be relaxed: the envelope key is `.nullable()` (present, possibly `null`) rather than `.nullish()`, because an optional-only key makes the branch accept **any** object — `{ error: … }`, a single entity, a renamed key — parsing "successfully" to `{}` and unwrapping to `[]` with no hook notification; and `unwrapList` guards the extracted member with `Array.isArray`, because the declared `T[]` is otherwise a lie when the key holds a scalar.

Why: response-schema corrections have consistently widened schemas to admit valid TestRail responses rather than narrowed them to reject invalid ones. TestRail's docs can disagree with its wire behavior, so reviewing a schema against documentation alone can reproduce bugs rather than catch them.

Scope: **responses only.** Caller-supplied input still fails closed — client config validates in the constructor, CLI write payloads in `resolveBody()` (`src/cli/body.ts`), and neither routes through `parse()`. Keep it that way; those are real trust boundaries.

Consequence for types: exported response types describe the expected shape, not a runtime guarantee, and may widen when wire evidence arrives. They derive from the declared schema keys through `KnownResponse`, which deliberately removes `zObject().passthrough()`'s broad string index signature. Only `Case`, `Test`, and `Result` add `[custom_*]: unknown`; narrow bracket-accessed values. Their `custom_fields` container remains deprecated. Stable 6.0 additions include `Test.refs_data`/`case_title`, `Result.case_title`/`case_refs`, case/result field system flags, writable case-field indexing, and recursively typed milestone children.

## Constants (`src/constants.ts`)

`BASE_RETRY_DELAY_MS=1000` · `MAX_RETRY_DELAY_MS=10000` · `MAX_TIMEOUT_MS=300000` · `HTTP_OK_STATUS=200` · `DEFAULT_TIMEOUT_MS=30000` · `DEFAULT_MAX_RETRIES=3` · `MAX_RETRIES=10` · `DEFAULT_CACHE_TTL_MS=300000` · `DEFAULT_CACHE_CLEANUP_INTERVAL_MS=60000` · `MAX_NODE_TIMER_DELAY_MS=2147483647` · `DEFAULT_MAX_CACHE_SIZE=1000` · `DEFAULT_RATE_LIMIT_MAX_REQUESTS=100` · `DEFAULT_RATE_LIMIT_WINDOW_MS=60000` · `DEFAULT_PAGE_SIZE=250` · `DEFAULT_MAX_PAGES=100` · `DEFAULT_MAX_ITEMS=25000` · `DEFAULT_MAX_PAGINATION_DURATION_MS=300000` · `DEFAULT_MAX_PAGINATION_BYTES=104857600` · `MAX_PAGINATION_BYTES=1073741824` · `MAX_CLI_SCHEMA_MISMATCH_WARNINGS=10` · `DEFAULT_MAX_JSON_RESPONSE_BYTES=10485760` · `DEFAULT_MAX_BINARY_RESPONSE_BYTES=104857600` · `MAX_RESPONSE_BYTES_LIMIT=1073741824`

## Tests

Shared test helpers live in `tests/helpers.ts`; use the suite output rather than recording a count here because pagination adapters and inventory gates intentionally grow it.

| File                                | Covers                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/client-endpoints.test.ts`    | Endpoint methods and CRUD paths                                                                                                        |
| `tests/client-features.test.ts`     | Cache, rate limiter, retry, lifecycle                                                                                                  |
| `tests/client-edge-cases.test.ts`   | Edge cases, signal handlers, error paths                                                                                               |
| `tests/client-projects.test.ts`     | Project CRUD                                                                                                                           |
| `tests/client-sections.test.ts`     | Section CRUD                                                                                                                           |
| `tests/cli.test.ts`                 | In-process CLI reimports: dispatch, auth, rendering, exit codes                                                                        |
| `scripts/package-smoke.ts`          | Packed executable subprocess smoke tests, run by platform-specific CI jobs                                                             |
| `tests/cli-helpers.test.ts`         | Unit tests for extracted helpers (`valueToString`, `renderTable`, `safeJsonStringify`, `parseId`, `optInt`, `resolveAuth`, `dispatch`) |
| `tests/payload-schemas.test.ts`     | Zod write-payload schemas: parse/reject/`custom_*` passthrough                                                                         |
| `tests/exports.test.ts`             | Public API exports, inheritance                                                                                                        |
| `tests/performance.test.ts`         | Concurrent requests, throughput                                                                                                        |
| `tests/utils.test.ts`               | `base64Encode`, `sleep`                                                                                                                |
| `tests/body-limits.test.ts`         | Response-body byte cap + wall-clock deadline (SEC #12 / SEC #21) across JSON, text, binary, and multipart paths                        |
| `tests/advisory-validation.test.ts` | Advisory response validation: `onSchemaMismatch`, strict-mode opt-in, list bare-array/envelope tolerance, input still fail-closed      |

## Common Tasks

**Add API endpoint:**

1. Add the response Zod schema + inferred type to the matching `src/schemas/{domain}.ts` (re-exported via the `src/schemas.ts` barrel). For write endpoints, also add a payload schema there
2. Add the method to the relevant module in `src/modules/` (e.g., `cases.ts` for case endpoints) — the method is reached via its namespaced module field (`client.cases.getCase(id)`); there is no flat facade wrapper to add
3. Validate IDs by importing `validateId` from `../validation.js` and calling `validateId(id, 'paramName')` before any network call (`validateEntryId` for UUID plan-entry IDs)
4. Call `this.client.request<ReturnType>({ method, endpoint, schema, body, responseKind?, retry? })`
5. Add response schema and inferred type re-exports to `src/index.ts` if they're public
6. Add a test case to the matching `tests/client-*.test.ts` file
7. **Surface the new method on the CLI and in the skill (layer-coverage invariant — mandatory).** Add the CLI command (see _Add CLI write action_ for writes, or add a read `ActionSpec` + handler for reads) and a numbered recipe in `skill/SKILL.md` tagged `<!-- recipe-for: resource:action -->`. The endpoint is not complete until both exist
8. Run `npm run codemap` (and `npm run skill` if you touched a CLI action) to regenerate the generated docs, then `npm run mapping:check` to confirm `docs/API-MAPPING.md` has no new `—` rows

**Add CLI write action:**

1. Add a Zod payload schema to the matching `src/schemas/{domain}.ts` if one doesn't exist (mirror the existing `Add*PayloadSchema` pattern with `zObject()` for `.passthrough()`)
2. Build the handler with `createWriteHandler({ action, pathParams, bodySchema, call })` or `createDestructiveHandler({ action, pathParams, kind, call })` from `src/cli/write-handler-factory.ts`; declare `softMode: 'optional'` on the matching `ActionSpec` only when the endpoint supports server-side preview. The factory reads that resolved metadata and handles path-param parsing, body resolution, dry-run preview, and the `--yes`/`--soft` gates. Export it from `src/cli/handlers/{resource}-write.ts`
3. Add an `ActionSpec` entry to the matching `src/cli/metadata/{resource}.ts`, including its `handler:` field — `dispatch.ts` derives `HANDLERS` from `ACTIONS`, and `src/cli/help.ts` derives `--help` from it (no separate dispatch/HELP edits)
4. Add unit tests to `tests/cli-write-handlers.test.ts` (happy + dry-run + body reject + path-param reject) and an in-process CLI reimport case to `tests/cli.test.ts`
5. Run `npm run codemap` and `npm run skill` to regenerate CODEMAP.md and skill/SKILL.md

**Add CLI attachment-style action (binary file I/O):**

1. The programmatic method (`addAttachmentTo*` / `getAttachment` / `deleteAttachment`) already exists in `src/modules/attachments.ts` and is exposed via `TestRailClient`
2. Pick the I/O shape: file upload → `fileInput: true` in metadata + `resolveFile()` from `src/cli/file-input.ts`; binary download → `fileOutput: true` + `resolveOut()` from `src/cli/file-output.ts`; destructive op → `destructive: true` + a `ctx.confirmDestructive` check after the dry-run branch
3. Add handler to `src/cli/handlers/attachment.ts` (read) or `attachment-write.ts` (write). Upload handlers use the shared `setupUpload()` helper for dry-run preview + filesystem descriptor streaming; `attachment delete` stays hand-written because attachment IDs may be integers or UUIDs
4. Add an `ActionSpec` entry (with its `handler:` field) to `src/cli/metadata/attachments.ts` — dispatch + `--help` derive from `ACTIONS` automatically
5. Add unit tests to `tests/cli-attachment-handlers.test.ts` (happy + dry-run + missing-flag + path-param reject; delete actions add `--yes` gate + dry-run-wins coverage) and an in-process CLI reimport case to `tests/cli.test.ts`
6. Run `npm run codemap` and `npm run skill` to regenerate CODEMAP.md and skill/SKILL.md

**Destructive-ops convention:** all destructive CLI actions require both `TESTRAIL_ALLOW_DESTRUCTIVE=1` and `--yes`. `--dry-run` bypasses both gates (preview-without-API). Set `destructive: true` in metadata so the dispatcher enforces the env unlock and the skill generator surfaces the gate in the command table.

**`--soft` vs `--dry-run` (case delete-bulk):** `--soft` adds TestRail's `soft=1` query param — a _server-side_ preview where TestRail returns affected-test counts without deleting. The CLI still hits the API. `--dry-run` is _client-side_ — no API call at all. They are independent: `--dry-run --yes --soft` short-circuits before any request and emits a preview noting `soft: true`.

**Add text-response endpoint (rare — currently only `get_bdd`):** Call `this.client.request<string>({ method, endpoint, responseKind: 'text' })` from your module. With `responseKind: 'text'` the pipeline returns `Promise<string>` and (having no `schema`) does not participate in the validated cache. For CLI exposure, write text to `--out <path>` directly with `writeFileSync(path, text, 'utf-8')` — `resolveOut()` handles the path/force checks; do not extend `file-output.ts` to handle strings.

**Modify caching:** Keep key selection and response cacheability in `src/client-core.ts`; change storage, coalescing, invalidation, or cleanup behavior through the `RequestCache.resolve()` interface in `src/request-cache.ts`.

**Modify retry/rate limits:** Edit constants in `src/constants.ts`. Config overrides via `TestRailConfig.rateLimiter` / `maxRetries` / `timeout`.

## DO NOT

- Add runtime dependencies beyond Zod (the single-dependency posture is intentional)
- Use `any` type (use `unknown` + narrowing)
- Mutate objects in-place (return new objects)
- Hardcode numeric values (use `src/constants.ts`)
- Call `request()` without ID validation
- Skip either `npm run typecheck` or `npm run typecheck:ts6` before committing
