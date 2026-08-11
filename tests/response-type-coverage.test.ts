import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { zObject, type KnownResponse } from '../src/schemas/common.js';
import type { Plan as SchemaPlan } from '../src/schemas/plans.js';
import {
    AddCaseFieldPayloadSchema,
    CaseFieldSchema,
    HistoryChangeSchema,
    MilestoneSchema,
    ResultFieldSchema,
    ResultSchema,
    TestSchema,
} from '../src/schemas.js';
import { HistoryChangeSchema as RootHistoryChangeSchema } from '../src/index.js';
import type {
    Case,
    CaseField,
    Group,
    HistoryChange,
    Milestone,
    Plan,
    Project,
    Result,
    ResultField,
    Run,
    Section,
    SharedStep,
    Suite,
    Test,
    User,
} from '../src/index.js';

const NestedRecordSchema = zObject({
    records: z.record(
        z.string(),
        zObject({
            id: z.number(),
        }),
    ),
});

type NestedRecordResponse = KnownResponse<typeof NestedRecordSchema>;
type IsOptional<TObject, TKey extends keyof TObject> = object extends Pick<TObject, TKey> ? true : false;

describe('schema-derived public response types', () => {
    it('exposes known schema fields and flat custom fields on the supported entities', () => {
        expectTypeOf<Test['case_title']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<Test['refs_data']>().toEqualTypeOf<unknown>();
        expectTypeOf<Result['case_title']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<Result['case_refs']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<CaseField['is_indexed']>().toEqualTypeOf<boolean | null | undefined>();
        expectTypeOf<CaseField['is_system']>().toEqualTypeOf<boolean | 0 | 1 | null | undefined>();
        expectTypeOf<ResultField['is_system']>().toEqualTypeOf<boolean | 0 | 1 | null | undefined>();
        expectTypeOf<Case['custom_owner']>().toEqualTypeOf<unknown>();
        expectTypeOf<Test['custom_steps']>().toEqualTypeOf<unknown>();
        expectTypeOf<Result['custom_step_results']>().toEqualTypeOf<unknown>();

        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidPlanCustomField = Plan['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidRunCustomField = Run['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidProjectCustomField = Project['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidSuiteCustomField = Suite['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidSectionCustomField = Section['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidMilestoneCustomField = Milestone['custom_owner'];
        // @ts-expect-error Non-custom response entities must not gain a broad index signature.
        type InvalidUserCustomField = User['custom_owner'];
        // @ts-expect-error Schema-only root response exports must also strip passthrough indexes.
        type InvalidGroupCustomField = Group['custom_owner'];
        // @ts-expect-error Misspelled prefixes must remain detectable on custom-field entities.
        type InvalidCaseTypo = Case['custmo_owner'];
        void (null as unknown as [
            InvalidPlanCustomField,
            InvalidRunCustomField,
            InvalidProjectCustomField,
            InvalidSuiteCustomField,
            InvalidSectionCustomField,
            InvalidMilestoneCustomField,
            InvalidUserCustomField,
            InvalidGroupCustomField,
        ]);
        void (null as unknown as InvalidCaseTypo);
    });

    it('recursively exposes only declared nested object fields', () => {
        type PlanEntryNode = NonNullable<Plan['entries']>[number];
        type PlanRunNode = PlanEntryNode['runs'][number];
        type ProjectGroup = NonNullable<Project['groups']>[number];
        type CaseLabel = NonNullable<Case['labels']>[number];
        type TestLabel = NonNullable<Test['labels']>[number];
        type CaseConfig = CaseField['configs'][number];
        type ResultConfig = ResultField['configs'][number];
        type ChildMilestone = NonNullable<Milestone['milestones']>[number];

        expectTypeOf<PlanEntryNode['name']>().toEqualTypeOf<string>();
        expectTypeOf<PlanRunNode['id']>().toEqualTypeOf<number>();
        expectTypeOf<ProjectGroup['role_id']>().toEqualTypeOf<number | null | undefined>();
        expectTypeOf<CaseLabel['id']>().toEqualTypeOf<number>();
        expectTypeOf<TestLabel['title']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<CaseConfig['context']['is_global']>().toEqualTypeOf<boolean>();
        expectTypeOf<ResultConfig['options']['is_required']>().toEqualTypeOf<boolean>();
        expectTypeOf<ChildMilestone['name']>().toEqualTypeOf<string>();
        expectTypeOf<Plan>().toEqualTypeOf<SchemaPlan>();
        expectTypeOf<IsOptional<PlanEntryNode, 'name'>>().toEqualTypeOf<false>();
        expectTypeOf<IsOptional<ProjectGroup, 'role_id'>>().toEqualTypeOf<true>();

        // @ts-expect-error Plan entries must not expose zObject passthrough keys.
        type InvalidPlanEntryField = PlanEntryNode['future_entry_field'];
        // @ts-expect-error Runs nested under plan entries must also be projected.
        type InvalidPlanRunField = PlanRunNode['future_run_field'];
        // @ts-expect-error Project group entries must not retain a string index.
        type InvalidProjectGroupField = ProjectGroup['future_group_field'];
        // @ts-expect-error Case-embedded labels must expose declared label fields only.
        type InvalidCaseLabelField = CaseLabel['future_label_field'];
        // @ts-expect-error Test-embedded labels must expose declared label fields only.
        type InvalidTestLabelField = TestLabel['future_label_field'];
        // @ts-expect-error Case-field configs must not retain a passthrough index.
        type InvalidCaseConfigField = CaseConfig['future_config_field'];
        // @ts-expect-error Nested case-field config context must also be closed.
        type InvalidCaseConfigContextField = CaseConfig['context']['future_context_field'];
        // @ts-expect-error Result-field configs must not retain a passthrough index.
        type InvalidResultConfigField = ResultConfig['future_config_field'];
        // @ts-expect-error Nested result-field config options must also be closed.
        type InvalidResultConfigOptionsField = ResultConfig['options']['future_options_field'];
        // @ts-expect-error Recursive milestone children must remain closed.
        type InvalidChildMilestoneField = ChildMilestone['future_milestone_field'];

        void (null as unknown as [
            InvalidPlanEntryField,
            InvalidPlanRunField,
            InvalidProjectGroupField,
            InvalidCaseLabelField,
            InvalidTestLabelField,
            InvalidCaseConfigField,
            InvalidCaseConfigContextField,
            InvalidResultConfigField,
            InvalidResultConfigOptionsField,
            InvalidChildMilestoneField,
        ]);
    });

    it('preserves intentionally open record fields', () => {
        type SharedStepRow = NonNullable<SharedStep['custom_steps_separated']>[number];
        type HistoryOptions = Exclude<NonNullable<HistoryChange['options']>, unknown[]>;
        type NestedRecordRow = NestedRecordResponse['records'][string];

        expectTypeOf<NonNullable<Case['custom_fields']>['tenant_specific']>().toEqualTypeOf<unknown>();
        expectTypeOf<SharedStepRow['tenant_specific']>().toEqualTypeOf<unknown>();
        expectTypeOf<HistoryOptions['tenant_specific']>().toEqualTypeOf<unknown>();
        expectTypeOf<NestedRecordRow['id']>().toEqualTypeOf<number>();
        expect(NestedRecordSchema.safeParse({ records: { tenant: { id: 1 } } }).success).toBe(true);

        // @ts-expect-error Record keys stay open, but their structured values do not.
        type InvalidNestedRecordValue = NestedRecordRow['future_record_value_field'];
        void (null as unknown as InvalidNestedRecordValue);
    });

    it('exports the history-change schema and matching response type from the package root', () => {
        expect(RootHistoryChangeSchema).toBe(HistoryChangeSchema);
        expectTypeOf<KnownResponse<typeof RootHistoryChangeSchema>>().toEqualTypeOf<HistoryChange>();
    });
});

describe('remaining response-field coverage', () => {
    it('models TestRail 10.5 case metadata on tests and results', () => {
        expect(TestSchema.shape.case_title.safeParse('Checkout').success).toBe(true);
        expect(TestSchema.shape.case_title.safeParse(null).success).toBe(true);
        expect(TestSchema.shape.case_title.safeParse(42).success).toBe(false);

        expect(ResultSchema.shape.case_title.safeParse('Checkout').success).toBe(true);
        expect(ResultSchema.shape.case_refs.safeParse('REQ-1,REQ-2').success).toBe(true);
        expect(ResultSchema.shape.case_refs.safeParse(42).success).toBe(false);
    });

    it.each([true, false, 0, 1, null, undefined])('accepts version-tolerant is_system value %s', (value) => {
        expect(CaseFieldSchema.shape.is_system.safeParse(value).success).toBe(true);
        expect(ResultFieldSchema.shape.is_system.safeParse(value).success).toBe(true);
    });

    it.each([2, -1, 'true'])('rejects invalid is_system value %s', (value) => {
        expect(CaseFieldSchema.shape.is_system.safeParse(value).success).toBe(false);
        expect(ResultFieldSchema.shape.is_system.safeParse(value).success).toBe(false);
    });

    it('keeps is_indexed boolean-only on reads and writes', () => {
        expect(CaseFieldSchema.shape.is_indexed.safeParse(true).success).toBe(true);
        expect(CaseFieldSchema.shape.is_indexed.safeParse(null).success).toBe(true);
        expect(CaseFieldSchema.shape.is_indexed.safeParse(1).success).toBe(false);

        const base = {
            type: 'String',
            name: 'external_id',
            label: 'External ID',
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
        };
        expect(AddCaseFieldPayloadSchema.safeParse({ ...base, is_indexed: true }).success).toBe(true);
        expect(AddCaseFieldPayloadSchema.safeParse({ ...base, is_indexed: 1 }).success).toBe(false);
    });

    it('recursively validates sub-milestones', () => {
        const milestone = {
            id: 1,
            name: 'Release',
            is_completed: false,
            project_id: 2,
            url: 'https://example.test/index.php?/milestones/view/1',
        };
        const parsed = MilestoneSchema.parse({
            ...milestone,
            milestones: [{ ...milestone, id: 3, name: 'Release candidate' }],
        });

        expect(parsed.milestones?.[0]?.name).toBe('Release candidate');
        expect(
            MilestoneSchema.safeParse({
                ...milestone,
                milestones: [{ ...milestone, id: 3, name: 42 }],
            }).success,
        ).toBe(false);
    });
});
