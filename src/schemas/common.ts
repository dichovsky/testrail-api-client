import { z } from 'zod';
import type { SchemaMismatch } from '../types.js';

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

export const PaginationSchema = zObject({
    limit: z.number().optional(),
    offset: z.number().optional(),
});

export const TestRailConfigSchema = zObject({
    baseUrl: z.string().url(),
    email: z.string().email(),
    apiKey: z.string().min(1),
    timeout: z.number().optional(),
    maxRetries: z.number().int().nonnegative().optional(),
    enableCache: z.boolean().optional(),
    cacheTtl: z.number().int().positive().optional(),
    cacheCleanupInterval: z.number().int().positive().optional(),
    maxCacheSize: z.number().int().positive().optional(),
    rateLimiter: zObject({
        maxRequests: z.number().int().positive(),
        windowMs: z.number().int().positive(),
    }).optional(),
    allowInsecure: z.boolean().optional(),
    allowPrivateHosts: z.boolean().optional(),
    onSchemaMismatch: z
        .custom<(mismatch: SchemaMismatch) => void>((value) => typeof value === 'function', {
            message: 'Expected function',
        })
        .optional(),
});
