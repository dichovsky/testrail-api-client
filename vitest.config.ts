import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        pool: 'forks',
        isolate: true,
        // `.claude/worktrees/**` excludes stray fixture files from leftover
        // agent worktrees (created by Claude Code's worktree isolation mode).
        // Those directories live outside the canonical source tree and
        // their fixture files should never be executed as tests.
        exclude: ['**/node_modules/**', '**/dist/**', 'tests/fixtures/**', '.claude/worktrees/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/**/types.ts'],
            thresholds: {
                lines: 99,
                statements: 99,
                functions: 99,
                branches: 98,
            },
        },
    },
});
