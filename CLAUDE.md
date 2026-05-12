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

| File                                                    | Purpose                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/client-core.ts`                                    | HTTP pipeline, cache, rate limiter, retry, lifecycle                                                                            |
| `src/client.ts`                                         | `TestRailClient` facade composing domain modules; re-exports their methods                                                      |
| `src/modules/*.ts`                                      | Per-domain endpoint methods (cases, runs, results, projects, suites, sections, plans, tests, milestones, …)                     |
| `src/types.ts`                                          | Response interfaces + payload types that aren't Zod-derived (e.g., `AddPlanEntryPayload`, `GetCasesOptions`)                    |
| `src/schemas.ts`                                        | Zod schemas for API responses **and** write payloads; source of truth for `AddCasePayload`, `AddRunPayload`, etc. via `z.infer` |
| `src/errors.ts`                                         | `TestRailApiError`, `TestRailValidationError`, `handleZodError`                                                                 |
| `src/constants.ts`                                      | All numeric constants (timeouts, cache, rate limits)                                                                            |
| `src/utils.ts`                                          | `base64Encode`, `sleep`                                                                                                         |
| `src/cli.ts`                                            | Binary entrypoint: 1-line re-export of `src/cli/index.ts` (preserves `bin: testrail` and `./cli` subpath export)                |
| `src/cli/index.ts`                                      | CLI entry: arg parse, dispatch, auth, handler invocation (wrapped in `async main()`)                                            |
| `src/cli/{auth,output,ids,dispatch,handler-context}.ts` | CLI infrastructure (env+flag resolution, JSON/table rendering, ID parsing, handler-table dispatch, shared types)                |
| `src/cli/handlers/*.ts`                                 | One async handler per resource:action (project/suite/case/run/result/milestone/user, read-only as of v2.0)                      |
| `src/index.ts`                                          | Public barrel exports                                                                                                           |
| `CODEMAP.md`                                            | Symbol index with exact file:line refs (auto-gen)                                                                               |
| `scripts/generate-codemap.js`                           | Regenerates CODEMAP.md from source                                                                                              |

## API Symbol Index

See **[CODEMAP.md](CODEMAP.md)** for every method, type, error class, and constant with exact file:line links.

## Architecture Invariants

**Class hierarchy:** `TestRailClientCore` (client-core.ts) → `TestRailClient` (client.ts). Infrastructure lives in core; endpoint methods in client.

**URL construction:** `{baseUrl}/index.php?/api/v2/{endpoint}`. Query params appended with `&` (not `?`): `get_sections/1&suite_id=2`. Use `buildEndpoint(base, params)`.

**Caching:** GET-only LRU Map with TTL. Cache key: `GET:{endpoint}`. Any POST invalidates entire cache (`clearCache()`). Pass `skipCache=true` as 5th arg to `request()` to bypass.

**Rate limiter:** Sliding window on `rateLimiter.requests[]`. Throws `TestRailApiError` on limit exceeded. Default: 100 req/60s.

**Retry:** `min(1000 × 2^n, 10000)` ms backoff. Retries on: 5xx, 429, network errors. No retry on: 4xx, AbortError (timeout).

**Lifecycle:** Instances auto-register in module-level `activeClients Set`. `destroy()` stops cleanup timer, clears cache, removes from set. Process signal handlers (exit/SIGINT/SIGTERM) call `destroy()` on all active instances.

**ID validation:** All numeric IDs checked as positive integers via `protected validateId(id, name)` before any API call.

## Error Model

| Class                     | Thrown when                                                   | Has                                |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| `TestRailApiError`        | HTTP error, network error, rate limit, timeout, invalid JSON  | `status`, `statusText`, `response` |
| `TestRailValidationError` | Bad config (baseUrl/email/apiKey), invalid ID, invalid params | —                                  |
| `Error`                   | Call after `destroy()`                                        | —                                  |

## Constants (`src/constants.ts`)

`BASE_RETRY_DELAY_MS=1000` · `MAX_RETRY_DELAY_MS=10000` · `MAX_TIMEOUT_MS=300000` · `DEFAULT_TIMEOUT_MS=30000` · `DEFAULT_MAX_RETRIES=3` · `DEFAULT_CACHE_TTL_MS=300000` · `DEFAULT_CACHE_CLEANUP_INTERVAL_MS=60000` · `DEFAULT_MAX_CACHE_SIZE=1000` · `DEFAULT_RATE_LIMIT_MAX_REQUESTS=100` · `DEFAULT_RATE_LIMIT_WINDOW_MS=60000`

## Tests

538 cases, 98%+ coverage (Vitest + V8). Shared helpers in `tests/helpers.ts`.

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

**Modify caching:** `getCachedData()` / `setCachedData()` / `cleanupExpiredCache()` in `src/client-core.ts`.

**Modify retry/rate limits:** Edit constants in `src/constants.ts`. Config overrides via `TestRailConfig.rateLimiter` / `maxRetries` / `timeout`.

## DO NOT

- Add runtime dependencies (zero-dep is intentional)
- Use `any` type (use `unknown` + narrowing)
- Mutate objects in-place (return new objects)
- Hardcode numeric values (use `src/constants.ts`)
- Call `request()` without ID validation
- Skip `npm run typecheck` before committing
