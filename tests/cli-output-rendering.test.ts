/**
 * Renderer regressions from the 10.0.0 release audit (src/cli/output.ts).
 *
 * Every case here feeds a renderer a value a TestRail server can return and
 * checks what reaches the terminal or a downstream parser: raw control bytes in
 * JSON, a hang in YAML, a crash or a borrowed `Object.prototype` value in the
 * table and CSV projections, and YAML scalars that another parser retypes.
 */
import { performance } from 'node:perf_hooks';
import { describe, it, expect } from 'vitest';
import { renderCsv, renderTable, renderYaml, safeJsonStringify } from '../src/cli/output.js';
import { isControlChar } from '../src/cli/sanitize.js';
import { captureOutput } from './helpers.js';

const DEL = 0x7f;
const C1_LAST = 0x9f;
/** U+007F followed by U+0080–U+009F: the band `JSON.stringify` leaves raw. */
const DEL_AND_C1 = Array.from({ length: C1_LAST - DEL + 1 }, (_, i) => String.fromCharCode(DEL + i)).join('');
/** CSI clear-screen, OSC window title, ST, DEL: the payload from the audit. */
const HOSTILE_NAME = 'pwn\u009b2J\u009d0;evil-title\u009c\u007f';

/** Control characters a terminal would act on. LF is the JSON pretty-printer's own. */
function rawControls(text: string): string[] {
    return [...text].filter((ch) => ch !== '\n' && isControlChar(ch.charCodeAt(0)));
}

describe('safeJsonStringify — DEL and C1 controls', () => {
    it('escapes DEL and every C1 control in keys and values', () => {
        const data = { [`key${DEL_AND_C1}`]: HOSTILE_NAME, nested: [{ title: DEL_AND_C1 }] };
        const out = safeJsonStringify(data);

        expect(rawControls(out)).toEqual([]);
        expect(out).toContain('pwn\\u009b2J\\u009d0;evil-title\\u009c\\u007f');
        // Escaping changes the bytes only: every parser reads the same value.
        expect(JSON.parse(out)).toEqual(data);
    });

    it('keeps an escaped backslash in front of a control character intact', () => {
        const data = { path: 'a\\\u007fb\\\\\u009bc' };
        const out = safeJsonStringify(data);

        expect(rawControls(out)).toEqual([]);
        expect(JSON.parse(out)).toEqual(data);
    });

    it('escapes them in the unserializable fallback message', () => {
        const hostile = {
            toJSON(): never {
                throw new Error('boom\u009b2J');
            },
        };
        const out = safeJsonStringify(hostile);

        expect(rawControls(out)).toEqual([]);
        expect(JSON.parse(out)).toEqual({ error: 'unserializable', message: 'boom\u009b2J' });
    });

    it('leaves printable non-ASCII text as it is', () => {
        // U+00A0 is the first code point above the C1 band.
        expect(safeJsonStringify('café 日本 ~')).toBe('"café 日本 ~"');
    });
});

describe('createOutput — JSON writers keep DEL and C1 off the terminal', () => {
    it('out() in the default json format', () => {
        const captured = captureOutput();
        captured.output.out({ id: 1, name: HOSTILE_NAME });
        const stdout = captured.stdout.join('');

        expect(rawControls(stdout)).toEqual([]);
        expect(JSON.parse(stdout)).toEqual({ id: 1, name: HOSTILE_NAME });
    });

    it('the outPayload ack on stderr', () => {
        const captured = captureOutput();
        captured.output.outPayload('payload', { out: '<stdout>', filename: HOSTILE_NAME });
        const stderr = captured.stderr.join('');

        expect(rawControls(stderr)).toEqual([]);
        expect(JSON.parse(stderr)).toEqual({ out: '<stdout>', filename: HOSTILE_NAME });
    });
});

describe('renderYaml — numeric-literal detection', () => {
    // The pattern needsQuoting used through 9.x. `\d+\.?\d*` can split one digit
    // run at every position, so a long run followed by a non-digit backtracked
    // in quadratic time. Kept here as the oracle for the linear replacement.
    const LEGACY_NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

    it('renders a long digit run followed by a letter in linear time', () => {
        const DIGITS = 40_000;
        // 9.x needed about 3 s for this input; the linear pattern needs under 1 ms.
        const BUDGET_MS = 500;
        const value = `${'1'.repeat(DIGITS)}x`;

        const started = performance.now();
        const out = renderYaml({ comment: value });
        const elapsed = performance.now() - started;

        expect(out).toBe(`comment: ${value}`);
        expect(elapsed).toBeLessThan(BUDGET_MS);
    });

    it('quotes exactly the strings the 9.x pattern quoted', () => {
        // Every string up to MAX_LENGTH over one character per class the two
        // patterns tell apart: digit, dot, each sign, each exponent letter,
        // anything else. No other quoting rule fires on this alphabet except
        // for the empty string and a leading `-`, so the quoted flag is
        // otherwise the numeric pattern's verdict alone. Six characters hold
        // every mantissa shape with a sign or a signed exponent (`1.1e+1`).
        const ALPHABET = '1.+-eEx';
        const MAX_LENGTH = 6;
        const disagreements: string[] = [];
        let checked = 0;

        const visit = (s: string): void => {
            checked++;
            const expected = s === '' || s.startsWith('-') || LEGACY_NUMERIC.test(s);
            if (renderYaml(s).startsWith('"') !== expected) disagreements.push(s);
            if (s.length === MAX_LENGTH) return;
            for (const ch of ALPHABET) visit(s + ch);
        };
        visit('');

        expect(disagreements).toEqual([]);
        expect(checked).toBe((ALPHABET.length ** (MAX_LENGTH + 1) - 1) / (ALPHABET.length - 1));
    });
});

describe('renderTable / renderCsv — keys that exist on Object.prototype', () => {
    // JSON.parse defines `__proto__` as an own property. Advisory validation
    // returns a mismatching response raw, so the key reaches the renderers.
    const POISONED_ROW = '{"id":1,"__proto__":"x"}';

    it('table renders a single object that has an own __proto__ key', () => {
        expect(renderTable(JSON.parse(POISONED_ROW))).toBe('id | __proto__\n---+----------\n1  | x        ');
    });

    it('table leaves the cell empty for a row without the key', () => {
        const out = renderTable(JSON.parse(`[${POISONED_ROW},{"id":2}]`));
        expect(out).toBe('id | __proto__\n---+----------\n1  | x        \n2  |          ');
    });

    it('table renders a scalar row next to a poisoned one', () => {
        const out = renderTable(JSON.parse(`[${POISONED_ROW},42]`));
        expect(out).toBe('id | __proto__\n---+----------\n1  | x        \n   |          ');
    });

    it('csv leaves the cell empty for a row without the key', () => {
        const out = renderCsv(JSON.parse(`[${POISONED_ROW},{"id":2}]`));
        expect(out).toBe('__proto__,id\r\nx,1\r\n,2');
    });

    it('table does not borrow an inherited member for a row without the key', () => {
        const out = renderTable([{ constructor: 'c', toString: 't' }, { id: 1 }]);
        expect(out.split('\n')[3]).toBe('            |          | 1 ');
    });
});

describe('renderYaml — scalars a YAML 1.1 parser retypes', () => {
    it('quotes the merge key as a mapping key and as a value', () => {
        expect(renderYaml({ '<<': { injected: 1 }, a: 1 })).toBe('"<<":\n  injected: 1\na: 1');
        expect(renderYaml('<<')).toBe('"<<"');
    });

    it('quotes binary integer literals', () => {
        expect(renderYaml('0b11')).toBe('"0b11"');
        expect(renderYaml('+0b101')).toBe('"+0b101"');
        expect(renderYaml({ '0b1': 'k' })).toBe('"0b1": k');
    });

    it('quotes signed hex and octal integer literals', () => {
        for (const value of ['+0x1F', '-0x1F', '0x1F', '+0o17', '-0o17', '0o17']) {
            expect(renderYaml(value)).toBe(`"${value}"`);
        }
        expect(renderYaml({ '+0x1F': '+0o17' })).toBe('"+0x1F": "+0o17"');
    });

    it('quotes date and timestamp strings', () => {
        for (const value of ['2026-01-01', '2026-1-1', '2026-11-21T10:00:00Z', '2026-11-21 10:00:00']) {
            expect(renderYaml(value)).toBe(`"${value}"`);
        }
        expect(renderYaml({ name: '2026-11-21' })).toBe('name: "2026-11-21"');
    });

    it('quotes sexagesimal numbers, underscore digit groups, and the value key', () => {
        for (const value of [
            '1:30',
            '190:20:30',
            '-12:30:45.5',
            '1_000',
            '0_1',
            '+1_000.5',
            '1_0.5e+3',
            '.5_0',
            '0x1_f',
            '0b1_0',
            '0o1_7',
            '=',
        ]) {
            expect(renderYaml(value)).toBe(`"${value}"`);
        }
        expect(renderYaml({ at: '10:00' })).toBe('at: "10:00"');
    });

    it('escapes U+2028 and U+2029 instead of writing them raw', () => {
        expect(renderYaml('a\u2028b\u2029c')).toBe('"a\\u2028b\\u2029c"');
    });

    it('quotes the new forms in linear time', () => {
        const started = performance.now();
        renderYaml(`${'1:'.repeat(200_000)}x`);
        renderYaml(`${'1_'.repeat(200_000)}x`);
        expect(performance.now() - started).toBeLessThan(500);
    });

    it('leaves strings that only resemble those forms bare', () => {
        for (const value of [
            '<<x',
            'a<<',
            '0b12',
            '0b',
            'x0b11',
            '+0xG',
            '+0o8',
            'v2026-01-01',
            '2026-01',
            '202-01-01',
            '1:x',
            'a:30',
            '_1',
            '1__a',
            '==',
        ]) {
            expect(renderYaml(value)).toBe(value);
        }
    });
});

describe('renderTable — large result sets', () => {
    it('renders more rows than a function call can take arguments', () => {
        // One argument per row overflowed the stack near 124,000 rows.
        const ROWS = 200_000;
        const rows = Array.from({ length: ROWS }, (_, i) => ({ id: i + 1 }));

        const lines = renderTable(rows).split('\n');

        expect(lines).toHaveLength(ROWS + 2);
        // The column is as wide as its widest cell, which is in the last row.
        expect(lines[1]).toBe('-'.repeat(String(ROWS).length));
        expect(lines[2]).toBe('1'.padEnd(String(ROWS).length));
        expect(lines.at(-1)).toBe(String(ROWS));
    });
});
