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
 * The TestRail bulk GET endpoints have two response shapes. Since TestRail 6.7,
 * they return a paginated envelope (`{ offset, limit, size, _links, <key>: [...] }`).
 * Older servers return a bare top-level array. The documentation does not
 * reliably tell which shape an endpoint returns. For example:
 *
 * - `get_shared_step_history` has returned a bare array, although its
 *   documented shape is the envelope.
 * - `get_suites` has changed shape between versions.
 * - `get_users` documents a bare array, but its sibling endpoints document the
 *   envelope.
 *
 * This package declares no minimum server version.
 *
 * Acceptance of both shapes has no disadvantage, because the method contract
 * stays `Entity[]` for both. A schema that accepts only one shape causes a real
 * problem. Under advisory response validation (6.0.0), an envelope-only schema
 * that gets a bare array parses to the raw array, whose `.<key>` is
 * `undefined`. Thus, the `?? []` unwrap changes the mismatch into a
 * **successful call that reports zero rows**. On a list read, a silent empty
 * result is worse than the throw that it replaced. Thus, each list read pairs
 * {@link listOf} with {@link unwrapList}.
 *
 * Note for `onSchemaMismatch` consumers: this schema is a union. Thus, a
 * mismatch shows as a single top-level `invalid_union` issue, and its `message`
 * is the unhelpful `"Invalid input"`. The per-branch detail is one level lower,
 * in `issues[0].errors[<branch>]`. This detail includes the real offending
 * path, for example `['results', 0, 'status_id']`. Log the whole `issues` tree,
 * not only `issues[0].message`.
 *
 * The envelope key is `.nullable()`, not `.nullish()`. The key must be present,
 * but an explicit `null` still means an empty list (PR #130). With
 * `.nullish()`, the branch accepts **any** object, for example:
 *
 * - `{ error: … }`
 * - a single entity
 * - a renamed key
 * - a `key` typo against the paired {@link unwrapList}
 *
 * All of these objects parse *successfully* to `{}` and unwrap to `[]`, and the
 * client never calls the hook. That result is the silent zero-rows failure
 * above. Thus, the required key is the safety margin, not a detail.
 *
 * @param key  envelope property holding the array (e.g. `'results'`)
 * @param item schema for a single entity
 */
export const listOf = <T extends z.ZodTypeAny>(key: string, item: T) => z.union([z.array(item), envelopeOf(key, item)]);

/**
 * Returns a strict schema that keeps the pagination metadata. Explicit page
 * methods use this schema. A bare legacy array is a valid terminal page, but a
 * collection-only wrapper is not. A collection-only wrapper looks like a modern
 * envelope, but it does not have the metadata that the Page contract requires.
 * Because this schema is separate from {@link listOf}, the HTTP pipeline can
 * also use an independent validated cache namespace for Page reads.
 */
export const pageOf = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([z.array(item), paginatedEnvelopeOf(key, item)]);

/**
 * Normalizes either shape that {@link listOf} accepts to a plain array. A
 * `null` envelope key means an empty list (observed behavior, PR #130).
 *
 * Each branch is defensive. Under advisory validation, `raw` is the value that
 * the server sent when neither {@link listOf} branch matched. A malformed outer
 * shape throws. The function does not return a scalar typed as `T[]`, and it
 * does not return an empty list that the server did not send. A row-level
 * schema mismatch inside a real array stays advisory.
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
 * Returns the {@link listOf} schema with a third shape: an outer array that
 * contains exactly one pagination envelope,
 * `[{ offset, limit, size, _links, <key>: [...] }]`.
 *
 * Only `get_history_for_case` documents its response in this shape. This
 * helper stays separate, and {@link listOf} does not get the extra branch. The
 * extra branch is unambiguous only when the item schema has required keys that
 * the envelope does not have. `HistoryEntrySchema` requires
 * `id`/`user_id`/`type_id`, so the extra branch is safe here. Before you use
 * this helper with an all-optional item schema, make sure that the extra branch
 * is still unambiguous.
 */
export const listOfNested = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([z.array(item), envelopeOf(key, item), z.tuple([envelopeOf(key, item)])]);

/** Returns the strict nested counterpart of {@link pageOf}. */
export const pageOfNested = <T extends z.ZodTypeAny>(key: string, item: T) => {
    const envelope = paginatedEnvelopeOf(key, item);
    return z.union([z.array(item), envelope, z.tuple([envelope])]);
};

/**
 * Normalizes the shapes that {@link listOfNested} accepts, as {@link unwrapList}
 * does for {@link listOf}. Before the function treats a top-level array as
 * already normalized, it validates the outer-array-of-envelope shape. Mixed or
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
