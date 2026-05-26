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
            // Per-metric floor: 99% on lines/statements/functions, 98% on
            // branches. Branches is intentionally one point lower because
            // 27 branches are genuinely unreachable defensive code (type-
            // guaranteed Zod.parse/JSON.parse arms, runtime-guaranteed Node
            // invariants like process.on/O_NOFOLLOW, dead-by-construction
            // checks where the map is built from its own consumer's keys,
            // and TOCTOU races that can't be reliably engineered). See PR
            // #156 for the full catalog. Do NOT lower below these floors
            // without similar documented justification.
            thresholds: {
                lines: 99,
                statements: 99,
                functions: 99,
                branches: 98,
            },
        },
    },
});
