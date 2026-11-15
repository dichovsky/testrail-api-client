# Contributing

This document explains the repository rules, verification checks, and code conventions for contributors.

Report security vulnerabilities through [SECURITY.md](SECURITY.md). Do not open a public issue for security reports.

## Setup

Use Node 26 for local development (see `.nvmrc`). The package requires Node 26 or newer (`engines: >=26`).

```bash
npm ci
npm run verify
```

`.npmrc` sets `ignore-scripts=true`, so `npm ci` does not run lifecycle scripts automatically. Run build and code generation commands explicitly with `npm run`.

## Verification checks

Run `npm run verify` to build the project and execute all local verification checks. CI runs these same checks in separate steps:

```bash
npm run build           # Required before AGENTS.md check and package smoke test
npm run typecheck        # TypeScript 7 check
npm run typecheck:ts6    # TypeScript 6 compatibility check
npm run lint
npm run format:check
npm run codemap:check    # Check CODEMAP.md for drift
npm run mapping:check    # Check docs/API-MAPPING.md for drift
npm run agents-md:check  # Check AGENTS.md for drift
npm run skill:check      # Check skill files for drift
npm run published:check  # Check published version list in CHANGELOG.md
npm run lockfile-lint
npm run test:coverage
npm run package:smoke -- --prepared
```

`npm test` runs only the Vitest test suite. Because `.npmrc` disables implicit `pre` and `post` hooks, always run `npm run verify` before you push changes. CI also runs the fuzz test suite and dependency security audits.

## Generated files

Do not edit generated files manually. Use the corresponding `npm run` command to update them:

| File                                                                                                                              | Command             |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `CODEMAP.md`                                                                                                                      | `npm run codemap`   |
| `docs/API-MAPPING.md`                                                                                                             | `npm run mapping`   |
| `AGENTS.md`                                                                                                                       | `npm run agents-md` |
| `skill/SKILL.md` (generated sections), `skill/reference/commands.md` (generated sections), `skill/reference/payload-schemas.yaml` | `npm run skill`     |

Each generated file has a `:check` script that fails the build if the committed file does not match the generator output. You can directly edit the manual sections of `skill/SKILL.md`, `skill/reference/recipes.md`, and `skill/reference/typescript-api.md`. `npm run skill` keeps those manual sections unchanged.

## Add an endpoint

This repository enforces a strict layer-coverage rule:

1. Every SDK method with a `@testrail` tag must have at least one CLI command.
2. Every CLI command must have at least one skill recipe.

Gates D and C2 check both parts of this rule automatically. Do not add an endpoint without its CLI command and skill recipe in the same change.

Follow the step-by-step instructions in `CLAUDE.md` ("Add API endpoint", "Add CLI write action", and "Add CLI attachment-style action").

## Code conventions

- **Keep Zod as the only runtime dependency.** Do not add other runtime dependencies.
- **Do not use `any`.** Use `unknown` and narrow the type.
- **Do not mutate objects in place.** Always return new objects.
- **Do not hardcode numbers.** Export named constants from `src/constants.ts`.
- **Validate all IDs before network requests.** Call `validateId(id, 'name')` from `src/validation.ts` for numeric IDs, or `validateEntryId` for UUID plan-entry IDs.
- **Do not ignore errors silently.** Handle each error: rethrow it, return a structured error, or set a status flag that the caller checks.
  If you safely ignore an error, add a comment that explains why.

### Widen response schemas instead of narrowing them

Response validation is advisory (see `CLAUDE.md`). Live TestRail responses can differ from the published TestRail documentation. Widen response schemas when live responses include additional shapes or types. Do not make response schemas stricter based only on documentation.

`CLAUDE.md` defines five schema rules. `tests/schema-conventions.test.ts` checks three of these rules automatically:

- Rule 2: Response schemas must use `.nullish()` instead of `.optional()` and must not use format validators.
- Rule 3: Schemas must not call `.extend()` across request and response directions.
- Rule 4: Request payload schemas must not reference response schemas.

Reviewers check Rule 1 (naming) and Rule 5 (separate response schemas for divergent endpoints).

## Documentation style

Use [ASD-STE100 Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf) writing rules for repository documentation.

- Limit instructions to 20 words per sentence.
- Limit descriptions to 25 words per sentence.
- Use active voice and one instruction per procedural step.
- Use consistent technical terms and explain unfamiliar terms.
- Preserve API identifiers, command syntax, code literals, links, and historical facts.
- Edit generator sources before you regenerate generated documentation.

Sentence-length checks support review but do not certify compliance with the full standard.

## Tests

1. Write a test for the failure.
2. Run the test to verify that it fails.
3. Implement the fix.

`vitest.config.ts` enforces minimum coverage thresholds for lines, statements, functions, and branches. If you add an unreachable defensive branch, document it in `vitest.config.ts`.

Add new tests to the existing test file for that module instead of creating a new test file, when possible.

## Commits and pull requests

Use conventional commit messages in the format `type: description`. Valid types are `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, and `ci`. Explain the reason for the change in the commit body.

Keep refactoring changes and feature changes in separate commits.

In your pull request description, state the problem, the changes you made, and how you verified the result.
For defect fixes, include the failing output.

## Releases

Only the maintainer runs releases. Follow [docs/RELEASING.md](docs/RELEASING.md); its instructions take precedence over general npm release advice. Publishing starts when a GitHub Release is published, not when a git tag is pushed.
