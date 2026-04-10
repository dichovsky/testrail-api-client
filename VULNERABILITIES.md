# Vulnerability Report — testrail-api-client

Analyzed files: `src/client-core.ts`, `src/client.ts`, `src/utils.ts`, `src/errors.ts`, `src/types.ts`

---

## VULN-01 — HTTP not blocked, credentials sent in cleartext

**Severity:** HIGH  
**Location:** `src/client-core.ts:108-113`

### Description

When `baseUrl` uses `http:`, the constructor emits only a `console.warn`. The client proceeds normally, sending `Authorization: Basic <base64>` over an unencrypted connection. Since Basic auth is base64 — not encryption — any network observer can trivially recover `email:apiKey`.

```ts
if (url.protocol === 'http:') {
    console.warn('Security Warning: Using HTTP protocol...');
    // execution continues normally — no throw
}
```

### Impact

Full credential compromise over any unencrypted link (LAN, proxy, Wi-Fi).

### Proof of concept

```ts
const client = new TestRailClient({ baseUrl: 'http://testrail.internal', email: 'a@b.com', apiKey: 'secret' });
// No error thrown. Every request sends Authorization: Basic YUBiLmNvbTpzZWNyZXQ=
// $ echo YUBiLmNvbTpzZWNyZXQ= | base64 -d  →  a@b.com:secret
```

---

## VULN-02 — Server-controlled unbounded sleep via `Retry-After`

**Severity:** HIGH  
**Location:** `src/client-core.ts:160-180`, `src/client-core.ts:391-395`

### Description

`parseRetryAfterMs` applies no upper bound to the value returned by a server's `Retry-After` header. A malicious or compromised TestRail server can return an arbitrarily large delay, freezing the client process for an unlimited duration.

Both numeric-seconds and HTTP-date formats are affected:

```ts
// Numeric: Retry-After: 2147483647  →  sleep(2147483647000) ≈ 68 years
const seconds = parseInt(retryAfter, 10);
if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000;
}

// HTTP-date: Retry-After: Sat, 01 Jan 2099 00:00:00 GMT  →  sleep(~73 years)
const date = new Date(retryAfter);
const delayMs = date.getTime() - Date.now();
return delayMs > 0 ? delayMs : null;
```

The result is passed uncapped to `sleep(delay)` and then the call recurses — up to `maxRetries` times, each with an unbounded delay.

### Impact

Denial of service: any 429 response (or 5xx with a spoofed Retry-After) can permanently stall the process.

---

## VULN-03 — SSRF — no restriction on `baseUrl` host

**Severity:** MEDIUM  
**Location:** `src/client-core.ts:101-116`, `src/client-core.ts:362`

### Description

The URL validator only checks that the scheme is `http` or `https`. It accepts any host, including localhost, RFC 1918 addresses, link-local metadata endpoints, and loopback. All requests carry a full `Authorization` header.

```ts
const url = new URL(config.baseUrl);
if (!['http:', 'https:'].includes(url.protocol)) { throw … }
// No check on url.hostname
```

### Impact

In environments where `baseUrl` can be influenced by user-supplied data (e.g., multi-tenant apps, CI config from untrusted sources), an attacker can pivot the authenticated HTTP client to probe internal services:

```
baseUrl: "http://169.254.169.254/latest/meta-data"
baseUrl: "http://localhost:8080/admin"
baseUrl: "http://internal-postgres:5432"
```

---

## VULN-04 — Credentials stored as reversible base64 in instance memory

**Severity:** MEDIUM  
**Location:** `src/client-core.ts:65`

### Description

The constructor encodes `email:apiKey` as base64 and stores it as a long-lived instance field:

```ts
this.auth = base64Encode(`${config.email}:${config.apiKey}`);
```

Base64 is encoding, not encryption. Any heap dump, core file, V8 snapshot, or memory inspection exposes the raw credential. The field persists until `destroy()` is called (or the process exits).

### Impact

Credential extraction from process memory, crash dumps, or leak via serialization (e.g., `JSON.stringify(client)` is harmless here since fields are `private`, but subclasses or misuse could expose `this`).

---

## VULN-05 — `buildEndpoint` does not URL-encode values

**Severity:** MEDIUM  
**Location:** `src/client-core.ts:216-224`

### Description

`buildEndpoint` concatenates query parameters without encoding:

```ts
parts.push(`${key}=${String(value)}`);
```

Any string value containing `&`, `=`, `#`, or `%` is injected verbatim into the URL, allowing parameter injection. Current callers pass either numeric IDs (safe) or pre-encoded strings (`getUserByEmail` calls `encodeURIComponent` before passing). However the method is `protected`, meaning subclasses can call it with arbitrary string values without encoding.

### Impact

Parameter injection if a subclass or future caller passes an unencoded string — e.g., `buildEndpoint('get_cases/1', { filter: 'x&suite_id=999' })` appends `suite_id=999` as a second parameter.

---

## VULN-06 — `rateLimiter` config values not validated

**Severity:** LOW  
**Location:** `src/client-core.ts:72-76`, `src/client-core.ts:88-148`

### Description

`config.rateLimiter.maxRequests` and `config.rateLimiter.windowMs` are not validated in `validateConfig`. Surprising values have silent, exploitable effects:

| Value             | Effect                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `maxRequests: 0`  | Every request throws a rate-limit error immediately                                                             |
| `maxRequests: -1` | Rate limiter never fires; `requests.length >= -1` is always true… wait, `>= -1` means it fires every time       |
| `windowMs: 0`     | Every timestamp is "outside the window"; rate limiter never accumulates; effectively disabled                   |
| `windowMs: -1`    | `windowStart = now - (-1) = now + 1`; all timestamps are before `windowStart`; window always empty; no limiting |

Setting `windowMs` to a negative or zero value silently disables rate limiting entirely, bypassing the intended protection.

---

## VULN-07 — Unbounded cache memory when `maxCacheSize: 0`

**Severity:** LOW  
**Location:** `src/client-core.ts:252-258`, `src/types.ts:28`

### Description

`maxCacheSize: 0` is documented as "unlimited (not recommended)" and causes the cache eviction guard to be skipped:

```ts
if (this.maxCacheSize > 0 && this.cache.size >= this.maxCacheSize) {
    // evict oldest — skipped when maxCacheSize is 0
}
```

A server returning unique responses per request (e.g., paginated queries or responses with timestamps) causes unbounded Map growth. In long-running processes or high-throughput scenarios, this leads to memory exhaustion and OOM crashes.

---

## VULN-08 — Full server response body stored in error objects

**Severity:** LOW  
**Location:** `src/errors.ts:10-13`, `src/client-core.ts:398-403`

### Description

`TestRailApiError` stores the raw HTTP response body from the server in its public `response` field:

```ts
throw new TestRailApiError(
    `TestRail API error: ${response.status} ${response.statusText} - ${errorText}`,
    response.status,
    response.statusText,
    errorText, // ← raw server body, potentially containing stack traces, internal paths, secrets
);
```

If calling code logs the error object (e.g., `console.error(err)`, `logger.error({ err })`), internal server details are written to application logs. The error message string itself already embeds `errorText`, compounding the risk.

### Impact

Information disclosure: server stack traces, internal paths, SQL errors, or tokens in error responses propagate into client-side logs.

---

## Summary

| ID      | Title                                                 | Severity |
| ------- | ----------------------------------------------------- | -------- |
| VULN-01 | HTTP not blocked — credentials in cleartext           | HIGH     |
| VULN-02 | Unbounded `Retry-After` sleep — server-controlled DoS | HIGH     |
| VULN-03 | SSRF — no host restriction on `baseUrl`               | MEDIUM   |
| VULN-04 | Credentials stored as reversible base64 in memory     | MEDIUM   |
| VULN-05 | `buildEndpoint` does not URL-encode values            | MEDIUM   |
| VULN-06 | `rateLimiter` config values not validated             | LOW      |
| VULN-07 | Unbounded cache when `maxCacheSize: 0`                | LOW      |
| VULN-08 | Full server response body stored in error objects     | LOW      |
