import { MAX_PAGINATION_BYTES, MAX_PAGINATION_LIMIT, MAX_TIMEOUT_MS } from '../constants.js';
import type { PaginatedRequestOptions, PaginationSafetyOptions } from '../pagination.js';
import type { HandlerArgs, HandlerContext } from './handler-context.js';
import { optInt } from './ids.js';
import type { ActionSpec } from './metadata/types.js';

export type CliPaginationMode = 'items' | 'page' | 'all';

export interface CliPaginationOperations<T> {
    readonly items: () => Promise<T[]>;
    readonly page: () => Promise<unknown>;
    readonly all: () => Promise<T[]>;
}

export interface CliPaginationParsed {
    readonly mode: CliPaginationMode;
    readonly limit?: number;
    readonly offset?: number;
    readonly pageSize?: number;
    readonly startOffset?: number;
    readonly maxPages?: number;
    readonly maxItems?: number;
    readonly maxDurationMs?: number;
    readonly maxBytes?: number;
}

export type CliPaginationValidationResult =
    { readonly ok: true; readonly parsed: CliPaginationParsed } | { readonly ok: false; readonly error: string };

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

type ParsedPaginationAggregateProperty =
    'pageSize' | 'startOffset' | 'maxPages' | 'maxItems' | 'maxDurationMs' | 'maxBytes';

type ParsedPaginationArgs = Omit<CliPaginationParsed, 'mode'>;

type RawPaginationArgs = {
    readonly [Property in keyof PaginationArgs]?: unknown;
};

interface NumericFlag {
    readonly property: ParsedPaginationAggregateProperty;
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

function parseCanonicalInteger(raw: unknown, flag: string, allowZero: boolean, maximum?: number): number {
    if (typeof raw !== 'string') {
        throw new Error(`${flag} requires a value.`);
    }
    const pattern = allowZero ? /^(0|[1-9]\d*)$/ : /^[1-9]\d*$/;
    if (!pattern.test(raw)) {
        throw new Error(
            `${flag} must be ${
                allowZero ? 'a non-negative safe integer' : 'a positive safe integer'
            } (got: ${raw === '' ? '(empty)' : raw})`,
        );
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) throw new Error(`${flag} must be a safe integer (got: ${raw})`);
    if (maximum !== undefined && value > maximum) {
        throw new Error(`${flag} must not exceed ${maximum} (got: ${raw})`);
    }
    return value;
}

function parseOptional(args: RawPaginationArgs, definition: NumericFlag): number | undefined {
    const raw = args[definition.property];
    if (raw === undefined) return undefined;
    return parseCanonicalInteger(raw, definition.flag, definition.allowZero, definition.maximum);
}

/** Normalize validated argv pagination values for production dispatch and handler tests. */
export function parseCliPagination(args: RawPaginationArgs): CliPaginationParsed {
    const mode = getCliPaginationMode(args);
    const limit =
        mode === 'page'
            ? args.limit === undefined
                ? undefined
                : parseCanonicalInteger(args.limit, '--limit', false, MAX_PAGINATION_LIMIT)
            : mode === 'items' && typeof args.limit === 'string'
              ? optInt(args.limit)
              : undefined;
    const offset =
        mode === 'page'
            ? args.offset === undefined
                ? undefined
                : parseCanonicalInteger(args.offset, '--offset', true)
            : mode === 'items' && typeof args.offset === 'string'
              ? optInt(args.offset)
              : undefined;
    const aggregate = NUMERIC_FLAGS.reduce<ParsedPaginationArgs>((parsed, definition) => {
        const value = parseOptional(args, definition);
        return value === undefined ? parsed : { ...parsed, [definition.property]: value };
    }, {});
    return {
        ...aggregate,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        mode,
    };
}

/**
 * Validates pagination mode and flag compatibility before auth resolution or
 * client construction. Legacy no-mode `--limit` / `--offset` values keep the
 * established lenient `optInt` behavior; explicit page and aggregate controls
 * use strict canonical-integer validation.
 */
export function validateCliPagination(
    actionSpec: ActionSpec | undefined,
    args: RawPaginationArgs,
): CliPaginationValidationResult {
    for (const [property, flag] of [
        ['page', '--page'],
        ['all', '--all'],
    ] as const) {
        const value = args[property];
        if (value !== undefined && typeof value !== 'boolean') {
            return { ok: false, error: `${flag} does not accept a value.` };
        }
    }

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

    if (
        mode === 'items' &&
        actionSpec !== undefined &&
        actionSpec.pagination === undefined &&
        actionSpec.itemsRequestControls !== true &&
        (args.limit !== undefined || args.offset !== undefined)
    ) {
        return {
            ok: false,
            error: `--limit and --offset are not supported by ${actionSpec.resource} ${actionSpec.action}.`,
        };
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
        return { ok: true, parsed: parseCliPagination(args) };
    } catch (error) {
        // Every throw in this block originates in parseCanonicalInteger().
        return { ok: false, error: (error as Error).message };
    }
}

export function getCliPaginationMode(args: Pick<RawPaginationArgs, 'page' | 'all'>): CliPaginationMode {
    if (args.page === true) return 'page';
    if (args.all === true) return 'all';
    return 'items';
}

/** Execute exactly one CLI pagination projection and emit only its final value. */
export async function outputPaginated<T>(
    ctx: Pick<HandlerContext, 'pagination' | 'out'>,
    operations: CliPaginationOperations<T>,
): Promise<void> {
    const mode = ctx.pagination.mode;
    const value =
        mode === 'page' ? await operations.page() : mode === 'all' ? await operations.all() : await operations.items();
    ctx.out(value);
}

/** Parse the bounded controls common to controlled and envelope-only endpoints. */
export function getPaginationSafetyOptions(pagination: CliPaginationParsed): PaginationSafetyOptions {
    return {
        ...(pagination.maxPages !== undefined && { maxPages: pagination.maxPages }),
        ...(pagination.maxItems !== undefined && { maxItems: pagination.maxItems }),
        ...(pagination.maxDurationMs !== undefined && { maxDurationMs: pagination.maxDurationMs }),
        ...(pagination.maxBytes !== undefined && { maxBytes: pagination.maxBytes }),
    };
}

/** Parse all-page controls for endpoints that document request limit/offset. */
export function getPaginatedRequestOptions(pagination: CliPaginationParsed): PaginatedRequestOptions {
    return {
        ...(pagination.pageSize !== undefined && { pageSize: pagination.pageSize }),
        ...(pagination.startOffset !== undefined && { startOffset: pagination.startOffset }),
        ...getPaginationSafetyOptions(pagination),
    };
}
