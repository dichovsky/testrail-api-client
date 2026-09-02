#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { TestRailClient } from '../client.js';
import { MAX_STDIN_BYTES } from '../constants.js';
import { resolveActionInvocation, validateMetaCommandFlags } from './action-invocation.js';
import { resolveAuth } from './auth.js';
import { createOutput, isOutputFormat, OUTPUT_FORMATS, type OutputFormat } from './output.js';
import { dispatch, checkDestructiveEnvGate, checkPathParamCount } from './dispatch.js';
import { buildHelpText } from './help.js';
import { runInstallSkill } from './install-skill.js';
import { runUninstallSkill } from './uninstall-skill.js';
import { CLI_OPTIONS, KNOWN_FLAGS, validateSuppliedFlagTypes } from './flags.js';
import { sanitizeForTerminal } from './sanitize.js';
import { readBoundedStdin } from './stdin.js';
import { parseId } from './ids.js';
import type { BodyInput } from './handler-context.js';
import {
    createCliSchemaMismatchReporter,
    resolveStrictResponses,
    STRICT_RESPONSES_ENV_VAR,
} from './response-validation.js';

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
 * Compute the exit code in an async function and assign `process.exitCode`
 * at the very end. An immediate `process.exit()` can truncate pipe-backed
 * stdout on supported Node releases. parseArgs and createOutput are invoked inside main() so
 * any failure during initialization (e.g. an invalid CLI shape that makes
 * parseArgs throw) is funneled through the same exit-code return path
 * rather than escaping as an uncaught module-evaluation error.
 */
async function main(): Promise<number> {
    let values: Record<string, unknown>;
    let positionals: string[];
    let suppliedFlags: string[];
    try {
        const parsed = parseArgs({
            args: process.argv.slice(2),
            options: CLI_OPTIONS,
            allowPositionals: true,
            strict: false,
            tokens: true,
        });
        values = parsed.values;
        positionals = parsed.positionals;
        suppliedFlags = parsed.tokens.filter((token) => token.kind === 'option').map((token) => token.name);
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
    const format: OutputFormat = isOutputFormat(formatRaw) ? formatRaw : 'json';
    const { out, err, errRaw } = createOutput({ quiet, format });

    // Reject unknown --format values with a clear, quiet-aware error. The
    // assignment above defaults invalid values to 'json' so createOutput
    // always gets a valid format (defense-in-depth); the error path below
    // surfaces the typo before any handler runs.
    if (typeof formatRaw === 'string' && !isOutputFormat(formatRaw)) {
        err(`unknown --format '${formatRaw}'. Valid values: ${OUTPUT_FORMATS.join(', ')}.`);
        return 1;
    }

    // Post-parse strict gate: reject any flag not in KNOWN_FLAGS. Catches
    // typos like `--dryrun` that parseArgs({strict: false}) would silently
    // accept, bypassing the gate the user intended. See CTF audit #10.
    for (const key of suppliedFlags) {
        if (!KNOWN_FLAGS.has(key)) {
            // CTF #16: err() sanitizes the user-controlled flag name before
            // reflecting it. An argv like `--\x1b]0;evil\x07` would
            // otherwise execute the OSC. err() also honors --quiet.
            err(`unknown flag '--${key}'. Run --help for the full list.`);
            return 1;
        }
    }

    const flagTypes = validateSuppliedFlagTypes(values, suppliedFlags);
    if (!flagTypes.ok) {
        err(flagTypes.error);
        return 1;
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
        const metaFlags = validateMetaCommandFlags('install-skill', suppliedFlags);
        if (!metaFlags.ok) {
            err(metaFlags.error);
            return 1;
        }
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
        const metaFlags = validateMetaCommandFlags('uninstall-skill', suppliedFlags);
        if (!metaFlags.ok) {
            err(metaFlags.error);
            return 1;
        }
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

    const actionSpec = dispatched.spec;

    const dryRun = values['dry-run'] === true;
    const invocationResult = resolveActionInvocation({
        spec: actionSpec,
        values,
        suppliedFlags,
        pathParams,
        dryRun,
    });
    if (!invocationResult.ok) {
        err(invocationResult.error);
        return 1;
    }
    const invocation = invocationResult.invocation;

    // Validate response-mode configuration before auth resolution or any
    // network work. Primitive argv shape was already checked centrally above;
    // the explicit flag is additive, but does not conceal an invalid
    // environment value.
    const strictResponsesFlag = values['strict-responses'];
    const strictResponses = resolveStrictResponses(strictResponsesFlag === true, process.env[STRICT_RESPONSES_ENV_VAR]);
    if (!strictResponses.ok) {
        err(strictResponses.error);
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
    const pagination = invocation.pagination;
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
        // Reject only when stdin is an interactive TTY. Node sets
        // `process.stdin.isTTY` to `true` for a terminal and leaves it
        // `undefined` for a pipe/redirect — it is never `false`, so the old
        // `!== false` test rejected the documented `echo $KEY | testrail …`
        // pipe. Mirror the canonical TTY check in file-input.ts.
        if (process.stdin.isTTY === true) {
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

    const args = invocation.args;

    // File-input capability owns stdin. The action-invocation seam has already
    // rejected unrelated file flags and every stdio ownership conflict.
    const isFileInputAction = actionSpec.fileInput === true;

    const bodyInput: BodyInput = {
        ...(values['data'] !== undefined && { dataFlag: values['data'] as string }),
        ...(values['data-file'] !== undefined && { dataFileFlag: values['data-file'] as string }),
        // Pass a thunk (not the read contents) so resolveBody() only drains
        // stdin when it actually selects stdin as the body source. Only
        // register when stdin is not a TTY (pipe/redirect), no explicit body
        // flag was supplied (--data/--data-file), and the action doesn't own
        // stdin for another purpose (file-input or --api-key-stdin). This
        // prevents "Multiple body sources" errors in non-interactive
        // environments (CI, Docker, cron) where isTTY=undefined but the user
        // already passed --data.
        ...(process.stdin.isTTY !== true &&
            !isFileInputAction &&
            !apiKeyStdin &&
            values['data'] === undefined &&
            values['data-file'] === undefined && { readStdin: () => readBoundedStdin(MAX_STDIN_BYTES) }),
    };

    const force = values['force'] === true;
    const confirmDestructive = values['yes'] === true;
    const schemaMismatchReporter = createCliSchemaMismatchReporter({
        strict: strictResponses.strict,
        quiet,
        resource,
        action,
    });

    let client: TestRailClient | undefined;
    try {
        // Resolve the request timeout (milliseconds). `--timeout` beats
        // TESTRAIL_TIMEOUT beats the 30s default; an empty value is treated as
        // unset (parity with resolveAuth's ''-is-missing rule). parseId rejects
        // a non-positive-integer value (IdParseError → caught below → exit 1);
        // the constructor's validateTimeout rejects out-of-range (> 5 min) via
        // TestRailValidationError.
        const timeoutFlag = values['timeout'] as string | undefined;
        const timeoutEnv = process.env['TESTRAIL_TIMEOUT'];
        const usingTimeoutFlag = timeoutFlag !== undefined && timeoutFlag !== '';
        const timeoutRaw = usingTimeoutFlag
            ? timeoutFlag
            : timeoutEnv !== undefined && timeoutEnv !== ''
              ? timeoutEnv
              : undefined;
        // Name the actual source in any parse error so a bad TESTRAIL_TIMEOUT
        // isn't reported as a bad `--timeout`.
        const timeoutSource = usingTimeoutFlag ? '--timeout' : 'TESTRAIL_TIMEOUT';
        const timeoutConfig = timeoutRaw !== undefined ? { timeout: parseId(timeoutRaw, timeoutSource) } : {};
        // The CLI is a standalone entry-point process: opt in to the
        // signal handlers so Ctrl-C / SIGTERM trigger destroy() and the
        // conventional 130/143 exit codes. Library consumers leave this off.
        client = new TestRailClient({
            ...auth.config,
            ...timeoutConfig,
            registerProcessHandlers: true,
            onSchemaMismatch: schemaMismatchReporter.onSchemaMismatch,
        });
        await invocation.spec.handler({
            client,
            actionSpec: invocation.spec,
            args,
            pagination,
            bodyInput,
            dryRun,
            force,
            confirmDestructive,
            out,
            err,
            errRaw,
        });
        schemaMismatchReporter.flush();
        return 0;
    } catch (e: unknown) {
        schemaMismatchReporter.flush();
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
// escape, then leaves the event loop to flush both output streams naturally.
main().then(
    (code) => {
        process.exitCode = code;
    },
    (e: unknown) => {
        process.stderr.write(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        process.exitCode = 1;
    },
);
