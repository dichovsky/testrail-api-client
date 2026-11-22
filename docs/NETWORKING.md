# Networking

The client validates the destination before each network attempt and rejects HTTP redirects.
Use this guide when you connect to a private TestRail server or configure DNS, a proxy, or a certificate authority.
See [SDK configuration](SDK.md#configuration) for timeout and response-body limits.

[Private servers](#private-servers) · [Custom DNS resolvers](#custom-dns-resolvers) · [Proxies and certificate authorities](#proxies-and-custom-certificate-authorities)

## Private servers

By default, the client blocks these address ranges in both URL literals and DNS answers:

- Private, loopback, link-local, multicast, and reserved IPv4 addresses.
- CGNAT (`100.64.0.0/10`) and benchmarking (`198.18.0.0/15`) addresses.
- IPv4-mapped IPv6 addresses from blocked ranges.
- IPv6 transition ranges, including 6to4 and NAT64 prefixes `64:ff9b::/96` and `64:ff9b:1::/48`.

The default transport connects directly to validated IP addresses without another DNS lookup.
It keeps the original hostname for TLS certificate verification and SNI.
DNS validation runs before each network attempt, including retries.
Cache hits and callers that share a request do not repeat DNS validation.

For a trusted TestRail server on a private network, set `allowPrivateHosts: true` and use separate network controls.
This setting disables private-host validation and DNS pinning, and the client ignores `dnsLookup`.
HTTPS stays required unless you also set `allowInsecure: true`.
Use HTTP only in isolated development environments. HTTP sends credentials in cleartext.

Custom `fetch` implementations must use the Node dispatcher that the client supplies, or apply equivalent destination checks.
They must also keep abort signals and manual redirect handling.
Transports that ignore the dispatcher do not get DNS pinning.
The [architecture guide](ARCHITECTURE.md) explains the host checks and transport boundaries.

## Custom DNS resolvers

Use `dnsLookup` when system DNS cannot resolve your TestRail hostname or when you need a static mapping.
Each returned record must contain a valid IP address string and a matching numeric `family`: `4` for IPv4 or `6` for IPv6.
Missing families, `family: 0`, or mismatched families throw `TestRailValidationError` before dispatch, even if another record is valid.
If a resolver rejects or returns an empty answer, the client throws `TestRailApiError` with `status: 0`.
The client retries this error like other network errors. The failed attempt does not send a request.
Private-address checks still apply to each answer.

This configuration extends the `config` from [Create a client](SDK.md#create-a-client):

```typescript
import { lookup } from 'node:dns/promises';

const resolvedConfig = {
    ...config,
    dnsLookup: (hostname: string) => lookup(hostname, { all: true }),
};
// Static IPv4 alternative:
// dnsLookup: async () => [{ address: '203.0.113.10', family: 4 }]
// Static IPv6 answers must use family: 6.
```

Pass `resolvedConfig` to `new TestRailClient(...)`. Use the same `try`/`finally` cleanup pattern.
The resolver receives hostnames only.
The client classifies an IP-literal `baseUrl` directly and never calls `dnsLookup` for it.
`timeout` limits the DNS resolution time, even when the client cannot abort the lookup.

## Proxies and custom certificate authorities

With `allowPrivateHosts: false`, the client supplies a dedicated dispatcher for each request.
The dedicated dispatcher bypasses global Undici dispatchers, `NODE_USE_ENV_PROXY=1`, `--use-env-proxy`, `http.globalAgent`, and `https.globalAgent`.
Applications that use global `ProxyAgent`, `EnvHttpProxyAgent`, or TLS agent settings must configure the transport explicitly.
Node documents [per-request dispatchers](https://nodejs.org/api/globals.html#custom-dispatcher) and [global proxy configuration](https://nodejs.org/api/http.html#built-in-proxy-support).

For direct connections, set [`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) to your PEM bundle before you start Node.js.
This setting keeps certificate verification, hostname checks, and DNS pinning.
The client does not copy a custom global agent's `ca` setting.

For an HTTP proxy:

1. Configure the proxy to allow only your TestRail origin. Configure it to block private and link-local destination IP addresses.
2. Supply a custom `fetch` function that selects the proxy dispatcher and keeps `init.signal` and `redirect: 'manual'`.

In the example that follows, your application has installed `undici` and has defined the credentials in `config`:

```typescript
import { TestRailClient } from '@dichovsky/testrail-api-client';
import { ProxyAgent } from 'undici'; // Installed by your application

const approvedOrigin = 'https://your-domain.testrail.io';
const proxy = new ProxyAgent('https://approved-proxy.example:8443');
const proxyFetch: typeof globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin !== approvedOrigin) throw new Error('Unexpected TestRail origin');
    return globalThis.fetch(input, { ...init, dispatcher: proxy });
};

try {
    const client = new TestRailClient({
        ...config,
        baseUrl: approvedOrigin,
        allowPrivateHosts: false,
        fetch: proxyFetch,
    });
    try {
        console.log(await client.projects.getProjects());
    } finally {
        client.destroy();
    }
} finally {
    await proxy.close();
}
```

The proxy does the last DNS lookup. The proxy must apply destination IP checks.
Local DNS validation cannot validate that second lookup. An origin allowlist alone does not prevent DNS rebinding.
If the proxy cannot apply this policy, the package has no safe automatic proxy fallback.
Use `allowPrivateHosts: true` only for trusted private destinations with separate network controls.
