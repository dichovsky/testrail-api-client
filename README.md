# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe TypeScript client and `testrail` CLI for the [TestRail REST API](https://support.testrail.com/hc/en-us/articles/7077819069460-Using-the-API), with zero runtime dependencies beyond Zod. ESM only.

## Install

```bash
npm install @dichovsky/testrail-api-client
```

Requires Node.js 20.19+ (or 22.13+ / 24+).

## 30-second example

```typescript
import { TestRailClient, TestRailApiError } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: process.env.TESTRAIL_BASE_URL!, // https://your-domain.testrail.io
    email: process.env.TESTRAIL_EMAIL!,
    apiKey: process.env.TESTRAIL_API_KEY!,
});

try {
    // Read
    const project = await client.projects.getProject(1);
    console.log(project.name);

    // Write
    const run = await client.runs.addRun(project.id, {
        suite_id: 12,
        name: 'CI build',
        include_all: false,
        case_ids: [42, 43, 44],
    });
    await client.results.addResultForCase(run.id, 42, { status_id: 1, comment: 'Passed' });
} catch (error) {
    if (error instanceof TestRailApiError) {
        console.error(`HTTP ${error.status}: ${error.statusText}`);
    }
    throw error;
} finally {
    client.destroy(); // release timers, clear cache, zero the credential
}
```

The client surfaces the full TestRail REST API. See [`docs/API-MAPPING.md`](docs/API-MAPPING.md) for the endpoint-to-method matrix and [`CODEMAP.md`](CODEMAP.md) for exact signatures and `file:line` locations of every symbol.

## CLI quick tour

The package ships a `testrail` binary. Authenticate with environment variables, then read, write, or delete:

```bash
export TESTRAIL_BASE_URL="https://your-domain.testrail.io"
export TESTRAIL_EMAIL="you@example.com"
export TESTRAIL_API_KEY="…"                       # never pass the key on argv

testrail project list                              # read (JSON to stdout)
testrail run add 5 --data '{"name":"CI build","include_all":true}'   # write (Zod-validated)

# Destructive: needs BOTH the per-invocation --yes flag AND the process-wide env unlock
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run close 100 --yes
```

`--dry-run` previews any write or delete client-side with no API call. Output format is selectable with `--format <json|table|yaml|csv>`. See [`skill/SKILL.md`](skill/SKILL.md) for the complete command surface and recipes.

## Features

| Capability         | What it does                                                                         | Documented in                                     |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Response caching   | GET-only in-process LRU cache with TTL; any write invalidates it                     | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.3 |
| Rate limiting      | Sliding-window limiter (default 100 req/60s); rejects over-limit before fetch        | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.1 |
| Retry with backoff | Exponential backoff with `Retry-After`; GET retries 5xx/429/network, writes only 429 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.4 |
| SSRF guard         | Per-request DNS pin, private-host blocking, manual-redirect rejection                | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.5 |
| Response-body caps | Byte ceiling + wall-clock deadline on every body read                                | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.2 |
| Streaming uploads  | Attachment uploads stream from disk, so large files don't buffer in heap             | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2.4 |
| CLI                | `testrail` binary: read / write / destructive actions, four output formats           | [skill/SKILL.md](skill/SKILL.md)                  |
| AI-agent skill     | Auto-loading Claude Code skill + vendor-neutral `AGENTS.md`                          | [AGENTS.md](AGENTS.md)                            |

## Configuration

All options except `baseUrl` / `email` / `apiKey` are optional:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://your-domain.testrail.io',
    email: 'you@example.com',
    apiKey: 'your-api-key',

    timeout: 30000, // request timeout (ms)
    maxRetries: 3, // retry attempts for retryable failures
    enableCache: true, // cache GET responses
    cacheTtl: 300000, // cache TTL (ms)
    rateLimiter: { maxRequests: 100, windowMs: 60000 },
});
```

| Option                    | Type                | Default            | Description                                         |
| ------------------------- | ------------------- | ------------------ | --------------------------------------------------- |
| `baseUrl`                 | `string`            | **required**       | TestRail instance URL (http/https)                  |
| `email`                   | `string`            | **required**       | TestRail user email (validated format)              |
| `apiKey`                  | `string`            | **required**       | TestRail API key                                    |
| `timeout`                 | `number`            | `30000`            | Request timeout in milliseconds (max 5 minutes)     |
| `maxRetries`              | `number`            | `3`                | Maximum retry attempts for failed requests (0-10)   |
| `enableCache`             | `boolean`           | `true`             | Enable caching for GET requests                     |
| `cacheTtl`                | `number`            | `300000`           | Cache time-to-live in milliseconds                  |
| `cacheCleanupInterval`    | `number`            | `60000`            | Cache cleanup interval (0 to disable)               |
| `maxCacheSize`            | `number`            | `1000`             | Maximum number of entries in cache                  |
| `rateLimiter`             | `RateLimiterConfig` | 100 / 60s          | `{ maxRequests, windowMs }` sliding window          |
| `allowInsecure`           | `boolean`           | `false`            | Permit cleartext HTTP (credentials sent in Base64)  |
| `allowPrivateHosts`       | `boolean`           | `false`            | Permit private/loopback/link-local hosts            |
| `maxJsonResponseBytes`    | `number`            | `10485760`         | JSON/text response body cap (10 MiB; ceiling 1 GiB) |
| `maxBinaryResponseBytes`  | `number`            | `104857600`        | Binary response body cap (100 MiB; ceiling 1 GiB)   |
| `bodyTimeout`             | `number`            | `= timeout`        | Wall-clock deadline for the body read (0 disables)  |
| `registerProcessHandlers` | `boolean`           | `false`            | Install `exit`/`SIGINT`/`SIGTERM` handlers (opt-in) |
| `fetch`                   | `typeof fetch`      | `globalThis.fetch` | Custom `fetch` implementation                       |
| `dnsLookup`               | `function`          | system DNS         | Custom resolver for SSRF host validation            |

Library consumers should leave `registerProcessHandlers` off and call `client.destroy()` from their own shutdown hook. The `testrail` CLI opts in on your behalf.

## Error handling

The client throws two error classes:

```typescript
import { TestRailApiError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    await client.projects.getProject(999);
} catch (error) {
    if (error instanceof TestRailApiError) {
        // HTTP non-2xx, network error, rate limit, timeout, invalid JSON, blocked redirect
        console.error(error.status, error.statusText, error.response);
    } else if (error instanceof TestRailValidationError) {
        // Bad config, invalid ID, or invalid params
        console.error(error.message);
    }
}
```

`TestRailApiError` carries `status`, `statusText`, and `response` (the raw body lives only in `response`, never in `message`). `TestRailValidationError` signals a caller mistake. Calling any method after `destroy()` throws a plain `Error`.

## Links

- [CHANGELOG.md](CHANGELOG.md) — release notes and migration guidance
- [docs/API-MAPPING.md](docs/API-MAPPING.md) — endpoint ↔ client method ↔ CLI command ↔ skill recipe matrix
- [CODEMAP.md](CODEMAP.md) — every symbol with exact `file:line` links
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the layers are organized and why
- [AGENTS.md](AGENTS.md) — vendor-neutral guidance for AI coding agents

## License

MIT — see [LICENSE](LICENSE). If this saved you time, you can [buy me a coffee](https://buymeacoffee.com/dichovsky).
