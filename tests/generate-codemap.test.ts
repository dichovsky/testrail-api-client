import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The generator script is plain ESM JS with no .d.ts; tsconfig allows
// import-from-.js, so the import resolves at runtime without TS picking it up.
// @ts-expect-error - intentional untyped import of .js script
import { buildCodemap, runCli } from '../scripts/generate-codemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = resolve(__dirname, 'fixtures/codemap');
const SCRIPT_PATH = resolve(REPO_ROOT, 'scripts/generate-codemap.js');

type CodemapResult = { markdown: string; sourceHash: string };

interface PublicApiEntry {
    name: string;
    kind: string;
    file: string;
    line: number;
    signature: string;
    jsdoc?: string;
    typeOnly?: boolean;
}

interface FileSymbol {
    name: string;
    kind: string;
    line: number;
    exported: boolean;
    signature: string;
}

interface FileEntry {
    path: string;
    imports: string[];
    reExports: string[];
    symbols: FileSymbol[];
}

interface Codemap {
    schema: string;
    repo: { name: string; version: string };
    sourceHash: string;
    entrypoints: string[];
    publicApi: PublicApiEntry[];
    files: FileEntry[];
}

function extractJson(markdown: string): Codemap {
    // CRLF-tolerant: matches both LF and CRLF newlines around the fenced block,
    // so the test works on Windows checkouts with autocrlf=true.
    const m = /```json\r?\n([\s\S]+?)\r?\n```/.exec(markdown);
    if (m === null) throw new Error('no JSON block in markdown');
    return JSON.parse(m[1] as string) as Codemap;
}

function build(rootDir: string): CodemapResult {
    return buildCodemap({ rootDir }) as CodemapResult;
}

describe('buildCodemap — basic', () => {
    it('produces byte-identical output on two runs (determinism)', () => {
        const a = build(join(FIXTURE_ROOT, 'basic'));
        const b = build(join(FIXTURE_ROOT, 'basic'));
        expect(a.markdown).toBe(b.markdown);
    });

    it('exposes only transitively-reexported symbols in publicApi', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'basic'));
        const data = extractJson(markdown);
        const names = data.publicApi.map((e) => e.name).sort();
        expect(names).toEqual(['Greeting', 'greet']);
    });

    it('marks type-only exports with typeOnly: true', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'basic'));
        const data = extractJson(markdown);
        const greeting = data.publicApi.find((e) => e.name === 'Greeting');
        const greet = data.publicApi.find((e) => e.name === 'greet');
        expect(greeting?.typeOnly).toBe(true);
        expect(greet?.typeOnly).toBeUndefined();
    });

    it('lists private (non-exported) symbols in files[].symbols but not in publicApi', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'basic'));
        const data = extractJson(markdown);
        expect(data.publicApi.find((e) => e.name === 'PRIVATE_CONST')).toBeUndefined();
        const greet = data.files.find((f) => f.path === 'src/greet.ts');
        const priv = greet?.symbols.find((s) => s.name === 'PRIVATE_CONST');
        expect(priv).toBeDefined();
        expect(priv?.exported).toBe(false);
    });

    it('captures function signature without the implementation body', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'basic'));
        const data = extractJson(markdown);
        const greet = data.publicApi.find((e) => e.name === 'greet');
        expect(greet?.signature).toBe('export function greet(name: string): Greeting');
        expect(greet?.signature).not.toContain('return');
    });
});

describe('buildCodemap — sourceHash sensitivity', () => {
    it('changes when a tracked source file changes', () => {
        const dir = mkdtempSync(join(tmpdir(), 'codemap-hash-'));
        try {
            writeFileSync(join(dir, 'package.json'), '{"name":"h","version":"0.0.0"}\n');
            writeFileSync(
                join(dir, 'codemap.config.json'),
                JSON.stringify({ sourceDirs: ['src'], entrypoints: ['src/index.ts'], exclude: [] }),
            );
            const srcDir = join(dir, 'src');
            mkdirSync(srcDir, { recursive: true });
            writeFileSync(join(srcDir, 'index.ts'), 'export const X = 1;\n');
            const r1 = build(dir);
            writeFileSync(join(srcDir, 'index.ts'), 'export const X = 2;\n');
            const r2 = build(dir);
            expect(r2.sourceHash).not.toBe(r1.sourceHash);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe('buildCodemap — exclude globs', () => {
    it('drops files matching exclude patterns from publicApi and files[]', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'excludes'));
        const data = extractJson(markdown);
        expect(data.publicApi.find((e) => e.name === 'SHOULD_NOT_APPEAR')).toBeUndefined();
        expect(data.files.find((f) => f.path.endsWith('dropped.test.ts'))).toBeUndefined();
        expect(data.files.find((f) => f.path === 'src/index.ts')).toBeDefined();
    });
});

describe('buildCodemap — JSDoc extraction', () => {
    it('keeps first paragraph, drops @param/@returns, preserves @deprecated / @since / @example inline', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'jsdoc'));
        const data = extractJson(markdown);
        const compare = data.publicApi.find((e) => e.name === 'comparePng');
        expect(compare?.jsdoc).toBeDefined();
        const doc = compare?.jsdoc ?? '';
        expect(doc).toContain('Compares two PNG images pixel-by-pixel');
        expect(doc).not.toContain('Second paragraph');
        expect(doc).not.toContain('@param');
        expect(doc).not.toContain('@returns');
        expect(doc).toContain('@deprecated since 6.0.0, use comparePngAsync');
        expect(doc).toContain('@since 1.0.0');
        expect(doc).toContain('@example');
    });

    it('preserves whitespace inside string literals when normalizing signatures', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'jsdoc'));
        const data = extractJson(markdown);
        const withLit = data.publicApi.find((e) => e.name === 'withLiteral');
        expect(withLit?.signature).toContain("'a   b   c'");
    });
});

describe('buildCodemap — transitive re-exports', () => {
    it('flattens export * and renamed export-from through multiple hops', () => {
        const { markdown } = build(join(FIXTURE_ROOT, 'reexports'));
        const data = extractJson(markdown);
        const names = data.publicApi.map((e) => e.name).sort();
        expect(names).toEqual(['Beta', 'alpha', 'exposedRenamed']);

        const renamed = data.publicApi.find((e) => e.name === 'exposedRenamed');
        expect(renamed?.file).toBe('src/inner/deep.ts');

        const beta = data.publicApi.find((e) => e.name === 'Beta');
        expect(beta?.typeOnly).toBe(true);

        expect(data.publicApi.find((e) => e.name === 'privateOnly')).toBeUndefined();
    });
});

describe('runCli — --check mode exit codes', () => {
    function withTempCopy(srcDir: string, fn: (dir: string) => void): void {
        const dir = mkdtempSync(join(tmpdir(), 'codemap-check-'));
        try {
            cpSync(srcDir, dir, { recursive: true });
            fn(dir);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    }

    it('exits 0 when CODEMAP.md matches generator output', () => {
        withTempCopy(join(FIXTURE_ROOT, 'basic'), (dir) => {
            const { markdown } = build(dir);
            writeFileSync(join(dir, 'CODEMAP.md'), markdown);
            let stdout = '';
            const code = runCli({
                rootDir: dir,
                check: true,
                stdout: { write: (s: string) => (stdout += s) },
                stderr: { write: () => {} },
            }) as number;
            expect(code).toBe(0);
            expect(stdout).toContain('up to date');
        });
    });

    it('exits 1 with a diff preview when CODEMAP.md is stale', () => {
        withTempCopy(join(FIXTURE_ROOT, 'basic'), (dir) => {
            writeFileSync(join(dir, 'CODEMAP.md'), '# CODEMAP\n\nStale content\n');
            let stderr = '';
            const code = runCli({
                rootDir: dir,
                check: true,
                stdout: { write: () => {} },
                stderr: { write: (s: string) => (stderr += s) },
            }) as number;
            expect(code).toBe(1);
            expect(stderr).toContain('is stale');
            expect(stderr).toContain('Stale content');
        });
    });

    it('exits 1 when CODEMAP.md is missing entirely', () => {
        withTempCopy(join(FIXTURE_ROOT, 'basic'), (dir) => {
            const target = join(dir, 'CODEMAP.md');
            if (existsSync(target)) rmSync(target);
            let stderr = '';
            const code = runCli({
                rootDir: dir,
                check: true,
                stdout: { write: () => {} },
                stderr: { write: (s: string) => (stderr += s) },
            }) as number;
            expect(code).toBe(1);
            expect(stderr).toContain('missing');
        });
    });

    it('subprocess invocation: `node generate-codemap.js --check` exits 0 on the live repo', () => {
        const out = execFileSync('node', [SCRIPT_PATH, '--check'], { cwd: REPO_ROOT, encoding: 'utf8' });
        expect(out).toContain('up to date');
    });
});

describe('CODEMAP.md structural invariants', () => {
    it('parses as valid JSON with required top-level fields', () => {
        const md = readFileSync(join(REPO_ROOT, 'CODEMAP.md'), 'utf8');
        const data = extractJson(md);
        expect(data.schema).toBe('codemap.v2');
        expect(data.repo).toMatchObject({ name: expect.any(String), version: expect.any(String) });
        expect(typeof data.sourceHash).toBe('string');
        expect(Array.isArray(data.entrypoints)).toBe(true);
        expect(Array.isArray(data.publicApi)).toBe(true);
        expect(Array.isArray(data.files)).toBe(true);
    });

    it('size is under the 150 KB sanity bound', () => {
        const md = readFileSync(join(REPO_ROOT, 'CODEMAP.md'), 'utf8');
        expect(Buffer.byteLength(md, 'utf8')).toBeLessThan(150_000);
    });
});
