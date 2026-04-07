# CLAUDE.md

**Project**: `@dichovsky/testrail-api-client` — type-safe TypeScript client with caching, rate limiting, retry logic, error handling.

## Commands
```bash
npm install           # deps
npm test              # Vitest
npm run test:coverage # coverage
npm run test:watch    # watch mode
npm run build         # TS compile
npm run lint          # ESLint
npm run typecheck     # types only
npx vitest run tests/client.test.ts  # single file
```

## Architecture
| File | Purpose |
|------|---------|
| `src/client.ts` | Client class: caching, rate limiting, retry logic |
| `src/types.ts` | TypeScript interfaces/payloads |
| `src/utils.ts` | Helpers (base64Encode, sleep) |
| `src/index.ts` | Public exports |

**Caching**: LRU Map with TTL; keys `{method}:{endpoint}`. Config: `enableCache`, `cacheTtl`, `maxCacheSize`.
**Rate Limiter**: Sliding window on `rateLimiter.requests[]`; default 100/min.
**Retry**: Exponential backoff `min(1000*2^retry, 10000)`ms; retries 5xx, 429, network errors (not timeouts/4xx).
**Errors**: `TestRailApiError` (status/response), `TestRailValidationError` (config params).

## Patterns
- Cross-platform Base64 (Node Buffer or browser btoa)
- AbortController for timeout (no retry)
- Global cleanup handlers on exit/SIGINT/SIGTERM
- ID validation: positive integers via `validateId()`
- HTTP warning logged (credentials in Base64)

## Testing
140+ tests, 97.6% coverage, 98.7% branch coverage. Vitest framework.

**Task pattern**: Define payload in types → validate → call `this.request()` → JSDoc.
- Caching: centralized in `getCachedData()`, `setCachedData()`, `cleanupExpiredCache()`
- Retry/rate limit: constants in client.ts; rate limiter via constructor config

## Module System
ESM (`"type": "module"`). Imports use `.js` extension. Output to `dist/`.

**API pattern**: `{baseUrl}/index.php?/api/v2/{endpoint}`
Examples: `get_project/{id}`, `add_case/{sectionId}`, `get_user_by_email&email={encodedEmail}`
