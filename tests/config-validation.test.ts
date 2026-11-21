import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import {
    MAX_NODE_TIMER_DELAY_MS,
    MAX_PAGINATION_LIMIT,
    MAX_RESPONSE_BYTES_LIMIT,
    MAX_TIMEOUT_MS,
    TESTRAIL_CONFIG_EMAIL_PATTERN,
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

    it.each([
        ['a fragment', 'https://example.testrail.io/#/dashboard'],
        ['a bare fragment delimiter', 'https://example.testrail.io/#'],
        ['a query string', 'https://example.testrail.io/index.php?/dashboard'],
        ['a bare query delimiter', 'https://example.testrail.io/?'],
    ])('rejects a baseUrl carrying %s', (_label, baseUrl) => {
        // `{baseUrl}/index.php?/api/v2/...` cannot survive either delimiter: a
        // fragment drops the whole API path (the request goes to the site root)
        // and a query string swallows it as a parameter value.
        expect(() => validateTestRailConfig({ ...REQUIRED_CONFIG, baseUrl })).toThrow(TestRailValidationError);
        expect(() => validateTestRailConfig({ ...REQUIRED_CONFIG, baseUrl })).toThrow(
            'baseUrl must not contain a query string or fragment',
        );
    });

    it('accepts a baseUrl with a path prefix and percent-encoded delimiters', () => {
        expect(() =>
            validateTestRailConfig({ ...REQUIRED_CONFIG, baseUrl: 'https://example.testrail.io/testrail%3F' }),
        ).not.toThrow();
    });

    it('normalizes a non-object constructor argument through the stable required-field error', () => {
        expect(() => validateTestRailConfig(null)).toThrow('baseUrl is required and must be a string');
    });

    it('rejects an array that carries the required fields with the generic message', () => {
        // The pre-checks read the three properties and pass; only the schema
        // sees that the container is not a plain object, and its issue has no
        // field path to name.
        expect(() => validateTestRailConfig(Object.assign([], REQUIRED_CONFIG))).toThrow(
            new TestRailValidationError('configuration contains an invalid value'),
        );
    });

    it('lets the schema reject a baseUrl that changes after the URL pre-check', () => {
        let reads = 0;
        const config = {
            ...REQUIRED_CONFIG,
            get baseUrl(): unknown {
                reads += 1;
                return reads === 1 ? REQUIRED_CONFIG.baseUrl : 42;
            },
        };

        expect(() => validateTestRailConfig(config)).toThrow(
            new TestRailValidationError('baseUrl must be a valid URL'),
        );
        expect(reads).toBe(2);
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

describe('TESTRAIL_CONFIG_EMAIL_PATTERN', () => {
    // The quadratic pattern this one replaced, kept as the reference language:
    // the rewrite must not narrow or widen what the constructor accepts.
    const PREVIOUS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 64 KiB of dots behind an '@', with a trailing space so the anchor fails
    // and a backtracking engine has to try every split of the dots.
    const PATHOLOGICAL = `a@${'.'.repeat(65536)} `;
    // The rewritten pattern needs well under a millisecond; the one it replaced
    // takes seconds. Generous enough that a loaded CI machine cannot flake it.
    const LINEAR_BUDGET_MS = 1000;

    it.each([
        'agent@example.com',
        'a@b.c',
        'first.last@sub.example.co.uk',
        'agent@.example.com',
        'agent@..example.com',
        'agent@example..com',
        '.agent.@a.b',
    ])('accepts %j, as the pattern it replaced did', (email) => {
        expect(PREVIOUS.test(email)).toBe(true);
        expect(TESTRAIL_CONFIG_EMAIL_PATTERN.test(email)).toBe(true);
    });

    it.each(['agent@example', 'agent@.com', 'agent@com.', 'agent@.', 'agent@..', '@example.com', 'agent example.com'])(
        'refuses %j, as the pattern it replaced did',
        (email) => {
            expect(PREVIOUS.test(email)).toBe(false);
            expect(TESTRAIL_CONFIG_EMAIL_PATTERN.test(email)).toBe(false);
        },
    );

    it('accepts exactly the same strings as the pattern it replaced (differential, generated inputs)', () => {
        // Deterministic LCG over the alphabet that drives both patterns'
        // structure: the local/domain separator, the dot the domain must carry,
        // an ordinary character, and the whitespace both classes exclude.
        const alphabet = [...'ab.@ \t'];
        let seed = 0x2f6e2b1;
        const next = (): number => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed;
        };
        const disagreements: string[] = [];

        for (let i = 0; i < 300_000; i += 1) {
            let candidate = '';
            for (let length = next() % 13; length > 0; length -= 1) {
                candidate += alphabet[next() % alphabet.length];
            }
            if (PREVIOUS.test(candidate) !== TESTRAIL_CONFIG_EMAIL_PATTERN.test(candidate)) {
                disagreements.push(candidate);
            }
        }

        expect(disagreements).toEqual([]);
    });

    it('rejects a pathological non-match in linear time', () => {
        const started = performance.now();
        expect(TESTRAIL_CONFIG_EMAIL_PATTERN.test(PATHOLOGICAL)).toBe(false);
        expect(performance.now() - started).toBeLessThan(LINEAR_BUDGET_MS);
    });

    it('does not let a pathological email block the constructor path', () => {
        const started = performance.now();
        expect(() => validateTestRailConfig({ ...REQUIRED_CONFIG, email: PATHOLOGICAL })).toThrow(
            'email must be a valid email address',
        );
        expect(performance.now() - started).toBeLessThan(LINEAR_BUDGET_MS);
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
