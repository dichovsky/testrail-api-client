import { z } from 'zod';
import type { TestRailClientCore } from '../client-core.js';
import {
    collectAllPages,
    decodeNestedPage,
    decodePage,
    type Page,
    type PaginationRequest,
    type PaginationSafetyOptions,
} from '../pagination.js';
import { buildEndpoint } from '../url.js';
import { validatePaginationParams } from '../validation.js';
import { listOf, listOfNested, pageOf, pageOfNested, unwrapList, unwrapNestedList } from './list.js';
import { snapshotPaginatedRequestOptions, snapshotPaginationSafetyOptions } from './pagination-options.js';

type QueryPrimitive = string | number;

/** Values accepted by TestRail's query-string builder after domain validation. */
export type PaginatedQueryValue = QueryPrimitive | readonly QueryPrimitive[] | undefined;

interface DirectPaginationOptions {
    readonly limit?: number;
    readonly offset?: number;
}

interface DirectPaginationValues {
    readonly limit: number | undefined;
    readonly offset: number | undefined;
}

type EndpointOptions<Options extends DirectPaginationOptions> = Omit<Options, keyof DirectPaginationOptions>;

export type PaginatedOperationDeclaration =
    | string
    | {
          readonly operation: string;
          /** Keep legacy list reads on the executor without claiming a documented pagination registration. */
          readonly registered: false;
      };

/**
 * An endpoint request after domain IDs, aliases, and filters have been
 * validated and normalized. The executor constructs the path from the
 * declared operation and validated numeric parameters, so registration and
 * transport cannot silently name different operations.
 */
export interface PreparedPaginatedRequest {
    readonly operation: string;
    readonly pathParameters?: readonly number[];
    readonly query?: Readonly<Record<string, PaginatedQueryValue>>;
}

export interface PaginationRegistration {
    readonly operation: string;
    readonly response: 'envelope' | 'nested-envelope';
    readonly requestControls: boolean;
    readonly collectionKey: string;
}

interface PaginatedListDescriptor<Args, ReadOptions extends DirectPaginationOptions, Item> {
    readonly operations: readonly [PaginatedOperationDeclaration, ...PaginatedOperationDeclaration[]];
    readonly collectionKey: string;
    readonly itemSchema: z.ZodType<Item>;
    readonly response: 'envelope' | 'nested-envelope';
    readonly requestControls: boolean;
    /**
     * Domain adapter: synchronously snapshots endpoint filters, validates IDs,
     * and selects one declared operation. Pagination controls are absent from
     * the type and remain exclusively owned by the executor.
     */
    readonly prepare: (args: Args, options: EndpointOptions<ReadOptions> | undefined) => PreparedPaginatedRequest;
}

export interface PaginatedListExecutor<
    Args,
    ReadOptions extends DirectPaginationOptions,
    AllOptions extends ReadOptions & PaginationSafetyOptions,
    Item,
> {
    readonly registrations: readonly PaginationRegistration[];
    items(client: TestRailClientCore, args: Args, options?: ReadOptions): Promise<Item[]>;
    page(client: TestRailClientCore, args: Args, options?: ReadOptions): Promise<Page<Item>>;
    all(client: TestRailClientCore, args: Args, options?: AllOptions): Promise<Item[]>;
}

type PaginationTransport = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs' | 'deadlineAt'>> & {
    readonly pageProjection?: boolean;
};

function isQueryArray(value: PaginatedQueryValue): value is readonly QueryPrimitive[] {
    return Array.isArray(value);
}

interface ResolvedPaginatedOperation {
    readonly operation: string;
    readonly registered: boolean;
}

function resolveOperation(declaration: PaginatedOperationDeclaration): ResolvedPaginatedOperation {
    return typeof declaration === 'string'
        ? { operation: declaration, registered: true }
        : { operation: declaration.operation, registered: false };
}

function endpointOptions<Options extends DirectPaginationOptions>(
    options: Options | undefined,
): EndpointOptions<Options> | undefined {
    // This is deliberately a zero-work type projection. Enumerating or
    // spreading here would read unknown getters and direct limit/offset fields
    // on aggregate option objects before the executor can isolate them.
    return options;
}

function snapshotPreparedRequest(
    request: PreparedPaginatedRequest,
    allowedOperations: ReadonlySet<string>,
): PreparedPaginatedRequest {
    if (!allowedOperations.has(request.operation)) {
        throw new Error(`Pagination descriptor selected undeclared operation "${request.operation}"`);
    }
    const query = Object.fromEntries(
        Object.entries(request.query ?? {}).map(([key, value]) => [key, isQueryArray(value) ? [...value] : value]),
    ) as Readonly<Record<string, PaginatedQueryValue>>;
    return Object.freeze({
        operation: request.operation,
        pathParameters: Object.freeze([...(request.pathParameters ?? [])]),
        query: Object.freeze(query),
    });
}

function buildOperationPath(request: PreparedPaginatedRequest): string {
    return [request.operation, ...(request.pathParameters ?? []).map(String)].join('/');
}

/**
 * Builds one deep pagination executor. Domain modules retain endpoint-specific
 * validation and query normalization in `prepare`; this module owns every
 * list/page/all transport invariant shared by the adapters.
 */
export function createPaginatedListExecutor<
    Args,
    ReadOptions extends DirectPaginationOptions,
    AllOptions extends ReadOptions & PaginationSafetyOptions,
    Item,
>(
    descriptor: PaginatedListDescriptor<Args, ReadOptions, Item>,
): PaginatedListExecutor<Args, ReadOptions, AllOptions, Item> {
    const listSchema =
        descriptor.response === 'nested-envelope'
            ? listOfNested(descriptor.collectionKey, descriptor.itemSchema)
            : listOf(descriptor.collectionKey, descriptor.itemSchema);
    const pageSchema =
        descriptor.response === 'nested-envelope'
            ? pageOfNested(descriptor.collectionKey, descriptor.itemSchema)
            : pageOf(descriptor.collectionKey, descriptor.itemSchema);
    const operations = descriptor.operations.map(resolveOperation);
    const allowedOperations = new Set(operations.map(({ operation }) => operation));
    const registrations = Object.freeze(
        operations
            .filter(({ registered }) => registered)
            .map(({ operation }) =>
                Object.freeze({
                    operation,
                    response: descriptor.response,
                    requestControls: descriptor.requestControls,
                    collectionKey: descriptor.collectionKey,
                }),
            ),
    );

    const unwrap = (raw: unknown): Item[] =>
        descriptor.response === 'nested-envelope'
            ? unwrapNestedList<Item>(descriptor.collectionKey, raw)
            : unwrapList<Item>(descriptor.collectionKey, raw);
    const decode = (raw: unknown): Page<Item> =>
        descriptor.response === 'nested-envelope'
            ? decodeNestedPage<Item>(descriptor.collectionKey, raw)
            : decodePage<Item>(descriptor.collectionKey, raw);

    const request = async (
        client: TestRailClientCore,
        prepared: PreparedPaginatedRequest,
        controls: DirectPaginationValues,
        transport?: PaginationTransport,
    ): Promise<unknown> => {
        validatePaginationParams(controls.limit, controls.offset);
        const endpoint = buildEndpoint(buildOperationPath(prepared), {
            ...prepared.query,
            limit: controls.limit,
            offset: controls.offset,
        });
        const pageProjection = transport?.pageProjection === true || transport?.bypassCache === true;
        return client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageSchema : listSchema,
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(transport?.bypassCache !== undefined && { bypassCache: transport.bypassCache }),
            ...(transport?.remainingTimeMs !== undefined && { remainingTimeMs: transport.remainingTimeMs }),
            ...(transport?.deadlineAt !== undefined && { deadlineAt: transport.deadlineAt }),
        });
    };

    return Object.freeze({
        registrations,
        async items(client: TestRailClientCore, args: Args, options?: ReadOptions): Promise<Item[]> {
            const prepared = snapshotPreparedRequest(
                descriptor.prepare(args, endpointOptions(options)),
                allowedOperations,
            );
            return unwrap(await request(client, prepared, { limit: options?.limit, offset: options?.offset }));
        },
        async page(client: TestRailClientCore, args: Args, options?: ReadOptions): Promise<Page<Item>> {
            const prepared = snapshotPreparedRequest(
                descriptor.prepare(args, endpointOptions(options)),
                allowedOperations,
            );
            return decode(
                await request(
                    client,
                    prepared,
                    { limit: options?.limit, offset: options?.offset },
                    { pageProjection: true },
                ),
            );
        },
        all(client: TestRailClientCore, args: Args, options?: AllOptions): Promise<Item[]> {
            const prepared = snapshotPreparedRequest(
                descriptor.prepare(args, endpointOptions<ReadOptions>(options)),
                allowedOperations,
            );
            const fetchPage = async ({
                offset,
                limit,
                bypassCache,
                remainingTimeMs,
                deadlineAt,
            }: PaginationRequest): Promise<Page<Item>> => {
                const raw = await request(
                    client,
                    prepared,
                    { limit, offset },
                    { bypassCache, remainingTimeMs, deadlineAt },
                );
                return decode(raw);
            };

            if (descriptor.requestControls) {
                return collectAllPages<Item>({
                    ...snapshotPaginatedRequestOptions(options),
                    requestControls: true,
                    fetchPage,
                });
            }
            return collectAllPages<Item>({
                ...snapshotPaginationSafetyOptions(options),
                requestControls: false,
                fetchPage,
            });
        },
    });
}
