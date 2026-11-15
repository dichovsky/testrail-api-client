# Networking

The client validates the destination before each network attempt and rejects HTTP redirects.
Use this guide when connecting to a private TestRail server or configuring DNS, a proxy, or a certificate authority.
See [SDK configuration](SDK.md#configuration) for timeout and response-body limits.

[Private servers](#private-servers) · [Custom DNS resolvers](#custom-dns-resolvers) · [Proxies and certificate authorities](#proxies-and-custom-certificate-authorities)

## Private servers

By default, the client blocks these address ranges in both URL literals and DNS answers:

- Private, loopback, link-local, multicast, and reserved IPv4 addresses.
- CGNAT (`100.64.0.0/10`) and benchmarking (`198.18.0.0/15`) addresses.
- IPv4-mapped IPv6 addresses from blocked ranges.
- IPv6 transition ranges, including 6to4 and NAT64 prefixes `64:ff9b::/96` and `64:ff9b:1::/48`.

The default transport connects directly to validated IP addresses without another DNS lookup.
It retains the original hostname for TLS certificate verification and SNI.
DNS validation runs before each distinct network attempt, including retries; cache hits and callers sharing a request do not repeat it.

For a trusted TestRail server on a private network, set `allowPrivateHosts: true` with separate network controls.
This disables private-host validation and connection pinning, and ignores `dnsLookup`.
HTTPS remains required unless you separately set `allowInsecure: true`.
HTTP sends credentials in cleartext; use it only in isolated development environments.

Custom `fetch` implementations must honor the supplied Node dispatcher or enforce equivalent destination checks.
They must also preserve abort signals and manual redirect handling.
Transports that ignore the dispatcher do not inherit connection pinning.
The [architecture guide](ARCHITECTURE.md) explains the host checks and transport boundaries.

## Custom DNS resolvers

Use `dnsLookup` when system DNS cannot resolve your TestRail hostname or when you need a static mapping.
Each returned record must contain a valid IP address string and a matching numeric `family`: `4` for IPv4 or `6` for IPv6.
Missing families, `family: 0`, or mismatched families throw `TestRailValidationError` before dispatch, even if another record is valid.
Private-address checks still apply to every answer.

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

Pass `resolvedConfig` to `new TestRailClient(...)` and use the same `try`/`finally` cleanup pattern.
The resolver receives the bare hostname, without brackets for IPv6 literals.
`timeout` bounds DNS resolution even when the underlying lookup cannot be cancelled.

## Proxies and custom certificate authorities

With `allowPrivateHosts: false`, the client supplies a dedicated dispatcher for each request.
This bypasses global Undici dispatchers, `NODE_USE_ENV_PROXY=1`, `--use-env-proxy`, `http.globalAgent`, and `https.globalAgent`.
Applications that rely on global `ProxyAgent`, `EnvHttpProxyAgent`, or TLS agent settings must configure the transport explicitly.
Node documents [per-request dispatchers](https://nodejs.org/api/globals.html#custom-dispatcher) and [global proxy configuration](https://nodejs.org/api/http.html#built-in-proxy-support).

For direct connections, set [`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) to your PEM bundle before starting Node.js.
This preserves certificate verification, hostname checks, and DNS pinning.
The client does not copy a custom global agent's `ca` setting.

For an HTTP proxy:

1. Configure the proxy to allow only your TestRail origin and block private and link-local destination IP addresses.
2. Supply a custom `fetch` function that selects the proxy dispatcher and preserves `init.signal` and `redirect: 'manual'`.

The following example assumes your application installed `undici` and defined the credentials in `config`:

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

The proxy performs the final DNS lookup and must enforce destination IP checks.
Local DNS validation cannot validate that second lookup, and an origin allowlist alone does not prevent DNS rebinding.
If the proxy cannot enforce this policy, the package has no safe automatic proxy fallback.
Use `allowPrivateHosts: true` only for trusted private destinations with separate network controls.
