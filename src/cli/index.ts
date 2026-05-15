#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { TestRailClient } from '../client.js';
import { resolveAuth } from './auth.js';
import { createOutput } from './output.js';
import { dispatch } from './dispatch.js';
import { getActionSpec } from './metadata.js';
import { runInstallSkill } from './install-skill.js';
import type { BodyInput, HandlerArgs } from './handler-context.js';

// ── Version ───────────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
const VERSION: string = (require('../../package.json') as { version: string }).version;

// ── Help ──────────────────────────────────────────────────────────────────────

const HELP = `
testrail <resource> <action> [args] [options]

Read actions:
  project  get <id> | list [--limit N] [--offset N]
  suite    get <id> | list --project-id <id>
  case     get <id> | list --project-id <id> [--suite-id <id>]
  case     history <case_id> [--limit N] [--offset N]
  run      get <id> | list --project-id <id> [--limit N] [--offset N]
  result   list --run-id <id> [--limit N] [--offset N]
  milestone  get <id> | list --project-id <id> [--limit N] [--offset N]
  user     get <id> | list [--limit N] [--offset N]
  plan     get <id> | list --project-id <id> [--limit N] [--offset N]
  shared-step  get <id> | list --project-id <id>
  shared-step  history <shared_update_id> [--limit N] [--offset N]
  case-status  list

Write actions (body via --data | --data-file | stdin):
  case   add <section_id>           --data '{"title":"..."}'
  case   update <case_id>           --data '{"title":"..."}'
  run    add <project_id>           --data '{"name":"..."}'
  run    close <run_id>             (no body)
  result add <run_id> <case_id>     --data '{"status_id":1}'
  result add-bulk <run_id>          --data '{"results":[{"case_id":1,"status_id":1}]}'
  result add-bulk-by-test <run_id>  --data '{"results":[{"test_id":1,"status_id":1}]}'
  plan   add <project_id>           --data '{"name":"...","entries":[{"suite_id":1}]}'
  plan   update <plan_id>           --data '{"name":"..."}'
  plan   add-entry <plan_id>        --data '{"suite_id":1,"include_all":true}'
  section move <section_id>         --data '{"parent_id":null,"after_id":42}'

Attachment actions (binary file I/O):
  attachment list-for-case <case_id>
  attachment list-for-run <run_id>
  attachment list-for-test <test_id>
  attachment list-for-plan <plan_id>
  attachment list-for-plan-entry <plan_id> <entry_id>
  attachment get <attachment_id>           --out <path> [--force]
  attachment add-to-case <case_id>         --file <path> [--filename <name>]
  attachment add-to-result <result_id>     --file <path> [--filename <name>]
  attachment add-to-run <run_id>           --file <path> [--filename <name>]
  attachment add-to-plan <plan_id>         --file <path> [--filename <name>]
  attachment add-to-plan-entry <plan_id> <entry_id>  --file <path> [--filename <name>]
  attachment delete <attachment_id>        --yes

BDD actions (Gherkin .feature text I/O):
  bdd get <case_id>                        --out <path> [--force]
  bdd add <case_id>                        --file <path> [--filename <name>]

Meta:
  install-skill [--global] [--force] [--print-path]
                                    Install the testrail-cli skill to
                                    ./.claude/skills/testrail-cli (default)
                                    or ~/.claude/skills/testrail-cli (--global)

Auth (env var or flag):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  / --api-key <key>

Options:
  --data <json>         Inline JSON body for write actions
  --data-file <path>    Read JSON body from file
  --dry-run             Validate payload but don't call the API
  --format json|table   Output format (default: json)
  --quiet               Suppress output; use exit code 0/1
  --file <path>         Binary file to upload (attachment add-to-* actions)
  --filename <name>     Override the upload filename (default: basename of --file)
  --out <path>          Local path to write the downloaded attachment to (attachment get)
  --force               Overwrite an existing --out file, or an existing SKILL.md (install-skill)
  --yes                 Required to execute destructive actions (e.g. attachment delete)
  --global              install-skill: install to ~/.claude/skills/ (default: ./.claude/skills/)
  --print-path          install-skill: print bundled SKILL.md path and exit
  --help                Show this help
  --version             Print version

For body-bearing write actions (all except 'run close'), exactly one body source
is required (--data | --data-file | stdin). Stdin is auto-detected when input
is piped (process.stdin.isTTY === false). Attachment upload actions take a
binary file via --file <path> and do not accept --data/--data-file/stdin.
Destructive actions (attachment delete) require --yes; pass --dry-run together
with --yes to preview without making the API call (dry-run wins).
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
                data: { type: 'string' },
                'data-file': { type: 'string' },
                'dry-run': { type: 'boolean', default: false },
                global: { type: 'boolean', default: false },
                force: { type: 'boolean', default: false },
                'print-path': { type: 'boolean', default: false },
                file: { type: 'string' },
                filename: { type: 'string' },
                out: { type: 'string' },
                yes: { type: 'boolean', default: false },
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

    // `install-skill` is a meta-command (manages the bundled skill on the
    // user's filesystem). It deliberately sits outside the normal
    // resource:action dispatch since there is no API call involved.
    if (positionals[0] === 'install-skill') {
        return runInstallSkill(
            {
                global: values['global'] === true,
                force: values['force'] === true,
                printPath: values['print-path'] === true,
                quiet,
            },
            import.meta.url,
        );
    }

    const [resource, action, ...rest] = positionals;
    const pathParams: readonly string[] = rest;

    if (resource === undefined || resource === '' || action === undefined || action === '') {
        process.stderr.write('Usage: testrail <resource> <action> [args] [options]\nRun with --help for details.\n');
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
        pathParams,
        ...(values['project-id'] !== undefined && { projectId: values['project-id'] as string }),
        ...(values['suite-id'] !== undefined && { suiteId: values['suite-id'] as string }),
        ...(values['run-id'] !== undefined && { runId: values['run-id'] as string }),
        ...(values['case-id'] !== undefined && { caseId: values['case-id'] as string }),
        ...(values['limit'] !== undefined && { limit: values['limit'] as string }),
        ...(values['offset'] !== undefined && { offset: values['offset'] as string }),
        ...(values['file'] !== undefined && { file: values['file'] as string }),
        ...(values['filename'] !== undefined && { filename: values['filename'] as string }),
        ...(values['out'] !== undefined && { out: values['out'] as string }),
    };

    // Suppress stdin only when the dispatched action's ActionSpec marks it
    // as a file-input action (`fileInput: true`). Gating purely on `--file`
    // presence would also kill stdin for unrelated actions where `--file`
    // is a typo/no-op (e.g. `echo '{...}' | testrail result add ... --file
    // x`), surfacing as a misleading "Body required" error instead of the
    // ignored flag.
    const actionSpec = getActionSpec(resource, action);
    const isFileInputAction = actionSpec?.fileInput === true;

    const bodyInput: BodyInput = {
        ...(values['data'] !== undefined && { dataFlag: values['data'] as string }),
        ...(values['data-file'] !== undefined && { dataFileFlag: values['data-file'] as string }),
        // Pass a thunk (not the read contents) so resolveBody() only drains
        // stdin when it actually selects stdin as the body source. Read
        // actions, no-body writes (`run close`), and write actions that
        // received --data or --data-file never invoke this. File-input
        // actions (e.g. `attachment add-to-case`) suppress stdin entirely
        // since their payload is the binary file, not JSON.
        ...(process.stdin.isTTY === false && !isFileInputAction && { readStdin: () => readFileSync(0, 'utf-8') }),
    };

    const dryRun = values['dry-run'] === true;
    const force = values['force'] === true;
    const confirmDestructive = values['yes'] === true;

    let client: TestRailClient | undefined;
    try {
        client = new TestRailClient(auth.config);
        await dispatched.handler({ client, args, bodyInput, dryRun, force, confirmDestructive, out });
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
