#!/usr/bin/env node
/**
 * Regenerates `.continue/rules/testrail.md` from `src/cli/metadata.ts` and
 * `scripts/rules-content.mjs`. Deterministic output (no timestamps).
 *
 * Continue (continue.dev) reads `.continue/rules/*.md` from the workspace
 * and injects them into the system prompt. No frontmatter required.
 * Reference: https://docs.continue.dev/customization/rules
 *
 * Drift gate: `--check` exits non-zero if the committed file diverges from
 * generator output.
 *
 * Prerequisite: `npm run build` so the generator can import compiled
 * ACTIONS metadata from `dist/`.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { renderContinueRules } from './rules-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distMetadata = path.join(root, 'dist', 'cli', 'metadata.js');
const target = path.join(root, '.continue', 'rules', 'testrail.md');

if (!existsSync(distMetadata)) {
    process.stderr.write(
        `Error: ${distMetadata} not found. Run \`npm run build\` first so the generator can introspect the ACTIONS array.\n`,
    );
    process.exit(1);
}

const { ACTIONS } = await import(pathToFileURL(distMetadata).href);
const rendered = `${renderContinueRules(ACTIONS)}\n`;

const checkMode = process.argv.includes('--check');

if (checkMode) {
    if (!existsSync(target)) {
        process.stderr.write(`Error: ${target} does not exist. Run \`npm run continue-rules\` to generate it.\n`);
        process.exit(1);
    }
    const current = readFileSync(target, 'utf-8');
    if (current !== rendered) {
        process.stderr.write(
            `Error: ${target} is out of date. Run \`npm run continue-rules\` and commit the result.\n`,
        );
        process.exit(1);
    }
    process.stdout.write(`${path.relative(root, target)} up to date.\n`);
} else {
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, rendered, 'utf-8');
    process.stdout.write(`${path.relative(root, target)} regenerated (${rendered.split('\n').length} lines).\n`);
}
