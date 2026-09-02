import { describe, expect, it } from 'vitest';
import {
    MAX_NODE_TIMER_DELAY_MS,
    MAX_PAGINATION_LIMIT,
    MAX_RESPONSE_BYTES_LIMIT,
    MAX_TIMEOUT_MS,
} from '../src/constants.js';
import { validateTestRailConfig } from '../src/config-validation.js';
import { TestRailValidationError } from '../src/errors.js';
import { PaginationRequestSchema as PublicPaginationRequestSchema, TestRailClient } from '../src/index.js';
import { PaginationRequestSchema, PaginationSchema, TestRailConfigSchema } from '../src/schemas/common.js';
import type { TestRailConfig } from '../src/types.js';

const REQUIRED_CONFIG = {
    baseUrl: 'https://example.com',
    email: 'agent@example.com',
    apiKey: 'test-key',
} as const;

describe('TestRailConfig validation authority', () => {
    it('contains every TestRailConfig field (compile-time shape parity is enforced in common.ts)', () => {
        expect(Object.keys(TestRailConfigSchema.shape).sort()).toEqual(
            [
                'allowInsecure',
                'allowPrivateHosts',
                'apiKey',
                'baseUrl',
                'bodyTimeout',
                'cacheCleanupInterval',
                'cacheTtl',
                'dnsLookup',
                'email',
                'enableCache',
                'fetch',
                'maxBinaryResponseBytes',
                'maxCacheSize',
                'maxJsonResponseBytes',
                'maxRetries',
                'onSchemaMismatch',
                'rateLimiter',
                'registerProcessHandlers',
                'timeout',
            ].sort(),
        );
    });

    it('accepts the complete configuration contract and preserves callback identities', () => {
        const fetchOverride: typeof globalThis.fetch = async () => new Response('{}');
        const dnsLookup: NonNullable<TestRailConfig['dnsLookup']> = async () => [
            { address: '203.0.113.10', family: 4 },
        ];
        const onSchemaMismatch: NonNullable<TestRailConfig['onSchemaMismatch']> = () => undefined;
        const config: TestRailConfig = {
            ...REQUIRED_CONFIG,
            timeout: MAX_TIMEOUT_MS,
            maxRetries: 10,
            enableCache: true,
            cacheTtl: 1,
            cacheCleanupInterval: 0,
            maxCacheSize: 0,
            rateLimiter: { maxRequests: 1, windowMs: 1 },
            allowInsecure: false,
            allowPrivateHosts: false,
            maxJsonResponseBytes: MAX_RESPONSE_BYTES_LIMIT,
            maxBinaryResponseBytes: MAX_RESPONSE_BYTES_LIMIT,
            bodyTimeout: 0,
            registerProcessHandlers: false,
            fetch: fetchOverride,
            dnsLookup,
            onSchemaMismatch,
        };

        const parsed = TestRailConfigSchema.parse(config);
        expect(parsed).toMatchObject(config);
        expect(parsed.fetch).toBe(fetchOverride);
        expect(parsed.dnsLookup).toBe(dnsLookup);
        expect(parsed.onSchemaMismatch).toBe(onSchemaMismatch);
        expect(() => validateTestRailConfig(config)).not.toThrow();
    });

    it('ignores unknown accessors at both config object levels during construction', () => {
        const rateLimiter: Record<string, unknown> = { maxRequests: 1, windowMs: 1 };
        Object.defineProperty(rateLimiter, 'pluginNestedOption', {
            enumerable: true,
            get: () => {
                throw new Error('nested plugin option must not be read');
            },
        });
        const config: Record<string, unknown> = {
            ...REQUIRED_CONFIG,
            enableCache: false,
            rateLimiter,
        };
        Object.defineProperty(config, 'pluginOption', {
            enumerable: true,
            get: () => {
                throw new Error('plugin option must not be read');
            },
        });

        expect(() => validateTestRailConfig(config)).not.toThrow();
        const client = new TestRailClient(config as unknown as TestRailConfig);
        expect(client).toBeInstanceOf(TestRailClient);
        client.destroy();
    });

    it.each(['a%tag@example.com', '"a"@example.com'])(
        'preserves established constructor email acceptance for %s',
        (email) => {
            const config = { ...REQUIRED_CONFIG, email, enableCache: false };

            expect(TestRailConfigSchema.safeParse(config).success).toBe(true);
            expect(() => validateTestRailConfig(config)).not.toThrow();

            const client = new TestRailClient(config);
            expect(client).toBeInstanceOf(TestRailClient);
            client.destroy();
        },
    );

    it('caps cache cleanup at the largest delay Node.js timers can represent', () => {
        const maximumConfig = {
            ...REQUIRED_CONFIG,
            cacheCleanupInterval: MAX_NODE_TIMER_DELAY_MS,
        };
        const overflowingConfig = {
            ...REQUIRED_CONFIG,
            cacheCleanupInterval: MAX_NODE_TIMER_DELAY_MS + 1,
        };

        expect(TestRailConfigSchema.safeParse(maximumConfig).success).toBe(true);
        expect(TestRailConfigSchema.safeParse(overflowingConfig).success).toBe(false);

        const client = new TestRailClient(maximumConfig);
        expect(client).toBeInstanceOf(TestRailClient);
        client.destroy();

        expect(() => new TestRailClient(overflowingConfig)).toThrow(TestRailValidationError);
        expect(() => new TestRailClient(overflowingConfig)).toThrow(
            `cacheCleanupInterval must be a non-negative integer not exceeding ${MAX_NODE_TIMER_DELAY_MS}`,
        );
    });

    it.each([
        ['timeout', { timeout: 0 }],
        ['maxRetries', { maxRetries: 11 }],
        ['cacheTtl', { cacheTtl: 0 }],
        ['cacheCleanupInterval', { cacheCleanupInterval: -1 }],
        ['maxCacheSize', { maxCacheSize: -1 }],
        ['maxJsonResponseBytes', { maxJsonResponseBytes: MAX_RESPONSE_BYTES_LIMIT + 1 }],
        ['maxBinaryResponseBytes', { maxBinaryResponseBytes: 0 }],
        ['bodyTimeout', { bodyTimeout: MAX_TIMEOUT_MS + 1 }],
        ['registerProcessHandlers', { registerProcessHandlers: 'yes' }],
        ['fetch', { fetch: 'not-a-function' }],
        ['dnsLookup', { dnsLookup: 'not-a-function' }],
    ])('rejects an invalid %s value', (_field, override) => {
        expect(TestRailConfigSchema.safeParse({ ...REQUIRED_CONFIG, ...override }).success).toBe(false);
    });

    it.each([
        [{}, 'baseUrl is required and must be a string'],
        [{ ...REQUIRED_CONFIG, baseUrl: 'not a url' }, 'baseUrl must be a valid URL'],
        [
            { ...REQUIRED_CONFIG, baseUrl: 'http://example.com' },
            'baseUrl must use HTTPS. HTTP sends credentials in cleartext.',
        ],
        [
            { ...REQUIRED_CONFIG, baseUrl: 'https://agent:key@example.com' },
            'baseUrl must not contain embedded credentials',
        ],
        [{ ...REQUIRED_CONFIG, baseUrl: 'https://localhost' }, 'baseUrl resolves to a private/loopback host'],
        [{ ...REQUIRED_CONFIG, maxRetries: 11 }, 'maxRetries must be an integer between 0 and 10'],
        [{ ...REQUIRED_CONFIG, maxCacheSize: -1 }, 'maxCacheSize must be a non-negative integer'],
        [
            { ...REQUIRED_CONFIG, maxJsonResponseBytes: 0 },
            'maxJsonResponseBytes must be a positive integer not exceeding',
        ],
        [{ ...REQUIRED_CONFIG, bodyTimeout: -1 }, 'bodyTimeout must be a non-negative integer not exceeding 5 minutes'],
        [
            { ...REQUIRED_CONFIG, rateLimiter: { maxRequests: 0, windowMs: 1 } },
            'rateLimiter.maxRequests must be a positive integer',
        ],
        [{ ...REQUIRED_CONFIG, fetch: 'not-a-function' }, 'fetch must be a function compatible with the Fetch API'],
        [{ ...REQUIRED_CONFIG, onSchemaMismatch: 'warn' }, 'onSchemaMismatch must be a function'],
    ])('preserves the construction error surface for %#', (config, message) => {
        expect(() => validateTestRailConfig(config)).toThrow(TestRailValidationError);
        expect(() => validateTestRailConfig(config)).toThrow(message);
    });

    it('normalizes a non-object constructor argument through the stable required-field error', () => {
        expect(() => validateTestRailConfig(null)).toThrow('baseUrl is required and must be a string');
    });

    it('uses the schema authority during client construction and accepts every zero sentinel', () => {
        const client = new TestRailClient({
            ...REQUIRED_CONFIG,
            enableCache: false,
            maxRetries: 0,
            cacheCleanupInterval: 0,
            maxCacheSize: 0,
            bodyTimeout: 0,
        });

        expect(client).toBeInstanceOf(TestRailClient);
        client.destroy();
    });

    it.each([
        [{ enableCache: 'yes' }, 'enableCache must be a boolean'],
        [{ cacheTtl: 0 }, 'cacheTtl must be a positive integer'],
        [{ cacheCleanupInterval: -1 }, 'cacheCleanupInterval must be a non-negative integer'],
        [{ allowInsecure: 'yes' }, 'allowInsecure must be a boolean'],
        [{ allowPrivateHosts: 'yes' }, 'allowPrivateHosts must be a boolean'],
        [{ registerProcessHandlers: 'yes' }, 'registerProcessHandlers must be a boolean'],
        [{ dnsLookup: 'not-a-function' }, 'dnsLookup must be a function'],
    ])('rejects invalid optional config at the constructor boundary: %#', (override, message) => {
        const config = { ...REQUIRED_CONFIG, ...override } as unknown as TestRailConfig;
        expect(() => new TestRailClient(config)).toThrow(TestRailValidationError);
        expect(() => new TestRailClient(config)).toThrow(message);
    });
});

describe('PaginationRequestSchema', () => {
    it('names and enforces the request-control contract without breaking the old export', () => {
        expect(PublicPaginationRequestSchema).toBe(PaginationRequestSchema);
        expect(PaginationSchema.safeParse({ limit: -1.5, offset: -2 }).success).toBe(true);
        expect(PaginationRequestSchema.safeParse({ limit: -1.5, offset: -2 }).success).toBe(false);
        expect(PaginationRequestSchema.parse({ limit: MAX_PAGINATION_LIMIT, offset: 0 })).toEqual({
            limit: MAX_PAGINATION_LIMIT,
            offset: 0,
        });
        expect(PaginationRequestSchema.safeParse({ limit: 0 }).success).toBe(false);
        expect(PaginationRequestSchema.safeParse({ limit: MAX_PAGINATION_LIMIT + 1 }).success).toBe(false);
        expect(PaginationRequestSchema.safeParse({ offset: -1 }).success).toBe(false);
        expect(PaginationRequestSchema.safeParse({ offset: 1.5 }).success).toBe(false);
    });
});
