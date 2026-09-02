import { z } from 'zod';
import {
    MAX_NODE_TIMER_DELAY_MS,
    MAX_PAGINATION_LIMIT,
    MAX_RESPONSE_BYTES_LIMIT,
    MAX_RETRIES,
    MAX_TIMEOUT_MS,
    TESTRAIL_CONFIG_EMAIL_PATTERN,
} from '../constants.js';
import type { TestRailConfig } from '../types.js';

export const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();

type ShallowKnownObject<TShape extends z.ZodRawShape> = z.output<z.ZodObject<TShape>>;

type OptionalObjectKeys<TShape extends z.ZodRawShape> = {
    [TKey in keyof ShallowKnownObject<TShape>]-?: object extends Pick<ShallowKnownObject<TShape>, TKey> ? TKey : never;
}[keyof ShallowKnownObject<TShape>];

type KnownObject<TShape extends z.ZodRawShape> = {
    [TKey in Exclude<keyof TShape, OptionalObjectKeys<TShape>>]: KnownResponseValue<TShape[TKey]>;
} & {
    [TKey in Extract<keyof TShape, OptionalObjectKeys<TShape>>]?: KnownResponseValue<TShape[TKey]>;
};

type KnownRecord<TOutput, TValue extends z.core.SomeType> = {
    [TKey in keyof TOutput]: KnownResponseValue<TValue>;
};

/** Recursively projects declared schema structure while leaving records open. */
type KnownResponseValue<TSchema extends z.core.SomeType> =
    TSchema extends z.ZodOptional<infer TInner>
        ? KnownResponseValue<TInner> | undefined
        : TSchema extends z.ZodNullable<infer TInner>
          ? KnownResponseValue<TInner> | null
          : TSchema extends z.ZodArray<infer TElement>
            ? KnownResponseValue<TElement>[]
            : TSchema extends z.ZodUnion<infer TOptions>
              ? KnownResponseValue<TOptions[number]>
              : TSchema extends z.ZodRecord<z.core.$ZodRecordKey, infer TValue>
                ? KnownRecord<z.output<TSchema>, TValue>
                : TSchema extends z.ZodObject<infer TShape>
                  ? KnownObject<TShape>
                  : z.output<TSchema>;

/**
 * Infer only the keys declared throughout a response schema. Runtime response
 * objects remain passthrough at every level, but public types do not advertise
 * unrestricted string indexes unless a field deliberately uses `z.record()`.
 * Optional object keys, arrays, unions, and nullability retain their schema
 * output semantics.
 */
export type KnownResponse<TSchema extends z.ZodObject> = KnownObject<TSchema['shape']>;

/**
 * Core schemas for common TestRail API structures.
 * These are used to validate API responses and provide static type inference via `z.infer`.
 */

// ── Common & Foundational Schemas ─────────────────────────────────────────────

/**
 * Caller-supplied controls for one TestRail list request.
 *
 * This is an input schema, not a response-envelope schema. It mirrors
 * `validatePaginationParams`: TestRail accepts a page size in `[1, 250]` and
 * a non-negative starting offset.
 */
export const PaginationRequestSchema = zObject({
    limit: z.number().int().positive().max(MAX_PAGINATION_LIMIT).optional(),
    offset: z.number().int().nonnegative().optional(),
});

/**
 * Legacy permissive pagination schema retained for runtime compatibility.
 * New request-boundary code should use {@link PaginationRequestSchema}, which
 * enforces the same integer/range contract as the client methods.
 * @deprecated Use {@link PaginationRequestSchema} for request validation.
 */
export const PaginationSchema = zObject({
    limit: z.number().optional(),
    offset: z.number().optional(),
});

/**
 * Runtime structural and numeric contract for {@link TestRailConfig}.
 *
 * URL security semantics (HTTPS opt-out, embedded credentials, and private
 * hosts) are deliberately handled by `validateTestRailConfig`, where they can
 * retain the client's stable `TestRailValidationError` messages. Unknown keys
 * remain passthrough for forward compatibility, matching the other public
 * input schemas.
 */
type TestRailConfigSchemaShape = {
    [TKey in keyof TestRailConfig]-?: z.ZodType<TestRailConfig[TKey]>;
};

const testRailConfigShape = {
    baseUrl: z.string().url(),
    email: z.string().regex(TESTRAIL_CONFIG_EMAIL_PATTERN),
    apiKey: z.string().min(1),
    timeout: z.number().positive().max(MAX_TIMEOUT_MS).optional(),
    maxRetries: z.number().int().nonnegative().max(MAX_RETRIES).optional(),
    enableCache: z.boolean().optional(),
    cacheTtl: z.number().int().positive().optional(),
    cacheCleanupInterval: z.number().int().nonnegative().max(MAX_NODE_TIMER_DELAY_MS).optional(),
    maxCacheSize: z.number().int().nonnegative().optional(),
    rateLimiter: zObject({
        maxRequests: z.number().int().positive(),
        windowMs: z.number().int().positive(),
    }).optional(),
    allowInsecure: z.boolean().optional(),
    allowPrivateHosts: z.boolean().optional(),
    maxJsonResponseBytes: z.number().int().positive().max(MAX_RESPONSE_BYTES_LIMIT).optional(),
    maxBinaryResponseBytes: z.number().int().positive().max(MAX_RESPONSE_BYTES_LIMIT).optional(),
    bodyTimeout: z.number().int().nonnegative().max(MAX_TIMEOUT_MS).optional(),
    registerProcessHandlers: z.boolean().optional(),
    fetch: z
        .custom<NonNullable<TestRailConfig['fetch']>>((value) => typeof value === 'function', {
            message: 'Expected function',
        })
        .optional(),
    dnsLookup: z
        .custom<NonNullable<TestRailConfig['dnsLookup']>>((value) => typeof value === 'function', {
            message: 'Expected function',
        })
        .optional(),
    onSchemaMismatch: z
        .custom<NonNullable<TestRailConfig['onSchemaMismatch']>>((value) => typeof value === 'function', {
            message: 'Expected function',
        })
        .optional(),
} satisfies TestRailConfigSchemaShape;

export const TestRailConfigSchema = zObject(testRailConfigShape);
