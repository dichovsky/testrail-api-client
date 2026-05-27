/**
 * Unit tests targeting the IP-validation branches in client-core.ts that the
 * regex `PRIVATE_HOST_PATTERNS` check would otherwise short-circuit.
 *
 * The `isPrivateOrLoopbackIPv4` and `isPrivateOrLoopbackIP` helpers are only
 * reached by:
 *   1. IP literals in the baseUrl that escape PRIVATE_HOST_PATTERNS but appear
 *      as IPs to `isIP()` — `[::1]`, `[::]` (URL normalizes other forms).
 *   2. Hostnames that DNS resolves to a private address (mocked here so the
 *      tests stay fast and offline). This is the primary defense surface.
 *
 * Note: PRIVATE_HOST_PATTERNS runs synchronously inside `validateConfig` at
 * construction time. `isPrivateOrLoopbackIP` runs asynchronously inside
 * `validatePublicHost` before each request. The IP-literal tests must
 * therefore exercise an actual request to dispatch through the async
 * validator.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailValidationError } from '../src/client.js';

const { mockDnsLookup } = vi.hoisted(() => ({
    mockDnsLookup: vi.fn(),
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

vi.mock('node:dns/promises', () => ({
    lookup: mockDnsLookup,
}));

describe('SSRF defense — DNS-resolved private IPv4 (isPrivateOrLoopbackIPv4 branches)', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([]);
    });

    async function expectRejectedOnLookup(address: string, family: number): Promise<void> {
        mockDnsLookup.mockResolvedValueOnce([{ address, family }] as never);
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
        expect(mockFetch).not.toHaveBeenCalled();
    }

    async function expectAcceptedOnLookup(address: string, family: number): Promise<void> {
        mockDnsLookup.mockResolvedValueOnce([{ address, family }] as never);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
    }

    it('rejects 10.x.x.x — exercises the o0 === 10 branch', async () => {
        await expectRejectedOnLookup('10.1.2.3', 4);
    });

    it('rejects 169.254.x.x link-local — exercises o0 === 169 && o1 === 254', async () => {
        await expectRejectedOnLookup('169.254.169.254', 4);
    });

    it('rejects 172.16.x.x (lower boundary of 16-31)', async () => {
        await expectRejectedOnLookup('172.16.0.1', 4);
    });

    it('rejects 172.20.x.x (middle of 16-31 range)', async () => {
        await expectRejectedOnLookup('172.20.0.1', 4);
    });

    it('rejects 172.31.x.x (upper boundary of 16-31)', async () => {
        await expectRejectedOnLookup('172.31.255.255', 4);
    });

    it('rejects 192.168.x.x — exercises o0 === 192 && o1 === 168', async () => {
        await expectRejectedOnLookup('192.168.1.100', 4);
    });

    it('rejects 0.0.0.0 — exercises the o0 === 0 branch', async () => {
        await expectRejectedOnLookup('0.0.0.0', 4);
    });

    it('rejects 127.5.5.5 (non-canonical loopback)', async () => {
        await expectRejectedOnLookup('127.5.5.5', 4);
    });

    it('does NOT reject 172.15.x.x — confirms the off-by-one lower bound', async () => {
        await expectAcceptedOnLookup('172.15.0.1', 4);
    });

    it('does NOT reject 172.32.x.x — confirms the off-by-one upper bound', async () => {
        await expectAcceptedOnLookup('172.32.0.1', 4);
    });

    it('does NOT reject 169.255.x.x — confirms link-local check is precise on o1', async () => {
        await expectAcceptedOnLookup('169.255.0.1', 4);
    });

    it('does NOT reject 192.167.x.x — confirms private-range check is precise on o1', async () => {
        await expectAcceptedOnLookup('192.167.1.1', 4);
    });
});

describe('SSRF defense — DNS-resolved IPv6 (isPrivateOrLoopbackIP branches)', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([]);
    });

    async function expectRejectedOnLookup(address: string, family: number): Promise<void> {
        mockDnsLookup.mockResolvedValueOnce([{ address, family }] as never);
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).rejects.toThrow(TestRailValidationError);
        expect(mockFetch).not.toHaveBeenCalled();
    }

    it('rejects fe80:: link-local — exercises firstHextet.startsWith("fe8")', async () => {
        await expectRejectedOnLookup('fe80::1', 6);
    });

    it('rejects fd00:: unique-local — exercises firstHextet.startsWith("fd")', async () => {
        await expectRejectedOnLookup('fd00::1', 6);
    });

    it('rejects fc00:: unique-local — exercises firstHextet.startsWith("fc")', async () => {
        await expectRejectedOnLookup('fc00::1', 6);
    });

    it('rejects fe90:: link-local — exercises firstHextet.startsWith("fe9")', async () => {
        await expectRejectedOnLookup('fe90::1', 6);
    });

    it('rejects fea0:: link-local — exercises firstHextet.startsWith("fea")', async () => {
        await expectRejectedOnLookup('fea0::1', 6);
    });

    it('rejects feb0:: link-local — exercises firstHextet.startsWith("feb")', async () => {
        await expectRejectedOnLookup('feb0::1', 6);
    });

    it('rejects IPv6 ::1 loopback — exercises the `=== "::1"` branch', async () => {
        await expectRejectedOnLookup('::1', 6);
    });

    it('rejects IPv6 :: unspecified — exercises the `=== "::"` branch', async () => {
        await expectRejectedOnLookup('::', 6);
    });

    it('rejects IPv4-mapped IPv6 ::ffff:127.0.0.1 via DNS lookup', async () => {
        // When DNS lookups return the mapped-IPv4 textual form, the
        // mappedIPv4 regex inside isPrivateOrLoopbackIP must dispatch to
        // isPrivateOrLoopbackIPv4 on '127.0.0.1'.
        await expectRejectedOnLookup('::ffff:127.0.0.1', 6);
    });

    it('rejects IPv4-mapped IPv6 ::ffff:10.0.0.1 via DNS lookup', async () => {
        await expectRejectedOnLookup('::ffff:10.0.0.1', 6);
    });

    it('rejects IPv4-mapped IPv6 ::ffff:169.254.169.254 via DNS lookup (AWS IMDS)', async () => {
        await expectRejectedOnLookup('::ffff:169.254.169.254', 6);
    });

    it('rejects IPv4-mapped IPv6 ::ffff:192.168.1.1 via DNS lookup', async () => {
        await expectRejectedOnLookup('::ffff:192.168.1.1', 6);
    });

    it('rejects an address with a zone identifier (e.g. fe80::1%eth0) — the %suffix is stripped before matching', async () => {
        // isPrivateOrLoopbackIP splits on '%' first; the prefix check must
        // still flag fe80::1 even when DNS returns it with a zone id.
        await expectRejectedOnLookup('fe80::1%eth0', 6);
    });

    // SEC #15: site-local (fec0::/10), 6to4 (2002::/16), NAT64 (64:ff9b::/96)
    it('rejects fec0::1 (IPv6 site-local fec0::/10, SEC #15)', async () => {
        await expectRejectedOnLookup('fec0::1', 6);
    });

    it('rejects feff::1 (IPv6 site-local fec0::/10 upper end, SEC #15)', async () => {
        await expectRejectedOnLookup('feff::1', 6);
    });

    it('rejects 2002::1 (6to4 2002::/16, SEC #15)', async () => {
        await expectRejectedOnLookup('2002::1', 6);
    });

    it('rejects 2002:c000:204:: (6to4 with embedded private IPv4 192.0.2.4, SEC #15)', async () => {
        await expectRejectedOnLookup('2002:c000:204::', 6);
    });

    it('rejects 64:ff9b::1 (NAT64 well-known prefix 64:ff9b::/96, SEC #15)', async () => {
        await expectRejectedOnLookup('64:ff9b::1', 6);
    });

    it('rejects 64:ff9b::c0a8:1 (NAT64 mapping 192.168.0.1, SEC #15)', async () => {
        await expectRejectedOnLookup('64:ff9b::c0a8:1', 6);
    });

    it('does NOT reject a public IPv6 (2001:db8:: documentation prefix)', async () => {
        // 2001:db8::/32 is reserved for documentation; treated as public by
        // the validator. Confirms IPv6 first-hextet check doesn't false-match.
        mockDnsLookup.mockResolvedValueOnce([{ address: '2001:db8::1', family: 6 }] as never);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
    });
});

describe('SSRF defense — DNS-lookup defensive paths', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockDnsLookup.mockReset();
        mockDnsLookup.mockResolvedValue([]);
    });

    it('skips empty-string addresses in the lookup result (defensive guard at line 163)', async () => {
        mockDnsLookup.mockResolvedValueOnce([
            { address: '', family: 4 },
            { address: '203.0.113.5', family: 4 }, // public TEST-NET-3
        ] as never);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
    });

    it('handles malformed IPv4 from DNS gracefully (non-4-part, non-numeric octet)', async () => {
        // isPrivateOrLoopbackIPv4 returns false for malformed input; if all
        // lookups are malformed, the validator should allow the request
        // through. Defensive against a non-conformant DNS resolver.
        mockDnsLookup.mockResolvedValueOnce([
            { address: '1.2.3', family: 4 }, // too few parts
            { address: '1.2.3.abc', family: 4 }, // non-numeric octet
            { address: '203.0.113.10', family: 4 }, // valid public follow-up
        ] as never);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
    });

    it('handles an out-of-range IPv4 octet from DNS (e.g. "1.2.3.999")', async () => {
        // Exercises the `octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)`
        // false-return branch. Followed by a valid public address so the
        // request can proceed.
        mockDnsLookup.mockResolvedValueOnce([
            { address: '1.2.3.999', family: 4 },
            { address: '203.0.113.20', family: 4 },
        ] as never);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
    });

    it('rethrows TestRailValidationError raised inside the dns.lookup try block (line 154)', async () => {
        // When the dns module raises TestRailValidationError directly (a
        // synthetic mock path that mirrors how a future inner check could
        // throw), the `if (err instanceof TestRailValidationError) throw err`
        // re-throws the original rather than wrapping it in a "DNS validation
        // failed" envelope. Verifies the exact error type passes through.
        const inner = new TestRailValidationError('inner validation error from DNS path');
        mockDnsLookup.mockRejectedValueOnce(inner);
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).rejects.toThrow(inner);
    });

    it('accepts a public IPv6 URL literal at request time (exercises validatePublicHost IP-literal pass-through)', async () => {
        // URL = http://[2001:db8::1]/ passes both URL-format and
        // PRIVATE_HOST_PATTERNS at construction. At request time,
        // validatePublicHost dispatches through the IP-literal branch:
        //   bracket-strip → bare = '2001:db8::1'
        //   isIP(bare) === 6 (IP literal, no DNS)
        //   isPrivateOrLoopbackIP returns false (documentation prefix)
        //   → fetch proceeds.
        // Without this test the IP-literal happy path in validatePublicHost
        // (lines 124, 134, 135) is unverified.
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'http://[2001:db8::1]/testrail',
            email: 'test@example.com',
            apiKey: 'key',
            allowInsecure: true,
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('accepts a public IPv4 URL literal at request time (exercises ipFamily === 4 branch)', async () => {
        // URL = http://203.0.113.5/ — public TEST-NET-3 address; URL.hostname
        // does NOT have brackets (IPv4 literal). Exercises the
        // ipFamily === 4 branch in isPrivateOrLoopbackIP, taken via the
        // IP-literal short-circuit at line 134.
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => JSON.stringify({ id: 1, name: 'p', suite_mode: 1, url: 'u' }),
        });
        const client = new TestRailClient({
            baseUrl: 'http://203.0.113.5/testrail',
            email: 'test@example.com',
            apiKey: 'key',
            allowInsecure: true,
        });
        await expect(client.getProject(1)).resolves.toBeDefined();
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('wraps non-Error DNS rejections (defensive — fail-closed)', async () => {
        // err instanceof Error -> false branch: the message falls back to
        // 'Unknown error'. Defends against a future DNS shim that rejects
        // with a non-Error value.
        mockDnsLookup.mockRejectedValueOnce('plain string rejection');
        const client = new TestRailClient({
            baseUrl: 'https://public-host.example',
            email: 'test@example.com',
            apiKey: 'key',
        });
        await expect(client.getProject(1)).rejects.toThrow(/Unknown error|DNS validation failed/);
    });
});
