import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient } from '../src/client.js';
import { deriveRetryPolicy, getRetryPolicy } from '../src/retry-policy.js';
import { BASE_CONFIG } from './helpers.js';

// Retries must not spend real wall-clock time; the derivation is what is under
// test here, not the backoff schedule (covered by tests/client-features.test.ts).
vi.mock('../src/utils.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils.js')>();
    return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

const mockFetch = vi.fn();

function failure(status: number, statusText: string): unknown {
    return {
        ok: false,
        status,
        statusText,
        headers: { get: () => null },
        text: async () => 'error',
    };
}

function ok(): unknown {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => null },
        text: async () => JSON.stringify({ id: 7 }),
    };
}

function createClient(): TestRailClient {
    return new TestRailClient({ ...BASE_CONFIG, fetch: mockFetch });
}

// The derivation is a pure function, so the rules are asserted directly rather
// than inferred from fetch call counts. Before this existed, the only way to
// check "an upload does not retry" was one end-to-end test per upload endpoint,
// which left endpoints that did not exist yet uncovered.
describe('deriveRetryPolicy', () => {
    it('never retries a multipart body, whatever the status', () => {
        const policy = deriveRetryPolicy({ bodyKind: 'multipart', responseKind: 'json' });
        expect(policy.isStatusRetryable(429, 'POST')).toBe(false);
        expect(policy.isStatusRetryable(503, 'POST')).toBe(false);
        expect(policy.isNetworkErrorRetryable('POST')).toBe(false);
    });

    it('retries 5xx and network errors for a binary GET', () => {
        const policy = deriveRetryPolicy({ responseKind: 'binary' });
        expect(policy.isStatusRetryable(503, 'GET')).toBe(true);
        expect(policy.isNetworkErrorRetryable('GET')).toBe(true);
    });

    it('retries 429 for a write but not 5xx, so an ambiguous write is never repeated', () => {
        const policy = deriveRetryPolicy({ bodyKind: 'json', responseKind: 'json' });
        expect(policy.isStatusRetryable(429, 'POST')).toBe(true);
        expect(policy.isStatusRetryable(503, 'POST')).toBe(false);
        expect(policy.isStatusRetryable(503, 'GET')).toBe(true);
    });

    it('retries only 429 for a side-effecting read', () => {
        const policy = deriveRetryPolicy({ responseKind: 'json', intent: 'side-effecting-read' });
        expect(policy.isStatusRetryable(429, 'GET')).toBe(true);
        expect(policy.isStatusRetryable(503, 'GET')).toBe(false);
        expect(policy.isNetworkErrorRetryable('GET')).toBe(false);
    });

    it('leaves a fresh read on the ordinary policy — freshness is a cache concern, not a retry one', () => {
        const policy = deriveRetryPolicy({ responseKind: 'json', intent: 'fresh-read' });
        expect(policy.isStatusRetryable(503, 'GET')).toBe(true);
    });

    it('gives a text response the ordinary policy', () => {
        const policy = deriveRetryPolicy({ responseKind: 'text' });
        expect(policy.isStatusRetryable(503, 'GET')).toBe(true);
        expect(policy.isStatusRetryable(503, 'POST')).toBe(false);
    });

    // A non-idempotent body is a fact about bytes already on the wire, so it
    // outranks every other input — both the response shape below it and the
    // declared intent above it. Checking intent first would let this exact pair
    // resolve to the rate-limit policy and retry a 429, reintroducing the
    // duplicate upload this function exists to prevent.
    it.each([
        { label: 'the binary rule', input: { bodyKind: 'multipart', responseKind: 'binary' } as const },
        {
            label: 'a declared intent',
            input: { bodyKind: 'multipart', responseKind: 'json', intent: 'side-effecting-read' } as const,
        },
    ])('prefers the multipart rule over $label', ({ input }) => {
        const policy = deriveRetryPolicy(input);
        expect(policy).toBe(getRetryPolicy('none'));
        expect(policy.isStatusRetryable(429, 'POST')).toBe(false);
        expect(policy.isStatusRetryable(503, 'POST')).toBe(false);
    });

    // Identity, not just behaviour: each derived shape must resolve to the very
    // singleton its call site used to declare by name before this refactor.
    // Characterizing the predicates alone would let a derivation drift onto a
    // different policy that happened to agree on the statuses under test.
    it.each([
        { was: 'none', input: { bodyKind: 'multipart', responseKind: 'json' } as const },
        { was: 'binaryGet', input: { responseKind: 'binary' } as const },
        { was: 'rateLimitOnly', input: { responseKind: 'json', intent: 'side-effecting-read' } as const },
        { was: 'full', input: { bodyKind: 'json', responseKind: 'json' } as const },
        { was: 'full', input: { responseKind: 'text' } as const },
        { was: 'full', input: { responseKind: 'json', intent: 'fresh-read' } as const },
    ] as const)('derives the policy formerly declared as $was', ({ was, input }) => {
        expect(deriveRetryPolicy(input)).toBe(getRetryPolicy(was));
    });
});

describe('retry policy derivation through request()', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    // A multipart body is non-idempotent by construction: TestRail may already
    // have stored the attachment when the 429 arrives. The pipeline must derive
    // "no retry" from the body alone, without the caller declaring it — every
    // upload call site spelling `retry: 'none'` by hand is what this replaces.
    it('never retries a multipart upload, even when the caller declares nothing', async () => {
        mockFetch.mockResolvedValueOnce(failure(429, 'Too Many Requests')).mockResolvedValueOnce(ok());

        const client = createClient();
        try {
            await expect(
                client.request({
                    method: 'POST',
                    endpoint: 'add_attachment_to_case/1',
                    body: { kind: 'multipart', file: new Uint8Array([1, 2, 3]), filename: 'evidence.txt' },
                }),
            ).rejects.toMatchObject({ status: 429 });

            expect(mockFetch).toHaveBeenCalledTimes(1);
        } finally {
            client.destroy();
        }
    });

    it('still retries a rate-limited JSON write', async () => {
        mockFetch.mockResolvedValueOnce(failure(429, 'Too Many Requests')).mockResolvedValueOnce(ok());

        const client = createClient();
        try {
            await expect(
                client.request({
                    method: 'POST',
                    endpoint: 'add_case/1',
                    body: { kind: 'json', data: { title: 'x' } },
                }),
            ).resolves.toEqual({ id: 7 });

            expect(mockFetch).toHaveBeenCalledTimes(2);
        } finally {
            client.destroy();
        }
    });

    it('does not serve a declared intent from the cache', async () => {
        mockFetch.mockResolvedValue(ok());

        const client = createClient();
        try {
            await client.request({ method: 'GET', endpoint: 'run_report/1', intent: 'side-effecting-read' });
            await client.request({ method: 'GET', endpoint: 'run_report/1', intent: 'side-effecting-read' });

            // A cached second call would have generated no report and sent no
            // mail, silently contradicting what the caller asked for.
            expect(mockFetch).toHaveBeenCalledTimes(2);
        } finally {
            client.destroy();
        }
    });

    it('still caches an ordinary GET', async () => {
        mockFetch.mockResolvedValue(ok());

        const client = createClient();
        try {
            await client.request({ method: 'GET', endpoint: 'get_case/1' });
            await client.request({ method: 'GET', endpoint: 'get_case/1' });

            expect(mockFetch).toHaveBeenCalledTimes(1);
        } finally {
            client.destroy();
        }
    });
});
