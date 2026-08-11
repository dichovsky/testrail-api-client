import { z } from 'zod';
import { HTTP_OK_STATUS, MAX_PAGINATION_LIMIT } from '../constants.js';
import { TestRailApiError } from '../errors.js';

const pageLinksSchema = z.object({ next: z.string().nullable(), prev: z.string().nullable() }).passthrough();
const PAGINATION_METADATA_KEYS = ['offset', 'limit', 'size', '_links'] as const;
const MALFORMED_LIST_STATUS_TEXT = 'Unexpected list response structure';

function malformedListResponse(raw: unknown): TestRailApiError {
    return new TestRailApiError(HTTP_OK_STATUS, MALFORMED_LIST_STATUS_TEXT, raw);
}

function hasPaginationMetadataSignature(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        PAGINATION_METADATA_KEYS.filter((field) => Object.prototype.hasOwnProperty.call(value, field)).length >= 2
    );
}

const paginatedEnvelopeOf = <T extends z.ZodTypeAny>(key: string, item: T) => {
    const collection = { [key]: z.array(item).nullable() };
    return z
        .object({
            ...collection,
            offset: z.number().int().nonnegative(),
            limit: z.number().int().positive().max(MAX_PAGINATION_LIMIT),
            size: z.number().int().nonnegative(),
            _links: pageLinksSchema,
        })
        .passthrough()
        .superRefine((value, context) => {
            if (value.size > value.limit) {
                context.addIssue({
                    code: 'custom',
                    path: ['size'],
                    message: 'Pagination envelope size must not exceed its limit',
                });
            }
            const items = value[key];
            if (Array.isArray(items) && items.length > value.limit) {
                context.addIssue({
                    code: 'custom',
                    path: [key],
                    message: `Pagination envelope collection "${key}" must not exceed its limit`,
                });
            }
        });
};

const envelopeOf = <T extends z.ZodTypeAny>(key: string, item: T) => {
    const collection = { [key]: z.array(item).nullable() };
    const paginated = paginatedEnvelopeOf(key, item);
    const wrapperOnly = z
        .object(collection)
        .passthrough()
        .refine(
            (value) =>
                !['offset', 'limit', 'size', '_links'].some((field) =>
                    Object.prototype.hasOwnProperty.call(value, field),
                ),
            { message: 'Pagination metadata must be either complete or absent' },
        );
    return z.union([paginated, wrapperOnly]);
};

/**
 * TestRail's bulk GET endpoints are bimodal. Since 6.7 they return a paginated
 * envelope (`{ offset, limit, size, _links, <key>: [...] }`); older servers
 * return a bare top-level array, and the documentation is not a reliable guide
 * to which — `get_shared_step_history` has returned a bare array despite its
 * documented envelope, `get_suites` has changed shape between versions, and
 * `get_users` documents a bare array while its siblings document the envelope.
 * This package declares no minimum server version.
 *
 * Accepting both costs nothing: the method contract stays `Entity[]` either way.
 * Committing to one is not merely a lost opportunity — under advisory response
 * validation (6.0.0) an envelope-only schema meeting a bare array parses to the
 * raw array, whose `.<key>` is `undefined`, so the `?? []` unwrap turns the
 * mismatch into a **successful call reporting zero rows**. Silent emptiness on
 * a list read is worse than the throw it replaced, so every list read pairs
 * {@link listOf} with {@link unwrapList}.
 *
 * Note for `onSchemaMismatch` consumers: because this is a union, a mismatch
 * surfaces as a single top-level `invalid_union` issue whose `message` is the
 * unhelpful `"Invalid input"`. The per-branch detail — including the real
 * offending path, e.g. `['results', 0, 'status_id']` — lives one level down in
 * `issues[0].errors[<branch>]`. Log the whole `issues` tree, not just
 * `issues[0].message`.
 *
 * The envelope key is `.nullable()`, not `.nullish()`: the key must be present,
 * though an explicit `null` still means an empty list (PR #130). With
 * `.nullish()` the branch accepts **any** object — `{ error: … }`, a single
 * entity, a drifted key, or a `key` typo against the paired {@link unwrapList} —
 * all parsing *successfully* to `{}` and unwrapping to `[]` without reaching the
 * hook. That is the silent zero-rows failure above, so requiring the key is the
 * safety margin, not a detail.
 *
 * @param key  envelope property holding the array (e.g. `'results'`)
 * @param item schema for a single entity
 */
export const listOf = <T extends z.ZodTypeAny>(key: string, item: T) => z.union([z.array(item), envelopeOf(key, item)]);

/**
 * Strict metadata-preserving schema used by explicit page methods. A bare
 * legacy array is a valid terminal page, but a collection-only wrapper is not:
 * it looks like a modern envelope while omitting the metadata the Page
 * contract promises. Keeping this separate from {@link listOf} also lets the
 * HTTP pipeline use an independent validated cache namespace for Page reads.
 */
export const pageOf = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([z.array(item), paginatedEnvelopeOf(key, item)]);

/**
 * Normalizes either shape accepted by {@link listOf} to a plain array. A `null`
 * envelope key means an empty list (observed behavior, PR #130).
 *
 * Every branch is defensive: under advisory validation `raw` is whatever the
 * server sent when neither {@link listOf} branch matched. A malformed outer
 * shape throws rather than returning a scalar typed as `T[]` or fabricating an
 * empty list; row-level schema drift inside a real array remains advisory.
 */
export const unwrapList = <T>(key: string, raw: unknown): T[] => {
    if (Array.isArray(raw)) return raw as T[];
    if (typeof raw !== 'object' || raw === null) {
        throw malformedListResponse(raw);
    }
    const value = (raw as Record<string, unknown>)[key];
    if (value === null) return [];
    if (Array.isArray(value)) return value as T[];
    throw malformedListResponse(raw);
};

/**
 * {@link listOf} plus a third shape: an outer array wrapping exactly one
 * pagination envelope, `[{ offset, limit, size, _links, <key>: [...] }]`.
 *
 * Only `get_history_for_case` documents its response that way, and it stays a
 * separate helper rather than widening {@link listOf}: the extra branch is
 * unambiguous only when the item schema has required keys the envelope lacks.
 * `HistoryEntrySchema` requires `id`/`user_id`/`type_id`, so it is sound here —
 * recheck before reusing this on an all-optional item schema.
 */
export const listOfNested = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([z.array(item), envelopeOf(key, item), z.tuple([envelopeOf(key, item)])]);

/** Strict nested counterpart to {@link pageOf}. */
export const pageOfNested = <T extends z.ZodTypeAny>(key: string, item: T) => {
    const envelope = paginatedEnvelopeOf(key, item);
    return z.union([z.array(item), envelope, z.tuple([envelope])]);
};

/**
 * {@link unwrapList} for {@link listOfNested}. Checks the outer-array-of-envelope
 * shape before treating a top-level array as already normalized. Mixed or
 * multiple wrappers are ambiguous and fail closed.
 */
export const unwrapNestedList = <T>(key: string, raw: unknown): T[] => {
    if (Array.isArray(raw)) {
        const envelopes = raw.filter(
            (value) =>
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value) &&
                Object.prototype.hasOwnProperty.call(value, key),
        );
        if (envelopes.length === 0) {
            if (raw.some(hasPaginationMetadataSignature)) {
                throw malformedListResponse(raw);
            }
            return raw as T[];
        }
        if (raw.length !== 1 || envelopes.length !== 1) {
            throw malformedListResponse(raw);
        }
        return unwrapList<T>(key, envelopes[0]);
    }
    return unwrapList<T>(key, raw);
};
