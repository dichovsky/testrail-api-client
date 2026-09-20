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
import { CLI_OPTION_DOCUMENTATION, CLI_OPTIONS, getCliFlagUsage } from '../src/cli/flags.js';
import { ACTIONS } from '../src/cli/metadata.js';
import {
    actionArgvHint,
    buildHelpText,
    buildResourceHelpText,
    isKnownResource,
    renderOptionsBlock,
    wrapIndented,
} from '../src/cli/help.js';

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
            const needle = `  ${`${spec.resource} `.padEnd(20)}${spec.action}`;
            expect(help.includes(needle), `${spec.resource} ${spec.action} not present on a help action line`).toBe(
                true,
            );
        }
    });

    it('renders every required ActionSpec flag as an argv hint', () => {
        for (const spec of ACTIONS) {
            const hint = actionArgvHint(spec);
            for (const flag of spec.flags ?? []) {
                if (flag.required === true) {
                    expect(hint, `${spec.resource} ${spec.action} missing required ${flag.name} hint`).toContain(
                        getCliFlagUsage(flag.name),
                    );
                }
            }
        }
    });

    it('exposes the install-skill / uninstall-skill meta commands in the Meta block', () => {
        const help = buildHelpText();
        expect(help).toContain('install-skill');
        expect(help).toContain('uninstall-skill');
    });

    it('renders every parser-recognized option from the shared registry', () => {
        const options = renderOptionsBlock();
        expect(Object.keys(CLI_OPTION_DOCUMENTATION)).toEqual(Object.keys(CLI_OPTIONS));
        for (const name of Object.keys(CLI_OPTIONS)) {
            expect(options, `--${name} missing from --help`).toContain(`--${name}`);
        }
        expect(options).toContain('--user-email <email>');
        expect(options).toContain('--is-started <true|false|1|0>');
        expect(options).toContain('--with-data <0|1>');
        expect(options).toContain('--keep-in-cases <true|false|1|0>');
        expect(options).not.toContain('--case-id');
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

    it('indexes every resource so per-resource help is discoverable', () => {
        const help = buildHelpText();
        expect(help).toContain("Resources (run 'testrail <resource> --help'");
        for (const resource of new Set(ACTIONS.map((spec) => spec.resource))) {
            expect(help).toContain(resource);
        }
    });
});

describe('buildResourceHelpText', () => {
    const resources = [...new Set(ACTIONS.map((spec) => spec.resource))];

    it.each(resources)('lists every action of %s and nothing else', (resource) => {
        const help = buildResourceHelpText(resource);
        const own = ACTIONS.filter((spec) => spec.resource === resource);
        const foreign = ACTIONS.filter((spec) => spec.resource !== resource);

        expect(own.length).toBeGreaterThan(0);
        for (const spec of own) {
            expect(help).toContain(spec.summary);
        }
        // A resource view that leaks another resource's actions is no more
        // scannable than the full listing it replaces.
        for (const spec of foreign) {
            if (!own.some((ownSpec) => ownSpec.summary === spec.summary)) {
                expect(help).not.toContain(spec.summary);
            }
        }
    });

    // `isReadAction`/`isWriteAction` deliberately exclude file-I/O actions so
    // they render once under the Attachment and BDD sections. Reusing those
    // predicates here would drop every action these two resources have.
    it.each(['attachment', 'bdd'])('does not drop the file-I/O actions of %s', (resource) => {
        const help = buildResourceHelpText(resource);
        const own = ACTIONS.filter((spec) => spec.resource === resource);
        expect(own.length).toBeGreaterThan(0);
        for (const spec of own) {
            expect(help).toContain(spec.action);
        }
    });

    it('is drastically shorter than the full listing', () => {
        expect(buildResourceHelpText('case').split('\n').length).toBeLessThan(buildHelpText().split('\n').length / 4);
    });

    it('points back at the full help for global options', () => {
        expect(buildResourceHelpText('case')).toContain("Run 'testrail --help'");
    });

    it('recognizes real resources and rejects the rest', () => {
        expect(isKnownResource('case')).toBe(true);
        expect(isKnownResource('attachment')).toBe(true);
        expect(isKnownResource('bogus')).toBe(false);
        expect(isKnownResource('')).toBe(false);
    });
});

describe('wrapIndented', () => {
    it('packs words onto indented lines and breaks before overflowing', () => {
        // 74 is the wrap width; fixed-length filler words let the boundary be
        // asserted without depending on the real resource list.
        const words = ['a'.repeat(40), 'b'.repeat(30), 'c'.repeat(10)];
        expect(wrapIndented(words)).toBe(`  ${'a'.repeat(40)} ${'b'.repeat(30)}\n  ${'c'.repeat(10)}`);
    });

    // The guard this pins: a first word already wider than the limit must
    // occupy its own over-long line, not flush an empty accumulator and emit
    // a stray two-space line ahead of itself.
    it('gives an over-long first word its own line, with no blank line before it', () => {
        const long = 'x'.repeat(100);
        expect(wrapIndented([long])).toBe(`  ${long}`);
        expect(wrapIndented([long, 'short'])).toBe(`  ${long}\n  short`);
    });

    it('returns an empty string for no words', () => {
        expect(wrapIndented([])).toBe('');
    });

    it('keeps a single short word on one line', () => {
        expect(wrapIndented(['project'])).toBe('  project');
    });
});
