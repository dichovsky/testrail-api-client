// This file is a repository example. If you copy it into an application, import
// the SDK from '@dichovsky/testrail-api-client', not from '../src/index.js'.
//
// Callers use the three pagination methods incorrectly more often than other
// parts of this client. The three shapes are not interchangeable:
//
//   getCases()      one response, the historical shape. The result is partial,
//                   with no error, on a project larger than one page.
//   getCasesPage()  one response plus its envelope. You can follow the
//                   envelope yourself and decide when to stop.
//   getAllCases()   all pages, bounded, all-or-nothing.
//
// `getAll*()` returns no partial result. If the read gets to a safety limit,
// `getAll*()` throws `TestRailPaginationError`. It does not return a short
// array that looks complete. The bounds exist to prevent that failure.
//
// Run the example with this command:
//   TESTRAIL_BASE_URL=... TESTRAIL_EMAIL=... TESTRAIL_API_KEY=... \
//   TESTRAIL_PROJECT_ID=... npx tsx examples/bounded-pagination.ts
import { TestRailClient, TestRailPaginationError } from '../src/index.js';
import type { TestRailConfig } from '../src/index.js';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
}

async function main(): Promise<void> {
    const config: TestRailConfig = {
        baseUrl: requireEnv('TESTRAIL_BASE_URL'),
        email: requireEnv('TESTRAIL_EMAIL'),
        apiKey: requireEnv('TESTRAIL_API_KEY'),
    };
    const client = new TestRailClient(config);
    const projectId = Number(requireEnv('TESTRAIL_PROJECT_ID'));

    try {
        // 1. One page, with the envelope. Use this method when you want to
        //    control when to stop. For example, a UI that shows the first
        //    screen, or a job that needs only the newest N.
        const page = await client.cases.getCasesPage(projectId, { limit: 50 });
        process.stdout.write(`page: ${page.items.length} items, size ${String(page.size)}\n`);

        // 2. All pages, bounded. The defaults (100 pages / 25,000 items /
        //    5 min / 100 MiB) are intentionally reachable. A project that
        //    exceeds them is a sign to narrow the query, not to raise the
        //    maximum.
        const all = await client.cases.getAllCases(projectId, {
            pageSize: 250,
            maxPages: 20,
            maxItems: 5_000,
            maxDurationMs: 60_000,
        });
        process.stdout.write(`aggregate: ${all.length} cases\n`);
    } catch (error) {
        if (error instanceof TestRailPaginationError) {
            // `reason` shows which bound stopped the read. The progress
            // counters show how many pages and items the read got. Use this
            // data to decide if you narrow the filter or raise that one bound.
            // By design, no partial array is available.
            process.stderr.write(`Aggregate stopped: ${error.reason}\n`);
            process.stderr.write(
                error.reason === 'max_items' || error.reason === 'max_pages'
                    ? 'Narrow the query (by suite or section) rather than raising the bound.\n'
                    : 'Retry, or raise the bound that tripped if the project is legitimately this large.\n',
            );
            process.exitCode = 1;
            return;
        }
        throw error;
    } finally {
        client.destroy();
    }
}

await main();
