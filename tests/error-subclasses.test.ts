import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    TestRailApiError,
    TestRailRateLimitError,
    TestRailAuthError,
    TestRailNotFoundError,
    TestRailTimeoutError,
    createApiError,
} from '../src/errors.js';
import { TestRailClient } from '../src/client.js';
import { createClient, mockErr } from './helpers.js';

const { mockDnsLookup } = vi.hoisted(() => ({
    mockDnsLookup: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
    lookup: mockDnsLookup,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return {
        ...actual,
        sleep: vi.fn().mockResolvedValue(undefined),
    };
});

beforeEach(() => {
    vi.resetAllMocks();
    mockDnsLookup.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Unit tests for createApiError() factory
// ---------------------------------------------------------------------------

describe('createApiError()', () => {
    it('returns TestRailRateLimitError for status 429', () => {
        const err = createApiError(429, 'Too Many Requests');
        expect(err).toBeInstanceOf(TestRailRateLimitError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err.status).toBe(429);
        expect(err.statusText).toBe('Too Many Requests');
        expect(err.name).toBe('TestRailRateLimitError');
    });

    it('returns TestRailAuthError for status 401', () => {
        const err = createApiError(401, 'Unauthorized');
        expect(err).toBeInstanceOf(TestRailAuthError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err.status).toBe(401);
        expect(err.statusText).toBe('Unauthorized');
        expect(err.name).toBe('TestRailAuthError');
    });

    it('returns TestRailAuthError for status 403', () => {
        const err = createApiError(403, 'Forbidden', 'no access');
        expect(err).toBeInstanceOf(TestRailAuthError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err.status).toBe(403);
        expect(err.statusText).toBe('Forbidden');
        expect(err.response).toBe('no access');
        expect(err.name).toBe('TestRailAuthError');
    });

    it('returns TestRailNotFoundError for status 404', () => {
        const err = createApiError(404, 'Not Found', 'Resource not found');
        expect(err).toBeInstanceOf(TestRailNotFoundError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err.status).toBe(404);
        expect(err.statusText).toBe('Not Found');
        expect(err.name).toBe('TestRailNotFoundError');
    });

    it('returns TestRailTimeoutError for status 408', () => {
        const err = createApiError(408, 'Request Timeout');
        expect(err).toBeInstanceOf(TestRailTimeoutError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err.status).toBe(408);
        expect(err.statusText).toBe('Request Timeout');
        expect(err.name).toBe('TestRailTimeoutError');
    });

    it('returns base TestRailApiError for status 500', () => {
        const err = createApiError(500, 'Internal Server Error');
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).not.toBeInstanceOf(TestRailRateLimitError);
        expect(err).not.toBeInstanceOf(TestRailAuthError);
        expect(err).not.toBeInstanceOf(TestRailNotFoundError);
        expect(err).not.toBeInstanceOf(TestRailTimeoutError);
        expect(err.status).toBe(500);
        expect(err.name).toBe('TestRailApiError');
    });

    it('returns base TestRailApiError for unclassified 4xx status (e.g. 400)', () => {
        const err = createApiError(400, 'Bad Request');
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).not.toBeInstanceOf(TestRailAuthError);
        expect(err).not.toBeInstanceOf(TestRailNotFoundError);
        expect(err.name).toBe('TestRailApiError');
    });

    it('passes response payload through to the subclass', () => {
        const payload = { error: 'rate limited' };
        const err = createApiError(429, 'Too Many Requests', payload);
        expect(err.response).toBe(payload);
    });
});

// ---------------------------------------------------------------------------
// Subclass constructor unit tests
// ---------------------------------------------------------------------------

describe('TestRailRateLimitError', () => {
    it('is instanceof TestRailApiError and Error', () => {
        const err = new TestRailRateLimitError(429, 'Too Many Requests');
        expect(err).toBeInstanceOf(TestRailRateLimitError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).toBeInstanceOf(Error);
    });

    it('has the correct .name, .status, .statusText', () => {
        const err = new TestRailRateLimitError(429, 'Too Many Requests', { waitTimeMs: 5000 });
        expect(err.name).toBe('TestRailRateLimitError');
        expect(err.status).toBe(429);
        expect(err.statusText).toBe('Too Many Requests');
        expect(err.response).toStrictEqual({ waitTimeMs: 5000 });
    });

    it('message includes status and statusText', () => {
        const err = new TestRailRateLimitError(429, 'Too Many Requests');
        expect(err.message).toContain('429');
        expect(err.message).toContain('Too Many Requests');
    });
});

describe('TestRailAuthError', () => {
    it('is instanceof TestRailApiError and Error', () => {
        const err = new TestRailAuthError(401, 'Unauthorized');
        expect(err).toBeInstanceOf(TestRailAuthError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).toBeInstanceOf(Error);
    });

    it('has the correct .name, .status, .statusText for 401', () => {
        const err = new TestRailAuthError(401, 'Unauthorized');
        expect(err.name).toBe('TestRailAuthError');
        expect(err.status).toBe(401);
        expect(err.statusText).toBe('Unauthorized');
    });

    it('has the correct .name, .status, .statusText for 403', () => {
        const err = new TestRailAuthError(403, 'Forbidden');
        expect(err.name).toBe('TestRailAuthError');
        expect(err.status).toBe(403);
    });
});

describe('TestRailNotFoundError', () => {
    it('is instanceof TestRailApiError and Error', () => {
        const err = new TestRailNotFoundError(404, 'Not Found');
        expect(err).toBeInstanceOf(TestRailNotFoundError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).toBeInstanceOf(Error);
    });

    it('has the correct .name, .status, .statusText', () => {
        const err = new TestRailNotFoundError(404, 'Not Found', 'Resource not found');
        expect(err.name).toBe('TestRailNotFoundError');
        expect(err.status).toBe(404);
        expect(err.statusText).toBe('Not Found');
        expect(err.response).toBe('Resource not found');
    });
});

describe('TestRailTimeoutError', () => {
    it('is instanceof TestRailApiError and Error', () => {
        const err = new TestRailTimeoutError(408, 'Request Timeout');
        expect(err).toBeInstanceOf(TestRailTimeoutError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).toBeInstanceOf(Error);
    });

    it('has the correct .name, .status, .statusText', () => {
        const err = new TestRailTimeoutError(408, 'Request timeout after 30000ms');
        expect(err.name).toBe('TestRailTimeoutError');
        expect(err.status).toBe(408);
        expect(err.statusText).toBe('Request timeout after 30000ms');
    });
});

// ---------------------------------------------------------------------------
// Integration tests: HTTP responses via mocked fetch
// ---------------------------------------------------------------------------

describe('HTTP response → error subclass (via client)', () => {
    let client: TestRailClient;

    beforeEach(() => {
        client = createClient({ maxRetries: 0, enableCache: false });
    });

    it('429 response → TestRailRateLimitError', async () => {
        mockFetch.mockResolvedValueOnce(mockErr(429, 'Too Many Requests', 'rate limited'));
        const err = await client.getProject(1).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailRateLimitError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailRateLimitError).status).toBe(429);
        expect((err as TestRailRateLimitError).name).toBe('TestRailRateLimitError');
    });

    it('401 response → TestRailAuthError', async () => {
        mockFetch.mockResolvedValueOnce(mockErr(401, 'Unauthorized', 'invalid credentials'));
        const err = await client.getProject(1).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailAuthError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailAuthError).status).toBe(401);
        expect((err as TestRailAuthError).name).toBe('TestRailAuthError');
    });

    it('403 response → TestRailAuthError', async () => {
        mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'insufficient permissions'));
        const err = await client.getProject(1).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailAuthError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailAuthError).status).toBe(403);
        expect((err as TestRailAuthError).name).toBe('TestRailAuthError');
    });

    it('404 response → TestRailNotFoundError', async () => {
        mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'project not found'));
        const err = await client.getProject(999).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailNotFoundError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailNotFoundError).status).toBe(404);
        expect((err as TestRailNotFoundError).name).toBe('TestRailNotFoundError');
    });

    it('500 response → base TestRailApiError only', async () => {
        mockFetch.mockResolvedValueOnce(mockErr(500, 'Internal Server Error', 'server error'));
        const err = await client.getProject(1).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect(err).not.toBeInstanceOf(TestRailRateLimitError);
        expect(err).not.toBeInstanceOf(TestRailAuthError);
        expect(err).not.toBeInstanceOf(TestRailNotFoundError);
        expect(err).not.toBeInstanceOf(TestRailTimeoutError);
        expect((err as TestRailApiError).status).toBe(500);
        expect((err as TestRailApiError).name).toBe('TestRailApiError');
    });

    it('AbortError (timeout) → TestRailTimeoutError', async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);
        const err = await client.getProject(1).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailTimeoutError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailTimeoutError).status).toBe(408);
        expect((err as TestRailTimeoutError).name).toBe('TestRailTimeoutError');
        expect((err as TestRailTimeoutError).message).toContain('Request timeout after');
    });
});

// ---------------------------------------------------------------------------
// Client-side rate limiter fires TestRailRateLimitError
// ---------------------------------------------------------------------------

describe('client-side rate limiter → TestRailRateLimitError', () => {
    it('throws TestRailRateLimitError when sliding window is full', async () => {
        const client = createClient({
            rateLimiter: { maxRequests: 2, windowMs: 60000 },
            enableCache: false,
        });

        const projectJson = JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' });
        mockFetch.mockImplementation(() =>
            Promise.resolve(new Response(projectJson, { status: 200, statusText: 'OK' })),
        );

        await client.getProject(1);
        await client.getProject(2);

        const err = await client.getProject(3).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(TestRailRateLimitError);
        expect(err).toBeInstanceOf(TestRailApiError);
        expect((err as TestRailRateLimitError).status).toBe(429);
        expect((err as TestRailRateLimitError).name).toBe('TestRailRateLimitError');
    });
});
