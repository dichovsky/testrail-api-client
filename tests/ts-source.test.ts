import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { disposeTsSource, getJSDoc, getModifiers, parseSource, ts } from '../scripts/ts-source.js';

const ADAPTER_PATH = resolve(import.meta.dirname, '../scripts/ts-source.ts');
const hasPgrep = process.platform !== 'win32';

function statement(sourceFile: ts.SourceFile, index: number): ts.Statement {
    const found = sourceFile.statements[index];
    if (found === undefined) throw new Error(`no statement at index ${index}`);
    return found;
}

function serverPids(): number[] {
    try {
        return execFileSync('pgrep', ['-P', String(process.pid)], { encoding: 'utf8' })
            .split('\n')
            .filter((line) => line.length > 0)
            .map(Number);
    } catch {
        return []; // pgrep exits 1 when nothing matches
    }
}

afterAll(() => {
    disposeTsSource();
});

describe('parseSource', () => {
    it('parses a source string into a SourceFile', () => {
        const sourceFile = parseSource(
            '/any/where/sample.ts',
            'export function add(a: number, b: number): number {\n    return a + b;\n}\n',
        );

        expect(sourceFile.kind).toBe(ts.SyntaxKind.SourceFile);
        expect(sourceFile.statements).toHaveLength(1);
        const fn = statement(sourceFile, 0);
        expect(ts.isFunctionDeclaration(fn)).toBe(true);
        expect(ts.isFunctionDeclaration(fn) && fn.name?.text).toBe('add');
        expect(sourceFile.isDeclarationFile).toBe(false);
    });

    it('reports one-based-able line numbers through getLineAndCharacterOfPosition', () => {
        const sourceFile = parseSource('a.ts', 'const a = 1;\n\n\nexport const b = 2;\n');
        const { line } = sourceFile.getLineAndCharacterOfPosition(statement(sourceFile, 1).getStart(sourceFile));
        expect(line).toBe(3);
    });

    it('tolerates empty and syntactically invalid input', () => {
        expect(parseSource('empty.ts', '').statements).toHaveLength(0);
        const broken = parseSource('broken.ts', 'export function (( { const = ;\nclass {');
        expect(broken.statements.length).toBeGreaterThan(0);
    });

    it('uses only the extension of the path and falls back to .ts for unknown or empty paths', () => {
        expect(parseSource('types.d.ts', 'export declare const x: number;').isDeclarationFile).toBe(true);
        expect(parseSource('view.tsx', 'const e = <div />;').statements).toHaveLength(1);
        expect(parseSource('', 'const a: number = 1;').statements).toHaveLength(1);
        expect(parseSource('no-extension', 'const a: number = 1;').statements).toHaveLength(1);
        expect(parseSource('script.js', 'const a: number = 1;').statements).toHaveLength(1);
    });

    it('rejects a lone surrogate without losing the server', () => {
        expect(() => parseSource('bad.ts', "const a = '\uD800';")).toThrow(/lone UTF-16 surrogate/);
        expect(parseSource('ok.ts', 'const a = 1;').statements).toHaveLength(1);
    });

    it('strips a leading byte order mark so offsets match sourceFile.text', () => {
        const sourceFile = parseSource('bom.ts', '\uFEFFconst a = 1;\nconst b = 2;');
        const second = statement(sourceFile, 1);
        expect(sourceFile.text.startsWith('const a')).toBe(true);
        expect(statement(sourceFile, 0).getText(sourceFile)).toBe('const a = 1;');
        expect(sourceFile.text.slice(second.getStart(sourceFile), second.end)).toBe('const b = 2;');
    });

    it('keeps SourceFiles readable after later parses and after dispose', () => {
        const parsed = Array.from({ length: 40 }, (_, index) =>
            parseSource(`f${index}.ts`, `export const v${index} = ${index};\n`),
        );
        disposeTsSource();
        parsed.forEach((sourceFile, index) => {
            const stmt = statement(sourceFile, 0);
            expect(ts.isVariableStatement(stmt)).toBe(true);
            expect(stmt.getText(sourceFile)).toBe(`export const v${index} = ${index};`);
        });
    });
});

describe('parseSource offsets', () => {
    it('uses UTF-16 code-unit offsets and verbatim Unicode text', () => {
        const text = [
            "const prefix = '😀 café 漢字';",
            "export function greet(name: 'Zoë 😀'): 'Привіт 🚀' {",
            "    return 'Привіт 🚀';",
            '}',
            '',
        ].join('\n');
        const sourceFile = parseSource('unicode.ts', text);

        expect(sourceFile.text).toBe(text);
        for (const stmt of sourceFile.statements) {
            const start = stmt.getStart(sourceFile);
            expect(text.slice(start, stmt.end)).toBe(stmt.getText(sourceFile));
        }
        const greet = statement(sourceFile, 1);
        expect(greet.getText(sourceFile)).toContain("'Привіт 🚀'");
        expect(sourceFile.getLineAndCharacterOfPosition(greet.getStart(sourceFile))).toEqual({ line: 1, character: 0 });
        // The character offset counts the surrogate pair of 😀 as two code units.
        const afterEmoji = text.indexOf('café');
        expect(sourceFile.getLineAndCharacterOfPosition(afterEmoji)).toEqual({ line: 0, character: afterEmoji });
    });

    it('treats CRLF, a lone CR and U+2028 as line breaks like TypeScript 6', () => {
        const text = 'const a = 1;\r\nconst b = 2;\rconst c = 3; //\u2028x\n';
        const sourceFile = parseSource('breaks.ts', text);
        expect(sourceFile.getLineStarts()).toEqual([0, 14, 27, 43, 45]);
        // U+2028 ends the comment, so `x` is a statement of its own.
        expect(sourceFile.statements.map((stmt) => ts.formatSyntaxKind(stmt.kind))).toEqual([
            'VariableStatement',
            'VariableStatement',
            'VariableStatement',
            'ExpressionStatement',
        ]);
        expect(sourceFile.getLineAndCharacterOfPosition(statement(sourceFile, 2).getStart(sourceFile)).line).toBe(2);
    });
});

describe('JSDoc and modifiers', () => {
    const source = [
        '/**',
        ' * Greets Zoë in Ukrainian: Привіт 🚀.',
        ' *',
        ' * Second paragraph.',
        ' * @since 1.0',
        ' * @deprecated use other',
        ' * @param name the {@link Foo bar} thing',
        ' * @example foo(1)',
        ' * @testrail GET get_case/{case_id}',
        ' */',
        'export function greet(name: string): string { return name; }',
        '',
        '/** first */',
        '/** second @deprecated */',
        'export default class Documented {}',
        '',
        '/** Var doc. @since 2.0 */',
        'export const a = 1, b = 2;',
        'let l = 1;',
        'var v = 2;',
        'abstract class Plain {}',
        '',
    ].join('\n');

    it('exposes comment text and tags through getJSDoc', () => {
        const sourceFile = parseSource('doc.ts', source);
        const doc = getJSDoc(statement(sourceFile, 0));

        expect(doc).toBeDefined();
        expect(ts.getTextOfJSDocComment(doc?.comment)).toBe('Greets Zoë in Ukrainian: Привіт 🚀.\n\nSecond paragraph.');
        const tags = (doc?.tags ?? []).map((tag) => ({
            name: tag.tagName.text,
            text: (tag.comment ?? []).map((part) => part.text).join(''),
            flat: ts.getTextOfJSDocComment(tag.comment),
        }));
        expect(tags).toEqual([
            { name: 'since', text: '1.0', flat: '1.0' },
            { name: 'deprecated', text: 'use other', flat: 'use other' },
            // A {@link} part is its own node; flattening re-adds the braces and the target name.
            { name: 'param', text: 'the bar thing', flat: 'the {@link Foo bar} thing' },
            { name: 'example', text: 'foo(1)', flat: 'foo(1)' },
            { name: 'testrail', text: 'GET get_case/{case_id}', flat: 'GET get_case/{case_id}' },
        ]);
        expect(Array.isArray(doc?.comment)).toBe(true);
    });

    it('matches getJSDocTags and returns the last JSDoc block when several precede a node', () => {
        const sourceFile = parseSource('doc.ts', source);
        const documented = statement(sourceFile, 1);

        expect(documented.jsDoc).toHaveLength(2);
        expect(ts.getTextOfJSDocComment(getJSDoc(documented)?.comment)).toBe('second');
        expect(ts.getJSDocTags(documented).map((tag) => tag.tagName.text)).toEqual(['deprecated']);
        const testrail = ts.getJSDocTags(statement(sourceFile, 0)).find((tag) => tag.tagName.text === 'testrail');
        expect(ts.getTextOfJSDocComment(testrail?.comment)).toBe('GET get_case/{case_id}');
    });

    it('attaches variable docs to the statement, and getJSDocTags walks up from a declaration', () => {
        const sourceFile = parseSource('doc.ts', source);
        const variables = statement(sourceFile, 2);
        if (!ts.isVariableStatement(variables)) throw new Error('expected a variable statement');
        const declaration = variables.declarationList.declarations[0];
        if (declaration === undefined) throw new Error('expected a declaration');

        expect(getJSDoc(variables)).toBeDefined();
        expect(getJSDoc(declaration)).toBeUndefined();
        expect(ts.getJSDocTags(declaration).map((tag) => tag.tagName.text)).toEqual(['since']);
        expect(getJSDoc(statement(sourceFile, 3))).toBeUndefined();
    });

    it('returns modifier keywords without a canHaveModifiers check', () => {
        const sourceFile = parseSource('doc.ts', source);
        const kinds = (index: number): string[] =>
            (getModifiers(statement(sourceFile, index)) ?? []).map((modifier) => ts.formatSyntaxKind(modifier.kind));

        expect(kinds(0)).toEqual(['ExportKeyword']);
        expect(kinds(1)).toEqual(['ExportKeyword', 'DefaultKeyword']);
        expect(kinds(5)).toEqual(['AbstractKeyword']);
        expect(getModifiers(sourceFile)).toBeUndefined();
        expect(getModifiers(statement(sourceFile, 3))).toBeUndefined();
    });

    it('distinguishes const, let and var through declarationList flags', () => {
        const sourceFile = parseSource('doc.ts', source);
        const flagsOf = (index: number): number => {
            const stmt = statement(sourceFile, index);
            if (!ts.isVariableStatement(stmt)) throw new Error('expected a variable statement');
            return stmt.declarationList.flags;
        };

        expect(flagsOf(2) & ts.NodeFlags.Const).toBeTruthy();
        expect(flagsOf(3) & ts.NodeFlags.Let).toBeTruthy();
        expect(flagsOf(4) & (ts.NodeFlags.Const | ts.NodeFlags.Let)).toBe(0);
    });
});

describe('TypeScript 7 API differences the generators rely on', () => {
    it('names the end-of-file kind EndOfFile and prints kinds with formatSyntaxKind', () => {
        expect('EndOfFileToken' in ts.SyntaxKind).toBe(false);
        expect(ts.formatSyntaxKind(ts.SyntaxKind.SpreadElement)).toBe('SpreadElement');
        expect(ts.formatSyntaxKind(ts.SyntaxKind.NumericLiteral)).toBe('NumericLiteral');
    });

    it('scans with createScanner(skipTrivia, languageVariant, text) and terminates on EndOfFile', () => {
        const scanner = ts.createScanner(false, ts.LanguageVariant.Standard, "a  'b   c' // x\n  d");
        const tokens: string[] = [];
        for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFile; kind = scanner.scan()) {
            tokens.push(`${ts.formatSyntaxKind(kind)}:${scanner.getTokenText()}`);
        }
        expect(tokens).toEqual([
            'Identifier:a',
            'WhitespaceTrivia:  ',
            "StringLiteral:'b   c'",
            'WhitespaceTrivia: ',
            'SingleLineCommentTrivia:// x',
            'NewLineTrivia:\n',
            'WhitespaceTrivia:  ',
            'Identifier:d',
        ]);
    });

    it('visits children with node.forEachChild and stops on a truthy result', () => {
        const sourceFile = parseSource('walk.ts', 'class A { m() {} }\nconst b = 1;\n');
        const visited: string[] = [];
        sourceFile.forEachChild((child) => {
            visited.push(ts.formatSyntaxKind(child.kind));
        });
        expect(visited).toEqual(['ClassDeclaration', 'VariableStatement', 'EndOfFileToken']);
        expect(sourceFile.forEachChild((child) => child.kind)).toBe(ts.SyntaxKind.ClassDeclaration);
    });

    it('reads names, literal values and special syntax through the ts guards', () => {
        const sourceFile = parseSource(
            'syntax.ts',
            [
                "export * as ns from './x.js';",
                "export { a as b, type c } from './y.js';",
                'const q = ((x as unknown) satisfies unknown);',
                "class K { #p = 1; 'q r'() {} 12() {} get g() { return 1; } constructor() {} }",
                "const s = 'x\\ny\\u00e9'; const n = 1_000; const t = `plain`;",
                '',
            ].join('\n'),
        );
        const [star, named] = sourceFile.statements;
        if (star === undefined || !ts.isExportDeclaration(star) || star.exportClause === undefined)
            throw new Error('export * as ns');
        expect(ts.isNamespaceExport(star.exportClause) && star.exportClause.name.text).toBe('ns');
        if (
            named === undefined ||
            !ts.isExportDeclaration(named) ||
            named.exportClause === undefined ||
            !ts.isNamedExports(named.exportClause)
        ) {
            throw new Error('named exports');
        }
        expect(named.exportClause.elements.map((el) => [el.name.text, el.propertyName?.text, el.isTypeOnly])).toEqual([
            ['b', 'a', false],
            ['c', undefined, true],
        ]);

        const found: string[] = [];
        const visit = (node: ts.Node): void => {
            if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
                found.push(ts.formatSyntaxKind(node.kind));
            }
            if (ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
                found.push(`${ts.formatSyntaxKind(node.kind)}=${node.text}`);
            }
            if (ts.isPrivateIdentifier(node)) found.push(`PrivateIdentifier=${node.text}`);
            if (
                ts.isConstructorDeclaration(node) ||
                ts.isGetAccessorDeclaration(node) ||
                ts.isSetAccessorDeclaration(node)
            ) {
                found.push(ts.formatSyntaxKind(node.kind));
            }
            node.forEachChild(visit);
        };
        visit(sourceFile);
        expect(found).toEqual(
            expect.arrayContaining([
                'ParenthesizedExpression',
                'SatisfiesExpression',
                'AsExpression',
                'PrivateIdentifier=#p',
                'GetAccessor',
                'Constructor',
                'StringLiteral=q r',
                'NumericLiteral=12',
                'StringLiteral=x\nyé',
                'NumericLiteral=1000',
                'NoSubstitutionTemplateLiteral=plain',
            ]),
        );
    });

    it('exposes identifier text only (no escapedText)', () => {
        const stmt = statement(parseSource('id.ts', 'const abc = 1;'), 0);
        if (!ts.isVariableStatement(stmt)) throw new Error('expected a variable statement');
        const name = stmt.declarationList.declarations[0]?.name;
        if (name === undefined || !ts.isIdentifier(name)) throw new Error('expected an identifier');
        expect(name.text).toBe('abc');
        expect((name as { escapedText?: unknown }).escapedText).toBeUndefined();
    });
});

describe('server lifecycle', () => {
    it.skipIf(!hasPgrep)('reuses one native server across calls and starts a new one after dispose', async () => {
        disposeTsSource();
        await vi.waitFor(() => expect(serverPids()).toEqual([]));

        parseSource('one.ts', 'const a = 1;');
        const [pid, ...others] = serverPids();
        expect(others).toEqual([]);
        expect(pid).toBeTypeOf('number');

        for (let index = 0; index < 25; index++) parseSource(`n${index}.ts`, `const v = ${index};`);
        expect(serverPids()).toEqual([pid]);

        disposeTsSource();
        await vi.waitFor(() => expect(serverPids()).toEqual([]));
        parseSource('two.ts', 'const b = 2;');
        const restarted = serverPids();
        expect(restarted).toHaveLength(1);
        expect(restarted).not.toEqual([pid]);
    });

    it.skipIf(!hasPgrep)('recovers when the server dies between calls', async () => {
        parseSource('warm.ts', 'const a = 1;');
        const [pid] = serverPids();
        if (pid === undefined) throw new Error('expected a running server');
        process.kill(pid, 'SIGKILL');
        await vi.waitFor(() => expect(() => process.kill(pid, 0)).toThrow());

        expect(() => parseSource('dead.ts', 'const b = 2;')).toThrow();
        expect(parseSource('alive.ts', 'const c = 3;').statements).toHaveLength(1);
    });

    it('lets a Node process that never disposed the adapter exit on its own', () => {
        const dir = mkdtempSync(join(tmpdir(), 'ts-source-exit-'));
        try {
            const script = join(dir, 'parse-and-exit.mjs');
            writeFileSync(
                script,
                [
                    `import { parseSource } from ${JSON.stringify(pathToFileURL(ADAPTER_PATH).href)};`,
                    "const sourceFile = parseSource('exit.ts', 'export const a = 1;');",
                    "console.log('statements=' + sourceFile.statements.length);",
                    '',
                ].join('\n'),
            );
            const output = execFileSync(process.execPath, [script], { encoding: 'utf8', timeout: 20_000 });
            expect(output.trim()).toBe('statements=1');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
