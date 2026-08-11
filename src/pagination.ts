import {
    DEFAULT_MAX_PAGINATION_BYTES,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGES,
    DEFAULT_PAGE_SIZE,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
    MAX_TIMEOUT_MS,
} from './constants.js';
import { TestRailPaginationError, TestRailValidationError } from './errors.js';

export interface PageLinks {
    next: string | null;
    prev: string | null;
}

/** A normalized TestRail list response without invented legacy metadata. */
export type Page<T> =
    | {
          kind: 'envelope';
          items: T[];
          offset: number;
          limit: number;
          size: number;
          _links: PageLinks;
      }
    | {
          kind: 'legacy-array';
          items: T[];
          size: number;
      };

export type PaginationErrorReason =
    'max_pages' | 'max_items' | 'max_duration' | 'max_bytes' | 'invalid_page' | 'invalid_continuation' | 'non_progress';

/** Bounds shared by all get-all methods, including envelope-only endpoints. */
export interface PaginationSafetyOptions {
    maxPages?: number;
    maxItems?: number;
    maxDurationMs?: number;
    maxBytes?: number;
}

/** Request controls exposed only by endpoints with documented limit/offset input. */
export interface PaginatedRequestOptions extends PaginationSafetyOptions {
    pageSize?: number;
    startOffset?: number;
}

/** Trusted values passed to a domain adapter for one component request. */
export interface PaginationRequest {
    readonly offset: number | undefined;
    readonly limit: number | undefined;
    readonly bypassCache: true;
    /** Absolute wall-clock deadline shared by every request in one aggregate. */
    readonly deadlineAt: number;
    readonly remainingTimeMs: number;
}

export interface PaginationContinuation {
    readonly offset: number;
    readonly limit: number | undefined;
}

interface CollectionStats {
    readonly pagesFetched: number;
    readonly itemsFetched: number;
}

interface ControlledCollectionOptions<T> extends PaginatedRequestOptions {
    readonly requestControls?: true;
    readonly fetchPage: (request: PaginationRequest) => Promise<Page<T>>;
    /** @internal Injectable monotonic-ish wall clock for deterministic tests. */
    readonly now?: () => number;
}

interface EnvelopeOnlyCollectionOptions<T> extends PaginationSafetyOptions {
    readonly requestControls: false;
    readonly pageSize?: never;
    readonly startOffset?: never;
    readonly fetchPage: (request: PaginationRequest) => Promise<Page<T>>;
    /** @internal Injectable monotonic-ish wall clock for deterministic tests. */
    readonly now?: () => number;
}

export type CollectAllPagesOptions<T> = ControlledCollectionOptions<T> | EnvelopeOnlyCollectionOptions<T>;

interface ResolvedCollectionOptions {
    readonly requestControls: boolean;
    readonly pageSize: number | undefined;
    readonly startOffset: number | undefined;
    readonly maxPages: number;
    readonly maxItems: number;
    readonly maxDurationMs: number;
    readonly maxBytes: number;
}

const PAGINATION_METADATA_KEYS = ['offset', 'limit', 'size', '_links'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasPaginationMetadataSignature(value: unknown): boolean {
    return (
        isRecord(value) &&
        PAGINATION_METADATA_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(value, key)).length >= 2
    );
}

function isNonNegativeInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function invalidPage(message: string, stats: CollectionStats = { pagesFetched: 0, itemsFetched: 0 }): never {
    throw new TestRailPaginationError('invalid_page', message, stats.pagesFetched, stats.itemsFetched);
}

function decodeEnvelope<T>(key: string, raw: Record<string, unknown>, stats?: CollectionStats): Page<T> {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) {
        return invalidPage(`Pagination envelope is missing the "${key}" collection`, stats);
    }

    const collection = raw[key];
    if (collection !== null && !Array.isArray(collection)) {
        return invalidPage(`Pagination envelope field "${key}" must be an array or null`, stats);
    }
    if (!isNonNegativeInteger(raw['offset'])) {
        return invalidPage('Pagination envelope offset must be a non-negative safe integer', stats);
    }
    if (!isPositiveInteger(raw['limit']) || raw['limit'] > MAX_PAGINATION_LIMIT) {
        return invalidPage(`Pagination envelope limit must be an integer from 1 to ${MAX_PAGINATION_LIMIT}`, stats);
    }
    if (!isNonNegativeInteger(raw['size'])) {
        return invalidPage('Pagination envelope size must be a non-negative safe integer', stats);
    }
    if (raw['size'] > raw['limit']) {
        return invalidPage('Pagination envelope size must not exceed its limit', stats);
    }
    if (collection !== null && collection.length > raw['limit']) {
        return invalidPage(`Pagination envelope collection "${key}" must not exceed its limit`, stats);
    }

    const links = raw['_links'];
    if (!isRecord(links)) {
        return invalidPage('Pagination envelope _links must be an object', stats);
    }
    const next = links['next'];
    const prev = links['prev'];
    if (next !== null && typeof next !== 'string') {
        return invalidPage('Pagination envelope _links.next must be a string or null', stats);
    }
    if (prev !== null && typeof prev !== 'string') {
        return invalidPage('Pagination envelope _links.prev must be a string or null', stats);
    }

    return {
        kind: 'envelope',
        items: (collection ?? []) as T[],
        offset: raw['offset'],
        limit: raw['limit'],
        size: raw['size'],
        _links: { next, prev },
    };
}

/**
 * Structurally decodes a list response after advisory Zod validation. Entity
 * rows are deliberately not inspected here, so a drifted row remains usable;
 * pagination metadata and the outer collection fail closed.
 */
export function decodePage<T>(key: string, raw: unknown, stats?: CollectionStats): Page<T> {
    if (key.length === 0) {
        throw new TestRailValidationError('pagination collection key must not be empty');
    }
    if (Array.isArray(raw)) {
        return { kind: 'legacy-array', items: raw as T[], size: raw.length };
    }
    if (!isRecord(raw)) {
        return invalidPage('Paginated response must be an envelope or a legacy array', stats);
    }
    return decodeEnvelope<T>(key, raw, stats);
}

/**
 * Decodes the case-history variant, which may wrap exactly one envelope in an
 * outer array. Multiple or mixed envelopes are ambiguous and rejected.
 */
export function decodeNestedPage<T>(key: string, raw: unknown, stats?: CollectionStats): Page<T> {
    if (!Array.isArray(raw)) {
        return decodePage<T>(key, raw, stats);
    }

    const values = raw as unknown[];
    const envelopeIndexes = values.flatMap((value, index) =>
        isRecord(value) && Object.prototype.hasOwnProperty.call(value, key) ? [index] : [],
    );
    if (envelopeIndexes.length === 0) {
        if (values.some(hasPaginationMetadataSignature)) {
            return invalidPage(
                `Nested pagination response contains a metadata signature but is missing the "${key}" collection`,
                stats,
            );
        }
        return { kind: 'legacy-array', items: raw as T[], size: raw.length };
    }
    if (raw.length !== 1 || envelopeIndexes.length !== 1) {
        return invalidPage('Nested pagination response must contain exactly one envelope and no entity rows', stats);
    }
    // The one-envelope cardinality check above proves this value is the record
    // that contributed the sole index.
    const envelope = values[0] as Record<string, unknown>;
    return decodeEnvelope<T>(key, envelope, stats);
}

function parseCanonicalInteger(values: string[], name: string, allowZero: boolean, stats: CollectionStats): number {
    if (values.length !== 1) {
        throw new TestRailPaginationError(
            'invalid_continuation',
            `Pagination continuation must contain exactly one ${name} parameter`,
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }
    const [raw] = values;
    const canonicalPattern = allowZero ? /^(?:0|[1-9]\d*)$/ : /^[1-9]\d*$/;
    if (raw === undefined || !canonicalPattern.test(raw)) {
        throw new TestRailPaginationError(
            'invalid_continuation',
            `Pagination continuation ${name} must be a decimal integer`,
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < (allowZero ? 0 : 1)) {
        throw new TestRailPaginationError(
            'invalid_continuation',
            `Pagination continuation ${name} is outside the supported range`,
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }
    return parsed;
}

/**
 * Extracts only validated continuation controls. The returned host and path
 * are intentionally discarded; domain adapters rebuild their known endpoint.
 */
export function parsePaginationContinuation(
    next: string,
    stats: CollectionStats = { pagesFetched: 0, itemsFetched: 0 },
): PaginationContinuation {
    if (next.length === 0) {
        throw new TestRailPaginationError(
            'invalid_continuation',
            'Pagination continuation link must not be empty',
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }

    let url: URL;
    try {
        url = new URL(next, 'https://pagination.invalid/');
    } catch {
        throw new TestRailPaginationError(
            'invalid_continuation',
            'Pagination continuation link is not a valid URL reference',
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }

    // TestRail emits both conventional query links and path-style links such
    // as `/api/v2/get_cases/1&limit=250&offset=250`. Read controls from both
    // locations, then validate the combined values so cross-form duplicates
    // cannot bypass the exactly-once requirement.
    const pathControlIndex = url.pathname.indexOf('&');
    const pathSearchParams = new globalThis.URLSearchParams(
        pathControlIndex === -1 ? '' : url.pathname.slice(pathControlIndex + 1),
    );
    const offsetValues = [...url.searchParams.getAll('offset'), ...pathSearchParams.getAll('offset')];
    const offset = parseCanonicalInteger(offsetValues, 'offset', true, stats);
    const limitValues = [...url.searchParams.getAll('limit'), ...pathSearchParams.getAll('limit')];
    const limit = limitValues.length === 0 ? undefined : parseCanonicalInteger(limitValues, 'limit', false, stats);
    if (limit !== undefined && limit > MAX_PAGINATION_LIMIT) {
        throw new TestRailPaginationError(
            'invalid_continuation',
            `Pagination continuation limit must not exceed ${MAX_PAGINATION_LIMIT}`,
            stats.pagesFetched,
            stats.itemsFetched,
        );
    }
    return { offset, limit };
}

function validatePositiveBound(value: number, name: string, maximum?: number): void {
    if (!isPositiveInteger(value) || (maximum !== undefined && value > maximum)) {
        const suffix = maximum === undefined ? '' : ` not exceeding ${maximum}`;
        throw new TestRailValidationError(`${name} must be a positive integer${suffix}`);
    }
}

function defaultWhenUndefined<T>(value: T | undefined, fallback: T): T {
    if (value === undefined) return fallback;
    return value;
}

function resolveCollectionOptions<T>(options: CollectAllPagesOptions<T>): ResolvedCollectionOptions {
    const requestControls = options.requestControls !== false;
    const pageSize = requestControls ? defaultWhenUndefined(options.pageSize, DEFAULT_PAGE_SIZE) : undefined;
    const startOffset = requestControls ? defaultWhenUndefined(options.startOffset, 0) : undefined;
    const maxPages = defaultWhenUndefined(options.maxPages, DEFAULT_MAX_PAGES);
    const maxItems = defaultWhenUndefined(options.maxItems, DEFAULT_MAX_ITEMS);
    const maxDurationMs = defaultWhenUndefined(options.maxDurationMs, DEFAULT_MAX_PAGINATION_DURATION_MS);
    const maxBytes = defaultWhenUndefined(options.maxBytes, DEFAULT_MAX_PAGINATION_BYTES);

    if (pageSize !== undefined) validatePositiveBound(pageSize, 'pageSize', MAX_PAGINATION_LIMIT);
    if (startOffset !== undefined && !isNonNegativeInteger(startOffset)) {
        throw new TestRailValidationError('startOffset must be a non-negative safe integer');
    }
    validatePositiveBound(maxPages, 'maxPages');
    validatePositiveBound(maxItems, 'maxItems');
    validatePositiveBound(maxDurationMs, 'maxDurationMs', MAX_TIMEOUT_MS);
    validatePositiveBound(maxBytes, 'maxBytes', MAX_PAGINATION_BYTES);

    return { requestControls, pageSize, startOffset, maxPages, maxItems, maxDurationMs, maxBytes };
}

function serializedByteLength(items: readonly unknown[], stats: CollectionStats): number {
    try {
        return new globalThis.TextEncoder().encode(JSON.stringify(items)).byteLength;
    } catch {
        return invalidPage('Page items could not be serialized for aggregate byte accounting', stats);
    }
}

function appendPageItems<T>(target: T[], pageItems: readonly T[]): void {
    pageItems.forEach((item) => target.push(item));
}

function policyError(
    reason: PaginationErrorReason,
    message: string,
    stats: CollectionStats,
    context: Readonly<Record<string, string | number | boolean | null>> = {},
): never {
    throw new TestRailPaginationError(reason, message, stats.pagesFetched, stats.itemsFetched, context);
}

/**
 * Sequentially collects a complete list under explicit page, item, duration,
 * and UTF-8 serialized-byte bounds. No partial entities are returned or placed
 * on errors. A legacy bare array is necessarily treated as one terminal page.
 */
export async function collectAllPages<T>(options: CollectAllPagesOptions<T>): Promise<T[]> {
    const resolved = resolveCollectionOptions(options);
    const now = options.now ?? Date.now;
    const deadlineAt = now() + resolved.maxDurationMs;
    const items: T[] = [];
    let pagesFetched = 0;
    let itemsFetched = 0;
    let bytesFetched = 0;
    let nextOffset = resolved.startOffset;
    let nextLimit = resolved.pageSize;
    let expectedOffset = resolved.startOffset ?? 0;

    const collectNext = async (): Promise<T[]> => {
        const remainingTimeMs = Math.ceil(deadlineAt - now());
        const beforeStats = { pagesFetched, itemsFetched };
        if (remainingTimeMs <= 0) {
            return policyError('max_duration', 'Pagination aggregate exceeded maxDurationMs', beforeStats, {
                maxDurationMs: resolved.maxDurationMs,
            });
        }

        let page: Page<T>;
        try {
            page = await options.fetchPage({
                offset: nextOffset,
                limit: nextLimit,
                bypassCache: true,
                deadlineAt,
                remainingTimeMs,
            });
        } catch (error) {
            if (now() >= deadlineAt) {
                return policyError('max_duration', 'Pagination aggregate exceeded maxDurationMs', beforeStats, {
                    maxDurationMs: resolved.maxDurationMs,
                });
            }
            if (
                error instanceof TestRailPaginationError &&
                error.reason === 'invalid_page' &&
                (error.pagesFetched !== beforeStats.pagesFetched || error.itemsFetched !== beforeStats.itemsFetched)
            ) {
                const validationPrefix = 'TestRail Validation Error: ';
                // TestRailPaginationError always inherits this prefix from
                // TestRailValidationError; strip it before reconstructing the
                // same error with corrected progress counters.
                const message = error.message.slice(validationPrefix.length);
                throw new TestRailPaginationError(
                    'invalid_page',
                    message,
                    beforeStats.pagesFetched,
                    beforeStats.itemsFetched,
                );
            }
            throw error;
        }

        pagesFetched += 1;
        itemsFetched += page.items.length;
        const stats = { pagesFetched, itemsFetched };
        if (now() >= deadlineAt) {
            return policyError('max_duration', 'Pagination aggregate exceeded maxDurationMs', stats, {
                maxDurationMs: resolved.maxDurationMs,
            });
        }

        if (page.kind === 'envelope' && page.offset !== expectedOffset) {
            return invalidPage(
                `Pagination response offset ${page.offset} does not match expected offset ${expectedOffset}`,
                stats,
            );
        }

        if (itemsFetched > resolved.maxItems) {
            return policyError('max_items', 'Pagination aggregate exceeded maxItems', stats, {
                maxItems: resolved.maxItems,
            });
        }

        const pageBytes = serializedByteLength(page.items, stats);
        bytesFetched += pageBytes;
        if (now() >= deadlineAt) {
            return policyError('max_duration', 'Pagination aggregate exceeded maxDurationMs', stats, {
                maxDurationMs: resolved.maxDurationMs,
            });
        }
        if (bytesFetched > resolved.maxBytes) {
            return policyError('max_bytes', 'Pagination aggregate exceeded maxBytes', stats, {
                maxBytes: resolved.maxBytes,
                bytesFetched,
            });
        }

        const next = page.kind === 'envelope' ? page._links.next : null;
        if (next === null) {
            appendPageItems(items, page.items);
            if (now() >= deadlineAt) {
                return policyError('max_duration', 'Pagination aggregate exceeded maxDurationMs', stats, {
                    maxDurationMs: resolved.maxDurationMs,
                });
            }
            return items;
        }

        const continuation = parsePaginationContinuation(next, stats);
        if (page.kind === 'envelope' && continuation.offset <= page.offset) {
            return policyError('non_progress', 'Pagination continuation offset does not advance', stats, {
                offset: continuation.offset,
                currentOffset: page.offset,
            });
        }
        // Both offsets are non-negative safe integers and next > current here,
        // so subtraction stays safe even when addition at MAX_SAFE_INTEGER would not.
        if (page.kind === 'envelope' && continuation.offset - page.offset < page.items.length) {
            return policyError('non_progress', 'Pagination continuation overlaps the current page', stats, {
                offset: continuation.offset,
                currentOffset: page.offset,
                pageItems: page.items.length,
            });
        }
        if (pagesFetched >= resolved.maxPages) {
            return policyError('max_pages', 'Pagination continuation requires another page beyond maxPages', stats, {
                maxPages: resolved.maxPages,
            });
        }
        if (itemsFetched >= resolved.maxItems) {
            return policyError('max_items', 'Pagination continuation requires more items beyond maxItems', stats, {
                maxItems: resolved.maxItems,
            });
        }
        if (bytesFetched >= resolved.maxBytes) {
            return policyError('max_bytes', 'Pagination continuation requires more bytes beyond maxBytes', stats, {
                maxBytes: resolved.maxBytes,
                bytesFetched,
            });
        }

        appendPageItems(items, page.items);
        nextOffset = continuation.offset;
        expectedOffset = continuation.offset;
        nextLimit = resolved.requestControls ? resolved.pageSize : continuation.limit;
        return collectNext();
    };

    return collectNext();
}
