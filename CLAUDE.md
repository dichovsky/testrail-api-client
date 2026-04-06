# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@dichovsky/testrail-api-client` is a comprehensive, type-safe TypeScript/JavaScript client for the TestRail API featuring intelligent caching, rate limiting, retry logic with exponential backoff, and robust error handling.

## Common Development Commands

```bash
# Install dependencies
npm install

# Run tests (Vitest)
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Build the project (TypeScript compilation)
npm run build

# Run linting (ESLint)
npm run lint

# Type checking only
npm run typecheck

# Single test file execution
npx vitest run tests/client.test.ts
```

## Prerequisites

- Node.js 20.x or higher
- npm

## Code Architecture

### Core Files

| File | Purpose |
|------|---------|
| `src/client.ts` | Main TestRail client class with all API methods, caching, rate limiting, retry logic |
| `src/types.ts` | TypeScript interfaces for all TestRail entities and payloads |
| `src/utils.ts` | Helper functions (base64Encode, sleep) |
| `src/index.ts` | Public API exports |

### Architecture Patterns

**Caching System:**
- LRU-style cache using Map with TTL expiration
- Automatic cleanup via interval timer (`cacheCleanupTimer`)
- Cache keys format: `{method}:{endpoint}` (e.g., `"GET:get_project/1"`)
- Configurable via `enableCache`, `cacheTtl`, `maxCacheSize`

**Rate Limiter:**
- Sliding window algorithm tracking request timestamps
- Stores request times in `rateLimiter.requests[]` array
- Auto-cleans old requests outside the time window
- Throws `TestRailApiError` when limit exceeded

**Retry Logic:**
- Exponential backoff: `min(1000 * 2^retry, 10000)` ms delay
- Retries on 5xx status codes, 429 (Too Many Requests), and network errors
- Does NOT retry timeout or client errors (4xx)

**Error Classes:**
- `TestRailApiError`: API/network errors with optional `status`, `statusText`, `response` properties
- `TestRailValidationError`: Configuration/parameter validation errors

### Key Implementation Details

1. **Cross-platform authentication**: Uses Node.js Buffer or browser btoa for Base64 encoding with Unicode support

2. **Request timeout handling**: Uses AbortController, does NOT retry on timeout

3. **Process cleanup handlers**: Registered once globally, cleans up all client instances on exit/SIGINT/SIGTERM

4. **ID validation**: All numeric IDs validated as positive integers before API calls via `validateId()` method

5. **HTTP protocol warning**: Console warning issued when using HTTP instead of HTTPS (credentials sent in Base64)

## Testing Structure

| Test File | Coverage |
|-----------|----------|
| `tests/client.test.ts` | Core client functionality, all CRUD operations |
| `tests/enhanced-features.test.ts` | Caching, rate limiting, retry logic |
| `tests/coverage-improvement.test.ts` | Validation errors, edge cases |
| `tests/index.test.ts` | Export and integration tests |
| `tests/performance.test.ts` | Performance and memory usage |
| `tests/types.test.ts` | Type definition validation |

### Running Tests

- 140+ test cases with 97.6%+ coverage
- High branch coverage (98.7%)
- Uses Vitest framework

## Development Guidelines

1. **TypeScript strict mode**: All code follows strict type checking
2. **JSDoc documentation**: Methods include comprehensive parameter descriptions
3. **ESLint configuration**: Security-focused rules with TypeScript-specific checks
4. **Async/await API**: Modern ES2022+ features throughout

## Common Tasks

**Adding a new API endpoint:**
1. Define the payload interface in `src/types.ts` if needed (e.g., `AddXxxPayload`)
2. Add validation in `validateId()` or create custom validation as needed
3. Implement method using `this.request()` with proper HTTP method and endpoint path
4. Add JSDoc comment describing parameters, return type, and possible errors

**Modifying caching behavior:**
- Cache logic is centralized in `getCachedData()`, `setCachedData()`, `cleanupExpiredCache()`
- All GET requests automatically check/use cache unless `skipCache=true`
- LRU behavior achieved by moving accessed entries to end of Map

**Adjusting retry/rate limit defaults:**
- Constants at top of `client.ts`: `BASE_RETRY_DELAY_MS`, `MAX_RETRY_DELAY_MS`, `MAX_TIMEOUT_MS`
- Rate limiter config passed via constructor options in `TestRailConfig.rateLimiter`

## Error Handling Patterns

**Custom Errors:**
```typescript
// API errors - network issues, HTTP status codes, malformed responses
throw new TestRailApiError('Message', status, statusText, response);

// Validation errors - invalid config or parameters
throw new TestRailValidationError('Message');
```

**Client Usage After Destroy:**
- Calling any method after `destroy()` throws generic `Error`
- `destroy()` is idempotent and called automatically on process exit

## Module System

This project uses ES modules (`"type": "module"` in package.json):
- All imports use `.js` extension (TypeScript requires this for ESM even with source .ts files)
- Exports from `src/index.ts` re-export types with explicit `./types.js` paths
- Built output goes to `dist/` directory via TypeScript compiler

## API Endpoint Pattern

All TestRail API calls follow the pattern: `{baseUrl}/index.php?/api/v2/{endpoint}`

Example endpoints used internally:
- `get_project/{id}`, `get_projects`, `get_cases/{projectId}`
- `add_case/{sectionId}`, `update_case/{caseId}`, `delete_case/{caseId}`
- `get_user_by_email&email={encodedEmail}` (note: no leading slash, query params appended)

Default rate limit is 100 requests per minute. Configure via `rateLimiter` option in constructor.
