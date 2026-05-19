#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { TestRailClient } from '../client.js';
import { MAX_STDIN_BYTES } from '../constants.js';
import { resolveAuth } from './auth.js';
import { createOutput } from './output.js';
import { dispatch } from './dispatch.js';
import { getActionSpec } from './metadata.js';
import { runInstallSkill } from './install-skill.js';
import { CLI_OPTIONS, KNOWN_FLAGS } from './flags.js';
import { sanitizeForTerminal } from './sanitize.js';
import { readBoundedStdin } from './stdin.js';
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
  result   list-for-test <test_id> [--limit N] [--offset N] [--status-id 1,5] [--defects-filter STR]
  result   list-for-case <run_id> <case_id> [--limit N] [--offset N] [--status-id 1,5] [--defects-filter STR]
  test     get <test_id>
  test     list <run_id> [--status-id 1,5] [--limit N] [--offset N]
  milestone  get <id> | list --project-id <id> [--limit N] [--offset N]
  user     get <id> | list [--limit N] [--offset N]
  plan     get <id> | list --project-id <id> [--limit N] [--offset N]
  section  get <id> | list <id> [--suite-id <id>] [--limit N] [--offset N]
  shared-step  get <id> | list --project-id <id>
  shared-step  history <shared_step_id> [--limit N] [--offset N]
  report   list <project_id> | run <report_template_id>
  variable     list <project_id>

Metadata actions:
  case-field   list                       (no positional args)
  case-status  list                       (no positional args)
  result-field list                       (no positional args)
  status       list                       (no positional args)
  template     list <project_id>

Write actions (body via --data | --data-file | stdin):
  case   add <section_id>           --data '{"title":"..."}'
  case   update <case_id>           --data '{"title":"..."}'
  case   update-bulk <suite_id>     --data '{"case_ids":[1,2],"priority_id":3}'
  case   delete <case_id>           [--soft] --yes  (no body; destructive)
  case   delete-bulk <suite_id>     --project-id <id> [--soft] --data '{"case_ids":[1,2]}' --yes
  case   copy-to-section <section_id>  --data '{"case_ids":[1,2]}'
  case   move-to-section <section_id>  --data '{"case_ids":[1,2],"suite_id":3}'
  run    add <project_id>           --data '{"name":"..."}'
  run    update <run_id>            --data '{"name":"..."}'
  run    close <run_id>             --yes  (no body; irreversible)
  run    delete <run_id>            [--soft] --yes  (no body; destructive)
  result add <run_id> <case_id>     --data '{"status_id":1}'
  result add-bulk <run_id>          --data '{"results":[{"case_id":1,"status_id":1}]}'
  result add-bulk-by-test <run_id>  --data '{"results":[{"test_id":1,"status_id":1}]}'
  plan   add <project_id>           --data '{"name":"...","entries":[{"suite_id":1}]}'
  plan   update <plan_id>           --data '{"name":"..."}'
  plan   add-entry <plan_id>        --data '{"suite_id":1,"include_all":true}'
  plan   add-run-to-entry <plan_id> <entry_id>  --data '{"config_ids":[1,2]}'
  plan   update-entry <plan_id> <entry_id>      --data '{"name":"..."}'
  plan   update-run-in-entry <run_id>           --data '{"description":"..."}'
  plan   close <plan_id>            --yes  (no body; irreversible)
  plan   delete <plan_id>           --yes  (no body; --soft NOT supported by TestRail)
  plan   delete-entry <plan_id> <entry_id>   --yes  (no body; entry_id is a UUID string; --soft NOT supported)
  plan   delete-run-from-entry <run_id>       --yes  (no body; --soft NOT supported)
  section add <project_id>          --data '{"name":"...","suite_id":1}'
  section update <section_id>       --data '{"name":"..."}'
  section move <section_id>         --data '{"parent_id":null,"after_id":42}'
  section delete <section_id>       [--soft] --yes  (no body; destructive)
  case-field add                    --data '{"type":"String","name":"foo","label":"Foo","configs":[{"context":{"is_global":true,"project_ids":[]},"options":{"is_required":false,"default_value":""}}]}' (admin-only)
  project add                       --data '{"name":"...","suite_mode":1}'
  project update <project_id>       --data '{"name":"..."}'
  project delete <project_id>       --yes  (no body; --soft NOT supported by TestRail; highest blast radius)
  suite add <project_id>            --data '{"name":"..."}'
  suite update <suite_id>           --data '{"name":"..."}'
  suite delete <suite_id>           [--soft] --yes  (no body; destructive)
  milestone add <project_id>        --data '{"name":"..."}'
  milestone update <milestone_id>   --data '{"is_completed":true}'
  milestone delete <milestone_id>   --yes  (no body; --soft NOT supported by TestRail)
  variable add <project_id>         --data '{"name":"..."}'
  variable update <variable_id>     --data '{"name":"..."}'
  variable delete <variable_id>     --yes  (no body; --soft NOT supported by TestRail)
  shared-step add <project_id>        --data '{"title":"..."}'  (TestRail 7.0+)
  shared-step update <shared_step_id> --data '{"title":"..."}'  (TestRail 7.0+)
  shared-step delete <shared_step_id> --yes  (no body; --soft NOT supported by TestRail; TestRail 7.0+)

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

Auth (env var preferred — argv is visible to other processes):
  TESTRAIL_BASE_URL / --base-url <url>
  TESTRAIL_EMAIL    / --email <email>
  TESTRAIL_API_KEY  (recommended) | echo "$KEY" | testrail ... --api-key-stdin
                    NOTE: --api-key (argv) was removed in v3.0 — see CHANGELOG.

Options:
  --api-key-stdin       Read API key from stdin (single line; mutually
                        exclusive with stdin-piped JSON body). Use the
                        TESTRAIL_API_KEY env var when possible.
  --data <json>         Inline JSON body for write actions
  --data-file <path>    Read JSON body from file
  --dry-run             Validate payload but don't call the API
  --format json|table   Output format (default: json)
  --quiet               Suppress output; use exit code 0/1
  --status-id <ids>     Comma-separated TestRail status IDs (test list / result list-for-test / result list-for-case; e.g. 1,5)
  --defects-filter <s>  Substring filter on the result 'defects' field (result list-for-test / list-for-case)
  --file <path>         Binary file to upload (attachment add-to-* actions)
  --filename <name>     Override the upload filename (default: basename of --file)
  --out <path>          Local path to write the downloaded attachment to (attachment get)
  --force               Overwrite an existing --out file, or an existing SKILL.md (install-skill)
  --yes                 Required to execute destructive actions (attachment delete, case delete, case delete-bulk, run close, run delete, section delete, suite delete, milestone delete, project delete, plan close, plan delete, plan delete-entry, plan delete-run-from-entry, variable delete)
  --soft                Server-side preview for soft-capable deletes:
                          case delete, case delete-bulk, run delete,
                          section delete, suite delete.
                        TestRail returns counts without deleting; distinct
                        from --dry-run which makes NO API call.
                        Rejected (TestRail has no --soft support) on:
                          milestone delete, project delete,
                          plan close, plan delete, plan delete-entry,
                          plan delete-run-from-entry, variable delete.
  --global              install-skill: install to ~/.claude/skills/ (default: ./.claude/skills/)
  --print-path          install-skill: print bundled SKILL.md path and exit
  --help                Show this help
  --version             Print version

For body-bearing write actions, exactly one body source is required
(--data | --data-file | stdin). Stdin is auto-detected when input is piped
(process.stdin.isTTY === false). The following write actions take NO body
(any --data / --data-file / stdin is ignored): run close, attachment delete,
case delete, run delete, suite delete, section delete, milestone delete,
project delete, plan close, plan delete, plan delete-entry,
plan delete-run-from-entry, variable delete — they accept only positional id(s) (one for most
actions; plan delete-entry and attachment add-to-plan-entry take two:
<plan_id> <entry_id>) and the optional --soft flag on the soft-capable
deletes. Attachment upload actions take a binary file via --file <path>
and do not accept --data/--data-file/stdin.
Destructive actions (attachment delete, case delete, case delete-bulk, run close,
run delete, section delete, suite delete, milestone delete, project delete,
plan close, plan delete, plan delete-entry, plan delete-run-from-entry,
variable delete)
require --yes; pass --dry-run together with --yes to preview without making the
API call (dry-run wins). 'run close' and 'plan close' are irreversible —
TestRail offers no reopen for either. For soft-capable deletes (case/run/section/suite + case delete-bulk),
pass --soft for a server-side preview that returns affected-entity counts
without deleting; this still hits the API and remains gated by --yes.
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
            options: CLI_OPTIONS,
            allowPositionals: true,
            strict: false,
        });
        values = parsed.values;
        positionals = parsed.positionals;
        /* v8 ignore start -- defensive: parseArgs with strict:false is highly
           tolerant; this catch funnels any future-Node-version edge cases
           through the controlled exit path rather than crashing the module. */
    } catch (e: unknown) {
        // Pre-parse failure: `values` is unavailable, so honor --quiet via
        // a raw-argv lookup. parseArgs failures are rare under strict:false
        // but the rule "no stderr writes under --quiet" still applies.
        if (!process.argv.includes('--quiet')) {
            process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        }
        return 1;
    }
    /* v8 ignore stop */

    // Derive --quiet / --format up-front so the unknown-flag gate and the
    // --api-key-stdin gate (both below) can route their errors through the
    // quiet-aware `err()` helper instead of bypassing it with direct
    // process.stderr.write calls.
    const quiet = values['quiet'] === true;
    const formatRaw = values['format'];
    const format: 'json' | 'table' = formatRaw === 'table' ? 'table' : 'json';
    const { out, err } = createOutput({ quiet, format });

    // Post-parse strict gate: reject any flag not in KNOWN_FLAGS. Catches
    // typos like `--dryrun` that parseArgs({strict: false}) would silently
    // accept, bypassing the gate the user intended. See CTF audit #10.
    for (const key of Object.keys(values)) {
        if (!KNOWN_FLAGS.has(key)) {
            // CTF #16: err() sanitizes the user-controlled flag name before
            // reflecting it. An argv like `--\x1b]0;evil\x07` would
            // otherwise execute the OSC. err() also honors --quiet.
            err(`unknown flag '--${key}'. Run --help for the full list.`);
            return 1;
        }
    }

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
        // err() is the standard quiet-aware path; usage hint is structurally
        // an error message (missing required args), so prefix-format matches
        // every other 'Error: …' write.
        err('Usage: testrail <resource> <action> [args] [options]. Run with --help for details.');
        return 1;
    }

    const dispatched = dispatch(resource, action);
    if (!dispatched.ok) {
        err(dispatched.error);
        return 1;
    }

    // CTF #11: --api-key (argv string) was removed in v3.0 because argv is
    // visible via /proc/<pid>/cmdline, shell history, CI step logs, and
    // crash dumps. Acceptable channels: TESTRAIL_API_KEY env var, or pipe
    // the key on stdin with --api-key-stdin. The stdin path consumes
    // stdin BEFORE the body resolver wires its own stdin thunk — they
    // can't both own fd 0, so the body must come from --data or
    // --data-file when --api-key-stdin is used.
    const apiKeyStdin = values['api-key-stdin'] === true;
    let apiKeyFromStdin: string | undefined;
    if (apiKeyStdin) {
        if (process.stdin.isTTY !== false) {
            err('--api-key-stdin requires the API key to be piped on stdin (e.g. `echo $KEY | testrail ...`).');
            return 1;
        }
        try {
            // Trim trailing newline / whitespace so `echo $KEY | …` works
            // without the user having to strip the \n themselves. The
            // 1 MiB cap (CTF #24) is orders of magnitude beyond any sane
            // API key; if it's exceeded the user piped the wrong thing.
            apiKeyFromStdin = readBoundedStdin(MAX_STDIN_BYTES).trim();
        } catch (e: unknown) {
            err(`cannot read --api-key-stdin: ${e instanceof Error ? e.message : String(e)}`);
            return 1;
        }
        if (apiKeyFromStdin === '') {
            err('--api-key-stdin received an empty stdin input.');
            return 1;
        }
    }

    const auth = resolveAuth(
        {
            baseUrl: values['base-url'] as string | undefined,
            email: values['email'] as string | undefined,
            apiKey: apiKeyFromStdin,
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
        ...(values['status-id'] !== undefined && { statusId: values['status-id'] as string }),
        ...(values['defects-filter'] !== undefined && { defectsFilter: values['defects-filter'] as string }),
        ...(values['file'] !== undefined && { file: values['file'] as string }),
        ...(values['filename'] !== undefined && { filename: values['filename'] as string }),
        ...(values['out'] !== undefined && { out: values['out'] as string }),
        ...(values['soft'] === true && { soft: true }),
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
        // since their payload is the binary file, not JSON. CTF #11:
        // --api-key-stdin already consumed stdin for the credential, so
        // the body must use --data or --data-file.
        ...(process.stdin.isTTY === false &&
            !isFileInputAction &&
            !apiKeyStdin && { readStdin: () => readBoundedStdin(MAX_STDIN_BYTES) }),
    };

    const dryRun = values['dry-run'] === true;
    const force = values['force'] === true;
    const confirmDestructive = values['yes'] === true;

    let client: TestRailClient | undefined;
    try {
        // The CLI is a standalone entry-point process: opt in to the
        // signal handlers so Ctrl-C / SIGTERM trigger destroy() and the
        // conventional 130/143 exit codes. Library consumers leave this off.
        client = new TestRailClient({ ...auth.config, registerProcessHandlers: true });
        await dispatched.handler({ client, args, bodyInput, dryRun, force, confirmDestructive, out });
        return 0;
    } catch (e: unknown) {
        // err() already sanitizes; passing the raw message is safe.
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
        process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        process.exit(1);
    },
);
/* v8 ignore stop */
