# Implementation Plan: Refactor `src/client.ts` into domain-specific modules

## Context

The `src/client.ts` file has grown to over 1500 lines of code, making it difficult to maintain and navigate. The class contains all API endpoints for the TestRail service, ranging from project management to attachment handling. This monolithic structure violates the principle of single responsibility and increases the risk of accidental regressions during updates.

## Objective

Reduce the complexity of `src/client.ts` by decomposing the `TestRailClient` class into smaller, domain-specific modules while preserving the existing public API for backward compatibility.

## Proposed Architecture

The refactoring will move from a single monolithic class to a modular architecture where `TestRailClient` acts as a facade that composes several specialized sub-clients.

### New Directory Structure

```text
src/
├── client.ts             # Main entry point (retains TestRailClient class with delegation)
├── client-core.ts        # (Existing) Core HTTP, cache, and rate limiting logic
├── modules/              # New directory for domain-specific sub-clients
│   ├── projects.ts       # Project management methods
│   ├── suites.ts         # Suite management methods
│   ├── sections.ts       # Section management methods
│   ├── cases.ts          # Case management methods
│   ├── plans.ts          # Plan management methods
│   ├── runs.ts           # Run management methods
│   ├── results.ts        # Result management methods
│   └── users.ts          # User and permission management
├── types/                 # Shared type definitions and Zod schemas (if split from src/types.ts)
└── ...
```

### Implementation Phases

#### Phase 1: Infrastructure Setup & Module Creation

1.  **Define the Base Interface**: Create a pattern for sub-modules that take a reference to the `TestRailClientCore` or a shared request handler.
2.  **Create Module Scaffolding**: Set up the `src/modules/` directory and create initial files for the largest groups (Cases, Runs, Plans).
3.  **Extract Core Logic**: Move common utility methods used within `client.ts` (like `serializeIdList` or `validatePaginationParams`) to a more accessible location if they aren't already in `client-core.ts`.

#### Phase 2: Incremental Migration (The "Delegation" Pattern)

I will migrate methods group by group. For each group:

1.  **Identify all related methods**: Use the identified groupings from the exploration phase.
2.  **Implement Sub-client**: Create the new module (e.g., `src/modules/cases.ts`) and implement the logic there, delegating the underlying `request` calls to the core client.
3.  **Update `TestRailClient`**:
    - Add a property for the new module (e.g., `public readonly cases: CaseModule`).
    - Refactor the original method in `TestRailClient` to call the new module's method.
4.  **Verify**: Run existing tests to ensure no regressions were introduced by the movement of logic.

#### Phase 3: Backward Compatibility & Cleanup

1.  **Maintain Top-Level Methods**: Keep all original method signatures on the `TestRailClient` class as wrappers around the new module methods to prevent breaking changes for users.
2.  **Final Cleanup**: Once all methods are moved, remove the now-redundant code from `src/client.ts`.
3.  **Update CODEMAP.md**: Ensure the symbol index remains accurate with the new file locations.

## Critical Files to Modify

- `src/client.ts`: The primary target for reduction.
- `src/types.ts`: May need updates if types are moved closer to their respective modules.
- `src/index.ts`: To ensure all new modules and the refactored client are exported correctly.
- `CODEMAP.md`: Must be regenerated to reflect changes.

## Verification Plan

1.  **Automated Tests**: Run `npm test` after each module migration phase to ensure no functionality is lost. Specifically, focus on:
    - `tests/client-endpoints.test.ts` (Core CRUD)
    - `tests/client-features.test.ts` (Cache/Rate Limiting)
2.  **Type Checking**: Run `npm run typecheck` to ensure the new module structures and delegation don't introduce type errors or break existing interfaces.
3.  **API Integrity Check**: Use a small script to verify that calling `client.getProject(id)` (old way) and `client.projects.getProject(id)` (new way, if implemented) returns identical results.

## Risks & Mitigations

- **Risk: Breaking changes for users.**
    - _Mitigation_: Maintain all original method signatures on the `TestRailClient` class.
- **Risk: Regression in complex logic (e.g., pagination/filtering).**
    - _Mitigation_: Strict adherence to TDD and running the full test suite after every file movement.
- **Risk: Circular dependencies.**
    - _Mitigation_: Use a clear dependency hierarchy where modules depend on `client-core` but not vice-versa, and the main `client.ts` coordinates everything.

**Estimated Complexity: HIGH** (due to the scale of the class and importance of backward compatibility)
