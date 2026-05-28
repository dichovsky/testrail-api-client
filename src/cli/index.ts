#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { TestRailClient } from '../client.js';
import { MAX_STDIN_BYTES } from '../constants.js';
import { resolveAuth } from './auth.js';
import { createOutput, type OutputFormat } from './output.js';
import { dispatch, checkDestructiveEnvGate, checkPathParamCount } from './dispatch.js';
import { getActionSpec } from './metadata.js';
import { buildHelpText } from './help.js';
import { runInstallSkill } from './install-skill.js';
import { runUninstallSkill } from './uninstall-skill.js';
import { CLI_OPTIONS, KNOWN_FLAGS } from './flags.js';
import { sanitizeForTerminal } from './sanitize.js';
import { readBoundedStdin } from './stdin.js';
import { STDIN_SENTINEL } from './file-input.js';
import { STDOUT_SENTINEL } from './file-output.js';
import type { BodyInput, HandlerArgs } from './handler-context.js';

// ── Version ───────────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url);
const VERSION: string = (require('../../package.json') as { version: string }).version;

// ── Help ──────────────────────────────────────────────────────────────────────

// HELP is derived from `ACTIONS` at module load (see `src/cli/help.ts`).
// Adding a new resource:action no longer requires editing this file — the
// `buildHelpText()` emitter iterates `ACTIONS` for the action sections and
// composes them with the static trailing blocks (auth, options, etc.).
const HELP = buildHelpText();

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
    } catch (e: unknown) {
        // Pre-parse failure: `values` is unavailable, so honor --quiet via
        // a raw-argv lookup. parseArgs is highly tolerant under strict:false
        // (it accepts unknown flags and `=`-malformed options), so the only
        // reachable triggers are a non-string argv element or a future-Node
        // tightening; this catch funnels any such failure through the
        // controlled exit path instead of crashing the module, while still
        // honoring the "no stderr writes under --quiet" rule.
        if (!process.argv.includes('--quiet')) {
            process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        }
        return 1;
    }

    // Derive --quiet / --format up-front so the unknown-flag gate and the
    // --api-key-stdin gate (both below) can route their errors through the
    // quiet-aware `err()` helper instead of bypassing it with direct
    // process.stderr.write calls.
    const quiet = values['quiet'] === true;
    const formatRaw = values['format'];
    // Resolve --format to a known OutputFormat. parseArgs declares the flag
    // as a string with default 'json' so an unknown value (e.g. `--format
    // xml`) reaches this gate as a free-form string and must be rejected
    // explicitly — otherwise the renderer would silently fall through to
    // the JSON path, masking the user's typo.
    const VALID_FORMATS: ReadonlySet<OutputFormat> = new Set(['json', 'table', 'yaml', 'csv']);
    const format: OutputFormat =
        typeof formatRaw === 'string' && VALID_FORMATS.has(formatRaw as OutputFormat)
            ? (formatRaw as OutputFormat)
            : 'json';
    const { out, err, errRaw } = createOutput({ quiet, format });

    // Reject unknown --format values with a clear, quiet-aware error. The
    // assignment above defaults invalid values to 'json' so createOutput
    // always gets a valid format (defense-in-depth); the error path below
    // surfaces the typo before any handler runs.
    if (typeof formatRaw === 'string' && !VALID_FORMATS.has(formatRaw as OutputFormat)) {
        err(`unknown --format '${formatRaw}'. Valid values: json, table, yaml, csv.`);
        return 1;
    }

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

    // `uninstall-skill` is the symmetric reverse of `install-skill`. Same
    // meta-command rationale: no API call, no resource:action dispatch.
    // Only removes the skill file (and its empty parent dir); does NOT
    // touch .continue / AGENTS.md (separate lifecycle).
    if (positionals[0] === 'uninstall-skill') {
        return runUninstallSkill({
            global: values['global'] === true,
            quiet,
        });
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

    // Defense-in-depth env-var gate for destructive actions. Runs before
    // auth resolution and before the handler is invoked so an unset env var
    // surfaces as a deterministic argv-shape failure (exit code 2) rather
    // than burning an API call or leaking timing about credential validity.
    // `--dry-run` bypasses this gate because preview is non-destructive by
    // definition (no API call leaves the process). The gate runs IN ADDITION
    // TO the per-handler `--yes` check — both must be satisfied. See SEC
    // notes in CHANGELOG.md for the breaking-change rationale.
    const dryRun = values['dry-run'] === true;
    const actionSpec = getActionSpec(resource, action);
    const envGate = checkDestructiveEnvGate(actionSpec, process.env, dryRun);
    if (!envGate.ok) {
        err(envGate.error);
        return 2;
    }

    // Validate path-param count before stdin/auth work so a wrong arg count
    // fails immediately without reading stdin or checking credentials.
    const paramCountResult = checkPathParamCount(actionSpec, pathParams);
    if (!paramCountResult.ok) {
        err(paramCountResult.error);
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
        // `--email` is consumed twice by design: once by resolveAuth() above
        // for the HTTP Basic credential (where the flag takes priority over
        // TESTRAIL_EMAIL), and once here for `user get-by-email`'s query
        // payload. Note: passing `--email alice@…` will authenticate AS that
        // email, which is the intended behavior when a script supplies the
        // matching API key. Callers who need to look up a third party while
        // authenticating as a different identity should set TESTRAIL_EMAIL
        // for auth and omit `--email` in favor of a different lookup path
        // (e.g. `user get <id>`). Read handlers ignore this when irrelevant;
        // the user get-by-email handler enforces non-empty before issuing
        // the call.
        ...(values['email'] !== undefined && { email: values['email'] as string }),
        ...(values['interval'] !== undefined && { interval: values['interval'] as string }),
        ...(values['once'] === true && { once: true }),
    };

    // Suppress stdin only when the dispatched action's ActionSpec marks it
    // as a file-input action (`fileInput: true`). Gating purely on `--file`
    // presence would also kill stdin for unrelated actions where `--file`
    // is a typo/no-op (e.g. `echo '{...}' | testrail result add ... --file
    // x`), surfacing as a misleading "Body required" error instead of the
    // ignored flag.
    const isFileInputAction = actionSpec?.fileInput === true;
    const isFileOutputAction = actionSpec?.fileOutput === true;

    // PR3a: `--file -` (binary stdin upload) and `--out -` (binary stdout
    // download) mutual-exclusion + safety gates. Enforced here, before
    // dispatch, so handlers receive a guaranteed-consistent ctx:
    //   1. `--file -` requires a file-input action — for non-upload actions
    //      the dash would be parsed as a filesystem path and stat would
    //      fail with a confusing 'ENOENT' error.
    //   2. `--file -` cannot coexist with `--data` / `--data-file` — a
    //      single handler cannot consume both a JSON body and a binary
    //      stdin payload; the conflicting flags would silently pick one
    //      (today: stdin) and surprise the caller.
    //   3. `--file -` is incompatible with `--api-key-stdin` — both want to
    //      own fd 0. Catch the conflict here rather than letting the upload
    //      reader read a credential.
    //   4. `--out -` requires a file-output action — for read/write actions
    //      that don't download binary content the flag is silently ignored,
    //      which would leave the user confused about where their output went.
    //      (SEC M1 / security-review note)
    //   5. `--out -` with `--format table` is rejected — table is a
    //      text-format hint that has no meaning for raw binary output.
    const fileFlagIsStdin = values['file'] === STDIN_SENTINEL;
    const outFlagIsStdout = values['out'] === STDOUT_SENTINEL;

    if (fileFlagIsStdin) {
        if (!isFileInputAction) {
            err("--file '-' is only valid for attachment upload actions and 'bdd add'.");
            return 1;
        }
        if (values['data'] !== undefined || values['data-file'] !== undefined) {
            err("--file '-' cannot be combined with --data or --data-file (stdin has one source).");
            return 1;
        }
        if (apiKeyStdin) {
            err("--file '-' cannot be combined with --api-key-stdin (stdin has one consumer).");
            return 1;
        }
    }

    if (outFlagIsStdout) {
        if (!isFileOutputAction) {
            err("--out '-' is only valid for actions that download binary content (attachment get, bdd get).");
            return 1;
        }
        if (formatRaw === 'table') {
            err("--out '-' streams raw binary; --format table is meaningless and was rejected.");
            return 1;
        }
    }

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

    const force = values['force'] === true;
    const confirmDestructive = values['yes'] === true;

    let client: TestRailClient | undefined;
    try {
        // The CLI is a standalone entry-point process: opt in to the
        // signal handlers so Ctrl-C / SIGTERM trigger destroy() and the
        // conventional 130/143 exit codes. Library consumers leave this off.
        client = new TestRailClient({ ...auth.config, registerProcessHandlers: true });
        await dispatched.handler({ client, args, bodyInput, dryRun, force, confirmDestructive, out, err, errRaw });
        return 0;
    } catch (e: unknown) {
        // err() already sanitizes; passing the raw message is safe.
        err(e instanceof Error ? e.message : String(e));
        return 1;
    } finally {
        client?.destroy();
    }
}

// main() catches all reachable errors internally and resolves with an exit
// code; this rejection arm is a last-resort net for a hypothetical failure
// that bypasses the inner try/catch (e.g. a synchronous throw from a
// collaborator invoked outside main()'s try). It sanitizes the message before
// writing to stderr so a control-char-laden error can't inject a terminal
// escape, then exits non-zero.
main().then(
    (code) => process.exit(code),
    (e: unknown) => {
        process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        process.exit(1);
    },
);
