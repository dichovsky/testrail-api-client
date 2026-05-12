# Implementation Plan: Addressing Audit Findings

## Requirements Restatement

- Abstract DNS resolution in `src/client-core.ts` to remove Node.js dependency.
- Harden DNS validation state tracking to prevent race conditions.
- Add exhaustive IPv6 and malformed IP testing for the DNS path.
- Decompose `TestRailClient` (1500+ LOC) into domain-specific sub-clients.
- Add a CI check for `CODEMAP.md` freshness.

## Implementation Phases

### Phase 1: Abstract DNS Resolution

- **Goal**: Remove tight coupling with `node:dns/promises` in `src/client-core.ts`.
- **Actions**:
    - Define a `DNSResolver` interface.
    - Implement `NodeDNSResolver` for Node.js environments.
    - Allow `TestRailClientCore` to accept an optional `DNSResolver` via configuration (defaulting to `NodeDNSResolver`).
    - Update `validatePublicHost` to use the injected resolver.
- **Verification**: Ensure existing tests pass and verify that a mock resolver can be used in tests.

### Phase 2: Harden DNS Validation

- **Goal**: Prevent race conditions in `awaitDnsValidation`.
- **Actions**:
    - Refactor `awaitDnsValidation` to use an explicit state (e.g., `IDLE`, `VALIDATING`, `COMPLETED`, `FAILED`).
    - Ensure that the validation promise is strictly awaited and errors are captured reliably before any request logic proceeds.
- **Verification**: Run existing tests; attempt to trigger concurrent requests during a slow DNS lookup (simulated via mock).

### Phase 3: Exhaustive DNS Testing

- **Goal**: Increase coverage for IPv6 transitions and malformed IP strings.
- **Actions**:
    - Add new test cases in `tests/client-edge-cases.test.ts`.
    - Include edge cases like: IPv6 loopback, IPv6 link-local, IPv4-mapped IPv6, malformed IPv6 addresses, and various malformed IP string formats.
- **Verification**: Run Vitest and ensure coverage remains high and all new tests pass.

### Phase 4: Decompose `TestRailClient`

- **Goal**: Reduce the complexity of the 1500+ LOC `src/client.ts` class.
- **Actions**:
    - Identify logical domains (e.g., `Project`, `Suite`, `Case`, `Run`).
    - Create domain-specific sub-clients (e.g., `ProjectClient`, `SuiteClient`) in new files or within `src/client.ts` if appropriate for size.
    - Refactor `TestRailClient` to compose these sub-clients.
    - Ensure the public API surface of `TestRailClient` remains unchanged (backward compatibility).
- **Verification**: Run all existing endpoint tests (`tests/client-endpoints.test.ts`) to ensure no regression in API functionality.

### Phase 5: CI Check for `CODEMAP.md`

- **Goal**: Prevent documentation drift.
- **Actions**:
    - Add a script or command to the `package.json` that verifies if `CODEMAP.md` matches the current `src/` state.
    - Update the CI configuration (if applicable) to run this check.
- **Verification**: Manually modify a file in `src/` and verify that the check fails, then run the regeneration script and verify it passes.

### Final Step: Pull Request Creation

- Create a comprehensive PR summarizing all changes, including the new tests and the architectural improvements.
