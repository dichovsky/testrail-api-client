import { describe, expect, expectTypeOf, it } from 'vitest';
import {
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGES,
    DEFAULT_MAX_PAGINATION_BYTES,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
    TestRailPaginationError,
    type Page,
    type PaginatedRequestOptions,
    type PaginationSafetyOptions,
} from '../src/index.js';
import { TestRailPaginationError as ClientPaginationError } from '../src/client.js';

describe('pagination public exports', () => {
    it('exports the error and documented default/hard bounds from the package root', () => {
        expect(ClientPaginationError).toBe(TestRailPaginationError);
        expect({
            DEFAULT_PAGE_SIZE,
            DEFAULT_MAX_PAGES,
            DEFAULT_MAX_ITEMS,
            DEFAULT_MAX_PAGINATION_DURATION_MS,
            DEFAULT_MAX_PAGINATION_BYTES,
            MAX_PAGINATION_BYTES,
            MAX_PAGINATION_LIMIT,
        }).toEqual({
            DEFAULT_PAGE_SIZE: 250,
            DEFAULT_MAX_PAGES: 100,
            DEFAULT_MAX_ITEMS: 25_000,
            DEFAULT_MAX_PAGINATION_DURATION_MS: 300_000,
            DEFAULT_MAX_PAGINATION_BYTES: 100 * 1024 * 1024,
            MAX_PAGINATION_BYTES: 1024 * 1024 * 1024,
            MAX_PAGINATION_LIMIT: 250,
        });
    });

    it('exports page and option types without broadening the page discriminator', () => {
        expectTypeOf<Page<{ id: number }>>().toMatchTypeOf<
            { kind: 'envelope'; items: { id: number }[] } | { kind: 'legacy-array'; items: { id: number }[] }
        >();
        expectTypeOf<PaginatedRequestOptions>().toMatchTypeOf<PaginationSafetyOptions>();
    });
});
