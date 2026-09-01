import { YAML_INDENT_SPACES } from '../constants.js';
import { isControlChar, sanitizeForTerminal, stripChars } from './sanitize.js';

export type OutputFormat = 'json' | 'table' | 'yaml' | 'csv';

export interface OutputOptions {
    quiet: boolean;
    format: OutputFormat;
}

type ProjectedCell =
    | { readonly trusted: true; readonly source: null | undefined | number | boolean | bigint }
    | { readonly trusted: false; readonly source: unknown };

interface ProjectedRow {
    cells: Record<string, ProjectedCell>;
    isRecord: boolean;
    scalarValue?: ProjectedCell;
}

interface ProjectedOutput {
    readonly columns: readonly string[];
    readonly rows: readonly ProjectedRow[];
}

export interface Output {
    out: (data: unknown) => void;
    err: (message: string) => void;
    /** Quiet-aware raw stderr writer (no 'Error:' prefix). Used when a
     *  handler needs to emit a JSON ack to stderr so stdout stays pure
     *  binary (e.g., `attachment get --out -`). Bytes are written
     *  verbatim — the caller already controls sanitization. */
    errRaw: (chunk: string) => void;
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

function projectCell(value: unknown): ProjectedCell {
    if (value === null || value === undefined) {
        return { trusted: true, source: value };
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return { trusted: true, source: value };
    }
    return { trusted: false, source: value };
}

function projectRecord(row: Record<string, unknown>, columns: readonly string[]): ProjectedRow {
    const cells: Record<string, ProjectedCell> = {};
    for (const key of columns) {
        cells[key] = projectCell(getField(row, key));
    }
    return { cells, isRecord: true };
}

function projectOutput(data: unknown, arrayRowsAreRecords = false): ProjectedOutput {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && (arrayRowsAreRecords || !Array.isArray(value));

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return { columns: [], rows: [] };
        }

        if (data.some(isRecord)) {
            const columns = Array.from(
                new Set(
                    data.flatMap((row) => (isRecord(row) ? Object.keys(row) : [])),
                ),
            );
            return {
                columns,
                rows: data.map((row) =>
                    isRecord(row)
                        ? projectRecord(row, columns)
                        : { cells: {}, isRecord: false, scalarValue: projectCell(row) },
                ),
            };
        }

        const projectedRows: ProjectedRow[] = data.map((row) => ({
            cells: { value: projectCell(row) },
            isRecord: false,
            scalarValue: projectCell(row),
        }));
        return { columns: ['value'], rows: projectedRows };
    }

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const keys = Object.keys(data);
        return {
            columns: keys,
            rows: [projectRecord(data as Record<string, unknown>, keys)],
        };
    }

    return {
        columns: ['value'],
        rows: [{ cells: { value: projectCell(data) }, isRecord: false, scalarValue: projectCell(data) }],
    };
}

export function renderTable(data: unknown): string {
    const rows: readonly unknown[] = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return '(empty)';

    // Preserve the established scalar-first contract for primitive and mixed
    // arrays. A later object remains a scalar JSON value instead of silently
    // turning the earlier primitive rows into empty object-table cells.
    const first = rows[0];
    if (typeof first !== 'object' || first === null) return rows.map(valueToString).join('\n');

    const projected = projectOutput(data, true);
    if (
        Array.isArray(data) &&
        projected.columns.length === 1 &&
        projected.columns[0] === 'value' &&
        projected.rows.every((row) => !row.isRecord)
    ) {
        return projected.rows.map((row) => valueToString(row.cells['value']?.source)).join('\n');
    }

    const rawKeys = projected.columns;
    const keys = rawKeys.map(sanitizeForTerminal);
    const widths = keys.map((k, i) => {
        const column = rawKeys[i] ?? k;
        const bodyMax = projected.rows.map((r) => valueToString(r.cells[column]?.source).length);
        return Math.max(k.length, ...bodyMax);
    });

    const line = widths.map((w) => '-'.repeat(w)).join('-+-');
    const header = keys.map((k, i) => k.padEnd(widths[i] ?? k.length)).join(' | ');
    const body = projected.rows.map((row) =>
        keys
            .map((_k, i) => {
                const column = rawKeys[i] ?? '';
                return valueToString(row.cells[column]?.source).padEnd(widths[i] ?? 0);
            })
            .join(' | '),
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

/**
 * Write a download payload to stdout and emit its JSON ack to stderr, so the
 * stdout stream stays a pure binary/text payload for downstream tools. Shared
 * by the `attachment get --out -` and `bdd get --out -` handlers. `errRaw` is
 * the quiet-aware raw stderr writer; when absent (minimal-ctx callers) the ack
 * is dropped.
 */
export function emitStdoutAck(
    payload: Uint8Array | string,
    ack: Record<string, unknown>,
    errRaw?: (chunk: string) => void,
): void {
    process.stdout.write(payload);
    if (errRaw !== undefined) {
        errRaw(`${safeJsonStringify(ack)}\n`);
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
    // The YAML 1.2 Core Schema float tag is `[-+]?(\.inf|\.Inf|\.INF)` — the sign is
    // optional — so a bare `+.inf` resolves to +Infinity. Quote the positive-sign
    // forms too, matching the sign-less and negative entries above (#238).
    '+.inf',
    '+.Inf',
    '+.INF',
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
    // A leading quote opens a quoted scalar per YAML 1.2 §7.3: a leading `'`
    // starts a single-quoted scalar (emitted bare it makes the document
    // unparseable, or silently strips the surrounding quotes), and a leading
    // `"` starts a double-quoted scalar. Force the double-quoted form so the
    // value round-trips as a literal string. (`"` is also caught by the
    // embedded-`"` scan below; listing it here keeps the leading-indicator
    // intent in one place.)
    if (s.startsWith("'") || s.startsWith('"')) return true;
    // Any inline `:` followed by space, or trailing `:`, would terminate a
    // mapping key. Any ` #` would start an inline comment. Both unsafe in
    // plain form.
    if (/:\s/.test(s) || /:$/.test(s) || /\s#/.test(s)) return true;
    // Control chars / non-printables — must be quoted (and escaped). Scanned
    // by character code (no control-character regex literal): C0 (U+0000–U+001F),
    // DEL (U+007F), and C1 (U+0080–U+009F), all single UTF-16 code units.
    for (const ch of s) {
        if (isControlChar(ch.charCodeAt(0))) return true;
    }
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
        if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
            // C0 / DEL / C1 — emit as \xNN.
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
            // Empty-container short-circuits first so the recursive descent
            // is avoided for `[]` / `{}` elements — purely a perf and
            // readability win; the inline-flow form is what we'd emit anyway.
            if (Array.isArray(item) && item.length === 0) {
                lines.push(`${indent}- []`);
                continue;
            }
            if (isPlainObject(item) && Object.keys(item).length === 0) {
                lines.push(`${indent}- {}`);
                continue;
            }
            if (Array.isArray(item) || isPlainObject(item)) {
                // Sequence-of-sequence / sequence-of-mapping: emit the `- `
                // marker on its own line indent, then the nested block on
                // the next indent level. Inline the first key/element on
                // the `- ` line for compactness; deeper nesting recurses.
                const nested = renderYamlNode(item, depth + 1);
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
// are JSON-stringified into a single cell (no dot-path flattening). Rows are
// joined with CRLF (RFC 4180 §2.1); `renderCsv` returns the body WITHOUT a
// trailing CRLF — `createOutput` appends the final terminator at the stdout
// boundary. Single-object responses use the object's own keys as headers.
//
// SEC #35 (CWE-1236) — formula injection: cells are neutralized before
// RFC-quoting so spreadsheet apps (Excel/Sheets/LibreOffice) do not evaluate
// attacker-controlled field values as formulas. A leading ' is prefixed when
// the cell starts with = + - @ or with TAB/CR. RFC quoting alone is
// insufficient — spreadsheets strip surrounding quotes before evaluation.
// This mutates the displayed value (e.g. `=1+1` → `'=1+1`); callers
// parsing the CSV programmatically should strip the leading ' when present.
// Applied to untrusted text only — string cells, JSON-stringified objects, and
// header keys. Trusted typed values (number/boolean/bigint) bypass it: their
// string form is always a numeric/boolean literal, never a formula, so
// neutralizing them would corrupt legitimate values (e.g. -1 → '-1).

const CSV_LINE_TERMINATOR = '\r\n';

// CSV's own structural characters: TAB (U+0009), LF (U+000A), CR (U+000D).
// These must survive sanitization because CSV cells legitimately contain
// them (and quoting handles CR/LF); every other control char is stripped.
const TAB = 0x09;
const LF = 0x0a;
const CR = 0x0d;

// SEC #35 (CWE-1236) — leading characters that trigger formula evaluation in
// spreadsheet apps when they appear as the first character of an unquoted
// (or RFC-quoted-then-stripped) cell. OWASP recommended set.
const CSV_FORMULA_LEAD_CHARS: ReadonlySet<string> = new Set(['=', '+', '-', '@']);

// Prefix a single quote so the cell is shown literally. neutralize-first,
// then RFC-quote keeps the two concerns separate and the quoting logic correct.
function neutralizeCsvFormula(cell: string): string {
    if (cell.length === 0) return cell;
    const code = cell.charCodeAt(0);
    const first = cell[0];
    if ((first !== undefined && CSV_FORMULA_LEAD_CHARS.has(first)) || code === TAB || code === CR) {
        return `'${cell}`;
    }
    return cell;
}

function csvCellRequiresQuoting(cell: string): boolean {
    return cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
}

// RFC 4180 quoting only — no formula neutralization.
//
// Precondition: the caller must have already neutralized any untrusted content.
// Reach for the two wrappers instead of calling this directly: csvEscapeCell for
// header keys, csvDataCell for value cells.
function csvQuoteCell(cell: string): string {
    if (csvCellRequiresQuoting(cell)) {
        return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
}

// Header cells (object keys, the synthetic 'value' column) are untrusted text,
// so they are formula-neutralized before RFC-quoting.
function csvEscapeCell(cell: string): string {
    return csvQuoteCell(neutralizeCsvFormula(cell));
}

// Value cells: csvCellFromProjected already neutralizes untrusted string/object
// content (and leaves trusted typed numbers verbatim), so only RFC-quoting
// remains. The header/value split keeps trusted numbers from being neutralized.
function csvDataCell(cell: ProjectedCell | undefined): string {
    return csvQuoteCell(csvCellFromProjected(cell));
}

function sanitizeForCsv(cell: string): string {
    // Strip terminal-control bytes while preserving CR/LF/TAB used by CSV
    // itself. Code-point scan (no control-character regex literal).
    return stripChars(cell, (code) => isControlChar(code) && code !== TAB && code !== LF && code !== CR);
}

function csvCellFromProjected(cell: ProjectedCell | undefined): string {
    if (cell === undefined) return '';
    // Trust classification comes from the shared projector. Typed scalar
    // values are safe to emit verbatim; text and structured values are not.
    if (cell.trusted) return cell.source === null || cell.source === undefined ? '' : String(cell.source);
    const v = cell.source;
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return neutralizeCsvFormula(sanitizeForCsv(v));
    if (typeof v === 'object') {
        try {
            return neutralizeCsvFormula(sanitizeForCsv(JSON.stringify(v)));
        } catch {
            return '';
        }
    }
    // Functions / symbols: drop to empty for CSV (matches the JSON path's
    // safeJsonStringify("null") rationale — nothing meaningful to emit in a
    // tabular cell).
    return '';
    // Note: CSV cells are sanitized with a narrower policy than
    // sanitizeForTerminal: strip terminal-control bytes (including ESC/OSC
    // introducers and C1 controls), but preserve CR/LF so RFC 4180 multi-line
    // fields remain representable.
}

/**
 * Render a JSON-like value as CSV (RFC 4180). The output uses CRLF line
 * terminators and standard double-quote escaping.
 *
 * - Top-level arrays: header row = sorted union of top-level keys across
 *   every object row. Primitive rows in mixed-shape arrays are emitted under
 *   the first existing header column.
 * - Top-level objects: 1-row CSV with the object's own keys as headers
 *   (preserving insertion order, matching `JSON.stringify`).
 * - Empty arrays: empty string (no header, no rows) — mirrors `renderTable`'s
 *   `(empty)` semantics in spirit but stays parseable as CSV.
 * - Nested objects/arrays in a cell: JSON-stringified into the cell.
 *
 * Exported for unit-test access without spawning a subprocess.
 */
export function renderCsv(value: unknown): string {
    const projected = projectOutput(value);
    if (projected.columns.length === 0) return '';
    if (projected.rows.length === 0) return '';

    // Top-level scalar.
    if (!Array.isArray(value) && !isPlainObject(value)) {
        return [csvEscapeCell('value'), csvDataCell(projected.rows[0]?.cells['value'])].join(CSV_LINE_TERMINATOR);
    }

    // Primitive-only array.
    if (
        projected.columns.length === 1 &&
        projected.columns[0] === 'value' &&
        projected.rows.every((row) => !row.isRecord)
    ) {
        const lines = [csvEscapeCell('value')];
        for (const row of projected.rows) {
            lines.push(csvDataCell(row.cells['value']));
        }
        return lines.join(CSV_LINE_TERMINATOR);
    }

    // Array unions are sorted for stability; a single object's own key order
    // remains part of the established CSV contract.
    const keys = Array.isArray(value) ? Array.from(projected.columns).sort() : Array.from(projected.columns);
    const header = keys.map((key) => csvEscapeCell(sanitizeForCsv(key))).join(',');
    const lines = [header];
    for (const row of projected.rows) {
        if (row.isRecord) {
            lines.push(keys.map((key) => csvDataCell(row.cells[key])).join(','));
        } else {
            const cells = keys.map(() => '');
            cells[0] = csvDataCell(row.scalarValue);
            lines.push(cells.join(','));
        }
    }
    return lines.join(CSV_LINE_TERMINATOR);
}

export function createOutput(opts: OutputOptions): Output {
    const encoders: Record<OutputFormat, (payload: unknown) => string> = {
        table: renderTable,
        yaml: renderYaml,
        csv: renderCsv,
        json: safeJsonStringify,
    };
    const out = (data: unknown): void => {
        if (opts.quiet) return;
        const output = encoders[opts.format](data);
        if (opts.format === 'csv') {
            process.stdout.write(output === '' ? '' : `${output}${CSV_LINE_TERMINATOR}`);
            return;
        }
        process.stdout.write(`${output}\n`);
    };
    const err = (message: string): void => {
        // CTF #16: sanitize before writing to stderr so TestRail-controlled
        // strings reflected through error messages (validation errors,
        // server response bodies, IDs echoed back) can't inject ANSI/OSC
        // escapes into the user's terminal.
        if (!opts.quiet) process.stderr.write(`Error: ${sanitizeForTerminal(message)}\n`);
    };
    const errRaw = (chunk: string): void => {
        // No 'Error:' prefix and no sanitization — caller already produced
        // the exact bytes to emit (e.g. a JSON ack from safeJsonStringify).
        // Still gated on --quiet so structured JSON acks remain suppressible.
        if (!opts.quiet) process.stderr.write(chunk);
    };
    return { out, err, errRaw };
}
