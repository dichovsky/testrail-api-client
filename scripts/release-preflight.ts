import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXPECTED_PACKAGE_NAME = '@dichovsky/testrail-api-client';
export const NPM_REGISTRY = 'https://registry.npmjs.org/';
export const SLSA_PROVENANCE_PREDICATE = 'https://slsa.dev/provenance/v1';

const STABLE_SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface NpmIsolation {
    readonly cwd: string;
    readonly userConfig: string;
    readonly globalConfig: string;
    readonly env: typeof process.env;
}

interface PackageIdentity {
    readonly name: string;
    readonly version: string;
}

export interface ReleaseContextInput {
    readonly packageIdentity: PackageIdentity;
    readonly lockfileIdentity: PackageIdentity;
    readonly eventName: string;
    readonly releaseAction: string;
    readonly releaseDraft: string;
    readonly releasePrerelease: string;
    readonly releaseTag: string;
    readonly githubRef: string;
    readonly githubSha: string;
    readonly headSha: string;
    readonly tagSha: string;
    readonly mainContainsRelease: boolean;
}

export interface RegistryDecisionInput {
    readonly packageVersion: string;
    readonly releaseSha: string;
    readonly publishedMetadata: PublishedVersionMetadata | null;
}

export interface PublishedVersionMetadata {
    readonly version: string;
    readonly gitHead?: string;
    readonly latestVersion?: string;
    readonly provenancePredicate?: string;
}

export interface NewStableVersionInput {
    readonly candidateVersion: string;
    readonly publishedVersions: readonly string[];
    readonly latestVersion: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string, source: string): string {
    const value = record[key];
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${source} must contain a non-empty string ${key}`);
    }
    return value;
}

/** Parse the release identity from package.json without trusting unchecked JSON. */
export function parsePackageIdentity(value: unknown, source: string): PackageIdentity {
    if (!isRecord(value)) throw new Error(`${source} must contain a JSON object`);
    return {
        name: requireString(value, 'name', source),
        version: requireString(value, 'version', source),
    };
}

/** Parse the root package identity from package-lock.json. */
export function parseLockfileIdentity(value: unknown): PackageIdentity {
    if (!isRecord(value) || !isRecord(value['packages']) || !isRecord(value['packages'][''])) {
        throw new Error('package-lock.json must contain a root packages[""] object');
    }
    const topLevel = parsePackageIdentity(value, 'package-lock.json');
    const root = parsePackageIdentity(value['packages'][''], 'package-lock.json root package');
    if (topLevel.name !== root.name || topLevel.version !== root.version) {
        throw new Error('package-lock.json top-level and root package identities must match');
    }
    return root;
}

function normalizeSha(value: string, label: string): string {
    const normalized = value.toLowerCase();
    if (!COMMIT_SHA_PATTERN.test(normalized)) {
        throw new Error(`${label} must be a full 40-character commit SHA`);
    }
    return normalized;
}

/**
 * Validate every identity boundary supplied by a GitHub `release: published`
 * event before the workflow gains access to the npm publish step.
 */
export function validateReleaseContext(input: ReleaseContextInput): PackageIdentity {
    const { packageIdentity, lockfileIdentity } = input;
    if (packageIdentity.name !== EXPECTED_PACKAGE_NAME) {
        throw new Error(`package.json name must be ${EXPECTED_PACKAGE_NAME}`);
    }
    if (lockfileIdentity.name !== packageIdentity.name) {
        throw new Error('package-lock.json package name does not match package.json');
    }
    if (!STABLE_SEMVER_PATTERN.test(packageIdentity.version)) {
        throw new Error('package.json version must be a stable semantic version');
    }
    if (lockfileIdentity.version !== packageIdentity.version) {
        throw new Error('package-lock.json package version does not match package.json');
    }
    if (input.eventName !== 'release' || input.releaseAction !== 'published') {
        throw new Error('publish is allowed only for a published GitHub Release event');
    }
    if (input.releaseDraft !== 'false' || input.releasePrerelease !== 'false') {
        throw new Error('draft and prerelease GitHub Releases cannot publish to the stable npm channel');
    }

    const expectedTag = `release/${packageIdentity.version}`;
    if (input.releaseTag !== expectedTag) {
        throw new Error(`release tag must exactly match ${expectedTag}`);
    }
    if (input.githubRef !== `refs/tags/${expectedTag}`) {
        throw new Error('GitHub release ref does not match the validated release tag');
    }

    const githubSha = normalizeSha(input.githubSha, 'GITHUB_SHA');
    const headSha = normalizeSha(input.headSha, 'checked-out HEAD');
    const tagSha = normalizeSha(input.tagSha, 'release tag target');
    if (githubSha !== headSha || githubSha !== tagSha) {
        throw new Error('release tag, checked-out HEAD, and GITHUB_SHA must identify the same commit');
    }
    if (!input.mainContainsRelease) {
        throw new Error('release SHA must be reachable from origin/main');
    }

    return packageIdentity;
}

function parseJson(output: string, label: string): unknown {
    try {
        return JSON.parse(output) as unknown;
    } catch {
        throw new Error(`npm returned invalid JSON for ${label}`);
    }
}

/** Normalize npm's version-dependent scalar-or-array JSON output. */
export function parseNpmStringList(output: string, label: string): string[] {
    const value = parseJson(output, label);
    if (typeof value === 'string') return [value];
    if (isUnknownArray(value) && value.every((entry): entry is string => typeof entry === 'string')) {
        return [...value];
    }
    throw new Error(`npm returned an unexpected value for ${label}`);
}

function parsePublishedMetadata(output: string): PublishedVersionMetadata {
    const parsed = parseJson(output, 'published version metadata');
    let value = parsed;
    if (isUnknownArray(parsed)) {
        if (parsed.length !== 1) throw new Error('npm returned unexpected published version metadata');
        value = parsed[0];
    }
    if (!isRecord(value)) throw new Error('npm returned unexpected published version metadata');

    const version = requireString(value, 'version', 'published npm metadata');
    const gitHead = value['gitHead'];
    const latestVersion = value['dist-tags.latest'];
    const attestations = value['dist.attestations'];
    let provenancePredicate: string | undefined;
    if (isRecord(attestations) && isRecord(attestations['provenance'])) {
        const predicate = attestations['provenance']['predicateType'];
        if (typeof predicate === 'string') provenancePredicate = predicate;
    }
    if (gitHead !== undefined && (typeof gitHead !== 'string' || gitHead.length === 0)) {
        throw new Error('published npm metadata contains an invalid gitHead');
    }
    if (latestVersion !== undefined && (typeof latestVersion !== 'string' || latestVersion.length === 0)) {
        throw new Error('published npm metadata contains an invalid latest dist-tag');
    }
    return {
        version,
        ...(typeof gitHead === 'string' ? { gitHead } : {}),
        ...(typeof latestVersion === 'string' ? { latestVersion } : {}),
        ...(provenancePredicate === undefined ? {} : { provenancePredicate }),
    };
}

/**
 * Interpret one exact-version `npm view` call. Only an explicit registry E404
 * means the immutable version is absent; every other command failure blocks.
 */
export function parseNpmViewResult(status: number, output: string): PublishedVersionMetadata | null {
    if (status === 0) return parsePublishedMetadata(output);

    const parsed = parseJson(output, 'registry error');
    if (isRecord(parsed) && isRecord(parsed['error']) && parsed['error']['code'] === 'E404') return null;
    throw new Error('npm registry lookup failed without an exact E404; refusing to publish');
}

/** Require npm's minimum version for OIDC Trusted Publishing. */
export function validateTrustedPublishingNpmVersion(version: string): void {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (match === null) throw new Error('npm version is not valid semantic version output');
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    const supported = major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1)));
    if (!supported) throw new Error('npm >= 11.5.1 is required for Trusted Publishing');
}

/** Require a Node runtime supported by npm OIDC Trusted Publishing. */
export function validateTrustedPublishingNodeVersion(version: string): void {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (match === null) throw new Error('Node version is not valid semantic version output');
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    const supported = major > 22 || (major === 22 && (minor > 14 || (minor === 14 && patch >= 0)));
    if (!supported) throw new Error('Node >= 22.14.0 is required for Trusted Publishing');
}

function stableVersionTuple(version: string, label: string): readonly [bigint, bigint, bigint] {
    const match = STABLE_SEMVER_PATTERN.exec(version);
    if (match === null) throw new Error(`${label} must be a stable semantic version`);
    return [BigInt(match[1] as string), BigInt(match[2] as string), BigInt(match[3] as string)];
}

function compareStableVersions(left: string, right: string): number {
    const leftTuple = stableVersionTuple(left, 'version');
    const rightTuple = stableVersionTuple(right, 'version');
    for (const index of [0, 1, 2] as const) {
        if (leftTuple[index] > rightTuple[index]) return 1;
        if (leftTuple[index] < rightTuple[index]) return -1;
    }
    return 0;
}

/** Ensure a new stable publish advances both the latest tag and all stable versions. */
export function validateNewStableVersion(input: NewStableVersionInput): void {
    stableVersionTuple(input.candidateVersion, 'candidate package version');
    stableVersionTuple(input.latestVersion, 'npm latest version');
    if (input.publishedVersions.length === 0) {
        throw new Error('npm returned no published versions for the existing package');
    }
    if (!input.publishedVersions.includes(input.latestVersion)) {
        throw new Error('npm latest version is absent from the published version list');
    }

    const stableVersions = input.publishedVersions.filter((version) => STABLE_SEMVER_PATTERN.test(version));
    if (stableVersions.length === 0) throw new Error('npm returned no stable published versions');
    const highestStable = stableVersions.reduce((highest, version) =>
        compareStableVersions(version, highest) > 0 ? version : highest,
    );
    if (
        compareStableVersions(input.candidateVersion, input.latestVersion) <= 0 ||
        compareStableVersions(input.candidateVersion, highestStable) <= 0
    ) {
        throw new Error('new package version must be newer than npm latest and every published stable version');
    }
}

/** `npm diff` exits zero even for differences, so stdout must also be empty. */
export function validateNpmDiffResult(status: number, output: string): void {
    if (status !== 0 || output.trim().length !== 0) {
        throw new Error('published npm package content differs from the prepared release; refusing to skip');
    }
}

/**
 * Decide whether an existing immutable npm version is the same current stable
 * release. Historical releases deliberately fail this check after `latest`
 * advances, so only the active release has a green idempotent path.
 */
export function shouldSkipPublishedVersion(input: RegistryDecisionInput): boolean {
    if (input.publishedMetadata === null) return false;
    if (input.publishedMetadata.version !== input.packageVersion) {
        throw new Error('npm reports the requested version as published but returned a different version identity');
    }
    if (input.publishedMetadata.gitHead === undefined || input.publishedMetadata.gitHead.length === 0) {
        throw new Error('npm reports the requested version as published without a gitHead; refusing to skip');
    }
    if (input.publishedMetadata.latestVersion !== input.packageVersion) {
        throw new Error('npm latest dist-tag does not identify the requested version; refusing to skip');
    }
    if (input.publishedMetadata.provenancePredicate !== SLSA_PROVENANCE_PREDICATE) {
        throw new Error('npm reports the requested version without SLSA provenance; refusing to skip');
    }

    const releaseSha = normalizeSha(input.releaseSha, 'release SHA');
    const publishedGitHead = normalizeSha(input.publishedMetadata.gitHead, 'published npm gitHead');
    if (publishedGitHead !== releaseSha) {
        throw new Error('published npm gitHead does not match the release SHA; refusing to skip');
    }
    return true;
}

function parseJsonFile(filePath: string): unknown {
    const contents = readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(contents) as unknown;
    } catch {
        throw new Error(`${filePath} contains invalid JSON`);
    }
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value.length === 0) throw new Error(`${name} is required`);
    return value;
}

function runCommand(command: string, args: readonly string[], label: string): string {
    const result = spawnSync(command, args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error !== undefined || result.status !== 0 || typeof result.stdout !== 'string') {
        throw new Error(`${label} failed; refusing to publish`);
    }
    return result.stdout.trim();
}

function sanitizedNpmEnvironment(): typeof process.env {
    return Object.fromEntries(
        Object.entries(process.env).filter(([name]) => {
            const normalized = name.toUpperCase();
            return (
                !normalized.startsWith('NPM_CONFIG_') &&
                normalized !== 'NODE_AUTH_TOKEN' &&
                normalized !== 'NPM_TOKEN' &&
                normalized !== 'NPM_ID_TOKEN'
            );
        }),
    );
}

function withNpmIsolation<T>(callback: (isolation: NpmIsolation) => T): T {
    const cwd = mkdtempSync(join(tmpdir(), 'testrail-release-preflight-'));
    const userConfig = join(cwd, 'user.npmrc');
    const globalConfig = join(cwd, 'global.npmrc');
    writeFileSync(userConfig, '', 'utf8');
    writeFileSync(globalConfig, '', 'utf8');
    try {
        return callback({ cwd, userConfig, globalConfig, env: sanitizedNpmEnvironment() });
    } finally {
        rmSync(cwd, { recursive: true, force: true });
    }
}

function isolatedNpmArgs(args: readonly string[], isolation: NpmIsolation): string[] {
    return [
        ...args,
        `--userconfig=${isolation.userConfig}`,
        `--globalconfig=${isolation.globalConfig}`,
        `--registry=${NPM_REGISTRY}`,
    ];
}

function queryPublishedMetadata(spec: string, isolation: NpmIsolation): PublishedVersionMetadata | null {
    const result = spawnSync(
        'npm',
        isolatedNpmArgs(
            ['view', spec, 'version', 'gitHead', 'dist-tags.latest', 'dist.attestations', '--json'],
            isolation,
        ),
        {
            cwd: isolation.cwd,
            env: isolation.env,
            encoding: 'utf8',
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe'],
        },
    );
    if (result.error !== undefined || result.status === null || typeof result.stdout !== 'string') {
        throw new Error('npm registry lookup failed; refusing to publish');
    }
    return parseNpmViewResult(result.status, result.stdout.trim());
}

function requirePublishedContentMatch(spec: string, isolation: NpmIsolation): void {
    const result = spawnSync(
        'npm',
        isolatedNpmArgs(
            ['diff', `--diff=${REPOSITORY_ROOT}`, `--diff=${spec}`, '--diff-name-only', '--ignore-scripts'],
            isolation,
        ),
        {
            cwd: isolation.cwd,
            env: isolation.env,
            encoding: 'utf8',
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe'],
        },
    );
    if (result.error !== undefined || result.status === null || typeof result.stdout !== 'string') {
        throw new Error('npm package content comparison failed; refusing to publish');
    }
    validateNpmDiffResult(result.status, result.stdout);
}

function npmView(args: readonly string[], label: string, isolation: NpmIsolation): string {
    const result = spawnSync('npm', isolatedNpmArgs(['view', ...args], isolation), {
        cwd: isolation.cwd,
        env: isolation.env,
        encoding: 'utf8',
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error !== undefined || result.status !== 0 || typeof result.stdout !== 'string') {
        throw new Error(`${label} failed; refusing to publish`);
    }
    return result.stdout.trim();
}

function singleNpmString(output: string, label: string): string {
    const values = parseNpmStringList(output, label);
    if (values.length !== 1) throw new Error(`npm returned ${String(values.length)} values for ${label}`);
    return values[0] as string;
}

function loadAndValidateContext(): PackageIdentity {
    const packageIdentity = parsePackageIdentity(parseJsonFile(resolve('package.json')), 'package.json');
    const lockfileIdentity = parseLockfileIdentity(parseJsonFile(resolve('package-lock.json')));
    const releaseTag = requireEnv('RELEASE_TAG');
    const headSha = runCommand('git', ['rev-parse', '--verify', 'HEAD^{commit}'], 'resolving checked-out HEAD');
    const tagSha = runCommand(
        'git',
        ['rev-parse', '--verify', `refs/tags/${releaseTag}^{commit}`],
        'resolving release tag',
    );
    runCommand(
        'git',
        ['merge-base', '--is-ancestor', headSha, 'origin/main'],
        'verifying release ancestry on origin/main',
    );
    validateTrustedPublishingNodeVersion(process.versions.node);
    validateTrustedPublishingNpmVersion(runCommand('npm', ['--version'], 'checking npm version'));

    return validateReleaseContext({
        packageIdentity,
        lockfileIdentity,
        eventName: requireEnv('GITHUB_EVENT_NAME'),
        releaseAction: requireEnv('RELEASE_ACTION'),
        releaseDraft: requireEnv('RELEASE_DRAFT'),
        releasePrerelease: requireEnv('RELEASE_PRERELEASE'),
        releaseTag,
        githubRef: requireEnv('GITHUB_REF'),
        githubSha: requireEnv('GITHUB_SHA'),
        headSha,
        tagSha,
        mainContainsRelease: true,
    });
}

function runContextCheck(): void {
    const identity = loadAndValidateContext();
    process.stdout.write(`Verified ${identity.name}@${identity.version} release identity.\n`);
}

function runRegistryCheck(): void {
    const identity = loadAndValidateContext();
    const spec = `${identity.name}@${identity.version}`;
    const alreadyPublished = withNpmIsolation((isolation) => {
        const publishedMetadata = queryPublishedMetadata(spec, isolation);
        const published = shouldSkipPublishedVersion({
            packageVersion: identity.version,
            releaseSha: requireEnv('GITHUB_SHA'),
            publishedMetadata,
        });

        if (published) {
            requirePublishedContentMatch(spec, isolation);
        } else {
            const publishedVersions = parseNpmStringList(
                npmView([identity.name, 'versions', '--json'], 'looking up published npm versions', isolation),
                'published versions',
            );
            const latestVersion = singleNpmString(
                npmView([identity.name, 'dist-tags.latest', '--json'], 'looking up npm latest', isolation),
                'npm latest',
            );
            validateNewStableVersion({
                candidateVersion: identity.version,
                publishedVersions,
                latestVersion,
            });
        }
        return published;
    });

    appendFileSync(requireEnv('GITHUB_OUTPUT'), `already-published=${String(alreadyPublished)}\n`, 'utf8');
    if (alreadyPublished) {
        process.stdout.write(`::notice::Verified identical ${identity.name}@${identity.version}; skipping publish.\n`);
    } else {
        process.stdout.write(`Verified ${identity.name}@${identity.version} is not present on npm.\n`);
    }
}

function main(): void {
    const mode = process.argv[2];
    if (mode === 'context') {
        runContextCheck();
        return;
    }
    if (mode === 'registry') {
        runRegistryCheck();
        return;
    }
    throw new Error('usage: release-preflight.ts <context|registry>');
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
    try {
        main();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Release preflight failed: ${message}\n`);
        process.exitCode = 1;
    }
}
