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
| `src/client.ts`                                         | `TestRailClient` facade composing domain modules; re-exports their methods                                                                        |
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

**Class hierarchy:** `TestRailClientCore` (client-core.ts) → `TestRailClient` (client.ts). Infrastructure lives in core; endpoint methods in client.

**URL construction:** `{baseUrl}/index.php?/api/v2/{endpoint}`. Query params appended with `&` (not `?`): `get_sections/1&suite_id=2`. Use `buildEndpoint(base, params)`.

**Caching:** GET-only LRU Map with TTL. Cache key: `GET:{endpoint}`. Any POST invalidates entire cache (`clearCache()`). Pass `skipCache=true` as 5th arg to `request()` to bypass.

**Rate limiter:** Sliding window on `rateLimiter.requests[]`. Throws `TestRailApiError` on limit exceeded. Default: 100 req/60s.

**Retry:** `min(1000 × 2^n, 10000)` ms backoff. **GET** retries on: 5xx, 429, network errors. **POST/PUT/DELETE** retries only on 429 (rate-limited writes are rejected before execution); 5xx and network errors surface immediately to prevent duplicate writes. No retry on: 4xx, AbortError (timeout). `requestUpload` never retries. **`Retry-After`** (RFC 7231 §7.1.3) is honored on every retryable response — 429 for all methods and 5xx on GET (`request`/`requestText`) plus all 5xx on `requestBinary` (GET-only by construction). The header accepts delta-seconds or HTTP-date, is capped at `MAX_RETRY_DELAY_MS`, and falls back to exponential backoff when absent, zero, in the past, or unparseable so a buggy server cannot induce a hot retry loop.

**Redirects (3xx):** All four fetch sites set `redirect: 'manual'` and pipe the response through `assertNotRedirect()`. A 3xx surfaces as `TestRailApiError` with the blocked `Location` embedded in `response`, never retries, and never poisons the GET cache. Closes the SSRF guard hole where a `Location` header pointing at a private/metadata IP would have bypassed `validateBaseUrl` + DNS pinning.

**Response-body limits (SEC #12 + SEC #21):** Every fetch site reads the body through `readBodyWithLimits()` (`src/body-reader.ts`). Two caps apply: a **byte ceiling** (`maxJsonResponseBytes`, default 10 MiB — also used for text bodies and error payloads; `maxBinaryResponseBytes`, default 100 MiB — `requestBinary` success path only) and a **wall-clock deadline** (`bodyTimeout`, default = `timeout`). Exceeding either surfaces as `TestRailApiError(0, 'Response body too large' | 'Body read timeout', …)` with no retry. The header `timeout` is cleared after fetch returns; the body deadline is independent so a server that sends headers fast then dribbles bytes can no longer hold a socket open indefinitely. Config validator caps both byte limits at `MAX_RESPONSE_BYTES_LIMIT` (1 GiB) so a caller cannot disable the guard with `Number.MAX_SAFE_INTEGER`. A non-streaming fallback exists for Response-like objects without `body.getReader()` (test mocks); it enforces the byte cap post-read but loses the slowloris protection.

**Lifecycle:** Instances auto-register in module-level `activeClients Set`. `destroy()` stops cleanup timer, clears cache, zeros credential, removes from set. Process signal handlers (`exit`/`SIGINT`/`SIGTERM`) are **opt-in** via `registerProcessHandlers: true` on `TestRailConfig` (default `false`, SEC #8 — library consumers must not have their signal chain hijacked). When opted in, handlers call `destroy()` on every active instance; SIGINT/SIGTERM additionally `process.exit(130/143)`. The CLI (`src/cli/index.ts`) opts in; library callers should leave the flag off and call `destroy()` from their own shutdown hook. Once installed for a process, handlers persist for its lifetime (no safe deregistration without per-client ownership tracking).

**ID validation:** All numeric IDs checked as positive integers via `protected validateId(id, name)` before any API call.

## Error Model

| Class                     | Thrown when                                                   | Has                                |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP error, network error, rate limit, timeout, invalid JSON  | `status`, `statusText`, `response` |
| `TestRailValidationError` | Bad config (baseUrl/email/apiKey), invalid ID, invalid params | —                                  |
| `Error`                   | Call after `destroy()`                                        | —                                  |

## Constants (`src/constants.ts`)

`BASE_RETRY_DELAY_MS=1000` · `MAX_RETRY_DELAY_MS=10000` · `MAX_TIMEOUT_MS=300000` · `DEFAULT_TIMEOUT_MS=30000` · `DEFAULT_MAX_RETRIES=3` · `DEFAULT_CACHE_TTL_MS=300000` · `DEFAULT_CACHE_CLEANUP_INTERVAL_MS=60000` · `DEFAULT_MAX_CACHE_SIZE=1000` · `DEFAULT_RATE_LIMIT_MAX_REQUESTS=100` · `DEFAULT_RATE_LIMIT_WINDOW_MS=60000` · `DEFAULT_MAX_JSON_RESPONSE_BYTES=10485760` (10 MiB) · `DEFAULT_MAX_BINARY_RESPONSE_BYTES=104857600` (100 MiB) · `MAX_RESPONSE_BYTES_LIMIT=1073741824` (1 GiB ceiling)

## Tests

1213 cases, 98%+ coverage (Vitest + V8). Shared helpers in `tests/helpers.ts`.

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

1. Add the response Zod schema + inferred type to `src/schemas.ts` (or extend an existing one). For write endpoints, also add a payload schema there
2. Add the method to the relevant module in `src/modules/` (e.g., `cases.ts` for case endpoints) — modules expose methods via the `TestRailClient` facade
3. Validate IDs with `this.validateId(id, 'paramName')` before any network call
4. Call `this.request<ReturnType>('GET'|'POST', endpoint, payload?)`
5. Add response schema and inferred type re-exports to `src/index.ts` if they're public
6. Add a test case to the matching `tests/client-*.test.ts` file
7. Run `npm run codemap` to update CODEMAP.md

**Add CLI write action:**

1. Add a Zod payload schema to `src/schemas.ts` if one doesn't exist (mirror the existing `Add*PayloadSchema` pattern with `zObject()` for `.passthrough()`)
2. Create or extend the appropriate write handler file (`src/cli/handlers/{resource}-write.ts`); each handler: parses path params via `parseId(ctx.args.pathParams[N], 'name')`, resolves body via `resolveBody(ctx.bodyInput, Schema)`, checks `ctx.dryRun`, calls the client method
3. Register `'{resource}:{action}': handle{Resource}{Action}` in `src/cli/dispatch.ts` HANDLERS (RESOURCES auto-derives)
4. Add an `ActionSpec` entry to `ACTIONS` in `src/cli/metadata.ts` (skill generator + drift tests consume this)
5. Update the HELP text in `src/cli/index.ts`
6. Add unit tests to `tests/cli-write-handlers.test.ts` (happy + dry-run + body reject + path-param reject) and a subprocess case to `tests/cli.test.ts`
7. Run `npm run codemap` to update CODEMAP.md

**Add CLI attachment-style action (binary file I/O):**

1. The programmatic method (`addAttachmentTo*` / `getAttachment` / `deleteAttachment`) already exists in `src/modules/attachments.ts` and is exposed via `TestRailClient`
2. Pick the I/O shape: file upload → `fileInput: true` in metadata + `resolveFile()` from `src/cli/file-input.ts`; binary download → `fileOutput: true` + `resolveOut()` from `src/cli/file-output.ts`; destructive op → `destructive: true` + check `ctx.confirmDestructive`
3. Add handler to `src/cli/handlers/attachment.ts` (read) or `attachment-write.ts` (write). Upload handlers use the shared `setupUpload()` helper for dry-run preview + content read
4. Register in `src/cli/dispatch.ts` HANDLERS and add an `ActionSpec` entry to `ACTIONS` in `src/cli/metadata.ts`
5. Update HELP text in `src/cli/index.ts` under "Attachment actions"
6. Add unit tests to `tests/cli-attachment-handlers.test.ts` (happy + dry-run + missing-flag + path-param reject; delete actions add `--yes` gate + dry-run-wins coverage) and a subprocess case to `tests/cli.test.ts`
7. Run `npm run codemap` and `npm run skill` to regenerate CODEMAP.md and skill/SKILL.md

**Destructive-ops convention:** `--yes` flag gates all destructive CLI actions. `--dry-run` wins over `--yes` (preview-without-API). Set `destructive: true` in metadata so the skill generator surfaces the gate in the command table.

**`--soft` vs `--dry-run` (case delete-bulk):** `--soft` adds TestRail's `soft=1` query param — a _server-side_ preview where TestRail returns affected-test counts without deleting. The CLI still hits the API. `--dry-run` is _client-side_ — no API call at all. They are independent: `--dry-run --yes --soft` short-circuits before any request and emits a preview noting `soft: true`.

**Add text-response endpoint (rare — currently only `get_bdd`):** Use `this.client.requestText('GET'|'POST', endpoint)` from your module instead of `request<T>()`. `requestText()` shares the retry/rate-limit/timeout/DNS pipeline but returns `Promise<string>` and intentionally bypasses the GET-LRU cache (so its key cannot collide with a JSON `request<T>()` to the same endpoint). For CLI exposure, write text to `--out <path>` directly with `writeFileSync(path, text, 'utf-8')` — `resolveOut()` handles the path/force checks; do not extend `file-output.ts` to handle strings.

**Modify caching:** `getCachedData()` / `setCachedData()` / `cleanupExpiredCache()` in `src/client-core.ts`.

**Modify retry/rate limits:** Edit constants in `src/constants.ts`. Config overrides via `TestRailConfig.rateLimiter` / `maxRetries` / `timeout`.

## DO NOT

- Add runtime dependencies (zero-dep is intentional)
- Use `any` type (use `unknown` + narrowing)
- Mutate objects in-place (return new objects)
- Hardcode numeric values (use `src/constants.ts`)
- Call `request()` without ID validation
- Skip `npm run typecheck` before committing
