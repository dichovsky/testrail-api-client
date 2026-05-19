import { sanitizeForTerminal } from './sanitize.js';

export interface OutputOptions {
    quiet: boolean;
    format: 'json' | 'table';
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

export function createOutput(opts: OutputOptions): Output {
    const out = (data: unknown): void => {
        if (opts.quiet) return;
        if (opts.format === 'table') {
            process.stdout.write(`${renderTable(data)}\n`);
        } else {
            process.stdout.write(`${safeJsonStringify(data)}\n`);
        }
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
