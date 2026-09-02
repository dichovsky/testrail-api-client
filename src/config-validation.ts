import {
    MAX_NODE_TIMER_DELAY_MS,
    MAX_RESPONSE_BYTES_LIMIT,
    MAX_RETRIES,
    TESTRAIL_CONFIG_EMAIL_PATTERN,
} from './constants.js';
import { TestRailValidationError } from './errors.js';
import { TestRailConfigSchema } from './schemas/common.js';
import type { TestRailConfig } from './types.js';

// Construction historically ignored unknown config keys. Validate through a
// stripped view so passthrough support on the exported schema does not cause
// Zod to enumerate/read unrelated plugin accessors. The nested object needs
// the same treatment independently.
const ConstructionConfigSchema = TestRailConfigSchema.strip().extend({
    rateLimiter: TestRailConfigSchema.shape.rateLimiter.unwrap().strip().optional(),
});

// Reject loopback, link-local, and private-range host literals synchronously.
// Per-upstream-fetch DNS validation remains in client-core so rebinding cannot
// bypass this construction-time check.
const PRIVATE_HOST_PATTERNS: readonly RegExp[] = [
    /^localhost\.?$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fe80:/i,
    /^f[cd][0-9a-f]{2}:/i,
    /^fe[c-f][0-9a-f]:/i,
    /^2002:/i,
    /^64:ff9b::/i,
    /^0\./,
];

/** Shared literal-host check used at construction and before each upstream fetch. */
export function isPrivateHostLiteral(hostname: string): boolean {
    const bare = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
    return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(bare));
}

function requiredString(config: Readonly<Record<string, unknown>>, key: 'baseUrl' | 'email' | 'apiKey'): string {
    const value = config[key];
    if (typeof value !== 'string' || value.length === 0) {
        throw new TestRailValidationError(`${key} is required and must be a string`);
    }
    return value;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null;
}

function validateBaseUrl(baseUrl: string, config: Readonly<Record<string, unknown>>): void {
    try {
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
            throw new TestRailValidationError('baseUrl must use http or https protocol');
        }
        if (url.protocol === 'http:' && config['allowInsecure'] !== true) {
            throw new TestRailValidationError(
                'baseUrl must use HTTPS. HTTP sends credentials in cleartext. ' +
                    'Set allowInsecure: true only in isolated development environments.',
            );
        }
        if (url.username !== '' || url.password !== '') {
            throw new TestRailValidationError(
                'baseUrl must not contain embedded credentials (userinfo). ' +
                    'Use the email and apiKey config fields instead.',
            );
        }
        if (config['allowPrivateHosts'] !== true) {
            if (isPrivateHostLiteral(url.hostname)) {
                throw new TestRailValidationError(
                    `baseUrl resolves to a private/loopback host ("${url.hostname}"). ` +
                        'Set allowPrivateHosts: true to allow on-premise deployments.',
                );
            }
        }
    } catch (error) {
        if (error instanceof TestRailValidationError) throw error;
        throw new TestRailValidationError('baseUrl must be a valid URL');
    }
}

function issueMessage(path: readonly PropertyKey[]): string {
    const field = path[0];
    const nestedField = path[1];

    switch (field) {
        case 'baseUrl':
            return 'baseUrl must be a valid URL';
        case 'email':
            return 'email must be a valid email address';
        case 'apiKey':
            return 'apiKey is required and must be a string';
        case 'timeout':
            return 'timeout must be a positive number not exceeding 5 minutes';
        case 'maxRetries':
            return `maxRetries must be an integer between 0 and ${MAX_RETRIES}`;
        case 'enableCache':
            return 'enableCache must be a boolean';
        case 'cacheTtl':
            return 'cacheTtl must be a positive integer';
        case 'cacheCleanupInterval':
            return `cacheCleanupInterval must be a non-negative integer not exceeding ${MAX_NODE_TIMER_DELAY_MS}`;
        case 'maxCacheSize':
            return 'maxCacheSize must be a non-negative integer';
        case 'rateLimiter':
            if (nestedField === 'maxRequests') return 'rateLimiter.maxRequests must be a positive integer';
            if (nestedField === 'windowMs') return 'rateLimiter.windowMs must be a positive integer';
            return 'rateLimiter must be an object with maxRequests and windowMs';
        case 'allowInsecure':
            return 'allowInsecure must be a boolean';
        case 'allowPrivateHosts':
            return 'allowPrivateHosts must be a boolean';
        case 'maxJsonResponseBytes':
            return `maxJsonResponseBytes must be a positive integer not exceeding ${MAX_RESPONSE_BYTES_LIMIT} bytes`;
        case 'maxBinaryResponseBytes':
            return `maxBinaryResponseBytes must be a positive integer not exceeding ${MAX_RESPONSE_BYTES_LIMIT} bytes`;
        case 'bodyTimeout':
            return 'bodyTimeout must be a non-negative integer not exceeding 5 minutes';
        case 'registerProcessHandlers':
            return 'registerProcessHandlers must be a boolean';
        case 'fetch':
            return 'fetch must be a function compatible with the Fetch API';
        case 'dnsLookup':
            return 'dnsLookup must be a function';
        case 'onSchemaMismatch':
            return 'onSchemaMismatch must be a function';
        case undefined:
        default:
            return 'configuration contains an invalid value';
    }
}

/**
 * Validates construction-time configuration without coercion.
 *
 * `TestRailConfigSchema` owns the complete structural and numeric contract;
 * this function adds URL security semantics and translates Zod issues into the
 * stable `TestRailValidationError` surface used by client construction.
 */
export function validateTestRailConfig(config: unknown): asserts config is TestRailConfig {
    const candidate: Readonly<Record<string, unknown>> = isRecord(config) ? config : {};

    // Preserve the established required-field precedence and messages before
    // URL/email semantics or optional-field validation runs.
    const baseUrl = requiredString(candidate, 'baseUrl');
    const email = requiredString(candidate, 'email');
    requiredString(candidate, 'apiKey');

    validateBaseUrl(baseUrl, candidate);

    if (!TESTRAIL_CONFIG_EMAIL_PATTERN.test(email)) {
        throw new TestRailValidationError('email must be a valid email address');
    }

    const result = ConstructionConfigSchema.safeParse(config);
    if (!result.success) {
        const firstIssue = result.error.issues[0];
        throw new TestRailValidationError(issueMessage(firstIssue?.path ?? []));
    }
}
