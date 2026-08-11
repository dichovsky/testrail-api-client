import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    EXPECTED_PACKAGE_NAME,
    SLSA_PROVENANCE_PREDICATE,
    parseLockfileIdentity,
    parseNpmStringList,
    parseNpmViewResult,
    parsePackageIdentity,
    shouldSkipPublishedVersion,
    validateNewStableVersion,
    validateNpmDiffResult,
    validateReleaseContext,
    validateTrustedPublishingNodeVersion,
    validateTrustedPublishingNpmVersion,
    type ReleaseContextInput,
} from '../scripts/release-preflight.js';

const VERSION = '6.0.0';
const RELEASE_SHA = '1234567890abcdef1234567890abcdef12345678';
const IDENTICAL_PUBLISHED_METADATA = {
    version: VERSION,
    gitHead: RELEASE_SHA,
    latestVersion: VERSION,
    provenancePredicate: SLSA_PROVENANCE_PREDICATE,
} as const;

function validContext(overrides: Partial<ReleaseContextInput> = {}): ReleaseContextInput {
    return {
        packageIdentity: { name: EXPECTED_PACKAGE_NAME, version: VERSION },
        lockfileIdentity: { name: EXPECTED_PACKAGE_NAME, version: VERSION },
        eventName: 'release',
        releaseAction: 'published',
        releaseDraft: 'false',
        releasePrerelease: 'false',
        releaseTag: `release/${VERSION}`,
        githubRef: `refs/tags/release/${VERSION}`,
        githubSha: RELEASE_SHA,
        headSha: RELEASE_SHA,
        tagSha: RELEASE_SHA,
        mainContainsRelease: true,
        ...overrides,
    };
}

describe('release context validation', () => {
    it('accepts one exact stable release identity', () => {
        expect(validateReleaseContext(validContext())).toEqual({
            name: EXPECTED_PACKAGE_NAME,
            version: VERSION,
        });
    });

    it.each([
        ['package name', { packageIdentity: { name: '@example/other', version: VERSION } }],
        ['lockfile name', { lockfileIdentity: { name: '@example/other', version: VERSION } }],
        ['lockfile version', { lockfileIdentity: { name: EXPECTED_PACKAGE_NAME, version: '5.3.0' } }],
        ['prerelease package version', { packageIdentity: { name: EXPECTED_PACKAGE_NAME, version: '6.0.0-rc.1' } }],
        ['event name', { eventName: 'workflow_dispatch' }],
        ['event action', { releaseAction: 'created' }],
        ['draft release', { releaseDraft: 'true' }],
        ['prerelease release', { releasePrerelease: 'true' }],
        ['release tag', { releaseTag: 'v6.0.0' }],
        ['GitHub ref', { githubRef: 'refs/heads/main' }],
        ['GitHub SHA', { githubSha: '1234' }],
        ['checked-out SHA', { headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }],
        ['tag target SHA', { tagSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }],
        ['origin/main ancestry', { mainContainsRelease: false }],
    ])('rejects a mismatched %s', (_label, overrides) => {
        expect(() => validateReleaseContext(validContext(overrides))).toThrow();
    });
});

describe('release manifest parsing', () => {
    it('reads package and lockfile identities from unknown JSON values', () => {
        expect(parsePackageIdentity({ name: EXPECTED_PACKAGE_NAME, version: VERSION }, 'package.json')).toEqual({
            name: EXPECTED_PACKAGE_NAME,
            version: VERSION,
        });
        expect(
            parseLockfileIdentity({
                name: EXPECTED_PACKAGE_NAME,
                version: VERSION,
                packages: { '': { name: EXPECTED_PACKAGE_NAME, version: VERSION } },
            }),
        ).toEqual({ name: EXPECTED_PACKAGE_NAME, version: VERSION });
    });

    it.each([
        null,
        [],
        {},
        { packages: {} },
        { name: EXPECTED_PACKAGE_NAME, version: VERSION, packages: { '': { name: EXPECTED_PACKAGE_NAME } } },
        {
            name: EXPECTED_PACKAGE_NAME,
            version: '5.3.0',
            packages: { '': { name: EXPECTED_PACKAGE_NAME, version: VERSION } },
        },
    ])('rejects malformed lockfile identity %#', (value) => {
        expect(() => parseLockfileIdentity(value)).toThrow();
    });
});

describe('npm registry preflight', () => {
    it('normalizes npm scalar and array JSON output', () => {
        expect(parseNpmStringList(JSON.stringify(VERSION), 'version')).toEqual([VERSION]);
        expect(parseNpmStringList(JSON.stringify(['5.3.0', VERSION]), 'versions')).toEqual(['5.3.0', VERSION]);
    });

    it('accepts npm versions that support Trusted Publishing', () => {
        expect(() => validateTrustedPublishingNpmVersion('11.5.1')).not.toThrow();
        expect(() => validateTrustedPublishingNpmVersion('12.0.2')).not.toThrow();
    });

    it.each(['11.5.0', '10.9.9', '11.5.1-beta.1', 'not-a-version'])('rejects unsupported npm version %s', (version) => {
        expect(() => validateTrustedPublishingNpmVersion(version)).toThrow();
    });

    it('accepts Node versions that support Trusted Publishing', () => {
        expect(() => validateTrustedPublishingNodeVersion('22.14.0')).not.toThrow();
        expect(() => validateTrustedPublishingNodeVersion('24.6.0')).not.toThrow();
    });

    it.each(['22.13.9', '20.19.0', '22.14.0-rc.1', 'not-a-version'])(
        'rejects unsupported Node version %s',
        (version) => {
            expect(() => validateTrustedPublishingNodeVersion(version)).toThrow();
        },
    );

    it('parses present metadata and treats only an exact E404 as absence', () => {
        expect(
            parseNpmViewResult(
                0,
                JSON.stringify([
                    {
                        version: VERSION,
                        gitHead: RELEASE_SHA,
                        'dist-tags.latest': VERSION,
                        'dist.attestations': {
                            provenance: { predicateType: SLSA_PROVENANCE_PREDICATE },
                        },
                    },
                ]),
            ),
        ).toEqual(IDENTICAL_PUBLISHED_METADATA);
        expect(parseNpmViewResult(1, JSON.stringify({ error: { code: 'E404' } }))).toBeNull();
    });

    it.each([
        [1, JSON.stringify({ error: { code: 'E403' } })],
        [1, JSON.stringify({ error: { code: 'ETIMEDOUT' } })],
        [1, 'not-json'],
        [0, ''],
        [0, JSON.stringify([{ version: VERSION }, { version: VERSION }])],
    ])('fails closed for npm status %i and output %j', (status, output) => {
        expect(() => parseNpmViewResult(status, output)).toThrow();
    });

    it('allows only a strictly monotonic stable version', () => {
        expect(() =>
            validateNewStableVersion({
                candidateVersion: VERSION,
                publishedVersions: ['5.2.1', '5.3.0', '6.0.0-rc.1'],
                latestVersion: '5.3.0',
            }),
        ).not.toThrow();
        expect(() =>
            validateNewStableVersion({
                candidateVersion: '9007199254740993.0.0',
                publishedVersions: ['9007199254740992.999999999999999999.999999999999999999'],
                latestVersion: '9007199254740992.999999999999999999.999999999999999999',
            }),
        ).not.toThrow();
    });

    it.each([
        ['equal latest', '5.3.0', ['5.2.1', '5.3.0'], '5.3.0'],
        ['below latest', '5.2.2', ['5.2.1', '5.3.0'], '5.3.0'],
        ['below hidden stable', '5.4.0', ['5.3.0', '6.0.0'], '5.3.0'],
        ['empty versions', VERSION, [], '5.3.0'],
        ['missing latest', VERSION, ['5.2.1'], '5.3.0'],
        ['prerelease latest', VERSION, ['5.3.0', '6.0.0-rc.1'], '6.0.0-rc.1'],
    ])('blocks non-monotonic registry state: %s', (_label, candidateVersion, publishedVersions, latestVersion) => {
        expect(() => validateNewStableVersion({ candidateVersion, publishedVersions, latestVersion })).toThrow();
    });

    it('requires an empty successful npm diff for an idempotent skip', () => {
        expect(() => validateNpmDiffResult(0, '')).not.toThrow();
        expect(() => validateNpmDiffResult(0, '\n')).not.toThrow();
        expect(() => validateNpmDiffResult(0, 'dist/index.js\n')).toThrow();
        expect(() => validateNpmDiffResult(1, '')).toThrow();
    });

    it('allows publishing when the exact version is absent', () => {
        expect(
            shouldSkipPublishedVersion({
                packageVersion: VERSION,
                releaseSha: RELEASE_SHA,
                publishedMetadata: null,
            }),
        ).toBe(false);
    });

    it('allows an idempotent skip only for an identical immutable version', () => {
        expect(
            shouldSkipPublishedVersion({
                packageVersion: VERSION,
                releaseSha: RELEASE_SHA,
                publishedMetadata: IDENTICAL_PUBLISHED_METADATA,
            }),
        ).toBe(true);
    });

    it.each([
        [
            'missing gitHead',
            {
                version: VERSION,
                latestVersion: VERSION,
                provenancePredicate: SLSA_PROVENANCE_PREDICATE,
            },
        ],
        ['different gitHead', { ...IDENTICAL_PUBLISHED_METADATA, gitHead: 'a'.repeat(40) }],
        ['short gitHead', { ...IDENTICAL_PUBLISHED_METADATA, gitHead: '1234' }],
        ['different version', { ...IDENTICAL_PUBLISHED_METADATA, version: '5.3.0' }],
        [
            'missing latest',
            {
                version: VERSION,
                gitHead: RELEASE_SHA,
                provenancePredicate: SLSA_PROVENANCE_PREDICATE,
            },
        ],
        ['different latest', { ...IDENTICAL_PUBLISHED_METADATA, latestVersion: '5.3.0' }],
        ['missing provenance', { version: VERSION, gitHead: RELEASE_SHA, latestVersion: VERSION }],
        ['different provenance', { ...IDENTICAL_PUBLISHED_METADATA, provenancePredicate: 'other' }],
    ])('blocks an unsafe duplicate with %s', (_label, metadata) => {
        expect(() =>
            shouldSkipPublishedVersion({
                packageVersion: VERSION,
                releaseSha: RELEASE_SHA,
                publishedMetadata: metadata,
            }),
        ).toThrow();
    });
});

describe('publish workflow wiring', () => {
    const workflow = readFileSync(resolve('.github/workflows/publish.yml'), 'utf8');
    const preflightSource = readFileSync(resolve('scripts/release-preflight.ts'), 'utf8');

    it('checks the release identity and fail-closed registry preflight', () => {
        expect(workflow).toContain('scripts/release-preflight.ts context');
        expect(workflow).toContain('scripts/release-preflight.ts registry');
        expect(workflow.match(/ref: '\$\{\{ github\.sha \}\}'/g)).toHaveLength(2);
        expect(workflow).toContain('main:refs/remotes/origin/main');
        expect(workflow).toContain('git merge-base --is-ancestor "$GITHUB_SHA" origin/main');
        expect(workflow).toContain('fetch-depth: 0');
        expect(workflow).toContain('package-manager-cache: false');
        expect(workflow.match(/node-version: '24\.19\.0'/g)).toHaveLength(2);
        expect(workflow).toContain('npm ci --ignore-scripts --registry=https://registry.npmjs.org/');
        expect(workflow).toContain("if: needs.verify.outputs.already-published == 'false'");
        expect(workflow.match(/if: steps\.preflight\.outputs\.already-published == 'false'/g)).toHaveLength(2);
        expect(workflow.match(/id-token: write/g)).toHaveLength(1);
        expect(workflow.match(/npm run package:smoke -- --prepared/g)).toHaveLength(1);
        expect(workflow).toContain('needs: verify');
        expect(workflow).not.toContain('attestations: write');
    });

    it('isolates npm configuration and preserves npm default-channel downgrade protection', () => {
        expect(workflow).toContain('--registry=https://registry.npmjs.org/');
        expect(workflow).not.toContain('--tag=latest');
        expect(workflow).toContain('--access=public');
        expect(workflow).toContain('--ignore-scripts');
        expect(workflow).toContain('--provenance');
        expect(workflow).toContain('npm publish "$GITHUB_WORKSPACE"');
        expect(workflow).toContain('--userconfig="$USER_CONFIG"');
        expect(workflow).toContain('--globalconfig="$GLOBAL_CONFIG"');
        expect(workflow).toContain('NPM_CONFIG_* | NODE_AUTH_TOKEN | NPM_TOKEN | NPM_ID_TOKEN');
        expect(workflow).not.toContain('npm publish *.tgz');
        expect(preflightSource).toContain('sanitizedNpmEnvironment');
        expect(preflightSource).toContain('NPM_ID_TOKEN');
        expect(preflightSource).toContain('`--diff=${REPOSITORY_ROOT}`');
        expect(preflightSource).toContain('`--userconfig=${isolation.userConfig}`');
        expect(preflightSource).toContain('`--globalconfig=${isolation.globalConfig}`');
    });

    it('runs no repository or dependency code in the OIDC job', () => {
        const publishJob = workflow.slice(workflow.indexOf('\n    publish:'));
        const provenanceGate = publishJob.indexOf('Verify source provenance before repository code runs');
        const artifactDownload = publishJob.indexOf('actions/download-artifact@');
        const setupNode = publishJob.indexOf('Setup pinned release Node.js');
        const publish = publishJob.lastIndexOf('npm publish');

        expect(provenanceGate).toBeGreaterThanOrEqual(0);
        expect(provenanceGate).toBeLessThan(artifactDownload);
        expect(artifactDownload).toBeLessThan(setupNode);
        expect(setupNode).toBeLessThan(publish);
        expect(publishJob).not.toContain('npm ci');
        expect(publishJob).not.toContain('npm run');
        expect(publishJob).not.toContain('node scripts/');
        expect(publishJob).not.toContain('npx ');
    });

    it('hands only the tested map-stripped dist artifact to the OIDC job', () => {
        expect(workflow).toContain('actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02');
        expect(workflow).toContain('actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093');
        expect(workflow).toContain('name: npm-release-dist');
        expect(workflow).toContain('if-no-files-found: error');
        expect(workflow).toContain('dist-sha256:');
        expect(workflow).toContain('sha256sum .release-artifact/release-dist.tar');
        expect(workflow).toContain("find dist -type f -name '*.map'");
        expect(workflow.match(/find dist -mindepth 1 ! -type f ! -type d/g)).toHaveLength(2);
    });

    it('rechecks registry monotonicity immediately before publish and verifies the result', () => {
        const publishJob = workflow.slice(workflow.indexOf('\n    publish:'));
        const recheck = publishJob.indexOf('EXACT_OUTPUT=');
        const publish = publishJob.indexOf('npm publish "$GITHUB_WORKSPACE"');
        const verification = publishJob.indexOf('VERIFIED=false');

        expect(recheck).toBeGreaterThanOrEqual(0);
        expect(recheck).toBeLessThan(publish);
        expect(publish).toBeLessThan(verification);
        expect(publishJob).toContain('dist-tags.latest dist.attestations');
        expect(publishJob).toContain('https://slsa.dev/provenance/v1');
    });

    it.each([
        'npm run format:check',
        'npm run codemap:check',
        'npm run mapping:check',
        'npm run agents-md:check',
        'npm run lockfile-lint',
        'RUN_FUZZ=1 npx vitest run tests/cli-fuzz.test.ts',
        'npm audit --omit=dev --audit-level=moderate',
        'npm run audit:dependencies',
    ])('includes the release gate: %s', (command) => {
        expect(workflow).toContain(command);
    });
});

describe('CI package smoke wiring', () => {
    const workflow = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');

    it('covers every supported Node line on Linux plus Node 24 on Windows', () => {
        expect(workflow).toContain("node-version: ['20.19.0', '22.13.0', '24']");
        expect(workflow).toContain('package-smoke-windows:');
        expect(workflow).toContain('name: Package smoke (Windows, Node 24)');
        expect(workflow).toContain('runs-on: windows-latest');
        expect(workflow).toContain("node-version: '24'");
        expect(workflow.match(/run: npm run package:smoke/g)).toHaveLength(2);
        expect(workflow).toContain('package-smoke-gate:');
        expect(workflow).toContain('name: package-smoke');
        expect(workflow).toContain('needs: [package-smoke, package-smoke-windows]');
        expect(workflow).toContain("LINUX_RESULT: '${{ needs.package-smoke.result }}'");
        expect(workflow).toContain("WINDOWS_RESULT: '${{ needs.package-smoke-windows.result }}'");
    });
});
