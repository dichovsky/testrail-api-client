#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { TestRailClient } from '../client.js';
import { resolveAuth } from './auth.js';
import { createOutput } from './output.js';
import { dispatch } from './dispatch.js';
import type { HandlerArgs } from './handler-context.js';

// ── Version ───────────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
const VERSION: string = (require('../../package.json') as { version: string }).version;

// ── Help ──────────────────────────────────────────────────────────────────────

const HELP = `
testrail <resource> <action> [id] [options]

Resources & actions:
  project  get <id> | list [--limit N] [--offset N]
  suite    get <id> | list --project-id <id>
  case     get <id> | list --project-id <id> [--suite-id <id>]
  run      get <id> | list --project-id <id> [--limit N] [--offset N]
  result   list --run-id <id> [--limit N] [--offset N]
  milestone  get <id> | list --project-id <id> [--limit N] [--offset N]
  user     get <id> | list [--limit N] [--offset N]

Auth (env var or flag):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  / --api-key <key>

Options:
  --format json|table   Output format (default: json)
  --quiet               Suppress output; use exit code 0/1
  --help                Show this help
  --version             Print version
`.trim();

// ── Entry Point ───────────────────────────────────────────────────────────────

/**
 * Compute exit code in an async function and apply `process.exit()` once
 * at the very end. parseArgs and createOutput are invoked inside main() so
 * any failure during initialization (e.g. an invalid CLI shape that makes
 * parseArgs throw) is funneled through the same exit-code return path
 * rather than escaping as an uncaught module-evaluation error.
 */
async function main(): Promise<number> {
    let values: Record<string, unknown>;
    let positionals: string[];
    try {
        const parsed = parseArgs({
            args: process.argv.slice(2),
            options: {
                'base-url': { type: 'string' },
                email: { type: 'string' },
                'api-key': { type: 'string' },
                format: { type: 'string', default: 'json' },
                quiet: { type: 'boolean', default: false },
                help: { type: 'boolean', default: false },
                version: { type: 'boolean', default: false },
                'project-id': { type: 'string' },
                'suite-id': { type: 'string' },
                'run-id': { type: 'string' },
                'case-id': { type: 'string' },
                limit: { type: 'string' },
                offset: { type: 'string' },
            },
            allowPositionals: true,
            strict: false,
        });
        values = parsed.values;
        positionals = parsed.positionals;
        /* v8 ignore start -- defensive: parseArgs with strict:false is highly
           tolerant; this catch funnels any future-Node-version edge cases
           through the controlled exit path rather than crashing the module. */
    } catch (e: unknown) {
        process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
        return 1;
    }
    /* v8 ignore stop */

    const quiet = values['quiet'] === true;
    const formatRaw = values['format'];
    const format: 'json' | 'table' = formatRaw === 'table' ? 'table' : 'json';
    const { out, err } = createOutput({ quiet, format });

    if (values['version'] === true) {
        process.stdout.write(`testrail-cli v${VERSION}\n`);
        return 0;
    }

    if (values['help'] === true || positionals.length === 0) {
        process.stdout.write(`${HELP}\n`);
        return 0;
    }

    const [resource, action, idArg] = positionals;

    if (resource === undefined || resource === '' || action === undefined || action === '') {
        process.stderr.write('Usage: testrail <resource> <action> [id] [options]\nRun with --help for details.\n');
        return 1;
    }

    const dispatched = dispatch(resource, action);
    if (!dispatched.ok) {
        err(dispatched.error);
        return 1;
    }

    const auth = resolveAuth(
        {
            baseUrl: values['base-url'] as string | undefined,
            email: values['email'] as string | undefined,
            apiKey: values['api-key'] as string | undefined,
        },
        {
            ...(process.env['TESTRAIL_BASE_URL'] !== undefined && {
                TESTRAIL_BASE_URL: process.env['TESTRAIL_BASE_URL'],
            }),
            ...(process.env['TESTRAIL_EMAIL'] !== undefined && { TESTRAIL_EMAIL: process.env['TESTRAIL_EMAIL'] }),
            ...(process.env['TESTRAIL_API_KEY'] !== undefined && { TESTRAIL_API_KEY: process.env['TESTRAIL_API_KEY'] }),
        },
    );

    if (!auth.ok) {
        err(auth.error);
        return 1;
    }

    const args: HandlerArgs = {
        ...(idArg !== undefined && { idArg }),
        ...(values['project-id'] !== undefined && { projectId: values['project-id'] as string }),
        ...(values['suite-id'] !== undefined && { suiteId: values['suite-id'] as string }),
        ...(values['run-id'] !== undefined && { runId: values['run-id'] as string }),
        ...(values['case-id'] !== undefined && { caseId: values['case-id'] as string }),
        ...(values['limit'] !== undefined && { limit: values['limit'] as string }),
        ...(values['offset'] !== undefined && { offset: values['offset'] as string }),
    };

    let client: TestRailClient | undefined;
    try {
        client = new TestRailClient(auth.config);
        await dispatched.handler({ client, args, out });
        return 0;
    } catch (e: unknown) {
        err(e instanceof Error ? e.message : String(e));
        return 1;
    } finally {
        client?.destroy();
    }
}

/* v8 ignore start -- defensive: main() catches all reachable errors internally; this handler exists only for hypothetical failures (e.g., broken-pipe in process.stdout.write) that bypass the inner try/catch. */
main().then(
    (code) => process.exit(code),
    (e: unknown) => {
        process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
        process.exit(1);
    },
);
/* v8 ignore stop */
