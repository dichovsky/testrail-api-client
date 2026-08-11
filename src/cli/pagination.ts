import { MAX_PAGINATION_BYTES, MAX_PAGINATION_LIMIT, MAX_TIMEOUT_MS } from '../constants.js';
import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';
import type { HandlerArgs, HandlerContext } from './handler-context.js';
import type { ActionSpec } from './metadata/types.js';

export type CliPaginationMode = 'items' | 'page' | 'all';

export interface CliPaginationOperations<T> {
    readonly items: () => Promise<T[]>;
    readonly page: () => Promise<unknown>;
    readonly all: () => Promise<T[]>;
}

export type CliPaginationValidationResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

type PaginationArgs = Pick<
    HandlerArgs,
    | 'page'
    | 'all'
    | 'limit'
    | 'offset'
    | 'pageSize'
    | 'startOffset'
    | 'maxPages'
    | 'maxItems'
    | 'maxDurationMs'
    | 'maxBytes'
>;

interface NumericFlag {
    readonly property: keyof PaginationArgs;
    readonly flag: string;
    readonly allowZero: boolean;
    readonly maximum?: number;
}

const PAGE_SIZE_FLAG = {
    property: 'pageSize',
    flag: '--page-size',
    allowZero: false,
    maximum: MAX_PAGINATION_LIMIT,
} satisfies NumericFlag;
const START_OFFSET_FLAG = {
    property: 'startOffset',
    flag: '--start-offset',
    allowZero: true,
} satisfies NumericFlag;
const MAX_PAGES_FLAG = { property: 'maxPages', flag: '--max-pages', allowZero: false } satisfies NumericFlag;
const MAX_ITEMS_FLAG = { property: 'maxItems', flag: '--max-items', allowZero: false } satisfies NumericFlag;
const MAX_DURATION_FLAG = {
    property: 'maxDurationMs',
    flag: '--max-duration-ms',
    allowZero: false,
    maximum: MAX_TIMEOUT_MS,
} satisfies NumericFlag;
const MAX_BYTES_FLAG = {
    property: 'maxBytes',
    flag: '--max-bytes',
    allowZero: false,
    maximum: MAX_PAGINATION_BYTES,
} satisfies NumericFlag;

const NUMERIC_FLAGS: readonly NumericFlag[] = [
    PAGE_SIZE_FLAG,
    START_OFFSET_FLAG,
    MAX_PAGES_FLAG,
    MAX_ITEMS_FLAG,
    MAX_DURATION_FLAG,
    MAX_BYTES_FLAG,
];

function parseCanonicalInteger(raw: string, flag: string, allowZero: boolean, maximum?: number): number {
    const pattern = allowZero ? /^(0|[1-9]\d*)$/ : /^[1-9]\d*$/;
    const value = pattern.test(raw) ? Number(raw) : Number.NaN;
    const range = allowZero ? 'a non-negative safe integer' : 'a positive safe integer';
    if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
        throw new Error(`${flag} must be ${range} (got: ${raw === '' ? '(empty)' : raw})`);
    }
    if (maximum !== undefined && value > maximum) {
        throw new Error(`${flag} must not exceed ${maximum} (got: ${raw})`);
    }
    return value;
}

function parseOptional(args: PaginationArgs, definition: NumericFlag): number | undefined {
    const raw = args[definition.property];
    if (typeof raw !== 'string') return undefined;
    return parseCanonicalInteger(raw, definition.flag, definition.allowZero, definition.maximum);
}

/**
 * Validates pagination mode and flag compatibility before auth resolution or
 * client construction. Existing no-mode `--limit` / `--offset` behavior is
 * intentionally left to each legacy handler for backward compatibility.
 */
export function validateCliPagination(
    actionSpec: ActionSpec | undefined,
    args: PaginationArgs,
): CliPaginationValidationResult {
    if (args.page === true && args.all === true) {
        return { ok: false, error: '--page and --all are mutually exclusive.' };
    }

    const mode = getCliPaginationMode(args);
    const aggregateDefinition = NUMERIC_FLAGS.find(({ property }) => args[property] !== undefined);
    if (aggregateDefinition !== undefined && mode !== 'all') {
        return {
            ok: false,
            error: `${aggregateDefinition.flag} is only valid together with --all.`,
        };
    }

    if (mode !== 'items' && actionSpec?.pagination === undefined) {
        const command = actionSpec === undefined ? 'this action' : `${actionSpec.resource} ${actionSpec.action}`;
        return { ok: false, error: `${mode === 'page' ? '--page' : '--all'} is not supported by ${command}.` };
    }

    if (mode === 'all' && (args.limit !== undefined || args.offset !== undefined)) {
        return {
            ok: false,
            error: '--all cannot be combined with --limit or --offset; use --page-size and --start-offset.',
        };
    }

    if (
        actionSpec?.pagination?.requestControls === false &&
        ((mode === 'page' && (args.limit !== undefined || args.offset !== undefined)) ||
            (mode === 'all' && (args.pageSize !== undefined || args.startOffset !== undefined)))
    ) {
        return {
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        };
    }

    try {
        if (mode === 'page') {
            if (args.limit !== undefined) {
                parseCanonicalInteger(args.limit, '--limit', false, MAX_PAGINATION_LIMIT);
            }
            if (args.offset !== undefined) parseCanonicalInteger(args.offset, '--offset', true);
        }
        for (const definition of NUMERIC_FLAGS) parseOptional(args, definition);
    } catch (error) {
        // Every throw in this block originates in parseCanonicalInteger().
        return { ok: false, error: (error as Error).message };
    }

    return { ok: true };
}

export function getCliPaginationMode(args: Pick<PaginationArgs, 'page' | 'all'>): CliPaginationMode {
    if (args.page === true) return 'page';
    if (args.all === true) return 'all';
    return 'items';
}

/** Execute exactly one CLI pagination projection and emit only its final value. */
export async function outputPaginated<T>(
    ctx: Pick<HandlerContext, 'args' | 'out'>,
    operations: CliPaginationOperations<T>,
): Promise<void> {
    const mode = getCliPaginationMode(ctx.args);
    const value =
        mode === 'page' ? await operations.page() : mode === 'all' ? await operations.all() : await operations.items();
    ctx.out(value);
}

/** Parse the bounded controls common to controlled and envelope-only endpoints. */
export function getPaginationSafetyOptions(args: PaginationArgs): PaginationSafetyOptions {
    const maxPages = parseOptional(args, MAX_PAGES_FLAG);
    const maxItems = parseOptional(args, MAX_ITEMS_FLAG);
    const maxDurationMs = parseOptional(args, MAX_DURATION_FLAG);
    const maxBytes = parseOptional(args, MAX_BYTES_FLAG);
    return {
        ...(maxPages !== undefined && { maxPages }),
        ...(maxItems !== undefined && { maxItems }),
        ...(maxDurationMs !== undefined && { maxDurationMs }),
        ...(maxBytes !== undefined && { maxBytes }),
    };
}

/** Parse all-page controls for endpoints that document request limit/offset. */
export function getPaginatedRequestOptions(args: PaginationArgs): PaginatedRequestOptions {
    const pageSize = parseOptional(args, PAGE_SIZE_FLAG);
    const startOffset = parseOptional(args, START_OFFSET_FLAG);
    return {
        ...(pageSize !== undefined && { pageSize }),
        ...(startOffset !== undefined && { startOffset }),
        ...getPaginationSafetyOptions(args),
    };
}
