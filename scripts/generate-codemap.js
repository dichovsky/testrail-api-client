#!/usr/bin/env node
/**
 * Generates CODEMAP.md — a machine-readable symbol index for coding agents.
 * Run: node scripts/generate-codemap.js          (regenerate)
 *      node scripts/generate-codemap.js --check  (verify committed CODEMAP.md is up to date)
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
 *
 * Deviations from the original spec:
 *   - .gitignore is NOT parsed; sourceDirs + exclude in codemap.config.json
 *     are the sole filters. Adding a parser would be dead code given this
 *     repo's layout (every ignored path is already outside sourceDirs).
 *   - The script is .js (not .ts) so no new devDep (tsx) is needed; the
 *     TypeScript Compiler API is imported directly from the existing devDep.
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

function toPosix(p) {
    return p.split(/[\\/]/).join('/');
}

function loadConfig(rootDir) {
    const configPath = join(rootDir, 'codemap.config.json');
    if (!existsSync(configPath)) {
        throw new Error(`codemap.config.json not found at ${configPath}`);
    }
    const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    return {
        sourceDirs: cfg.sourceDirs ?? ['src'],
        entrypoints: cfg.entrypoints ?? ['src/index.ts'],
        exclude: cfg.exclude ?? [],
        maxSignatureLength: cfg.maxSignatureLength ?? 200,
    };
}

// Hand-rolled glob → regex. Supports **, *, ?, literal segments.
// Patterns are matched against POSIX-normalized paths relative to rootDir.
function globToRegex(glob) {
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
        } else if ('.+^$(){}|[]\\'.includes(c)) {
            re += '\\' + c;
            i += 1;
        } else {
            re += c;
            i += 1;
        }
    }
    return new RegExp('^' + re + '$');
}

function matchesAnyGlob(relPath, compiledGlobs) {
    return compiledGlobs.some((re) => re.test(relPath));
}

function collectSourceFiles(rootDir, sourceDirs, exclude) {
    const compiled = exclude.map(globToRegex);
    const files = [];
    for (const dir of sourceDirs) {
        const abs = join(rootDir, dir);
        if (!existsSync(abs)) continue;
        walk(abs, rootDir, compiled, files);
    }
    files.sort();
    return files;
}

function walk(absDir, rootDir, compiledExcludes, out) {
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

function computeSourceHash(rootDir, relFiles) {
    const h = createHash('sha256');
    for (const rel of [...relFiles].sort()) {
        const content = readFileSync(join(rootDir, rel), 'utf8');
        h.update(rel);
        h.update('\0');
        h.update(content);
        h.update('\0');
    }
    return h.digest('hex');
}

// ── AST: signature extraction via scanner (preserves string literals) ─────────

function normalizeWhitespace(source) {
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

function truncate(s, maxLen) {
    return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

function sliceFunctionSignature(node, sourceFile, maxLen) {
    const text = sourceFile.text;
    const start = node.getStart(sourceFile);
    const end = node.body ? node.body.getStart(sourceFile) : node.getEnd();
    const normalized = normalizeWhitespace(text.slice(start, end))
        .trim()
        .replace(/[\s{]+$/, '')
        .trim();
    return truncate(normalized, maxLen);
}

function sliceClassHeader(node, sourceFile, maxLen) {
    const text = sourceFile.text;
    const start = node.getStart(sourceFile);
    const openBrace = text.indexOf('{', start);
    const slice = openBrace > -1 ? text.slice(start, openBrace) : text.slice(start, node.getEnd());
    return truncate(normalizeWhitespace(slice).trim(), maxLen);
}

function sliceFull(node, sourceFile, maxLen) {
    const normalized = normalizeWhitespace(node.getText(sourceFile)).trim().replace(/;\s*$/, '');
    return truncate(normalized, maxLen);
}

function sliceVariable(stmt, sourceFile, maxLen) {
    const normalized = normalizeWhitespace(stmt.getText(sourceFile)).trim().replace(/;\s*$/, '');
    return truncate(normalized, maxLen);
}

// ── AST: JSDoc extraction (first paragraph + inline tag mentions) ─────────────

function commentToString(comment) {
    if (typeof comment === 'string') return comment;
    if (!comment) return '';
    return comment.map((c) => c.text ?? '').join('');
}

function extractJsdoc(node) {
    const docs = ts.getJSDocCommentsAndTags(node);
    if (!docs || docs.length === 0) return undefined;
    const jsDocNode = docs.find((d) => d.kind === ts.SyntaxKind.JSDoc);
    if (!jsDocNode) return undefined;

    const commentText = commentToString(jsDocNode.comment);
    const firstParagraph = commentText.split(/\n\s*\n/)[0] ?? '';
    let text = firstParagraph.replace(/\s+/g, ' ').trim();

    const inline = [];
    let exampleSeen = false;
    for (const tag of jsDocNode.tags ?? []) {
        const tagName = tag.tagName.escapedText;
        if (tagName === 'param' || tagName === 'returns' || tagName === 'return') continue;
        const c = commentToString(tag.comment).replace(/\s+/g, ' ').trim();
        if (tagName === 'deprecated') {
            inline.push(c ? `@deprecated ${c}` : '@deprecated');
        } else if (tagName === 'since') {
            inline.push(c ? `@since ${c}` : '@since');
        } else if (tagName === 'example' && !exampleSeen) {
            exampleSeen = true;
            const ex = truncate(c, JSDOC_EXAMPLE_TRUNCATE);
            inline.push(ex ? `@example ${ex}` : '@example');
        }
    }
    if (inline.length > 0) {
        text = text ? `${text} ${inline.join(' ')}` : inline.join(' ');
    }
    return text || undefined;
}

// ── AST: helpers ──────────────────────────────────────────────────────────────

function lineOf(node, sourceFile) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    return line + 1;
}

function hasModifier(node, kind) {
    if (!ts.canHaveModifiers(node)) return false;
    const mods = ts.getModifiers(node);
    return mods ? mods.some((m) => m.kind === kind) : false;
}

const hasExportModifier = (node) => hasModifier(node, ts.SyntaxKind.ExportKeyword);
const hasDefaultModifier = (node) => hasModifier(node, ts.SyntaxKind.DefaultKeyword);

function classifyMember(member) {
    if (ts.isConstructorDeclaration(member)) return 'constructor';
    if (ts.isMethodDeclaration(member)) return 'method';
    if (ts.isPropertyDeclaration(member)) return 'property';
    if (ts.isGetAccessorDeclaration(member)) return 'getter';
    if (ts.isSetAccessorDeclaration(member)) return 'setter';
    return undefined;
}

function memberName(member) {
    if (ts.isConstructorDeclaration(member)) return 'constructor';
    const n = member.name;
    if (!n) return undefined;
    if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n)) {
        return n.text;
    }
    return n.getText();
}

// ── AST: per-file symbol extraction (all top-level declarations) ──────────────

function extractFileSymbols(sourceFile, maxLen) {
    const symbols = [];
    for (const stmt of sourceFile.statements) {
        const line = lineOf(stmt, sourceFile);
        const exported = hasExportModifier(stmt);
        const isDefault = hasDefaultModifier(stmt);

        if (ts.isFunctionDeclaration(stmt) && (stmt.name || isDefault)) {
            symbols.push({
                name: isDefault ? 'default' : stmt.name.text,
                kind: 'function',
                line,
                exported,
                signature: sliceFunctionSignature(stmt, sourceFile, maxLen),
            });
        } else if (ts.isClassDeclaration(stmt)) {
            const name = isDefault ? 'default' : stmt.name ? stmt.name.text : '<anonymous>';
            const members = [];
            for (const m of stmt.members) {
                const kind = classifyMember(m);
                const nm = memberName(m);
                if (!kind || !nm) continue;
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
            for (const decl of stmt.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                symbols.push({
                    name: decl.name.text,
                    kind: 'const',
                    line: lineOf(decl, sourceFile),
                    exported,
                    signature: sliceVariable(stmt, sourceFile, maxLen),
                });
            }
        } else if (ts.isModuleDeclaration(stmt) && stmt.name) {
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

function extractImportsAndReExports(sourceFile) {
    const imports = new Set();
    const reExports = new Set();
    for (const stmt of sourceFile.statements) {
        if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
            imports.add(stmt.moduleSpecifier.text);
        } else if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
            reExports.add(stmt.moduleSpecifier.text);
        }
    }
    return { imports: [...imports].sort(), reExports: [...reExports].sort() };
}

// ── Public API: transitive re-export resolver ────────────────────────────────

function resolveSpecifierToFile(fromAbsFile, specifier, rootDir) {
    if (!specifier.startsWith('.')) return undefined; // bare or absolute: out of scope
    const fromDir = dirname(fromAbsFile);
    const tsSpec = specifier.replace(/\.js$/, '.ts');
    const candidates = [resolve(fromDir, tsSpec), resolve(fromDir, tsSpec.replace(/\.ts$/, '/index.ts'))];
    for (const abs of candidates) {
        if (existsSync(abs)) return toPosix(relative(rootDir, abs));
    }
    return undefined;
}

function classifyDeclaration(stmt) {
    if (ts.isFunctionDeclaration(stmt)) return 'function';
    if (ts.isClassDeclaration(stmt)) return 'class';
    if (ts.isInterfaceDeclaration(stmt)) return 'interface';
    if (ts.isTypeAliasDeclaration(stmt)) return 'type';
    if (ts.isEnumDeclaration(stmt)) return 'enum';
    if (ts.isModuleDeclaration(stmt)) return 'namespace';
    return undefined;
}

/**
 * Enumerate this file's exports as a flat list of records:
 *   - { kind: 'star',           fromSpec, typeOnly }                    export * from '...'
 *   - { kind: 'namespace-star', name, fromSpec, typeOnly }              export * as X from '...'
 *   - { kind: 'named',          name, importedName, fromSpec?, typeOnly } export { A as B } from '...' / export { X }
 *   - { kind: 'declaration',    name, decl, typeOnly }                  export class/function/const/...
 */
function collectFileExports(sourceFile) {
    const out = [];
    for (const stmt of sourceFile.statements) {
        if (ts.isExportDeclaration(stmt)) {
            const fromSpec =
                stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
                    ? stmt.moduleSpecifier.text
                    : undefined;
            const typeOnly = stmt.isTypeOnly === true;
            if (stmt.exportClause === undefined && fromSpec) {
                out.push({ kind: 'star', fromSpec, typeOnly });
            } else if (stmt.exportClause && ts.isNamespaceExport(stmt.exportClause) && fromSpec) {
                out.push({ kind: 'namespace-star', name: stmt.exportClause.name.text, fromSpec, typeOnly });
            } else if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
                for (const el of stmt.exportClause.elements) {
                    out.push({
                        kind: 'named',
                        name: el.name.text,
                        importedName: el.propertyName ? el.propertyName.text : el.name.text,
                        fromSpec,
                        typeOnly: typeOnly || el.isTypeOnly === true,
                    });
                }
            }
            continue;
        }
        if (!hasExportModifier(stmt)) continue;
        const isDefault = hasDefaultModifier(stmt);

        if (ts.isVariableStatement(stmt)) {
            for (const decl of stmt.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                out.push({
                    kind: 'declaration',
                    name: decl.name.text,
                    decl: { kind: 'const', node: decl, parent: stmt },
                    typeOnly: false,
                });
            }
            continue;
        }
        const declKind = classifyDeclaration(stmt);
        if (!declKind) continue;
        const name = isDefault ? 'default' : stmt.name && ts.isIdentifier(stmt.name) ? stmt.name.text : '<anonymous>';
        out.push({
            kind: 'declaration',
            name,
            decl: { kind: declKind, node: stmt },
            typeOnly: declKind === 'interface' || declKind === 'type',
        });
    }
    return out;
}

function buildSymbolFromDecl(decl, sourceFile, relFile, maxLen) {
    const { kind, node, parent } = decl;
    let signature;
    let line;
    if (kind === 'function') {
        signature = sliceFunctionSignature(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else if (kind === 'class') {
        signature = sliceClassHeader(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else if (kind === 'const') {
        signature = sliceVariable(parent, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    } else {
        signature = sliceFull(node, sourceFile, maxLen);
        line = lineOf(node, sourceFile);
    }
    const jsdoc = extractJsdoc(parent ?? node);
    return { kind, file: relFile, line, signature, jsdoc };
}

function resolvePublicApi(entrypoints, rootDir, sourceFileByRel, maxLen) {
    const collected = [];
    const seen = new Set();

    function emit(relFile, decl, sourceFile, name, typeOnly) {
        const key = `${relFile}:::${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const sym = buildSymbolFromDecl(decl, sourceFile, relFile, maxLen);
        const entry = { name, ...sym };
        if (typeOnly || decl.kind === 'interface' || decl.kind === 'type') entry.typeOnly = true;
        if (!entry.jsdoc) delete entry.jsdoc;
        collected.push(entry);
    }

    function visit(relFile, depth) {
        if (depth > RE_EXPORT_DEPTH_CAP) return;
        const sf = sourceFileByRel.get(relFile);
        if (!sf) return;
        const exports = collectFileExports(sf);

        for (const e of exports) {
            if (e.kind === 'star') {
                const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                if (target && sourceFileByRel.has(target)) visit(target, depth + 1);
            } else if (e.kind === 'namespace-star') {
                const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                if (target && sourceFileByRel.has(target)) {
                    const key = `${target}:::${e.name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const entry = {
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
                if (e.fromSpec) {
                    const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                    if (target && sourceFileByRel.has(target)) {
                        const sub = findOriginalDeclaration(
                            target,
                            e.importedName,
                            sourceFileByRel,
                            rootDir,
                            depth + 1,
                        );
                        if (sub) emit(sub.file, sub.decl, sub.sourceFile, e.name, e.typeOnly || sub.typeOnly);
                    }
                } else {
                    const sub = findOriginalDeclaration(relFile, e.importedName, sourceFileByRel, rootDir, depth);
                    if (sub) emit(sub.file, sub.decl, sub.sourceFile, e.name, e.typeOnly || sub.typeOnly);
                }
            } else if (e.kind === 'declaration') {
                emit(relFile, e.decl, sf, e.name, e.typeOnly);
            }
        }
    }

    for (const ep of entrypoints) visit(ep, 0);
    return collected;
}

function findOriginalDeclaration(relFile, exportedName, sourceFileByRel, rootDir, depth) {
    if (depth > RE_EXPORT_DEPTH_CAP) return undefined;
    const sf = sourceFileByRel.get(relFile);
    if (!sf) return undefined;
    const exports = collectFileExports(sf);
    for (const e of exports) {
        if (e.kind === 'declaration' && e.name === exportedName) {
            return { file: relFile, decl: e.decl, sourceFile: sf, typeOnly: e.typeOnly };
        }
        if (e.kind === 'named' && e.name === exportedName) {
            if (e.fromSpec) {
                const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
                if (target) {
                    const sub = findOriginalDeclaration(target, e.importedName, sourceFileByRel, rootDir, depth + 1);
                    if (sub) return { ...sub, typeOnly: sub.typeOnly || e.typeOnly };
                }
            } else {
                const sub = findOriginalDeclaration(relFile, e.importedName, sourceFileByRel, rootDir, depth + 1);
                if (sub) return { ...sub, typeOnly: sub.typeOnly || e.typeOnly };
            }
        }
    }
    for (const e of exports) {
        if (e.kind === 'star') {
            const target = resolveSpecifierToFile(join(rootDir, relFile), e.fromSpec, rootDir);
            if (target) {
                const sub = findOriginalDeclaration(target, exportedName, sourceFileByRel, rootDir, depth + 1);
                if (sub) return sub;
            }
        }
    }
    return undefined;
}

// ── Top-level builder ─────────────────────────────────────────────────────────

export function buildCodemap({ rootDir }) {
    const root = resolve(rootDir);
    const config = loadConfig(root);
    const relFiles = collectSourceFiles(root, config.sourceDirs, config.exclude);
    const sourceHash = computeSourceHash(root, relFiles);

    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

    // Parse source files directly. We only need AST walking, not type-checking,
    // and createProgram doesn't reliably attach `.jsDoc` arrays to nodes (which
    // ts.getJSDocCommentsAndTags relies on). createSourceFile with
    // setParentNodes=true gives us both JSDoc attachment and `.parent` chains.
    const sourceFileByRel = new Map();
    for (const rel of relFiles) {
        const abs = join(root, rel);
        const text = readFileSync(abs, 'utf8');
        const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, /* setParentNodes */ true);
        if (!sf.isDeclarationFile) sourceFileByRel.set(rel, sf);
    }

    const files = [];
    for (const rel of relFiles) {
        const sf = sourceFileByRel.get(rel);
        if (!sf) continue;
        const { imports, reExports } = extractImportsAndReExports(sf);
        const symbols = extractFileSymbols(sf, config.maxSignatureLength);
        files.push({ path: rel, imports, reExports, symbols });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));

    const publicApi = resolvePublicApi(config.entrypoints, root, sourceFileByRel, config.maxSignatureLength);
    publicApi.sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file));

    const data = {
        schema: SCHEMA_VERSION,
        repo: { name: pkg.name, version: pkg.version },
        sourceHash,
        entrypoints: [...config.entrypoints],
        publicApi,
        files,
    };

    return { markdown: renderMarkdown(data), sourceHash, data };
}

function renderMarkdown(data) {
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

function unifiedDiffPreview(expected, actual, maxLines) {
    const e = expected.split('\n');
    const a = actual.split('\n');
    const out = [];
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

export function runCli({ rootDir, check, stdout = process.stdout, stderr = process.stderr }) {
    const { markdown } = buildCodemap({ rootDir });
    const outPath = join(resolve(rootDir), 'CODEMAP.md');

    if (check) {
        if (!existsSync(outPath)) {
            stderr.write('✗ CODEMAP.md is missing. Run `npm run codemap` and commit the result.\n');
            return 1;
        }
        const onDisk = readFileSync(outPath, 'utf8');
        if (onDisk === markdown) {
            stdout.write('✓ CODEMAP.md is up to date\n');
            return 0;
        }
        stderr.write('✗ CODEMAP.md is stale. Run `npm run codemap` and commit the result.\n\n');
        stderr.write(unifiedDiffPreview(onDisk, markdown, DIFF_PREVIEW_LINES) + '\n');
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
