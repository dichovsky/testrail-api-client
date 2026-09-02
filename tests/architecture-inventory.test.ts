import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EndpointsArraySchema } from '../scripts/mapping-renderer.js';
import { TestRailClient } from '../src/client.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('architecture inventory prose', () => {
    it('tracks the checked domain-module count', () => {
        const client = new TestRailClient({
            baseUrl: 'https://example.com',
            email: 'agent@example.com',
            apiKey: 'test-key',
        });
        const moduleCount = Object.values(client).filter(
            (value) => typeof value === 'object' && value?.constructor?.name.endsWith('Module') === true,
        ).length;
        client.destroy();

        const architecture = readFileSync(join(ROOT, 'docs', 'ARCHITECTURE.md'), 'utf8');
        const claude = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
        expect(architecture).toContain(`composes ${moduleCount} domain modules`);
        expect(architecture).toContain(`${moduleCount} namespaces`);
        expect(architecture).toContain(`The ${moduleCount} module fields`);
        expect(architecture).toContain(`There are ${moduleCount} stateless namespaces`);
        expect(claude).toContain(`composition root: ${moduleCount} \`public readonly\` module fields`);
        expect(claude).toContain(`(${moduleCount} \`public readonly\` fields`);
    });

    it('derives the documented pagination count from the endpoint inventory', () => {
        const inventory = EndpointsArraySchema.parse(
            JSON.parse(readFileSync(join(ROOT, 'docs', 'testrail-endpoints.json'), 'utf8')),
        );
        const paginationCount = inventory.filter((endpoint) => endpoint.pagination !== undefined).length;
        const architecture = readFileSync(join(ROOT, 'docs', 'ARCHITECTURE.md'), 'utf8');

        expect(architecture).toContain(`The ${paginationCount} registered endpoints`);
        expect(architecture).toContain('project BDDs');
        expect(architecture).toContain('`labels.ts`');
    });
});
