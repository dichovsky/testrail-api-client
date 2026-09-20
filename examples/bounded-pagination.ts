// Repository example. When copying into an application, import the SDK from
// '@dichovsky/testrail-api-client' instead of '../src/index.js'.
//
// The pagination trio is the part of this client most often used wrongly. The
// three shapes are not interchangeable:
//
//   getCases()      one response, the historical shape — silently partial on a
//                   project larger than one page
//   getCasesPage()  one response plus its envelope, so you can follow it
//                   yourself and decide when to stop
//   getAllCases()   every page, bounded, all-or-nothing
//
// `getAll*()` returns no partial result. If a safety bound trips it throws
// `TestRailPaginationError` rather than handing back a short array that reads
// like a complete one — which is the failure the bounds exist to prevent.
//
// Run with:
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
        // 1. One page, with the envelope. Use this when you want control over
        //    when to stop — a UI showing the first screen, or a job that only
        //    needs the newest N.
        const page = await client.cases.getCasesPage(projectId, { limit: 50 });
        process.stdout.write(`page: ${page.items.length} items, size ${String(page.size)}\n`);

        // 2. Every page, bounded. The defaults (100 pages / 25,000 items /
        //    5 min / 100 MiB) are deliberately reachable: a project that
        //    exceeds them is telling you to narrow the query, not to raise
        //    the ceiling.
        const all = await client.cases.getAllCases(projectId, {
            pageSize: 250,
            maxPages: 20,
            maxItems: 5_000,
            maxDurationMs: 60_000,
        });
        process.stdout.write(`aggregate: ${all.length} cases\n`);
    } catch (error) {
        if (error instanceof TestRailPaginationError) {
            // `reason` says which bound tripped, and the progress counters say
            // how far it got — enough to decide between narrowing the filter
            // and raising that one bound. Note there is no partial array to
            // fall back on, by design.
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
