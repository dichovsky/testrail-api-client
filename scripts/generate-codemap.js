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
        const m = line.match(/^\s+async\s+(\w+)\s*\(/);
        return m ? [{ name: m[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, line}] for exported class / function declarations. */
function extractExports(lines) {
    return lines.flatMap((line, i) => {
        const m = line.match(/^export\s+(?:class|function|const|abstract class)\s+(\w+)/);
        return m ? [{ name: m[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, line}] for exported interface / type alias declarations. */
function extractTypes(lines) {
    return lines.flatMap((line, i) => {
        const m = line.match(/^export\s+(?:interface|type)\s+(\w+)/);
        return m ? [{ name: m[1], line: i + 1 }] : [];
    });
}

/** Returns [{name, value, line}] for exported const declarations. */
function extractConstants(lines) {
    return lines.flatMap((line, i) => {
        const m = line.match(/^export\s+const\s+(\w+)\s*=\s*(.+?);/);
        return m ? [{ name: m[1], value: m[2].trim(), line: i + 1 }] : [];
    });
}

// ── Read source files ─────────────────────────────────────────────────────────
const clientLines = readSrc('client.ts');
const coreLines = readSrc('client-core.ts');
const errorsLines = readSrc('errors.ts');
const constantsLines = readSrc('constants.ts');
const typesLines = readSrc('types.ts');

// ── API endpoint methods ───────────────────────────────────────────────────────
const endpointMethods = extractAsyncMethods(clientLines);

// Infer HTTP verb and endpoint template from method body
function inferEndpoint(methodName, lines) {
    // Find the method, then scan its body for this.request(...)
    const startIdx = lines.findIndex((l) => l.includes(`async ${methodName}(`));
    if (startIdx === -1) return { verb: '?', endpoint: '?' };
    for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
        const m = lines[i].match(/this\.request<[^>]+>\('(GET|POST)',\s*`([^`]+)`/);
        if (m) return { verb: m[1], endpoint: m[2] };
        const m2 = lines[i].match(/this\.request<[^>]+>\('(GET|POST)',\s*'([^']+)'/);
        if (m2) return { verb: m2[1], endpoint: m2[2] };
        // endpoint built via buildEndpoint — extract base from that line (backtick or single-quote)
        const m3 = lines[i].match(/buildEndpoint\([`']([^`']+)[`']/);
        if (m3) return { verb: 'GET', endpoint: `${m3[1]}&...` };
    }
    return { verb: '?', endpoint: '?' };
}

// ── Infrastructure methods (core) ─────────────────────────────────────────────
const coreMethods = ['constructor', 'validateId', 'buildEndpoint', 'clearCache', 'destroy', 'request'].map((name) => {
    const idx = coreLines.findIndex((l) => {
        if (name === 'constructor') return /^\s+constructor\s*\(/.test(l);
        if (name === 'request') return /^\s+protected\s+async\s+request/.test(l);
        return new RegExp(`\\s*(?:public|protected|private)\\s+${name}\\s*[<(]`).test(l);
    });
    return { name, line: idx + 1 };
});

// ── Constants ─────────────────────────────────────────────────────────────────
const constants = extractConstants(constantsLines);

// ── Error classes ─────────────────────────────────────────────────────────────
const errorClasses = extractExports(errorsLines);

// ── Types (from types.ts) ─────────────────────────────────────────────────────
const types = extractTypes(typesLines);

// ── Build Markdown ─────────────────────────────────────────────────────────────
const lines = [];

lines.push('# CODEMAP');
lines.push('');
lines.push('Auto-generated symbol index. Run `npm run codemap` to regenerate.');
lines.push('');

// API Methods
lines.push('## API Endpoint Methods (`src/client.ts`)');
lines.push('');
lines.push('| Method | HTTP | Endpoint | Line |');
lines.push('|--------|------|----------|------|');
for (const m of endpointMethods) {
    const { verb, endpoint } = inferEndpoint(m.name, clientLines);
    lines.push(`| \`${m.name}\` | ${verb} | \`${endpoint}\` | [${m.line}](src/client.ts#L${m.line}) |`);
}
lines.push('');

// Core methods
lines.push('## Core Infrastructure (`src/client-core.ts`)');
lines.push('');
lines.push('| Symbol | Line |');
lines.push('|--------|------|');
for (const m of coreMethods) {
    if (m.line > 0) {
        lines.push(`| \`${m.name}\` | [${m.line}](src/client-core.ts#L${m.line}) |`);
    }
}
lines.push('');

// Errors
lines.push('## Error Classes (`src/errors.ts`)');
lines.push('');
lines.push('| Class | Line |');
lines.push('|-------|------|');
for (const e of errorClasses) {
    lines.push(`| \`${e.name}\` | [${e.line}](src/errors.ts#L${e.line}) |`);
}
lines.push('');

// Constants
lines.push('## Constants (`src/constants.ts`)');
lines.push('');
lines.push('| Constant | Value | Line |');
lines.push('|----------|-------|------|');
for (const c of constants) {
    lines.push(`| \`${c.name}\` | \`${c.value}\` | [${c.line}](src/constants.ts#L${c.line}) |`);
}
lines.push('');

// Types
lines.push('## Types (`src/types.ts`)');
lines.push('');
lines.push('| Type | Line |');
lines.push('|------|------|');
for (const t of types) {
    lines.push(`| \`${t.name}\` | [${t.line}](src/types.ts#L${t.line}) |`);
}
lines.push('');

const output = lines.join('\n');
writeFileSync(path.join(root, 'CODEMAP.md'), output);
console.log(`CODEMAP.md generated (${lines.length} lines).`);
