// Repository example. When copying into an application, import the SDK from
// '@dichovsky/testrail-api-client' instead of '../src/index.js'.
//
// Publishing a CI run's results is the single most common reason to reach for
// this client, and it is the one workflow where getting the failure handling
// wrong is expensive: a half-published run is worse than no run at all, and a
// blind retry of a bulk write can double-report.
//
// Run with:
//   TESTRAIL_BASE_URL=... TESTRAIL_EMAIL=... TESTRAIL_API_KEY=... \
//   TESTRAIL_PROJECT_ID=... npx tsx examples/publish-ci-results.ts
import { TestRailApiError, TestRailClient } from '../src/index.js';
import type { TestRailConfig } from '../src/index.js';

/** One test outcome as a CI reporter would collect it. */
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
        // TestRail parses "90s" or "1m 30s" — not a bare number.
        elapsed: `${Math.max(1, Math.round(outcome.durationSeconds))}s`,
        ...(outcome.failureMessage !== undefined && { comment: outcome.failureMessage }),
    };
}

async function publish(outcomes: readonly CiOutcome[]): Promise<void> {
    const config: TestRailConfig = {
        baseUrl: requireEnv('TESTRAIL_BASE_URL'),
        email: requireEnv('TESTRAIL_EMAIL'),
        apiKey: requireEnv('TESTRAIL_API_KEY'),
        // A CI job owns its process, so let the client clean up on SIGTERM.
        registerProcessHandlers: true,
    };
    const client = new TestRailClient(config);

    try {
        const projectId = Number(requireEnv('TESTRAIL_PROJECT_ID'));
        const run = await client.runs.addRun(projectId, {
            name: `CI ${process.env['GITHUB_RUN_ID'] ?? new Date().toISOString()}`,
            // Restrict the run to the cases this job actually executed, so the
            // run's pass rate describes this job rather than the whole suite.
            include_all: false,
            case_ids: outcomes.map((o) => o.caseId),
        });

        // One bulk call, not one per case: `add_results_for_cases` is a single
        // request and a single point of failure. Looping per case turns a
        // 500-test run into 500 chances to half-publish.
        await client.results.addResultsForCases(run.id, {
            results: outcomes.map(toResult),
        });

        // Closing is deliberate and separate. A closed run is immutable in
        // TestRail, so only close once the results are known to have landed.
        await client.runs.closeRun(run.id);
        process.stdout.write(`Published ${outcomes.length} results to run ${run.id}\n`);
    } catch (error) {
        // A failed bulk write may still have committed server-side — the
        // client cannot distinguish a rejected request from a lost response.
        // Report the run for a human to inspect rather than retrying blindly.
        if (error instanceof TestRailApiError) {
            process.stderr.write(`TestRail rejected the publish (HTTP ${error.status}): ${error.message}\n`);
            process.stderr.write('Check the run in TestRail before re-running: results may be partially applied.\n');
        } else {
            process.stderr.write(`Publish failed: ${error instanceof Error ? error.message : String(error)}\n`);
        }
        process.exitCode = 1;
    } finally {
        // Releases the cache cleanup timer and zeroes the credential. Without
        // it a long-lived process keeps both.
        client.destroy();
    }
}

// Stand-in for whatever your test reporter produces.
const outcomes: readonly CiOutcome[] = [
    { caseId: 1, passed: true, durationSeconds: 12 },
    { caseId: 2, passed: false, durationSeconds: 3, failureMessage: 'Expected 200, received 503' },
];

await publish(outcomes);
