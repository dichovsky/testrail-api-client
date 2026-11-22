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
`tests/schema-conventions.test.ts` validates three of these rules automatically:

- Rule 2: Response schemas must use `.nullish()`, not `.optional()`. They must not use format validators.
- Rule 3: Schemas must not call `.extend()` across request and response directions.
- Rule 4: Request payload schemas must not reference response schemas.

Reviewers examine Rule 1 (naming) and Rule 5 (separate response schemas for divergent endpoints).

## Documentation style

Write repository documentation in ASD-STE100 Simplified Technical English (STE), [Issue 9, 2025-01-15](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf).
ASD owns the copyright of the specification. Do not copy its text or its dictionary entries into this repository.

### Scope

These rules apply to:

- `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CONTEXT.md`, `BACKLOG.md`, and the guides in `docs/`.
- Doc comments (`/** */`) on the public API in `src/`, and the comments in `examples/`.
- Agent instruction files (`CLAUDE.md`, `scripts/rules-content.ts`, and the handwritten parts of `skill/`). A wording change in these files must not add, remove, weaken, or strengthen an instruction.

Do not apply these rules to:

- Historical records. These are the published entries in `CHANGELOG.md` and the documents in the historical-records table of `docs/README.md`.
- Generated files. Edit the generator source, then regenerate the file (see [Generated files](#generated-files)).
- Runtime strings: error messages, CLI output, and help text. Tests and users can depend on their exact text. Change a runtime string only in a separate change that updates each producer and consumer.
- Text in code blocks and backticks, identifiers, quoted text, and legal text.

### Writing rules

- Limit each procedural sentence (instruction) to 20 words.
- Limit each descriptive sentence to 25 words.
- Write about one topic in each paragraph. Use a maximum of six sentences in a paragraph.
- Write instructions in the imperative. Write one instruction in each sentence, unless the actions occur at the same time.
- Use the active voice in procedures. Use the active voice as much as possible in other text.
- Keep the articles "the", "a", and "an". Do not use a telegraphic style.
- Use vertical lists for sequences, conditions, and options.
- Put instructions separate from descriptive text.
- Start a warning with a short, clear command. Then give the reason. Do not weaken or remove a hazard.
- Use one word for one concept, and one meaning for one word. Use the terms in the [terminology table](#terminology).
- Do not use idioms. Do not use a phrasal verb when a single verb has the same meaning.
- Do not use "it", "this", or "that" without a clear noun. For example, write "This setting" or "The function".
- Do not use the -ing form of a verb after a preposition or "when". Write "before you start", not "before starting".
- Keep MUST, SHOULD, and MAY where a text uses them. Do not change the strength of "must", "should", "can", "required", or "optional".
- Keep API identifiers, command syntax, code literals, links, anchors, and historical facts.
- Explain a term that a reader possibly does not know.

### Words

Use the words of the STE dictionary, with their approved meaning and part of speech.
You can also use technical nouns (STE rule 1.5) and technical verbs (STE rule 1.12).
Use a technical verb only when no approved verb gives the same meaning.

When an approved word has the same meaning, use it:

| Do not use                                    | Use                                             |
| --------------------------------------------- | ----------------------------------------------- |
| every                                         | each (one item at a time) or all (the full set) |
| verify, ensure (an instruction to the reader) | make sure                                       |
| provide                                       | give, supply                                    |
| preserve, retain                              | keep                                            |
| remain                                        | stay                                            |
| cover (include)                               | include                                         |
| trigger (v)                                   | start, cause                                    |
| once (conjunction)                            | after, when                                     |
| via                                           | through                                         |
| invoke                                        | call                                            |
| library                                       | SDK or package                                  |
| exception                                     | error                                           |
| retrieve                                      | get                                             |
| might, may (possibility)                      | can                                             |
| instead of                                    | "X, not Y", or two sentences                    |
| enforce (a check or a policy)                 | apply                                           |
| honor (a setting or an object)                | use                                             |
| rely on, depend on                            | use, or "must have"                             |
| perform                                       | do                                              |
| final (last in a sequence)                    | last                                            |
| bound (v)                                     | limit                                           |
| denote, represent                             | be, show                                        |
| "Utility to ...", "Helper that ..."           | a full sentence, for example "Converts ..."     |

**Exceptions.** No approved word keeps the exact meaning of the general words that follow. You can use these words:

"never", "both", "any", "another", "per", "still", "even", "fail", "failure", "original", "existing", "own", "default", "separate", "valid", "invalid", "explicit", "automatically", "support", "required" (for a value or a flag), "create" (for an entity), "current", "optional", "explain", "describe", "need", "static", "policy", "trusted", "intentionally", "deliberately", "useful", "unchanged", "consumer", "mirror", "emit", "newer", "latest", "later", "reconcile", "precedence", "responsible", "prove", "guarantee", "omit", "indeterminate", "advisory", "defensive", "ambiguous", "silent", "blindly", "historical", "precedent", and "possibly".

"Verify" is a technical verb only for signatures and provenance.

### Terminology

Categories: product name, technical noun (STE rule 1.5), technical verb (STE rule 1.12), and exception (a word with two meanings that this repository needs).

| Term               | Category                       | Meaning                                                                                                                                                                  | Do not use for this concept    |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| TestRail           | product name                   | The test management product and its HTTP API                                                                                                                             | —                              |
| package            | technical noun                 | The npm release `@dichovsky/testrail-api-client`                                                                                                                         | library, bundle                |
| SDK                | technical noun                 | The programmatic TypeScript API of the package                                                                                                                           | library, wrapper               |
| client             | technical noun                 | A `TestRailClient` instance                                                                                                                                              | SDK object, instance (alone)   |
| CLI                | technical noun                 | The `testrail` command-line program                                                                                                                                      | tool                           |
| command            | technical noun                 | A complete CLI command, for example `testrail case get`                                                                                                                  | subcommand                     |
| resource           | technical noun                 | The first word of a CLI command, for example `case`                                                                                                                      | entity (for CLI words)         |
| action             | technical noun                 | The second word of a CLI command and its `ActionSpec`                                                                                                                    | verb, operation                |
| flag               | technical noun                 | A CLI argument that starts with `--`                                                                                                                                     | option, switch (for CLI)       |
| option             | technical noun                 | A property of `TestRailConfig` or of an SDK options object                                                                                                               | setting, flag                  |
| endpoint           | technical noun                 | A TestRail API path, for example `get_case/{case_id}`                                                                                                                    | route, URL, API (alone)        |
| request            | technical noun                 | One HTTP request that the client sends                                                                                                                                   | call (for HTTP), query         |
| call               | technical verb, technical noun | To start an SDK method or a function; one such start                                                                                                                     | invoke, request (for methods)  |
| response           | technical noun                 | The HTTP response from TestRail                                                                                                                                          | reply, answer                  |
| attempt            | technical noun                 | One dispatch of a request; each retry is a new attempt                                                                                                                   | try (n)                        |
| retry              | technical verb, technical noun | To send a failed request again; one such attempt                                                                                                                         | re-send, repeat                |
| error              | technical noun                 | A thrown `Error` object, or an HTTP error status                                                                                                                         | exception                      |
| failure            | exception                      | An operation that does not complete correctly                                                                                                                            | fault, crash                   |
| validate           | technical verb                 | To make sure, in code, that a value is correct, and reject it if not                                                                                                     | check (v), verify              |
| validation         | technical noun                 | The checks that the code runs on configuration, input, or response data                                                                                                  | verification                   |
| check              | technical noun                 | An `npm run *:check` script, a CI step, or a manual examination step                                                                                                     | gate (for scripts)             |
| gate               | technical noun                 | A named mapping check (Gate A–D, C2) or a requirement that a destructive action must meet                                                                                | check (for these)              |
| make sure          | approved word                  | An instruction to the reader to confirm a condition                                                                                                                      | verify, ensure                 |
| delete             | technical verb                 | To erase server data through the API or the CLI                                                                                                                          | remove (for server data)       |
| remove             | approved word                  | To take an item out locally: a file, a flag, a cache entry, code                                                                                                         | delete (for local items)       |
| schema             | technical noun                 | A Zod schema in `src/schemas/`                                                                                                                                           | model, type (for schemas)      |
| payload            | technical noun                 | The JSON object that the caller supplies for a write                                                                                                                     | data, body (for that object)   |
| body               | technical noun                 | The bytes of an HTTP request or response                                                                                                                                 | payload (for raw bytes)        |
| hook               | technical noun                 | A caller function that the client calls, for example `onSchemaMismatch`                                                                                                  | callback (for config hooks)    |
| schema mismatch    | technical noun                 | A response that does not match its Zod schema                                                                                                                            | schema error, drift            |
| cache              | technical noun, technical verb | The client GET response cache (`RequestCache`); to keep a response in it                                                                                                 | memoize                        |
| page               | technical noun                 | One response of a paginated endpoint (`Page<T>`)                                                                                                                         | batch, chunk                   |
| private host       | technical noun                 | A host whose address is in a blocked range                                                                                                                               | internal host                  |
| DNS pinning        | technical noun                 | Connection only to the validated IP addresses, with the hostname kept for TLS                                                                                            | connection pinning, IP pinning |
| dispatcher         | technical noun                 | An Undici dispatcher that opens connections                                                                                                                              | agent (for Undici dispatchers) |
| transport          | technical noun                 | The `fetch` function and its dispatcher, which send the bytes                                                                                                            | network layer                  |
| timeout            | technical noun                 | A configured time limit (`timeout`, `bodyTimeout`)                                                                                                                       | time-out                       |
| deadline           | technical noun                 | The time at which a timeout expires                                                                                                                                      | cutoff                         |
| dry run            | technical noun                 | A local `--dry-run` preview that sends no request                                                                                                                        | simulation                     |
| soft mode          | technical noun                 | A server-side preview of a delete: `--soft` in the CLI, `{ soft: true }` in the SDK                                                                                      | preview mode                   |
| destructive action | technical noun                 | A CLI command that deletes data or closes a run or plan                                                                                                                  | dangerous command              |
| upload, download   | technical verb, technical noun | To send a file to TestRail; to get a file from TestRail                                                                                                                  | attach, fetch (for files)      |
| descriptor         | technical noun                 | A file descriptor                                                                                                                                                        | handle                         |
| generator          | technical noun                 | A script in `scripts/` that writes a generated file                                                                                                                      | builder                        |
| generated file     | technical noun                 | A file that a generator writes; edit its source, not the file                                                                                                            | output (alone)                 |
| recipe             | technical noun                 | A numbered CLI procedure in `skill/reference/recipes.md`                                                                                                                 | example (for recipes)          |
| skill              | technical noun                 | The bundled agent skill in `skill/`                                                                                                                                      | plugin                         |
| run (n)            | technical noun                 | A TestRail test run                                                                                                                                                      | execution                      |
| run (v)            | technical verb                 | To start a command, a script, or a test                                                                                                                                  | execute, launch                |
| test               | technical noun, exception      | (1) A TestRail test. (2) A Vitest test in `tests/`. Write "TestRail test" or "Vitest test" when the context is not clear                                                 | —                              |
| result             | technical noun, exception      | A TestRail result. The general meaning ("that which is caused") is also approved. Write "TestRail result" when the context is not clear                                  | outcome                        |
| configuration      | technical noun, exception      | (1) Client configuration (`TestRailConfig`). (2) A TestRail configuration entity. Write "client configuration" or "TestRail configuration" when the context is not clear | config (in prose)              |
| safety limit       | TN                             | A maximum for an aggregate read: pages, items, duration, or bytes                                                                                                        | safety bound                   |

Other terms with their usual meaning:

- TestRail entities (technical nouns): case, plan, plan entry, project, suite, section, milestone, attachment, label, dataset, variable, report, user, group, role, status, priority, template.
- Software terms (technical nouns): envelope, wrapper, snapshot, passthrough, allowlist, barrel, major/minor/patch version.
- Computer processes (technical verbs): parse, fetch, return, throw, catch, resolve, dispatch, abort, encode, decode, serialize, install, uninstall, configure, publish, build, compile, lint, commit, push, merge, tag, release, import, export, enable, disable, clear, load, store, filter, sort, print, log.

### Checks

After a documentation change, run these commands:

```bash
npm run format:check
npm run codemap        # After a doc comment change in src/
npm run verify         # Before you push
```

`npm run verify` includes the formatter check and the generated-file checks.

No check in this repository measures STE compliance.
Reviewers check the sentence length, the words, and the structure when they read the change.
A sentence-length count or a dictionary word check helps a review. It does not prove compliance with the standard.
Do not call a document compliant if it uses an exception or breaks a rule.

## Tests

1. Write a test for the failure.
2. Run the test to make sure that it fails.
3. Write the fix.

`vitest.config.ts` sets minimum coverage thresholds for lines, statements, functions, and branches. The test run fails below these thresholds. If you add an unreachable defensive branch, record it in `vitest.config.ts`.

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
