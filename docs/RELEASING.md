# Releasing

Stable releases use `release/<version>` tags and the
[`Publish` workflow](../.github/workflows/publish.yml). Publishing a GitHub
Release starts verification; the `npm-publish` environment gates the separate
job that publishes the tested artifact through npm Trusted Publishing with
provenance. No persistent npm token is required.

## Prepare

1. Fetch `origin/main` and tags, inspect open pull requests and changes since
   the last published tag, and compare npm versions and `dist-tags.latest`.
   Choose a stable semantic version newer than every published stable version:
   fixes take a patch, additive features a minor, and breaking API changes a major.
2. Create a release branch from current `origin/main`. Update `package.json`
   and both root version fields in `package-lock.json` with
   `npm version <version> --no-git-tag-version --ignore-scripts`.
3. Move completed changes from `Unreleased` to a dated changelog entry, leaving
   an empty `Unreleased` section. Include compatibility notes, security fixes,
   and operational changes. Keep the npm release-history list aligned with
   the release being prepared and confirm publication before considering it final.
4. Audit README, architecture and agent guidance, examples, CLI help, and the
   manual sections of the bundled skill against the release changes. Preserve
   dated audits and archived plans as historical records. Every SDK endpoint
   must have CLI coverage and every CLI action a skill recipe.
5. Install the locked dependencies without lifecycle scripts, then regenerate
   every derived artifact. Do not hand-edit generated content.

```bash
npm ci --ignore-scripts --registry=https://registry.npmjs.org/
npm run agents-md
npm run skill
npm run mapping
npm run codemap
```

`agents-md` builds the client first. `skill` also regenerates the payload-schema
reference; `mapping` then uses the current skill recipe anchors. The CLI reads
its version from the package manifest, while skill and codemap versions are
generated.

## Validate and merge

Run all release gates explicitly; `.npmrc` disables implicit lifecycle scripts.
Format any edited files before checking them.

```bash
npm run typecheck
npm run typecheck:ts6
npm run lint
npm run format:check
npm run lockfile-lint
npm run test:coverage
RUN_FUZZ=1 npx vitest run tests/cli-fuzz.test.ts
npm audit --omit=dev --audit-level=moderate
npm run audit:dependencies
npm run build
npm run codemap:check
npm run mapping:check
npm run agents-md:check
npm run skill:check
npm run clean:maps
npm run package:smoke -- --prepared
```

Open a release PR with the version, release scope, compatibility notes, and
validation results. Wait for all CI jobs, including package smoke on the minimum
supported Node 20 and 22 versions, current Node 24, Windows, and macOS. Merge
the PR, fetch `main`, and verify its resulting commit and CI before tagging.
If other changes land before the merge, reassess the release contents and gates.

## Publish

1. Tag the verified merge commit as `release/<version>` and push that tag.
   Never move an existing release tag.
2. Publish a stable GitHub Release for that existing tag using the changelog
   entry as release notes. Mark it as latest. Use `--verify-tag` with
   `gh release create` so a typo cannot create a tag at an unintended commit.
3. Follow the `Publish` run. Verification checks the tag, event SHA, checkout,
   manifest, lockfile, and ancestry on `main`, then runs the release gates and
   archives the tested build. Registry checks require the new version to
   advance `latest` and all published stable versions.
4. Once verification passes, complete the configured `npm-publish` environment
   review through GitHub's normal approval mechanism. The publish job verifies
   the archived build's digest, rechecks registry state, and publishes with
   isolated npm configuration, OIDC authentication, and SLSA provenance.

## Verify after publication

- Require the complete `Publish` run to succeed. It checks npm version,
  `gitHead`, `latest`, SLSA provenance, and equality of every packed file with
  the tested build. After npm accepts publication, metadata verification polls
  for up to five minutes, bounding each lookup by the remaining deadline.
  Tarball lookups retry briefly for propagation; a content mismatch fails immediately.
- Independently read the exact version from the official npm registry and
  confirm `latest`, `gitHead`, and `dist.attestations` agree with the release.
- Install that exact registry version into an isolated temporary consumer with
  lifecycle scripts disabled. Check the SDK import, CLI version/help, a
  no-network write preview, and the bundled skill version and new CLI options.
  Do not use live TestRail writes for package smoke checks.
- Confirm the GitHub Release is public, stable, latest, and points to the
  verified commit. Keep `Unreleased` empty and remove the merged remote release
  branch. Record the release, npm package, and successful workflow links in the
  release handoff.

If publication or post-publication verification fails, inspect the exact npm
version before retrying. npm may accept an upload while the exact version still
returns 404 during processing; wait for the registry to expose it rather than
publishing again. npm versions are immutable: never republish different
contents under the same version. Rerun the entire workflow, including `verify`,
after publication succeeds but verification fails. Retrying only `publish`
reuses its earlier unpublished decision and fails the version-absence check.
The verification job recognizes an already published release only when its
identity, provenance, current `latest` tag, and packed contents all match.
A published artifact needing a code correction requires a new version.
