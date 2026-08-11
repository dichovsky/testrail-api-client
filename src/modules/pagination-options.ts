import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';

/**
 * Copy a public option subset once before an aggregate starts. Array-valued
 * filters are cloned so caller mutation cannot change later page requests.
 */
export function snapshotOptionFields<T extends object, K extends Extract<keyof T, string>>(
    options: T | undefined,
    keys: readonly K[],
): Partial<Pick<T, K>> {
    if (options === undefined) return {};
    return Object.fromEntries(
        keys.flatMap((key) => {
            const value = options[key];
            if (value === undefined) return [];
            return [[key, Array.isArray(value) ? [...value] : value]];
        }),
    ) as Partial<Pick<T, K>>;
}

/** Whitelist the public bounds accepted by response-driven collectors. */
export function snapshotPaginationSafetyOptions(options: PaginationSafetyOptions | undefined): PaginationSafetyOptions {
    return snapshotOptionFields(options, ['maxPages', 'maxItems', 'maxDurationMs', 'maxBytes']);
}

/** Whitelist the public controls and bounds accepted by controlled collectors. */
export function snapshotPaginatedRequestOptions(options: PaginatedRequestOptions | undefined): PaginatedRequestOptions {
    return snapshotOptionFields(options, [
        'pageSize',
        'startOffset',
        'maxPages',
        'maxItems',
        'maxDurationMs',
        'maxBytes',
    ]);
}
