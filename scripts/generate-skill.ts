#!/usr/bin/env tsx
/**
 * Regenerates the machine-generated sections of skill/SKILL.md from
 * src/cli/metadata.ts (the ACTIONS array) and the referenced Zod
 * schemas in src/schemas.ts.
 *
 * Sentinel-delimited regions in SKILL.md that get rewritten:
 *
 *   <!-- GENERATED:command-table -->   …rendered table of resource:action
 *   <!-- /GENERATED:command-table -->
 *
 *   <!-- GENERATED:payload-schemas --> …per-schema field listing
 *   <!-- /GENERATED:payload-schemas -->
 *
 * Hand-written sections (frontmatter, recipes, prose) are preserved.
 *
 * Prerequisite: `npm run build` (this script imports compiled JS from
 * dist/ so Zod schemas are introspectable as runtime values). The
 * `skill` npm-script chains build + generation.
 *
 * Drift is enforced via the `skill:check` script which runs
 * `git diff --exit-code skill/SKILL.md` after regeneration in CI/publish.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import {
    renderCommandTable,
    renderPayloadSchemas,
    renderPayloadSchemaReference,
    replaceSection,
    replaceFrontmatterVersion,
} from './skill-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distMetadata = path.join(root, 'dist', 'cli', 'metadata.js');
const skillPath = path.join(root, 'skill', 'SKILL.md');
const referenceDir = path.join(root, 'skill', 'reference');
const payloadReferencePath = path.join(referenceDir, 'payload-schemas.yaml');

if (!existsSync(distMetadata)) {
    process.stderr.write(
        `Error: ${distMetadata} not found. Run \`npm run build\` first so the generator can introspect runtime Zod schemas.\n`,
    );
    process.exit(1);
}

const { ACTIONS } = (await import(pathToFileURL(distMetadata).href)) as { ACTIONS: readonly unknown[] };
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };

let content = readFileSync(skillPath, 'utf-8');
content = replaceSection(
    content,
    'command-table',
    renderCommandTable(ACTIONS as Parameters<typeof renderCommandTable>[0]),
);
content = replaceSection(
    content,
    'payload-schemas',
    renderPayloadSchemas(ACTIONS as Parameters<typeof renderPayloadSchemas>[0]),
);
content = replaceFrontmatterVersion(content, pkg.version);
writeFileSync(skillPath, content, 'utf-8');
mkdirSync(referenceDir, { recursive: true });
writeFileSync(
    payloadReferencePath,
    renderPayloadSchemaReference(ACTIONS as Parameters<typeof renderPayloadSchemaReference>[0]),
    'utf-8',
);

process.stdout.write(
    `skill/SKILL.md regenerated (${content.split('\n').length} lines); wrote skill/reference/payload-schemas.yaml.\n`,
);
