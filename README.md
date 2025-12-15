# TestRail API Client

A TypeScript API client for [TestRail](https://www.testrail.com/), providing a fully typed, modern interface for interacting with the TestRail API.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Fully Typed** - Complete TypeScript definitions for all API endpoints
- 🔒 **Type Safe** - Strict TypeScript configuration for maximum safety
- ✅ **100% Test Coverage** - Comprehensive test suite using Vitest
- 📦 **Modern ESM** - Built as ES modules for Node.js 20+
- 🚀 **Easy to Use** - Simple, intuitive API interface
- 🔌 **Native Fetch** - Uses Node.js built-in fetch API (no external dependencies)
- 📚 **Well Documented** - Complete JSDoc comments for all methods

## Installation

```bash
npm install @dichovsky/testrail-api-client
```

## Requirements

- Node.js 20 or higher
- TestRail account with API access enabled

## Quick Start

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';

// Create a client instance
const client = new TestRailClient({
  baseUrl: 'https://your-instance.testrail.io',
  email: 'your-email@example.com',
  apiKey: 'your-api-key',
});

// Get all projects
const projects = await client.getProjects();

// Get a specific project
const project = await client.getProject(1);

// Add a new test case
const newCase = await client.addCase(1, {
  title: 'Test case title',
  type_id: 1,
  priority_id: 2,
});

// Add test results
const result = await client.addResult(1, {
  status_id: 1, // Passed
  comment: 'Test passed successfully',
});
```

## API Reference

### Constructor

```typescript
const client = new TestRailClient(config);
```

**Configuration Options:**

| Property | Type   | Description                               |
|----------|--------|-------------------------------------------|
| baseUrl  | string | TestRail instance URL                     |
| email    | string | User email for authentication             |
| apiKey   | string | API key or password for authentication    |

### Projects

```typescript
// Get all projects
await client.getProjects();

// Get a specific project
await client.getProject(projectId);
```

### Suites

```typescript
// Get all suites for a project
await client.getSuites(projectId);

// Get a specific suite
await client.getSuite(suiteId);
```

### Sections

```typescript
// Get all sections for a project
await client.getSections(projectId);

// Get sections for a specific suite
await client.getSections(projectId, suiteId);

// Get a specific section
await client.getSection(sectionId);
```

### Cases

```typescript
// Get all cases for a project
await client.getCases(projectId);

// Get cases with filters
await client.getCases(projectId, suiteId, sectionId);

// Get a specific case
await client.getCase(caseId);

// Add a new case
await client.addCase(sectionId, {
  title: 'Test case title',
  type_id: 1,
  priority_id: 2,
});

// Update a case
await client.updateCase(caseId, {
  title: 'Updated title',
});

// Delete a case
await client.deleteCase(caseId);
```

### Plans

```typescript
// Get all plans for a project
await client.getPlans(projectId);

// Get a specific plan
await client.getPlan(planId);

// Add a new plan
await client.addPlan(projectId, {
  name: 'Test Plan',
  description: 'Plan description',
});

// Close a plan
await client.closePlan(planId);

// Delete a plan
await client.deletePlan(planId);
```

### Runs

```typescript
// Get all runs for a project
await client.getRuns(projectId);

// Get a specific run
await client.getRun(runId);

// Add a new run
await client.addRun(projectId, {
  name: 'Test Run',
  suite_id: 1,
});

// Close a run
await client.closeRun(runId);

// Delete a run
await client.deleteRun(runId);
```

### Tests

```typescript
// Get all tests for a run
await client.getTests(runId);

// Get a specific test
await client.getTest(testId);
```

### Results

```typescript
// Get results for a test
await client.getResults(testId);

// Get results for a case in a run
await client.getResultsForCase(runId, caseId);

// Get all results for a run
await client.getResultsForRun(runId);

// Add a result for a test
await client.addResult(testId, {
  status_id: 1,
  comment: 'Test passed',
});

// Add a result for a case
await client.addResultForCase(runId, caseId, {
  status_id: 1,
  comment: 'Test passed',
});

// Add multiple results for cases
await client.addResultsForCases(runId, {
  results: [
    { case_id: 1, status_id: 1 },
    { case_id: 2, status_id: 5 },
  ],
});
```

### Milestones

```typescript
// Get all milestones for a project
await client.getMilestones(projectId);

// Get a specific milestone
await client.getMilestone(milestoneId);
```

### Users

```typescript
// Get all users
await client.getUsers();

// Get a specific user
await client.getUser(userId);

// Get a user by email
await client.getUserByEmail('user@example.com');
```

### Statuses

```typescript
// Get all available statuses
await client.getStatuses();
```

### Priorities

```typescript
// Get all available priorities
await client.getPriorities();
```

## TypeScript Support

This package includes complete TypeScript definitions. All types are exported and can be imported:

```typescript
import type {
  TestRailConfig,
  Project,
  Case,
  Suite,
  Run,
  Test,
  Result,
  AddCasePayload,
  AddRunPayload,
  // ... and more
} from '@dichovsky/testrail-api-client';
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Type checking
npm run typecheck
```

### Testing

This project uses [Vitest](https://vitest.dev/) for testing and maintains 100% code coverage.

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## API Documentation

For complete API documentation, refer to the [TestRail API Reference](https://support.testrail.com/hc/en-us/sections/7077185274644-API-reference).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Igor Magdich

## Acknowledgments

- TestRail API documentation
- TypeScript community
- Vitest testing framework
