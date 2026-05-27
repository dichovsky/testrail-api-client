/**
 * Snapshot test for the generated `--help` output (`buildHelpText()` in
 * `src/cli/help.ts`).
 *
 * PR-C moved the HELP block out of `src/cli/index.ts` and into a
 * derivation over `ACTIONS`. The snapshot here catches accidental
 * changes — e.g. a new action quietly missing from a section, an
 * altered indent that shifts a column, or an edit to a static
 * trailing block (auth / options / soft semantics).
 *
 * The snapshot is committed in `__snapshots__/cli-help-generation.test.ts.snap`
 * and updated via `npx vitest run tests/cli-help-generation.test.ts -u`
 * when the change is intentional.
 */
import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../src/cli/metadata.js';
import { buildHelpText } from '../src/cli/help.js';

describe('buildHelpText', () => {
    it('matches the committed snapshot (accidental drift fails the test)', () => {
        expect(buildHelpText()).toMatchSnapshot();
    });

    it('starts with the canonical usage header', () => {
        // Subprocess HELP path in tests/cli.test.ts also asserts on this
        // string; pin it here too so a buildHelpText() refactor that drops
        // the header fails this test alongside the snapshot.
        expect(buildHelpText().startsWith('testrail <resource> <action>')).toBe(true);
    });

    it('mentions every registered ACTIONS entry on its own action line', () => {
        // Every `resource action` pair must appear in the help text. This
        // is the structural inverse of the snapshot: even if the snapshot
        // is updated wholesale, the dynamic iteration must still surface
        // every action so a missing-from-help spec is impossible.
        const help = buildHelpText();
        for (const spec of ACTIONS) {
            const needle = `  ${spec.resource.padEnd(20)}${spec.action}`;
            expect(help.includes(needle), `${spec.resource} ${spec.action} not present on a help action line`).toBe(
                true,
            );
        }
    });

    it('exposes the install-skill / uninstall-skill meta commands in the Meta block', () => {
        const help = buildHelpText();
        expect(help).toContain('install-skill');
        expect(help).toContain('uninstall-skill');
    });

    it('describes the two-gate destructive model (--yes + TESTRAIL_ALLOW_DESTRUCTIVE)', () => {
        // The static trailing blocks document the dual-gate semantics; a
        // refactor that drops either reference would silently weaken the
        // surface area documented to users.
        const help = buildHelpText();
        expect(help).toContain('TESTRAIL_ALLOW_DESTRUCTIVE=1');
        expect(help).toContain('--yes');
        expect(help).toContain('--dry-run');
    });
});
