#!/usr/bin/env tsx
/**
 * Verifies the package exactly as an npm consumer receives it.
 *
 * By default this script builds `dist/` and removes source maps before packing.
 * Pass `--prepared` when a release job has already performed those steps. The
 * packed tarball is installed into a private temporary consumer with a local
 * Zod copy, then its declarations are compiled by both TypeScript 7 and 6, so
 * the smoke test does not depend on registry or TestRail access.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');
const PACKAGE_NAME = '@dichovsky/testrail-api-client';
const TEMP_DIRECTORY_PREFIX = 'testrail-package-smoke-';
const MAX_PACKED_FILE_COUNT = 1_000;
const MAX_PACKED_UNCOMPRESSED_BYTES = 5 * 1024 * 1024;
const REMOVE_MAX_RETRIES = 3;
const REMOVE_RETRY_DELAY_MS = 100;
const EXPECTED_PRE_AUTH_ERROR = "TESTRAIL_STRICT_RESPONSES must be exactly '1', '0', or empty/unset.";
const EXPECTED_FLAG_ERROR = '--strict-responses does not take a value; pass the flag without `=`.';
const SAFE_ENVIRONMENT_NAMES = ['PATH', 'PATHEXT', 'COMSPEC', 'SYSTEMROOT', 'WINDIR', 'TMPDIR', 'TMP', 'TEMP'] as const;

interface CommandResult {
    readonly status: number;
    readonly stdout: string;
    readonly stderr: string;
}

interface PackedFile {
    readonly path: string;
    readonly size: number;
}

interface PackResult {
    readonly name: string;
    readonly version: string;
    readonly filename: string;
    readonly files: readonly PackedFile[];
}

interface PackageIdentity {
    readonly name: string;
    readonly version: string;
    readonly zodRange: string;
}

interface CompilerSpec {
    readonly displayName: string;
    readonly packagePath: readonly string[];
    readonly binaryName: string;
    readonly expectedMajor: number;
}

interface CompilerLauncher {
    readonly displayName: string;
    readonly executablePath: string;
}

interface CompilerLaunchers {
    readonly typeScript7: CompilerLauncher;
    readonly typeScript6: CompilerLauncher;
}

const TYPESCRIPT_7_COMPILER: CompilerSpec = {
    displayName: 'TypeScript 7',
    packagePath: ['node_modules', '@typescript', 'native'],
    binaryName: 'tsc',
    expectedMajor: 7,
};

const TYPESCRIPT_6_COMPILER: CompilerSpec = {
    displayName: 'TypeScript 6',
    packagePath: ['node_modules', 'typescript'],
    binaryName: 'tsc6',
    expectedMajor: 6,
};

function fail(message: string): never {
    throw new Error(`Package smoke failed: ${message}`);
}

function run(
    command: string,
    args: readonly string[],
    cwd: string,
    env: typeof process.env = process.env,
): CommandResult {
    const result = spawnSync(command, args, {
        cwd,
        env,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
    });
    if (result.error !== undefined) {
        throw result.error;
    }
    return {
        status: result.status ?? 1,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function runWindowsCommandShim(
    shimPath: string,
    args: readonly string[],
    cwd: string,
    env: typeof process.env,
): CommandResult {
    const commandProcessor = env['COMSPEC'];
    if (
        commandProcessor === undefined ||
        !path.isAbsolute(commandProcessor) ||
        path.basename(commandProcessor).toLowerCase() !== 'cmd.exe' ||
        !existsSync(commandProcessor)
    ) {
        return fail('ComSpec must identify an absolute, existing cmd.exe to run the Windows npm shim.');
    }

    // npm's .cmd wrapper performs a second cmd.exe parse, so escape command
    // arguments twice. This mirrors the established cmd-shim algorithm without
    // shell=true or interpolating unescaped input into a command string.
    const metaCharacters = /([()\][%!^"`<>&|;, *?])/gu;
    const escapeMetaCharacters = (value: string): string => value.replace(metaCharacters, '^$1');
    const escapeArgument = (value: string): string => {
        const escapedQuotes = value.replace(/(?=(\\+?)?)\1"/gu, '$1$1\\"');
        const escapedTrailingSlashes = escapedQuotes.replace(/(?=(\\+?)?)\1$/u, '$1$1');
        const quoted = `"${escapedTrailingSlashes}"`;
        return escapeMetaCharacters(escapeMetaCharacters(quoted));
    };
    const escapedCommand = escapeMetaCharacters(path.normalize(shimPath));
    const shellCommand = [escapedCommand, ...args.map(escapeArgument)].join(' ');
    const result = spawnSync(commandProcessor, ['/d', '/s', '/v:off', '/c', `"${shellCommand}"`], {
        cwd,
        env,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
        windowsVerbatimArguments: true,
    });
    if (result.error !== undefined) {
        throw result.error;
    }
    return {
        status: result.status ?? 1,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function requireSuccess(label: string, result: CommandResult): string {
    if (result.status !== 0) {
        fail(
            `${label} exited ${result.status}.\n` +
                `stdout:\n${result.stdout.length === 0 ? '(empty)' : result.stdout}\n` +
                `stderr:\n${result.stderr.length === 0 ? '(empty)' : result.stderr}`,
        );
    }
    return result.stdout;
}

function npmCommand(): string {
    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function safeChildEnvironment(): typeof process.env {
    return Object.fromEntries(
        SAFE_ENVIRONMENT_NAMES.flatMap((name) => {
            const value = process.env[name];
            return value === undefined ? [] : [[name, value]];
        }),
    );
}

function runNpm(args: readonly string[], cwd: string, env: typeof process.env = process.env): CommandResult {
    const npmExecPath = process.env['npm_execpath'];
    if (npmExecPath !== undefined && existsSync(npmExecPath)) {
        return run(process.execPath, [npmExecPath, ...args], cwd, env);
    }
    if (process.platform === 'win32') {
        return fail('npm_execpath is required to run the package smoke on Windows.');
    }
    return run(npmCommand(), args, cwd, env);
}

function listFiles(directory: string): readonly string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = path.join(directory, entry.name);
        return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
    });
}

function requirePreparedDist(): void {
    const distDirectory = path.join(REPOSITORY_ROOT, 'dist');
    const requiredFiles = ['index.js', 'index.d.ts', 'cli.js'];
    for (const requiredFile of requiredFiles) {
        if (!existsSync(path.join(distDirectory, requiredFile))) {
            fail(`dist/${requiredFile} is missing; run npm run build first or omit --prepared.`);
        }
    }
    const sourceMaps = listFiles(distDirectory).filter((file) => file.endsWith('.map'));
    if (sourceMaps.length > 0) {
        fail(`prepared dist/ still contains ${sourceMaps.length} source map(s); run npm run clean:maps first.`);
    }
}

function buildPackage(compiler: CompilerLauncher): void {
    const distDirectory = path.join(REPOSITORY_ROOT, 'dist');

    // Reproduce `npm run build` and `npm run clean:maps` with Node filesystem
    // primitives so this verification script works in stock Windows shells too.
    // The public package scripts remain unchanged for existing consumers.
    rmSync(distDirectory, {
        recursive: true,
        force: true,
        maxRetries: REMOVE_MAX_RETRIES,
        retryDelay: REMOVE_RETRY_DELAY_MS,
    });
    requireSuccess(
        `${compiler.displayName} production build`,
        run(
            process.execPath,
            [compiler.executablePath, '--project', path.join(REPOSITORY_ROOT, 'tsconfig.prod.json')],
            REPOSITORY_ROOT,
            safeChildEnvironment(),
        ),
    );
    for (const sourceMap of listFiles(distDirectory).filter((file) => file.endsWith('.map'))) {
        rmSync(sourceMap, { force: true });
    }
    requirePreparedDist();
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExactStringRecord(value: unknown, expected: Readonly<Record<string, string>>): boolean {
    if (!isRecord(value)) return false;
    const actualKeys = Object.keys(value).sort();
    const expectedKeys = Object.keys(expected).sort();
    return (
        actualKeys.length === expectedKeys.length &&
        actualKeys.every((key, index) => key === expectedKeys[index] && value[key] === expected[key])
    );
}

function readJson(filePath: string, label: string): unknown {
    try {
        return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    } catch {
        return fail(`${label} is not valid JSON.`);
    }
}

function parseMajorVersion(version: string, label: string): number {
    const match = /^(\d+)\./u.exec(version);
    if (match === null) {
        return fail(`${label} does not contain a valid major version.`);
    }
    return Number(match[1]);
}

function resolveCompiler(spec: CompilerSpec): CompilerLauncher {
    const packageDirectory = path.join(REPOSITORY_ROOT, ...spec.packagePath);
    const manifestPath = path.join(packageDirectory, 'package.json');
    if (!existsSync(manifestPath)) {
        return fail(`${spec.displayName} package is missing; run npm ci before the package smoke.`);
    }

    const manifest = readJson(manifestPath, `${spec.displayName} package.json`);
    if (!isRecord(manifest) || typeof manifest['version'] !== 'string' || !isRecord(manifest['bin'])) {
        return fail(`${spec.displayName} package.json does not contain a valid version and bin manifest.`);
    }
    const manifestMajor = parseMajorVersion(manifest['version'], `${spec.displayName} package version`);
    if (manifestMajor !== spec.expectedMajor) {
        return fail(
            `${spec.displayName} package resolved major ${String(manifestMajor)}; expected ${String(spec.expectedMajor)}.`,
        );
    }

    const binaryPath = manifest['bin'][spec.binaryName];
    if (typeof binaryPath !== 'string' || binaryPath.length === 0) {
        return fail(`${spec.displayName} package does not expose the ${spec.binaryName} launcher.`);
    }
    const executablePath = path.resolve(packageDirectory, binaryPath);
    const relativeExecutablePath = path.relative(packageDirectory, executablePath);
    if (
        relativeExecutablePath.length === 0 ||
        relativeExecutablePath === '..' ||
        relativeExecutablePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeExecutablePath)
    ) {
        return fail(`${spec.displayName} package exposes a launcher outside its package directory.`);
    }
    if (!existsSync(executablePath)) {
        return fail(`${spec.displayName} package launcher is missing; run npm ci before the package smoke.`);
    }

    const versionOutput = requireSuccess(
        `${spec.displayName} version check`,
        run(process.execPath, [executablePath, '--version'], REPOSITORY_ROOT, safeChildEnvironment()),
    ).trim();
    const versionMatch = /^Version\s+(\d+)(?:\.|$)/u.exec(versionOutput);
    if (versionMatch === null || Number(versionMatch[1]) !== spec.expectedMajor) {
        return fail(
            `${spec.displayName} launcher reported ${versionOutput.length === 0 ? '(empty)' : versionOutput}; expected major ${String(spec.expectedMajor)}.`,
        );
    }

    return {
        displayName: spec.displayName,
        executablePath,
    };
}

function resolveCompilers(): CompilerLaunchers {
    return {
        typeScript7: resolveCompiler(TYPESCRIPT_7_COMPILER),
        typeScript6: resolveCompiler(TYPESCRIPT_6_COMPILER),
    };
}

function readPackageIdentity(filePath: string, label: string): PackageIdentity {
    const manifest = readJson(filePath, label);
    if (!isRecord(manifest) || !isRecord(manifest['dependencies'])) {
        return fail(`${label} does not contain a dependency manifest.`);
    }
    const name = manifest['name'];
    const version = manifest['version'];
    const dependencyEntries = Object.entries(manifest['dependencies']);
    const zodRange = manifest['dependencies']['zod'];
    if (name !== PACKAGE_NAME || typeof version !== 'string' || version.length === 0) {
        return fail(`${label} has an unexpected package name or version.`);
    }
    const exportsValue = manifest['exports'];
    const expectedFiles = ['dist', 'skill', 'README.md', 'LICENSE'];
    const files = manifest['files'];
    const validFiles =
        Array.isArray(files) &&
        files.length === expectedFiles.length &&
        files.every((entry, index) => entry === expectedFiles[index]);
    const validExports =
        isRecord(exportsValue) &&
        Object.keys(exportsValue).length === 2 &&
        isExactStringRecord(exportsValue['.'], {
            types: './dist/index.d.ts',
            import: './dist/index.js',
            default: './dist/index.js',
        }) &&
        isExactStringRecord(exportsValue['./cli'], {
            import: './dist/cli.js',
            default: './dist/cli.js',
        });
    if (
        manifest['type'] !== 'module' ||
        manifest['main'] !== 'dist/index.js' ||
        manifest['types'] !== 'dist/index.d.ts' ||
        !validExports ||
        !isExactStringRecord(manifest['bin'], { testrail: 'dist/cli.js' }) ||
        !validFiles ||
        !isExactStringRecord(manifest['engines'], { node: '^20.19.0 || ^22.13.0 || >=24' }) ||
        !isExactStringRecord(manifest['publishConfig'], { access: 'public' }) ||
        ['private', 'os', 'cpu', 'libc', 'workspaces'].some((field) => manifest[field] !== undefined)
    ) {
        return fail(`${label} does not match the supported package entrypoint and engine contract.`);
    }
    if (
        dependencyEntries.length !== 1 ||
        dependencyEntries[0]?.[0] !== 'zod' ||
        typeof zodRange !== 'string' ||
        zodRange.length === 0
    ) {
        return fail(`${label} must declare Zod as its only runtime dependency.`);
    }
    for (const dependencyField of [
        'optionalDependencies',
        'peerDependencies',
        'bundleDependencies',
        'bundledDependencies',
    ]) {
        const value = manifest[dependencyField];
        const empty =
            value === undefined ||
            (Array.isArray(value) && value.length === 0) ||
            (isRecord(value) && Object.keys(value).length === 0);
        if (!empty) {
            return fail(`${label} contains unexpected ${dependencyField}.`);
        }
    }
    const scripts = manifest['scripts'];
    if (scripts !== undefined && !isRecord(scripts)) {
        return fail(`${label} contains an invalid scripts manifest.`);
    }
    for (const consumerHook of ['preinstall', 'install', 'postinstall']) {
        if (scripts?.[consumerHook] !== undefined) {
            return fail(`${label} contains forbidden consumer lifecycle hook ${consumerHook}.`);
        }
    }
    return { name, version, zodRange };
}

function parsePackResult(raw: string): PackResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return fail('npm pack did not return valid JSON metadata.');
    }
    let entry: unknown;
    if (Array.isArray(parsed) && parsed.length === 1) {
        entry = (parsed as unknown[])[0];
    } else if (isRecord(parsed) && Object.keys(parsed).length === 1) {
        // npm 12 emits an object keyed by package name, while older supported
        // npm releases emit a one-element array. Accept both documented JSON
        // shapes so the release smoke follows the project's Node engine range.
        entry = Object.values(parsed)[0];
    } else {
        return fail('npm pack returned an unexpected result shape.');
    }
    if (!isRecord(entry)) {
        return fail('npm pack returned an unexpected result entry.');
    }
    const name = entry['name'];
    const version = entry['version'];
    const filename = entry['filename'];
    const files = entry['files'];
    if (
        typeof name !== 'string' ||
        typeof version !== 'string' ||
        typeof filename !== 'string' ||
        !Array.isArray(files)
    ) {
        return fail('npm pack metadata is missing package identity, filename, or files.');
    }
    const packedFiles: PackedFile[] = files.map((file) => {
        if (
            !isRecord(file) ||
            typeof file['path'] !== 'string' ||
            typeof file['size'] !== 'number' ||
            !Number.isSafeInteger(file['size']) ||
            file['size'] < 0
        ) {
            return fail('npm pack metadata contains an invalid file entry.');
        }
        return { path: file['path'], size: file['size'] };
    });
    return { name, version, filename, files: packedFiles };
}

function isAllowedPackedPath(filePath: string): boolean {
    if (filePath === 'package.json' || filePath === 'README.md' || filePath === 'LICENSE') return true;
    if (filePath === 'skill/SKILL.md' || filePath === 'skill/reference/payload-schemas.yaml') return true;
    if (!filePath.startsWith('dist/')) return false;
    const segments = filePath.split('/');
    if (segments.some((segment) => segment.length === 0 || segment.startsWith('.'))) return false;
    return filePath.endsWith('.js') || filePath.endsWith('.d.ts');
}

function isSensitivePackedPath(filePath: string): boolean {
    const normalized = filePath.toLowerCase();
    const segments = normalized.split('/');
    const basename = segments.at(-1) ?? '';
    return (
        segments.some((segment) => segment === '.probe' || segment === '.env' || segment.startsWith('.env.')) ||
        basename === 'id_rsa' ||
        basename === 'id_ed25519' ||
        basename.endsWith('.key') ||
        basename.endsWith('.pem') ||
        basename.endsWith('.p12') ||
        basename.endsWith('.pfx')
    );
}

function packPackage(packDirectory: string, identity: PackageIdentity): string {
    const output = requireSuccess(
        'npm pack',
        runNpm(
            ['pack', '--ignore-scripts', '--json', '--pack-destination', packDirectory],
            REPOSITORY_ROOT,
            safeChildEnvironment(),
        ),
    );
    const packed = parsePackResult(output);
    if (packed.name !== identity.name || packed.version !== identity.version) {
        fail('npm pack metadata does not match the source package identity.');
    }
    const requiredFiles = [
        'package.json',
        'README.md',
        'LICENSE',
        'skill/SKILL.md',
        'dist/index.js',
        'dist/index.d.ts',
        'dist/cli.js',
    ];
    for (const requiredFile of requiredFiles) {
        if (!packed.files.some((file) => file.path === requiredFile)) {
            fail(`packed artifact is missing ${requiredFile}.`);
        }
    }
    const sourceMaps = packed.files.filter((file) => file.path.endsWith('.map'));
    if (sourceMaps.length > 0) {
        fail(`packed artifact contains source map ${sourceMaps[0]?.path ?? '(unknown)'}.`);
    }
    const unexpectedFile = packed.files.find(
        (file) =>
            file.path.includes('..') ||
            file.path.startsWith('/') ||
            !isAllowedPackedPath(file.path) ||
            isSensitivePackedPath(file.path),
    );
    if (unexpectedFile !== undefined) {
        fail(`packed artifact contains unexpected file ${unexpectedFile.path}.`);
    }
    if (packed.files.length > MAX_PACKED_FILE_COUNT) {
        fail(`packed artifact contains more than ${String(MAX_PACKED_FILE_COUNT)} files.`);
    }
    const unpackedBytes = packed.files.reduce((total, file) => total + file.size, 0);
    if (!Number.isSafeInteger(unpackedBytes) || unpackedBytes > MAX_PACKED_UNCOMPRESSED_BYTES) {
        fail(`packed artifact exceeds ${String(MAX_PACKED_UNCOMPRESSED_BYTES)} uncompressed bytes.`);
    }

    const archivePath = path.resolve(packDirectory, packed.filename);
    if (path.dirname(archivePath) !== path.resolve(packDirectory) || !existsSync(archivePath)) {
        fail('npm pack reported an archive outside the private pack directory or did not create it.');
    }
    return archivePath;
}

function verifyInstalledManifest(consumerDirectory: string, identity: PackageIdentity): void {
    const installedManifest = path.join(consumerDirectory, 'node_modules', PACKAGE_NAME, 'package.json');
    const installedIdentity = readPackageIdentity(installedManifest, 'installed package.json');
    if (
        installedIdentity.name !== identity.name ||
        installedIdentity.version !== identity.version ||
        installedIdentity.zodRange !== identity.zodRange
    ) {
        fail('installed package manifest does not match the source package identity.');
    }
}

function packZod(packDirectory: string): string {
    const zodDirectory = path.join(REPOSITORY_ROOT, 'node_modules', 'zod');
    if (!existsSync(path.join(zodDirectory, 'package.json'))) {
        fail('node_modules/zod is missing; run npm ci before the package smoke.');
    }
    const output = requireSuccess(
        'npm pack Zod',
        runNpm(
            ['pack', zodDirectory, '--ignore-scripts', '--json', '--pack-destination', packDirectory],
            REPOSITORY_ROOT,
            safeChildEnvironment(),
        ),
    );
    const packed = parsePackResult(output);
    if (packed.name !== 'zod') fail('packed local runtime dependency is not Zod.');
    const archivePath = path.resolve(packDirectory, packed.filename);
    if (path.dirname(archivePath) !== path.resolve(packDirectory) || !existsSync(archivePath)) {
        fail('npm pack reported an invalid Zod archive path.');
    }
    return archivePath;
}

function localArchiveSpecifier(consumerDirectory: string, archivePath: string): string {
    const normalizedRelativePath = path.relative(consumerDirectory, archivePath).split(path.sep).join('/');
    const expectedRelativePath = `../pack/${path.basename(archivePath)}`;
    if (normalizedRelativePath !== expectedRelativePath) {
        return fail('local package archive is not inside the consumer fixture pack directory.');
    }
    return `file:${normalizedRelativePath}`;
}

function writeConsumerFixture(consumerDirectory: string, archivePath: string, zodArchivePath: string): void {
    writeFileSync(
        path.join(consumerDirectory, 'package.json'),
        `${JSON.stringify(
            {
                private: true,
                type: 'module',
                dependencies: {
                    [PACKAGE_NAME]: localArchiveSpecifier(consumerDirectory, archivePath),
                    zod: localArchiveSpecifier(consumerDirectory, zodArchivePath),
                },
            },
            null,
            4,
        )}\n`,
    );
    writeFileSync(
        path.join(consumerDirectory, 'tsconfig.json'),
        `${JSON.stringify(
            {
                compilerOptions: {
                    target: 'ES2022',
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    strict: true,
                    exactOptionalPropertyTypes: true,
                    noUncheckedIndexedAccess: true,
                    skipLibCheck: false,
                    declaration: true,
                    emitDeclarationOnly: true,
                },
                include: ['./consumer.ts'],
            },
            null,
            4,
        )}\n`,
    );
    writeFileSync(
        path.join(consumerDirectory, 'consumer.ts'),
        `import {
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGES,
    DEFAULT_MAX_PAGINATION_BYTES,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
    TestRailPaginationError,
    type GetAllProjectsOptions,
    type GetProjectsPageOptions,
    type Page,
    type PaginatedRequestOptions,
    type PaginationSafetyOptions,
    type Project,
    type TestRailClient,
} from '${PACKAGE_NAME}';

export const pageOptions: GetProjectsPageOptions = {
    limit: MAX_PAGINATION_LIMIT,
    offset: 0,
};

export const getAllOptions: GetAllProjectsOptions = {
    pageSize: DEFAULT_PAGE_SIZE,
    startOffset: 0,
    maxPages: DEFAULT_MAX_PAGES,
    maxItems: DEFAULT_MAX_ITEMS,
    maxDurationMs: DEFAULT_MAX_PAGINATION_DURATION_MS,
    maxBytes: DEFAULT_MAX_PAGINATION_BYTES,
};

export const paginatedOptions: PaginatedRequestOptions = getAllOptions;
export const safetyOptions: PaginationSafetyOptions = getAllOptions;

export function getOnePage(client: TestRailClient): Promise<Page<Project>> {
    return client.projects.getProjectsPage(pageOptions);
}

export function getEveryProject(client: TestRailClient): Promise<Project[]> {
    return client.projects.getAllProjects(getAllOptions);
}

export const legacyPage: Page<Project> = {
    kind: 'legacy-array',
    items: [],
    size: 0,
};

export const envelopePage: Page<Project> = {
    kind: 'envelope',
    items: [],
    offset: 0,
    limit: DEFAULT_PAGE_SIZE,
    size: 0,
    _links: { next: null, prev: null },
};

export const paginationRuntime = {
    TestRailPaginationError,
    DEFAULT_PAGE_SIZE,
    DEFAULT_MAX_PAGES,
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_MAX_PAGINATION_BYTES,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
};
`,
    );
}

function installConsumer(consumerDirectory: string): void {
    const cacheDirectory = path.join(consumerDirectory, '.npm-cache');
    const userConfigPath = path.join(consumerDirectory, '.npmrc');
    writeFileSync(userConfigPath, 'engine-strict=true\nignore-scripts=true\nregistry=https://registry.npmjs.org/\n');
    requireSuccess(
        'consumer npm install',
        runNpm(
            [
                'install',
                '--offline',
                '--engine-strict',
                '--ignore-scripts',
                '--no-audit',
                '--no-fund',
                '--package-lock=false',
                `--cache=${cacheDirectory}`,
                `--userconfig=${userConfigPath}`,
                '--registry=https://registry.npmjs.org/',
            ],
            consumerDirectory,
            safeChildEnvironment(),
        ),
    );
}

function compileConsumer(consumerDirectory: string, compilers: CompilerLaunchers): void {
    const compile = (compiler: CompilerLauncher, outputDirectoryName: string): void => {
        const outputDirectory = path.join(consumerDirectory, 'types', outputDirectoryName);
        requireSuccess(
            `${compiler.displayName} consumer declaration compile`,
            run(
                process.execPath,
                [compiler.executablePath, '--project', 'tsconfig.json', '--outDir', outputDirectory],
                consumerDirectory,
                safeChildEnvironment(),
            ),
        );
        if (!existsSync(path.join(outputDirectory, 'consumer.d.ts'))) {
            fail(
                `${compiler.displayName} consumer declaration compile did not emit types/${outputDirectoryName}/consumer.d.ts.`,
            );
        }
    };

    compile(compilers.typeScript7, 'typescript-7');
    compile(compilers.typeScript6, 'typescript-6');
}

function runtimeImportSmoke(consumerDirectory: string): void {
    const probe = `
import {
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGES,
    DEFAULT_MAX_PAGINATION_BYTES,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
    TestRailPaginationError,
} from '${PACKAGE_NAME}';

const constants = [
    DEFAULT_MAX_ITEMS,
    DEFAULT_MAX_PAGES,
    DEFAULT_MAX_PAGINATION_BYTES,
    DEFAULT_MAX_PAGINATION_DURATION_MS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGINATION_BYTES,
    MAX_PAGINATION_LIMIT,
];
if (constants.some((value) => !Number.isSafeInteger(value) || value <= 0)) {
    throw new Error('pagination constants are not positive safe integers');
}
const error = new TestRailPaginationError('max_pages', 'consumer smoke', 2, 3);
if (error.name !== 'TestRailPaginationError' || error.reason !== 'max_pages') {
    throw new Error('TestRailPaginationError runtime export is invalid');
}
const cliExportUrl = import.meta.resolve('${PACKAGE_NAME}/cli');
if (!cliExportUrl.startsWith('file:') || !cliExportUrl.endsWith('/dist/cli.js')) {
    throw new Error('CLI package subpath export is invalid');
}
`;
    requireSuccess(
        'consumer runtime import',
        run(process.execPath, ['--input-type=module', '--eval', probe], consumerDirectory, safeChildEnvironment()),
    );
}

function cliSmoke(consumerDirectory: string, identity: PackageIdentity): void {
    const cliPath = path.join(
        consumerDirectory,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'testrail.cmd' : 'testrail',
    );
    if (!existsSync(cliPath)) {
        fail('consumer install did not create the testrail executable.');
    }
    const cliEntryPath = path.join(consumerDirectory, 'node_modules', PACKAGE_NAME, 'dist', 'cli.js');
    if (!existsSync(cliEntryPath)) {
        fail('consumer install did not contain the testrail CLI entrypoint.');
    }
    const cleanEnvironment = safeChildEnvironment();
    const runCli = (args: readonly string[], env: typeof process.env): CommandResult =>
        process.platform === 'win32'
            ? runWindowsCommandShim(cliPath, args, consumerDirectory, env)
            : run(cliPath, args, consumerDirectory, env);
    const help = runCli(['--help'], cleanEnvironment);
    const helpOutput = requireSuccess('packed CLI --help', help);
    if (!helpOutput.includes('--strict-responses')) {
        fail('packed CLI help does not document --strict-responses.');
    }
    if (!helpOutput.includes('TESTRAIL_STRICT_RESPONSES=1|0')) {
        fail('packed CLI help does not document TESTRAIL_STRICT_RESPONSES=1|0.');
    }

    const versionOutput = requireSuccess('packed CLI --version', runCli(['--version'], cleanEnvironment)).trim();
    if (versionOutput !== `testrail-cli v${identity.version}`) {
        fail('packed CLI version does not match package.json.');
    }

    const invalidEnvironment = runCli(['project', 'list'], {
        ...cleanEnvironment,
        TESTRAIL_STRICT_RESPONSES: 'invalid-smoke-token',
    });
    if (invalidEnvironment.status !== 1 || !invalidEnvironment.stderr.includes(EXPECTED_PRE_AUTH_ERROR)) {
        fail('packed CLI did not reject an invalid strict-response environment value.');
    }
    if (invalidEnvironment.stderr.includes('Missing auth') || invalidEnvironment.stdout.length > 0) {
        fail('strict-response environment validation did not run before auth/output.');
    }

    const invalidFlag = runCli(['--strict-responses=true', 'project', 'list'], cleanEnvironment);
    if (invalidFlag.status !== 1 || !invalidFlag.stderr.includes(EXPECTED_FLAG_ERROR)) {
        fail('packed CLI did not reject an assigned --strict-responses value.');
    }
    if (invalidFlag.stderr.includes('Missing auth') || invalidFlag.stdout.length > 0) {
        fail('--strict-responses shape validation did not run before auth/output.');
    }
}

function main(): void {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--prepared')) {
        fail(`unknown argument ${args.find((arg) => arg !== '--prepared') ?? '(unknown)'}; expected only --prepared.`);
    }
    const compilers = resolveCompilers();
    if (args.includes('--prepared')) {
        requirePreparedDist();
    } else {
        buildPackage(compilers.typeScript7);
    }

    const identity = readPackageIdentity(path.join(REPOSITORY_ROOT, 'package.json'), 'source package.json');
    const temporaryRoot = mkdtempSync(path.join(tmpdir(), TEMP_DIRECTORY_PREFIX));
    try {
        const packDirectory = path.join(temporaryRoot, 'pack');
        const consumerDirectory = path.join(temporaryRoot, 'consumer');
        mkdirSync(packDirectory);
        mkdirSync(consumerDirectory);
        const archivePath = packPackage(packDirectory, identity);
        const zodArchivePath = packZod(packDirectory);
        writeConsumerFixture(consumerDirectory, archivePath, zodArchivePath);
        installConsumer(consumerDirectory);
        verifyInstalledManifest(consumerDirectory, identity);
        compileConsumer(consumerDirectory, compilers);
        runtimeImportSmoke(consumerDirectory);
        cliSmoke(consumerDirectory, identity);
    } finally {
        rmSync(temporaryRoot, {
            recursive: true,
            force: true,
            maxRetries: REMOVE_MAX_RETRIES,
            retryDelay: REMOVE_RETRY_DELAY_MS,
        });
    }
    process.stdout.write('Packed package consumer and CLI smoke passed.\n');
}

try {
    main();
} catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
}
