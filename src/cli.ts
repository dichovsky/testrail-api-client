#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { TestRailClient } from './client.js';
import type { TestRailConfig } from './types.js';

// ── Version ───────────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const VERSION: string = (require('../package.json') as { version: string }).version;

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

// ── Output Helpers ────────────────────────────────────────────────────────────

const quiet = values.quiet === true;
const format = values.format ?? 'json';

function out(data: unknown): void {
    if (quiet) return;
    if (format === 'table') {
        process.stdout.write(renderTable(data) + '\n');
    } else {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    }
}

function err(message: string): void {
    if (!quiet) process.stderr.write(`Error: ${message}\n`);
}

function renderTable(data: unknown): string {
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return '(empty)';

    const first = rows[0];
    if (typeof first !== 'object' || first === null) {
        return rows.map(String).join('\n');
    }

    const keys = Object.keys(first);
    const widths = keys.map((k) =>
        Math.max(k.length, ...rows.map((r) => String((r as Record<string, unknown>)[k] ?? '').length))
    );

    const line = widths.map((w) => '-'.repeat(w)).join('-+-');
    const header = keys.map((k, i) => k.padEnd(widths[i] ?? k.length)).join(' | ');
    const body = rows.map((r) =>
        keys.map((k, i) => String((r as Record<string, unknown>)[k] ?? '').padEnd(widths[i] ?? k.length)).join(' | ')
    );

    return [header, line, ...body].join('\n');
}

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
    process.stdout.write(HELP + '\n');
    process.exit(0);
}

const [resource, action, idArg] = positionals;

if (!resource || !action) {
    process.stderr.write('Usage: testrail <resource> <action> [id] [options]\nRun with --help for details.\n');
    process.exit(1);
}

// ── Auth Resolution ───────────────────────────────────────────────────────────

const baseUrl = (values['base-url'] as string | undefined) ?? process.env['TESTRAIL_BASE_URL'];
const email = (values['email'] as string | undefined) ?? process.env['TESTRAIL_EMAIL'];
const apiKey = (values['api-key'] as string | undefined) ?? process.env['TESTRAIL_API_KEY'];

if (!baseUrl || !email || !apiKey) {
    err('Missing auth. Set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, TESTRAIL_API_KEY or use --base-url, --email, --api-key flags.');
    process.exit(1);
}

const config: TestRailConfig = { baseUrl, email, apiKey };
const client = new TestRailClient(config);

// ── Numeric Helpers ───────────────────────────────────────────────────────────

function parseId(raw: string | undefined, name: string): number {
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n <= 0) {
        err(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
        process.exit(1);
    }
    return n;
}

function optInt(raw: string | undefined): number | undefined {
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
}

const suiteId = optInt(values['suite-id'] as string | undefined);
const limit = optInt(values.limit as string | undefined);
const offset = optInt(values.offset as string | undefined);

// ── Command Dispatch ──────────────────────────────────────────────────────────

async function run(): Promise<void> {
    switch (resource) {
        case 'project': {
            if (action === 'get') {
                const id = parseId(idArg, 'project id');
                out(await client.getProject(id));
            } else if (action === 'list') {
                out(await client.getProjects(limit, offset));
            } else {
                err(`Unknown action '${action}' for project. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        case 'suite': {
            if (action === 'get') {
                const id = parseId(idArg, 'suite id');
                out(await client.getSuite(id));
            } else if (action === 'list') {
                const pid = parseId(values['project-id'] as string | undefined, '--project-id');
                out(await client.getSuites(pid));
            } else {
                err(`Unknown action '${action}' for suite. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        case 'case': {
            if (action === 'get') {
                const id = parseId(idArg, 'case id');
                out(await client.getCase(id));
            } else if (action === 'list') {
                const pid = parseId(values['project-id'] as string | undefined, '--project-id');
                out(await client.getCases(pid, suiteId !== undefined ? { suiteId } : undefined));
            } else {
                err(`Unknown action '${action}' for case. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        case 'run': {
            if (action === 'get') {
                const id = parseId(idArg, 'run id');
                out(await client.getRun(id));
            } else if (action === 'list') {
                const pid = parseId(values['project-id'] as string | undefined, '--project-id');
                out(await client.getRuns(pid, limit, offset));
            } else {
                err(`Unknown action '${action}' for run. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        case 'result': {
            if (action === 'list') {
                const rid = parseId(values['run-id'] as string | undefined, '--run-id');
                out(await client.getResultsForRun(rid, limit, offset));
            } else {
                err(`Unknown action '${action}' for result. Use: list`);
                process.exit(1);
            }
            break;
        }
        case 'milestone': {
            if (action === 'get') {
                const id = parseId(idArg, 'milestone id');
                out(await client.getMilestone(id));
            } else if (action === 'list') {
                const pid = parseId(values['project-id'] as string | undefined, '--project-id');
                out(await client.getMilestones(pid, limit, offset));
            } else {
                err(`Unknown action '${action}' for milestone. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        case 'user': {
            if (action === 'get') {
                const id = parseId(idArg, 'user id');
                out(await client.getUser(id));
            } else if (action === 'list') {
                out(await client.getUsers(limit, offset));
            } else {
                err(`Unknown action '${action}' for user. Use: get, list`);
                process.exit(1);
            }
            break;
        }
        default: {
            err(`Unknown resource '${resource}'. Use: project, suite, case, run, result, milestone, user`);
            process.exit(1);
        }
    }
}

run().then(() => {
    client.destroy();
    process.exit(0);
}).catch((e: unknown) => {
    err(e instanceof Error ? e.message : String(e));
    client.destroy();
    process.exit(1);
});
