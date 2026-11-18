/**
 * ARCH #13 tripwire for the lint configuration.
 *
 * `.oxlintrc.json` is what keeps `process.stdout`, `process.stderr`,
 * `process.stdin` and `process.argv` out of `src/` (everything except
 * `src/cli.ts`). Oxlint scopes that rule with path-based overrides, so a
 * mistyped glob or `excludeFiles` would drop the guard without any lint run
 * failing. These tests run the repo's own oxlint with the repo's own config
 * over seeded files in a throwaway directory; nothing is ever written under
 * `src/` or `tests/`.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OXLINT_BIN = join(ROOT, 'node_modules', 'oxlint', 'bin', 'oxlint');
const RESTRICTED_PROPERTIES = 'eslint(no-restricted-properties)';
const LINT_TIMEOUT_MS = 60_000;

/** The direct, bracketed and destructured forms the rule is meant to catch. */
const SEED = [
    "process.stdout.write('out');",
    "process['stderr'].write('err');",
    'const { argv } = process;',
    'process.stdin.resume();',
    'void argv;',
    '',
].join('\n');

const SEEDED_FILES = [
    'src/handlers/seeded.ts',
    'src/cli/seeded.ts',
    'src/cli/handlers/seeded.ts',
    'src/cli.ts',
    'tests/seeded.test.ts',
    'scripts/seeded.ts',
] as const;

/**
 * A floating promise is reported only by type-aware rules. The lint run below
 * passes no `--type-aware` flag, so this canary proves that
 * `options.typeAware` in the config is what switches the typed rules on.
 */
const TYPE_AWARE_CANARY = 'src/type-aware-canary.ts';
const FLOATING_PROMISES = 'typescript(no-floating-promises)';

interface OxlintReport {
    readonly diagnostics: readonly {
        readonly code?: string;
        readonly filename: string;
        readonly labels: readonly { readonly span: { readonly line: number } }[];
    }[];
}

let directory: string;
let report: OxlintReport;

/** Lines in `file` that the process-stream restriction flagged. */
function restrictedLines(file: (typeof SEEDED_FILES)[number]): number[] {
    return report.diagnostics
        .filter((diagnostic) => diagnostic.filename === file && diagnostic.code === RESTRICTED_PROPERTIES)
        .map((diagnostic) => diagnostic.labels[0]?.span.line ?? 0)
        .sort((a, b) => a - b);
}

beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), 'oxlint-config-'));
    copyFileSync(join(ROOT, '.oxlintrc.json'), join(directory, '.oxlintrc.json'));
    writeFileSync(
        join(directory, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: { module: 'NodeNext', strict: true, types: [] },
            include: ['src', 'tests', 'scripts'],
        }),
    );
    // Type-aware linting finds oxlint-tsgolint through the working directory.
    symlinkSync(join(ROOT, 'node_modules'), join(directory, 'node_modules'), 'junction');
    for (const file of SEEDED_FILES) {
        mkdirSync(dirname(join(directory, file)), { recursive: true });
        writeFileSync(join(directory, file), SEED);
    }

    writeFileSync(join(directory, TYPE_AWARE_CANARY), 'Promise.resolve(1);\n');

    // spawnSync blocks the worker, so the hook timeout cannot interrupt it: bound the child itself.
    const run = spawnSync(process.execPath, [OXLINT_BIN, '--format=json', 'src', 'tests', 'scripts'], {
        cwd: directory,
        encoding: 'utf8',
        timeout: LINT_TIMEOUT_MS - 5_000,
        killSignal: 'SIGKILL',
    });
    try {
        report = JSON.parse(run.stdout) as OxlintReport;
    } catch {
        throw new Error(
            `oxlint produced no JSON report (status ${String(run.status)}, error ${String(run.error)}): ${run.stderr}`,
        );
    }
}, LINT_TIMEOUT_MS);

afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
});

describe('ARCH #13 process-stream restriction', () => {
    it('flags every direct, bracketed and destructured use under src/', () => {
        expect(restrictedLines('src/handlers/seeded.ts')).toEqual([1, 2, 3, 4]);
    });

    it('covers the src/cli/ subtree, where the CLI handlers live', () => {
        expect(restrictedLines('src/cli/seeded.ts')).toEqual([1, 2, 3, 4]);
        expect(restrictedLines('src/cli/handlers/seeded.ts')).toEqual([1, 2, 3, 4]);
    });

    it('exempts src/cli.ts, the one file allowed to name the process streams', () => {
        expect(restrictedLines('src/cli.ts')).toEqual([]);
    });

    it('stays scoped to src/', () => {
        expect(restrictedLines('tests/seeded.test.ts')).toEqual([]);
        expect(restrictedLines('scripts/seeded.ts')).toEqual([]);
    });
});

describe('type-aware linting', () => {
    it('is enabled by the configuration itself', () => {
        const codes = report.diagnostics
            .filter((diagnostic) => diagnostic.filename === TYPE_AWARE_CANARY)
            .map((diagnostic) => diagnostic.code);
        expect(codes).toContain(FLOATING_PROMISES);
    });
});
