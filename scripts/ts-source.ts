/**
 * TypeScript 7 parsing adapter for the repo code generators.
 *
 * This is the ONLY module that may import `typescript/unstable/*`. Under
 * TypeScript 7 `import ts from 'typescript'` yields only a version string; the
 * compiler API is a native server that is driven over a synchronous RPC channel.
 *
 * Contract:
 * - `ts` is the AST namespace (`typescript/unstable/ast`): node guards
 *   (`ts.isIdentifier`), `ts.SyntaxKind`, `ts.NodeFlags`, `ts.createScanner`,
 *   `ts.getJSDocTags`, and the node types (`ts.Node`, `ts.SourceFile`, ...).
 * - `parseSource(filePath, text)` replaces `ts.createSourceFile(...)`.
 *
 * Semantics that differ from TypeScript 6 (all verified empirically):
 * - `ts.createSourceFile`, `ts.forEachChild`, `ts.getModifiers`,
 *   `ts.canHaveModifiers` and `ts.getJSDocCommentsAndTags` no longer exist. Use
 *   `parseSource`, `node.forEachChild(cb)`, `getModifiers` and `getJSDoc`.
 * - `ts.SyntaxKind.EndOfFileToken` is now `ts.SyntaxKind.EndOfFile`. Reading the
 *   old name yields `undefined` at runtime, so a scanner loop never terminates.
 * - `ts.createScanner(skipTrivia, languageVariant, text)`: the leading
 *   `ScriptTarget` argument is gone.
 * - Identifiers expose `.text` only. `.escapedText` is `undefined`.
 * - `ts.SyntaxKind[kind]` maps range markers back to the wrong name
 *   (`SyntaxKind[NumericLiteral]` is `'FirstLiteralToken'`). Print kinds with
 *   `ts.formatSyntaxKind(kind)`.
 * - `JSDoc.comment` and `tag.comment` are always a `NodeArray` (never a string);
 *   `tag.comment` is `undefined` for a tag without text. A `{@link X}` inside
 *   backticks is plain text in TypeScript 7 (it was parsed as a link, and so
 *   dropped from the text, in TypeScript 6).
 * - Offsets (`pos`, `end`, `getStart()`, `getText()`, `getLineAndCharacterOfPosition`)
 *   are UTF-16 code-unit offsets into `sourceFile.text`, as in TypeScript 6.
 * - `sourceFile.fileName` is a virtual path. `filePath` only selects the script
 *   kind (`.ts`, `.mts`, `.cts`, `.tsx`, `.d.ts`; anything else parses as `.ts`).
 * - A leading U+FEFF is stripped before parsing. The server drops it from
 *   `sourceFile.text` but keeps it in node offsets, which shifts every slice by
 *   one, so the adapter removes it first and offsets stay consistent.
 * - Text with a lone surrogate is rejected. The server panics on it and the
 *   channel dies, so the adapter throws before the text leaves the process.
 *
 * Lifecycle: one native server is created lazily and reused by every call. The
 * channel's child process is unref'd and killed on process exit by the package
 * itself, so it never keeps Node (or a vitest fork) alive. `disposeTsSource()`
 * closes it early; parsed `SourceFile`s stay readable afterwards. If the server
 * dies mid-call, the session is dropped and the next call starts a fresh one.
 */
import * as ts from 'typescript/unstable/ast';
import { createVirtualFileSystem, type FileSystem } from 'typescript/unstable/fs';
import { API } from 'typescript/unstable/sync';

export { ts };

const VIRTUAL_ROOT = '/virtual';
const DEFAULT_EXTENSION = '.ts';
const SOURCE_EXTENSION = /(?:\.d)?\.[cm]?tsx?$/;
const BYTE_ORDER_MARK = '\uFEFF';
/** In `u` mode a well-formed pair is one code point, so only a lone surrogate matches. */
const LONE_SURROGATE = /\p{Surrogate}/u;
/** Parse only: no lib files, no import resolution, no @types lookups. */
const PROJECT_OPTIONS = { noLib: true, noResolve: true, types: [], skipLibCheck: true };

interface Session {
    readonly api: API;
    readonly fs: Required<FileSystem>;
}
interface Project {
    readonly config: string;
    readonly file: string;
}

let session: Session | undefined;
let sequence = 0;
let previousProject: Project | undefined;

function getSession(): Session {
    if (session === undefined) {
        // The virtual FS implementation provides every callback, including writeFile/removeFile.
        const fs = createVirtualFileSystem({}) as Required<FileSystem>;
        session = { api: new API({ cwd: VIRTUAL_ROOT, fs }), fs };
    }
    return session;
}

/** Close the shared native server. Safe to call repeatedly; the next parse starts a new one. */
export function disposeTsSource(): void {
    const current = session;
    session = undefined;
    previousProject = undefined;
    current?.api.close();
}

/**
 * Parse `text` as the TypeScript file `filePath` (only its extension is used)
 * and return the root node. Synchronous; reuses one native server.
 */
export function parseSource(filePath: string, text: string): ts.SourceFile {
    const label = filePath || '<source>';
    if (LONE_SURROGATE.test(text)) {
        throw new Error(`parseSource: ${label} contains a lone UTF-16 surrogate and cannot be parsed`);
    }
    const { api, fs } = getSession();
    const dir = `${VIRTUAL_ROOT}/p${sequence++}`;
    const project: Project = {
        config: `${dir}/tsconfig.json`,
        file: `${dir}/source${SOURCE_EXTENSION.exec(filePath)?.[0] ?? DEFAULT_EXTENSION}`,
    };
    const previous = previousProject;
    try {
        fs.writeFile(project.file, text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);
        fs.writeFile(project.config, JSON.stringify({ compilerOptions: PROJECT_OPTIONS, files: [project.file] }));
        const snapshot = api.updateSnapshot({
            openProject: project.config,
            ...(previous !== undefined ? { closeProjects: [previous.config] } : {}),
        });
        try {
            const sourceFile = snapshot.getProject(project.config)?.program.getSourceFile(project.file);
            if (sourceFile === undefined) {
                throw new Error(`parseSource: the TypeScript server returned no source file for ${label}`);
            }
            if (previous !== undefined) {
                fs.removeFile(previous.file);
                fs.removeFile(previous.config);
            }
            previousProject = project;
            return sourceFile;
        } finally {
            snapshot.dispose();
            // The client keeps every parsed file of every closed project for the whole
            // session (the server never reports a project as removed), which slows each
            // later parse down. Files already returned stay readable after this call.
            api.clearSourceFileCache();
        }
    } catch (error) {
        disposeTsSource();
        throw error;
    }
}

/**
 * The JSDoc block attached to `node` (the last one when several precede it), or
 * `undefined`. Replaces `ts.getJSDocCommentsAndTags(node).find(isJSDoc)` for
 * statement and member nodes. A `VariableDeclaration` carries no `jsDoc`; pass
 * its `VariableStatement`.
 */
export function getJSDoc(node: ts.Node): ts.JSDoc | undefined {
    return node.jsDoc?.filter(ts.isJSDoc).at(-1);
}

/** Modifier keywords of `node` (`export`, `default`, ...), excluding decorators. Replaces `ts.getModifiers`. */
export function getModifiers(node: ts.Node): readonly ts.Modifier[] | undefined {
    return (node as Partial<ts.ModifiersBase>).modifiers?.filter(ts.isModifier);
}
