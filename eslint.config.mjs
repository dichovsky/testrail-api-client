import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    {
        ignores: ['**/*.js', '**/*.d.ts', 'dist/**/*', 'coverage/**/*'],
    },
    js.configs.recommended,
    // TypeScript support
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                fetch: 'readonly',
                Response: 'readonly',
                RequestInit: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
                URL: 'readonly',
                Buffer: 'readonly',
                btoa: 'readonly',
            },
        },

        rules: {
            // TypeScript ESLint recommended rules
            ...typescriptEslint.configs.recommended.rules,
            ...typescriptEslint.configs['recommended-type-checked']?.rules,

            // TypeScript specific rules
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/prefer-as-const': 'error',
            '@typescript-eslint/prefer-readonly': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/restrict-template-expressions': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',

            // Code quality rules
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: 'error',
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            'no-proto': 'error',
            'no-iterator': 'error',
            'no-caller': 'error',
            'no-extend-native': 'error',

            // Security rules
            'no-new-wrappers': 'error',
            'no-constructor-return': 'error',

            // Performance rules
            'no-await-in-loop': 'warn',

            // Style rules
            'prefer-template': 'error',
            'object-shorthand': 'error',
            'prefer-arrow-callback': 'error',

            // Legacy overrides (removed)
            '@typescript-eslint/no-var-requires': 'off', // Not applicable for ES modules
        },
    },
    {
        // Configuration for files not in TypeScript project
        files: ['example.ts', 'vitest.config.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                process: 'readonly',
                console: 'readonly',
            },
        },
    },
    {
        // Configuration for example files
        files: ['example.ts'],
        rules: {
            'no-console': 'off', // Allow console in examples
            '@typescript-eslint/no-floating-promises': 'off', // Allow floating promises in examples for simplicity
        },
    },
    {
        // ARCH #13 — output ownership. `src/cli/output.ts` owns every byte the
        // CLI emits, and `src/cli.ts` is the single place the real process
        // streams are named. Everything in between takes a writer from
        // `CliRuntime` / `HandlerContext`.
        //
        // Without this, a handler with no writer to hand reaches for
        // `process.stderr` and quietly leaves the runtime: that is how `run
        // watch` came to read `--quiet` out of `process.argv`, and how the
        // `--out -` download ack bypassed the writers a caller supplied.
        //
        // A tripwire against accidental reintroduction, not a guarantee. It
        // catches the direct form, the bracketed `process['stdout']`, and
        // destructuring; it does NOT catch aliasing (`const p = process`) or
        // `globalThis.process`. `tests/cli-output-ownership.test.ts` is the
        // behavioural backstop that would still fail.
        files: ['src/**/*.ts'],
        ignores: ['src/cli.ts'],
        rules: {
            'no-restricted-properties': [
                'error',
                {
                    object: 'process',
                    property: 'stdout',
                    message:
                        'Write through the output module instead (ctx.out / ctx.err / ctx.outPayload, or CliRuntime.stdout). Only src/cli.ts may name the process streams — see ARCH #13.',
                },
                {
                    object: 'process',
                    property: 'stderr',
                    message:
                        'Write through the output module instead (ctx.err / ctx.errRaw, or CliRuntime.stderr). Only src/cli.ts may name the process streams — see ARCH #13.',
                },
                {
                    object: 'process',
                    property: 'argv',
                    message:
                        'Take argv from CliRuntime.argv. Reading process.argv inside a handler ignores the argv runCli was actually handed — see ARCH #13.',
                },
            ],
        },
    },
    {
        // Less strict rules for test files
        files: ['tests/**/*'],
        languageOptions: {
            globals: {
                global: 'writable',
            },
        },
        rules: {
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
        },
    },
];
