# CLAUDE.md

`@dichovsky/testrail-api-client` — type-safe TypeScript client for the TestRail API with caching, rate limiting, retry logic, and robust error handling.

## Commands

```bash
npm install          # Install dependencies
npm test             # Run tests (Vitest)
npm run test:coverage
npm run test:watch
npm run build        # TypeScript compilation → dist/
npm run lint
npm run typecheck
npx vitest run tests/client.test.ts  # Single file
```

## Core Files

| File            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `src/client.ts` | Main client class — all API methods, caching, rate limiting, retry |
| `src/types.ts`  | TypeScript interfaces for all TestRail entities and payloads       |
| `src/utils.ts`  | `base64Encode`, `sleep` helpers                                    |
| `src/index.ts`  | Public API exports                                                 |

## Architecture

**Caching:** LRU-style Map with TTL. Keys: `{method}:{endpoint}`. Config: `enableCache`, `cacheTtl`, `maxCacheSize`. All GETs cached unless `skipCache=true`.

**Rate Limiter:** Sliding window over `rateLimiter.requests[]`. Throws `TestRailApiError` when limit exceeded. Default: 100 req/min.

**Retry:** Exponential backoff `min(1000 * 2^n, 10000)` ms. Retries: 5xx, 429, network errors. No retry on timeout or 4xx.

**Errors:** `TestRailApiError` (HTTP/network, has `status`/`statusText`/`response`). `TestRailValidationError` (config/params). After `destroy()` any call throws `Error`.

**IDs:** All numeric IDs validated as positive integers via `validateId()` before API calls.

## Tests

140+ cases, 97.6%+ coverage (Vitest). Files: `client.test.ts` (CRUD), `enhanced-features.test.ts` (cache/rate/retry), `coverage-improvement.test.ts` (edge cases), `index.test.ts` (exports), `performance.test.ts`, `types.test.ts`, `utils.test.ts`. Shared test helpers in `tests/helpers.ts`.

## Common Tasks

**Add API endpoint:**

1. Add payload interface to `src/types.ts` if needed
2. Validate via `validateId()` or custom check
3. Implement with `this.request(method, endpoint, payload)`

**Modify caching:** Logic in `getCachedData()` / `setCachedData()` / `cleanupExpiredCache()`.

**Modify retry/rate limits:** Constants `BASE_RETRY_DELAY_MS`, `MAX_RETRY_DELAY_MS`, `MAX_TIMEOUT_MS` at top of `client.ts`. Rate limiter config via `TestRailConfig.rateLimiter`.
