/** Execute Recipe 45 itself so documentation cannot drift from the CLI/schema. */
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddCaseFieldPayloadSchema } from '../src/index.js';
import { handleCaseFieldAdd } from '../src/cli/handlers/case-field-write.js';
import { createClient, mockOk } from './helpers.js';

const markdown = readFileSync(new URL('../skill/SKILL.md', import.meta.url), 'utf8');
const section = markdown.split('### 45. Case field configuration and discovery')[1]?.split('\n### ')[0];
if (section === undefined) throw new Error('Missing case-field recipe');

const creationExamples = [...section.matchAll(/testrail case-field add --dry-run --data '([^']+)'/g)].map((match) => {
    const json = match[1];
    if (json === undefined) throw new Error('Missing case-field payload');
    const payload: unknown = JSON.parse(json);
    return { json, payload };
});

const writeExample = /```javascript\n([\s\S]*?)\n```/.exec(section)?.[1];
if (writeExample === undefined) throw new Error('Missing returned-name recipe');

const mockFetch = vi.fn<typeof fetch>();
const originalArgv = process.argv.slice();
const originalExitCode = process.exitCode;

vi.mock('node:dns/promises', () => ({
    lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error('Unexpected HTTP request'));
    vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

async function dryRunRecipe(json: string): Promise<{ stdout: string; stderr: string; exitCode: unknown }> {
    vi.resetModules();
    vi.stubEnv('TESTRAIL_BASE_URL', 'https://example.testrail.io');
    vi.stubEnv('TESTRAIL_EMAIL', 'recipe@example.invalid');
    vi.stubEnv('TESTRAIL_API_KEY', 'offline-recipe-key');
    vi.stubEnv('TESTRAIL_STRICT_RESPONSES', undefined);
    vi.stubEnv('TESTRAIL_TIMEOUT', undefined);
    process.argv = ['node', 'testrail', 'case-field', 'add', '--dry-run', '--data', json];
    process.exitCode = undefined;

    const stdout: string[] = [];
    const stderr: string[] = [];
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        stdout.push(String(chunk));
        return true;
    });
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        stderr.push(String(chunk));
        return true;
    });

    try {
        await import('../src/cli.js');
        await vi.waitFor(() => expect(process.exitCode).not.toBeUndefined(), { interval: 1, timeout: 5_000 });
        return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode: process.exitCode };
    } finally {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
    }
}

describe('Recipe 45 — case-field creation', () => {
    it('contains complete String, Dropdown, and Date payloads accepted by the exported schema', () => {
        expect(creationExamples).toHaveLength(3);
        const parsed = creationExamples.map(({ payload }) => AddCaseFieldPayloadSchema.parse(payload));
        expect(parsed.map(({ type }) => type)).toEqual(['String', 'Dropdown', 'Date']);
        expect(parsed).toEqual(creationExamples.map(({ payload }) => payload));
    });

    it.each(creationExamples)(
        'executes the documented creation payload through CLI dry-run: $json',
        async ({ json, payload }) => {
            const result = await dryRunRecipe(json);
            expect(result.exitCode).toBe(0);
            expect(result.stderr).toBe('');
            expect(JSON.parse(result.stdout)).toEqual({
                dryRun: true,
                action: 'case-field add',
                payload,
                source: 'data',
            });
            expect(mockFetch).not.toHaveBeenCalled();
        },
    );
});

describe('Recipe 45 — returned case-field property names', () => {
    const script = new Script(`(async () => {\n${writeExample}\n})()`, { filename: 'recipe-45.js' });

    it.each(['custom_environment_tier', 'custom_case_environment_tier'])(
        'uses the returned %s unchanged instead of the numeric field ID',
        async (systemName) => {
            const addCase = vi.fn().mockResolvedValue({ id: 101 });
            const client = {
                metadata: {
                    getCaseFields: vi
                        .fn()
                        .mockResolvedValue([{ id: 99, name: 'environment_tier', system_name: systemName, type_id: 6 }]),
                },
                cases: { addCase },
            };

            await script.runInNewContext({ client });

            expect(addCase).toHaveBeenCalledExactlyOnceWith(42, {
                title: 'Staging smoke test',
                template_id: 1,
                [systemName]: 2,
            });
        },
    );

    it.each([
        { fields: [], reason: 'Expected one Environment Tier field' },
        { fields: [{ name: 'environment_tier' }], reason: 'Missing or unexpected case-field system_name' },
        {
            fields: [{ name: 'environment_tier', system_name: 'title' }],
            reason: 'Missing or unexpected case-field system_name',
        },
        {
            fields: [
                { name: 'environment_tier', system_name: 'custom_environment_tier' },
                { name: 'environment_tier', system_name: 'custom_case_environment_tier' },
            ],
            reason: 'Expected one Environment Tier field',
        },
    ])(
        'does not write when field discovery cannot resolve one usable property name: $fields',
        async ({ fields, reason }) => {
            const addCase = vi.fn();
            const client = { metadata: { getCaseFields: vi.fn().mockResolvedValue(fields) }, cases: { addCase } };

            await expect(script.runInNewContext({ client }) as Promise<unknown>).rejects.toThrow(reason);

            expect(addCase).not.toHaveBeenCalled();
        },
    );
});

describe('Recipe 45 — option text passthrough (#268)', () => {
    it.each([
        ['ordinary labels', '1, Alpha\n2, Beta'],
        ['embedded commas', '1, Alpha, Beta\n2, Gamma'],
        ['Unicode labels', '1, Київ\n2, 日本語 🧪'],
        ['malformed lines', '1 Alpha\n, Missing ID\n3,'],
        ['CRLF and whitespace', '1,  Alpha  \r\n2, Beta\r\n'],
    ])('keeps %s unchanged through schema, CLI body parsing, and HTTP serialization', async (_label, items) => {
        const candidate = {
            type: 'Dropdown',
            name: 'example_capability',
            label: 'Example Capability',
            include_all: false,
            template_ids: [1],
            configs: [
                {
                    context: { is_global: false, project_ids: [1] },
                    options: { is_required: false, items },
                },
            ],
        };
        const original = JSON.stringify(candidate);
        const parsed = AddCaseFieldPayloadSchema.parse(candidate);
        expect(parsed).toEqual(candidate);

        mockFetch.mockResolvedValueOnce(
            mockOk({
                ...candidate,
                id: 99,
                system_name: 'custom_case_example_capability',
                type_id: 6,
                display_order: 1,
                is_active: 1,
                include_all: 0,
                configs: JSON.stringify(candidate.configs),
            }),
        );
        const client = createClient();

        try {
            await handleCaseFieldAdd({
                client,
                actionSpec: { resource: 'case-field', action: 'add' },
                args: { pathParams: [] },
                pagination: { mode: 'items' },
                bodyInput: { dataFlag: original },
                dryRun: false,
                force: false,
                confirmDestructive: false,
                out: vi.fn(),
            });

            expect(mockFetch).toHaveBeenCalledOnce();
            expect(mockFetch.mock.calls[0]?.[1]?.body).toBe(original);
            expect(JSON.stringify(candidate)).toBe(original);
        } finally {
            client.destroy();
        }
    });
});
