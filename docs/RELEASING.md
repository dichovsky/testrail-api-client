# Releasing

Only the maintainer runs releases. Stable releases use `release/<version>` tags and the [`Publish` workflow](../.github/workflows/publish.yml).
When you publish a GitHub Release, the workflow starts verification. A second job publishes the tested artifact through npm Trusted Publishing with provenance.
The workflow does not require a persistent npm token.

Use the [contributor setup](../CONTRIBUTING.md#setup) for local development. The publish workflow pins Node `26.13.1`.
The package requires Node 26 or newer. The CI matrix includes Node 26 on Linux, Windows, and macOS. Other major versions are outside the matrix.

> **Publication starts when you create the GitHub Release. An approval gate stops the workflow before the publish job.**
>
> The `publish` job uses `environment: npm-publish`.
> During the 8.0.0 release, this environment required approval from `dichovsky`.
> Earlier versions of this guide referred to issue #278 and incorrectly told readers that the environment had no configured reviewer.
>
> Administrators can remove the environment rule outside this repository.
> Examine the current rule before you publish the GitHub Release. Do not use the historical configuration as your only source.

## Prepare

1. Fetch `origin/main` and all tags.
2. Examine open pull requests and commits since the last release tag.
3. Compare published npm versions and `dist-tags.latest`.
4. Select a stable semantic version that is higher than all published stable versions.
   Use a patch version for fixes, a minor version for new features, and a major version for breaking API changes.
5. Create a release branch from `origin/main`.
6. Run `npm version <version> --no-git-tag-version --ignore-scripts`.
   The command updates `package.json` and both root version fields in `package-lock.json`.
7. Move completed items from `Unreleased` to a dated changelog section.
8. Leave an empty `Unreleased` section.
9. Include compatibility notes, security fixes, and operational changes in the release notes.
10. Add the new version to the npm release-history list.
    Publication must succeed before this list becomes final.
11. Compare the README, user guides, architecture docs, agent instructions, examples, CLI help, and manual skill sections with the release changes.
    Dated audits and archived plans stay historical records.
    For a major release, also update the supported-versions table in `SECURITY.md`.
12. Make sure that each SDK endpoint has a CLI action and each CLI action has a skill recipe.
13. Install the locked dependencies without lifecycle scripts:

```bash
npm ci --ignore-scripts --registry=https://registry.npmjs.org/
```

14. Regenerate all derived artifacts:

```bash
npm run agents-md
npm run skill
npm run mapping
npm run codemap
```

Follow the [generated-file ownership rules](../CONTRIBUTING.md#generated-files).
The `agents-md` script builds the package first. The `skill` script also updates the payload-schema reference.
The `mapping` script validates the current skill recipe anchors.
The CLI reads its version from `package.json`. Generators write the version into the skill and codemap files.

For the 10.0.0 release, keep these upgrade notes in the README and changelog:

- Node.js 26 is the minimum runtime for applications, CLI commands, and CI jobs.
- SDK upload methods own supplied file descriptors even when validation rejects the call. Link to [upload ownership](SDK.md#upload-files).
- Endpoint response validation bypasses public `parse()` overrides. Link to the [response validation migration](SDK.md#response-validation).
- TypeScript 7 is the repository compiler and the tested consumer compiler, not a runtime or peer dependency.

For the 9.0.0 DNS-pinning release, the required breaking-change notes included these changes:

- Global proxy and custom agent bypass.
- The strict `dnsLookup` address-family contract.
- Forced output paths that accept only regular files.

Keep links to the [proxy and CA migration](NETWORKING.md#proxies-and-custom-certificate-authorities), [DNS resolver migration](NETWORKING.md#custom-dns-resolvers), and [CLI stdout discard example](CLI.md#output-and-exit-codes).
Do not tell users to disable private-host validation.

## Validate and merge

Format modified files first. Run [standard repository verification](../CONTRIBUTING.md#verification-checks). Then run the additional release checks:

```bash
npm run verify
RUN_FUZZ=1 npx vitest run tests/cli-fuzz.test.ts
npm audit --omit=dev --audit-level=moderate
npm run audit:dependencies
```

If `audit-ci.jsonc` has allowlist entries, make sure that each `expiry` date is later than the planned publish date.
The `Publish` workflow runs the same audit after the tag exists.

1. Open a release pull request with the version, scope, compatibility notes, and validation results.
2. Wait for all CI jobs to pass.
   CI runs package smoke and transport tests on Node 26 across Linux, Windows, and macOS.
3. Merge the pull request.
4. Fetch `main`.
5. Before you create the tag, make sure that the merge commit and CI status are correct.

If other commits merge first, review the release scope again. Then run the checks again.

## Publish

1. Tag the verified merge commit on `main` as `release/<version>`.
2. Push the tag to `origin`.
   Never move an existing release tag.
3. Create a stable GitHub Release for that tag with the changelog section as its release notes.
   Pass `--verify-tag` to `gh release create` to prevent accidental tag creation on the wrong commit.
4. Mark the release as latest.
5. Monitor the `Publish` workflow run.
   The `verify` job validates the tag, event SHA, checkout, `package.json`, `package-lock.json`, and ancestry on `main`.
   It runs the release checks and uploads the tested build artifact.
   Registry checks require a version higher than `latest` and all published stable versions.
6. After verification, examine the live deployment approval status:

```bash
gh api "repos/<owner>/<repo>/actions/runs/<run-id>/pending_deployments"
```

A non-empty JSON array lists the environment and its required reviewers.
The job stays in the `waiting` state until a reviewer approves it.
An empty array means that no deployment currently waits for approval.
The possible causes are:

- Verification has not completed.
- The deployment has approval.
- The workflow failed.

To make sure that publication succeeded, examine the workflow jobs and the npm registry.

During the 8.0.0 release, this command returned `[{"environment":{"name":"npm-publish"},"reviewers":["dichovsky"]}]`.
The job waited until the reviewer approved it in the GitHub UI.

To examine the environment protection rules, run:

```bash
gh api "repos/<owner>/<repo>/environments/npm-publish" --jq '.protection_rules'
```

On 2026-09-20, the environment had one `required_reviewers` rule with one reviewer and `prevent_self_review: false`.
This configuration lets the release author approve their own deployment. It does not require independent peer review.

After approval, the `publish` job validates the artifact digest and validates the npm registry state again.
It publishes with isolated npm configuration, OIDC authentication, and SLSA provenance.

## Verify after publication

1. Wait until the full `Publish` workflow succeeds.
   The workflow verifies the npm version, `gitHead`, `latest` tag, SLSA provenance, and each packed file against the tested build.
   Metadata checks poll for up to five minutes after npm accepts the package.
   Each request uses the remaining deadline as its time limit.
   Tarball downloads retry for a short time during registry propagation. Content mismatches fail immediately.
2. Examine the new version directly in the official npm registry.
3. Make sure that `latest`, `gitHead`, and `dist.attestations` match the release commit.
4. Install the exact npm version into an isolated temporary directory with `--ignore-scripts`.
5. Make sure that you can import the SDK.
6. Examine the CLI `--version` and `--help` output.
7. Test a `--dry-run` write preview.
8. Examine the bundled skill version and the new CLI flags.
   Do not run live TestRail write commands during smoke tests.
9. Make sure that the GitHub Release is public, stable, latest, and linked to the verified merge commit.
10. Keep the `Unreleased` changelog section empty.
11. Delete the merged release branch from the remote repository.
12. Record the GitHub Release URL, npm package URL, and workflow run URL in the release notes or handoff.

## Recover from publication failures

If publication or verification fails, examine the exact npm version before you retry.
The registry can return HTTP 404 for a short time after it accepts an upload.
Wait until the registry has processed the upload before you try to publish again.
Never publish different files under an existing version number. Published npm versions cannot change.

If publication succeeds but verification fails, run the full workflow again, with the `verify` job.
A retry of only `publish` reuses the earlier pre-publish decision and fails because the version now exists.
The `verify` job accepts an existing version only when its identity, provenance, `latest` tag, and packed files match the current commit.
If a published package needs a code fix, prepare a new version.
