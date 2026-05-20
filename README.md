# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, type-safe TypeScript/JavaScript client for the [TestRail API](https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API) with advanced features including intelligent caching, rate limiting, retry logic with exponential backoff, and robust error handling.

**Covers the complete TestRail REST API** — all 101 methods across every resource: projects, suites, sections, cases, plans, runs, tests, results, milestones, users, attachments, configurations, datasets, groups, shared steps, variables, reports, and more.

## Features

🚀 **Performance & Reliability**

- Intelligent caching system for GET requests to reduce API calls and improve response times
- Configurable request timeouts (up to 5 minutes) with automatic cleanup
- Advanced retry logic with exponential backoff (configurable 0-10 retries)
- Built-in rate limiting to respect TestRail API constraints (configurable)
- Memory-efficient caching with configurable size limits
- Automatic cache cleanup with configurable intervals
- Graceful cleanup on process termination
- Cross-platform support (Node.js and browser environments)

🛡️ **Security & Validation**

- Comprehensive input validation for all configuration and method parameters
- URL sanitization and email format validation using regex patterns
- Secure credential handling with Base64 encoding
- Protection against common injection attacks
- Runtime validation ensuring all IDs are positive integers
- Security warnings for insecure HTTP protocol usage
- Custom error classes with detailed error information

🔧 **Developer Experience**

- Full TypeScript support with strict type checking and comprehensive interfaces
- Custom error classes (TestRailApiError, TestRailValidationError) for better error handling
- Extensive JSDoc documentation with parameter descriptions
- Modern ES2022+ features with async/await API throughout
- Automatic process cleanup handlers for graceful shutdowns

✅ **Quality & Testing**

- 97.6%+ test coverage with comprehensive test suite (456+ tests)
- High branch coverage (98.7%) ensuring thorough edge case testing
- Strict ESLint configuration with security-focused and TypeScript-specific rules
- Automated CI/CD with GitHub Actions and matrix testing
- Cross-platform Node.js compatibility (20.x+)
- Comprehensive coverage of error scenarios and edge cases

## Installation

```bash
npm install @dichovsky/testrail-api-client
```

## Using with AI Coding Agents

This package ships first-class instructions for several agent harnesses. All artifacts are generated from the same source (`src/cli/metadata.ts` + `scripts/rules-content.mjs`) so they stay in sync; CI drift gates fail the build if any committed copy diverges from generator output.

### Claude Code (skill)

`skill/SKILL.md` is a Claude Code skill. Install it into your project (or globally) so Claude Code auto-loads it whenever you ask the agent to query or write TestRail entities:

```bash
# Install into the current project: ./.claude/skills/testrail-cli/SKILL.md
npx testrail install-skill

# Or globally: ~/.claude/skills/testrail-cli/SKILL.md
npx testrail install-skill --global

# Overwrite an existing install
npx testrail install-skill --force

# Just print the bundled SKILL.md path (for scripting / vendoring)
npx testrail install-skill --print-path

# Symmetric reverse — remove a previously-installed skill
npx testrail uninstall-skill            # project-scoped
npx testrail uninstall-skill --global   # global-scoped
```

`uninstall-skill` removes ONLY the skill file (and its empty parent directory). It deliberately does NOT touch `.cursor/rules/testrail.mdc`, `.continue/rules/testrail.md`, or `AGENTS.md` — those artifacts have an independent lifecycle (they are generated from `src/cli/metadata.ts` and live alongside other agent-tool configuration). Remove them manually if you want to fully decouple.

The skill description triggers auto-load when an agent's prompt mentions TestRail entities (projects, suites, cases, runs, results, milestones, users) or when `TESTRAIL_BASE_URL` / `TESTRAIL_EMAIL` / `TESTRAIL_API_KEY` are set in the environment. The bundled CLI itself supports both read (`get`, `list`) and write (`add`, `update`, `add-bulk`, `close`) operations — see `skill/SKILL.md` for the complete command surface, recipes, and a parallel "Programmatic TypeScript API" section with copy-paste examples for using `TestRailClient` directly.

### Cursor

`.cursor/rules/testrail.mdc` is a [Cursor rule](https://docs.cursor.com/context/rules-for-ai) generated from the same source. It is committed at the repo root so contributors who clone the repo get the rule automatically. To install it into your own project:

```bash
mkdir -p .cursor/rules
curl -fsSL https://raw.githubusercontent.com/dichovsky/testrail-api-client/main/.cursor/rules/testrail.mdc \
    > .cursor/rules/testrail.mdc
```

### Continue (continue.dev)

`.continue/rules/testrail.md` is a [Continue workspace rule](https://docs.continue.dev/customization/rules). Installation mirrors Cursor:

```bash
mkdir -p .continue/rules
curl -fsSL https://raw.githubusercontent.com/dichovsky/testrail-api-client/main/.continue/rules/testrail.md \
    > .continue/rules/testrail.md
```

### Generic AGENTS.md

`AGENTS.md` at the repo root follows the vendor-neutral [agents.md](https://agents.md/) convention — a single markdown file any AI coding agent or harness can read for project conventions, build commands, and "what to know" pointers. No installation required; agents that honour the spec pick it up automatically when working in this repository.

### CLI output formats

Every read / list / write action accepts `--format <json|table|yaml|csv>` (default: `json`). Pick the format that matches your downstream pipeline:

| Format  | Best for                                                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `json`  | Default. Pretty-printed JSON, safe to pipe into `jq` and any JSON-aware tool.                                                                                         |
| `table` | Human-readable ASCII table with sanitized cell values (control chars stripped, CTF #18). Good for terminal inspection.                                                |
| `yaml`  | Zero-dependency YAML 1.2 emitter. 2-space indent, double-quoted strings where ambiguity demands it. Good for piping into `yq`, embedding in Helm/Ansible/K8s configs. |
| `csv`   | RFC 4180. CRLF row terminators, deterministic header order (sorted union of top-level keys). Nested objects/arrays are JSON-stringified into a single cell.           |

```bash
# Pipe a project list into yq for further filtering
testrail project list --format yaml | yq '.[] | select(.suite_mode == 1)'

# Export a run's results as a spreadsheet
testrail result list --run-id 42 --format csv > results.csv

# Inspect a single case as a table
testrail case get 1234 --format table
```

`--format csv` keeps nested values as JSON in-cell (no dot-path flattening) so the CSV column count is stable regardless of payload shape. Header order in CSV mode is the sorted union of top-level keys across all rows, so two CSV exports of the same endpoint always produce the same header.

### Destructive operations

Every destructive CLI action (any `delete` plus `run close` / `plan close`) is protected by a **two-gate model**. Both gates must be satisfied before a destructive call reaches the API:

1. **`--yes` flag** — per-invocation explicit confirmation. Required on every destructive command.
2. **`TESTRAIL_ALLOW_DESTRUCTIVE=1` environment variable** — process-wide unlock. Set this in your shell / CI step before invoking destructive commands.

Either gate alone is insufficient. The env var must be **exactly** the string `'1'` — `'true'`, `'yes'`, `'on'`, `'1 '` (whitespace), or any other value is rejected. The strict comparison keeps `set | unset | wrong-value` unambiguous in `printenv` output and CI definitions.

```bash
# Blocked: --yes set, but env var missing → exit code 2
testrail run delete 5 --yes

# Blocked: env var set, but --yes missing → exit code 1
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5

# Proceeds: both gates satisfied
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail run delete 5 --yes

# Recommended CI pattern: export once at the top of the destructive step,
# then run any number of destructive commands within that step.
export TESTRAIL_ALLOW_DESTRUCTIVE=1
testrail run delete 5 --yes
testrail case delete 10 --yes
```

**Exit codes:**

- `0` — success (or successful `--dry-run` preview).
- `1` — generic failure (invalid argv, missing auth, 4xx/5xx, validation error, missing `--yes`).
- `2` — destructive action blocked by the env-var gate. Distinct from `1` so CI can branch on "needs `TESTRAIL_ALLOW_DESTRUCTIVE`" vs everything else.

**`--dry-run` semantics:**

`--dry-run` is **client-side**: no HTTP request leaves the process. It bypasses **both** gates (the env var AND the `--yes` flag) because preview is non-destructive by definition. This lets CI agents safely preview a destructive command without setting up the gates:

```bash
# Safe in any environment — no gates required, no API call made
testrail run delete 5 --dry-run
```

**`--soft` semantics (case / run / section / suite delete only):**

`--soft` is **server-side**: TestRail returns affected-entity counts without performing the deletion. The HTTP request is still made (and still gated by both `--yes` and `TESTRAIL_ALLOW_DESTRUCTIVE=1`). Distinct from `--dry-run` which makes no API call at all.

```bash
# Server-side preview — hits the API, returns counts, deletes nothing
TESTRAIL_ALLOW_DESTRUCTIVE=1 testrail case delete 10 --soft --yes
```

**Why two gates?** The env var is a process-wide audit-friendly switch (visible in `printenv`, CI step logs, dump output). The `--yes` flag is per-invocation explicit intent. Together they make accidental destructive operations meaningfully harder — a script run with a stale env still needs `--yes`, and a typo with `--yes` still needs the env var. The dispatch-level check runs in `src/cli/dispatch.ts` before the handler is invoked, so it cannot be bypassed by a regression in any single handler.

**Migration note (v3.6+):** Before v3.6, only `--yes` was required. Existing CI users must add `export TESTRAIL_ALLOW_DESTRUCTIVE=1` (or set the variable in their CI step definition) before any destructive command. See [CHANGELOG.md](CHANGELOG.md) for the full migration guide.

## Quick Start

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

const client = new TestRailClient({
    baseUrl: 'https://your-domain.testrail.io',
    email: 'your-email@example.com',
    apiKey: 'your-api-key',
});

// Get a project
const project = await client.getProject(1);
console.log(project.name);

// Get all test cases in a suite
const cases = await client.getCases(projectId, suiteId);
console.log(`Found ${cases.length} test cases`);

// Add a new test result
const result = await client.addResult(testId, {
    status_id: 1, // Passed
    comment: 'Test passed successfully',
    elapsed: '5m',
});
```

## Configuration

The client supports extensive configuration options:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://your-domain.testrail.io',
    email: 'your-email@example.com',
    apiKey: 'your-api-key',

    // Performance settings
    timeout: 30000, // Request timeout (30 seconds, max 5 minutes)
    maxRetries: 3, // Maximum retry attempts (0-10)
    enableCache: true, // Enable response caching for GET requests
    cacheTtl: 300000, // Cache TTL (5 minutes)
    cacheCleanupInterval: 60000, // Cache cleanup interval (1 minute)
    maxCacheSize: 1000, // Maximum cache entries (default: 1000)

    // Rate limiting
    rateLimiter: {
        maxRequests: 100, // Max requests per window
        windowMs: 60000, // Time window (1 minute)
    },
});
```

### Configuration Options

| Option                 | Type                | Default      | Description                                       |
| ---------------------- | ------------------- | ------------ | ------------------------------------------------- |
| `baseUrl`              | `string`            | **required** | TestRail instance URL (http/https)                |
| `email`                | `string`            | **required** | TestRail user email (validated format)            |
| `apiKey`               | `string`            | **required** | TestRail API key                                  |
| `timeout`              | `number`            | `30000`      | Request timeout in milliseconds (max 5 minutes)   |
| `maxRetries`           | `number`            | `3`          | Maximum retry attempts for failed requests (0-10) |
| `enableCache`          | `boolean`           | `true`       | Enable caching for GET requests                   |
| `cacheTtl`             | `number`            | `300000`     | Cache time-to-live in milliseconds                |
| `cacheCleanupInterval` | `number`            | `60000`      | Cache cleanup interval (0 to disable)             |
| `maxCacheSize`         | `number`            | `1000`       | Maximum number of entries in cache                |
| `rateLimiter`          | `RateLimiterConfig` | See below    | Rate limiting configuration                       |

#### Rate Limiter Configuration

```typescript
rateLimiter: {
  maxRequests: 100,    // Maximum requests per time window
  windowMs: 60000,     // Time window in milliseconds
}
```

## Error Handling

The client provides comprehensive error handling with custom error classes:

```typescript
import { TestRailApiError, TestRailValidationError } from '@dichovsky/testrail-api-client';

try {
    const project = await client.getProject(999);
} catch (error) {
    if (error instanceof TestRailApiError) {
        console.error('API Error:', error.message);
        console.error('Status:', error.status);
        console.error('Response:', error.response);
    } else if (error instanceof TestRailValidationError) {
        console.error('Validation Error:', error.message);
    }
}
```

### Error Types

- **`TestRailApiError`**: Thrown for API-related errors (network, HTTP status, etc.)
- **`TestRailValidationError`**: Thrown for invalid configuration or parameter validation (e.g., invalid IDs)
- **Retry Logic**: Automatic retries for 500+ status codes and network errors with exponential backoff
- **Timeout Handling**: Requests timeout based on configuration (default: 30s)

## Advanced Features

### Caching System

- Automatic caching of GET requests to improve performance
- Configurable TTL and cleanup intervals
- Memory-efficient with automatic expiration
- Thread-safe implementation

### Rate Limiting

- Built-in rate limiting to respect API constraints
- Sliding window implementation
- Configurable limits per time window
- Exceeds configured limits by throwing a `TestRailApiError` rather than queueing requests

### Retry Logic

- Exponential backoff for failed requests
- Configurable retry attempts (0-10)
- Smart retry for appropriate error types (500+, network errors)
- Maximum delay capping to prevent excessive waiting

### Resource Management

- Automatic cleanup on process termination
- Proper timer management for cache cleanup
- Memory leak prevention with `destroy()` method
- Graceful shutdown handling

```typescript
// Explicitly cleanup resources when done
client.destroy();
```

## API Methods

For the complete coverage matrix linking every TestRail endpoint to its client method, CLI command, and skill recipe, see **[`docs/API-MAPPING.md`](docs/API-MAPPING.md)**. For exact signatures, types, and file:line locations of every symbol, see **[`CODEMAP.md`](CODEMAP.md)**.

The examples below show one minimal call per resource family — enough to demonstrate the shape. Refer to the mapping table for the full surface.

### Projects

```typescript
const project = await client.getProject(5);
const projects = await client.getProjects();
```

### Suites & Sections

```typescript
const suite = await client.getSuite(12);
const sections = await client.getSections(5, { suiteId: 12 });
```

### Cases

```typescript
const testCase = await client.getCase(42);
const newCase = await client.addCase(12, {
    title: 'Login page accepts SSO redirect',
    type_id: 1,
    priority_id: 3,
});
// Soft-preview delete: hits the API but doesn't delete; returns affected counts.
// Same `{ soft: true }` overload exists on deleteRun / deleteSection / deleteSuite / deleteCases.
const preview = await client.deleteCase(42, { soft: true });
```

### Test Plans

```typescript
const plan = await client.addPlan(5, {
    name: 'Release 1.0',
    entries: [{ suite_id: 12, include_all: true }],
});
```

### Test Runs

```typescript
const run = await client.addRun(5, {
    suite_id: 12,
    name: 'CI build',
    include_all: false,
    case_ids: [42, 43, 44],
});
await client.closeRun(run.id);
```

### Tests & Results

```typescript
const tests = await client.getTests(run.id);
await client.addResultForCase(run.id, 42, {
    status_id: 1, // 1 = Passed, 5 = Failed
    comment: 'Passed',
});
await client.addResultsForCases(run.id, {
    results: [
        { case_id: 42, status_id: 1 },
        { case_id: 43, status_id: 5, comment: 'Failed: timeout' },
    ],
});
```

### Attachments

```typescript
import { readFileSync } from 'node:fs';

// Streaming-from-disk (recommended for large files — heap stays flat):
const attachment = await client.addAttachmentToResult(resultId, { path: './screenshot.png' }, 'screenshot.png');

// In-memory (Blob / Uint8Array / File) still supported:
const inMemory = await client.addAttachmentToResult(resultId, readFileSync('./screenshot.png'), 'screenshot.png');

const blob = await client.getAttachment(attachment.attachment_id);
```

Uploads accept either an in-memory variant (`Blob`, `Uint8Array`, or `File`) or
a `{ path: string; type?: string }` descriptor. When a descriptor is supplied
the bytes are read from disk on demand via Node's `fs.openAsBlob`, so a
100 MB attachment grows heap by ~0 MB instead of fully buffering the file.
The CLI (`testrail attachment add-to-* --file`) uses this path by default;
programmatic callers that already hold the bytes in memory may continue to
pass them directly.

### Users & metadata

```typescript
const me = await client.getCurrentUser();
const statuses = await client.getStatuses();
const milestones = await client.getMilestones(5);
```

Advanced usage: the client also exposes domain modules (e.g., `client.metadata`, `client.attachments`) for organization, but the supported/documented usage pattern remains the top-level `client.<method>()` calls.

### Caching

The client automatically caches GET requests to improve performance:

```typescript
// First call hits the API
const project1 = await client.getProject(1);

// Second call uses cached result
const project2 = await client.getProject(1);

// Clear cache when needed
client.clearCache();
```

The client performs periodic cleanup of expired cache entries automatically. Callers are responsible for releasing resources when an instance is no longer needed:

```typescript
// Releases the cache cleanup timer, clears the cache, zeroes the
// in-memory credential, and removes the instance from the active-clients
// registry. Safe to call multiple times.
client.destroy();
```

#### Process signal handlers (opt-in)

By default the client does **not** register any Node.js process listeners
(`exit`, `SIGINT`, `SIGTERM`) — library consumers (Express, NestJS, daemons,
Electron, anything that already owns the process lifecycle) keep full control
of their own signal handling and exit code. Standalone scripts and CLIs that
do want the client to install handlers can opt in:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://example.testrail.io',
    email: 'user@example.com',
    apiKey: 'key',
    // Installs process listeners that call destroy() on every active client
    // on `exit`, and additionally terminate the process with the conventional
    // exit codes 130 (SIGINT) / 143 (SIGTERM). Default: false.
    registerProcessHandlers: true,
});
```

The bundled `testrail` CLI opts in automatically — there is no behavioral
change for shell users. Once installed for the process, the handlers persist
for its lifetime; this is intentional, since safely deregistering them would
require ownership tracking across every client in the process.

### Rate Limiting

Built-in rate limiting prevents API abuse by enforcing a sliding window limit:

```typescript
const client = new TestRailClient({
    baseUrl: 'https://example.testrail.io',
    email: 'user@example.com',
    apiKey: 'key',
    rateLimiter: {
        maxRequests: 50, // 50 requests
        windowMs: 30000, // per 30 seconds (default: 100 req / minute)
    },
});

// Requests exceeding limits will throw TestRailApiError with a wait message
```

### Security Best Practices

The client implements several security best practices to protect your data:

- **HTTPS Required**: The client issues a console warning if initialized with an HTTP `baseUrl`. Basic authentication sends credentials in Base64 format, which is not secure over unencrypted HTTP connections. Always use HTTPS in production.
- **Strict Parameter Validation**: All API methods validate that ID parameters are positive integers. This prevents parameter manipulation and ensures that invalid data is caught before making a network request.
- **Redirects Blocked**: HTTP redirects (`3xx` with `Location` header) are never followed. Every fetch site sets `redirect: 'manual'`, and a redirect response surfaces as `TestRailApiError` with the blocked `Location` embedded in the error body. This closes the SSRF guard hole where a `Location` pointing at a private/metadata IP (for example, `169.254.169.254`) could have bypassed the initial-host validation. If a legitimate reverse-proxy redirect appears, update `baseUrl` to the final URL.

## Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/dichovsky/testrail-api-client.git
cd testrail-api-client

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run linting
npm run lint

# Type checking
npm run typecheck
```

### Project Structure

```
src/
├── client.ts          # Main TestRail client with advanced features
├── types.ts           # TypeScript interfaces and type definitions
├── utils.ts           # Shared utility functions
└── index.ts           # Public API exports

tests/
├── client.test.ts              # Core client functionality tests
├── enhanced-features.test.ts   # Advanced features tests (caching, rate limiting, retry logic)
├── coverage-improvement.test.ts # Additional edge case and validation tests
├── index.test.ts               # Export and integration tests
├── performance.test.ts         # Performance and memory tests
└── types.test.ts               # Type definition tests
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`npm test`)
6. Run linting (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Quality

This project maintains high code quality standards:

- **TypeScript**: Strict mode with comprehensive type checking and interfaces
- **ESLint**: Extensive rules for code quality, security, and TypeScript best practices
- **Testing**: 97.6%+ test coverage with 140+ comprehensive test cases
- **Documentation**: Comprehensive JSDoc comments with parameter validation
- **Security**: Input validation, error handling, and security-focused linting rules

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0

Initial release with comprehensive TestRail API support and advanced features:

**Core Features:**

- Full CRUD operations for projects, suites, cases, plans, runs, and results
- Complete TypeScript support with strict type checking

**Performance & Reliability:**

- Intelligent caching system for GET requests with automatic cleanup
- Rate limiting with configurable sliding window
- Retry logic with exponential backoff for resilient API calls
- Request timeouts with proper AbortController usage

**Security & Validation:**

- Comprehensive input validation for all parameters
- Custom error classes (TestRailApiError, TestRailValidationError)
- Security warnings for insecure protocols
- Protection against SSRF, credential exposure, and parameter injection

**Developer Experience:**

- 97.6%+ test coverage with 456+ test cases
- Strict ESLint configuration with security rules
- Comprehensive JSDoc documentation
- Modern ES2022+ features and async/await throughout
- Automatic resource cleanup and graceful shutdown handling

## Support

- 📖 [Documentation](https://github.com/dichovsky/testrail-api-client#readme)
- 🐛 [Issues](https://github.com/dichovsky/testrail-api-client/issues)
- 💬 [Discussions](https://github.com/dichovsky/testrail-api-client/discussions)

## Related Projects

- [TestRail API Introduction](https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API) - Official API overview
- [TestRail API Reference](https://support.testrail.com/hc/en-us/articles/7077819069460-Using-the-API) - Full endpoint documentation
- [TestRail](https://www.testrail.com/) - Test management platform

## Buy Me A Coffee

In case you want to support my work

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/dichovsky)
