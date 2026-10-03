#!/usr/bin/env tsx
/**
 * Regenerates the machine-generated parts of the bundled skill from
 * src/cli/metadata.ts (the ACTIONS array), the CLI option registry, and the
 * referenced Zod schemas in src/schemas.ts.
 *
 * Sentinel-delimited regions that get rewritten:
 *
 *   skill/reference/commands.md
 *   <!-- GENERATED:command-table -->   …rendered table of resource:action
 *   <!-- /GENERATED:command-table -->
 *
 *   <!-- GENERATED:option-reference --> …every parser-recognized CLI option
 *   <!-- /GENERATED:option-reference -->
 *
 *   skill/SKILL.md
 *   <!-- GENERATED:payload-schemas --> …compact per-schema index
 *   <!-- /GENERATED:payload-schemas -->
 *
 * plus the SKILL.md frontmatter `metadata.version` and the whole of
 * skill/reference/payload-schemas.yaml. Hand-written sections (the rest of
 * the frontmatter, prose, and skill/reference/recipes.md and
 * typescript-api.md entirely) are preserved.
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
const commandsPath = path.join(referenceDir, 'commands.md');
const checkMode = process.argv.includes('--check');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };

const committedContent = readFileSync(skillPath, 'utf-8');
let content = committedContent;
content = replaceSection(content, 'payload-schemas', renderPayloadSchemas(ACTIONS));
content = replaceFrontmatterVersion(content, pkg.version);

// The command table and option reference moved out of the body: they are pure
// lookup material, and inlining them put SKILL.md past the size where an agent
// can load it cheaply. The sentinels travelled with them, so the same
// replaceSection machinery now targets the reference file.
const committedCommands = readFileSync(commandsPath, 'utf-8');
let commands = committedCommands;
commands = replaceSection(commands, 'command-table', renderCommandTable(ACTIONS));
commands = replaceSection(commands, 'option-reference', renderCliOptionReference(CLI_OPTION_DOCUMENTATION));

const payloadReference = renderPayloadSchemaReference(ACTIONS);

if (checkMode) {
    const stale = findStaleSkillArtifacts({
        committedSkill: committedContent,
        generatedSkill: content,
        committedCommands,
        generatedCommands: commands,
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
    writeFileSync(commandsPath, commands, 'utf-8');
    writeFileSync(payloadReferencePath, payloadReference, 'utf-8');

    process.stdout.write(
        `skill/SKILL.md regenerated (${content.split('\n').length} lines); ` +
            `wrote skill/reference/commands.md and skill/reference/payload-schemas.yaml.\n`,
    );
}
