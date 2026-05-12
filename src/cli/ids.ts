export class IdParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IdParseError';
    }
}

export function parseId(raw: string | undefined, name: string): number {
    const n = Number(raw);
    if (raw === undefined || raw === '' || !Number.isInteger(n) || n <= 0) {
        throw new IdParseError(`${name} must be a positive integer (got: ${raw ?? '(none)'})`);
    }
    return n;
}

export function optInt(raw: string | undefined): number | undefined {
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
}
