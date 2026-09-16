/**
 * Drift gate for the hand-maintained "Published to npm" list at the top of
 * CHANGELOG.md (issue #280).
 *
 * That list is the only in-repo record of which versions actually reached the
 * registry — this file's history contains version headers that never did
 * (`2.0.0`/`2.2.0`, the `3.x` line), so it cannot be reconstructed from the
 * changelog headings alone. `docs/RELEASING.md` says to keep it aligned, but
 * unlike CODEMAP.md, AGENTS.md, SKILL.md, and API-MAPPING.md it had no check,
 * so it could drift silently and the failure stayed invisible until someone
 * tried to reconstruct release history.
 *
 * Deliberately offline and deterministic, like the other `:check` gates — it
 * asserts the invariant the *release commit* must satisfy rather than querying
 * npm. A release bumps `package.json` and updates this list in the same commit
 * (RELEASING.md step 3), so requiring the manifest version to be listed catches
 * exactly the omission that matters, with no network flake and no dependence on
 * git tags (the pre-5.0.0 published versions have none).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(repoRoot, 'CHANGELOG.md');
const MANIFEST = join(repoRoot, 'package.json');

/** Matches the blockquote line, capturing everything up to the closing period. */
const PUBLISHED_LINE = /^>\s*\*\*Published to npm:\*\*\s*(.+?)\.\s*$/m;
const STABLE_SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

function fail(message: string): never {
    process.stderr.write(`published:check — ${message}\n`);
    process.exit(1);
}

/** Numeric semver ordering. Both inputs are checked against STABLE_SEMVER first. */
function compare(a: string, b: string): number {
    const left = a.split('.');
    const right = b.split('.');
    for (let i = 0; i < 3; i += 1) {
        const diff = Number(left[i] ?? 0) - Number(right[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

const changelog = readFileSync(CHANGELOG, 'utf-8');
const manifestVersion = (JSON.parse(readFileSync(MANIFEST, 'utf-8')) as { version: string }).version;

const match = PUBLISHED_LINE.exec(changelog);
const listed = match?.[1];
if (listed === undefined) {
    fail('could not find the "> **Published to npm:** ..." line in CHANGELOG.md.');
}

const versions = listed.split(',').map((entry) => entry.trim().replace(/^`|`$/g, ''));

const malformed = versions.filter((v) => !STABLE_SEMVER.test(v));
if (malformed.length > 0) {
    fail(`not stable semver in the published list: ${malformed.join(', ')}.`);
}

const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
if (duplicates.length > 0) {
    fail(`duplicate entries in the published list: ${[...new Set(duplicates)].join(', ')}.`);
}

versions.forEach((current, index) => {
    const previous = versions[index - 1];
    if (previous !== undefined && compare(previous, current) >= 0) {
        fail(`published list is not in ascending order: '${previous}' precedes '${current}'.`);
    }
});

if (!versions.includes(manifestVersion)) {
    fail(
        `package.json version '${manifestVersion}' is missing from the "Published to npm" list in CHANGELOG.md.\n` +
            `  A release bumps the manifest and records the version in that list in the same commit.\n` +
            `  Add '${manifestVersion}' to the list, or revert the version bump if this is not a release.`,
    );
}

process.stdout.write(`Published-to-npm list is consistent (${versions.length} versions, latest ${manifestVersion}).\n`);
