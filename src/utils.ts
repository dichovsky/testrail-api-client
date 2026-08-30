import { validateId } from './validation.js';

/** Base64-encodes a string. Uses Buffer in Node.js, UTF-8-safe btoa in browsers. */
export function base64Encode(str: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    }
    // In browsers, encode the string as UTF-8 before using btoa
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1: string) => String.fromCharCode(parseInt(p1, 16))),
    );
}

/** Resolves after `ms` milliseconds, or rejects promptly when aborted. */
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

/** Serializes numeric ID filters for TestRail list endpoints. */
export function serializeIdList(ids?: readonly number[]): string | undefined {
    return ids !== undefined && ids.length > 0 ? ids.join(',') : undefined;
}

/**
 * Validate and serialize a scalar-or-list numeric filter accepted by TestRail.
 * Scalars stay numeric, lists use the API's comma-separated representation,
 * and an empty list omits the query parameter.
 */
export function serializeIdFilter(
    value: number | readonly number[] | undefined,
    name: string,
): string | number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') {
        validateId(value, name);
        return value;
    }
    value.forEach((id) => validateId(id, name));
    return value.length > 0 ? value.join(',') : undefined;
}
