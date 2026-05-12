#!/usr/bin/env node
/**
 * Generates CODEMAP.md — a machine-readable symbol index for coding agents.
 * Run: node scripts/generate-codemap.js  (or: npm run codemap)
 *
 * Reads src/ files and outputs a Markdown table of every public API method,
 * infrastructure method, exported type, and constant with exact file:line refs.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readSrc(filename) {
    return readFileSync(path.join(root, 'src', filename), 'utf8').split('\n');
}

/** Returns [{name, line}] for all async method declarations. */
function extractAsyncMethods(lines) {
    return lines.flatMap((line, i) => {
        const match = line.match(/^\s+async\s+(\w+)\s*\(/);
        return match ? [{ name: match[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, line}] for exported class / function declarations. */
function extractExports(lines) {
    return lines.flatMap((line, i) => {
        const match = line.match(/^export\s+(?:class|function|const|abstract class)\s+(\w+)/);
        return match ? [{ name: match[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, line}] for exported interface / type alias declarations. */
function extractTypes(lines) {
    return lines.flatMap((line, i) => {
        const match = line.match(/^export\s+(?:interface|type)\s+(\w+)/);
        return match ? [{ name: match[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, value, line}] for exported const declarations. */
function extractConstants(lines) {
    return lines.flatMap((line, i) => {
        const match = line.match(/^export\s+const\s+(\w+)\s*=\s*(.+?);/);
        return match ? [{ name: match[1], value: match[2].trim(), line: i + 1 }] : [];
    });
}

function findAsyncMethod(lines, methodName) {
    const startIdx = lines.findIndex((line) => new RegExp(`^\\s+async\\s+${methodName}\\s*\\(`).test(line));
    if (startIdx === -1) {
        return null;
    }

    let endIdx = startIdx + 1;
    while (endIdx < lines.length && !/^\s+async\s+\w+\s*\(/.test(lines[endIdx])) {
        endIdx += 1;
    }

    return {
        line: startIdx + 1,
        body: lines.slice(startIdx, endIdx).join('\n'),
    };
}

function extractFirstArg(callSource, callee) {
    const matcher = new RegExp(`${callee}(?:<[^>]+>)?\\(`);
    const match = matcher.exec(callSource);
    if (!match) {
        return null;
    }

    let cursor = match.index + match[0].length;
    let depth = 0;
    let arg = '';
    let quote = null;

    while (cursor < callSource.length) {
        const char = callSource[cursor++];

        if (quote) {
            arg += char;
            if (char === quote && callSource[cursor - 2] !== '\\') {
                quote = null;
            }
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            arg += char;
            continue;
        }

        if (char === '(' || char === '{' || char === '[') {
            depth += 1;
        } else if (char === ')' || char === '}' || char === ']') {
            depth -= 1;
        }

        if (char === ',' && depth === 0) {
            break;
        }

        arg += char;
    }

    return arg.trim();
}

function summarizeEndpointExpression(expression, suffix = '') {
    if (!expression) {
        return '?';
    }

    const literals = [...expression.matchAll(/`([^`]+)`|'([^']+)'|"([^"]+)"/g)].map(
        (match) => match[1] ?? match[2] ?? match[3],
    );

    return literals.length > 0 ? literals.map((literal) => `${literal}${suffix}`).join(' or ') : '?';
}

function inferEndpointFromBody(methodBody) {
    const requestMatch = methodBody.match(
        /\.(?:client\.)?request(?:<[\s\S]*?>)?\(\s*'(GET|POST)'\s*,\s*(?:`([^`]+)`|'([^']+)')/s,
    );
    if (requestMatch) {
        return { verb: requestMatch[1], endpoint: requestMatch[2] ?? requestMatch[3] };
    }

    const binaryArg = extractFirstArg(methodBody, 'requestBinary');
    if (binaryArg) {
        return { verb: 'GET', endpoint: summarizeEndpointExpression(binaryArg) };
    }

    const multipartArg = extractFirstArg(methodBody, 'requestMultipart');
    if (multipartArg) {
        return { verb: 'POST', endpoint: summarizeEndpointExpression(multipartArg) };
    }

    const buildEndpointArg = extractFirstArg(methodBody, 'buildEndpoint');
    if (buildEndpointArg) {
        return { verb: 'GET', endpoint: summarizeEndpointExpression(buildEndpointArg, '&...') };
    }

    return { verb: '?', endpoint: '?' };
}

function extractModuleImportMap(lines) {
    return new Map(
        lines.flatMap((line) => {
            const match = line.match(/^import \{ (\w+) \} from '\.\/modules\/(.+?)\.js';$/);
            return match ? [[match[1], match[2]]] : [];
        }),
    );
}

function extractModuleInstanceMap(lines, moduleImportMap) {
    return new Map(
        lines.flatMap((line) => {
            const match = line.match(/^\s*this\.(\w+) = new (\w+)\(this\);$/);
            return match ? [[match[1], moduleImportMap.get(match[2])]] : [];
        }),
    );
}

const clientLines = readSrc('client.ts');
const coreLines = readSrc('client-core.ts');
const errorsLines = readSrc('errors.ts');
const constantsLines = readSrc('constants.ts');
const typesLines = readSrc('types.ts');

const moduleImportMap = extractModuleImportMap(clientLines);
const moduleInstanceMap = extractModuleInstanceMap(clientLines, moduleImportMap);
const moduleLinesCache = new Map();

function getModuleLines(moduleName) {
    if (!moduleLinesCache.has(moduleName)) {
        moduleLinesCache.set(moduleName, readSrc(`modules/${moduleName}.ts`));
    }
    return moduleLinesCache.get(moduleName);
}

function inferEndpoint(methodName) {
    const facadeMethod = findAsyncMethod(clientLines, methodName);
    if (!facadeMethod) {
        return { verb: '?', endpoint: '?' };
    }

    const delegateMatch = facadeMethod.body.match(/return this\.(\w+)\.(\w+)\(/);
    if (!delegateMatch) {
        return inferEndpointFromBody(facadeMethod.body);
    }

    const [, moduleProperty, delegatedMethodName] = delegateMatch;
    const moduleName = moduleInstanceMap.get(moduleProperty);
    if (!moduleName) {
        return { verb: '?', endpoint: '?' };
    }

    const moduleMethod = findAsyncMethod(getModuleLines(moduleName), delegatedMethodName);
    if (!moduleMethod) {
        return { verb: '?', endpoint: '?' };
    }

    return inferEndpointFromBody(moduleMethod.body);
}

const endpointMethods = extractAsyncMethods(clientLines);

const coreMethods = ['constructor', 'validateId', 'buildEndpoint', 'clearCache', 'destroy', 'request'].map((name) => {
    const index = coreLines.findIndex((line) => {
        if (name === 'constructor') return /^\s+constructor\s*\(/.test(line);
        if (name === 'request') return /^\s+(?:public|protected)\s+async\s+request/.test(line);
        return new RegExp(`\\s*(?:public|protected|private)\\s+${name}\\s*[<(]`).test(line);
    });
    return { name, line: index + 1 };
});

const constants = extractConstants(constantsLines);
const errorClasses = extractExports(errorsLines);
const types = extractTypes(typesLines);

const lines = [];

lines.push('# CODEMAP');
lines.push('');
lines.push('Auto-generated symbol index. Run `npm run codemap` to regenerate.');
lines.push('');
lines.push(
    'HTTP and endpoint metadata for facade methods are inferred from delegated module implementations in `src/modules/*`.',
);
lines.push('');

lines.push('## API Endpoint Methods (`src/client.ts`)');
lines.push('');
lines.push('| Method | HTTP | Endpoint | Line |');
lines.push('|--------|------|----------|------|');
for (const method of endpointMethods) {
    const { verb, endpoint } = inferEndpoint(method.name);
    lines.push(`| \`${method.name}\` | ${verb} | \`${endpoint}\` | [${method.line}](src/client.ts#L${method.line}) |`);
}
lines.push('');

lines.push('## Core Infrastructure (`src/client-core.ts`)');
lines.push('');
lines.push('| Symbol | Line |');
lines.push('|--------|------|');
for (const method of coreMethods) {
    if (method.line > 0) {
        lines.push(`| \`${method.name}\` | [${method.line}](src/client-core.ts#L${method.line}) |`);
    }
}
lines.push('');

lines.push('## Error Classes (`src/errors.ts`)');
lines.push('');
lines.push('| Class | Line |');
lines.push('|-------|------|');
for (const errorClass of errorClasses) {
    lines.push(`| \`${errorClass.name}\` | [${errorClass.line}](src/errors.ts#L${errorClass.line}) |`);
}
lines.push('');

lines.push('## Constants (`src/constants.ts`)');
lines.push('');
lines.push('| Constant | Value | Line |');
lines.push('|----------|-------|------|');
for (const constant of constants) {
    lines.push(
        `| \`${constant.name}\` | \`${constant.value}\` | [${constant.line}](src/constants.ts#L${constant.line}) |`,
    );
}
lines.push('');

lines.push('## Types (`src/types.ts`)');
lines.push('');
lines.push('| Type | Line |');
lines.push('|------|------|');
for (const type of types) {
    lines.push(`| \`${type.name}\` | [${type.line}](src/types.ts#L${type.line}) |`);
}
lines.push('');

writeFileSync(path.join(root, 'CODEMAP.md'), lines.join('\n'));
console.log(`CODEMAP.md generated (${lines.length} lines).`);
