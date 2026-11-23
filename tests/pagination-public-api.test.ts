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
    type TestRailClient,
    type GetAllResultsForRunOptions,
    type GetAllResultsOptions,
    type GetAllUsersOptions,
    type GetResultsForRunOptions,
    type GetResultsOptions,
    type GetUsersOptions,
    type Page,
    type PaginatedRequestOptions,
    type PaginationSafetyOptions,
    type User,
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

    it('exports endpoint-specific result filter types', () => {
        expectTypeOf<'createdAfter' extends keyof GetResultsOptions ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'createdAfter' extends keyof GetResultsForRunOptions ? true : false>().toEqualTypeOf<true>();
        expectTypeOf<'defectsFilter' extends keyof GetResultsOptions ? true : false>().toEqualTypeOf<true>();
        expectTypeOf<'defectsFilter' extends keyof GetResultsForRunOptions ? true : false>().toEqualTypeOf<true>();
        expectTypeOf<'createdAfter' extends keyof GetAllResultsOptions ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'createdAfter' extends keyof GetAllResultsForRunOptions ? true : false>().toEqualTypeOf<true>();
    });

    it('exports global user options and preserves the project-only legacy overload', () => {
        expectTypeOf<GetUsersOptions>().toEqualTypeOf<{ limit?: number; offset?: number }>();
        expectTypeOf<GetAllUsersOptions>().toEqualTypeOf<PaginatedRequestOptions>();
        expectTypeOf<TestRailClient['users']['getUsers']>().toEqualTypeOf<{
            (projectId: undefined, options?: GetUsersOptions): Promise<User[]>;
            (projectId?: number): Promise<User[]>;
        }>();
        // TypeScript infers Parameters<> from the last overload; keep the 10.0.0 signature there.
        expectTypeOf<Parameters<TestRailClient['users']['getUsers']>>().toEqualTypeOf<
            Parameters<(projectId?: number) => Promise<User[]>>
        >();
        const forwardOptions = (users: TestRailClient['users'], options?: GetUsersOptions) =>
            users.getUsers(undefined, options);
        expectTypeOf(forwardOptions).returns.toEqualTypeOf<Promise<User[]>>();
        expectTypeOf<TestRailClient['users']['getUsersPage']>().toEqualTypeOf<
            (options?: GetUsersOptions) => Promise<Page<User>>
        >();
        expectTypeOf<TestRailClient['users']['getAllUsers']>().toEqualTypeOf<
            (options?: GetAllUsersOptions) => Promise<User[]>
        >();
        expectTypeOf<'projectId' extends keyof GetUsersOptions ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'projectId' extends keyof GetAllUsersOptions ? true : false>().toEqualTypeOf<false>();
    });
});
