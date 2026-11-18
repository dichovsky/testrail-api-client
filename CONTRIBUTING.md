# Contributing

Use this guide to set up the repository, make changes, and verify them before a pull request.

For package usage, read the [SDK guide](docs/SDK.md) or [CLI guide](docs/CLI.md).
For implementation details, read [the architecture guide](docs/ARCHITECTURE.md) and [CLAUDE.md](CLAUDE.md).

Report security vulnerabilities through [SECURITY.md](SECURITY.md). Do not open a public issue for security reports.

## Setup

Use Node 26 for local development (see `.nvmrc`). The package requires Node 26 or newer (`engines: >=26`).

```bash
npm ci
npm run verify
```

`.npmrc` sets `ignore-scripts=true`, so `npm ci` does not run lifecycle scripts automatically. Run build and code generation commands explicitly with `npm run`.

TypeScript 7 is the only TypeScript. The build and type check use the `typescript` package (`tsc`).
Oxlint is the linter. It uses `.oxlintrc.json` and runs type-aware rules through `oxlint-tsgolint`.
The code generators parse source through `scripts/ts-source.ts`, which uses the unstable TypeScript 7 API (`typescript/unstable/*`).
The package smoke test checks published declaration files with TypeScript 7.

## Verification checks

Run `npm run verify` before pushing changes. It builds the package and runs the checks below.
CI runs these checks in separate steps.

```bash
npm run build           # Required before AGENTS.md check and package smoke test
npm run typecheck       # TypeScript 7 check
npm run lint            # Oxlint (type-aware)
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

`npm test` runs only Vitest; it does not run static or drift checks.
CI also runs fuzz tests and dependency security audits.
The [release checklist](docs/RELEASING.md#validate-and-merge) includes the commands for those additional checks.

During development, run a relevant test file with `npx vitest run tests/client-endpoints.test.ts`.
Run `npm run typecheck` before committing.

## Generated files

Do not edit generated files manually. Use the corresponding `npm run` command to update them:

| File                                                                                                                              | Command             |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `CODEMAP.md`                                                                                                                      | `npm run codemap`   |
| `docs/API-MAPPING.md`                                                                                                             | `npm run mapping`   |
| `AGENTS.md`                                                                                                                       | `npm run agents-md` |
| `skill/SKILL.md` (generated sections), `skill/reference/commands.md` (generated sections), `skill/reference/payload-schemas.yaml` | `npm run skill`     |

Each generator has a `:check` script that detects differences between its output and the committed files.
Edit `scripts/rules-content.ts` to change `AGENTS.md` prose. The `agents-md` command builds the package before generating that file.

You can edit prose outside generated markers in `skill/SKILL.md` and `skill/reference/commands.md`.
The skill generator also owns `metadata.version` and the entire payload-schema reference.
Recipes and `skill/reference/typescript-api.md` are handwritten; `npm run skill` preserves them.
Recipe headings and `recipe-for:` tags supply links in the API mapping.

After changing CLI metadata, schemas, or module method JSDoc tags, run all four generators above.

## Add an endpoint

This repository enforces a strict layer-coverage rule:

1. Every SDK method with a `@testrail` tag must have at least one CLI command.
2. Every CLI command must have at least one skill recipe.

Gates D and C2 check both parts of this rule automatically. Do not add an endpoint without its CLI command and skill recipe in the same change.

Follow the [endpoint and CLI procedures in CLAUDE.md](CLAUDE.md#common-tasks).

## Code conventions

- Keep Zod as the only runtime dependency.
- Use `unknown` instead of `any`, then narrow the type. Declare explicit parameter and return types on public APIs.
- Return new objects instead of mutating inputs.
- Export named numeric constants from `src/constants.ts`.
- Validate IDs before network requests. Use `validateId(id, 'name')` for numeric IDs and `validateEntryId` for UUID plan-entry IDs, both from `src/validation.ts`.
- Handle errors by rethrowing, returning a structured error, or setting a status flag that the caller checks.
  If you safely ignore an error, add a comment that explains why.

### Widen response schemas instead of narrowing them

Response validation is advisory. Live TestRail responses can differ from the published TestRail documentation.
Widen response schemas when live responses include additional shapes or types.
Do not make response schemas stricter based only on documentation.

[CLAUDE.md](CLAUDE.md#schema-authoring-conventions-srcschemasts) defines five schema rules.
`tests/schema-conventions.test.ts` checks three of these rules automatically:

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

Only the maintainer runs releases. Follow [the release checklist](docs/RELEASING.md); it takes precedence over general npm release advice.
Publishing a GitHub Release starts publication. Pushing a tag alone does not.
