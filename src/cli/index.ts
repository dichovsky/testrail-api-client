import { createRequire } from 'node:module';
import { TestRailClient } from '../client.js';
import type { TestRailConfig } from '../types.js';
import { MAX_STDIN_BYTES } from '../constants.js';
import { resolveActionInvocation, validateMetaCommandFlags } from './action-invocation.js';
import { resolveAuth } from './auth.js';
import { diagnosticSupportError, withDiagnostics, type ProcessLifetime } from './diagnostics.js';
import { createOutput, isOutputFormat, OUTPUT_FORMATS, type OutputFormat } from './output.js';
import { dispatch, checkDestructiveEnvGate, checkPathParamCount } from './dispatch.js';
import { buildHelpText } from './help.js';
import { runInstallSkill } from './install-skill.js';
import { runUninstallSkill } from './uninstall-skill.js';
import { KNOWN_FLAGS, parseCliArgv, validateSuppliedFlagTypes, type SuppliedFlagOccurrence } from './flags.js';
import { sanitizeForTerminal } from './sanitize.js';
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

/** Exit codes. `2` marks an argv/environment-shape refusal that sent no request. */
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_ARGV_INVALID = 2;

// ── Entry Point ───────────────────────────────────────────────────────────────

/**
 * Everything the CLI touches outside itself.
 *
 * Reaching for `process` directly is what made the CLI untestable: `main` was
 * not exported and ran at module scope, so six test files re-imported the
 * module and polled `process.exitCode`, and the two bugs that actually shipped
 * — stdin detection (#230) and a client-constructor argument (#281) — sat in
 * wiring no unit test could reach.
 *
 * `src/cli.ts` builds the real one; a test supplies fakes and gets an exit code
 * back. Process-wide effects a test must not trigger stay in the wrapper:
 * signal handlers are installed by its `createClient`, and `process.exitCode`
 * is assigned there.
 */
export interface CliRuntime {
    /** argv with the node binary and script path already removed. */
    readonly argv: readonly string[];
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly stdout: (chunk: string) => void;
    readonly stderr: (chunk: string) => void;
    readonly stdin: {
        /** True only for an interactive terminal; a pipe or redirect is false. */
        readonly isTTY: boolean;
        readonly read: (maxBytes: number) => string;
    };
    readonly createClient: (config: TestRailConfig) => TestRailClient;
    /** `process.platform`. Injected so the Windows diagnostic refusal is testable anywhere. */
    readonly platform: string;
    /**
     * Process-exit hooks for the diagnostic reservation. A test supplies a fake
     * rather than registering an `exit` listener it can never remove.
     */
    readonly lifetime: ProcessLifetime;
}

/**
 * Run one CLI invocation and resolve with its exit code.
 *
 * Never throws for an expected failure. `parseCliArgv` and `createOutput` run
 * inside, so an initialization failure is funneled through the same exit-code
 * path rather than escaping as an uncaught module-evaluation error.
 *
 * Two writers still bypass the runtime and reach `process.stdout` directly:
 * `emitStdoutAck` (the raw-binary path behind `attachment get --out -`) and the
 * `install-skill` / `uninstall-skill` meta-commands, which build their own
 * quiet-aware writers. Routing those needs non-optional writers on
 * `HandlerContext`, which is ARCH #13's job — until then a caller cannot assume
 * every byte goes through `runtime.stdout`.
 */
export async function runCli(runtime: CliRuntime): Promise<number> {
    let values: Record<string, unknown>;
    let positionals: string[];
    let suppliedFlags: string[];
    let flagOccurrences: SuppliedFlagOccurrence[];
    try {
        // Shared with the flag-shape tests so neither can drift from the other.
        const parsed = parseCliArgv([...runtime.argv]);
        values = parsed.values;
        positionals = parsed.positionals;
        suppliedFlags = parsed.suppliedFlags;
        flagOccurrences = parsed.flagOccurrences;
    } catch (e: unknown) {
        // Pre-parse failure: `values` is unavailable, so honor --quiet via
        // a raw-argv lookup. parseArgs is highly tolerant under strict:false
        // (it accepts unknown flags and `=`-malformed options), so the only
        // reachable triggers are a non-string argv element or a future-Node
        // tightening; this catch funnels any such failure through the
        // controlled exit path instead of crashing the module, while still
        // honoring the "no stderr writes under --quiet" rule.
        if (!runtime.argv.includes('--quiet')) {
            runtime.stderr(`Error: ${sanitizeForTerminal(e instanceof Error ? e.message : String(e))}\n`);
        }
        // The only failure that cannot use `fail()`: `createOutput` has not run
        // yet, so --quiet is honoured against raw argv instead.
        return EXIT_FAILURE;
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
    const { out, err, errRaw } = createOutput({ quiet, format, stdout: runtime.stdout, stderr: runtime.stderr });

    /**
     * Report a failure and yield its exit code, so the code is a property of
     * the failure rather than a number hand-written at each return. Sixteen
     * sites previously spelled `err(...); return 1;` by hand, with a lone
     * `return 2` among them that read no differently from its neighbours.
     */
    const fail = (message: string, exitCode: number = EXIT_FAILURE): number => {
        err(message);
        return exitCode;
    };

    // Reject unknown --format values with a clear, quiet-aware error. The
    // assignment above defaults invalid values to 'json' so createOutput
    // always gets a valid format (defense-in-depth); the error path below
    // surfaces the typo before any handler runs.
    if (typeof formatRaw === 'string' && !isOutputFormat(formatRaw)) {
        return fail(`unknown --format '${formatRaw}'. Valid values: ${OUTPUT_FORMATS.join(', ')}.`);
    }

    // Post-parse strict gate: reject any flag not in KNOWN_FLAGS. Catches
    // typos like `--dryrun` that parseArgs({strict: false}) would silently
    // accept, bypassing the gate the user intended. See CTF audit #10.
    for (const key of suppliedFlags) {
        if (!KNOWN_FLAGS.has(key)) {
            // CTF #16: err() sanitizes the user-controlled flag name before
            // reflecting it. An argv like `--\x1b]0;evil\x07` would
            // otherwise execute the OSC. err() also honors --quiet.
            return fail(`unknown flag '--${key}'. Run --help for the full list.`);
        }
    }

    const flagTypes = validateSuppliedFlagTypes(flagOccurrences);
    if (!flagTypes.ok) {
        return fail(flagTypes.error);
    }

    if (values['version'] === true) {
        runtime.stdout(`testrail-cli v${VERSION}\n`);
        return EXIT_SUCCESS;
    }

    if (values['help'] === true || positionals.length === 0) {
        runtime.stdout(`${HELP}\n`);
        return EXIT_SUCCESS;
    }

    // `install-skill` is a meta-command (manages the bundled skill on the
    // user's filesystem). It deliberately sits outside the normal
    // resource:action dispatch since there is no API call involved.
    if (positionals[0] === 'install-skill') {
        const metaFlags = validateMetaCommandFlags('install-skill', suppliedFlags);
        if (!metaFlags.ok) {
            return fail(metaFlags.error);
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
            return fail(metaFlags.error);
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
        return fail('Usage: testrail <resource> <action> [args] [options]. Run with --help for details.');
    }

    const dispatched = dispatch(resource, action);
    if (!dispatched.ok) {
        return fail(dispatched.error);
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
        return fail(invocationResult.error);
    }
    const invocation = invocationResult.invocation;

    // The platform restriction is static: reject it before consuming stdin
    // or resolving credentials. Dry-run never reserves a diagnostic file.
    const diagnosticPath = values['diagnostic-file'];
    if (!dryRun && typeof diagnosticPath === 'string') {
        const unsupported = diagnosticSupportError(runtime.platform);
        if (unsupported !== undefined) return fail(unsupported);
    }

    // Validate response-mode configuration before auth resolution or any
    // network work. Primitive argv shape was already checked centrally above;
    // the explicit flag is additive, but does not conceal an invalid
    // environment value.
    const strictResponsesFlag = values['strict-responses'];
    const strictResponses = resolveStrictResponses(strictResponsesFlag === true, runtime.env[STRICT_RESPONSES_ENV_VAR]);
    if (!strictResponses.ok) {
        return fail(strictResponses.error);
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
    const envGate = checkDestructiveEnvGate(actionSpec, runtime.env, dryRun);
    if (!envGate.ok) {
        return fail(envGate.error, EXIT_ARGV_INVALID);
    }

    // Validate path-param count before stdin/auth work so a wrong arg count
    // fails immediately without reading stdin or checking credentials.
    const paramCountResult = checkPathParamCount(actionSpec, pathParams);
    if (!paramCountResult.ok) {
        return fail(paramCountResult.error);
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
        if (runtime.stdin.isTTY) {
            return fail('--api-key-stdin requires the API key to be piped on stdin (e.g. `echo $KEY | testrail ...`).');
        }
        try {
            // Trim trailing newline / whitespace so `echo $KEY | …` works
            // without the user having to strip the \n themselves. The
            // 1 MiB cap (CTF #24) is orders of magnitude beyond any sane
            // API key; if it's exceeded the user piped the wrong thing.
            apiKeyFromStdin = runtime.stdin.read(MAX_STDIN_BYTES).trim();
        } catch (e: unknown) {
            return fail(`cannot read --api-key-stdin: ${e instanceof Error ? e.message : String(e)}`);
        }
        if (apiKeyFromStdin === '') {
            return fail('--api-key-stdin received an empty stdin input.');
        }
    }

    const auth = resolveAuth(
        {
            baseUrl: values['base-url'] as string | undefined,
            email: values['email'] as string | undefined,
            apiKey: apiKeyFromStdin,
        },
        {
            ...(runtime.env['TESTRAIL_BASE_URL'] !== undefined && {
                TESTRAIL_BASE_URL: runtime.env['TESTRAIL_BASE_URL'],
            }),
            ...(runtime.env['TESTRAIL_EMAIL'] !== undefined && { TESTRAIL_EMAIL: runtime.env['TESTRAIL_EMAIL'] }),
            ...(runtime.env['TESTRAIL_API_KEY'] !== undefined && { TESTRAIL_API_KEY: runtime.env['TESTRAIL_API_KEY'] }),
        },
    );

    if (!auth.ok) {
        return fail(auth.error);
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
        ...(!runtime.stdin.isTTY &&
            !isFileInputAction &&
            !apiKeyStdin &&
            values['data'] === undefined &&
            values['data-file'] === undefined && { readStdin: () => runtime.stdin.read(MAX_STDIN_BYTES) }),
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
    // Set by the scope's `reportFailure`. A rejection that bypasses it — a
    // throw from the warning writer inside the scope's `finally`, or from the
    // mismatch flush below — would otherwise exit 1 with nothing on stderr.
    let reported = false;
    const timeoutFlag = values['timeout'] as string | undefined;
    const timeoutEnv = runtime.env['TESTRAIL_TIMEOUT'];
    const usingTimeoutFlag = timeoutFlag !== undefined && timeoutFlag !== '';
    const timeoutRaw = usingTimeoutFlag
        ? timeoutFlag
        : timeoutEnv !== undefined && timeoutEnv !== ''
          ? timeoutEnv
          : undefined;
    // Name the actual source in any parse error so a bad TESTRAIL_TIMEOUT
    // isn't reported as a bad `--timeout`.
    const timeoutSource = usingTimeoutFlag ? '--timeout' : 'TESTRAIL_TIMEOUT';
    let timeoutConfig: { timeout?: number } = {};
    if (timeoutRaw !== undefined) {
        try {
            timeoutConfig = { timeout: parseId(timeoutRaw, timeoutSource) };
        } catch (e: unknown) {
            // An argv/env shape error, refused like every other one — and
            // before any diagnostic file is reserved, as it always was.
            return fail(e instanceof Error ? e.message : String(e));
        }
    }

    try {
        await withDiagnostics(
            {
                path: diagnosticPath,
                otherOutput: values['out'],
                dryRun,
                credentials: auth.config,
            },
            {
                lifetime: runtime.lifetime,
                warn: errRaw,
                reportFailure: (error) => {
                    reported = true;
                    schemaMismatchReporter.flush();
                    // err() already sanitizes; passing the raw message is safe.
                    err(error instanceof Error ? error.message : String(error));
                },
            },
            async (scope) => {
                try {
                    client = runtime.createClient({
                        ...auth.config,
                        ...timeoutConfig,
                        onSchemaMismatch: schemaMismatchReporter.onSchemaMismatch,
                        // A polling action re-reads one endpoint for the life of
                        // the process. The GET cache's default TTL is longer than
                        // any interval the CLI accepts, so leaving it on served
                        // every poll after the first from cache and the watcher
                        // never observed the run finishing (issue #281). One-shot
                        // actions keep the cache.
                        ...(invocation.spec.polls === true && { enableCache: false }),
                    });
                    // Past this point a failure may have reached TestRail, so the
                    // record reports an indeterminate outcome rather than
                    // "nothing was sent".
                    scope.markDispatched();
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
                } finally {
                    // Inside the scope so disposal keeps its position relative
                    // to finalizing the reservation, as it had before this
                    // protocol moved. No behaviour is known to depend on the
                    // order — `credentials` is a separate object from the one
                    // the client holds, so `destroy()` zeroing its credential
                    // cannot blank the redaction source. Preserved rather than
                    // required; don't let a future change make `credentials`
                    // alias the client's own config.
                    client?.destroy();
                }
            },
        );

        schemaMismatchReporter.flush();
        return EXIT_SUCCESS;
    } catch (e: unknown) {
        // Normally already reported by `reportFailure`; the scope rethrows the
        // original error only so this arm can choose the exit code.
        if (!reported) err(e instanceof Error ? e.message : String(e));
        return EXIT_FAILURE;
    }
}
