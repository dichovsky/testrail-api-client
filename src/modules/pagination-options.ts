import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';

function isUnknownArray(value: unknown): value is readonly unknown[] {
    return Array.isArray(value);
}

function snapshotValue(value: unknown): unknown {
    return isUnknownArray(value) ? [...value] : value;
}

/**
 * Copy a public option subset one time, before an aggregate starts. The
 * function clones array-valued filters, so that a caller mutation cannot change
 * later page requests.
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
            return [[key, snapshotValue(value)]];
        }),
    ) as Partial<Pick<T, K>>;
}

/** Whitelist the public safety limits that response-driven collectors accept. */
export function snapshotPaginationSafetyOptions(options: PaginationSafetyOptions | undefined): PaginationSafetyOptions {
    return snapshotOptionFields(options, ['maxPages', 'maxItems', 'maxDurationMs', 'maxBytes']);
}

/** Whitelist the public controls and safety limits that controlled collectors accept. */
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
