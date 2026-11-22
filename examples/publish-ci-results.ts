// This file is a repository example. If you copy it into an application, import
// the SDK from '@dichovsky/testrail-api-client', not from '../src/index.js'.
//
// The most common use of this client is to publish the results of a CI run. In
// this workflow, incorrect failure handling is expensive. A half-published run
// is worse than no run. A blind retry of a bulk write can report the results
// two times.
//
// Run the example with this command:
//   TESTRAIL_BASE_URL=... TESTRAIL_EMAIL=... TESTRAIL_API_KEY=... \
//   TESTRAIL_PROJECT_ID=... npx tsx examples/publish-ci-results.ts
import { TestRailApiError, TestRailClient } from '../src/index.js';
import type { TestRailConfig } from '../src/index.js';

/** One CI test result, as a CI reporter collects it. */
interface CiOutcome {
    readonly caseId: number;
    readonly passed: boolean;
    readonly durationSeconds: number;
    readonly failureMessage?: string;
}

/** TestRail's built-in status ids. 1 = Passed, 5 = Failed. */
const STATUS_PASSED = 1;
const STATUS_FAILED = 5;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
}

function toResult(outcome: CiOutcome): { case_id: number; status_id: number; elapsed: string; comment?: string } {
    return {
        case_id: outcome.caseId,
        status_id: outcome.passed ? STATUS_PASSED : STATUS_FAILED,
        // TestRail parses "90s" or "1m 30s", not a bare number.
        elapsed: `${Math.max(1, Math.round(outcome.durationSeconds))}s`,
        ...(outcome.failureMessage !== undefined && { comment: outcome.failureMessage }),
    };
}

async function publish(outcomes: readonly CiOutcome[]): Promise<void> {
    const config: TestRailConfig = {
        baseUrl: requireEnv('TESTRAIL_BASE_URL'),
        email: requireEnv('TESTRAIL_EMAIL'),
        apiKey: requireEnv('TESTRAIL_API_KEY'),
        // A CI job owns its process. Thus, let the client do its cleanup on SIGTERM.
        registerProcessHandlers: true,
    };
    const client = new TestRailClient(config);

    try {
        const projectId = Number(requireEnv('TESTRAIL_PROJECT_ID'));
        const run = await client.runs.addRun(projectId, {
            name: `CI ${process.env['GITHUB_RUN_ID'] ?? new Date().toISOString()}`,
            // Restrict the run to the cases that this job actually executed.
            // Thus, the pass rate of the run describes this job, not the whole
            // suite.
            include_all: false,
            case_ids: outcomes.map((o) => o.caseId),
        });

        // Use one bulk call, not one call per case. `add_results_for_cases` is a
        // single request and a single point of failure. A loop per case gives a
        // 500-test run 500 chances to half-publish.
        await client.results.addResultsForCases(run.id, {
            results: outcomes.map(toResult),
        });

        // The close step is intentional and separate. A closed run is immutable
        // in TestRail. Thus, close the run only after you know that the results
        // are on the server.
        await client.runs.closeRun(run.id);
        process.stdout.write(`Published ${outcomes.length} results to run ${run.id}\n`);
    } catch (error) {
        // Do not retry blindly. A failed bulk write can still have committed on
        // the server, because the client cannot tell a rejected request from a
        // lost response. Report the run so that a person can examine it.
        if (error instanceof TestRailApiError) {
            process.stderr.write(`TestRail rejected the publish (HTTP ${error.status}): ${error.message}\n`);
            process.stderr.write('Check the run in TestRail before re-running: results may be partially applied.\n');
        } else {
            process.stderr.write(`Publish failed: ${error instanceof Error ? error.message : String(error)}\n`);
        }
        process.exitCode = 1;
    } finally {
        // destroy() releases the cache cleanup timer and zeroes the credential.
        // Without this call, a long-lived process keeps both.
        client.destroy();
    }
}

// Placeholder data for the output of your test reporter.
const outcomes: readonly CiOutcome[] = [
    { caseId: 1, passed: true, durationSeconds: 12 },
    { caseId: 2, passed: false, durationSeconds: 3, failureMessage: 'Expected 200, received 503' },
];

await publish(outcomes);
