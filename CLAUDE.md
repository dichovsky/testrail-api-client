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

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `src/client-core.ts`          | HTTP pipeline, cache, rate limiter, retry, lifecycle |
| `src/client.ts`               | All 36 API endpoint methods (extends client-core)    |
| `src/types.ts`                | All TypeScript interfaces and payload types          |
| `src/errors.ts`               | `TestRailApiError`, `TestRailValidationError`        |
| `src/constants.ts`            | All numeric constants (timeouts, cache, rate limits) |
| `src/utils.ts`                | `base64Encode`, `sleep`                              |
| `src/cli.ts`                  | CLI entry point (`bin: testrail`, `./cli` export)    |
| `src/index.ts`                | Public barrel exports                                |
| `CODEMAP.md`                  | Symbol index with exact file:line refs (auto-gen)    |
| `scripts/generate-codemap.js` | Regenerates CODEMAP.md from source                   |

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

456 cases, 98%+ coverage (Vitest + V8). Shared helpers in `tests/helpers.ts`.

| File                              | Covers                                   |
| --------------------------------- | ---------------------------------------- |
| `tests/client-endpoints.test.ts`  | All 36 API methods (CRUD)                |
| `tests/client-features.test.ts`   | Cache, rate limiter, retry, lifecycle    |
| `tests/client-edge-cases.test.ts` | Edge cases, signal handlers, error paths |
| `tests/client-projects.test.ts`   | Project CRUD                             |
| `tests/client-sections.test.ts`   | Section CRUD                             |
| `tests/cli.test.ts`               | CLI dispatch, auth resolution, rendering |
| `tests/exports.test.ts`           | Public API exports, inheritance          |
| `tests/performance.test.ts`       | Concurrent requests, throughput          |
| `tests/utils.test.ts`             | `base64Encode`, `sleep`                  |

## Common Tasks

**Add API endpoint:**

1. Add payload/response interfaces to `src/types.ts` if needed
2. Add method to `TestRailClient` in `src/client.ts`
3. Validate IDs with `this.validateId(id, 'paramName')`
4. Call `this.request<ReturnType>('GET'|'POST', endpoint, payload?)`
5. Export new types from `src/index.ts`
6. Run `npm run codemap` to update CODEMAP.md

**Modify caching:** `getCachedData()` / `setCachedData()` / `cleanupExpiredCache()` in `src/client-core.ts`.

**Modify retry/rate limits:** Edit constants in `src/constants.ts`. Config overrides via `TestRailConfig.rateLimiter` / `maxRetries` / `timeout`.

## DO NOT

- Add runtime dependencies (zero-dep is intentional)
- Use `any` type (use `unknown` + narrowing)
- Mutate objects in-place (return new objects)
- Hardcode numeric values (use `src/constants.ts`)
- Call `request()` without ID validation
- Skip `npm run typecheck` before committing
