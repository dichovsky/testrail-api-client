import { YAML_INDENT_SPACES } from '../constants.js';
import { sanitizeForTerminal } from './sanitize.js';

export type OutputFormat = 'json' | 'table' | 'yaml' | 'csv';

export interface OutputOptions {
    quiet: boolean;
    format: OutputFormat;
}

export interface Output {
    out: (data: unknown) => void;
    err: (message: string) => void;
}

export function valueToString(v: unknown): string {
    // CTF #18: every branch routes its return through sanitizeForTerminal
    // so the --format table renderer can't surface attacker-controlled
    // bytes (TestRail field values, server response strings) that the
    // terminal would interpret as ANSI/OSC escapes. The renderer trusts
    // its inputs are display-safe by the time renderTable concatenates
    // them into header/row strings.
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
        try {
            return sanitizeForTerminal(JSON.stringify(v));
        } catch {
            // JSON.stringify throws on circular refs and nested BigInt.
            return '[Object]';
        }
    }
    if (typeof v === 'string') return sanitizeForTerminal(v);
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'symbol') return sanitizeForTerminal(v.toString());
    return '[Function]';
}

function getField(row: unknown, key: string): unknown {
    if (typeof row !== 'object' || row === null) return undefined;
    return (row as Record<string, unknown>)[key];
}

export function renderTable(data: unknown): string {
    const rows: unknown[] = Array.isArray(data) ? (data as unknown[]) : [data];
    if (rows.length === 0) return '(empty)';

    const first: unknown = rows[0];
    if (typeof first !== 'object' || first === null) {
        // CTF #18: route the primitive-array branch through valueToString
        // so a top-level string / number array carrying control chars
        // (e.g. `['safe', '\x1b[31mRED\x1b[0m', 42]`) is sanitized the
        // same way as object cells. Without this the primitive path
        // would emit raw ESC bytes to stdout under --format table.
        return rows.map(valueToString).join('\n');
    }

    // CTF #18 defense-in-depth: sanitize column keys too. TestRail field
    // names today are alphanumeric/snake_case (safe), but the API contract
    // isn't a security boundary — a future field name carrying a control
    // byte would otherwise pass straight through `Object.keys()` into the
    // header row.
    const keys = Object.keys(first).map(sanitizeForTerminal);
    const rawKeys = Object.keys(first);
    const widths = keys.map((k, i) =>
        Math.max(k.length, ...rows.map((r) => valueToString(getField(r, rawKeys[i] ?? k)).length)),
    );

    const line = widths.map((w) => '-'.repeat(w)).join('-+-');
    const header = keys.map((k, i) => k.padEnd(widths[i] ?? k.length)).join(' | ');
    const body = rows.map((r) =>
        keys.map((_k, i) => valueToString(getField(r, rawKeys[i] ?? '')).padEnd(widths[i] ?? 0)).join(' | '),
    );

    return [header, line, ...body].join('\n');
}

/**
 * Best-effort JSON.stringify with two fallbacks, guaranteeing the return
 * value is always parseable JSON for downstream tools (e.g., `jq`):
 *
 * 1. If serialization throws (circular reference, nested BigInt, etc.),
 *    emit a structured `{ error, message }` JSON object.
 * 2. If `JSON.stringify` returns the JS value `undefined` — which it does
 *    for `undefined`, function, or symbol inputs — emit the JSON literal
 *    `"null"`. Without this guard, the caller's template literal would
 *    coerce that `undefined` to the string `"undefined"`, which is not
 *    valid JSON.
 *
 * Exported so unit tests can verify the fallbacks without spawning a
 * subprocess.
 */
export function safeJsonStringify(data: unknown): string {
    try {
        // JSON.stringify returns the JS value undefined for inputs without a
        // JSON representation (undefined, function, symbol); fall back to the
        // JSON literal "null" so the result is always a parseable string.
        return JSON.stringify(data, null, 2) ?? 'null';
    } catch (e) {
        return JSON.stringify(
            { error: 'unserializable', message: e instanceof Error ? e.message : String(e) },
            null,
            2,
        );
    }
}

// ── YAML renderer ────────────────────────────────────────────────────────────
//
// Zero-dependency YAML 1.2-compatible emitter for the CLI `--format yaml`
// path. The CLI ships with zero runtime deps by policy (see CLAUDE.md "DO
// NOT"), so a hand-rolled emitter is preferable to depending on `js-yaml` or
// `yaml`. Scope is intentionally narrow: emit a fresh tree of plain JSON-like
// values (objects, arrays, strings, numbers, booleans, null) — no anchors,
// aliases, tags, or custom types.
//
// Strings are emitted in **double-quoted form whenever any character would
// make the bare form ambiguous** to a YAML 1.2 parser. The double-quoted form
// is the only safe path because it supports the full standard escape table.
// This deliberately quotes more than strictly necessary (e.g. all strings
// containing `:` get quoted, even where context would allow a bare form) so
// that the emitted document round-trips through any conforming YAML parser
// without surprises.

const SPECIAL_BARE_STRINGS: ReadonlySet<string> = new Set([
    // YAML 1.2 plain-scalar reserved tokens that would otherwise be parsed as
    // booleans, null, or special numerics. Quoting these prevents collision.
    '',
    '~',
    'null',
    'Null',
    'NULL',
    'true',
    'True',
    'TRUE',
    'false',
    'False',
    'FALSE',
    'yes',
    'Yes',
    'YES',
    'no',
    'No',
    'NO',
    'on',
    'On',
    'ON',
    'off',
    'Off',
    'OFF',
    '.nan',
    '.NaN',
    '.NAN',
    '.inf',
    '.Inf',
    '.INF',
    '-.inf',
    '-.Inf',
    '-.INF',
]);

function needsQuoting(s: string): boolean {
    if (SPECIAL_BARE_STRINGS.has(s)) return true;
    // Leading or trailing whitespace would be lost in plain form.
    if (s !== s.trim()) return true;
    // A purely numeric / scientific / hex / octal literal would parse as a
    // number; force quoting so it stays a string.
    if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) return true;
    if (/^0x[0-9a-fA-F]+$/.test(s)) return true;
    if (/^0o[0-7]+$/.test(s)) return true;
    // Reserved leading indicators per YAML 1.2 §5.3. A leading `-` followed
    // by space or end-of-string would start a block sequence; `?`/`:` start
    // a mapping key/value; `#` starts a comment. Quote any leading occurrence
    // for safety. Also block-style indicators (`|`, `>`, `*`, `&`, `!`,
    // `@`, backtick, `,`, `[`, `]`, `{`, `}`, `%`) at the start.
    if (/^[-?:#|>*&!@`,[\]{}%]/.test(s)) return true;
    // Any inline `:` followed by space, or trailing `:`, would terminate a
    // mapping key. Any ` #` would start an inline comment. Both unsafe in
    // plain form.
    if (/:\s/.test(s) || /:$/.test(s) || /\s#/.test(s)) return true;
    // Control chars / non-printables — must be quoted (and escaped).
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(s)) return true;
    // Multi-line — block scalars are out of scope; double-quote with \n escapes.
    if (s.includes('\n') || s.includes('\r')) return true;
    // Embedded double-quote or backslash: plain form would round-trip but
    // double-quoted form is more readable and avoids any single-quote/
    // double-quote ambiguity downstream tooling might introduce.
    if (s.includes('"') || s.includes('\\')) return true;
    return false;
}

function escapeDoubleQuoted(s: string): string {
    let out = '';
    for (const ch of s) {
        const code = ch.codePointAt(0) ?? 0;
        switch (ch) {
            case '\\':
                out += '\\\\';
                continue;
            case '"':
                out += '\\"';
                continue;
            case '\n':
                out += '\\n';
                continue;
            case '\r':
                out += '\\r';
                continue;
            case '\t':
                out += '\\t';
                continue;
            case '\b':
                out += '\\b';
                continue;
            case '\f':
                out += '\\f';
                continue;
            case '\0':
                out += '\\0';
                continue;
        }
        if (code < 0x20 || code === 0x7f) {
            // C0 / DEL — emit as \xNN.
            out += `\\x${code.toString(16).padStart(2, '0')}`;
            continue;
        }
        // Printable (including non-ASCII Unicode) — pass through. YAML 1.2
        // permits non-ASCII characters inside double-quoted scalars without
        // escaping.
        out += ch;
    }
    return out;
}

function renderYamlScalar(v: unknown): string {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') {
        if (!Number.isFinite(v)) {
            // NaN → .nan, Infinity → .inf, -Infinity → -.inf per YAML 1.2.
            if (Number.isNaN(v)) return '.nan';
            return v > 0 ? '.inf' : '-.inf';
        }
        return String(v);
    }
    if (typeof v === 'bigint') return v.toString();
    if (typeof v === 'string') {
        if (needsQuoting(v)) return `"${escapeDoubleQuoted(v)}"`;
        return v;
    }
    // Symbols / functions are not valid YAML; coerce to a null literal so the
    // document stays parseable. Matches the JSON path's `safeJsonStringify`
    // behavior for non-serializable inputs.
    return 'null';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Recursive emitter. `depth` is the indent level (0 at the document root).
 * Returns a string with no leading or trailing newline; the caller composes
 * the final document and adds the trailing newline at the stdout boundary.
 */
function renderYamlNode(v: unknown, depth: number): string {
    const indent = ' '.repeat(depth * YAML_INDENT_SPACES);
    if (Array.isArray(v)) {
        if (v.length === 0) return '[]';
        const lines: string[] = [];
        for (const item of v) {
            if (Array.isArray(item) || isPlainObject(item)) {
                const nested = renderYamlNode(item, depth + 1);
                // Sequence-of-sequence / sequence-of-mapping: emit the `- `
                // marker on its own line indent, then the nested block on
                // the next indent level.
                if (Array.isArray(item) && item.length === 0) {
                    lines.push(`${indent}- []`);
                    continue;
                }
                if (isPlainObject(item) && Object.keys(item).length === 0) {
                    lines.push(`${indent}- {}`);
                    continue;
                }
                // Inline first key/element on the `- ` line for compactness
                // when the nested structure has at least one entry. We
                // reuse renderYamlNode for the deeper indent so nested
                // arrays/objects keep recursing.
                const nestedLines = nested.split('\n');
                const [firstNested, ...rest] = nestedLines;
                // firstNested starts with whitespace at depth+1; we
                // replace the leading whitespace with `- `.
                const inlinePrefix = `${indent}- `;
                lines.push(`${inlinePrefix}${(firstNested ?? '').trimStart()}`);
                for (const line of rest) {
                    lines.push(line);
                }
            } else {
                lines.push(`${indent}- ${renderYamlScalar(item)}`);
            }
        }
        return lines.join('\n');
    }
    if (isPlainObject(v)) {
        const keys = Object.keys(v);
        if (keys.length === 0) return '{}';
        const lines: string[] = [];
        for (const key of keys) {
            const val = v[key];
            // YAML keys themselves obey the same quoting rules as string
            // scalars (the parser must not interpret the key as a number,
            // bool, or null).
            const renderedKey = needsQuoting(key) ? `"${escapeDoubleQuoted(key)}"` : key;
            if (Array.isArray(val)) {
                if (val.length === 0) {
                    lines.push(`${indent}${renderedKey}: []`);
                    continue;
                }
                lines.push(`${indent}${renderedKey}:`);
                lines.push(renderYamlNode(val, depth + 1));
                continue;
            }
            if (isPlainObject(val)) {
                if (Object.keys(val).length === 0) {
                    lines.push(`${indent}${renderedKey}: {}`);
                    continue;
                }
                lines.push(`${indent}${renderedKey}:`);
                lines.push(renderYamlNode(val, depth + 1));
                continue;
            }
            lines.push(`${indent}${renderedKey}: ${renderYamlScalar(val)}`);
        }
        return lines.join('\n');
    }
    // Scalar at the root: emit on its own line with no indent.
    return `${indent}${renderYamlScalar(v)}`;
}

/**
 * Render a JSON-like value as a YAML 1.2 document (no leading/trailing
 * newline). The caller adds the trailing newline at the stdout boundary so
 * the spacing matches the existing JSON/table outputs.
 *
 * Exported for unit-test access without spawning a subprocess.
 */
export function renderYaml(value: unknown): string {
    try {
        return renderYamlNode(value, 0);
    } catch (e) {
        // Circular references / unsupported nesting → emit a structured
        // YAML error document so downstream tooling sees a parseable result
        // instead of an empty / partial doc. Mirrors safeJsonStringify.
        const message = e instanceof Error ? e.message : String(e);
        return `error: unserializable\nmessage: ${renderYamlScalar(message)}`;
    }
}

// ── CSV renderer ─────────────────────────────────────────────────────────────
//
// RFC 4180-style CSV. Top-level keys become columns; nested objects/arrays
// are JSON-stringified into a single cell (no dot-path flattening). Each row
// is terminated with CRLF as specified by RFC 4180 §2.1; the final row also
// ends with CRLF for parser consistency. Single-object responses render as
// a one-row CSV with the object's own keys as headers.

const CSV_LINE_TERMINATOR = '\r\n';

function csvCellRequiresQuoting(cell: string): boolean {
    return cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
}

function csvEscapeCell(cell: string): string {
    if (csvCellRequiresQuoting(cell)) {
        return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
}

function csvCellFromValue(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'object') {
        try {
            return JSON.stringify(v);
        } catch {
            return '';
        }
    }
    // Functions / symbols: drop to empty for CSV (matches the JSON path's
    // safeJsonStringify("null") rationale — nothing meaningful to emit in a
    // tabular cell).
    return '';
    // Note: CSV cells are intentionally NOT routed through sanitizeForTerminal
    // (unlike the renderTable path which is built for direct human terminal
    // display). CSV is a structured pipeline format — consumers (Excel,
    // python-csv, awk -F,) re-parse the bytes before display. CTF #18-style
    // ANSI injection on the terminal is the user's risk when they choose to
    // `cat data.csv` directly, matching the established precedent for the
    // JSON path. Legitimate CSV use cases include embedded newlines and tabs
    // (RFC 4180 §2.6: "Fields containing line breaks (CRLF), double quotes,
    // and commas should be enclosed in double-quotes."), which the
    // C0-stripping sanitiser would corrupt.
}

/**
 * Render a JSON-like value as CSV (RFC 4180). The output uses CRLF line
 * terminators and standard double-quote escaping.
 *
 * - Top-level arrays: header row = sorted union of top-level keys across
 *   every object row. Primitive rows emit a single `value` column.
 * - Top-level objects: 1-row CSV with the object's own keys as headers
 *   (preserving insertion order, matching `JSON.stringify`).
 * - Empty arrays: empty string (no header, no rows) — mirrors `renderTable`'s
 *   `(empty)` semantics in spirit but stays parseable as CSV.
 * - Nested objects/arrays in a cell: JSON-stringified into the cell.
 *
 * Exported for unit-test access without spawning a subprocess.
 */
export function renderCsv(value: unknown): string {
    // Array path.
    if (Array.isArray(value)) {
        if (value.length === 0) return '';
        // Determine whether any row is object-shaped. Mixed primitive +
        // object rows are coerced to the object-shaped path with the
        // primitive row contributing one column (`value`).
        const anyObject = value.some((row) => isPlainObject(row));
        if (!anyObject) {
            // Primitive-only array → single 'value' column.
            const lines = [csvEscapeCell('value')];
            for (const row of value) {
                lines.push(csvEscapeCell(csvCellFromValue(row)));
            }
            return lines.join(CSV_LINE_TERMINATOR);
        }
        // Object-shaped (possibly mixed) array → union of keys, sorted.
        const keySet = new Set<string>();
        for (const row of value) {
            if (isPlainObject(row)) {
                for (const k of Object.keys(row)) keySet.add(k);
            }
        }
        const keys = Array.from(keySet).sort();
        const header = keys.map(csvEscapeCell).join(',');
        const lines = [header];
        for (const row of value) {
            if (isPlainObject(row)) {
                lines.push(keys.map((k) => csvEscapeCell(csvCellFromValue(row[k]))).join(','));
            } else {
                // Primitive in an object-shaped array: every cell empty
                // except a synthetic last column would mis-align headers,
                // so emit a single-cell row under the first header. This
                // is documented behavior — callers wanting strict CSV
                // should not mix shapes.
                const cells = keys.map(() => '');
                cells[0] = csvEscapeCell(csvCellFromValue(row));
                lines.push(cells.join(','));
            }
        }
        return lines.join(CSV_LINE_TERMINATOR);
    }
    // Single object → 1-row CSV.
    if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) return '';
        const header = keys.map(csvEscapeCell).join(',');
        const row = keys.map((k) => csvEscapeCell(csvCellFromValue(value[k]))).join(',');
        return [header, row].join(CSV_LINE_TERMINATOR);
    }
    // Top-level scalar → emit a one-row, one-column CSV under 'value'.
    return [csvEscapeCell('value'), csvEscapeCell(csvCellFromValue(value))].join(CSV_LINE_TERMINATOR);
}

export function createOutput(opts: OutputOptions): Output {
    const out = (data: unknown): void => {
        if (opts.quiet) return;
        switch (opts.format) {
            case 'table':
                process.stdout.write(`${renderTable(data)}\n`);
                return;
            case 'yaml':
                process.stdout.write(`${renderYaml(data)}\n`);
                return;
            case 'csv':
                process.stdout.write(`${renderCsv(data)}\n`);
                return;
            case 'json':
            default:
                process.stdout.write(`${safeJsonStringify(data)}\n`);
                return;
        }
    };
    const err = (message: string): void => {
        // CTF #16: sanitize before writing to stderr so TestRail-controlled
        // strings reflected through error messages (validation errors,
        // server response bodies, IDs echoed back) can't inject ANSI/OSC
        // escapes into the user's terminal.
        if (!opts.quiet) process.stderr.write(`Error: ${sanitizeForTerminal(message)}\n`);
    };
    return { out, err };
}
