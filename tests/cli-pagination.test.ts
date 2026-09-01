import { describe, expect, it } from 'vitest';
import type { ActionSpec } from '../src/cli/metadata/types.js';
import {
    getCliPaginationMode,
    getPaginatedRequestOptions,
    getPaginationSafetyOptions,
    outputPaginated,
    validateCliPagination,
} from '../src/cli/pagination.js';

const paginatedAction = (requestControls: boolean): ActionSpec => ({
    resource: 'case',
    action: 'list',
    summary: 'test action',
    pathParams: [],
    apiEndpoint: 'GET get_cases/{project_id}',
    pagination: { response: 'envelope', requestControls, collectionKey: 'cases' },
    isWrite: false,
    handler: async () => undefined,
});

const unpaginatedAction = (): ActionSpec => ({
    resource: 'case',
    action: 'list',
    summary: 'test action',
    pathParams: [],
    apiEndpoint: 'GET get_cases/{project_id}',
    isWrite: false,
    handler: async () => undefined,
});

describe('CLI pagination modes', () => {
    it('selects legacy items, page, and all modes', () => {
        expect(getCliPaginationMode({})).toBe('items');
        expect(getCliPaginationMode({ page: true })).toBe('page');
        expect(getCliPaginationMode({ all: true })).toBe('all');
    });

    it('rejects mutually exclusive modes and unsupported actions', () => {
        expect(validateCliPagination(paginatedAction(true), { page: true, all: true })).toEqual({
            ok: false,
            error: '--page and --all are mutually exclusive.',
        });
        expect(validateCliPagination(undefined, { all: true })).toEqual({
            ok: false,
            error: '--all is not supported by this action.',
        });
        expect(validateCliPagination(unpaginatedAction(), { page: true })).toEqual({
            ok: false,
            error: '--page is not supported by case list.',
        });
    });

    it('rejects attached values on boolean mode flags', () => {
        expect(validateCliPagination(paginatedAction(true), { all: 'true' })).toEqual({
            ok: false,
            error: '--all does not accept a value.',
        });
        expect(validateCliPagination(paginatedAction(true), { page: 'false' })).toEqual({
            ok: false,
            error: '--page does not accept a value.',
        });
    });

    it('keeps legacy limit/offset compatible but rejects their ambiguous all-page meaning', () => {
        expect(validateCliPagination(undefined, { limit: '10', offset: '20' })).toEqual({
            ok: true,
            parsed: { mode: 'items', limit: 10, offset: 20 },
        });
        expect(validateCliPagination(undefined, { limit: '10x', offset: '-1' })).toEqual({
            ok: true,
            parsed: { mode: 'items' },
        });
        expect(validateCliPagination(undefined, { limit: '0' })).toEqual({
            ok: true,
            parsed: { mode: 'items', limit: 0 },
        });
        expect(validateCliPagination(paginatedAction(true), { all: true, limit: '10' })).toEqual({
            ok: false,
            error: '--all cannot be combined with --limit or --offset; use --page-size and --start-offset.',
        });
    });

    it('requires --all for aggregate bounds', () => {
        expect(validateCliPagination(paginatedAction(true), { maxPages: '2' })).toEqual({
            ok: false,
            error: '--max-pages is only valid together with --all.',
        });
    });

    it('rejects aggregate controls whose values are missing', () => {
        expect(validateCliPagination(paginatedAction(true), { all: true, maxPages: true })).toEqual({
            ok: false,
            error: '--max-pages requires a value.',
        });
        expect(validateCliPagination(paginatedAction(true), { all: true, pageSize: true })).toEqual({
            ok: false,
            error: '--page-size requires a value.',
        });
    });

    it('strictly validates legacy request controls in the new page mode', () => {
        const badLimit = validateCliPagination(paginatedAction(true), { page: true, limit: '01' });
        expect(badLimit.ok).toBe(false);
        if (!badLimit.ok) expect(badLimit.error).toContain('--limit must be a positive safe integer');

        const badOffset = validateCliPagination(paginatedAction(true), { page: true, offset: '-1' });
        expect(badOffset.ok).toBe(false);
        if (!badOffset.ok) expect(badOffset.error).toContain('--offset must be a non-negative safe integer');

        const emptyLimit = validateCliPagination(paginatedAction(true), { page: true, limit: '' });
        expect(emptyLimit).toEqual({
            ok: false,
            error: '--limit must be a positive safe integer (got: (empty))',
        });
    });

    it('rejects request controls for envelope-only endpoints', () => {
        expect(validateCliPagination(paginatedAction(false), { page: true, limit: '10' })).toEqual({
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        });
        expect(validateCliPagination(paginatedAction(false), { page: true, offset: '10' })).toEqual({
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        });
        expect(validateCliPagination(paginatedAction(false), { all: true, pageSize: '10' })).toEqual({
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        });
        expect(validateCliPagination(paginatedAction(false), { all: true, startOffset: '10' })).toEqual({
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        });
        expect(validateCliPagination(paginatedAction(false), { all: true, maxPages: '2' })).toEqual({
            ok: true,
            parsed: {
                mode: 'all',
                maxPages: 2,
            },
        });
    });

    it.each([
        [{ all: true, pageSize: '0' }, '--page-size must be a positive safe integer'],
        [{ all: true, startOffset: '-1' }, '--start-offset must be a non-negative safe integer'],
        [{ all: true, maxPages: '01' }, '--max-pages must be a positive safe integer'],
        [{ all: true, maxDurationMs: '300001' }, '--max-duration-ms must not exceed 300000'],
        [{ all: true, maxBytes: '1073741825' }, '--max-bytes must not exceed 1073741824'],
    ] as const)('rejects non-canonical or out-of-range numeric flags', (args, message) => {
        const result = validateCliPagination(paginatedAction(true), args);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain(message);
    });

    it('dispatches from the normalized pagination mode', async () => {
        let value: unknown;
        const ctx = {
            pagination: { mode: 'all' as const },
            out: (payload: unknown) => {
                value = payload;
            },
        };

        await outputPaginated(ctx, {
            items: () => Promise.resolve(['items']),
            page: () => Promise.resolve('page'),
            all: () => Promise.resolve(['all']),
        });

        expect(value).toEqual(['all']);
    });

    it('parses controlled and shared safety options without inventing defaults', () => {
        const args = {
            mode: 'all',
            pageSize: 25,
            startOffset: 0,
            maxPages: 4,
            maxItems: 90,
            maxDurationMs: 1000,
            maxBytes: 4096,
        } as const;
        expect(getPaginatedRequestOptions(args)).toEqual({
            pageSize: 25,
            startOffset: 0,
            maxPages: 4,
            maxItems: 90,
            maxDurationMs: 1000,
            maxBytes: 4096,
        });
        expect(getPaginationSafetyOptions(args)).toEqual({
            maxPages: 4,
            maxItems: 90,
            maxDurationMs: 1000,
            maxBytes: 4096,
        });
    });
});
