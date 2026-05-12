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

// ── Arg Parsing ───────────────────────────────────────────────────────────────

const { values, positionals } = parseArgs({
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

const quiet = values.quiet === true;
const formatRaw = values.format;
const format: 'json' | 'table' = formatRaw === 'table' ? 'table' : 'json';
const { out, err } = createOutput({ quiet, format });

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

if (values.version === true) {
    process.stdout.write(`testrail-cli v${VERSION}\n`);
    process.exit(0);
}

if (values.help === true || positionals.length === 0) {
    process.stdout.write(`${HELP}\n`);
    process.exit(0);
}

const [resource, action, idArg] = positionals;

if (resource === undefined || resource === '' || action === undefined || action === '') {
    process.stderr.write('Usage: testrail <resource> <action> [id] [options]\nRun with --help for details.\n');
    process.exit(1);
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const dispatched = dispatch(resource, action);
if (!dispatched.ok) {
    err(dispatched.error);
    process.exit(1);
}

// ── Auth Resolution ───────────────────────────────────────────────────────────

const auth = resolveAuth(
    {
        baseUrl: values['base-url'] as string | undefined,
        email: values['email'] as string | undefined,
        apiKey: values['api-key'] as string | undefined,
    },
    {
        ...(process.env['TESTRAIL_BASE_URL'] !== undefined && { TESTRAIL_BASE_URL: process.env['TESTRAIL_BASE_URL'] }),
        ...(process.env['TESTRAIL_EMAIL'] !== undefined && { TESTRAIL_EMAIL: process.env['TESTRAIL_EMAIL'] }),
        ...(process.env['TESTRAIL_API_KEY'] !== undefined && { TESTRAIL_API_KEY: process.env['TESTRAIL_API_KEY'] }),
    },
);

if (!auth.ok) {
    err(auth.error);
    process.exit(1);
}

// ── Build Handler Context ─────────────────────────────────────────────────────

const args: HandlerArgs = {
    ...(idArg !== undefined && { idArg }),
    ...(values['project-id'] !== undefined && { projectId: values['project-id'] as string }),
    ...(values['suite-id'] !== undefined && { suiteId: values['suite-id'] as string }),
    ...(values['run-id'] !== undefined && { runId: values['run-id'] as string }),
    ...(values['case-id'] !== undefined && { caseId: values['case-id'] as string }),
    ...(values.limit !== undefined && { limit: values.limit as string }),
    ...(values.offset !== undefined && { offset: values.offset as string }),
};

const client = new TestRailClient(auth.config);

dispatched
    .handler({ client, args, out })
    .then(() => {
        client.destroy();
        process.exit(0);
    })
    .catch((e: unknown) => {
        err(e instanceof Error ? e.message : String(e));
        client.destroy();
        process.exit(1);
    });
