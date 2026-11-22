import { TestRailValidationError } from './errors.js';
import { validateId } from './validation.js';

/**
 * Base64-encodes a string. The encoding is safe for UTF-8 text. The function
 * does not need a guard for `Buffer`, because the package requires Node >= 26
 * and statically imports `node:` builtins. Thus, the package cannot load in a
 * runtime that does not have `Buffer`.
 */
export function base64Encode(str: string): string {
    return Buffer.from(str).toString('base64');
}

/** Resolves after `ms` milliseconds, or rejects immediately when `signal` is aborted. */
export function sleep(ms: number, signal?: globalThis.AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const abortError = (): Error => {
            const error = new Error('Sleep aborted');
            error.name = 'AbortError';
            return error;
        };

        if (signal?.aborted === true) {
            reject(abortError());
            return;
        }

        const onAbort = (): void => {
            clearTimeout(timeoutId);
            signal?.removeEventListener('abort', onAbort);
            reject(abortError());
        };

        const timeoutId = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

/**
 * Validates and serializes a numeric filter that TestRail accepts as a scalar
 * or a list. A scalar stays a number. A list becomes the comma-separated text
 * that the API uses. For an empty list, the function returns `undefined`, so
 * the request does not include the query parameter. `null` from an untyped
 * caller means "not supplied", as it does for timestamp filters.
 */
export function serializeIdFilter(
    value: number | readonly number[] | null | undefined,
    name: string,
): string | number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        validateId(value, name);
        return value;
    }
    if (!Array.isArray(value)) {
        throw new TestRailValidationError(`${name} must be a positive integer or a list of positive integers`);
    }
    // `for...of` visits holes as `undefined`, which validateId rejects.
    for (const id of value as readonly unknown[]) validateId(id as number, name);
    return value.length > 0 ? value.join(',') : undefined;
}
