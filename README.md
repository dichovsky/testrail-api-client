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

### Projects

```typescript
// Get project by ID
const project = await client.getProject(projectId);

// Get all projects
const projects = await client.getProjects();
```

### Suites

```typescript
// Get suite by ID
const suite = await client.getSuite(suiteId);

// Get all suites for a project
const suites = await client.getSuites(projectId);
```

### Sections

```typescript
// Get section by ID
const section = await client.getSection(sectionId);

// Get all sections (optionally filtered by suite)
const sections = await client.getSections(projectId, suiteId);
```

### Test Cases

```typescript
// Get case by ID
const testCase = await client.getCase(caseId);

// Get all cases (optionally filtered by suite/section)
const cases = await client.getCases(projectId, suiteId, sectionId);

// Add a new test case
const newCase = await client.addCase(sectionId, {
    title: 'New test case',
    type_id: 1,
    priority_id: 2,
    estimate: '5m',
});

// Update a test case
const updatedCase = await client.updateCase(caseId, {
    title: 'Updated test case title',
});

// Delete a test case
await client.deleteCase(caseId);
```

### Test Plans

```typescript
// Get plan by ID
const plan = await client.getPlan(planId);

// Get all plans for a project
const plans = await client.getPlans(projectId);

// Add a new plan
const newPlan = await client.addPlan(projectId, {
    name: 'Automated Test Plan',
    entries: [
        {
            suite_id: suiteId,
            include_all: true,
        },
    ],
});

// Close a plan
await client.closePlan(planId);

// Delete a plan
await client.deletePlan(planId);
```

### Test Runs

```typescript
// Get run by ID
const run = await client.getRun(runId);

// Get all runs for a project
const runs = await client.getRuns(projectId);

// Add a new run
const newRun = await client.addRun(projectId, {
    suite_id: suiteId,
    name: 'Automated Test Run',
    include_all: true,
});

// Close a run
await client.closeRun(runId);

// Delete a run
await client.deleteRun(runId);
```

### Tests & Results

```typescript
// Get test by ID
const test = await client.getTest(testId);

// Get all tests in a run
const tests = await client.getTests(runId);

// Add a test result
const result = await client.addResult(testId, {
    status_id: 1, // 1 = Passed, 5 = Failed
    comment: 'Test completed successfully',
    elapsed: '2m 30s',
    defects: 'BUG-123',
});

// Add result for a specific case in a run
const result = await client.addResultForCase(runId, caseId, {
    status_id: 5,
    comment: 'Test failed due to timeout',
});

// Add multiple results at once
const results = await client.addResultsForCases(runId, {
    results: [
        { case_id: 1, status_id: 1, comment: 'Passed' },
        { case_id: 2, status_id: 5, comment: 'Failed' },
    ],
});
```

### Users & System

```typescript
// Get user by ID
const user = await client.getUser(userId);

// Get user by email
const user = await client.getUserByEmail('user@example.com');

// Get all users
const users = await client.getUsers();

// Get all statuses
const statuses = await client.getStatuses();

// Get all priorities
const priorities = await client.getPriorities();

// Get milestones
const milestones = await client.getMilestones(projectId);
```

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

The client performs periodic cleanup of expired cache entries automatically. Resources are automatically cleaned up when the Node.js process exits, but you can manually clean up if needed:

```typescript
// Manual cleanup (usually not needed)
client.destroy();

// The client automatically registers process handlers for cleanup:
// process.on('exit', cleanupAllClients);
// process.on('SIGINT', ...);
// process.on('SIGTERM', ...);
```

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
