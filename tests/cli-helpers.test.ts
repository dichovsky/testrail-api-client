/**
 * Unit tests for extracted CLI helpers (src/cli/{output,ids,auth,dispatch}.ts).
 *
 * These complement tests/cli.test.ts (which exercises the binary via subprocess)
 * by covering edge cases that are tedious to reach through the subprocess path:
 * symbol/function values in renderTable, parseId boundary conditions, and
 * resolveAuth precedence between flags and env.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { valueToString, renderTable, safeJsonStringify } from '../src/cli/output.js';
import { parseId, optInt, parseEntryId, IdParseError } from '../src/cli/ids.js';
import { resolveAuth, MISSING_AUTH_MESSAGE } from '../src/cli/auth.js';
import { dispatch, getRegisteredActions } from '../src/cli/dispatch.js';
import { ACTIONS, getActionSpec } from '../src/cli/metadata.js';
import { CLI_OPTIONS, KNOWN_FLAGS } from '../src/cli/flags.js';
import { sanitizeForTerminal } from '../src/cli/sanitize.js';
import { readBoundedStdin } from '../src/cli/stdin.js';
import { MAX_STDIN_BYTES } from '../src/constants.js';
import { openSync, closeSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('valueToString', () => {
    it('returns empty string for null', () => {
        expect(valueToString(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(valueToString(undefined)).toBe('');
    });

    it('returns the string itself for a string', () => {
        expect(valueToString('hello')).toBe('hello');
    });

    it('returns String(n) for a number', () => {
        expect(valueToString(42)).toBe('42');
    });

    it('returns "true"/"false" for booleans', () => {
        expect(valueToString(true)).toBe('true');
        expect(valueToString(false)).toBe('false');
    });

    it('returns String(b) for bigint', () => {
        expect(valueToString(10n)).toBe('10');
    });

    it('returns Symbol.toString() for a symbol', () => {
        expect(valueToString(Symbol('s'))).toBe('Symbol(s)');
    });

    it('returns "[Function]" for a function value', () => {
        expect(valueToString(() => {})).toBe('[Function]');
    });

    it('JSON.stringifies objects', () => {
        expect(valueToString({ a: 1 })).toBe('{"a":1}');
    });

    it('returns "[Object]" when JSON.stringify throws on a circular reference', () => {
        const circular: Record<string, unknown> = {};
        circular['self'] = circular;
        expect(valueToString(circular)).toBe('[Object]');
    });

    it('returns "[Object]" when an object contains nested BigInt (unserializable)', () => {
        expect(valueToString({ count: 10n })).toBe('[Object]');
    });
});

describe('renderTable', () => {
    it('renders "(empty)" for an empty array', () => {
        expect(renderTable([])).toBe('(empty)');
    });

    it('renders primitives as newline-separated lines', () => {
        expect(renderTable([1, 2, 3])).toBe('1\n2\n3');
    });

    it('renders an array of objects with headers and separator row', () => {
        const out = renderTable([
            { id: 1, name: 'a' },
            { id: 2, name: 'bb' },
        ]);
        expect(out).toContain('id | name');
        expect(out).toContain('1  | a ');
        expect(out).toContain('2  | bb');
    });

    it('renders a single object as one row', () => {
        const out = renderTable({ id: 7, name: 'solo' });
        expect(out).toContain('id | name');
        expect(out).toContain('7  | solo');
    });

    it('renders gracefully when a later row is null (no crash)', () => {
        const out = renderTable([{ id: 1, name: 'a' }, null]);
        expect(out).toContain('id | name');
        // Null row contributes empty cells under each known key.
        expect(out.split('\n')).toHaveLength(4); // header + separator + 2 data rows
    });

    it('renders gracefully when a later row is a primitive (no crash)', () => {
        const out = renderTable([{ id: 1, name: 'a' }, 42]);
        expect(out).toContain('id | name');
        expect(out.split('\n')).toHaveLength(4);
    });

    // CTF #18: TestRail-controlled cell values must be sanitized before
    // landing in the table output. A malicious title containing `\x1b[31m`
    // would otherwise recolour the user's terminal; OSC 0 would spoof the
    // window title; OSC 7/9 can chain into command-injection on terminals
    // that honour it (e.g. iTerm2 dynamic actions).
    it('strips ANSI escapes from cell values (CTF #18)', () => {
        const out = renderTable([{ id: 1, title: 'safe \x1b[31mRED\x1b[0m text' }]);
        expect(out).not.toContain('\x1b');
        expect(out).toContain('safe [31mRED[0m text');
    });

    it('strips BEL + OSC 0 window-title spoofs from cell values', () => {
        const out = renderTable([{ id: 1, title: '\x1b]0;Pwned!\x07legit title' }]);
        expect(out).not.toContain('\x1b');
        expect(out).not.toContain('\x07');
        expect(out).toContain(']0;Pwned!legit title');
    });

    it('strips control chars from column keys too (defense-in-depth)', () => {
        // TestRail field names today are safe (alphanumeric), but the API
        // contract isn't a security boundary — pin the behaviour.
        const out = renderTable([{ 'safe\x1bkey': 'v' }]);
        expect(out).not.toContain('\x1b');
        expect(out).toContain('safekey');
    });

    it('strips control chars from stringified object cell values', () => {
        // Nested objects render via JSON.stringify; the result is sanitized
        // post-stringify so embedded controls in string values don't survive.
        const out = renderTable([{ id: 1, meta: { name: 'a\x1b]0;evil\x07b' } }]);
        expect(out).not.toContain('\x1b');
        expect(out).not.toContain('\x07');
    });

    // Regression for Copilot PR #70 review comment: when the input is a
    // top-level primitive array (string / number / boolean), the renderer
    // takes the early `rows.map(...)` branch — pre-fix, this used `String`
    // directly and bypassed valueToString's sanitization, emitting raw
    // ESC bytes under --format table for primitive-array data.
    it('strips control chars from primitive-array cell values (top-level string array)', () => {
        const out = renderTable(['safe', '\x1b[31mRED\x1b[0m', 'after\x07bell']);
        expect(out).not.toContain('\x1b');
        expect(out).not.toContain('\x07');
        // Sanitized fragments still surface.
        expect(out).toContain('safe');
        expect(out).toContain('[31mRED[0m');
        expect(out).toContain('afterbell');
    });

    it('mixed primitive array (string + number + boolean) sanitizes string entries only', () => {
        const out = renderTable(['a\x1b[1mb', 42, true, '\x07c']);
        expect(out).not.toContain('\x1b');
        expect(out).not.toContain('\x07');
        expect(out).toContain('a[1mb');
        expect(out).toContain('42');
        expect(out).toContain('true');
        expect(out).toContain('c');
    });
});

describe('safeJsonStringify', () => {
    it('returns a pretty-printed JSON string for a plain object', () => {
        const out = safeJsonStringify({ id: 1, name: 'a' });
        expect(JSON.parse(out)).toEqual({ id: 1, name: 'a' });
        expect(out).toContain('\n'); // pretty-printed
    });

    it('returns a structured error JSON when input has a circular reference', () => {
        const circular: Record<string, unknown> = {};
        circular['self'] = circular;
        const out = safeJsonStringify(circular);
        const parsed = JSON.parse(out) as Record<string, unknown>;
        expect(parsed['error']).toBe('unserializable');
        expect(typeof parsed['message']).toBe('string');
    });

    it('returns a structured error JSON when input contains a nested BigInt', () => {
        const out = safeJsonStringify({ count: 10n });
        const parsed = JSON.parse(out) as Record<string, unknown>;
        expect(parsed['error']).toBe('unserializable');
    });

    it('returns the JSON literal "null" when input is undefined (no JSON representation)', () => {
        expect(safeJsonStringify(undefined)).toBe('null');
    });

    it('returns the JSON literal "null" when input is a function (no JSON representation)', () => {
        expect(safeJsonStringify(() => 42)).toBe('null');
    });

    it('returns the JSON literal "null" when input is a symbol (no JSON representation)', () => {
        expect(safeJsonStringify(Symbol('x'))).toBe('null');
    });

    it('output is always valid JSON regardless of input (jq-pipeline guarantee)', () => {
        const cases: unknown[] = [
            { valid: true },
            undefined,
            () => 1,
            Symbol('s'),
            (() => {
                const c: Record<string, unknown> = {};
                c['self'] = c;
                return c;
            })(),
        ];
        for (const c of cases) {
            expect(() => {
                JSON.parse(safeJsonStringify(c));
            }).not.toThrow();
        }
    });
});

describe('parseId', () => {
    it('returns the parsed integer for a valid positive id', () => {
        expect(parseId('5', 'project id')).toBe(5);
    });

    it('throws IdParseError when raw is undefined', () => {
        expect(() => parseId(undefined, 'project id')).toThrow(IdParseError);
    });

    it('throws when raw is empty string', () => {
        expect(() => parseId('', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw is non-numeric', () => {
        expect(() => parseId('abc', 'project id')).toThrow(/positive integer/);
    });

    it('throws when raw is zero', () => {
        expect(() => parseId('0', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw is negative', () => {
        expect(() => parseId('-3', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw is a decimal', () => {
        expect(() => parseId('1.5', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw uses scientific notation (rejects "1e2" even though Number() yields 100)', () => {
        expect(() => parseId('1e2', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw uses a hex prefix (rejects "0x1" even though Number() yields 1)', () => {
        expect(() => parseId('0x1', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw has leading zeros (rejects "01")', () => {
        expect(() => parseId('01', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw has surrounding whitespace (rejects " 5 ")', () => {
        expect(() => parseId(' 5 ', 'project id')).toThrow(IdParseError);
    });

    it('throws when raw has an explicit + sign (rejects "+1")', () => {
        expect(() => parseId('+1', 'project id')).toThrow(IdParseError);
    });

    it('includes the parameter name in the error', () => {
        expect(() => parseId(undefined, '--run-id')).toThrow(/--run-id/);
    });
});

describe('parseEntryId', () => {
    it('returns the trimmed entry id for a valid non-empty string', () => {
        expect(parseEntryId('abc-uuid', 'entry_id')).toBe('abc-uuid');
    });

    it('trims surrounding whitespace before returning', () => {
        expect(parseEntryId('  abc-uuid  ', 'entry_id')).toBe('abc-uuid');
    });

    it('throws IdParseError when raw is undefined', () => {
        expect(() => parseEntryId(undefined, 'entry_id')).toThrow(IdParseError);
    });

    it('throws when raw is empty string', () => {
        expect(() => parseEntryId('', 'entry_id')).toThrow(IdParseError);
    });

    it('throws when raw is whitespace-only', () => {
        expect(() => parseEntryId('   ', 'entry_id')).toThrow(IdParseError);
    });

    it('includes the parameter name in the error', () => {
        expect(() => parseEntryId(undefined, 'entry_id')).toThrow(/entry_id/);
    });
});

describe('optInt', () => {
    it('returns undefined for undefined input', () => {
        expect(optInt(undefined)).toBeUndefined();
    });

    it('returns undefined for non-numeric input', () => {
        expect(optInt('foo')).toBeUndefined();
    });

    it('returns undefined for decimal input', () => {
        expect(optInt('1.5')).toBeUndefined();
    });

    it('returns undefined for negative input', () => {
        expect(optInt('-1')).toBeUndefined();
    });

    it('returns 0 for "0"', () => {
        expect(optInt('0')).toBe(0);
    });

    it('returns the parsed integer for positive input', () => {
        expect(optInt('42')).toBe(42);
    });

    // Boundary cases: parity with parseId's tightening (SEC #27). These
    // inputs are silently dropped to undefined — the caller (pagination
    // resolver) simply omits the param so the request goes through with
    // server defaults rather than coercing a smuggled value.
    it.each([
        ['scientific notation', '1e2'],
        ['hex prefix', '0x1'],
        ['hex prefix (larger)', '0x10'],
        ['leading zero', '01'],
        ['whitespace-padded', ' 5 '],
        ['explicit positive sign', '+1'],
        ['decimal (control)', '1.5'],
    ])('returns undefined for non-decimal form: %s (%s)', (_label, raw) => {
        expect(optInt(raw)).toBeUndefined();
    });

    it.each([
        ['offset boundary "0"', '0', 0],
        ['typical pagination "100"', '100', 100],
    ])('accepts valid non-negative decimal: %s', (_label, raw, expected) => {
        expect(optInt(raw)).toBe(expected);
    });
});

describe('resolveAuth', () => {
    const FULL_FLAGS = {
        baseUrl: 'https://flag.testrail.io',
        email: 'flag@example.com',
        apiKey: 'flag-key',
    };
    const FULL_ENV = {
        TESTRAIL_BASE_URL: 'https://env.testrail.io',
        TESTRAIL_EMAIL: 'env@example.com',
        TESTRAIL_API_KEY: 'env-key',
    };

    it('resolves from flags when all flags are present', () => {
        const result = resolveAuth(FULL_FLAGS, {});
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.config.baseUrl).toBe('https://flag.testrail.io');
            expect(result.config.email).toBe('flag@example.com');
            expect(result.config.apiKey).toBe('flag-key');
        }
    });

    it('resolves from env when no flags are present', () => {
        const result = resolveAuth({ baseUrl: undefined, email: undefined, apiKey: undefined }, FULL_ENV);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.config.baseUrl).toBe('https://env.testrail.io');
        }
    });

    it('flags take precedence over env when both are present', () => {
        const result = resolveAuth(FULL_FLAGS, FULL_ENV);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.config.baseUrl).toBe('https://flag.testrail.io');
            expect(result.config.email).toBe('flag@example.com');
            expect(result.config.apiKey).toBe('flag-key');
        }
    });

    it('returns missing-auth error when all sources empty', () => {
        const result = resolveAuth({ baseUrl: undefined, email: undefined, apiKey: undefined }, {});
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe(MISSING_AUTH_MESSAGE);
        }
    });

    it('returns error when one field is empty string', () => {
        const result = resolveAuth({ baseUrl: 'x', email: 'y', apiKey: '' }, {});
        expect(result.ok).toBe(false);
    });

    it('returns error when only some flags are set', () => {
        const result = resolveAuth({ baseUrl: 'x', email: undefined, apiKey: 'z' }, {});
        expect(result.ok).toBe(false);
    });
});

describe('dispatch', () => {
    it('returns a handler for a valid resource:action', () => {
        const result = dispatch('project', 'get');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(typeof result.handler).toBe('function');
        }
    });

    it('returns Unknown resource error for unknown resource', () => {
        const result = dispatch('webhook', 'list');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain("Unknown resource 'webhook'");
            expect(result.error).toContain('project, suite, case, run, test, result, milestone, user');
        }
    });

    it('returns Unknown action error for valid resource but invalid action', () => {
        const result = dispatch('project', 'nope');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toMatch(/^Unknown action 'nope' for project\./);
        }
    });

    it('rejects result:get (only list/add/add-bulk/add-bulk-by-test are valid for result)', () => {
        const result = dispatch('result', 'get');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain("Unknown action 'get' for result");
        }
    });
});

describe('metadata vs dispatch consistency', () => {
    /**
     * The single source of truth for "what does this CLI support" is split
     * between two places: `HANDLERS` in dispatch.ts (runtime routing) and
     * `ACTIONS` in metadata.ts (documentation + skill-generator input).
     * If they drift, the CLI surface and what we tell agents diverge —
     * exactly the silent-failure mode that motivates these tests.
     */
    it('every metadata entry has a registered dispatch handler', () => {
        for (const spec of ACTIONS) {
            const result = dispatch(spec.resource, spec.action);
            expect(result.ok, `metadata declares ${spec.resource}:${spec.action} but no handler is registered`).toBe(
                true,
            );
        }
    });

    it('every registered dispatch handler has a metadata entry', () => {
        for (const key of getRegisteredActions()) {
            const [resource, action] = key.split(':');
            expect(resource).toBeDefined();
            expect(action).toBeDefined();
            const spec = getActionSpec(resource as string, action as string);
            expect(spec, `handler ${key} is registered in dispatch but has no metadata entry`).toBeDefined();
        }
    });

    it('write actions in metadata carry a body schema except no-body or file-input writes', () => {
        // No-body destructive writes: `run close`, `attachment delete`, plus
        // the six single-entity deletes shipped together with the destructive
        // cluster (`case delete`, `run delete`, `suite delete`, `section
        // delete`, `milestone delete`, `project delete`). All take a single
        // path-param id and POST with no body — gated by `--yes`.
        const NO_BODY_WRITES = new Set([
            'run:close',
            'attachment:delete',
            'case:delete',
            'run:delete',
            'suite:delete',
            'section:delete',
            'milestone:delete',
            'project:delete',
            'plan:close',
            'plan:delete',
            'plan:delete-entry',
            'plan:delete-run-from-entry',
            'variable:delete',
            'shared-step:delete',
            'configuration:delete',
            'configuration-group:delete',
        ]);
        for (const spec of ACTIONS) {
            if (!spec.isWrite) continue;
            const key = `${spec.resource}:${spec.action}`;
            if (NO_BODY_WRITES.has(key)) {
                expect(spec.bodySchema, `${key} should have no body schema`).toBeUndefined();
                continue;
            }
            // File-input writes (attachment upload): payload is binary via --file,
            // so no JSON body schema applies.
            if (spec.fileInput === true) {
                expect(
                    spec.bodySchema,
                    `${spec.resource}:${spec.action} is file-input; should have no body schema`,
                ).toBeUndefined();
                continue;
            }
            expect(spec.bodySchema, `${spec.resource}:${spec.action} should carry a body schema`).toBeDefined();
        }
    });

    it('file-input and bodySchema are mutually exclusive', () => {
        for (const spec of ACTIONS) {
            if (spec.fileInput === true) {
                expect(
                    spec.bodySchema,
                    `${spec.resource}:${spec.action} has fileInput; must not also carry bodySchema`,
                ).toBeUndefined();
            }
        }
    });

    it('destructive actions are flagged as writes', () => {
        for (const spec of ACTIONS) {
            if (spec.destructive === true) {
                expect(spec.isWrite, `${spec.resource}:${spec.action} is destructive; must also be a write`).toBe(true);
            }
        }
    });

    /**
     * Pin the exact set of destructive actions so any future addition of
     * an irreversible operation (e.g., `plan close`) must consciously
     * extend this list, ensuring the `--yes` gate isn't forgotten. CTF
     * audit finding #6 caught `run close` missing from this set — locked
     * in here to prevent regression.
     */
    it('destructive action set includes attachment:delete, case:delete, case:delete-bulk, run:close, run:delete, suite:delete, section:delete, milestone:delete, project:delete, plan:close, plan:delete, plan:delete-entry, plan:delete-run-from-entry, variable:delete, shared-step:delete, configuration:delete, configuration-group:delete', () => {
        const got = new Set(ACTIONS.filter((s) => s.destructive === true).map((s) => `${s.resource}:${s.action}`));
        const want = new Set([
            'attachment:delete',
            'case:delete',
            'case:delete-bulk',
            'run:close',
            'run:delete',
            'suite:delete',
            'section:delete',
            'milestone:delete',
            'project:delete',
            'plan:close',
            'plan:delete',
            'plan:delete-entry',
            'plan:delete-run-from-entry',
            'variable:delete',
            'shared-step:delete',
            'configuration:delete',
            'configuration-group:delete',
        ]);
        expect(got).toEqual(want);
    });

    /**
     * The CLI in src/cli/index.ts gates stdin suppression on
     * `ActionSpec.fileInput === true` (PR #59 review feedback): suppressing
     * stdin purely on `--file` presence would also kill piped JSON bodies
     * for unrelated write actions that happened to have `--file` typo'd in.
     * Lock the discriminator's expected shape so the gate stays correct:
     * only attachment uploads and the BDD upload carry `fileInput: true`;
     * nothing else. `bdd:add` is included because it shares the same
     * multipart pipeline and the same stdin-suppression rationale.
     */
    it('only attachment add-to-* and bdd:add actions are flagged as fileInput', () => {
        for (const spec of ACTIONS) {
            if (spec.fileInput === true) {
                const isAttachmentAdd = spec.resource === 'attachment' && spec.action.startsWith('add-to-');
                const isBddAdd = spec.resource === 'bdd' && spec.action === 'add';
                expect(
                    isAttachmentAdd || isBddAdd,
                    `${spec.resource}:${spec.action} carries fileInput but is not an attachment/bdd upload`,
                ).toBe(true);
            }
        }
        // Inverse: every attachment add-to-* must be fileInput.
        for (const spec of ACTIONS) {
            if (spec.resource === 'attachment' && spec.action.startsWith('add-to-')) {
                expect(
                    spec.fileInput,
                    `${spec.resource}:${spec.action} is an attachment upload; must carry fileInput`,
                ).toBe(true);
            }
        }
        // Inverse: bdd:add must carry fileInput.
        for (const spec of ACTIONS) {
            if (spec.resource === 'bdd' && spec.action === 'add') {
                expect(spec.fileInput, 'bdd:add is a multipart upload; must carry fileInput').toBe(true);
            }
        }
    });

    it('every metadata entry has at least one path param documented (except list actions and payload-only writes)', () => {
        // Payload-only write actions: the TestRail endpoint takes no path or
        // query params and is fully driven by the request body (admin-level
        // POSTs that create instance-wide objects, e.g. `add_case_field`).
        // These intentionally have `pathParams: []`.
        // `project:add` joins the payload-only set: it creates an instance-wide
        // project (no parent ID exists in the URL because the project itself is
        // the top-level entity).
        const PAYLOAD_ONLY_WRITES = new Set<string>(['case-field:add', 'project:add']);
        // Flag-driven / zero-arg reads: the endpoint takes no path param.
        // `user:get-by-email` is driven by the shared `--email` flag (also
        // consumed by resolveAuth for the credential); `user:get-current`
        // returns the auth-identified user (no input needed beyond the
        // credential itself). Both intentionally declare `pathParams: []`
        // and reject extra positional args fail-fast in the handler.
        const FLAG_OR_ZERO_ARG_READS = new Set<string>(['user:get-by-email', 'user:get-current']);
        for (const spec of ACTIONS) {
            if (spec.action === 'list') continue;
            if (PAYLOAD_ONLY_WRITES.has(`${spec.resource}:${spec.action}`)) continue;
            if (FLAG_OR_ZERO_ARG_READS.has(`${spec.resource}:${spec.action}`)) continue;
            expect(
                spec.pathParams.length,
                `${spec.resource}:${spec.action} should declare path params`,
            ).toBeGreaterThan(0);
        }
    });

    it('getActionSpec finds a known entry', () => {
        const spec = getActionSpec('case', 'add');
        expect(spec).toBeDefined();
        expect(spec?.isWrite).toBe(true);
    });

    it('getActionSpec returns undefined for unknown entries', () => {
        expect(getActionSpec('webhook', 'list')).toBeUndefined();
        expect(getActionSpec('case', 'unknown-action')).toBeUndefined();
    });
});

// ── KNOWN_FLAGS inventory (CTF #10 drift guard) ──────────────────────────────
//
// parseArgs in src/cli/index.ts is invoked with strict:false (defensive
// future-Node tolerance). A post-parse loop rejects any flag not in
// KNOWN_FLAGS — without that gate, typos like `--dryrun` are silently
// accepted as free-form keys, executing what the user intended as a
// preview. The drift risk is that someone adds a flag to CLI_OPTIONS but
// forgets to keep KNOWN_FLAGS in sync (or vice-versa). Locking the
// invariant here ensures the gate keeps matching the parser declaration.

describe('KNOWN_FLAGS inventory', () => {
    it('contains every documented CLI flag (none missing, none extra)', () => {
        const expected = new Set([
            'base-url',
            'email',
            'api-key-stdin',
            'format',
            'quiet',
            'help',
            'version',
            'project-id',
            'suite-id',
            'run-id',
            'case-id',
            'limit',
            'offset',
            'status-id',
            'defects-filter',
            'data',
            'data-file',
            'dry-run',
            'global',
            'force',
            'print-path',
            'file',
            'filename',
            'out',
            'yes',
            'soft',
        ]);
        expect(KNOWN_FLAGS).toEqual(expected);
    });

    it('equals Object.keys(CLI_OPTIONS) — the parser declaration is the only source of truth', () => {
        expect(KNOWN_FLAGS).toEqual(new Set(Object.keys(CLI_OPTIONS)));
    });
});

// ── sanitizeForTerminal (CTF #16 + #18) ──────────────────────────────────────
//
// Strict denylist: strip all C0 (U+0000–U+001F), DEL (U+007F), and C1
// (U+0080–U+009F) bytes. Used at every stdout/stderr boundary that
// reflects untrusted strings (TestRail field values, server error text,
// user argv echoed in validation errors). Defends against ANSI/OSC
// injection — color codes, cursor moves, window-title spoofing, and
// (on some terminals) command-injection via OSC 7/9/iTerm2 escapes.

describe('sanitizeForTerminal', () => {
    it('strips ESC (0x1B), the most common ANSI introducer', () => {
        expect(sanitizeForTerminal('hello\x1b[31mRED\x1b[0m')).toBe('hello[31mRED[0m');
    });

    it('strips BEL (0x07), used to terminate OSC escapes', () => {
        expect(sanitizeForTerminal('safe\x07bell')).toBe('safebell');
    });

    it('strips CR, LF, TAB, and the rest of the C0 control band', () => {
        expect(sanitizeForTerminal('a\rb\nc\td')).toBe('abcd');
        expect(sanitizeForTerminal('\x00\x01\x02\x1f')).toBe('');
    });

    it('strips DEL (0x7F)', () => {
        expect(sanitizeForTerminal('before\x7Fafter')).toBe('beforeafter');
    });

    it('strips C1 controls (0x80-0x9F), including the 8-bit OSC introducer (0x9D)', () => {
        expect(sanitizeForTerminal('a\x80b\x9Dc\x9Fd')).toBe('abcd');
    });

    it('preserves printable ASCII, space, and Unicode', () => {
        expect(sanitizeForTerminal('Hello, world! 123 ()[]{}<>')).toBe('Hello, world! 123 ()[]{}<>');
        expect(sanitizeForTerminal('日本語 中文 한국어 العربية')).toBe('日本語 中文 한국어 العربية');
        expect(sanitizeForTerminal('emoji: 🔥💀✅')).toBe('emoji: 🔥💀✅');
    });

    it('defeats the OSC 0 window-title spoof (ESC ] 0 ; title BEL)', () => {
        const evil = '\x1b]0;Pwned!\x07legitimate text';
        expect(sanitizeForTerminal(evil)).toBe(']0;Pwned!legitimate text');
        // Critical: no surviving ESC, no surviving BEL.
        expect(sanitizeForTerminal(evil)).not.toContain('\x1b');
        expect(sanitizeForTerminal(evil)).not.toContain('\x07');
    });

    it('returns empty string for input that is entirely control chars', () => {
        expect(sanitizeForTerminal('\x1b\x07\r\n\t\x00')).toBe('');
    });
});

// ── readBoundedStdin (CTF #24) ───────────────────────────────────────────────
//
// Read fd 0 (or any fd) into a UTF-8 string with a hard byte cap. Replaces
// the unbounded `readFileSync(0, 'utf-8')` that OOM-kills the process when
// piped a multi-GB payload. Tested against a real fd backed by a tmpfile
// rather than mocked fs — covers the chunked-read loop end-to-end.

describe('readBoundedStdin', () => {
    let tmpDir: string;

    function withFd<T>(contents: Buffer | string, fn: (fd: number) => T): T {
        const path = join(tmpDir, 'stdin-fixture');
        writeFileSync(path, contents);
        const fd = openSync(path, 'r');
        try {
            return fn(fd);
        } finally {
            closeSync(fd);
        }
    }

    beforeAll(() => {
        tmpDir = mkdtempSync(join(tmpdir(), 'testrail-stdin-'));
    });

    afterAll(() => {
        rmSync(tmpDir, { recursive: true, force: true });
    });

    it('reads a small payload (well under the cap) in full', () => {
        const result = withFd('{"hello":"world"}', (fd) => readBoundedStdin(MAX_STDIN_BYTES, fd));
        expect(result).toBe('{"hello":"world"}');
    });

    it('reads a payload that spans multiple 64KiB chunks', () => {
        // 200 KiB — guarantees the chunked-read loop iterates more than once.
        const payload = 'A'.repeat(200 * 1024);
        const result = withFd(payload, (fd) => readBoundedStdin(MAX_STDIN_BYTES, fd));
        expect(result.length).toBe(200 * 1024);
        expect(result).toBe(payload);
    });

    it('rejects a payload that exceeds the cap', () => {
        const oversized = 'B'.repeat(MAX_STDIN_BYTES + 1);
        expect(() => withFd(oversized, (fd) => readBoundedStdin(MAX_STDIN_BYTES, fd))).toThrow(
            /Input exceeds maximum 1048576 bytes/,
        );
    });

    it('rejects on the first chunk that pushes total past the cap (no overflow buffering)', () => {
        // With a small synthetic cap and a payload that exceeds it by exactly
        // one byte, the throw must happen — we never see the bytes past the
        // cap returned as data.
        const cap = 1000;
        const payload = 'C'.repeat(cap + 50);
        expect(() => withFd(payload, (fd) => readBoundedStdin(cap, fd))).toThrow(/Input exceeds maximum 1000 bytes/);
    });

    it('returns empty string for an empty fd (EOF on first read)', () => {
        const result = withFd('', (fd) => readBoundedStdin(MAX_STDIN_BYTES, fd));
        expect(result).toBe('');
    });

    it('preserves UTF-8 multi-byte sequences across chunk boundaries', () => {
        // A payload long enough to span multiple chunks, containing
        // multi-byte UTF-8 sequences. Buffer.concat + toString('utf-8')
        // joins the byte chunks before decoding, so multi-byte chars
        // split across chunk boundaries decode correctly.
        const unit = '日本語🔥 ';
        const payload = unit.repeat(20000); // ~280 KiB
        const result = withFd(payload, (fd) => readBoundedStdin(MAX_STDIN_BYTES, fd));
        expect(result).toBe(payload);
    });
});
