import { describe, expect, it } from 'vitest';
import {
    getAllowedActionFlags,
    resolveActionInvocation,
    validateMetaCommandFlags,
} from '../src/cli/action-invocation.js';
import { getCliFlagUsage, validateSuppliedFlagTypes } from '../src/cli/flags.js';
import { ACTIONS, getActionSpec } from '../src/cli/metadata.js';

function spec(resource: string, action: string) {
    const found = getActionSpec(resource, action);
    if (found === undefined) throw new Error(`Missing test ActionSpec: ${resource} ${action}`);
    return found;
}

describe('action invocation contract', () => {
    it('combines global, explicit, and controlled-pagination flags for case list', () => {
        const allowed = getAllowedActionFlags(spec('case', 'list'));

        expect(allowed).toEqual(
            expect.objectContaining(
                new Set(['base-url', 'project-id', 'suite-id', 'page', 'all', 'limit', 'page-size']),
            ),
        );
        expect(allowed.has('data')).toBe(false);
        expect(allowed.has('yes')).toBe(false);
        expect(allowed.has('file')).toBe(false);
    });

    it('admits safety controls but not request controls for response-driven pagination', () => {
        const allowed = getAllowedActionFlags(spec('role', 'list'));

        expect(allowed.has('page')).toBe(true);
        expect(allowed.has('all')).toBe(true);
        expect(allowed.has('max-pages')).toBe(true);
        expect(allowed.has('limit')).toBe(false);
        expect(allowed.has('page-size')).toBe(false);
    });

    it('retains limit/offset only for legacy items-mode actions that still document them', () => {
        expect(getAllowedActionFlags(spec('user', 'list')).has('limit')).toBe(false);
        expect(getAllowedActionFlags(spec('attachment', 'list-for-test')).has('offset')).toBe(true);
        expect(getAllowedActionFlags(spec('shared-step', 'history')).has('limit')).toBe(true);
        expect(getAllowedActionFlags(spec('project', 'get')).has('limit')).toBe(false);
    });

    it('preserves shared-step history request controls in items mode only', () => {
        const items = resolveActionInvocation({
            spec: spec('shared-step', 'history'),
            values: { limit: '5', offset: '15' },
            suppliedFlags: ['limit', 'offset'],
            pathParams: ['42'],
            dryRun: false,
        });
        expect(items.ok).toBe(true);
        if (items.ok) {
            expect(items.invocation.pagination).toEqual({ mode: 'items', limit: 5, offset: 15 });
            expect(items.invocation.args).toEqual({ pathParams: ['42'] });
        }

        const page = resolveActionInvocation({
            spec: spec('shared-step', 'history'),
            values: { page: true, limit: '5' },
            suppliedFlags: ['page', 'limit'],
            pathParams: ['42'],
            dryRun: false,
        });
        expect(page).toEqual({
            ok: false,
            error: 'This endpoint does not document caller-controlled pagination; omit --limit, --offset, --page-size, and --start-offset.',
        });
    });

    it('rejects a known but irrelevant flag with action-specific evidence', () => {
        const result = resolveActionInvocation({
            spec: spec('run', 'get'),
            values: { 'project-id': '9' },
            suppliedFlags: ['project-id'],
            pathParams: ['5'],
            dryRun: false,
        });

        expect(result).toEqual({ ok: false, error: '--project-id is not supported by run get.' });
    });

    it('projects semantic handler args and pagination separately', () => {
        const result = resolveActionInvocation({
            spec: spec('run', 'list'),
            values: {
                'project-id': '9',
                'include-plan-runs': true,
                limit: '10',
                offset: '20',
                page: true,
            },
            suppliedFlags: ['project-id', 'include-plan-runs', 'limit', 'offset', 'page'],
            pathParams: [],
            dryRun: false,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.invocation.args).toEqual({
            pathParams: [],
            projectId: '9',
            includePlanRuns: true,
        });
        expect(result.invocation.pagination).toEqual({ mode: 'page', limit: 10, offset: 20 });
    });

    it('derives body, file, output, write, and destructive capability groups', () => {
        const bodyWrite = getAllowedActionFlags(spec('case', 'add'));
        expect(bodyWrite.has('data')).toBe(true);
        expect(bodyWrite.has('data-file')).toBe(true);
        expect(bodyWrite.has('dry-run')).toBe(true);
        expect(bodyWrite.has('file')).toBe(false);

        const upload = getAllowedActionFlags(spec('attachment', 'add-to-case'));
        expect(upload.has('file')).toBe(true);
        expect(upload.has('filename')).toBe(true);
        expect(upload.has('data')).toBe(false);

        const download = getAllowedActionFlags(spec('attachment', 'get'));
        expect(download.has('out')).toBe(true);
        expect(download.has('force')).toBe(true);
        expect(download.has('dry-run')).toBe(true);

        const destructive = getAllowedActionFlags(spec('case', 'delete'));
        expect(destructive.has('yes')).toBe(true);
        expect(destructive.has('soft')).toBe(true);

        const watch = getAllowedActionFlags(spec('run', 'watch'));
        expect(watch.has('dry-run')).toBe(true);
    });

    it('rejects missing string values and inline boolean values before projection', () => {
        expect(
            resolveActionInvocation({
                spec: spec('run', 'watch'),
                values: { interval: true },
                suppliedFlags: ['interval'],
                pathParams: ['42'],
                dryRun: false,
            }),
        ).toEqual({ ok: false, error: '--interval requires a value.' });

        expect(
            resolveActionInvocation({
                spec: spec('run', 'close'),
                values: { 'dry-run': 'true', yes: true },
                suppliedFlags: ['dry-run', 'yes'],
                pathParams: ['42'],
                dryRun: false,
            }),
        ).toEqual({ ok: false, error: '--dry-run does not take a value; pass the flag without `=`.' });
    });

    it('ignores unknown spellings at layers that run behind the top-level unknown-flag gate', () => {
        expect(validateSuppliedFlagTypes({}, ['future-flag'])).toEqual({ ok: true });
        expect(validateMetaCommandFlags('install-skill', ['future-flag'])).toEqual({ ok: true });

        const result = resolveActionInvocation({
            spec: spec('project', 'get'),
            values: {},
            suppliedFlags: ['future-flag'],
            pathParams: ['1'],
            dryRun: false,
        });
        expect(result.ok).toBe(true);
    });

    it('supports boolean required-flag metadata and generic string usage hints', () => {
        const watch = spec('run', 'watch');
        const result = resolveActionInvocation({
            spec: { ...watch, flags: [{ name: 'once', required: true }] },
            values: { once: false },
            suppliedFlags: [],
            pathParams: ['42'],
            dryRun: false,
        });

        expect(result).toEqual({ ok: false, error: 'run watch requires --once.' });
        expect(getCliFlagUsage('suite-id')).toBe('--suite-id <value>');
    });

    it('rejects invalid legacy items-mode request controls at the final pagination seam', () => {
        const result = resolveActionInvocation({
            spec: spec('attachment', 'list-for-test'),
            values: { 'page-size': '5' },
            suppliedFlags: ['page-size'],
            pathParams: ['42'],
            dryRun: false,
        });

        expect(result).toEqual({ ok: false, error: '--page-size is only valid together with --all.' });
    });

    it('centralizes soft applicability while preserving dry-run-wins semantics', () => {
        const rejected = resolveActionInvocation({
            spec: spec('attachment', 'delete'),
            values: { soft: true, yes: true },
            suppliedFlags: ['soft', 'yes'],
            pathParams: ['5'],
            dryRun: false,
        });
        expect(rejected).toEqual({ ok: false, error: 'attachment delete does not support --soft.' });

        const preview = resolveActionInvocation({
            spec: spec('attachment', 'delete'),
            values: { soft: true, 'dry-run': true },
            suppliedFlags: ['soft', 'dry-run'],
            pathParams: ['5'],
            dryRun: true,
        });
        expect(preview.ok).toBe(true);

        const irreversibleClose = resolveActionInvocation({
            spec: spec('run', 'close'),
            values: { soft: true, yes: true },
            suppliedFlags: ['soft', 'yes'],
            pathParams: ['5'],
            dryRun: false,
        });
        expect(irreversibleClose).toEqual({ ok: false, error: 'run close does not support --soft.' });

        const closeDryRun = resolveActionInvocation({
            spec: spec('run', 'close'),
            values: { soft: true, 'dry-run': true },
            suppliedFlags: ['soft', 'dry-run'],
            pathParams: ['5'],
            dryRun: true,
        });
        expect(closeDryRun.ok).toBe(true);
    });

    it('validates every genuinely required action flag before auth', () => {
        const required = [
            ['attachment', 'get', 'out'],
            ['attachment', 'add-to-case', 'file'],
            ['attachment', 'add-to-result', 'file'],
            ['attachment', 'add-to-run', 'file'],
            ['attachment', 'add-to-plan', 'file'],
            ['attachment', 'add-to-plan-entry', 'file'],
            ['bdd', 'get', 'out'],
            ['bdd', 'list', 'project-id'],
            ['bdd', 'add', 'file'],
            ['bdd', 'update', 'file'],
            ['case', 'list', 'project-id'],
            ['case', 'delete-bulk', 'project-id'],
            ['milestone', 'list', 'project-id'],
            ['plan', 'list', 'project-id'],
            ['result', 'list', 'run-id'],
            ['run', 'list', 'project-id'],
            ['shared-step', 'list', 'project-id'],
            ['suite', 'list', 'project-id'],
            ['user', 'get-by-email', 'user-email'],
        ] as const;

        expect(
            ACTIONS.flatMap((candidate) =>
                (candidate.flags ?? [])
                    .filter((flag) => flag.required === true)
                    .map((flag) => `${candidate.resource}:${candidate.action}:${flag.name}`),
            ).sort(),
        ).toEqual(required.map(([resource, action, flag]) => `${resource}:${action}:${flag}`).sort());

        for (const [resource, action, flag] of required) {
            const result = resolveActionInvocation({
                spec: spec(resource, action),
                values: {},
                suppliedFlags: [],
                pathParams: [],
                dryRun: false,
            });
            expect(result).toEqual({
                ok: false,
                error: `${resource} ${action} requires ${getCliFlagUsage(flag)}.`,
            });
        }

        const present = resolveActionInvocation({
            spec: spec('case', 'list'),
            values: { 'project-id': '7' },
            suppliedFlags: ['project-id'],
            pathParams: [],
            dryRun: false,
        });
        expect(present.ok).toBe(true);

        const blank = resolveActionInvocation({
            spec: spec('user', 'get-by-email'),
            values: { 'user-email': '   ' },
            suppliedFlags: ['user-email'],
            pathParams: [],
            dryRun: false,
        });
        expect(blank).toEqual({ ok: false, error: 'user get-by-email requires --user-email <email>.' });
    });

    it('models install/uninstall flag applicability before filesystem mutation', () => {
        expect(validateMetaCommandFlags('install-skill', ['global', 'force', 'print-path', 'quiet'])).toEqual({
            ok: true,
        });
        expect(validateMetaCommandFlags('uninstall-skill', ['global', 'quiet'])).toEqual({ ok: true });
        expect(validateMetaCommandFlags('install-skill', ['yes'])).toEqual({
            ok: false,
            error: '--yes is not supported by install-skill.',
        });
        expect(validateMetaCommandFlags('uninstall-skill', ['force'])).toEqual({
            ok: false,
            error: '--force is not supported by uninstall-skill.',
        });
    });

    it('pins the action-owned soft capability cohorts', () => {
        const optional = ACTIONS.filter((candidate) => candidate.softMode === 'optional').map(
            (candidate) => `${candidate.resource}:${candidate.action}`,
        );
        expect(optional).toEqual(['case:delete', 'case:delete-bulk', 'run:delete', 'section:delete', 'suite:delete']);
        expect(
            ACTIONS.filter((candidate) => candidate.softMode !== undefined).every(
                (candidate) => candidate.destructive === true,
            ),
        ).toBe(true);
    });

    it('rejects body, file, confirmation, and meta flags outside their owners', () => {
        for (const flag of ['data', 'file', 'yes', 'global'] as const) {
            const result = resolveActionInvocation({
                spec: spec('project', 'get'),
                values: { [flag]: flag === 'data' || flag === 'file' ? 'x' : true },
                suppliedFlags: [flag],
                pathParams: ['1'],
                dryRun: false,
            });
            expect(result).toEqual({ ok: false, error: `--${flag} is not supported by project get.` });
        }
    });
});
