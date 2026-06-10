/**
 * Unit tests for extracted CLI helpers (src/cli/{output,ids,auth,dispatch}.ts).
 *
 * These complement tests/cli.test.ts (which exercises the binary via subprocess)
 * by covering edge cases that are tedious to reach through the subprocess path:
 * symbol/function values in renderTable, parseId boundary conditions, and
 * resolveAuth precedence between flags and env.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    valueToString,
    renderTable,
    safeJsonStringify,
    renderYaml,
    renderCsv,
    createOutput,
} from '../src/cli/output.js';
import { parseId, optInt, parseEntryId, parseAttachmentId, IdParseError } from '../src/cli/ids.js';
import { resolveAuth, MISSING_AUTH_MESSAGE } from '../src/cli/auth.js';
import {
    dispatch,
    getRegisteredActions,
    checkDestructiveEnvGate,
    checkPathParamCount,
    DESTRUCTIVE_ENV_VAR,
    DESTRUCTIVE_ENV_ALLOW_VALUE,
} from '../src/cli/dispatch.js';
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

    // Regression: columns must be the UNION of keys across all rows, not just
    // row 0's keys. TestRail omits `.nullish()` fields when unset, so a list's
    // first row can legitimately lack a key that a later row carries (e.g. a
    // case with no `milestone_id` followed by one that has it). Deriving
    // columns from row 0 alone silently dropped that column and its data from
    // the table while JSON/CSV still showed it.
    it('includes a column present only in a later row (key union)', () => {
        const out = renderTable([
            { id: 1, name: 'case-a' },
            { id: 2, name: 'case-b', milestone_id: 99 },
        ]);
        expect(out).toContain('milestone_id');
        expect(out).toContain('99');
        // Row 0's omitted key renders as an empty cell, not a dropped column.
        const lines = out.split('\n');
        expect(lines).toHaveLength(4); // header + separator + 2 data rows
    });

    it('preserves first-seen column order across heterogeneous rows', () => {
        const out = renderTable([
            { id: 1, name: 'a' },
            { id: 2, name: 'b', extra: 'x' },
        ]);
        const header = out.split('\n')[0];
        // Row 0 keys keep their order; the later-only key is appended last.
        expect(header).toBe('id | name | extra');
    });

    it('unions keys even when the first row is the sparser one', () => {
        const out = renderTable([{ id: 1 }, { id: 2, name: 'b' }]);
        expect(out).toContain('id | name');
        expect(out).toContain('2  | b');
        const lines = out.split('\n');
        expect(lines).toHaveLength(4); // header + separator + 2 data rows
        // Row 0 lacks `name`: the column is kept, rendered as an empty cell —
        // not dropped (the bug) and not collapsed into a malformed shorter row.
        expect(lines[2]).toContain('1  | ');
        expect(lines[2]?.trimEnd()).toBe('1  |');
    });

    it('table and csv agree on the column set for heterogeneous rows', () => {
        const rows = [
            { id: 1, name: 'a' },
            { id: 2, name: 'b', milestone_id: 99 },
        ];
        const tableHeader = renderTable(rows).split('\n')[0] ?? '';
        const csvHeader = renderCsv(rows).split('\r\n')[0] ?? '';
        for (const key of ['id', 'name', 'milestone_id']) {
            expect(tableHeader).toContain(key);
            expect(csvHeader).toContain(key);
        }
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
        expect(parseEntryId('e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', 'entry_id')).toBe(
            'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56',
        );
    });

    it('trims surrounding whitespace before returning', () => {
        expect(parseEntryId('  e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56  ', 'entry_id')).toBe(
            'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56',
        );
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

    it('throws when raw is not a UUID (non-UUID string)', () => {
        expect(() => parseEntryId('not-a-uuid', 'entry_id')).toThrow(IdParseError);
        expect(() => parseEntryId('../../admin', 'entry_id')).toThrow(IdParseError);
        expect(() => parseEntryId('entry-guid-1', 'entry_id')).toThrow(IdParseError);
    });
});

describe('parseAttachmentId', () => {
    it('returns a number for a positive integer string', () => {
        expect(parseAttachmentId('42', 'attachment_id')).toBe(42);
        expect(parseAttachmentId('1', 'attachment_id')).toBe(1);
    });

    it('returns a string for a well-formed UUID (TestRail 7.1+)', () => {
        const uuid = '2ec27be4-812f-4806-9a5d-d39130d1691a';
        expect(parseAttachmentId(uuid, 'attachment_id')).toBe(uuid);
    });

    it('trims surrounding whitespace before matching the UUID', () => {
        const uuid = '2ec27be4-812f-4806-9a5d-d39130d1691a';
        expect(parseAttachmentId(`  ${uuid}  `, 'attachment_id')).toBe(uuid);
    });

    it('throws IdParseError for undefined input', () => {
        expect(() => parseAttachmentId(undefined, 'attachment_id')).toThrow(IdParseError);
    });

    it('throws for zero (not a positive integer)', () => {
        expect(() => parseAttachmentId('0', 'attachment_id')).toThrow(IdParseError);
    });

    it('throws for a negative integer string', () => {
        expect(() => parseAttachmentId('-1', 'attachment_id')).toThrow(IdParseError);
    });

    it('throws for an arbitrary non-UUID string (path-traversal guard)', () => {
        expect(() => parseAttachmentId('../../admin', 'attachment_id')).toThrow(IdParseError);
        expect(() => parseAttachmentId('not-a-uuid', 'attachment_id')).toThrow(IdParseError);
    });

    it('throws for a malformed UUID (wrong segment length)', () => {
        expect(() => parseAttachmentId('aaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'attachment_id')).toThrow(IdParseError);
    });

    it('includes the parameter name in the error', () => {
        expect(() => parseAttachmentId(undefined, 'attachment_id')).toThrow(/attachment_id/);
    });

    it('error message mentions both accepted forms', () => {
        expect(() => parseAttachmentId('bad', 'attachment_id')).toThrow(/positive integer or a UUID string/);
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

    it('returns undefined for values exceeding Number.MAX_SAFE_INTEGER (silent drop on unsafe-int)', () => {
        // 2^53 + 1 = 9007199254740993 — passes the regex but Number.isSafeInteger
        // returns false. Exercises the `Number.isSafeInteger(n) ? n : undefined`
        // false branch. Without this guard a smuggled bigger value would
        // silently round-trip with precision loss to the API.
        expect(optInt('9007199254740993')).toBeUndefined();
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

    /**
     * Regression: `RESOURCES` is a plain `Record<string, string[]>`, so an
     * unguarded `RESOURCES[resource]` lookup resolves Object.prototype keys
     * (`toString`, `__proto__`, `constructor`, `valueOf`, etc.) to inherited
     * methods — a function, not an array — which then crashed
     * `actions.includes(...)` with TypeError. The CLI fuzz suite uncovered
     * this; the fix is `Object.hasOwn(RESOURCES, resource)` before the index.
     * These tests pin the contract: every prototype key must surface as a
     * clean `Unknown resource` error, never a TypeError.
     */
    describe('prototype-key regression (own-property guard)', () => {
        const PROTOTYPE_KEYS = [
            'toString',
            '__proto__',
            'constructor',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'toLocaleString',
            '__defineGetter__',
            '__defineSetter__',
            '__lookupGetter__',
            '__lookupSetter__',
        ] as const;

        for (const protoKey of PROTOTYPE_KEYS) {
            it(`returns Unknown resource error for prototype key '${protoKey}' (no TypeError)`, () => {
                // Must not throw — pre-fix this crashed with
                // "TypeError: actions.includes is not a function".
                const result = dispatch(protoKey, 'any-action');
                expect(result.ok).toBe(false);
                if (!result.ok) {
                    expect(result.error).toContain(`Unknown resource '${protoKey}'`);
                }
            });
        }
    });
});

describe('checkDestructiveEnvGate', () => {
    /**
     * Unit tests for the dispatch-level env gate. The gate is the second
     * layer of defense-in-depth (the per-handler `--yes` check is the
     * first). These tests cover the truth table for
     * `(destructive?, dryRun, env value)` → `ok | error`.
     */
    const destructiveSpec = getActionSpec('run', 'delete');
    const nonDestructiveSpec = getActionSpec('project', 'get');
    const writeNonDestructiveSpec = getActionSpec('case', 'add');

    it('exposes the env var name as a constant', () => {
        expect(DESTRUCTIVE_ENV_VAR).toBe('TESTRAIL_ALLOW_DESTRUCTIVE');
    });

    it('exposes the strict allow value as a constant', () => {
        expect(DESTRUCTIVE_ENV_ALLOW_VALUE).toBe('1');
    });

    it('returns ok=true for non-destructive read action regardless of env', () => {
        expect(checkDestructiveEnvGate(nonDestructiveSpec, {}, false).ok).toBe(true);
        expect(checkDestructiveEnvGate(nonDestructiveSpec, {}, true).ok).toBe(true);
    });

    it('returns ok=true for non-destructive write action regardless of env', () => {
        expect(checkDestructiveEnvGate(writeNonDestructiveSpec, {}, false).ok).toBe(true);
    });

    it('returns ok=true for an undefined spec (defensive — caller already validated dispatch)', () => {
        expect(checkDestructiveEnvGate(undefined, {}, false).ok).toBe(true);
    });

    it('returns ok=false for destructive action without env var (env empty)', () => {
        const result = checkDestructiveEnvGate(destructiveSpec, {}, false);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('TESTRAIL_ALLOW_DESTRUCTIVE');
            expect(result.error).toContain("'run delete'");
            expect(result.error).toContain('--yes');
            expect(result.error).toContain('--dry-run');
        }
    });

    it('returns ok=true for destructive action with env=1 and not dry-run', () => {
        const result = checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: '1' }, false);
        expect(result.ok).toBe(true);
    });

    it('returns ok=true for destructive action with dry-run=true (env var bypassed)', () => {
        const result = checkDestructiveEnvGate(destructiveSpec, {}, true);
        expect(result.ok).toBe(true);
    });

    it('returns ok=true for destructive action with dry-run=true even when env value is wrong', () => {
        const result = checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: 'no' }, true);
        expect(result.ok).toBe(true);
    });

    it('rejects env value "true" (strict — only "1" is accepted)', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: 'true' }, false).ok).toBe(false);
    });

    it('rejects env value "yes"', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: 'yes' }, false).ok).toBe(false);
    });

    it('rejects env value "on"', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: 'on' }, false).ok).toBe(false);
    });

    it('rejects env value "0"', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: '0' }, false).ok).toBe(false);
    });

    it('rejects env value "" (empty string is not "1")', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: '' }, false).ok).toBe(false);
    });

    it('rejects env value "1 " (trailing whitespace; no implicit trim)', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: '1 ' }, false).ok).toBe(false);
    });

    it('rejects env value " 1" (leading whitespace; no implicit trim)', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: ' 1' }, false).ok).toBe(false);
    });

    it('rejects env value "11" (no prefix-match leakage)', () => {
        expect(checkDestructiveEnvGate(destructiveSpec, { TESTRAIL_ALLOW_DESTRUCTIVE: '11' }, false).ok).toBe(false);
    });

    it('fires the gate on EVERY destructive action in metadata', () => {
        // Crash-canary: if any new destructive action is added with
        // `destructive: true` but the gate is somehow not triggered (e.g.
        // a regression in `checkDestructiveEnvGate`), this catches it.
        const destructiveActions = ACTIONS.filter((a) => a.destructive === true);
        expect(destructiveActions.length).toBeGreaterThan(0);
        for (const spec of destructiveActions) {
            const result = checkDestructiveEnvGate(spec, {}, false);
            expect(result.ok, `${spec.resource}:${spec.action} should be gated by env var`).toBe(false);
        }
    });

    it('clears the gate on EVERY destructive action when env=1', () => {
        const destructiveActions = ACTIONS.filter((a) => a.destructive === true);
        for (const spec of destructiveActions) {
            const result = checkDestructiveEnvGate(spec, { TESTRAIL_ALLOW_DESTRUCTIVE: '1' }, false);
            expect(result.ok, `${spec.resource}:${spec.action} should clear gate with env=1`).toBe(true);
        }
    });

    it('clears the gate on EVERY destructive action when dry-run', () => {
        const destructiveActions = ACTIONS.filter((a) => a.destructive === true);
        for (const spec of destructiveActions) {
            const result = checkDestructiveEnvGate(spec, {}, true);
            expect(result.ok, `${spec.resource}:${spec.action} should clear gate with --dry-run`).toBe(true);
        }
    });

    it('never gates a non-destructive action (read or write)', () => {
        const nonDestructive = ACTIONS.filter((a) => a.destructive !== true);
        for (const spec of nonDestructive) {
            const result = checkDestructiveEnvGate(spec, {}, false);
            expect(result.ok, `${spec.resource}:${spec.action} should never be gated`).toBe(true);
        }
    });

    it('ignores unrelated env vars (e.g. only TESTRAIL_BASE_URL set)', () => {
        const result = checkDestructiveEnvGate(
            destructiveSpec,
            { TESTRAIL_BASE_URL: 'https://x', TESTRAIL_EMAIL: 'a@b' },
            false,
        );
        expect(result.ok).toBe(false);
    });
});

describe('checkPathParamCount', () => {
    /**
     * Unit tests for the dispatch-level path-param count validator.
     * Covers the full truth table of (spec, pathParams) → ok | error.
     */

    it('returns ok=true when spec is undefined (defensive no-op — caller handles unknown action)', () => {
        const result = checkPathParamCount(undefined, ['5', '99']);
        expect(result.ok).toBe(true);
    });

    it('returns ok=true when counts match — 0 params', () => {
        const spec = getActionSpec('project', 'list'); // 0 path params
        expect(spec?.pathParams.length).toBe(0);
        const result = checkPathParamCount(spec, []);
        expect(result.ok).toBe(true);
    });

    it('returns ok=true when counts match — 1 param', () => {
        const spec = getActionSpec('milestone', 'delete'); // 1 path param: milestone_id
        expect(spec?.pathParams.length).toBe(1);
        const result = checkPathParamCount(spec, ['5']);
        expect(result.ok).toBe(true);
    });

    it('returns ok=true when counts match — 2 params', () => {
        const spec = getActionSpec('result', 'list-for-case'); // 2 path params: run_id, case_id
        expect(spec?.pathParams.length).toBe(2);
        const result = checkPathParamCount(spec, ['10', '20']);
        expect(result.ok).toBe(true);
    });

    it('returns ok=false with "takes N" message when too many args supplied', () => {
        const spec = getActionSpec('milestone', 'delete'); // expects 1
        const result = checkPathParamCount(spec, ['5', '99']);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('takes 1 path parameter(s)');
            expect(result.error).toContain('got 2');
            expect(result.error).toContain('"99"');
        }
    });

    it('returns ok=false with "requires N" message when too few args supplied', () => {
        const spec = getActionSpec('milestone', 'delete'); // expects 1
        const result = checkPathParamCount(spec, []);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('requires 1 path parameter(s)');
            expect(result.error).toContain('got 0');
        }
    });

    it('error message includes usage hint with <param_name> placeholders', () => {
        const spec = getActionSpec('milestone', 'delete'); // pathParams: [{name:'milestone_id'}]
        const result = checkPathParamCount(spec, ['5', '99']);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('<milestone_id>');
            expect(result.error).toContain('testrail milestone delete <milestone_id>');
        }
    });

    it('usage hint has no param placeholders for 0-param actions', () => {
        const spec = getActionSpec('project', 'list');
        const result = checkPathParamCount(spec, ['extra']);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('takes 0 path parameter(s)');
            expect(result.error).toContain('testrail project list');
            expect(result.error).not.toContain('<');
        }
    });
});

describe('metadata vs dispatch consistency', () => {
    /**
     * The single source of truth for "what does this CLI support" used to be
     * split between two places: `HANDLERS` in dispatch.ts (runtime routing)
     * and `ACTIONS` in metadata.ts (documentation + skill-generator input).
     *
     * PR-C collapsed them: each `ActionSpec` now carries its own `handler`
     * reference, and `HANDLERS` is derived from `ACTIONS` via
     * `Object.fromEntries`. Drift in the bidirectional metadata↔dispatch
     * correspondence is now a TypeScript error (a missing `handler:` field
     * fails to compile), not a runtime drift caught by a test.
     *
     * The two former "every entry has a handler" / "every handler has an
     * entry" tests have therefore been removed — they assert what the type
     * system already guarantees. The remaining tests below pin invariants
     * (no-body writes, file-input vs body-schema exclusivity, destructive
     * set, path-param presence) that the type system does NOT catch.
     */
    it('dispatch returns ok=true for every registered ACTIONS entry (smoke test of the derivation)', () => {
        // Light end-to-end check that the `dispatch()` derivation runs
        // cleanly: an empty `ACTIONS` would still pass type-check, so this
        // proves the derivation produced a non-empty, fully-wired map.
        expect(ACTIONS.length).toBeGreaterThan(0);
        for (const spec of ACTIONS) {
            const result = dispatch(spec.resource, spec.action);
            expect(result.ok, `dispatch(${spec.resource}, ${spec.action}) returned !ok`).toBe(true);
        }
        // Inverse: `getRegisteredActions()` reads from the same derived map,
        // so its size MUST equal `ACTIONS.length`. A mismatch would mean two
        // ACTIONS entries collided on the same `resource:action` key —
        // structurally possible (two specs sharing keys) but not type-caught.
        expect(getRegisteredActions().length).toBe(ACTIONS.length);
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
            'group:delete',
            'dataset:delete',
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
    it('destructive action set includes attachment:delete, case:delete, case:delete-bulk, run:close, run:delete, suite:delete, section:delete, milestone:delete, project:delete, plan:close, plan:delete, plan:delete-entry, plan:delete-run-from-entry, variable:delete, group:delete, dataset:delete, shared-step:delete, configuration:delete, configuration-group:delete', () => {
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
            'group:delete',
            'dataset:delete',
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
        // the top-level entity). `group:add` (TestRail 7.5+) also creates an
        // instance-wide entity — user groups are global, not project-scoped.
        // `test:update-labels-bulk` (TestRail Labels API, 2025) joins the set:
        // `update_tests` takes no path param — the target tests are named in the
        // body via `test_ids` — so it intentionally declares `pathParams: []`.
        const PAYLOAD_ONLY_WRITES = new Set<string>([
            'case-field:add',
            'project:add',
            'group:add',
            'user:add',
            'test:update-labels-bulk',
        ]);
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
            'interval',
            'once',
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

// ── renderYaml (--format yaml) ───────────────────────────────────────────────
//
// Zero-dependency YAML 1.2 emitter for the CLI's `--format yaml` path. The
// emitter is intentionally strict about quoting: anything that could parse
// as something other than a plain string (numbers, booleans, null tokens,
// leading-indicator characters, embedded `:` or `#`, control chars,
// newlines) is forced into double-quoted form.

describe('renderYaml — primitives', () => {
    it('renders null as the YAML null literal', () => {
        expect(renderYaml(null)).toBe('null');
    });

    it('renders undefined as the YAML null literal', () => {
        expect(renderYaml(undefined)).toBe('null');
    });

    it('renders booleans as true / false', () => {
        expect(renderYaml(true)).toBe('true');
        expect(renderYaml(false)).toBe('false');
    });

    it('renders integers and floats unquoted', () => {
        expect(renderYaml(42)).toBe('42');
        expect(renderYaml(-0.5)).toBe('-0.5');
        expect(renderYaml(0)).toBe('0');
    });

    it('renders NaN / Infinity as YAML 1.2 sentinels', () => {
        expect(renderYaml(Number.NaN)).toBe('.nan');
        expect(renderYaml(Number.POSITIVE_INFINITY)).toBe('.inf');
        expect(renderYaml(Number.NEGATIVE_INFINITY)).toBe('-.inf');
    });

    it('renders bigint as the integer literal', () => {
        expect(renderYaml(10n)).toBe('10');
    });

    it('renders an unambiguous string without quotes', () => {
        expect(renderYaml('hello')).toBe('hello');
        expect(renderYaml('hello-world')).toBe('hello-world');
        expect(renderYaml('alpha_BETA-1')).toBe('alpha_BETA-1');
    });

    it('quotes empty strings', () => {
        expect(renderYaml('')).toBe('""');
    });

    it('quotes special reserved YAML tokens (null/true/false/yes/no/on/off, all cases)', () => {
        for (const token of ['null', 'Null', 'NULL', 'true', 'True', 'TRUE', 'yes', 'No', 'on', 'OFF']) {
            expect(renderYaml(token)).toBe(`"${token}"`);
        }
    });

    it('quotes strings that look like numbers (preserves string semantics)', () => {
        expect(renderYaml('42')).toBe('"42"');
        expect(renderYaml('-3.14')).toBe('"-3.14"');
        expect(renderYaml('1e10')).toBe('"1e10"');
        expect(renderYaml('0x1A')).toBe('"0x1A"');
    });

    it('quotes every signed infinity string form so it round-trips as a string (#238)', () => {
        // The YAML 1.2 Core Schema float tag is `[-+]?(\.inf|\.Inf|\.INF)` — the sign
        // is optional — so a bare `+.inf` resolves to the float +Infinity. The
        // positive-sign forms were missing from the quoting guard while the sign-less
        // and negative forms were already covered; assert all nine quote.
        for (const token of [
            '.inf', '.Inf', '.INF',
            '-.inf', '-.Inf', '-.INF',
            '+.inf', '+.Inf', '+.INF',
        ]) {
            expect(renderYaml(token)).toBe(`"${token}"`);
        }
    });

    it('quotes a +.inf mapping key and value so both round-trip as strings (#238)', () => {
        // Keys route through the same needsQuoting() guard as scalar values, so the
        // positive-sign fix must hold for an object key too — otherwise a bare
        // `+.inf:` key would resolve to the float +Infinity on re-parse.
        expect(renderYaml({ '+.inf': 'value' })).toBe('"+.inf": value');
        expect(renderYaml({ key: '+.inf' })).toBe('key: "+.inf"');
    });

    it('quotes strings with a leading reserved indicator', () => {
        expect(renderYaml('- leading dash')).toBe('"- leading dash"');
        expect(renderYaml('? leading question')).toBe('"? leading question"');
        expect(renderYaml('# leading hash')).toBe('"# leading hash"');
        expect(renderYaml('| leading pipe')).toBe('"| leading pipe"');
        expect(renderYaml('@ leading at')).toBe('"@ leading at"');
        expect(renderYaml(': leading colon')).toBe('": leading colon"');
    });

    it('quotes strings with a leading quote (single or double opens a quoted scalar)', () => {
        // Regression: a leading `'` was emitted bare, which opens a
        // single-quoted scalar in YAML 1.2 §7.3 — the document then fails to
        // parse (unterminated scalar) or silently drops the surrounding
        // quotes. The double-quoted form round-trips as a literal string.
        expect(renderYaml("'")).toBe('"\'"');
        expect(renderYaml("'hello")).toBe('"\'hello"');
        expect(renderYaml("'quoted'")).toBe('"\'quoted\'"');
        // A leading `"` likewise opens a double-quoted scalar; the embedded-`"`
        // escape produces a correctly quoted, round-trippable form.
        expect(renderYaml('"leading dquote')).toBe('"\\"leading dquote"');
        // A non-leading single quote stays in plain (bare) form — only the
        // leading position is structurally significant.
        expect(renderYaml("O'Brien")).toBe("O'Brien");
        // End-to-end: an object value beginning with `'` must be quoted so the
        // emitted mapping line parses (a TestRail case title like
        // `'Login' button …` is a realistic trigger).
        expect(renderYaml({ title: "'Login' button is disabled" })).toBe('title: "\'Login\' button is disabled"');
    });

    it('quotes strings with embedded ": " (mapping ambiguity)', () => {
        expect(renderYaml('foo: bar')).toBe('"foo: bar"');
    });

    it('quotes strings with trailing colon', () => {
        expect(renderYaml('trailing:')).toBe('"trailing:"');
    });

    it('quotes strings with " #" (inline-comment ambiguity)', () => {
        expect(renderYaml('inline #comment')).toBe('"inline #comment"');
    });

    it('quotes strings with surrounding whitespace', () => {
        expect(renderYaml('  padded  ')).toBe('"  padded  "');
    });

    it('quotes and escapes control chars and newlines', () => {
        expect(renderYaml('line1\nline2')).toBe('"line1\\nline2"');
        expect(renderYaml('tab\there')).toBe('"tab\\there"');
        expect(renderYaml('\x07bell')).toBe('"\\x07bell"');
        expect(renderYaml('\x00\x1f')).toBe('"\\0\\x1f"');
        expect(renderYaml('\x7f\x85\x9f')).toBe('"\\x7f\\x85\\x9f"');
    });

    it('detects a control char that follows a non-control char (needsQuoting scan continues)', () => {
        // The control-char scan in needsQuoting iterates code points: the
        // leading 'a' is NOT a control char (the scan continues past it) and
        // the trailing BEL IS, so the value must be quoted+escaped. Exercises
        // both arms of the per-character control-char check.
        expect(renderYaml('a\x07')).toBe('"a\\x07"');
    });

    it('escapes CR, backspace, and form-feed via their named escapes', () => {
        // The double-quoted form supports all standard C-style escapes;
        // these are uncommon in TestRail data but the emitter must handle
        // them for fidelity with arbitrary JSON-shaped payloads.
        expect(renderYaml('a\rb')).toBe('"a\\rb"');
        expect(renderYaml('a\bb')).toBe('"a\\bb"');
        expect(renderYaml('a\fb')).toBe('"a\\fb"');
    });

    it('escapes embedded double-quotes and backslashes', () => {
        expect(renderYaml('say "hi"')).toBe('"say \\"hi\\""');
        expect(renderYaml('back\\slash')).toBe('"back\\\\slash"');
    });

    it('preserves printable Unicode without escaping', () => {
        expect(renderYaml('日本語')).toBe('日本語');
        expect(renderYaml('emoji 🔥')).toBe('emoji 🔥');
    });

    it('renders symbol / function values as null (no JSON-incompatible scalars)', () => {
        expect(renderYaml(Symbol('s'))).toBe('null');
        expect(renderYaml(() => 1)).toBe('null');
    });
});

describe('renderYaml — collections', () => {
    it('renders an empty object as the inline {} flow form', () => {
        expect(renderYaml({})).toBe('{}');
    });

    it('renders an empty array as the inline [] flow form', () => {
        expect(renderYaml([])).toBe('[]');
    });

    it('renders a flat object as block mapping with 2-space indent', () => {
        expect(renderYaml({ id: 1, name: 'Demo' })).toBe('id: 1\nname: Demo');
    });

    it('renders a flat array of primitives as block sequence', () => {
        expect(renderYaml([1, 2, 3])).toBe('- 1\n- 2\n- 3');
    });

    it('renders nested objects with deeper indent (2 spaces per level)', () => {
        const out = renderYaml({ outer: { inner: { leaf: 'v' } } });
        expect(out).toBe('outer:\n  inner:\n    leaf: v');
    });

    it('renders nested arrays inside objects', () => {
        const out = renderYaml({ tags: ['a', 'b'] });
        expect(out).toBe('tags:\n  - a\n  - b');
    });

    it('renders objects nested in array items with inline first key', () => {
        const out = renderYaml([
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
        ]);
        expect(out).toBe('- id: 1\n  name: a\n- id: 2\n  name: b');
    });

    it('renders deeply nested arrays inside arrays', () => {
        const out = renderYaml([
            [1, 2],
            [3, 4],
        ]);
        // Outer `- ` marker absorbs the first inner element; the rest indent
        // one level deeper from the marker.
        expect(out).toContain('- - 1');
        expect(out).toContain('- 3');
        expect(out).toContain('- 4');
    });

    it('renders a key with empty-array value inline', () => {
        expect(renderYaml({ tags: [] })).toBe('tags: []');
    });

    it('renders a key with empty-object value inline', () => {
        expect(renderYaml({ meta: {} })).toBe('meta: {}');
    });

    it('renders an empty-object element inside a sequence', () => {
        expect(renderYaml([{}, { a: 1 }])).toBe('- {}\n- a: 1');
    });

    it('renders an empty-array element inside a sequence', () => {
        expect(renderYaml([[], [1]])).toBe('- []\n- - 1');
    });

    it('quotes mapping keys that look like numbers or reserved tokens', () => {
        // A bare `42:` would parse as the integer key 42 — quote to preserve
        // string semantics on round-trip.
        const out = renderYaml({ '42': 'numeric-key', true: 'reserved-key' });
        expect(out).toContain('"42": numeric-key');
        expect(out).toContain('"true": reserved-key');
    });

    it('quotes mapping keys with embedded colon-space', () => {
        const out = renderYaml({ 'a: b': 1 });
        expect(out).toContain('"a: b": 1');
    });

    it('handles a TestRail-shaped project object', () => {
        const project = {
            id: 1,
            name: 'Demo',
            suite_mode: 1,
            url: 'https://example.testrail.io/projects/view/1',
        };
        const out = renderYaml(project);
        expect(out).toContain('id: 1');
        expect(out).toContain('name: Demo');
        expect(out).toContain('suite_mode: 1');
        expect(out).toContain('url: https://example.testrail.io/projects/view/1');
        // No leading/trailing newline (caller adds the trailing one).
        expect(out.startsWith('\n')).toBe(false);
        expect(out.endsWith('\n')).toBe(false);
    });

    it('handles a TestRail-shaped list response (array of objects)', () => {
        const list = [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
        ];
        const out = renderYaml(list);
        expect(out).toBe('- id: 1\n  name: A\n- id: 2\n  name: B');
    });

    it('returns a structured YAML error document on a circular reference', () => {
        const circular: Record<string, unknown> = {};
        circular['self'] = circular;
        const out = renderYaml(circular);
        // The recursive emitter throws RangeError on circular refs; the
        // outer try/catch must surface a parseable YAML doc.
        expect(out).toContain('error: unserializable');
        expect(out).toContain('message:');
    });
});

// ── renderCsv (--format csv) ─────────────────────────────────────────────────
//
// RFC 4180-compliant CSV. Top-level keys are columns; nested values are
// JSON-stringified into a single cell (no dot-path flattening). CRLF line
// terminators per §2.1. Header row = sorted union of top-level keys across
// all rows so the output is deterministic.

describe('renderCsv — empty / edge cases', () => {
    it('returns empty string for an empty array', () => {
        expect(renderCsv([])).toBe('');
    });

    it('returns empty string for an empty object (no keys)', () => {
        expect(renderCsv({})).toBe('');
    });

    it('renders a top-level scalar as a 1-column, 1-row CSV under "value"', () => {
        expect(renderCsv('hello')).toBe('value\r\nhello');
        expect(renderCsv(42)).toBe('value\r\n42');
        expect(renderCsv(null)).toBe('value\r\n');
    });
});

describe('renderCsv — single object', () => {
    it('renders a single object as a 1-row CSV preserving insertion order', () => {
        const out = renderCsv({ id: 1, name: 'Demo', suite_mode: 1 });
        expect(out).toBe('id,name,suite_mode\r\n1,Demo,1');
    });

    it('renders null and undefined cells as empty strings', () => {
        const out = renderCsv({ a: 1, b: null, c: undefined });
        expect(out).toBe('a,b,c\r\n1,,');
    });

    it('renders boolean and bigint cells as their string form', () => {
        const out = renderCsv({ a: true, b: false, c: 10n });
        expect(out).toBe('a,b,c\r\ntrue,false,10');
    });
});

describe('renderCsv — array of objects', () => {
    it('renders an array of objects with the union of keys, sorted', () => {
        const out = renderCsv([
            { id: 1, name: 'A' },
            { id: 2, name: 'B', extra: 'x' },
        ]);
        // Headers sorted: extra, id, name
        expect(out).toBe('extra,id,name\r\n,1,A\r\nx,2,B');
    });

    it('header order is deterministic regardless of input row order', () => {
        const a = renderCsv([
            { id: 1, name: 'A' },
            { id: 2, status: 'ok' },
        ]);
        const b = renderCsv([
            { id: 2, status: 'ok' },
            { id: 1, name: 'A' },
        ]);
        // Header lines must match (rows reorder, but keys are sorted).
        const aHeader = a.split('\r\n')[0];
        const bHeader = b.split('\r\n')[0];
        expect(aHeader).toBe(bHeader);
        expect(aHeader).toBe('id,name,status');
    });

    it('renders rows separated by CRLF (RFC 4180 §2.1)', () => {
        const out = renderCsv([{ id: 1 }, { id: 2 }]);
        expect(out.split('\r\n')).toHaveLength(3); // header + 2 rows
    });

    it('renders a primitive-only array under a single "value" column', () => {
        expect(renderCsv([1, 2, 3])).toBe('value\r\n1\r\n2\r\n3');
    });

    it('renders a mixed object / primitive array with the primitive in column[0] and others empty', () => {
        // Documented behavior: shape-mixing produces best-effort CSV.
        const out = renderCsv([{ id: 1, name: 'A' }, 42]);
        const lines = out.split('\r\n');
        expect(lines[0]).toBe('id,name');
        expect(lines[1]).toBe('1,A');
        expect(lines[2]).toBe('42,');
    });
});

describe('renderCsv — quoting and escaping', () => {
    it('wraps cells containing a comma in double quotes', () => {
        const out = renderCsv({ name: 'Smith, John' });
        expect(out).toBe('name\r\n"Smith, John"');
    });

    it('wraps cells containing double-quotes and escapes them by doubling', () => {
        const out = renderCsv({ q: 'say "hi"' });
        expect(out).toBe('q\r\n"say ""hi"""');
    });

    it('wraps cells containing newlines (LF) in double quotes (raw newlines preserved)', () => {
        const out = renderCsv({ msg: 'line1\nline2' });
        expect(out).toBe('msg\r\n"line1\nline2"');
    });

    it('wraps cells containing CR in double quotes', () => {
        const out = renderCsv({ msg: 'a\rb' });
        expect(out).toBe('msg\r\n"a\rb"');
    });

    it('does NOT quote cells without special chars (round-trip parsers will see bare values)', () => {
        const out = renderCsv({ id: 1, name: 'plain' });
        expect(out).toBe('id,name\r\n1,plain');
    });

    it('quotes header cells when the key contains special chars', () => {
        const out = renderCsv({ 'with,comma': 1 });
        expect(out).toBe('"with,comma"\r\n1');
    });
});

describe('renderCsv — nested objects / arrays', () => {
    it('JSON-stringifies a nested object into a single cell (no dot-path flattening)', () => {
        const out = renderCsv({ id: 1, meta: { a: 1, b: 2 } });
        // The cell contains commas + double-quotes → must be CSV-quoted with
        // internal quotes doubled.
        expect(out).toBe('id,meta\r\n1,"{""a"":1,""b"":2}"');
    });

    it('JSON-stringifies a nested array into a single cell', () => {
        const out = renderCsv({ id: 1, tags: ['a', 'b'] });
        expect(out).toBe('id,tags\r\n1,"[""a"",""b""]"');
    });

    it('handles an empty nested array as "[]" in the cell', () => {
        const out = renderCsv({ id: 1, tags: [] });
        expect(out).toBe('id,tags\r\n1,[]');
    });

    it('handles an empty nested object as "{}" in the cell', () => {
        const out = renderCsv({ id: 1, meta: {} });
        expect(out).toBe('id,meta\r\n1,{}');
    });

    it('JSON-stringifies an unserializable nested object to an empty cell', () => {
        const circular: Record<string, unknown> = {};
        circular['self'] = circular;
        const out = renderCsv({ id: 1, ref: circular });
        // Circular ref → JSON.stringify throws → cell becomes ''.
        expect(out).toBe('id,ref\r\n1,');
    });
});

describe('renderCsv — Unicode and special chars', () => {
    it('preserves multi-byte UTF-8 (日本語, emoji)', () => {
        const out = renderCsv({ label: '日本語 🔥' });
        expect(out).toBe('label\r\n日本語 🔥');
    });

    it('drops symbol and function cells to empty (no CSV-safe representation)', () => {
        // CSV has no meaningful representation for symbols or functions;
        // emit an empty cell so the column stays aligned.
        const out = renderCsv({ id: 1, sym: Symbol('s'), fn: (): number => 1 });
        expect(out).toBe('id,sym,fn\r\n1,,');
    });

    it('strips terminal-control bytes from CSV cells while preserving CSV-safe content', () => {
        const out = renderCsv({ id: 1, title: '\x1b[31mRED\x1b[0m' });
        expect(out).toBe('id,title\r\n1,[31mRED[0m');
        expect(out).not.toContain('\x1b');
    });

    it('strips terminal-control bytes from CSV headers', () => {
        const out = renderCsv({ 'safe\x9dheader': 'ok' });
        expect(out).toBe('safeheader\r\nok');
    });

    it('preserves TAB inside a CSV cell while still stripping other control bytes', () => {
        // CSV's structural whitespace (TAB/LF/CR) must survive sanitization;
        // other control bytes are stripped. Exercises the `code !== TAB`
        // short-circuit in sanitizeForCsv (a control char that is preserved).
        const out = renderCsv({ id: 1, title: 'a\tb\x01c' });
        // The cell contains a TAB (no comma/quote/newline) so it is NOT quoted;
        // the \x01 is stripped, the \t survives.
        expect(out).toBe('id,title\r\n1,a\tbc');
    });
});

// ── renderCsv — SEC #35 formula injection neutralization (CWE-1236) ──────────
//
// Cells whose first character is = + - @ or a leading TAB/CR are prefixed
// with a single quote so spreadsheet apps (Excel/Sheets/LibreOffice) do not
// evaluate them as formulas. Neutralization happens before RFC-quoting so
// the order is always: neutralize → quote. Applied at csvEscapeCell so
// headers are guarded too.

describe('renderCsv — SEC #35 formula-injection neutralization', () => {
    it('prefixes = formula trigger with a single quote', () => {
        const out = renderCsv({ formula: '=1+1' });
        expect(out).toBe("formula\r\n'=1+1");
    });

    it('prefixes + formula trigger with a single quote', () => {
        const out = renderCsv({ formula: '+1' });
        expect(out).toBe("formula\r\n'+1");
    });

    it('prefixes - formula trigger with a single quote', () => {
        const out = renderCsv({ formula: '-1' });
        expect(out).toBe("formula\r\n'-1");
    });

    it('prefixes @ formula trigger with a single quote', () => {
        const out = renderCsv({ formula: '@SUM(1)' });
        expect(out).toBe("formula\r\n'@SUM(1)");
    });

    it('prefixes a leading-TAB value with a single quote', () => {
        // TAB (0x09) at position 0 is a formula trigger. After neutralization
        // the cell is `'\tfoo`. TAB alone does not trigger RFC quoting (only
        // comma/double-quote/LF/CR do), so the cell is emitted bare.
        const out = renderCsv({ formula: '\tfoo' });
        // neutralized: `'\tfoo`; NOT RFC-quoted (no comma/quote/LF/CR)
        expect(out).toBe("formula\r\n'\tfoo");
    });

    it('does NOT prefix a non-leading = (benign cell)', () => {
        const out = renderCsv({ expr: 'a=b' });
        expect(out).toBe('expr\r\na=b');
    });

    it('does NOT prefix a plain benign value', () => {
        const out = renderCsv({ name: 'foo' });
        expect(out).toBe('name\r\nfoo');
    });

    it('does NOT prefix a numeric cell (starts with a digit)', () => {
        const out = renderCsv({ n: '1.5' });
        expect(out).toBe('n\r\n1.5');
    });

    it('does NOT prefix a typed negative number (trusted value, not a formula vector)', () => {
        // A JS `number` stringifies to a numeric literal that no spreadsheet
        // evaluates as a formula; neutralizing it would corrupt the value
        // (e.g. break `float(row['elapsed'])` downstream). Only untrusted
        // *strings* need OWASP neutralization.
        expect(renderCsv({ elapsed: -1 })).toBe('elapsed\r\n-1');
        expect(renderCsv({ delta: -1.5 })).toBe('delta\r\n-1.5');
    });

    it('does NOT prefix a typed negative bigint', () => {
        expect(renderCsv({ big: -5n })).toBe('big\r\n-5');
    });

    it('does NOT prefix a typed negative number inside an array row', () => {
        expect(renderCsv([{ custom_score: -42 }])).toBe('custom_score\r\n-42');
    });

    it('does NOT prefix typed negative numbers in a primitive-only array', () => {
        expect(renderCsv([-1, -2])).toBe('value\r\n-1\r\n-2');
    });

    it('does NOT prefix a typed negative number rendered as a top-level scalar', () => {
        expect(renderCsv(-42)).toBe('value\r\n-42');
    });

    it('still neutralizes a negative-number STRING (untrusted; OWASP-conservative)', () => {
        // Regression guard: the type-aware fix must NOT weaken string
        // neutralization — a string starting with '-' is still neutralized.
        expect(renderCsv({ s: '-1' })).toBe("s\r\n'-1");
    });

    it('does NOT modify an empty cell', () => {
        const out = renderCsv({ x: '' });
        expect(out).toBe('x\r\n');
    });

    it('neutralizes AND RFC-quotes when the formula cell also contains a comma', () => {
        // =1+1,2 → neutralized to '=1+1,2 → quoted because of the comma
        // → result cell: "'=1+1,2" (RFC-quoted)
        const out = renderCsv({ formula: '=1+1,2' });
        expect(out).toBe('formula\r\n"\'=1+1,2"');
    });

    it('neutralizes a header key starting with = (formula injection via key name)', () => {
        // csvEscapeCell is called for header names too; ensure the header
        // cell is also neutralized.
        const out = renderCsv([{ '=evil': 'x' }]);
        const lines = out.split('\r\n');
        // Header cell must be neutralized: '=evil
        expect(lines[0]).toBe("'=evil");
        // Data cell is benign.
        expect(lines[1]).toBe('x');
    });

    // ── sibling-renderer regression ──────────────────────────────────────────
    // Verify that renderTable and renderYaml are NOT altered by the CSV fix.

    it('renderTable does NOT add a leading quote to a formula cell (unaffected)', () => {
        const out = renderTable([{ a: '=1+1' }]);
        expect(out).toContain('=1+1');
        expect(out).not.toContain("'=1+1");
    });

    it('renderYaml does NOT add a leading quote to a formula cell (unaffected)', () => {
        const out = renderYaml({ a: '=1+1' });
        // YAML emits =1+1 bare (not a reserved token, no quoting needed).
        expect(out).toContain('=1+1');
        expect(out).not.toContain("'=1+1");
    });
});

describe('renderYaml — additional edge cases for branch coverage', () => {
    it('quotes octal-looking strings (e.g. "0o755") so they round-trip as strings', () => {
        // Exercises the `/^0o[0-7]+$/` needsQuoting branch — without quoting,
        // YAML 1.2 parsers may coerce 0o755 to an integer.
        expect(renderYaml('0o755')).toBe('"0o755"');
        expect(renderYaml('0o17')).toBe('"0o17"');
    });

    it('renders a stand-alone YAML carriage-return string with the \\r escape', () => {
        // Hits the `s.includes('\r')` branch in needsQuoting.
        expect(renderYaml('\r')).toBe('"\\r"');
    });

    it('handles a non-Error throw inside renderYamlNode by emitting a structured error doc', () => {
        // The recursive emitter could fail on hostile getters; force a
        // thrown non-Error to hit the `e instanceof Error ? ... : String(e)`
        // false branch in the catch.
        const hostile = {
            get bad() {
                // Typed `unknown` so this is an intentional non-Error throw.
                const nonError: unknown = 'plain string failure';
                throw nonError;
            },
        };
        const out = renderYaml(hostile);
        expect(out).toContain('error: unserializable');
        expect(out).toContain('plain string failure');
    });
});

describe('safeJsonStringify — additional edge cases for branch coverage', () => {
    it('handles a non-Error throw inside JSON.stringify (toJSON returns a hostile getter)', () => {
        // Exercises the `e instanceof Error ? e.message : String(e)` false
        // branch of safeJsonStringify's catch. We construct an object whose
        // toJSON method throws a plain string.
        const hostile = {
            toJSON(): never {
                // Typed `unknown` so this is an intentional non-Error throw.
                const nonError: unknown = 'plain string failure';
                throw nonError;
            },
        };
        const out = safeJsonStringify(hostile);
        const parsed = JSON.parse(out) as Record<string, unknown>;
        expect(parsed['error']).toBe('unserializable');
        expect(parsed['message']).toBe('plain string failure');
    });
});

describe('createOutput — opts.quiet routing', () => {
    function captureStdout(fn: () => void): string {
        const original = process.stdout.write.bind(process.stdout);
        const chunks: string[] = [];
        process.stdout.write = (c: unknown): boolean => {
            chunks.push(typeof c === 'string' ? c : String(c));
            return true;
        };
        try {
            fn();
        } finally {
            process.stdout.write = original;
        }
        return chunks.join('');
    }
    function captureStderr(fn: () => void): string {
        const original = process.stderr.write.bind(process.stderr);
        const chunks: string[] = [];
        process.stderr.write = (c: unknown): boolean => {
            chunks.push(typeof c === 'string' ? c : String(c));
            return true;
        };
        try {
            fn();
        } finally {
            process.stderr.write = original;
        }
        return chunks.join('');
    }

    it('quiet=true suppresses out()', () => {
        const o = createOutput({ format: 'json', quiet: true });
        const written = captureStdout(() => o.out({ id: 1 }));
        expect(written).toBe('');
    });

    it('quiet=true suppresses err()', () => {
        const o = createOutput({ format: 'json', quiet: true });
        const written = captureStderr(() => o.err('boom'));
        expect(written).toBe('');
    });

    it('quiet=true suppresses errRaw() — covers the `!opts.quiet` false branch', () => {
        // Hits the `if (!opts.quiet) process.stderr.write(chunk)` false
        // branch inside errRaw. Quiet must keep JSON acks off stderr too.
        const o = createOutput({ format: 'json', quiet: true });
        const written = captureStderr(() => o.errRaw('{"ack":true}\n'));
        expect(written).toBe('');
    });

    it('quiet=false routes out() to stdout, err() prefixes "Error: ", errRaw() writes verbatim', () => {
        const o = createOutput({ format: 'json', quiet: false });
        expect(captureStdout(() => o.out({ id: 1 }))).toContain('"id": 1');
        expect(captureStderr(() => o.err('boom'))).toMatch(/^Error: boom\n$/);
        expect(captureStderr(() => o.errRaw('verbatim\n'))).toBe('verbatim\n');
    });

    it('table format dispatches through renderTable', () => {
        const o = createOutput({ format: 'table', quiet: false });
        const written = captureStdout(() => o.out([{ id: 1, name: 'a' }]));
        expect(written).toContain('id');
        expect(written).toContain('name');
        expect(written).toContain('a');
    });

    it('yaml format dispatches through renderYaml', () => {
        const o = createOutput({ format: 'yaml', quiet: false });
        const written = captureStdout(() => o.out({ id: 1, name: 'a' }));
        expect(written).toContain('id: 1');
        expect(written).toContain('name: a');
    });

    it('csv format suppresses output entirely when renderCsv returns empty (empty array path)', () => {
        // Exercises the `csvOutput === '' ? '' : ...` true branch.
        const o = createOutput({ format: 'csv', quiet: false });
        const written = captureStdout(() => o.out([]));
        expect(written).toBe('');
    });

    it('csv format emits a final CRLF terminator when output is non-empty', () => {
        // Exercises the false branch of the same conditional.
        const o = createOutput({ format: 'csv', quiet: false });
        const written = captureStdout(() => o.out({ id: 1 }));
        expect(written.endsWith('\r\n')).toBe(true);
    });
});

describe('renderTable — defensive key-lookup branches', () => {
    it('handles objects whose Object.keys() yields an empty list (no rows)', () => {
        // Exercises the `rawKeys[i] ?? k` / `widths[i] ?? 0` fallback paths
        // in the table renderer. An empty-keyed object has no columns; the
        // helper must still emit the header/line scaffolding without
        // crashing on missing index lookups.
        const out = renderTable({});
        // No keys → header line is empty, separator line is empty. The body
        // row is empty too — total: 3 empty lines joined with '\n'.
        expect(out).toBe('\n\n');
    });
});
