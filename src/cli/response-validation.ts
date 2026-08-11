import type { ZodIssue } from 'zod';
import { HTTP_OK_STATUS, MAX_CLI_SCHEMA_MISMATCH_WARNINGS } from '../constants.js';
import { handleZodError, TestRailApiError } from '../errors.js';
import type { SchemaMismatch } from '../types.js';

/** Environment variable that enables fail-closed CLI response validation. */
export const STRICT_RESPONSES_ENV_VAR = 'TESTRAIL_STRICT_RESPONSES';

export type StrictResponsesResolution =
    { readonly ok: true; readonly strict: boolean } | { readonly ok: false; readonly error: string };

/**
 * Resolve strict response validation without accepting ambiguous truthy values.
 *
 * The explicit flag enables strict mode. The environment variable accepts only
 * `1` (strict), `0` (advisory), or empty/unset (advisory). An invalid environment
 * value is rejected even when the flag is present so a broken CI configuration
 * cannot remain hidden.
 */
export function resolveStrictResponses(flagEnabled: boolean, envValue: string | undefined): StrictResponsesResolution {
    if (envValue !== undefined && envValue !== '' && envValue !== '0' && envValue !== '1') {
        return {
            ok: false,
            error: `${STRICT_RESPONSES_ENV_VAR} must be exactly '1', '0', or empty/unset.`,
        };
    }

    return { ok: true, strict: flagEnabled || envValue === '1' };
}

interface FlattenedIssue {
    readonly code: string;
    readonly path: readonly PropertyKey[];
}

/**
 * Recursively expose Zod's nested union/key/element failures without reading
 * issue messages or input values. Nested issue paths are relative to their
 * parent in Zod 4, so each level contributes its path to the flattened result.
 */
function flattenIssues(
    issues: readonly ZodIssue[],
    parentPath: readonly PropertyKey[] = [],
): readonly FlattenedIssue[] {
    return issues.flatMap((issue): readonly FlattenedIssue[] => {
        const path = [...parentPath, ...issue.path];
        const current: FlattenedIssue = { code: issue.code, path };

        if (issue.code === 'invalid_union') {
            return [current, ...issue.errors.flatMap((branch) => flattenIssues(branch, path))];
        }
        if (issue.code === 'invalid_key' || issue.code === 'invalid_element') {
            return [current, ...flattenIssues(issue.issues, path)];
        }
        return [current];
    });
}

const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const READ_ONLY_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
const SAFE_COMMAND_TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_ISSUE_CODE = /^[a-z][a-z0-9_]*$/;
const NORMALIZED_SEGMENT = '*';
const INDETERMINATE_WRITE_STATUS_TEXT =
    'Write request succeeded but returned an unrecognized response; write outcome is indeterminate';

function normalizeMethod(method: string): string {
    const normalized = method.toUpperCase();
    return SAFE_METHODS.has(normalized) ? normalized : 'UNKNOWN';
}

function normalizeCommandToken(token: string): string {
    return SAFE_COMMAND_TOKEN.test(token) ? token : 'unknown';
}

function normalizeIssueCode(code: string): string {
    return SAFE_ISSUE_CODE.test(code) ? code : 'unknown';
}

function formatPath(path: readonly PropertyKey[]): string {
    if (path.length === 0) return '$';
    // Zod paths can contain response-controlled record/catchall keys. Preserve
    // only structural depth; every segment is masked regardless of syntax.
    return `$.${path.map(() => NORMALIZED_SEGMENT).join('.')}`;
}

export interface CliSchemaMismatchReporter {
    readonly onSchemaMismatch: (mismatch: SchemaMismatch) => void;
    /** Emit the bounded, privacy-safe count of unique warnings not shown. */
    readonly flush: () => void;
}

export interface CliSchemaMismatchReporterOptions {
    readonly strict: boolean;
    readonly quiet: boolean;
    readonly resource: string;
    readonly action: string;
    /** Injectable for focused tests; production defaults to process.stderr. */
    readonly write?: ((chunk: string) => void) | undefined;
}

/**
 * Build the CLI's synchronous schema-mismatch hook.
 *
 * Advisory output deliberately never reads the mismatch endpoint, response
 * data, issue messages, or issue inputs. Only the method plus the already
 * dispatched CLI command and normalized Zod issue code/path reach stderr.
 */
export function createCliSchemaMismatchReporter(options: CliSchemaMismatchReporterOptions): CliSchemaMismatchReporter {
    const methodFor = (method: string): string => normalizeMethod(method);
    const command = `${normalizeCommandToken(options.resource)}:${normalizeCommandToken(options.action)}`;
    const write =
        options.write ??
        ((chunk: string): void => {
            process.stderr.write(chunk);
        });
    const seen = new Set<string>();
    let emittedCount = 0;
    let suppressedCount = 0;
    let flushed = false;

    const onSchemaMismatch = (mismatch: SchemaMismatch): void => {
        if (options.strict) {
            const method = methodFor(mismatch.method);
            if (!READ_ONLY_METHODS.has(method)) {
                // The server already returned a successful response to a
                // mutating request. Preserve the indeterminate-write warning
                // so CI does not interpret a schema error as safe to retry.
                throw new TestRailApiError(HTTP_OK_STATUS, INDETERMINATE_WRITE_STATUS_TEXT);
            }
            throw handleZodError(mismatch.error);
        }
        if (options.quiet) return;

        for (const issue of flattenIssues(mismatch.error.issues)) {
            const method = methodFor(mismatch.method);
            const code = normalizeIssueCode(issue.code);
            const path = formatPath(issue.path);
            const signature = `${method}\u0000${command}\u0000${code}\u0000${path}`;
            if (seen.has(signature)) continue;
            seen.add(signature);

            if (emittedCount < MAX_CLI_SCHEMA_MISMATCH_WARNINGS) {
                write(
                    `Warning: response schema mismatch: method=${method} command=${command} code=${code} path=${path}\n`,
                );
                emittedCount += 1;
            } else {
                suppressedCount += 1;
            }
        }
    };

    const flush = (): void => {
        if (flushed) return;
        flushed = true;
        if (options.quiet || suppressedCount === 0) return;

        const noun = suppressedCount === 1 ? 'warning' : 'warnings';
        write(`Warning: suppressed ${suppressedCount} additional response schema mismatch ${noun}.\n`);
    };

    return { onSchemaMismatch, flush };
}
