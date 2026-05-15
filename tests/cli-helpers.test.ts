/**
 * Unit tests for extracted CLI helpers (src/cli/{output,ids,auth,dispatch}.ts).
 *
 * These complement tests/cli.test.ts (which exercises the binary via subprocess)
 * by covering edge cases that are tedious to reach through the subprocess path:
 * symbol/function values in renderTable, parseId boundary conditions, and
 * resolveAuth precedence between flags and env.
 */
import { describe, it, expect } from 'vitest';
import { valueToString, renderTable, safeJsonStringify } from '../src/cli/output.js';
import { parseId, optInt, IdParseError } from '../src/cli/ids.js';
import { resolveAuth, MISSING_AUTH_MESSAGE } from '../src/cli/auth.js';
import { dispatch, getRegisteredActions } from '../src/cli/dispatch.js';
import { ACTIONS, getActionSpec } from '../src/cli/metadata.js';

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

    it('includes the parameter name in the error', () => {
        expect(() => parseId(undefined, '--run-id')).toThrow(/--run-id/);
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
            expect(result.error).toContain('project, suite, case, run, result, milestone, user');
        }
    });

    it('returns Unknown action error for valid resource but invalid action', () => {
        const result = dispatch('project', 'delete');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe("Unknown action 'delete' for project. Use: get, list");
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
        for (const spec of ACTIONS) {
            if (!spec.isWrite) continue;
            // No-body POSTs: `run close`, `attachment delete`.
            if (spec.resource === 'run' && spec.action === 'close') {
                expect(spec.bodySchema, 'run close should have no body schema').toBeUndefined();
                continue;
            }
            if (spec.resource === 'attachment' && spec.action === 'delete') {
                expect(spec.bodySchema, 'attachment delete should have no body schema').toBeUndefined();
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
     * The CLI in src/cli/index.ts gates stdin suppression on
     * `ActionSpec.fileInput === true` (PR #59 review feedback): suppressing
     * stdin purely on `--file` presence would also kill piped JSON bodies
     * for unrelated write actions that happened to have `--file` typo'd in.
     * Lock the discriminator's expected shape so the gate stays correct:
     * only attachment uploads carry `fileInput: true`; nothing else.
     */
    it('only attachment add-to-* actions are flagged as fileInput', () => {
        for (const spec of ACTIONS) {
            if (spec.fileInput === true) {
                expect(
                    spec.resource === 'attachment' && spec.action.startsWith('add-to-'),
                    `${spec.resource}:${spec.action} carries fileInput but is not an attachment upload`,
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
    });

    it('every metadata entry has at least one path param documented (except list actions and payload-only writes)', () => {
        // Payload-only write actions: the TestRail endpoint takes no path or
        // query params and is fully driven by the request body (admin-level
        // POSTs that create instance-wide objects, e.g. `add_case_field`).
        // These intentionally have `pathParams: []`.
        const PAYLOAD_ONLY_WRITES = new Set<string>(['case-field:add']);
        for (const spec of ACTIONS) {
            if (spec.action === 'list') continue;
            if (PAYLOAD_ONLY_WRITES.has(`${spec.resource}:${spec.action}`)) continue;
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
        expect(getActionSpec('case', 'delete')).toBeUndefined();
    });
});
