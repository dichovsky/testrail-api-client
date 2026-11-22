# Contributing

Use this guide to prepare the repository, make changes, and run the checks before a pull request.

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

The repository uses TypeScript 7 through the `typescript` package (`tsc`) for the build and the type check.
Oxlint is the linter. It uses `.oxlintrc.json` and runs type-aware rules through `oxlint-tsgolint`.
The code generators parse source through `scripts/ts-source.ts`, which uses the unstable TypeScript 7 API (`typescript/unstable/*`).
The package smoke test validates published declaration files with TypeScript 7.
Other compiler versions are not tested. TypeScript is not a runtime or peer dependency of the published package.

## Verification checks

Run `npm run verify` before you push changes. The command builds the package and runs the checks that follow.
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

`npm test` runs only Vitest. It does not run static or drift checks.
CI also runs fuzz tests and dependency security audits.
The [release checklist](docs/RELEASING.md#validate-and-merge) includes the commands for those additional checks.

During development, run a relevant test file with `npx vitest run tests/client-endpoints.test.ts`.
Run `npm run typecheck` before you commit.

## Generated files

Do not edit generated files manually. Use the `npm run` command in the table to update them:

| File                                                                                                                              | Command             |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `CODEMAP.md`                                                                                                                      | `npm run codemap`   |
| `docs/API-MAPPING.md`                                                                                                             | `npm run mapping`   |
| `AGENTS.md`                                                                                                                       | `npm run agents-md` |
| `skill/SKILL.md` (generated sections), `skill/reference/commands.md` (generated sections), `skill/reference/payload-schemas.yaml` | `npm run skill`     |

Each generator has a `:check` script that finds differences between its output and the committed files.
Edit `scripts/rules-content.ts` to change `AGENTS.md` prose. The `agents-md` command builds the package before it generates that file.

You can edit prose outside generated markers in `skill/SKILL.md` and `skill/reference/commands.md`.
The skill generator also writes `metadata.version` and the full payload-schema reference.
Recipes and `skill/reference/typescript-api.md` are handwritten. `npm run skill` keeps them unchanged.
Recipe headings and `recipe-for:` tags supply links in the API mapping.

After you change CLI metadata, schemas, or module method JSDoc tags, run all four generators above.

## Add an endpoint

This repository applies a strict layer-coverage rule:

1. Each SDK method with a `@testrail` tag must have at least one CLI command.
2. Each CLI command must have at least one skill recipe.

Gates D and C2 validate both parts of this rule automatically. Do not add an endpoint without its CLI command and skill recipe in the same change.

Follow the [endpoint and CLI procedures in CLAUDE.md](CLAUDE.md#common-tasks).

## Code conventions

- Keep Zod as the only runtime dependency.
- Use `unknown`, not `any`. Then narrow the type. Declare explicit parameter and return types on public APIs.
- Return new objects. Do not mutate inputs.
- Export named numeric constants from `src/constants.ts`.
- Validate IDs before network requests. Use `validateId(id, 'name')` for numeric IDs and `validateEntryId` for UUID plan-entry IDs. Both functions are in `src/validation.ts`.
- Handle errors in one of these ways: throw the error again, return a structured error, or set a status value that the caller examines.
  If you safely ignore an error, add a comment that explains why.

### Widen response schemas instead of narrowing them

Response validation is advisory. Live TestRail responses can differ from the published TestRail documentation.
Widen response schemas when live responses include additional shapes or types.
Do not make a response schema stricter if your only source is the documentation.

[CLAUDE.md](CLAUDE.md#schema-authoring-conventions-srcschemasts) defines five schema rules.
`tests/schema-conventions.test.ts` applies three of these rules automatically:

- Rule 2: Response schemas must use `.nullish()`, not `.optional()`. They must not use format validators.
- Rule 3: Schemas must not call `.extend()` across request and response directions.
- Rule 4: Request payload schemas must not reference response schemas.

Reviewers examine Rule 1 (naming) and Rule 5 (separate response schemas for divergent endpoints).

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
2. Run the test to make sure that it fails.
3. Write the fix.

`vitest.config.ts` applies minimum coverage thresholds for lines, statements, functions, and branches. If you add an unreachable defensive branch, record it in `vitest.config.ts`.

When possible, add new tests to the existing test file for that module, not to a new test file.

## Commits and pull requests

Use conventional commit messages in the format `type: description`. Valid types are `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, and `ci`. Explain the reason for the change in the commit body.

Keep refactoring changes and feature changes in separate commits.

In your pull request description, write these items:

- The problem.
- The changes that you made.
- How you made sure that the result is correct.

For defect fixes, include the failing output.

## Releases

Only the maintainer runs releases. Follow [the release checklist](docs/RELEASING.md). If general npm release advice is different, use the release checklist.
When you publish a GitHub Release, publication starts. When you only push a tag, publication does not start.
