# TypeScript SDK

Use `TestRailClient` in TypeScript or JavaScript applications that need typed responses, shared rate limiting, caching, or structured errors.
The package uses ESM and requires Node.js 26 or newer.
Published declaration files are tested with TypeScript 7. Other compiler versions are not tested.
TypeScript is not a runtime or peer dependency of the package.

[Create a client](#create-a-client) · [Configuration](#configuration) · [Lifecycle](#lifecycle) · [Caching and retries](#caching-and-retries) · [Pagination](#pagination) · [Response validation](#response-validation) · [Error handling](#error-handling) · [Custom fields](#custom-fields)

## Create a client

```bash
npm install @dichovsky/testrail-api-client
```

Set `TESTRAIL_BASE_URL`, `TESTRAIL_EMAIL`, and `TESTRAIL_API_KEY` in your environment, then create a client:

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const config = {
    baseUrl: process.env['TESTRAIL_BASE_URL']!, // https://your-domain.testrail.io
    email: process.env['TESTRAIL_EMAIL']!,
    apiKey: process.env['TESTRAIL_API_KEY']!,
};

const client = new TestRailClient(config);
try {
    const project = await client.projects.getProject(1);
    console.log(project.name);
    // Put additional task snippets here, before cleanup.
} finally {
    client.destroy();
}
```

Task snippets below belong inside this `try` block and use its live `client`.
Configuration snippets extend `config` before you construct a client.
Replace example IDs with IDs from your TestRail instance.

Call methods through their resource namespace, such as `client.projects` or `client.results`.
The [API mapping](API-MAPPING.md) lists endpoints, SDK methods, and CLI commands.
The [SDK recipes](../skill/reference/typescript-api.md) provide more examples.

### Write data

```typescript
const run = await client.runs.addRun(5, {
    suite_id: 12,
    name: 'CI build',
    include_all: false,
    case_ids: [42, 43, 44],
});
await client.results.addResultForCase(run.id, 42, { status_id: 1, comment: 'Passed' });
```

SDK payload types check input at compile time. SDK methods do not validate write payloads at runtime.
For dynamic input, parse the exported Zod schema before writing:

```typescript
// Add this import at module scope.
import { AddResultPayloadSchema } from '@dichovsky/testrail-api-client';

const input: unknown = JSON.parse('{"comment":"Investigating"}');
const payload = AddResultPayloadSchema.parse(input);
await client.results.addResult(1001, payload);
```

A new result needs at least one of `status_id`, `comment`, or `assignedto_id`.
Although each field is optional in TypeScript, the schema rejects an empty object during `.parse()`.
Schemas preserve `custom_*` fields and do not coerce types: `"5"` stays a string.
The [CLI](CLI.md) validates write payloads automatically. Its destructive-action gates apply only to CLI commands.

### Delete previews

`cases.deleteCase()`, `cases.deleteCases()`, `runs.deleteRun()`, `sections.deleteSection()`, and `suites.deleteSuite()` accept `{ soft: true }` for server-side previews.
These previews send `soft=1` and return `SoftDeletePreview` without deleting data.
Without soft mode, the methods delete data and return `undefined`.

Each method reads `options.soft` once when called.
That value determines the URL, response schema, and whether the method returns a preview.
Changing `options.soft` while the request is pending does not change these choices.

## Configuration

Only `baseUrl`, `email`, and `apiKey` are required.
The constructor validates configuration before any request.
Defaults come from [`src/constants.ts`](../src/constants.ts).

| Option                    | Type                | Default            | Meaning                                                                                                                                                                            |
| ------------------------- | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                 | `string`            | Required           | HTTPS TestRail URL with no query string or fragment; HTTP requires `allowInsecure`                                                                                                 |
| `email`                   | `string`            | Required           | TestRail account email                                                                                                                                                             |
| `apiKey`                  | `string`            | Required           | TestRail API key                                                                                                                                                                   |
| `timeout`                 | `number`            | `30000`            | Per-attempt timeout in milliseconds, including DNS; maximum 5 minutes                                                                                                              |
| `maxRetries`              | `number`            | `3`                | Retry attempts; integer from 0 through 10                                                                                                                                          |
| `enableCache`             | `boolean`           | `true`             | Store GET responses in memory                                                                                                                                                      |
| `cacheTtl`                | `number`            | `300000`           | Cache lifetime in milliseconds                                                                                                                                                     |
| `cacheCleanupInterval`    | `number`            | `60000`            | Cleanup interval in milliseconds; integer from 0 through 2,147,483,647; 0 disables cleanup                                                                                         |
| `maxCacheSize`            | `number`            | `1000`             | Maximum cache entries; 0 removes the limit                                                                                                                                         |
| `rateLimiter`             | `RateLimiterConfig` | 100 / 60 seconds   | `{ maxRequests, windowMs }` sliding window                                                                                                                                         |
| `allowInsecure`           | `boolean`           | `false`            | Allow cleartext HTTP                                                                                                                                                               |
| `allowPrivateHosts`       | `boolean`           | `false`            | Allow private, loopback, and link-local hosts                                                                                                                                      |
| `maxJsonResponseBytes`    | `number`            | `10485760`         | JSON, text, and error body limit: 10 MiB; maximum 1 GiB                                                                                                                            |
| `maxBinaryResponseBytes`  | `number`            | `104857600`        | Successful binary body limit: 100 MiB; maximum 1 GiB                                                                                                                               |
| `bodyTimeout`             | `number`            | `timeout`          | Body-read deadline in milliseconds; 0 disables it; maximum 5 minutes                                                                                                               |
| `registerProcessHandlers` | `boolean`           | `false`            | Register cleanup handlers for `exit`, `SIGINT`, and `SIGTERM`                                                                                                                      |
| `fetch`                   | `typeof fetch`      | `globalThis.fetch` | Custom transport; must honor the supplied dispatcher or enforce equivalent checks. On a failure, `error.cause` is a copy of only `name`, `message`, `code`, `errno`, and `syscall` |
| `dnsLookup`               | `function`          | System DNS         | Custom resolver for host validation and connection pinning                                                                                                                         |
| `onSchemaMismatch`        | `function`          | None; silent       | Synchronous callback for a response schema mismatch                                                                                                                                |

`timeout` covers DNS resolution, connection, upload, and response headers for each attempt.
`bodyTimeout` separately limits the response-body read. Body byte or time limits throw `TestRailApiError` without retrying.

Use `client.withTimeout(milliseconds)` to change timeouts for calls through a view of the same client.
The view shares credentials, rate limits, cached responses, and cleanup with the original client.
An implicit `bodyTimeout` follows the view's timeout; an explicitly configured value stays unchanged.
Calling `destroy()` on a view destroys the shared client and its other views.

See [networking](NETWORKING.md) for private servers, DNS resolvers, proxies, and certificate authorities.

## Lifecycle

Call `client.destroy()` in `finally` or your application's shutdown hook.
It stops cache cleanup, clears cached entries and credentials, and disables further requests.
Library callers should leave `registerProcessHandlers` at `false`; the CLI enables it automatically.

Use `trackOperation` when you must wait for transport cleanup before releasing a concurrency slot or deleting temporary files:

```typescript
const operation = client.trackOperation(() => client.projects.getAllProjects({ maxDurationMs: 1000 }));
try {
    const projects = await operation.result;
    console.log(projects.length);
} finally {
    await operation.settled;
    // Release the concurrency slot or temporary files here.
}
```

| Promise             | Completes when                                                                  |
| ------------------- | ------------------------------------------------------------------------------- |
| `operation.result`  | The callback returns, fails, or times out                                       |
| `operation.settled` | The callback and all associated client tasks finish; this promise never rejects |

Tracked tasks include DNS, HTTP requests, body reads, stream cancellation, uploads, retries, and shared requests.
A timeout can reject `result` while `settled` still waits for cleanup.
Neither `trackOperation` nor `destroy()` cancels in-flight requests. Destroying the client does not settle their handles.
If a custom transport or cancellation task never finishes, `settled` remains pending even after an abort request.

Return the complete workflow promise from the callback. Tracking includes nested operations but excludes application timers that the callback does not await.
A request started before the first `trackOperation` call can share its result, but tracking cannot include its later cleanup.
See [architecture](ARCHITECTURE.md) for resource ownership and upload cleanup mechanics.

## Upload files

Upload methods accept `Blob`, `File`, `Uint8Array`, or `{ path, type?, fd? }` inputs.
With `path` alone, the SDK opens the file for streaming when preparing the request.

Passing an open `fd` transfers responsibility for closing it to the SDK when you call the upload method.
This rule includes invalid IDs, invalid request options, and calls after `destroy()`.
Open a separate descriptor for each upload. Do not close or reuse it after the call.
Existing callers that closed descriptors after early rejection must remove that cleanup.

On macOS and Linux, uploads read through the descriptor to preserve the originally opened file.
Other platforms close the descriptor during preparation and read through `path`.
The SDK does not mutate your input object or caller-owned `Blob`.

A timeout can arrive before all transport work finishes.
Use `trackOperation().settled` before deleting temporary files or releasing resources needed by unfinished work.
Multipart uploads never retry automatically.

## Caching and retries

| Request                   | Response cache                                         | Automatic retries                                     |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Ordinary JSON GET         | LRU cache with TTL; concurrent requests can share work | 429, 5xx, and network errors                          |
| `get*Page()`              | Separate cache for validated pages                     | 429, 5xx, and network errors                          |
| `getAll*()`               | No cache reads, writes, or shared requests             | 429, 5xx, and network errors, within aggregate limits |
| Text or binary GET        | No cache                                               | 429, 5xx, and network errors                          |
| Report-generation GET     | No cache or shared requests                            | 429 only                                              |
| JSON POST, PUT, or DELETE | Clears the cache once dispatched, whatever the outcome | 429 only                                              |
| Multipart upload          | Clears the cache once dispatched, whatever the outcome | Never                                                 |

Every dispatched write attempt invalidates stored and in-flight cache entries once: before response parsing when the response is successful, and as soon as the attempt fails for an error status, a network failure, a timeout, or a blocked redirect. Writes rejected before dispatch leave the cache intact.
Schema mismatches never enter the cache.
Concurrent JSON GETs share work only when their header and body timeouts match, even when `enableCache` is `false`.
Completed entries remain shared across timeout views. Call `client.clearCache()` to clear the cache explicitly.

The cache copies values on storage and retrieval, and callers that join an in-flight request each receive their own copy. Changing a returned object cannot alter a cached entry or another caller's result.
Copying costs increase with payload size, and `maxCacheSize` counts entries rather than bytes.
Reduce `maxCacheSize` or `maxJsonResponseBytes` for large responses; setting `maxCacheSize` to 0 removes its memory bound.

Retries use exponential backoff, starting at 1 second and capped at 10 seconds.
A valid `Retry-After` header overrides backoff up to that cap, including on retryable GET 5xx responses.
Missing, zero, past, or invalid values use backoff. Other 4xx responses, abort timeouts, body-limit failures, a transport failure while a successful response body is read, and redirects never retry. A DNS resolver failure is a network error and follows the network-error retry policy.
All requests reject HTTP redirects with `TestRailApiError`.

The local sliding-window limiter rejects excess new calls before `fetch`; adjust `rateLimiter` to match your TestRail quota.
Retries count against the window but are not rejected by this local check.
TestRail Cloud normally omits `Retry-After` and `X-RateLimit-*` headers, so local rate limiting remains the primary control.

`reports.runReport()` and `reports.runCrossProjectReport()` generate a new report on every call and can send email.
An HTTP 429 rejects these requests before execution. A 5xx or network error can leave the outcome uncertain.
Inspect server state before starting another report or repeating a write after an uncertain outcome.

## Pagination

The 24 paginated endpoints provide three methods:

| Need                            | SDK method   | Returns                 | Requests              |
| ------------------------------- | ------------ | ----------------------- | --------------------- |
| Items from one response         | `get*()`     | `T[]`                   | One                   |
| One response with page metadata | `get*Page()` | Discriminated `Page<T>` | One                   |
| All items within safety limits  | `getAll*()`  | Combined `T[]`          | Follows `_links.next` |

```typescript
const first = await client.runs.getRuns(5);
const page = await client.runs.getRunsPage(5, { limit: 25, offset: 50 });
const all = await client.runs.getAllRuns(5, { pageSize: 100, maxItems: 10_000 });
```

Envelope pages include `offset`, `limit`, `size`, and `_links`.
A legacy bare array produces `kind: 'legacy-array'` and ends pagination after that response.
The client extracts validated `offset` and optional `limit` values from `_links.next` and rebuilds the original endpoint locally.
It never follows the link's host or path.

Case and BDD list filters accept `refs` as a string or string array.
A string keeps the legacy scalar query; an array sends repeated `refs[]` parameters supported by TestRail 10.7 and newer.

| Aggregate option | Default                 | Hard ceiling            |
| ---------------- | ----------------------- | ----------------------- |
| `pageSize`       | `250`                   | `250`                   |
| `startOffset`    | `0`                     | Safe integer            |
| `maxPages`       | `100`                   | Safe integer            |
| `maxItems`       | `25_000`                | Safe integer            |
| `maxDurationMs`  | `300_000` (5 minutes)   | `300_000`               |
| `maxBytes`       | `104_857_600` (100 MiB) | `1_073_741_824` (1 GiB) |

Aggregate controls require positive safe integers; `startOffset` also accepts zero.
`getAll*()` never returns partial results. The byte limit measures UTF-8 serialized items.
Malformed pages, unsafe continuations, or exceeded limits throw `TestRailPaginationError` with `reason`, `pagesFetched`, and `itemsFetched`.
Reasons are `max_pages`, `max_items`, `max_duration`, `max_bytes`, `invalid_page`, `invalid_continuation`, and `non_progress`.
Aggregate reads bypass cached pages to avoid mixing older cached responses with fresh requests.
Fresh pages do not guarantee a server-wide snapshot; server data can change while the client collects pages.

Supported resources include cases, case history, project BDDs, projects, suites, sections, plans, runs, tests, milestones, and three result lists.
They also include labels, shared steps and their history, case/run/plan attachments, datasets, variables, roles, groups, and case statuses.

Shared-step history, datasets, variables, roles, groups, and case statuses use server-provided pagination controls.
Their aggregate methods accept safety bounds but do not accept `pageSize` or `startOffset`.
Test attachments, plan-entry attachments, users, and ordinary metadata, configuration, and report lists return one response only.
TestRail 10.10 documents `get_users` as paginated, so `users.getUsers()` can return only the first 250 users on such a server.
This truncation is not verified on a live server; see the [compatibility audit](TESTRAIL-10.7.0-COMPATIBILITY.md#known-gaps-against-testrail-108-1010-checked-2026-11-21).
A method accepting `limit` or `offset` does not necessarily provide `get*Page()` or `getAll*()`.
See the [API mapping](API-MAPPING.md) for endpoint coverage and the [CLI guide](CLI.md#pagination) for equivalent flags.
The [bounded pagination example](../examples/bounded-pagination.ts) reads one page and a bounded aggregate, then handles `TestRailPaginationError` by its `reason`.

## Response validation

Response validation is advisory. If an entity field differs from its schema, the SDK returns the raw response unchanged.
It calls `onSchemaMismatch` when configured and excludes that response from the cache.
Response types describe expected shapes; a field typed `number` can hold another server value.
Types can widen in any release to match observed responses. Pin an exact package version if you need fixed types.

Structural checks still apply after a non-throwing hook:

| Response problem                                               | Error                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| Malformed outer structure from a paginated endpoint's `get*()` | `TestRailApiError`                                       |
| Malformed page or aggregate continuation                       | `TestRailPaginationError`                                |
| Malformed `cases.addCases()` or `cases.updateCases()` response | `TestRailApiError` with an indeterminate-outcome message |

The hook runs before these checks. A throwing hook stops further decoding.
A hook error does not prove that a write failed: the server might already have changed state.
Reconcile uncertain writes before retrying them.

Direct `client.parse(schema, data, ctx)` calls retain advisory validation and mismatch-hook behavior.
Domain methods validate responses through `request()`, without calling public `parse()`.
Subclass or instance overrides of `parse()` therefore do not customize endpoint responses.
Use the supported `onSchemaMismatch` hook for mismatch reporting or strict validation, as shown below.
Apply response transformations explicitly after awaiting a domain method.

The constructor requires a function for `onSchemaMismatch`. The hook must be synchronous; returning a Promise throws `TestRailValidationError`.
To report mismatches, log only safe metadata. Exclude raw endpoint queries, bodies, issue messages, and field names:

```typescript
// Add this import at module scope.
import type { TestRailConfig } from '@dichovsky/testrail-api-client';

const observedConfig: TestRailConfig = {
    ...config,
    onSchemaMismatch: ({ method, error }) => {
        console.warn({
            method,
            issues: error.issues.map(({ code, path }) => ({
                code,
                path: path.length === 0 ? '$' : `$.${path.map(() => '*').join('.')}`,
            })),
        });
    },
};
```

For strict SDK validation, throw `handleZodError(error)` synchronously:

```typescript
// Add this import at module scope.
import { handleZodError } from '@dichovsky/testrail-api-client';

const strictConfig: TestRailConfig = {
    ...config,
    onSchemaMismatch: ({ error }) => {
        throw handleZodError(error);
    },
};
```

This preserves `TestRailValidationError`; throwing the Zod error directly exposes `ZodError` instead.
Caller input checks remain strict: configuration and IDs validate before requests, and dynamic write payloads need explicit schema parsing.
The [CLI response-validation guide](CLI.md#response-validation) covers warnings and strict CLI behavior.
The [schema audit](schema-audit-2026-06-22.md) records observed differences from TestRail's documentation.

## Error handling

| Error                     | Meaning                                                       | Useful properties                        |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `TestRailApiError`        | HTTP, network, or protocol failure                            | `status`, `statusText`, `response`       |
| `TestRailLicenseError`    | HTTP 403 that reports an Enterprise-license restriction       | `status`, `statusText`, `response`       |
| `TestRailPaginationError` | Invalid pagination or an exceeded aggregate limit             | `reason`, `pagesFetched`, `itemsFetched` |
| `TestRailValidationError` | Invalid configuration, ID, parameter, or strict-hook response | `message`                                |
| Standard `Error`          | Request after `client.destroy()`                              | `message`                                |

`TestRailPaginationError` extends `TestRailValidationError`; catch it first when you need pagination details.
`TestRailLicenseError` extends `TestRailApiError`; catch it first when you need to detect a feature that the TestRail license does not include.
Raw API bodies appear in `error.response`, never in `error.message`. They can contain sensitive data; avoid logging them.

```typescript
// Add these imports at module scope.
import { TestRailApiError, TestRailPaginationError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    await client.projects.getProject(999);
} catch (error) {
    if (error instanceof TestRailPaginationError) {
        console.error(error.reason, error.pagesFetched, error.itemsFetched);
    } else if (error instanceof TestRailApiError) {
        console.error('TestRail request failed', { status: error.status });
    } else if (error instanceof TestRailValidationError) {
        console.error('TestRail validation failed');
    }
    throw error;
}
```

Numeric IDs and numeric list filters must contain positive integers.
Invalid arrays such as `createdBy`, `statusId`, or `milestoneId` throw `TestRailValidationError` before any request.
The [CLI guide](CLI.md#diagnostic-files) explains redacted diagnostic files.
The [CI results example](../examples/publish-ci-results.ts) publishes a run with one bulk write and does not retry an uncertain write.

## Custom fields

`Case`, `Test`, and `Result` support flat `custom_*` fields whose values have type `unknown`.
Narrow them before use:

```typescript
const test = await client.tests.getTest(1001);
const browser = test['custom_browser'];
if (typeof browser === 'string') console.log(browser);
```

Their older `custom_fields` container remains deprecated for compatibility.
Zod's runtime passthrough preserves extra data without adding a broad string index to every public response type.
Declared response types include test/result case titles and references, case/result field system flags, and recursive milestone children.
See the [changelog](../CHANGELOG.md) for version-specific field additions.

After custom case-field creation, retain the creation response and verify scope and options before dependent case writes.
TestRail can temporarily omit the field from `get_case_fields`; this does not justify another creation request.
Use the [case-field readiness guide](CASE-FIELD-READINESS.md) for bounded polling with cancellation.
