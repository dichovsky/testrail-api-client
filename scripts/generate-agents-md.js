#!/usr/bin/env node
/**
 * Regenerates `AGENTS.md` at the repository root from `src/cli/metadata.ts`
 * and `scripts/rules-content.mjs`. Deterministic output (no timestamps).
 *
 * `AGENTS.md` follows the vendor-neutral convention documented at
 * https://agents.md/ — a single markdown file any AI coding agent or
 * harness can read for project conventions, commands, and pointers.
 *
 * Drift gate: `--check` exits non-zero if the committed file diverges from
 * generator output.
 *
 * Prerequisite: `npm run build` so the generator can import the compiled
 * ACTIONS metadata.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { renderAgentsMd } from './rules-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distMetadata = path.join(root, 'dist', 'cli', 'metadata.js');
const target = path.join(root, 'AGENTS.md');

if (!existsSync(distMetadata)) {
    process.stderr.write(
        `Error: ${distMetadata} not found. Run \`npm run build\` first so the generator can introspect the ACTIONS array.\n`,
    );
    process.exit(1);
}

const { ACTIONS } = await import(pathToFileURL(distMetadata).href);
const rendered = `${renderAgentsMd(ACTIONS)}\n`;

const checkMode = process.argv.includes('--check');

if (checkMode) {
    if (!existsSync(target)) {
        process.stderr.write(`Error: ${target} does not exist. Run \`npm run agents-md\` to generate it.\n`);
        process.exit(1);
    }
    const current = readFileSync(target, 'utf-8');
    if (current !== rendered) {
        process.stderr.write(`Error: ${target} is out of date. Run \`npm run agents-md\` and commit the result.\n`);
        process.exit(1);
    }
    process.stdout.write(`${path.relative(root, target)} up to date.\n`);
} else {
    writeFileSync(target, rendered, 'utf-8');
    process.stdout.write(`${path.relative(root, target)} regenerated (${rendered.split('\n').length} lines).\n`);
}
