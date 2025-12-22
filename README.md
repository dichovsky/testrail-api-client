# TestRail API Client

[![CI](https://github.com/dichovsky/testrail-api-client/workflows/CI/badge.svg)](https://github.com/dichovsky/testrail-api-client/actions)
[![npm version](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client.svg)](https://badge.fury.io/js/@dichovsky%2Ftestrail-api-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, type-safe TypeScript/JavaScript client for the TestRail API with advanced features including caching, rate limiting, retry logic, and robust error handling.

## Features

🚀 **Performance & Reliability**
- Built-in caching for GET requests to reduce API calls
- Configurable request timeouts and retry logic with exponential backoff
- Rate limiting to respect TestRail API constraints
- Connection pooling and optimized JSON parsing

🛡️ **Security & Validation** 
- Input validation for all configuration parameters
- URL sanitization and email format validation
- Secure credential handling with Base64 encoding
- Protection against common injection attacks

🔧 **Developer Experience**
- Full TypeScript support with strict type checking
- Comprehensive error handling with custom error classes
- Extensive JSDoc documentation
- Modern ES2022+ features and async/await API

✅ **Quality & Testing**
- 100% test coverage with comprehensive test suite
- Strict ESLint configuration with security-focused rules
- Automated CI/CD with GitHub Actions
- Cross-platform Node.js compatibility (20.x+)

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
  timeout: 30000,           // Request timeout (30 seconds)
  maxRetries: 3,            // Maximum retry attempts
  enableCache: true,        // Enable response caching
  cacheTtl: 300000,        // Cache TTL (5 minutes)
  
  // Rate limiting
  rateLimiter: {
    maxRequests: 100,       // Max requests per window
    windowMs: 60000,        // Time window (1 minute)
  },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | **required** | TestRail instance URL |
| `email` | `string` | **required** | TestRail user email |
| `apiKey` | `string` | **required** | TestRail API key |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `3` | Maximum retry attempts for failed requests |
| `enableCache` | `boolean` | `true` | Enable caching for GET requests |
| `cacheTtl` | `number` | `300000` | Cache TTL in milliseconds |
| `rateLimiter` | `object` | See below | Rate limiting configuration |

#### Rate Limiter Configuration

```typescript
rateLimiter: {
  maxRequests: 100,    // Maximum requests per time window
  windowMs: 60000,     // Time window in milliseconds
}
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
  entries: [{
    suite_id: suiteId,
    include_all: true,
  }],
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
  status_id: 1,        // 1 = Passed, 5 = Failed
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

## Error Handling

The client provides comprehensive error handling with custom error classes:

```typescript
import { TestRailApiError, TestRailConfigError } from '@dichovsky/testrail-api-client';

try {
  const project = await client.getProject(999);
} catch (error) {
  if (error instanceof TestRailApiError) {
    console.log('API Error:', error.message);
    console.log('Status:', error.status);
    console.log('Response:', error.response);
  } else if (error instanceof TestRailConfigError) {
    console.log('Configuration Error:', error.message);
  }
}
```

### Error Types

- **`TestRailApiError`**: API-related errors (network, HTTP status, malformed responses)
- **`TestRailConfigError`**: Configuration validation errors
- **Rate Limit Exceeded**: Special case of `TestRailApiError` when rate limits are hit

## Advanced Features

### Caching

The client automatically caches GET requests to improve performance:

```typescript
// First call hits the API
const project1 = await client.getProject(1);

// Second call uses cached result (if within TTL)
const project2 = await client.getProject(1);

// Clear cache when needed
client.clearCache();
```

The client performs periodic cleanup of expired cache entries automatically. Resources are automatically cleaned up when the Node.js process exits, so you don't need to worry about manually calling `destroy()` in most cases.

For scenarios where you need explicit cleanup (e.g., in tests or when creating multiple client instances), you can call `destroy()` manually:

```typescript
const client = new TestRailClient({ /* config */ });

// Use the client...
await client.getProject(1);

// Explicitly cleanup resources when done
client.destroy();
```

### Retry Logic

Failed requests are automatically retried with exponential backoff:

- Server errors (5xx) and rate limiting (429) are retried
- Client errors (4xx) are not retried
- Network errors are retried up to `maxRetries` times

### Rate Limiting

The client respects rate limits to prevent overwhelming the TestRail API:

```typescript
// Configure rate limiting
const client = new TestRailClient({
  // ... other config
  rateLimiter: {
    maxRequests: 50,   // 50 requests
    windowMs: 30000,   // per 30 seconds
  },
});
```

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
├── client.ts          # Main TestRail client implementation
├── types.ts           # TypeScript interfaces and types
└── index.ts           # Public API exports

tests/
├── client.test.ts           # Client functionality tests
├── enhanced-features.test.ts # Advanced features tests
├── index.test.ts            # Export tests
└── types.test.ts            # Type definition tests
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

- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Extensive rules for code quality and security
- **Testing**: 100% test coverage requirement
- **Documentation**: Comprehensive JSDoc comments

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0

Initial release with comprehensive TestRail API support:

- Full CRUD operations for projects, suites, cases, plans, runs, and results
- Built-in caching and rate limiting
- Retry logic with exponential backoff  
- Comprehensive error handling
- 100% TypeScript coverage
- Extensive test suite

## Support

- 📖 [Documentation](https://github.com/dichovsky/testrail-api-client#readme)
- 🐛 [Issues](https://github.com/dichovsky/testrail-api-client/issues)
- 💬 [Discussions](https://github.com/dichovsky/testrail-api-client/discussions)

## Related Projects

- [TestRail Official API Documentation](https://support.testrail.com/hc/en-us/articles/7077819069460-Using-the-API)
- [TestRail](https://www.testrail.com/) - Test management platform

## Buy Me A Coffee

In case you want to support my work

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/dichovsky)
