#!/usr/bin/env tsx
/**
 * Generates CODEMAP.md — a machine-readable symbol index for coding agents.
 * Run: npx tsx scripts/generate-codemap.ts          (regenerate)
 *      npx tsx scripts/generate-codemap.ts --check  (verify committed CODEMAP.md is up to date)
 *
 * Output shape (schema "codemap.v2"): a short Markdown preamble followed by a
 * single fenced ```json``` block.
 *
 *   {
 *     "schema": "codemap.v2",
 *     "repo": { "name", "version" },
 *     "sourceHash": "<sha256 of sorted path\\0content\\0...>",
 *     "entrypoints": [...relative paths],
 *     "publicApi": [{ name, kind, file, line, signature, jsdoc?, typeOnly? }, ...],
 *     "files":     [{ path, imports: string[], reExports: string[], symbols: [...] }]
 *   }
 *
 * Determinism: NO timestamps anywhere. All arrays sorted by stable keys; running
 * the script twice produces byte-identical output. Staleness is detected via
 * the sourceHash + --check mode.
 *
 * Token-efficiency: signatures only, no implementation bodies; type alias RHS
 * truncated to maxSignatureLength chars; whitespace-normalized via the TS
 * scanner so string literals are preserved.
 *
 * Sanity bound (not enforced): target ≤ 150 KB for this repo.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHEMA_VERSION = 'codemap.v2';
const RE_EXPORT_DEPTH_CAP = 8;
const JSDOC_EXAMPLE_TRUNCATE = 80;
const DIFF_PREVIEW_LINES = 40;

// ── Config + filesystem helpers ───────────────────────────────────────────────

function toPosix(p: string): string {
    return p.split(/[\\/]/).join('/');
}

interface CodemapConfig {
    sourceDirs: string[];
    entrypoints: string[];
    exclude: string[];
    maxSignatureLength: number;
}

function loadConfig(rootDir: string): CodemapConfig {
    const configPath = join(rootDir, 'codemap.config.json');
    if (!existsSync(configPath)) {
        throw new Error(`codemap.config.json not found at ${configPath}`);
    }
    const cfg = JSON.parse(readFileSync(configPath, 'utf8')) as {
        sourceDirs?: string[];
        entrypoints?: string[];
        exclude?: string[];
        maxSignatureLength?: number;
    };
    return {
        sourceDirs: cfg.sourceDirs ?? ['src'],
        entrypoints: cfg.entrypoints ?? ['src/index.ts'],
        exclude: cfg.exclude ?? [],
        maxSignatureLength: cfg.maxSignatureLength ?? 200,
    };
}

// Hand-rolled glob → regex. Supports **, *, ?, literal segments.
// Patterns are matched against POSIX-normalized paths relative to rootDir.
function globToRegex(glob: string): RegExp {
    let re = '';
    let i = 0;
    while (i < glob.length) {
        const c = glob[i];
        if (c === '*' && glob[i + 1] === '*') {
            if (glob[i + 2] === '/') {
                // '**/' matches zero or more path segments.
                re += '(?:.*/)?';
                i += 3;
            } else {
                re += '.*';
                i += 2;
            }
        } else if (c === '*') {
            re += '[^/]*';
            i += 1;
        } else if (c === '?') {
            re += '[^/]';
            i += 1;
        } else if (c !== undefined && '.+^$(){}|[]\\'.includes(c)) {
            re += `\\${c}`;
            i += 1;
        } else {
            re += c ?? '';
            i += 1;
        }
    }
    return new RegExp(`^${re}$`);
}

function matchesAnyGlob(relPath: string, compiledGlobs: RegExp[]): boolean {
    return compiledGlobs.some((re) => re.test(relPath));
}

function collectSourceFiles(rootDir: string, sourceDirs: string[], exclude: string[]): string[] {
    const compiled = exclude.map(globToRegex);
    const files: string[] = [];
    for (const dir of sourceDirs) {
        const abs = join(rootDir, dir);
        if (!existsSync(abs)) continue;
        walk(abs, rootDir, compiled, files);
    }
    files.sort();
    return files;
}

function walk(absDir: string, rootDir: string, compiledExcludes: RegExp[], out: string[]): void {
    for (const name of readdirSync(absDir)) {
        const abs = join(absDir, name);
        const rel = toPosix(relative(rootDir, abs));
        if (matchesAnyGlob(rel, compiledExcludes)) continue;
        const st = statSync(abs);
        if (st.isDirectory()) {
            walk(abs, rootDir, compiledExcludes, out);
        } else if (st.isFile() && rel.endsWith('.ts')) {
            // Exclude *.d.ts unless under src/types/ (per spec).
            if (rel.endsWith('.d.ts') && !rel.includes('/types/')) continue;
            out.push(rel);
        }
    }
}

function normalizeLineEndings(s: string): string {
    // Normalize CRLF → LF so generator output and source hash are stable across
    // platforms and git autocrlf settings.
    return s.replace(/\r\n/g, '\n');
}

function computeSourceHash(rootDir: string, relFiles: string[]): string {
    const h = createHash('sha256');
    for (const rel of [...relFiles].sort()) {
        const content = normalizeLineEndings(readFileSync(join(rootDir, rel), 'utf8'));
        h.update(rel);
        h.update('\0');
        h.update(content);
        h.update('\0');
    }
    return h.digest('hex');
}

// ── AST: signature extraction via scanner (preserves string literals) ─────────

function normalizeWhitespace(source: string): string {
    // Tokenize via TS scanner so string literals (which may contain spaces or
    // newlines) are not corrupted by a naive `replace(/\s+/g, ' ')`.
    const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        /* skipTrivia */ false,
        ts.LanguageVariant.Standard,
        source,
    );
    let out = '';
    let needSpace = false;
    while (true) {
        const kind = scanner.scan();
        if (kind === ts.SyntaxKind.EndOfFileToken) break;
        if (
            kind === ts.SyntaxKind.WhitespaceTrivia ||
            kind === ts.SyntaxKind.NewLineTrivia ||
            kind === ts.SyntaxKind.SingleLineCommentTrivia ||
            kind === ts.SyntaxKind.MultiLineCommentTrivia
        ) {
            needSpace = out.length > 0;
            continue;
        }
        if (needSpace) {
            out += ' ';
            needSpace = false;
        }
        out += scanner.getTokenText();
    }
    return out;
}

function truncate(s: string, maxLen: number): string {
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

function sliceFunctionSignature(
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration,
    sourceFile: ts.SourceFile,
    maxLen: number,
): string {
    const text = sourceFile.text;
    const start = node.getStart(sourceFile);
    const end = node.body !== undefined ? node.body.getStart(sourceFile) : node.getEnd();
    const normalized = normalizeWhitespace(text.slice(start, end))
        .trim()
        .replace(/[\s{]+$/, '')
        .trim();
    return truncate(normalized, maxLen);
}

function sliceClassHeader(node: ts.ClassDeclaration, sourceFile: ts.SourceFile, maxLen: number): string {
    const text = sourceFile.text;
    const start = node.getStart(sourceFile);
    const openBrace = text.indexOf('{', start);
    const slice = openBrace > -1 ? text.slice(start, openBrace) : text.slice(start, node.getEnd());
    return truncate(normalizeWhitespace(slice).trim(), maxLen);
}

function sliceFull(node: ts.Node, sourceFile: ts.SourceFile, maxLen: number): string {
    const normalized = normalizeWhitespace(node.getText(sourceFile)).trim().replace(/;\s*$/, '');
    return truncate(normalized, maxLen);
}

function sliceVariable(stmt: ts.VariableStatement, sourceFile: ts.SourceFile, maxLen: number): string {
    const normalized = normalizeWhitespace(stmt.getText(sourceFile)).trim().replace(/;\s*$/, '');
    return truncate(normalized, maxLen);
}

// ── AST: JSDoc extraction (first paragraph + inline tag mentions) ─────────────

function commentToString(comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string {
    if (typeof comment === 'string') return comment;
    if (comment === undefined) return '';
    if (Array.isArray(comment)) return (comment as { text?: string }[]).map((c) => c.text ?? '').join('');
    return '';
}

function extractJsdoc(node: ts.Node): string | undefined {
    const docs = ts.getJSDocCommentsAndTags(node);
    if (docs === undefined || docs.length === 0) return undefined;
    const jsDocNode = docs.find((d) => d.kind === ts.SyntaxKind.JSDoc);
    if (jsDocNode === undefined) return undefined;
    if (!ts.isJSDoc(jsDocNode)) return undefined;

    const commentText = commentToString(jsDocNode.comment);
    const firstParagraph = commentText.split(/\n\s*\n/)[0] ?? '';
    let text = firstParagraph.replace(/\s+/g, ' ').trim();

    const inline: string[] = [];
    let exampleSeen = false;
    for (const tag of jsDocNode.tags ?? []) {
        const tagName = tag.tagName.escapedText as string;
        const c = commentToString(tag.comment).replace(/\s+/g, ' ').trim();
        if (tagName === 'param' || tagName === 'returns' || tagName === 'return') continue;
        if (tagName === 'deprecated') {
            inline.push(c.length > 0 ? `@deprecated ${c}` : '@deprecated');
        } else if (tagName === 'since') {
            inline.push(c.length > 0 ? `@since ${c}` : '@since');
        } else if (tagName === 'example' && !exampleSeen) {
            exampleSeen = true;
            const ex = truncate(c, JSDOC_EXAMPLE_TRUNCATE);
            inline.push(ex.length > 0 ? `@example ${ex}` : '@example');
        }
    }
    if (inline.length > 0) {
        text = text.length > 0 ? `${text} ${inline.join(' ')}` : inline.join(' ');
    }
    return text.length > 0 ? text : undefined;
}

// ── AST: helpers ──────────────────────────────────────────────────────────────

function lineOf(node: ts.Node, sourceFile: ts.SourceFile): number {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    return line + 1;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const mods = ts.getModifiers(node);
    return mods !== undefined ? mods.some((m) => m.kind === kind) : false;
}

const hasExportModifier = (node: ts.Node): boolean => hasModifier(node, ts.SyntaxKind.ExportKeyword);
const hasDefaultModifier = (node: ts.Node): boolean => hasModifier(node, ts.SyntaxKind.DefaultKeyword);

function variableKind(stmt: ts.VariableStatement): string {
    // Distinguish const/let/var from VariableStatement.declarationList.flags.
    const flags = stmt.declarationList.flags;
    if (flags & ts.NodeFlags.Const) return 'const';
    if (flags & ts.NodeFlags.Let) return 'let';
    return 'var';
}

type MemberKind = 'constructor' | 'method' | 'property' | 'getter' | 'setter';

function classifyMember(member: ts.ClassElement): MemberKind | undefined {
    if (ts.isConstructorDeclaration(member)) return 'constructor';
    if (ts.isMethodDeclaration(member)) return 'method';
    if (ts.isPropertyDeclaration(member)) return 'property';
    if (ts.isGetAccessorDeclaration(member)) return 'getter';
    if (ts.isSetAccessorDeclaration(member)) return 'setter';
    return undefined;
}

function memberName(member: ts.ClassElement): string | undefined {
    if (ts.isConstructorDeclaration(member)) return 'constructor';
    const n = member.name;
    if (n === undefined) return undefined;
    if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n)) {
        return n.text;
    }
    return n.getText();
}

// ── AST: per-file symbol extraction (all top-level declarations) ──────────────

interface MemberEntry {
    name: string;
    kind: string;
    line: number;
}

interface SymbolEntry {
    name: string;
    kind: string;
    line: number;
    exported: boolean;
    signature: string;
    members?: MemberEntry[];
}

function extractFileSymbols(sourceFile: ts.SourceFile, maxLen: number): SymbolEntry[] {
    const symbols: SymbolEntry[] = [];
    for (const stmt of sourceFile.statements) {
        const line = lineOf(stmt, sourceFile);
        const exported = hasExportModifier(stmt);
        const isDefault = hasDefaultModifier(stmt);

        if (ts.isFunctionDeclaration(stmt) && (stmt.name !== undefined || isDefault)) {
            symbols.push({
                name: isDefault ? 'default' : (stmt.name as ts.Identifier).text,
                kind: 'function',
                line,
                exported,
                signature: sliceFunctionSignature(stmt, sourceFile, maxLen),
            });
        } else if (ts.isClassDeclaration(stmt)) {
            const name = isDefault ? 'default' : stmt.name !== undefined ? stmt.name.text : '<anonymous>';
            const members: MemberEntry[] = [];
            for (const m of stmt.members) {
                const kind = classifyMember(m);
                const nm = memberName(m);
                if (kind === undefined || nm === undefined) continue;
                members.push({ name: nm, kind, line: lineOf(m, sourceFile) });
            }
            members.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
            symbols.push({
                name,
                kind: 'class',
                line,
                exported,
                signature: sliceClassHeader(stmt, sourceFile, maxLen),
                members,
            });
        } else if (ts.isInterfaceDeclaration(stmt)) {
            symbols.push({
                name: stmt.name.text,
                kind: 'interface',
                line,
                exported,
                signature: sliceFull(stmt, sourceFile, maxLen),
            });
        } else if (ts.isTypeAliasDeclaration(stmt)) {
            symbols.push({
                name: stmt.name.text,
                kind: 'type',
                line,
                exported,
                signature: sliceFull(stmt, sourceFile, maxLen),
            });
        } else if (ts.isEnumDeclaration(stmt)) {
            symbols.push({
                name: stmt.name.text,
                kind: 'enum',
                line,
                exported,
                signature: sliceFull(stmt, sourceFile, maxLen),
            });
        } else if (ts.isVariableStatement(stmt)) {
            const kind = variableKind(stmt);
            for (const decl of stmt.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                symbols.push({
                    name: decl.name.text,
                    kind,
                    line: lineOf(decl, sourceFile),
                    exported,
                    signature: sliceVariable(stmt, sourceFile, maxLen),
                });
            }
        } else if (ts.isModuleDeclaration(stmt) && stmt.name !== undefined) {
            symbols.push({
                name: stmt.name.text,
                kind: 'namespace',
                line,
                exported,
                signature: sliceFull(stmt, sourceFile, maxLen),
            });
        }
    }
    symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
    return symbols;
}

// ── AST: imports + reExports (sorted module specifiers) ───────────────────────

function extractImportsAndReExports(sourceFile: ts.SourceFile): { imports: string[]; reExports: string[] } {
    const imports = new Set<string>();
    const reExports = new Set<string>();
    for (const stmt of sourceFile.statements) {
        if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
            imports.add(stmt.moduleSpecifier.text);
        } else if (
            ts.isExportDeclaration(stmt) &&
            stmt.moduleSpecifier !== undefined &&
            ts.isStringLiteral(stmt.moduleSpecifier)
        ) {
            reExports.add(stmt.moduleSpecifier.text);
        }
    }
    return { imports: [...imports].sort(), reExports: [...reExports].sort() };
}

// ── Public API: transitive re-export resolver ────────────────────────────────

function resolveSpecifierToFile(fromAbsFile: string, specifier: string, rootDir: string): string | undefined {
    if (!specifier.startsWith('.')) return undefined; // bare or absolute: out of scope
    const fromDir = dirname(fromAbsFile);
    const tsSpec = specifier.replace(/\.js$/, '.ts');
    const candidates = [resolve(fromDir, tsSpec), resolve(fromDir, tsSpec.replace(/\.ts$/, '/index.ts'))];
    for (const abs of candidates) {
        if (existsSync(abs)) return toPosix(relative(rootDir, abs));
    }
    return undefined;
}

function classifyDeclaration(stmt: ts.Statement): string | undefined {
    if (ts.isFunctionDeclaration(stmt)) return 'function';
    if (ts.isClassDeclaration(stmt)) return 'class';
    if (ts.isInterfaceDeclaration(stmt)) return 'interface';
    if (ts.isTypeAliasDeclaration(stmt)) return 'type';
    if (ts.isEnumDeclaration(stmt)) return 'enum';
    if (ts.isModuleDeclaration(stmt)) return 'namespace';
    return undefined;
}

interface DeclInfo {
    kind: string;
    node: ts.Node;
    parent?: ts.VariableStatement;
}

type FileExport =
    | { kind: 'star'; fromSpec: string; typeOnly: boolean }
    | { kind: 'namespace-star'; name: string; fromSpec: string; typeOnly: boolean }
    | { kind: 'named'; name: string; importedName: string; fromSpec?: string; typeOnly: boolean }
    | { kind: 'declaration'; name: string; decl: DeclInfo; typeOnly: boolean };

/**
 * Enumerate this file's exports as a flat list of records.
 */
function collectFileExports(sourceFile: ts.SourceFile): FileExport[] {
    const out: FileExport[] = [];
    for (const stmt of sourceFile.statements) {
        if (ts.isExportDeclaration(stmt)) {
            const fromSpec =
                stmt.moduleSpecifier !== undefined && ts.isStringLiteral(stmt.moduleSpecifier)
                    ? stmt.moduleSpecifier.text
                    : undefined;
            const typeOnly = stmt.isTypeOnly === true;
            if (stmt.exportClause === undefined && fromSpec !== undefined) {
                out.push({ kind: 'star', fromSpec, typeOnly });
            } else if (
                stmt.exportClause !== undefined &&
                ts.isNamespaceExport(stmt.exportClause) &&
                fromSpec !== undefined
            ) {
                out.push({ kind: 'namespace-star', name: stmt.exportClause.name.text, fromSpec, typeOnly });
            } else if (stmt.exportClause !== undefined && ts.isNamedExports(stmt.exportClause)) {
                for (const el of stmt.exportClause.elements) {
                    out.push({
                        kind: 'named',
                        name: el.name.text,
                        importedName: el.propertyName !== undefined ? el.propertyName.text : el.name.text,
                        ...(fromSpec !== undefined ? { fromSpec } : {}),
                        typeOnly: typeOnly || el.isTypeOnly === true,
                    });
                }
            }
            continue;
        }
        if (!hasExportModifier(stmt)) continue;
        const isDefault = hasDefaultModifier(stmt);

        if (ts.isVariableStatement(stmt)) {
            const varK = variableKind(stmt);
            for (const decl of stmt.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                out.push({
                    kind: 'declaration',
                    name: decl.name.text,
                    decl: { kind: varK, node: decl, parent: stmt },
                    typeOnly: false,
                });
            }
            continue;
        }
        const declKind = classifyDeclaration(stmt);
        if (declKind === undefined) continue;
        let declName = '<anonymous>';
        if (
            (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) &&
            stmt.name !== undefined &&
            ts.isIdentifier(stmt.name)
        ) {
            declName = stmt.name.text;
        } else if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) || ts.isEnumDeclaration(stmt)) {
            declName = stmt.name.text;
        } else if (ts.isModuleDeclaration(stmt) && ts.isIdentifier(stmt.name)) {
            declName = stmt.name.text;
        }
        const name = isDefault ? 'default' : declName;
        out.push({
            kind: 'declaration',
            name,
            decl: { kind: declKind, node: stmt },
            typeOnly: declKind === 'interface' || declKind === 'type',
        });
    }
    return out;
}

interface PublicApiEntry {
    name: string;
    kind: string;
    file: string;
    line: number;
    signature: string;
    jsdoc?: string;
    typeOnly?: boolean;
}

function buildSymbolFromDecl(
    decl: DeclInfo,
    sourceFile: ts.SourceFile,
    relFile: string,
    maxLen: number,
): Omit<PublicApiEntry, 'name'> {
    const { kind, node, parent } = decl;
    let signature: string;
    let line: number;
    if (kind === 'function' && ts.isFunctionDeclaration(node)) {
        signature = sliceFunctionSignature(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else if (kind === 'class' && ts.isClassDeclaration(node)) {
        signature = sliceClassHeader(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else if ((kind === 'const' || kind === 'let' || kind === 'var') && parent !== undefined) {
        signature = sliceVariable(parent, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else {
        signature = sliceFull(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    }
    const jsdoc = extractJsdoc(parent ?? node);
    return { kind, file: relFile, line, signature, ...(jsdoc !== undefined ? { jsdoc } : {}) };
}

function resolvePublicApi(
    entrypoints: string[],
    rootDir: string,
    sourceFileByRel: Map<string, ts.SourceFile>,
    maxLen: number,
): PublicApiEntry[] {
    const collected: PublicApiEntry[] = [];
    const seen = new Set<string>();

    function emit(relFile: string, decl: DeclInfo, sourceFile: ts.SourceFile, name: string, typeOnly: boolean): void {
        const key = `${relFile}:::${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const sym = buildSymbolFromDecl(decl, sourceFile, relFile, maxLen);
        const entry: PublicApiEntry = { name, ...sym };
        if (typeOnly || decl.kind === 'interface' || decl.kind === 'type') entry.typeOnly = true;
        collected.push(entry);
    }

    function visit(relFile: string, depth: number): void {
        if (depth > RE_EXPORT_DEPTH_CAP) return;
        const sf = sourceFileByRel.get(relFile);
        if (sf === undefined) return;
        const exports = collectFileExports(sf);

        for (const e of exports) {
            if (e.kind === 'star') {
                const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                if (target !== undefined && sourceFileByRel.has(target)) visit(target, depth + 1);
            } else if (e.kind === 'namespace-star') {
                const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                if (target !== undefined && sourceFileByRel.has(target)) {
                    const key = `${target}:::${e.name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const entry: PublicApiEntry = {
                            name: e.name,
                            kind: 'namespace',
                            file: target,
                            line: 1,
                            signature: `namespace ${e.name}`,
                        };
                        if (e.typeOnly) entry.typeOnly = true;
                        collected.push(entry);
                    }
                }
            } else if (e.kind === 'named') {
                const fromSpec = e.fromSpec;
                if (fromSpec !== undefined) {
                    const target = resolveSpecifierToFile(join(rootDir, relFile), fromSpec, rootDir);
                    if (target !== undefined && sourceFileByRel.has(target)) {
                        const sub = findOriginalDeclaration(
                            target,
                            e.importedName,
                            sourceFileByRel,
                            rootDir,
                            depth + 1,
                        );
                        if (sub !== undefined)
                            emit(sub.file, sub.decl, sub.sourceFile, e.name, e.typeOnly || sub.typeOnly);
                    }
                } else {
                    const sub = findOriginalDeclaration(relFile, e.importedName, sourceFileByRel, rootDir, depth);
                    if (sub !== undefined) emit(sub.file, sub.decl, sub.sourceFile, e.name, e.typeOnly || sub.typeOnly);
                }
            } else if (e.kind === 'declaration') {
                emit(relFile, e.decl, sf, e.name, e.typeOnly);
            }
        }
    }

    for (const ep of entrypoints) visit(ep, 0);
    return collected;
}

function findLocalDeclaration(sourceFile: ts.SourceFile, name: string): DeclInfo | undefined {
    // Locate any top-level declaration of `name` in this file, regardless of
    // whether it has an `export` modifier.
    for (const stmt of sourceFile.statements) {
        if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === name) {
            return { kind: 'function', node: stmt };
        }
        if (ts.isClassDeclaration(stmt) && stmt.name?.text === name) {
            return { kind: 'class', node: stmt };
        }
        if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) {
            return { kind: 'interface', node: stmt };
        }
        if (ts.isTypeAliasDeclaration(stmt) && stmt.name.text === name) {
            return { kind: 'type', node: stmt };
        }
        if (ts.isEnumDeclaration(stmt) && stmt.name.text === name) {
            return { kind: 'enum', node: stmt };
        }
        if (
            ts.isModuleDeclaration(stmt) &&
            stmt.name !== undefined &&
            ts.isIdentifier(stmt.name) &&
            stmt.name.text === name
        ) {
            return { kind: 'namespace', node: stmt };
        }
        if (ts.isVariableStatement(stmt)) {
            for (const decl of stmt.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.name.text === name) {
                    return { kind: variableKind(stmt), node: decl, parent: stmt };
                }
            }
        }
    }
    return undefined;
}

function findImportBinding(
    sourceFile: ts.SourceFile,
    localName: string,
): { fromSpec: string; importedName: string } | undefined {
    for (const stmt of sourceFile.statements) {
        if (!ts.isImportDeclaration(stmt)) continue;
        if (stmt.importClause?.namedBindings === undefined) continue;
        if (!ts.isNamedImports(stmt.importClause.namedBindings)) continue;
        if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
        for (const el of stmt.importClause.namedBindings.elements) {
            if (el.name.text === localName) {
                return {
                    fromSpec: stmt.moduleSpecifier.text,
                    importedName: el.propertyName !== undefined ? el.propertyName.text : el.name.text,
                };
            }
        }
    }
    return undefined;
}

interface FoundDeclaration {
    file: string;
    decl: DeclInfo;
    sourceFile: ts.SourceFile;
    typeOnly: boolean;
}

function findOriginalDeclaration(
    relFile: string,
    exportedName: string,
    sourceFileByRel: Map<string, ts.SourceFile>,
    rootDir: string,
    depth: number,
): FoundDeclaration | undefined {
    if (depth > RE_EXPORT_DEPTH_CAP) return undefined;
    const sf = sourceFileByRel.get(relFile);
    if (sf === undefined) return undefined;
    const exports = collectFileExports(sf);
    for (const e of exports) {
        if (e.kind === 'declaration' && e.name === exportedName) {
            return { file: relFile, decl: e.decl, sourceFile: sf, typeOnly: e.typeOnly };
        }
        if (e.kind === 'named' && e.name === exportedName) {
            const fromSpec = e.fromSpec;
            if (fromSpec !== undefined) {
                const target = resolveSpecifierToFile(join(rootDir, relFile), fromSpec, rootDir);
                if (target !== undefined) {
                    const sub = findOriginalDeclaration(target, e.importedName, sourceFileByRel, rootDir, depth + 1);
                    if (sub !== undefined) return { ...sub, typeOnly: sub.typeOnly || e.typeOnly };
                }
            } else {
                // `export { X }` with no fromSpec — resolve against (a) a local
                // declaration of X (possibly without `export`), or (b) an
                // imported binding `import { ... as X } from '...'`. Avoid
                // recursing into this same file with the same name, which
                // would loop until depth cap and never resolve.
                const local = findLocalDeclaration(sf, e.importedName);
                if (local !== undefined) {
                    return {
                        file: relFile,
                        decl: local,
                        sourceFile: sf,
                        typeOnly: e.typeOnly || local.kind === 'interface' || local.kind === 'type',
                    };
                }
                const imp = findImportBinding(sf, e.importedName);
                if (imp !== undefined) {
                    const target = resolveSpecifierToFile(join(rootDir, relFile), imp.fromSpec, rootDir);
                    if (target !== undefined) {
                        const sub = findOriginalDeclaration(
                            target,
                            imp.importedName,
                            sourceFileByRel,
                            rootDir,
                            depth + 1,
                        );
                        if (sub !== undefined) return { ...sub, typeOnly: sub.typeOnly || e.typeOnly };
                    }
                }
            }
        }
    }
    for (const e of exports) {
        if (e.kind === 'star') {
            const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
            if (target !== undefined) {
                const sub = findOriginalDeclaration(target, exportedName, sourceFileByRel, rootDir, depth + 1);
                if (sub !== undefined) return sub;
            }
        }
    }
    return undefined;
}

// ── Top-level builder ─────────────────────────────────────────────────────────

interface FileEntry {
    path: string;
    imports: string[];
    reExports: string[];
    symbols: SymbolEntry[];
}

interface CodemapData {
    schema: string;
    repo: { name: string; version: string };
    sourceHash: string;
    entrypoints: string[];
    publicApi: PublicApiEntry[];
    files: FileEntry[];
}

interface BuildCodemapResult {
    markdown: string;
    sourceHash: string;
    data: CodemapData;
}

export function buildCodemap({ rootDir }: { rootDir: string }): BuildCodemapResult {
    const root = resolve(rootDir);
    const config = loadConfig(root);
    const relFiles = collectSourceFiles(root, config.sourceDirs, config.exclude);
    const sourceHash = computeSourceHash(root, relFiles);

    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string; version: string };

    // Parse source files directly. We only need AST walking, not type-checking,
    // and createProgram doesn't reliably attach `.jsDoc` arrays to nodes (which
    // ts.getJSDocCommentsAndTags relies on). createSourceFile with
    // setParentNodes=true gives us both JSDoc attachment and `.parent` chains.
    const sourceFileByRel = new Map<string, ts.SourceFile>();
    for (const rel of relFiles) {
        const abs = join(root, rel);
        const text = readFileSync(abs, 'utf8');
        const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, /* setParentNodes */ true);
        if (!sf.isDeclarationFile) sourceFileByRel.set(rel, sf);
    }

    const files: FileEntry[] = [];
    for (const rel of relFiles) {
        const sf = sourceFileByRel.get(rel);
        if (sf === undefined) continue;
        const { imports, reExports } = extractImportsAndReExports(sf);
        const symbols = extractFileSymbols(sf, config.maxSignatureLength);
        files.push({ path: rel, imports, reExports, symbols });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));

    const publicApi = resolvePublicApi(config.entrypoints, root, sourceFileByRel, config.maxSignatureLength);
    publicApi.sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file));

    const data: CodemapData = {
        schema: SCHEMA_VERSION,
        repo: { name: pkg.name, version: pkg.version },
        sourceHash,
        entrypoints: [...config.entrypoints],
        publicApi,
        files,
    };

    return { markdown: renderMarkdown(data), sourceHash, data };
}

function renderMarkdown(data: CodemapData): string {
    const preamble = [
        '# CODEMAP',
        '',
        'Machine-readable symbol index for coding agents. Run `npm run codemap` to regenerate.',
        '',
        'Schema: `codemap.v2`. Determinism: no timestamps; staleness is detected via `sourceHash`.',
        '',
    ].join('\n');
    return `${preamble}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
}

// ── --check mode ──────────────────────────────────────────────────────────────

function unifiedDiffPreview(expected: string, actual: string, maxLines: number): string {
    const e = expected.split('\n');
    const a = actual.split('\n');
    const out: string[] = [];
    const max = Math.max(e.length, a.length);
    for (let i = 0; i < max && out.length < maxLines; i++) {
        const left = e[i];
        const right = a[i];
        if (left === right) continue;
        if (left !== undefined) out.push(`- ${left}`);
        if (out.length >= maxLines) break;
        if (right !== undefined) out.push(`+ ${right}`);
    }
    return out.join('\n');
}

interface WriteStream {
    write: (s: string) => void;
}

export function runCli({
    rootDir,
    check,
    stdout = process.stdout,
    stderr = process.stderr,
}: {
    rootDir: string;
    check: boolean;
    stdout?: WriteStream;
    stderr?: WriteStream;
}): number {
    const { markdown } = buildCodemap({ rootDir });
    const outPath = join(resolve(rootDir), 'CODEMAP.md');

    if (check) {
        if (!existsSync(outPath)) {
            stderr.write('✗ CODEMAP.md is missing. Run `npm run codemap` and commit the result.\n');
            return 1;
        }
        // Normalize line endings on both sides so git autocrlf on Windows
        // doesn't produce false-positive staleness against LF-generated output.
        const onDisk = normalizeLineEndings(readFileSync(outPath, 'utf8'));
        const expected = normalizeLineEndings(markdown);
        if (onDisk === expected) {
            stdout.write('✓ CODEMAP.md is up to date\n');
            return 0;
        }
        stderr.write('✗ CODEMAP.md is stale. Run `npm run codemap` and commit the result.\n\n');
        stderr.write(`${unifiedDiffPreview(onDisk, expected, DIFF_PREVIEW_LINES)}\n`);
        return 1;
    }

    writeFileSync(outPath, markdown, 'utf8');
    stdout.write('✓ Wrote CODEMAP.md\n');
    return 0;
}

// ── Entry ─────────────────────────────────────────────────────────────────────

const isDirectInvocation = (() => {
    try {
        return fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '');
    } catch {
        return false;
    }
})();

if (isDirectInvocation) {
    const check = process.argv.includes('--check');
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    process.exit(runCli({ rootDir: repoRoot, check }));
}
