# Contributing

Thanks for taking the time. This repo is opinionated in ways that are not
obvious from the outside, so this file covers the parts that will otherwise
cost you a review round.

Security reports go through [SECURITY.md](SECURITY.md), never a public issue.

## Setup

Node 24 (see `.nvmrc`); the package declares `engines: >=24`.

```bash
npm ci
npm run build
npm test
```

`.npmrc` sets `ignore-scripts=true`, so nothing runs lifecycle hooks on install.
Build and codegen are always explicit `npm run` invocations.

## The gate you have to pass

`pretest` runs the whole chain, and CI runs it again:

```bash
npm run typecheck        # TypeScript 7
npm run typecheck:ts6    # TypeScript 6 compatibility — both must pass
npm run lint
npm run format:check
npm run codemap:check    # generated-artifact drift
npm run mapping:check
npm run agents-md:check
npm run skill:check
npm run published:check
npm run lockfile-lint
npm test
```

Do not assume `npm test` triggers `pretest` — run the `:check` gates yourself
before pushing, rather than discovering them in CI.

## Generated files — never hand-edit

| File                  | Regenerate with     |
| --------------------- | ------------------- |
| `CODEMAP.md`          | `npm run codemap`   |
| `docs/API-MAPPING.md` | `npm run mapping`   |
| `AGENTS.md`           | `npm run agents-md` |
| `skill/SKILL.md`      | `npm run skill`     |

Each has a `:check` gate that fails the build on drift. Editing one by hand
produces a red CI run and a confusing diff.

## Adding an endpoint

The repo holds an absolute **layer-coverage invariant**: every `@testrail`-tagged
SDK method must be surfaced as at least one CLI command, and every CLI command
must be reachable through at least one skill recipe. Gates D and C2 enforce both
halves, and there is no sanctioned exemption — an endpoint is not done until its
CLI command and skill recipe land in the same change.

`CLAUDE.md` has the step-by-step recipes ("Add API endpoint", "Add CLI write
action", "Add CLI attachment-style action"). Follow them; they exist because
each step has been forgotten at least once.

## Conventions that will come up in review

- **One runtime dependency.** Zod. Do not add a second; that constraint is the
  product, not an accident.
- **No `any`.** Use `unknown` and narrow. The codebase currently has zero in
  real code.
- **Return new objects, never mutate in place.**
- **No hardcoded numbers.** Add a named export to `src/constants.ts`.
- **Validate IDs before any network call** — `validateId(id, 'name')` from
  `src/validation.ts` (`validateEntryId` for UUID plan-entry IDs).
- **Never swallow an error silently.** A `catch {}` must either convert the
  failure into something the caller can act on — rethrow, a structured error,
  a failure flag the caller checks — or carry a comment saying why ignoring it
  is safe. Most already do; add the comment to anything you touch that does
  not.

### Response schemas are widened, not narrowed

Response validation is **advisory** (see `CLAUDE.md`). TestRail's documentation
disagrees with its wire behavior often enough that every schema correction
shipped so far has widened a schema to admit a real response, never narrowed one
to reject an invalid one.

So: do not "fix" a response schema against the published docs. Back the change
with an observed response. `CLAUDE.md` states five numbered schema-authoring
conventions; `tests/schema-conventions.test.ts` statically enforces three of
them — §2 (responses use `.nullish()`, never `.optional()`; no format
validators), §3 (no `.extend()` across directions), §4 (payloads don't
reference response schemas). §1 (naming) and §5 (endpoint-level divergence)
are review-only: §5 turns on observed wire behavior, which no syntactic gate
can check.

## Tests

Tests come first — write the failing test, watch it fail, then fix. A test that
has never been seen red proves nothing about the code.

Coverage is high and the suite runs in seconds, so there is no reason to skip
it. `vitest.config.ts` enforces per-metric floors; dropping below one fails
CI, and an unreachable defensive branch needs a documented entry there rather
than silent headroom.

Put new tests in the existing file that owns the behavior rather than creating
a new one — `tests/` is large and the matching file almost always exists.

## Commits and PRs

Conventional commits: `type: description`, where type is one of
`feat`/`fix`/`refactor`/`docs`/`test`/`chore`/`perf`/`ci`. The body explains
**why**, not what — the diff already says what.

Keep refactors and features in separate commits.

A PR description should say what broke (or what was missing), what you changed,
and how you verified it. If you found a defect, quote the failing output.

## Releasing

Maintainer-only; see [docs/RELEASING.md](docs/RELEASING.md), which is
authoritative over any general npm-release advice. Publishing is triggered by a
published GitHub Release, not by a tag push.
