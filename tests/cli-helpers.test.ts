/**
 * Unit tests for extracted CLI helpers (src/cli/{output,ids,auth,dispatch}.ts).
 *
 * These complement tests/cli.test.ts (which exercises the binary via subprocess)
 * by covering edge cases that are tedious to reach through the subprocess path:
 * symbol/function values in renderTable, parseId boundary conditions, and
 * resolveAuth precedence between flags and env.
 */
import { describe, it, expect } from 'vitest';
import { valueToString, renderTable } from '../src/cli/output.js';
import { parseId, optInt, IdParseError } from '../src/cli/ids.js';
import { resolveAuth, MISSING_AUTH_MESSAGE } from '../src/cli/auth.js';
import { dispatch } from '../src/cli/dispatch.js';

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

    it('rejects result:get (only list is valid for result)', () => {
        const result = dispatch('result', 'get');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain("Unknown action 'get' for result");
            expect(result.error).toContain('Use: list');
        }
    });
});
