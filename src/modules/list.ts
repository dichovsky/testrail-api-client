import { z } from 'zod';

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
export const listOf = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([z.array(item), z.object({ [key]: z.array(item).nullable() })]);

/**
 * Normalizes either shape accepted by {@link listOf} to a plain array. A `null`
 * envelope key means an empty list (observed behavior, PR #130).
 *
 * Every branch is defensive: under advisory validation `raw` is whatever the
 * server sent when neither {@link listOf} branch matched, so without the
 * `Array.isArray` check a body of `{"cases": "oops"}` would return the string
 * typed as `Case[]` and the declared return would be a lie.
 */
export const unwrapList = <T>(key: string, raw: unknown): T[] => {
    if (Array.isArray(raw)) return raw as T[];
    if (typeof raw !== 'object' || raw === null) return [];
    const value = (raw as Record<string, unknown>)[key];
    return Array.isArray(value) ? (value as T[]) : [];
};

/**
 * {@link listOf} plus a third shape: an outer array wrapping one or more
 * pagination envelopes, `[{ offset, limit, size, _links, <key>: [...] }]`.
 *
 * Only `get_history_for_case` documents its response that way, and it stays a
 * separate helper rather than widening {@link listOf}: the extra branch is
 * unambiguous only when the item schema has required keys the envelope lacks.
 * `HistoryEntrySchema` requires `id`/`user_id`/`type_id`, so it is sound here —
 * recheck before reusing this on an all-optional item schema.
 */
export const listOfNested = <T extends z.ZodTypeAny>(key: string, item: T) =>
    z.union([
        z.array(item),
        z.object({ [key]: z.array(item).nullable() }),
        z.array(z.object({ [key]: z.array(item).nullable() })),
    ]);

/**
 * {@link unwrapList} for {@link listOfNested}. Checks the outer-array-of-envelope
 * shape before treating a top-level array as already normalized — otherwise the
 * envelope itself is returned as `raw[0]`, typed as an entity but carrying
 * pagination fields instead of the entity's own.
 */
export const unwrapNestedList = <T>(key: string, raw: unknown): T[] => {
    if (Array.isArray(raw)) {
        const pages: T[][] = [];
        let envelopeCount = 0;
        for (const value of raw as unknown[]) {
            if (
                typeof value !== 'object' ||
                value === null ||
                Array.isArray(value) ||
                !Object.prototype.hasOwnProperty.call(value, key)
            ) {
                continue;
            }

            envelopeCount += 1;
            const inner = (value as Record<string, unknown>)[key];
            if (inner === null) {
                pages.push([]);
            } else if (Array.isArray(inner)) {
                pages.push(inner as T[]);
            } else {
                // Advisory validation returns the raw value on a mismatch. Do
                // not let an envelope with a malformed list masquerade as T.
                return [];
            }
        }

        if (envelopeCount > 0) {
            // An array mixing entities and envelopes matches neither schema
            // branch. Returning it would expose each envelope as a fake T.
            if (envelopeCount !== raw.length) return [];
            return pages.flat();
        }
        return raw as T[];
    }
    return unwrapList<T>(key, raw);
};
