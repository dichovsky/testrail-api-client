# CLAUDE.md

`@dichovsky/testrail-api-client` — type-safe TypeScript client for the TestRail API. Zero runtime dependencies. ESM only (`type: "module"`).

## Commands

```bash
npm test                                          # Run all tests (Vitest)
npm run test:coverage                             # Coverage report
npm run build                                     # tsc → dist/
npm run lint && npm run typecheck                 # Lint + type-check
npm run codemap                                   # Regenerate CODEMAP.md
npx vitest run tests/client-endpoints.test.ts    # Single file
```

## File Map

| File                                                    | Purpose                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/client-core.ts`                                    | HTTP pipeline, cache, rate limiter, retry, lifecycle                                                                                              |
| `src/client.ts`                                         | `TestRailClient` composition root: 18 `public readonly` module fields, module composition only, no flat wrappers                                  |
| `src/modules/*.ts`                                      | Per-domain endpoint methods (cases, runs, results, projects, suites, sections, plans, tests, milestones, …)                                       |
| `src/types.ts`                                          | Response interfaces + payload types that aren't Zod-derived (e.g., `GetCasesOptions`, `GetPlansOptions`, `AddSuitePayload`)                       |
| `src/schemas.ts`                                        | Zod schemas for API responses **and** write payloads; source of truth for `AddCasePayload`, `AddRunPayload`, `AddPlanPayload`, etc. via `z.infer` |
| `src/errors.ts`                                         | `TestRailApiError`, `TestRailValidationError`, `handleZodError`                                                                                   |
| `src/body-reader.ts`                                    | Streaming response-body reader with byte cap (SEC #12) + wall-clock deadline (SEC #21); shared by all four fetch sites                            |
| `src/constants.ts`                                      | All numeric constants (timeouts, cache, rate limits, response-body caps)                                                                          |
| `src/utils.ts`                                          | `base64Encode`, `sleep`                                                                                                                           |
| `src/cli.ts`                                            | Binary entrypoint: 1-line re-export of `src/cli/index.ts` (preserves `bin: testrail` and `./cli` subpath export)                                  |
| `src/cli/index.ts`                                      | CLI entry: arg parse, dispatch, auth, handler invocation (wrapped in `async main()`)                                                              |
| `src/cli/{auth,output,ids,dispatch,handler-context}.ts` | CLI infrastructure (env+flag resolution, JSON/table rendering, ID parsing, handler-table dispatch, shared types)                                  |
| `src/cli/{file-input,file-output}.ts`                   | Binary file-input resolver (`--file`) and binary download resolver (`--out`) for attachment actions                                               |
| `src/cli/handlers/*.ts`                                 | One async handler per resource:action (project/suite/case/run/result/milestone/user/plan/attachment)                                              |
| `src/index.ts`                                          | Public barrel exports                                                                                                                             |
| `CODEMAP.md`                                            | AST-derived `codemap.v2` symbol index (auto-gen, JSON-in-Markdown, deterministic)                                                                 |
| `codemap.config.json`                                   | Generator config: `sourceDirs`, `entrypoints`, `exclude` globs, `maxSignatureLength`                                                              |
| `scripts/generate-codemap.ts`                           | Regenerates CODEMAP.md via TS Compiler API; `--check` flag verifies committed file is up to date                                                  |
| `docs/API-MAPPING.md`                                   | Generated coverage matrix: TestRail endpoint ↔ client method ↔ CLI command ↔ skill recipe (auto-gen, deterministic, prettier-ignored)             |
| `docs/testrail-endpoints.json`                          | Hand-curated upstream TestRail endpoint inventory (116 endpoints × 25 resources); Zod-validated by the mapping generator                          |
| `scripts/generate-mapping.ts`                           | Regenerates `docs/API-MAPPING.md` via TS Compiler API + JSDoc walk; runs gates A/B/C/C2; `--check` flag for CI drift detection                    |
| `scripts/mapping-renderer.ts`                           | Pure helpers for the mapping generator: Zod schema, path normalization, `@testrail` tag parser, recipe parser, cell/section/document renderers    |

## API Symbol Index

See **[CODEMAP.md](CODEMAP.md)** for every method, type, error class, and constant with exact file:line links. The file embeds a `codemap.v2` JSON block — agents can `JSON.parse` the fenced block, then look up symbols in `publicApi[]` (transitively re-exported from `src/index.ts` and `src/cli.ts`) or `files[]` (every declaration, including private). `npm run codemap:check` (run by `pretest` and CI) fails if the committed file drifts from source.

## API Coverage Matrix

See **[docs/API-MAPPING.md](docs/API-MAPPING.md)** for the per-resource table of TestRail endpoint ↔ client method ↔ CLI command ↔ skill recipe. `@testrail` JSDoc tags on each module method bind methods to endpoints; `apiEndpoint` on each `ActionSpec` binds CLI commands; `<!-- recipe-for: resource:action -->` HTML comments in `skill/SKILL.md` bind numbered recipes. `npm run mapping:check` (run by `pretest` and CI) enforces four drift gates:

- **A** — committed `docs/API-MAPPING.md` matches generator output.
- **B** — every `@testrail` tag references an endpoint in `docs/testrail-endpoints.json`.
- **C** — every `ActionSpec.apiEndpoint` matches a `@testrail` tag.
- **C2** — every `recipe-for:` tag in `skill/SKILL.md` references an existing `ACTIONS` entry.

## Architecture Invariants

**Class hierarchy:** `TestRailClientCore` (client-core.ts) → `TestRailClient` (client.ts). Infrastructure lives in core; endpoint methods live in the domain modules. `client.ts` is module composition only (18 `public readonly` fields, no flat wrappers) — the namespaced surface (`client.projects.getProject(id)`) is the single access path (flat facade removed in v5.0.0, ARCH #7).

**URL construction:** `{baseUrl}/index.php?/api/v2/{endpoint}`. Query params appended with `&` (not `?`): `get_sections/1&suite_id=2`. Use `buildEndpoint(base, params)`.

**Caching:** GET-only LRU Map with TTL. Any write invalidates the entire cache (`clearCache()`). `request(spec)` derives the cache key from the spec: a GET with a Zod `schema` caches under `PARSED:GET:{endpoint}`, a raw GET under `GET:{endpoint}`; non-GET methods and `responseKind: 'text' | 'binary'` / multipart bypass the cache.

**Rate limiter:** Sliding window on `rateLimiter.requests[]`. Throws `TestRailApiError` on limit exceeded. Default: 100 req/60s.

**Retry:** `min(1000 × 2^n, 10000)` ms backoff. **GET** retries on: 5xx, 429, network errors. **POST/PUT/DELETE** retries only on 429 (rate-limited writes are rejected before execution); 5xx and network errors surface immediately to prevent duplicate writes. No retry on: 4xx, AbortError (timeout). Multipart uploads (`retry: 'none'`) never retry. **`Retry-After`** (RFC 7231 §7.1.3) is honored on every retryable response — 429 for all methods, and 5xx on GET (including binary downloads via `retry: 'binaryGet'`). The header accepts delta-seconds or HTTP-date, is capped at `MAX_RETRY_DELAY_MS`, and falls back to exponential backoff when absent, zero, in the past, or unparseable so a buggy server cannot induce a hot retry loop.

**Redirects (3xx):** All four fetch sites set `redirect: 'manual'` and pipe the response through `assertNotRedirect()`. A 3xx surfaces as `TestRailApiError` with the blocked `Location` embedded in `response`, never retries, and never poisons the GET cache. Closes the SSRF guard hole where a `Location` header pointing at a private/metadata IP would have bypassed `validateBaseUrl` + DNS pinning.

**Response-body limits (SEC #12 + SEC #21):** Every fetch site reads the body through `readBodyWithLimits()` (`src/body-reader.ts`). Two caps apply: a **byte ceiling** (`maxJsonResponseBytes`, default 10 MiB — also used for text bodies and error payloads; `maxBinaryResponseBytes`, default 100 MiB — the `responseKind: 'binary'` success path only) and a **wall-clock deadline** (`bodyTimeout`, default = `timeout`). Exceeding either surfaces as `TestRailApiError(0, 'Response body too large' | 'Body read timeout', …)` with no retry. The header `timeout` is cleared after fetch returns; the body deadline is independent so a server that sends headers fast then dribbles bytes can no longer hold a socket open indefinitely. Config validator caps both byte limits at `MAX_RESPONSE_BYTES_LIMIT` (1 GiB) so a caller cannot disable the guard with `Number.MAX_SAFE_INTEGER`. A non-streaming fallback exists for Response-like objects without `body.getReader()` (test mocks); it enforces the byte cap post-read but loses the slowloris protection.

**Lifecycle:** Instances auto-register in module-level `activeClients Set`. `destroy()` stops cleanup timer, clears cache, zeros credential, removes from set. Process signal handlers (`exit`/`SIGINT`/`SIGTERM`) are **opt-in** via `registerProcessHandlers: true` on `TestRailConfig` (default `false`, SEC #8 — library consumers must not have their signal chain hijacked). When opted in, handlers call `destroy()` on every active instance; SIGINT/SIGTERM additionally `process.exit(130/143)`. The CLI (`src/cli/index.ts`) opts in; library callers should leave the flag off and call `destroy()` from their own shutdown hook. Once installed for a process, handlers persist for its lifetime (no safe deregistration without per-client ownership tracking).

**ID validation:** All numeric IDs checked as positive integers via the pure `validateId(id, name)` function in `src/validation.ts` before any API call. Plan-entry IDs (UUID strings, SEC #29) use `validateEntryId` from the same leaf module.

## Error Model

| Class                     | Thrown when                                                   | Has                                |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP error, network error, rate limit, timeout, invalid JSON  | `status`, `statusText`, `response` |
| `TestRailValidationError` | Bad config (baseUrl/email/apiKey), invalid ID, invalid params | —                                  |
| `Error`                   | Call after `destroy()`                                        | —                                  |

## Schema authoring conventions (`src/schemas/*.ts`)

Five rules govern Zod schemas. The Results domain (`src/schemas/results.ts`) is the canonical exemplar for both directions.

1. **Naming** — `XSchema` = GET response (canonical entity, e.g. `ResultSchema`); `AddXPayloadSchema` / `UpdateXPayloadSchema` = POST request body; `AddXResponseSchema` = POST response **only** when it genuinely differs from the GET response (§5); `XEmbeddedSchema` / `XEntrySchema` / `XConfigSchema` = response sub-schemas nested inside `XSchema.field[]`.
2. **Nullability** — response fields use `.nullish()` (`T | null | undefined`) where TestRail may return `null` or omit the key; request fields use `.optional()` (`T | undefined`) for caller-omittable fields. The asymmetry is deliberate — a response `.optional()` fails to parse `{ field: null }`, and a request `.nullish()` widens the input with `null` for no reason.
3. **No `.extend()` across directions** — inline request fields rather than extending a response schema (or vice versa). `zObject = z.object(shape).passthrough()`, and `.extend()` + `.passthrough()` interact in non-obvious ways: the inferred type and the parse-time passthrough can drift. The `AddResultPayloadSchema` / `AddResultForCasePayloadSchema` / `AddResultForTestPayloadSchema` duplication is the intended trade-off.
4. **Sub-schema discipline** — response sub-schemas (`LabelEmbeddedSchema`, `PlanEntrySchema`, `HistoryEntrySchema`, …) are response-only by default. For request-side equivalents define a separate sub-schema (e.g. `AddPlanEntryRunPayloadSchema`); do not reuse a response sub-schema in a payload even when the field list looks similar — optionality and the writeable-field set almost always differ.
5. **Endpoint-level divergence** — when a POST/PUT response genuinely differs from the GET response (different fields/types), model it as a separate `AddXResponseSchema`. Reference case (PR #146): `add_case_field` returns `configs` as a JSON-encoded string while `get_case_fields` returns a structured array, so `AddCaseFieldResponseSchema` keeps the two distinct. The bar is _observed_ divergence backed by docs or response captures — not a hypothetical asymmetry.

Regression guard: `tests/schema-conventions.test.ts` statically enforces §3 (no `.extend()` between directions) and §4 (payloads don't reference response base/sub-schemas).

## Constants (`src/constants.ts`)

`BASE_RETRY_DELAY_MS=1000` · `MAX_RETRY_DELAY_MS=10000` · `MAX_TIMEOUT_MS=300000` · `DEFAULT_TIMEOUT_MS=30000` · `DEFAULT_MAX_RETRIES=3` · `DEFAULT_CACHE_TTL_MS=300000` · `DEFAULT_CACHE_CLEANUP_INTERVAL_MS=60000` · `DEFAULT_MAX_CACHE_SIZE=1000` · `DEFAULT_RATE_LIMIT_MAX_REQUESTS=100` · `DEFAULT_RATE_LIMIT_WINDOW_MS=60000` · `DEFAULT_MAX_JSON_RESPONSE_BYTES=10485760` (10 MiB) · `DEFAULT_MAX_BINARY_RESPONSE_BYTES=104857600` (100 MiB) · `MAX_RESPONSE_BYTES_LIMIT=1073741824` (1 GiB ceiling)

## Tests

2985 cases, 98%+ coverage (Vitest + V8). Shared helpers in `tests/helpers.ts`.

| File                              | Covers                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/client-endpoints.test.ts`  | All 36 API methods (CRUD)                                                                                                              |
| `tests/client-features.test.ts`   | Cache, rate limiter, retry, lifecycle                                                                                                  |
| `tests/client-edge-cases.test.ts` | Edge cases, signal handlers, error paths                                                                                               |
| `tests/client-projects.test.ts`   | Project CRUD                                                                                                                           |
| `tests/client-sections.test.ts`   | Section CRUD                                                                                                                           |
| `tests/cli.test.ts`               | CLI subprocess: dispatch, auth, rendering, exit codes                                                                                  |
| `tests/cli-helpers.test.ts`       | Unit tests for extracted helpers (`valueToString`, `renderTable`, `safeJsonStringify`, `parseId`, `optInt`, `resolveAuth`, `dispatch`) |
| `tests/payload-schemas.test.ts`   | Zod write-payload schemas: parse/reject/`custom_*` passthrough                                                                         |
| `tests/exports.test.ts`           | Public API exports, inheritance                                                                                                        |
| `tests/performance.test.ts`       | Concurrent requests, throughput                                                                                                        |
| `tests/utils.test.ts`             | `base64Encode`, `sleep`                                                                                                                |
| `tests/body-limits.test.ts`       | Response-body byte cap + wall-clock deadline (SEC #12 / SEC #21) across all four fetch sites                                           |

## Common Tasks

**Add API endpoint:**

1. Add the response Zod schema + inferred type to the matching `src/schemas/{domain}.ts` (re-exported via the `src/schemas.ts` barrel). For write endpoints, also add a payload schema there
2. Add the method to the relevant module in `src/modules/` (e.g., `cases.ts` for case endpoints) — the method is reached via its namespaced module field (`client.cases.getCase(id)`); there is no flat facade wrapper to add
3. Validate IDs by importing `validateId` from `../validation.js` and calling `validateId(id, 'paramName')` before any network call (`validateEntryId` for UUID plan-entry IDs)
4. Call `this.client.request<ReturnType>({ method, endpoint, schema, body, responseKind?, retry? })`
5. Add response schema and inferred type re-exports to `src/index.ts` if they're public
6. Add a test case to the matching `tests/client-*.test.ts` file
7. Run `npm run codemap` to update CODEMAP.md

**Add CLI write action:**

1. Add a Zod payload schema to the matching `src/schemas/{domain}.ts` if one doesn't exist (mirror the existing `Add*PayloadSchema` pattern with `zObject()` for `.passthrough()`)
2. Build the handler with `createWriteHandler({ action, pathParams, bodySchema, call })` (or `createDestructiveHandler({ ..., softMode, kind })`) from `src/cli/write-handler-factory.ts` — the factory handles path-param parsing, body resolution, the dry-run preview, and the `--yes`/`--soft` gates. Export it from `src/cli/handlers/{resource}-write.ts`
3. Add an `ActionSpec` entry to the matching `src/cli/metadata/{resource}.ts`, including its `handler:` field — `dispatch.ts` derives `HANDLERS` from `ACTIONS`, and `src/cli/help.ts` derives `--help` from it (no separate dispatch/HELP edits)
4. Add unit tests to `tests/cli-write-handlers.test.ts` (happy + dry-run + body reject + path-param reject) and a subprocess case to `tests/cli.test.ts`
5. Run `npm run codemap` and `npm run skill` to regenerate CODEMAP.md and skill/SKILL.md

**Add CLI attachment-style action (binary file I/O):**

1. The programmatic method (`addAttachmentTo*` / `getAttachment` / `deleteAttachment`) already exists in `src/modules/attachments.ts` and is exposed via `TestRailClient`
2. Pick the I/O shape: file upload → `fileInput: true` in metadata + `resolveFile()` from `src/cli/file-input.ts`; binary download → `fileOutput: true` + `resolveOut()` from `src/cli/file-output.ts`; destructive op → `destructive: true` + check `ctx.confirmDestructive`
3. Add handler to `src/cli/handlers/attachment.ts` (read) or `attachment-write.ts` (write). Upload handlers use the shared `setupUpload()` helper for dry-run preview + content read; `attachment delete` uses `createDestructiveHandler`
4. Add an `ActionSpec` entry (with its `handler:` field) to `src/cli/metadata/attachments.ts` — dispatch + `--help` derive from `ACTIONS` automatically
5. Add unit tests to `tests/cli-attachment-handlers.test.ts` (happy + dry-run + missing-flag + path-param reject; delete actions add `--yes` gate + dry-run-wins coverage) and a subprocess case to `tests/cli.test.ts`
6. Run `npm run codemap` and `npm run skill` to regenerate CODEMAP.md and skill/SKILL.md

**Destructive-ops convention:** `--yes` flag gates all destructive CLI actions. `--dry-run` wins over `--yes` (preview-without-API). Set `destructive: true` in metadata so the skill generator surfaces the gate in the command table.

**`--soft` vs `--dry-run` (case delete-bulk):** `--soft` adds TestRail's `soft=1` query param — a _server-side_ preview where TestRail returns affected-test counts without deleting. The CLI still hits the API. `--dry-run` is _client-side_ — no API call at all. They are independent: `--dry-run --yes --soft` short-circuits before any request and emits a preview noting `soft: true`.

**Add text-response endpoint (rare — currently only `get_bdd`):** Call `this.client.request<string>({ method, endpoint, responseKind: 'text' })` from your module. With `responseKind: 'text'` the pipeline returns `Promise<string>` and (having no `schema`) does not participate in the validated cache. For CLI exposure, write text to `--out <path>` directly with `writeFileSync(path, text, 'utf-8')` — `resolveOut()` handles the path/force checks; do not extend `file-output.ts` to handle strings.

**Modify caching:** `getCachedData()` / `setCachedData()` / `cleanupExpiredCache()` in `src/client-core.ts`.

**Modify retry/rate limits:** Edit constants in `src/constants.ts`. Config overrides via `TestRailConfig.rateLimiter` / `maxRetries` / `timeout`.

## DO NOT

- Add runtime dependencies (zero-dep is intentional)
- Use `any` type (use `unknown` + narrowing)
- Mutate objects in-place (return new objects)
- Hardcode numeric values (use `src/constants.ts`)
- Call `request()` without ID validation
- Skip `npm run typecheck` before committing
