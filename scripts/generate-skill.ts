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
 *   <!-- GENERATED:option-reference --> …every parser-recognized CLI option
 *   <!-- /GENERATED:option-reference -->
 *
 *   <!-- GENERATED:payload-schemas --> …per-schema field listing
 *   <!-- /GENERATED:payload-schemas -->
 *
 * Hand-written sections (frontmatter, recipes, prose) are preserved.
 *
 * `tsx` loads the TypeScript sources directly, so check mode never depends on
 * a potentially stale dist/ build. `--check` renders everything in memory and
 * exits non-zero without writing when either committed artifact differs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACTIONS } from '../src/cli/metadata.js';
import { CLI_OPTION_DOCUMENTATION } from '../src/cli/flags.js';
import {
    findStaleSkillArtifacts,
    renderCliOptionReference,
    renderCommandTable,
    renderPayloadSchemas,
    renderPayloadSchemaReference,
    replaceSection,
    replaceFrontmatterVersion,
} from './skill-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const skillPath = path.join(root, 'skill', 'SKILL.md');
const referenceDir = path.join(root, 'skill', 'reference');
const payloadReferencePath = path.join(referenceDir, 'payload-schemas.yaml');
const checkMode = process.argv.includes('--check');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };

const committedContent = readFileSync(skillPath, 'utf-8');
let content = committedContent;
content = replaceSection(content, 'command-table', renderCommandTable(ACTIONS));
content = replaceSection(content, 'option-reference', renderCliOptionReference(CLI_OPTION_DOCUMENTATION));
content = replaceSection(content, 'payload-schemas', renderPayloadSchemas(ACTIONS));
content = replaceFrontmatterVersion(content, pkg.version);
const payloadReference = renderPayloadSchemaReference(ACTIONS);

if (checkMode) {
    const stale = findStaleSkillArtifacts({
        committedSkill: committedContent,
        generatedSkill: content,
        ...(existsSync(payloadReferencePath) && {
            committedPayloadReference: readFileSync(payloadReferencePath, 'utf-8'),
        }),
        generatedPayloadReference: payloadReference,
    });
    if (stale.length > 0) {
        process.stderr.write(`Skill artifacts are out of date: ${stale.join(', ')}. Run \`npm run skill\`.\n`);
        process.exitCode = 1;
    } else {
        process.stdout.write('Skill artifacts are up to date.\n');
    }
} else {
    writeFileSync(skillPath, content, 'utf-8');
    mkdirSync(referenceDir, { recursive: true });
    writeFileSync(payloadReferencePath, payloadReference, 'utf-8');

    process.stdout.write(
        `skill/SKILL.md regenerated (${content.split('\n').length} lines); wrote skill/reference/payload-schemas.yaml.\n`,
    );
}
