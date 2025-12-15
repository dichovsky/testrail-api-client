import { TestRailClient } from '@dichovsky/testrail-api-client';

/**
 * Example usage of the TestRail API Client
 */

// Create a client instance
const client = new TestRailClient({
  baseUrl: 'https://your-instance.testrail.io',
  email: 'your-email@example.com',
  apiKey: 'your-api-key',
});

async function main() {
  try {
    // Get all projects
    const projects = await client.getProjects();
    console.log('Projects:', projects);

    // Get a specific project
    const project = await client.getProject(1);
    console.log('Project:', project);

    // Get all suites for a project
    const suites = await client.getSuites(1);
    console.log('Suites:', suites);

    // Add a new test case
    const newCase = await client.addCase(1, {
      title: 'Example test case',
      type_id: 1,
      priority_id: 2,
    });
    console.log('New case:', newCase);

    // Add a test run
    const run = await client.addRun(1, {
      name: 'Example test run',
      suite_id: 1,
    });
    console.log('New run:', run);

    // Add test results
    const result = await client.addResult(1, {
      status_id: 1, // Passed
      comment: 'Test passed successfully',
    });
    console.log('Result:', result);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
