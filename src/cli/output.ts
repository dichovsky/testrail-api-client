export interface OutputOptions {
    quiet: boolean;
    format: 'json' | 'table';
}

export interface Output {
    out: (data: unknown) => void;
    err: (message: string) => void;
}

export function valueToString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
        try {
            return JSON.stringify(v);
        } catch {
            // JSON.stringify throws on circular refs and nested BigInt.
            return '[Object]';
        }
    }
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'symbol') return v.toString();
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
        return rows.map(String).join('\n');
    }

    const keys = Object.keys(first);
    const widths = keys.map((k) => Math.max(k.length, ...rows.map((r) => valueToString(getField(r, k)).length)));

    const line = widths.map((w) => '-'.repeat(w)).join('-+-');
    const header = keys.map((k, i) => k.padEnd(widths[i] ?? k.length)).join(' | ');
    const body = rows.map((r) =>
        keys.map((k, i) => valueToString(getField(r, k)).padEnd(widths[i] ?? k.length)).join(' | '),
    );

    return [header, line, ...body].join('\n');
}

/**
 * Best-effort JSON.stringify with a structured fallback. If serialization
 * fails (circular reference, nested BigInt, etc.), emits a valid JSON
 * object describing the failure rather than throwing — so callers piping
 * through `jq` always receive parseable JSON.
 *
 * Exported so unit tests can verify the fallback path without spawning a
 * subprocess.
 */
export function safeJsonStringify(data: unknown): string {
    try {
        return JSON.stringify(data, null, 2);
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
        if (!opts.quiet) process.stderr.write(`Error: ${message}\n`);
    };
    return { out, err };
}
