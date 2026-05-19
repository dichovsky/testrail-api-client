#!/usr/bin/env node
/**
 * Regenerates `.cursor/rules/testrail.mdc` from `src/cli/metadata.ts` and
 * `scripts/rules-content.mjs`. Deterministic: the same input always produces
 * byte-identical output (no timestamps, no randomness).
 *
 * Cursor `.mdc` format: YAML frontmatter (`description`, `globs`,
 * `alwaysApply`) followed by markdown body. See
 * https://docs.cursor.com/context/rules-for-ai for the current spec.
 *
 * Drift gate: `--check` exits non-zero if the committed file diverges from
 * generator output. Wired into `pretest` so PRs can't land out-of-sync.
 *
 * Prerequisite: `npm run build` so the generator can import the compiled
 * ACTIONS array from `dist/cli/metadata.js`.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { renderCursorMdc } from './rules-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distMetadata = path.join(root, 'dist', 'cli', 'metadata.js');
const target = path.join(root, '.cursor', 'rules', 'testrail.mdc');

if (!existsSync(distMetadata)) {
    process.stderr.write(
        `Error: ${distMetadata} not found. Run \`npm run build\` first so the generator can introspect the ACTIONS array.\n`,
    );
    process.exit(1);
}

const { ACTIONS } = await import(pathToFileURL(distMetadata).href);
const rendered = `${renderCursorMdc(ACTIONS)}\n`;

const checkMode = process.argv.includes('--check');

if (checkMode) {
    if (!existsSync(target)) {
        process.stderr.write(`Error: ${target} does not exist. Run \`npm run cursor-rules\` to generate it.\n`);
        process.exit(1);
    }
    const current = readFileSync(target, 'utf-8');
    if (current !== rendered) {
        process.stderr.write(`Error: ${target} is out of date. Run \`npm run cursor-rules\` and commit the result.\n`);
        process.exit(1);
    }
    process.stdout.write(`${path.relative(root, target)} up to date.\n`);
} else {
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, rendered, 'utf-8');
    process.stdout.write(`${path.relative(root, target)} regenerated (${rendered.split('\n').length} lines).\n`);
}
