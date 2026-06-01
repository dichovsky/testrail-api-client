import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRailClient, TestRailValidationError } from '../src/client.js';
import type {
    Project,
    Suite,
    Section,
    Case,
    Plan,
    PlanEntry,
    Run,
    Test,
    Result,
    Milestone,
    User,
    Status,
    Priority,
    GetRunsOptions,
    ResultField,
    CaseField,
    CaseType,
    Template,
    ConfigurationGroup,
    Configuration,
    HistoryEntry,
    CaseStatus,
    Attachment,
} from '../src/types.js';
import type {
    AddCasePayload,
    UpdateCasePayload,
    UpdateCasesPayload,
    DeleteCasesPayload,
    CopyCasesToSectionPayload,
    MoveCasesToSectionPayload,
    AddCaseFieldPayload,
    AddCaseFieldResponse,
    MoveSectionPayload,
    AddRunPayload,
    UpdateRunPayload,
    AddResultPayload,
    AddResultsForCasesPayload,
    AddResultsPayload,
    AddPlanPayload,
    UpdatePlanPayload,
    AddPlanEntryPayload,
    UpdatePlanEntryPayload,
    AddRunToPlanEntryPayload,
    AddSuitePayload,
    UpdateSuitePayload,
    AddMilestonePayload,
    UpdateMilestonePayload,
    UpdateRunInPlanEntryPayload,
} from '../src/schemas.js';
import { createClient, mockOk, mockErr, mockEmpty } from './helpers.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestRailClient', () => {
    let client: TestRailClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = createClient();
    });

    describe('constructor', () => {
        it('should create client with correct config', () => {
            expect(client).toBeInstanceOf(TestRailClient);
        });

        it('should remove trailing slash from baseUrl', () => {
            const clientWithSlash = new TestRailClient({
                baseUrl: 'https://example.testrail.io/',
                email: 'test@example.com',
                apiKey: 'test-api-key',
            });
            expect(clientWithSlash).toBeInstanceOf(TestRailClient);
        });
    });

    describe('request handling', () => {
        it('should handle successful GET request', async () => {
            const mockProject: Project = {
                id: 1,
                name: 'Test Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.projects.getProject(1);
            expect(result).toEqual(mockProject);
        });

        it('should handle API error', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'Project not found'));

            await expect(client.projects.getProject(999)).rejects.toThrow('TestRail API error: 404 Not Found');
        });

        it('should handle empty response', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            const result = await client.cases.deleteCase(1);
            expect(result).toBeUndefined();
        });

        it('should handle POST request with data', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: AddCasePayload = {
                title: 'Test Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.cases.addCase(1, payload);
            expect(result).toEqual(mockCase);
        });
    });

    describe('Projects', () => {
        it('should get project by ID', async () => {
            const mockProject: Project = {
                id: 1,
                name: 'Test Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.projects.getProject(1);
            expect(result).toEqual(mockProject);
        });

        it('should parse null-valued optional project fields', async () => {
            const mockProject = {
                id: 1,
                name: 'Test Project',
                announcement: null,
                show_announcement: null,
                is_completed: null,
                completed_on: null,
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockProject));

            const result = await client.projects.getProject(1);
            expect(result).toEqual(mockProject);
        });

        it('should get all projects', async () => {
            const mockProjects: Project[] = [
                { id: 1, name: 'Project 1', suite_mode: 1, url: 'url1' },
                { id: 2, name: 'Project 2', suite_mode: 2, url: 'url2' },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ projects: mockProjects }));

            const result = await client.projects.getProjects();
            expect(result).toEqual(mockProjects);
        });

        it('should handle empty projects list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.projects.getProjects();
            expect(result).toEqual([]);
        });

        it('should treat null projects list as empty', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ projects: null }));

            const result = await client.projects.getProjects();
            expect(result).toEqual([]);
        });

        it('parses get_project response with all 7.3+ fields (default_role_id, default_role, users[get_project shape], groups)', async () => {
            const fullProject: Project = {
                id: 1,
                name: 'Project X',
                announcement: 'Welcome to project X',
                show_announcement: true,
                is_completed: false,
                completed_on: 1389968184,
                suite_mode: 1,
                url: 'https://instance.testrail.io/index.php?/projects/overview/1',
                default_role_id: 3,
                default_role: 'Tester',
                groups: [{ id: 1, role: 'Tester', role_id: 3 }],
                users: [
                    {
                        id: 3,
                        global_role_id: null,
                        global_role: null,
                        project_role_id: null,
                        project_role: null,
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(fullProject));
            const result = await client.projects.getProject(1);
            // Field-specific assertions first so a single-field bug surfaces with a tight error
            // instead of a multi-page diff from toEqual on the deeply-nested object.
            expect(result.default_role_id).toBe(3);
            expect(result.default_role).toBe('Tester');
            expect(result.groups).toEqual([{ id: 1, role: 'Tester', role_id: 3 }]);
            expect(result.users?.[0]?.id).toBe(3);
            expect(result.users?.[0]?.global_role_id).toBeNull();
            expect(result).toEqual(fullProject);
        });

        it('parses update_project response with the alternate users[user_id, role_id] shape', async () => {
            // TestRail's update_project response documents a DIFFERENT inner shape for
            // users[] than get_project — `{ user_id, role_id }` instead of
            // `{ id, global_role_id, ... }`. The schema must accept both because the
            // module uses a single ProjectSchema for getProject() / updateProject() /
            // addProject(). Reject this test if the union-of-shapes regresses to a
            // get_project-only model.
            const updateResp = {
                id: 1,
                name: 'Project X',
                announcement: 'Welcome to project X',
                show_announcement: true,
                is_completed: false,
                completed_on: null,
                suite_mode: 1,
                url: 'https://instance.testrail.io/index.php?/projects/overview/1',
                default_role_id: 3,
                groups: [],
                users: [{ user_id: 4, role_id: null }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(updateResp));
            const result = await client.projects.updateProject(1, { name: 'Project X' });
            expect(result.users?.[0]?.user_id).toBe(4);
            expect(result.users?.[0]?.role_id).toBeNull();
            // `id` and `global_role_id` not present in update_project shape → undefined.
            expect(result.users?.[0]?.id).toBeUndefined();
            expect(result.users?.[0]?.global_role_id).toBeUndefined();
            expect(result.groups).toEqual([]);
        });

        it('parses the minimal pre-7.3 response (all 7.3+ fields omitted)', async () => {
            const minimalProject: Project = {
                id: 1,
                name: 'Legacy Project',
                suite_mode: 1,
                url: 'https://legacy.testrail.io/projects/view/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(minimalProject));
            const result = await client.projects.getProject(1);
            // Missing keys (Zod `.nullish()` with absent input) → undefined, not null.
            expect(result.default_role_id).toBeUndefined();
            expect(result.default_role).toBeUndefined();
            expect(result.users).toBeUndefined();
            expect(result.groups).toBeUndefined();
            expect(result).toEqual(minimalProject);
        });

        it('parses a partial-fields response where some 7.3+ fields are present and others omitted', async () => {
            // Defensive-design check: even though the TestRail spec never emits such a mixed
            // shape, `.nullish()` per-field must accept the cross-product of present/absent
            // independently. Regressions to `.optional()` (no null accepted) or `.nullable()`
            // (no missing key accepted) would fail here.
            const partial = {
                id: 1,
                name: 'Partial Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
                default_role_id: 3,
                groups: [],
                // default_role, users omitted
            };
            mockFetch.mockResolvedValueOnce(mockOk(partial));
            const result = await client.projects.getProject(1);
            expect(result.default_role_id).toBe(3);
            expect(result.groups).toEqual([]);
            expect(result.default_role).toBeUndefined();
            expect(result.users).toBeUndefined();
        });

        it('parses project response with all 7.3+ fields explicitly set to null', async () => {
            const projectWithNulls = {
                id: 1,
                name: 'Null-fields Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
                default_role_id: null,
                default_role: null,
                groups: null,
                users: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(projectWithNulls));
            const result = await client.projects.getProject(1);
            expect(result.default_role_id).toBeNull();
            expect(result.default_role).toBeNull();
            expect(result.groups).toBeNull();
            expect(result.users).toBeNull();
        });

        it('rejects users when the wire delivers a non-array value', async () => {
            const malformed = {
                id: 1,
                name: 'Bad Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
                users: 'not-an-array',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.projects.getProject(1)).rejects.toThrow();
        });

        it('rejects groups when the wire delivers a non-array value', async () => {
            const malformed = {
                id: 1,
                name: 'Bad Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
                groups: 42,
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.projects.getProject(1)).rejects.toThrow();
        });

        it('rejects a users[] element where role_id is a non-numeric string (not coerced)', async () => {
            // Each inner user field is `.nullish()` on a typed primitive — string is NOT
            // a valid `number | null | undefined` and must be rejected, not coerced.
            const malformed = {
                id: 1,
                name: 'Bad Project',
                suite_mode: 1,
                url: 'https://example.testrail.io/projects/view/1',
                users: [{ user_id: 4, role_id: 'three' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.projects.getProject(1)).rejects.toThrow();
        });
    });

    describe('Suites', () => {
        it('should get suite by ID', async () => {
            const mockSuite: Suite = {
                id: 1,
                name: 'Test Suite',
                project_id: 1,
                url: 'https://example.testrail.io/suites/view/1',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.suites.getSuite(1);
            expect(result).toEqual(mockSuite);
        });

        it('should get all suites for a project (bare-array response, TestRail < 9.3.1)', async () => {
            const mockSuites: Suite[] = [
                { id: 1, name: 'Suite 1', project_id: 1, url: 'url1' },
                { id: 2, name: 'Suite 2', project_id: 1, url: 'url2' },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockSuites));

            const result = await client.suites.getSuites(1);
            expect(result).toEqual(mockSuites);
        });

        it('should get all suites from the paginated wrapper (TestRail 9.3.1+)', async () => {
            const mockSuites: Suite[] = [
                { id: 1, name: 'Suite 1', project_id: 1, url: 'url1' },
                { id: 2, name: 'Suite 2', project_id: 1, url: 'url2' },
            ];
            // 9.3.1 added pagination to get_suites: the response becomes the
            // `{ offset, limit, size, _links, suites: [...] }` wrapper. The
            // client must accept this shape too (forward-compat).
            mockFetch.mockResolvedValueOnce(
                mockOk({
                    offset: 0,
                    limit: 250,
                    size: mockSuites.length,
                    _links: { next: null, prev: null },
                    suites: mockSuites,
                }),
            );

            const result = await client.suites.getSuites(1);
            expect(result).toEqual(mockSuites);
        });

        it('should return [] for an empty suites wrapper', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ offset: 0, limit: 250, size: 0, _links: {}, suites: [] }));
            expect(await client.suites.getSuites(1)).toEqual([]);
        });

        it('should return [] when suites is explicitly null (.nullish() contract)', async () => {
            // `.nullish()` accepts `null`; `null ?? []` → []. Symmetric with the
            // getRoles wrapper handling.
            mockFetch.mockResolvedValueOnce(mockOk({ offset: 0, limit: 250, size: 0, _links: {}, suites: null }));
            expect(await client.suites.getSuites(1)).toEqual([]);
        });

        it('should add a suite', async () => {
            const mockSuite: Suite = {
                id: 3,
                name: 'Suite 3',
                description: 'Suite description',
                project_id: 1,
                url: 'url3',
            };
            const payload: AddSuitePayload = {
                name: 'Suite 3',
                description: 'Suite description',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.suites.addSuite(1, payload);
            expect(result).toEqual(mockSuite);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid projectId in addSuite', async () => {
            await expect(client.suites.addSuite(0, { name: 'Suite 1' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should propagate API error from addSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.suites.addSuite(1, { name: 'Suite 1' })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should update a suite', async () => {
            const mockSuite: Suite = {
                id: 1,
                name: 'Updated Suite',
                description: 'Updated description',
                project_id: 1,
                url: 'url1',
            };
            const payload: UpdateSuitePayload = {
                name: 'Updated Suite',
                description: 'Updated description',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSuite));

            const result = await client.suites.updateSuite(1, payload);
            expect(result).toEqual(mockSuite);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid suiteId in updateSuite', async () => {
            await expect(client.suites.updateSuite(0, { name: 'Updated Suite' })).rejects.toThrow(
                'suiteId must be a positive integer',
            );
        });

        it('should propagate API error from updateSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.suites.updateSuite(1, { name: 'Updated Suite' })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should delete a suite', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            const result = await client.suites.deleteSuite(1);
            expect(result).toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_suite/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid suiteId in deleteSuite', async () => {
            await expect(client.suites.deleteSuite(-1)).rejects.toThrow('suiteId must be a positive integer');
        });

        it('should propagate API error from deleteSuite', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.suites.deleteSuite(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Sections', () => {
        it('should get section by ID', async () => {
            const mockSection: Section = {
                id: 1,
                suite_id: 1,
                name: 'Test Section',
                display_order: 1,
                depth: 0,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockSection));

            const result = await client.sections.getSection(1);
            expect(result).toEqual(mockSection);
        });

        it('should get all sections for a project', async () => {
            const mockSections: Section[] = [
                { id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 },
                { id: 2, suite_id: 1, name: 'Section 2', display_order: 2, depth: 0 },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ sections: mockSections }));

            const result = await client.sections.getSections(1);
            expect(result).toEqual(mockSections);
        });

        it('should get sections for a project and suite', async () => {
            const mockSections: Section[] = [{ id: 1, suite_id: 1, name: 'Section 1', display_order: 1, depth: 0 }];

            mockFetch.mockResolvedValueOnce(mockOk({ sections: mockSections }));

            const result = await client.sections.getSections(1, { suiteId: 1 });
            expect(result).toEqual(mockSections);
        });

        it('should handle empty sections list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.sections.getSections(1);
            expect(result).toEqual([]);
        });

        describe('moveSection', () => {
            it('POSTs to move_section/{section_id} with the payload', async () => {
                mockFetch.mockResolvedValueOnce(mockEmpty());
                const payload: MoveSectionPayload = { parent_id: null, after_id: 42 };
                await client.sections.moveSection(5, payload);
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('move_section/5'), expect.anything());
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(init.method).toBe('POST');
                // null must survive serialization — it carries the explicit
                // "move to root" semantic and is NOT the same as omitting the
                // field.
                const body = JSON.parse(init.body as string) as Record<string, unknown>;
                expect(body['parent_id']).toBeNull();
                expect(body['after_id']).toBe(42);
            });

            it('accepts an empty payload (both fields optional)', async () => {
                mockFetch.mockResolvedValueOnce(mockEmpty());
                await client.sections.moveSection(5, {});
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            it('rejects non-positive-integer sectionId', async () => {
                await expect(client.sections.moveSection(0, {})).rejects.toThrow(TestRailValidationError);
            });
        });
    });

    describe('Cases', () => {
        it('should get case by ID', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.cases.getCase(1);
            expect(result).toEqual(mockCase);
        });

        it('should parse null-valued optional case fields', async () => {
            const mockCase = {
                id: 1,
                title: 'Test Case',
                section_id: 1,
                template_id: null,
                type_id: null,
                priority_id: null,
                milestone_id: null,
                refs: null,
                estimate: null,
                estimate_forecast: null,
                display_order: null,
                is_deleted: null,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.cases.getCase(1);
            expect(result).toEqual(mockCase);
        });

        it('should get all cases for a project', async () => {
            const mockCases: Case[] = [
                {
                    id: 1,
                    title: 'Case 1',
                    section_id: 1,
                    created_by: 1,
                    created_on: 1234567890,
                    updated_by: 1,
                    updated_on: 1234567890,
                    suite_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.cases.getCases(1);
            expect(result).toEqual(mockCases);
        });

        it('should get cases with suite filter', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.cases.getCases(1, { suiteId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should get cases with suite and section filters', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.cases.getCases(1, { suiteId: 1, sectionId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should get cases with only section filter', async () => {
            const mockCases: Case[] = [];

            mockFetch.mockResolvedValueOnce(mockOk({ cases: mockCases }));

            const result = await client.cases.getCases(1, { sectionId: 1 });
            expect(result).toEqual(mockCases);
        });

        it('should handle empty cases list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.cases.getCases(1);
            expect(result).toEqual([]);
        });

        it('should treat null cases list as empty', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: null }));

            const result = await client.cases.getCases(1);
            expect(result).toEqual([]);
        });

        it('should filter by typeId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { typeId: 3 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('type_id=3'), expect.anything());
        });

        it('should filter by priorityId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { priorityId: 2 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('priority_id=2'), expect.anything());
        });

        it('should filter by templateId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { templateId: 1 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('template_id=1'), expect.anything());
        });

        it('should filter by milestoneId', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { milestoneId: 5 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('milestone_id=5'), expect.anything());
        });

        it('should filter by createdAfter and createdBefore timestamps', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { createdAfter: 1700000000, createdBefore: 1710000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('created_after=1700000000'),
                expect.anything(),
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('created_before=1710000000'),
                expect.anything(),
            );
        });

        it('should filter by updatedAfter and updatedBefore timestamps', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { updatedAfter: 1700000000, updatedBefore: 1710000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('updated_after=1700000000'),
                expect.anything(),
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('updated_before=1710000000'),
                expect.anything(),
            );
        });

        it('should reject invalid typeId', async () => {
            await expect(client.cases.getCases(1, { typeId: -1 })).rejects.toThrow('typeId must be a positive integer');
        });

        it('should reject invalid priorityId', async () => {
            await expect(client.cases.getCases(1, { priorityId: 0 })).rejects.toThrow(
                'priorityId must be a positive integer',
            );
        });

        it('should reject invalid templateId', async () => {
            await expect(client.cases.getCases(1, { templateId: 1.5 })).rejects.toThrow(
                'templateId must be a positive integer',
            );
        });

        it('should reject invalid milestoneId', async () => {
            await expect(client.cases.getCases(1, { milestoneId: -5 })).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should add a new case', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'New Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: AddCasePayload = {
                title: 'New Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.cases.addCase(1, payload);
            expect(result).toEqual(mockCase);
        });

        it('should update a case', async () => {
            const mockCase: Case = {
                id: 1,
                title: 'Updated Case',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };

            const payload: UpdateCasePayload = {
                title: 'Updated Case',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockCase));

            const result = await client.cases.updateCase(1, payload);
            expect(result).toEqual(mockCase);
        });

        it('should delete a case', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.cases.deleteCase(1);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should get history for a case', async () => {
            const mockHistory: HistoryEntry[] = [
                {
                    id: 1,
                    user_id: 5,
                    type_id: 2,
                    timestamp: 1700000000,
                    changes: [{ field: 'title', type_id: 1, old_text: 'old', new_text: 'new' }],
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ history: mockHistory }));

            const result = await client.cases.getHistoryForCase(42);
            expect(result).toEqual(mockHistory);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_history_for_case/42'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getHistoryForCase', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ history: [] }));
            await client.cases.getHistoryForCase(42, { limit: 50, offset: 100 });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('limit=50');
            expect(url).toContain('offset=100');
        });

        it('should return empty array when history envelope is missing', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.cases.getHistoryForCase(42);
            expect(result).toEqual([]);
        });

        it('should reject invalid caseId in getHistoryForCase', async () => {
            await expect(client.cases.getHistoryForCase(-1)).rejects.toThrow('caseId must be a positive integer');
        });

        it('parses get_history_for_case response with SPEC #2.1.13 fields (label, options, old_value, new_value)', async () => {
            // Per the documented `get_history_for_case` example: a change record
            // can carry `old_value` / `new_value` as integers (e.g. `section_id`)
            // alongside the previously-modelled `field` / `type_id` / `old_text` /
            // `new_text` keys.
            const richHistory: HistoryEntry[] = [
                {
                    id: 3382,
                    type_id: 6,
                    created_on: 1597927176,
                    user_id: 1,
                    changes: [
                        {
                            type_id: 1,
                            old_text: 'Original Section',
                            new_text: 'Updated Section',
                            field: 'section_id',
                            label: 'Section',
                            options: [{ is_required: true }],
                            old_value: 3573,
                            new_value: 3574,
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history: richHistory }));
            const result = await client.cases.getHistoryForCase(42);
            const change = result[0]?.changes?.[0];
            expect(change?.label).toBe('Section');
            expect(change?.options).toEqual([{ is_required: true }]);
            expect(change?.old_value).toBe(3573);
            expect(change?.new_value).toBe(3574);
            expect(result).toEqual(richHistory);
        });

        it('parses a change with old_value: null and new_value as string (refs example from docs)', async () => {
            // Per the doc's second example: `{ "field": "refs", "old_value": null,
            // "new_value": "1" }`. `old_value` / `new_value` are typed `unknown` so
            // `null` and `string` both pass — the schema must not reject either.
            const history: HistoryEntry[] = [
                {
                    id: 3389,
                    type_id: 6,
                    created_on: 1597932715,
                    user_id: 1,
                    changes: [
                        {
                            type_id: 1,
                            field: 'refs',
                            old_value: null,
                            new_value: '1',
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            const result = await client.cases.getHistoryForCase(42);
            const change = result[0]?.changes?.[0];
            expect(change?.old_value).toBeNull();
            expect(change?.new_value).toBe('1');
            expect(change?.label).toBeUndefined();
            expect(change?.options).toBeUndefined();
        });

        it('parses a change carrying old_value / new_value as booleans (boolean field type)', async () => {
            // TestRail's field type table lists 3 = boolean. The doc says "value can
            // be text or an integer" but real wire boolean fields emit `true`/`false`.
            // `z.unknown()` accepts any JSON-compatible value.
            const history: HistoryEntry[] = [
                {
                    id: 3400,
                    type_id: 6,
                    created_on: 1700000000,
                    user_id: 1,
                    changes: [
                        {
                            type_id: 3,
                            field: 'is_deleted',
                            label: 'Deleted',
                            old_value: false,
                            new_value: true,
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            const result = await client.cases.getHistoryForCase(42);
            const change = result[0]?.changes?.[0];
            expect(change?.old_value).toBe(false);
            expect(change?.new_value).toBe(true);
        });

        it('parses a change with options[] as a complex inner shape (no element-schema enforcement)', async () => {
            // The `options` array's inner shape varies per field type — `z.unknown()`
            // for the element type means the schema doesn't reject any element shape.
            // Verifies we can carry through a heterogeneous list of inner objects.
            const history: HistoryEntry[] = [
                {
                    id: 3401,
                    type_id: 6,
                    created_on: 1700000001,
                    user_id: 1,
                    changes: [
                        {
                            field: 'priority_id',
                            label: 'Priority',
                            options: [{ is_required: true, default_value: 'Medium' }, 'auto-derived', 42, null],
                            old_value: 'Low',
                            new_value: 'High',
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            const result = await client.cases.getHistoryForCase(42);
            expect(result[0]?.changes?.[0]?.options).toHaveLength(4);
        });

        it('rejects a change where options is not an array', async () => {
            const history = [
                {
                    id: 1,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [{ field: 'x', options: 'not-an-array' }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            await expect(client.cases.getHistoryForCase(42)).rejects.toThrow();
        });

        it('rejects a change where label is a number (no coercion)', async () => {
            const history = [
                {
                    id: 1,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [{ field: 'x', label: 42 }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            await expect(client.cases.getHistoryForCase(42)).rejects.toThrow();
        });

        it('rejects a change where label is a boolean (no coercion)', async () => {
            // Sibling of the `label: 42` test — `label` is a string-only field,
            // booleans must be rejected just like numbers.
            const history = [
                {
                    id: 1,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [{ field: 'x', label: true }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            await expect(client.cases.getHistoryForCase(42)).rejects.toThrow();
        });

        it('rejects a change where options is a plain object instead of an array', async () => {
            // The previous coverage tested `options: 'not-an-array'`. A bare
            // object is the other natural mistake and must be rejected as well.
            const history = [
                {
                    id: 1,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [{ field: 'x', options: { is_required: true } }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            await expect(client.cases.getHistoryForCase(42)).rejects.toThrow();
        });

        it('parses old_value / new_value as arrays (separated-steps field type)', async () => {
            // The schema comment hypothesises arrays for type_id=8 (separated
            // steps); this test exercises that variant of the discriminated
            // union so a regression to `z.unknown()` or to a non-array union
            // would surface.
            const history: HistoryEntry[] = [
                {
                    id: 4001,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [
                        {
                            type_id: 8,
                            field: 'custom_steps_separated',
                            label: 'Steps',
                            old_value: [{ content: 'old step 1', expected: '' }],
                            new_value: [
                                { content: 'new step 1', expected: 'pass' },
                                { content: 'new step 2', expected: 'pass' },
                            ],
                        },
                    ],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            const result = await client.cases.getHistoryForCase(42);
            const change = result[0]?.changes?.[0];
            expect(Array.isArray(change?.old_value)).toBe(true);
            expect(Array.isArray(change?.new_value)).toBe(true);
            expect(change?.new_value as unknown[]).toHaveLength(2);
        });

        it('rejects old_value when wire delivers a plain object (not in the discriminated union)', async () => {
            // The union accepts string | number | boolean | array | null. Plain
            // objects are NOT in the union — they should be rejected. This is the
            // ergonomics-vs-`z.unknown()` win: callers no longer have to defend
            // against arbitrary object shapes leaking through the parse boundary.
            const history = [
                {
                    id: 1,
                    type_id: 6,
                    user_id: 1,
                    timestamp: 1700000000,
                    changes: [{ field: 'x', old_value: { unexpected: 'shape' } }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history }));
            await expect(client.cases.getHistoryForCase(42)).rejects.toThrow();
        });
    });

    describe('Bulk case operations', () => {
        const mockCase: Case = {
            id: 1,
            title: 'C',
            section_id: 1,
            suite_id: 1,
            created_by: 1,
            created_on: 0,
            updated_by: 1,
            updated_on: 0,
        };

        describe('addCases (bulk)', () => {
            it('POSTs to add_cases/{section_id} with the array payload and returns Case[]', async () => {
                mockFetch.mockResolvedValueOnce(mockOk([mockCase, { ...mockCase, id: 2, title: 'C2' }]));
                const result = await client.cases.addCases(12, [{ title: 'C' }, { title: 'C2' }]);
                expect(result).toHaveLength(2);
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_cases/12'), expect.anything());
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(init.method).toBe('POST');
                const body = JSON.parse(init.body as string) as unknown;
                expect(body).toEqual([{ title: 'C' }, { title: 'C2' }]);
            });

            it('rejects non-positive sectionId before calling the API', async () => {
                await expect(client.cases.addCases(0, [{ title: 'X' }])).rejects.toThrow(TestRailValidationError);
                expect(mockFetch).not.toHaveBeenCalled();
            });

            it('rewraps "Invalid uri" 400 as a "TestRail >= 7.5 required" error', async () => {
                mockFetch.mockResolvedValueOnce(mockErr(400, 'Bad Request', JSON.stringify({ error: 'Invalid uri' })));
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(/TestRail server >= 7\.5/);
            });

            it('rewraps "Invalid uri" 404 as a "TestRail >= 7.5 required" error', async () => {
                mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', JSON.stringify({ error: 'Invalid uri' })));
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(/TestRail server >= 7\.5/);
            });

            it('passes through 4xx errors that do not match the version-gate fingerprint', async () => {
                mockFetch.mockResolvedValueOnce(
                    mockErr(
                        400,
                        'Bad Request',
                        JSON.stringify({ error: 'Field title is required and cannot be empty' }),
                    ),
                );
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(/TestRail API error: 400/);
            });

            it('passes through TestRailValidationError unchanged (non-TestRailApiError branch)', async () => {
                // A schema-validation failure inside request(spec) throws
                // TestRailValidationError. The addCases try/catch tests
                // `e instanceof TestRailApiError` first — when false, the
                // catch must rethrow as-is rather than apply the version-gate
                // fingerprint. Returning a malformed shape from the server
                // triggers this path.
                mockFetch.mockResolvedValueOnce(
                    new Response(JSON.stringify([{ notACase: true }]), {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(TestRailValidationError);
            });

            it('passes through a 400 with no response body (defensive — exercises e.response ?? "" branch)', async () => {
                // When the server returns a 4xx with an empty body, the
                // version-gate regex sees an empty string and falls through
                // to the generic rethrow. Confirms the nullish-coalesce
                // fallback in the response-stringification branch doesn't
                // misclassify empty responses as a version-gate match.
                mockFetch.mockResolvedValueOnce(
                    new Response('', {
                        status: 400,
                        statusText: 'Bad Request',
                    }),
                );
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(/TestRail API error: 400/);
            });

            it('matches "No route" in addition to "Invalid uri" for the version gate', async () => {
                // Documented dual fingerprint. Without a test for `No route`
                // the alternation branch in the regex is unexercised.
                mockFetch.mockResolvedValueOnce(mockErr(400, 'Bad Request', 'No route found'));
                await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(/TestRail server >= 7\.5/);
            });

            it('handles a TestRailApiError with object-shaped response (non-string typeof branch)', async () => {
                // Exercises the `typeof e.response === 'string' ? ... : JSON.stringify(...)`
                // false branch in cases.ts. We stub request() to throw a
                // TestRailApiError whose `response` is an object, which the
                // version-gate must JSON.stringify before applying the regex.
                // The object stringifies to '{"error":"Invalid uri"}' so the
                // version-gate fingerprint matches.
                const { TestRailApiError } = await import('../src/client.js');
                const spy = vi
                    .spyOn(client, 'request')
                    .mockRejectedValueOnce(new TestRailApiError(404, 'Not Found', { error: 'Invalid uri' }));
                try {
                    await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(
                        /TestRail server >= 7\.5/,
                    );
                } finally {
                    spy.mockRestore();
                }
            });

            it('handles a TestRailApiError with null response (nullish-coalesce fallback branch)', async () => {
                // Exercises the `e.response ?? ''` true branch (response is null).
                // The stringified empty fallback should not match the version
                // gate regex, so the original error propagates verbatim.
                const { TestRailApiError } = await import('../src/client.js');
                const spy = vi
                    .spyOn(client, 'request')
                    .mockRejectedValueOnce(new TestRailApiError(400, 'Bad Request', null));
                try {
                    await expect(client.cases.addCases(12, [{ title: 'C' }])).rejects.toThrow(
                        /TestRail API error: 400/,
                    );
                } finally {
                    spy.mockRestore();
                }
            });
        });

        describe('updateCases', () => {
            it('POSTs to update_cases/{suite_id} with the payload', async () => {
                mockFetch.mockResolvedValueOnce(mockOk([mockCase, { ...mockCase, id: 2 }]));
                const payload: UpdateCasesPayload = { case_ids: [1, 2], priority_id: 3 };
                const result = await client.cases.updateCases(5, payload);
                expect(result).toHaveLength(2);
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('update_cases/5'), expect.anything());
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(init.method).toBe('POST');
                expect(JSON.parse(init.body as string)).toEqual(payload);
            });

            it('rejects non-positive-integer suiteId', async () => {
                await expect(client.cases.updateCases(0, { case_ids: [1] })).rejects.toThrow(TestRailValidationError);
            });
        });

        describe('deleteCases', () => {
            it('POSTs to delete_cases/{suite_id}&project_id=X with the payload', async () => {
                mockFetch.mockResolvedValueOnce(mockEmpty());
                const payload: DeleteCasesPayload = { case_ids: [1, 2] };
                await client.cases.deleteCases(5, 9, payload);
                expect(mockFetch).toHaveBeenCalledTimes(1);
                const url = mockFetch.mock.calls[0]?.[0] as string;
                expect(url).toContain('delete_cases/5');
                expect(url).toContain('project_id=9');
                expect(url).not.toContain('soft=');
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(init.method).toBe('POST');
                expect(JSON.parse(init.body as string)).toEqual(payload);
            });

            it('returns preview payload and adds soft=1 when options.soft is true', async () => {
                const preview = { affected_tests: 3 };
                mockFetch.mockResolvedValueOnce(mockOk(preview));
                const result = await client.cases.deleteCases(5, 9, { case_ids: [1] }, { soft: true });
                const url = mockFetch.mock.calls[0]?.[0] as string;
                expect(url).toContain('soft=1');
                expect(result).toEqual(preview);
            });

            it('omits soft when options.soft is false', async () => {
                mockFetch.mockResolvedValueOnce(mockEmpty());
                await client.cases.deleteCases(5, 9, { case_ids: [1] }, { soft: false });
                const url = mockFetch.mock.calls[0]?.[0] as string;
                expect(url).not.toContain('soft=');
            });

            it('rejects non-positive-integer suiteId', async () => {
                await expect(client.cases.deleteCases(-1, 9, { case_ids: [1] })).rejects.toThrow(
                    TestRailValidationError,
                );
            });

            it('rejects non-positive-integer projectId', async () => {
                await expect(client.cases.deleteCases(5, 0, { case_ids: [1] })).rejects.toThrow(
                    TestRailValidationError,
                );
            });
        });

        describe('copyCasesToSection', () => {
            it('POSTs to copy_cases_to_section/{section_id} and returns Case[]', async () => {
                mockFetch.mockResolvedValueOnce(mockOk([mockCase]));
                const payload: CopyCasesToSectionPayload = { case_ids: [1] };
                const result = await client.cases.copyCasesToSection(7, payload);
                expect(result).toEqual([mockCase]);
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('copy_cases_to_section/7'),
                    expect.anything(),
                );
            });

            it('rejects non-positive-integer sectionId', async () => {
                await expect(client.cases.copyCasesToSection(0, { case_ids: [1] })).rejects.toThrow(
                    TestRailValidationError,
                );
            });
        });

        describe('moveCasesToSection', () => {
            it('POSTs to move_cases_to_section/{section_id} with case_ids + suite_id', async () => {
                mockFetch.mockResolvedValueOnce(mockEmpty());
                const payload: MoveCasesToSectionPayload = { case_ids: [1, 2], suite_id: 3 };
                await client.cases.moveCasesToSection(7, payload);
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('move_cases_to_section/7'),
                    expect.anything(),
                );
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(JSON.parse(init.body as string)).toEqual(payload);
            });

            it('rejects non-positive-integer sectionId', async () => {
                await expect(client.cases.moveCasesToSection(-1, { case_ids: [1], suite_id: 3 })).rejects.toThrow(
                    TestRailValidationError,
                );
            });
        });

        it('parses get_case response with the SPEC #2.1.3 labels[] array', async () => {
            // Inner shape per the documented `get_case` response example:
            //   { id, title, created_by, created_on }
            const caseWithLabels: Case = {
                id: 1,
                title: 'Print document history and attributes',
                section_id: 1,
                template_id: 1,
                type_id: 2,
                priority_id: 2,
                refs: 'RF-1, RF-2',
                created_by: 1,
                created_on: 1646058671,
                updated_by: 1,
                updated_on: 1646058671,
                suite_id: 1,
                labels: [
                    { id: 1, title: 'label1', created_by: 2, created_on: 1646058600 },
                    { id: 2, title: 'label2', created_by: 2, created_on: 1646058700 },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels).toHaveLength(2);
            expect(result.labels?.[0]?.id).toBe(1);
            expect(result.labels?.[0]?.title).toBe('label1');
            expect(result.labels?.[1]?.title).toBe('label2');
            expect(result).toEqual(caseWithLabels);
        });

        it('parses a get_case response with no labels[] key (older servers / cases without labels)', async () => {
            // Missing key (Zod `.nullish()` with absent input) → undefined, not null.
            const caseWithoutLabels: Case = {
                id: 1,
                title: 'No labels',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithoutLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels).toBeUndefined();
            expect(result).toEqual(caseWithoutLabels);
        });

        it('parses a get_case response with labels: null (TestRail emits null for unset)', async () => {
            const caseWithNullLabels = {
                id: 1,
                title: 'Null labels',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithNullLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels).toBeNull();
        });

        it('parses an empty labels[] array (case has no labels assigned)', async () => {
            const caseWithEmptyLabels: Case = {
                id: 1,
                title: 'Empty labels',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [],
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithEmptyLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels).toEqual([]);
        });

        it('parses labels[] inner objects with partial fields (only id and title)', async () => {
            // Older TestRail variants and the stand-alone Labels endpoints document
            // shapes without created_by / created_on. All inner fields are
            // `.nullish()`, so the parse should succeed regardless of which keys
            // the server emits.
            const caseWithPartialLabels: Case = {
                id: 1,
                title: 'Partial label fields',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [{ id: 1, title: 'minimal' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithPartialLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels?.[0]?.id).toBe(1);
            expect(result.labels?.[0]?.title).toBe('minimal');
            expect(result.labels?.[0]?.created_by).toBeUndefined();
            expect(result.labels?.[0]?.created_on).toBeUndefined();
        });

        it('parses labels[] inner objects that use `name` instead of `title` (stand-alone get_label shape)', async () => {
            // The `get_label` endpoint uses `name`; Case-embedded labels use `title`.
            // The inner schema accepts both so consumers can carry a label object
            // around without translating between the two field names.
            const caseWithNameLabels: Case = {
                id: 1,
                title: 'name-form labels',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [{ id: 1, name: 'Release 2.0' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithNameLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels?.[0]?.name).toBe('Release 2.0');
            expect(result.labels?.[0]?.title).toBeUndefined();
        });

        it('rejects labels when wire delivers a non-array value', async () => {
            const malformed = {
                id: 1,
                title: 'Bad labels',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: 'release-2.0',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.cases.getCase(1)).rejects.toThrow();
        });

        it('rejects a labels[] inner object where id is a string instead of a number (no coercion)', async () => {
            const malformed = {
                id: 1,
                title: 'Bad inner id',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [{ id: 'one', title: 'release' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.cases.getCase(1)).rejects.toThrow();
        });

        it('rejects a labels[] inner object that is missing id entirely', async () => {
            // `id` is required on `LabelEmbeddedSchema` — a label without it
            // is a malformed response and must not parse silently.
            const malformed = {
                id: 1,
                title: 'Missing inner id',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [{ title: 'no-id' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.cases.getCase(1)).rejects.toThrow();
        });

        it('parses labels[] carrying BOTH `title` and `name` simultaneously', async () => {
            // The schema accepts both fields for cross-endpoint compatibility.
            // Verify that when a wire response (or a hand-built fixture in
            // downstream tests) carries both keys, both survive on the parsed
            // result rather than one shadowing the other.
            const caseWithBothLabels: Case = {
                id: 1,
                title: 'Both fields',
                section_id: 1,
                created_by: 1,
                created_on: 1234567890,
                updated_by: 1,
                updated_on: 1234567890,
                suite_id: 1,
                labels: [{ id: 1, title: 'Release', name: 'release-2.0', created_by: 1, created_on: 1000 }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(caseWithBothLabels));
            const result = await client.cases.getCase(1);
            expect(result.labels?.[0]?.title).toBe('Release');
            expect(result.labels?.[0]?.name).toBe('release-2.0');
            expect(result.labels?.[0]?.created_by).toBe(1);
        });
    });

    describe('Plans', () => {
        it('should get plan by ID', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Test Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.getPlan(1);
            expect(result).toEqual(mockPlan);
        });

        it('should get all plans for a project', async () => {
            const mockPlans: Plan[] = [
                {
                    id: 1,
                    name: 'Plan 1',
                    is_completed: false,
                    passed_count: 0,
                    blocked_count: 0,
                    untested_count: 0,
                    retest_count: 0,
                    failed_count: 0,
                    project_id: 1,
                    created_on: 1234567890,
                    created_by: 1,
                    url: 'url',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ plans: mockPlans }));

            const result = await client.plans.getPlans(1);
            expect(result).toEqual(mockPlans);
        });

        it('should handle empty plans list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.plans.getPlans(1);
            expect(result).toEqual([]);
        });

        it('should get plans with limit and offset', async () => {
            const mockPlans: Plan[] = [
                {
                    id: 2,
                    name: 'Plan 2',
                    is_completed: false,
                    passed_count: 0,
                    blocked_count: 0,
                    untested_count: 0,
                    retest_count: 0,
                    failed_count: 0,
                    project_id: 1,
                    created_on: 1234567890,
                    created_by: 1,
                    url: 'url',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ plans: mockPlans }));

            const result = await client.plans.getPlans(1, { limit: 10, offset: 5 });
            expect(result).toEqual(mockPlans);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should get plans with only limit', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { limit: 20 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_plans/1&limit=20'), expect.any(Object));
        });

        it('should not include undefined limit/offset in URL', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('limit');
            expect(url).not.toContain('offset');
        });

        it('should get plans filtered by created_after and created_before', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { created_after: 1000000, created_before: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by created_by', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { created_by: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by is_completed', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should get plans filtered by milestone_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { milestone_id: [10, 20] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&milestone_id=10%2C20'),
                expect.any(Object),
            );
        });

        it('should omit empty array filters for getPlans', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));

            await client.plans.getPlans(1, { created_by: [], milestone_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('milestone_id=');
        });

        it('should accept camelCase createdAfter/createdBefore and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { createdAfter: 1000000, createdBefore: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should accept camelCase createdBy and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { createdBy: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should accept camelCase milestoneId and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { milestoneId: [10, 20] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&milestone_id=10%2C20'),
                expect.any(Object),
            );
        });

        it('should serialize isCompleted: true as is_completed=1', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { isCompleted: true });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should serialize isCompleted: false as is_completed=0', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { isCompleted: false });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=0'),
                expect.any(Object),
            );
        });

        it('should preserve deprecated is_completed=1 (snake_case still works)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should preserve deprecated is_completed=0 (snake_case zero still works)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { is_completed: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=0'),
                expect.any(Object),
            );
        });

        it('should give camelCase isCompleted priority over deprecated is_completed when both set', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { isCompleted: false, is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_plans/1&is_completed=0'),
                expect.any(Object),
            );
        });

        it('should omit empty array filters for getPlans with camelCase', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ plans: [] }));
            await client.plans.getPlans(1, { createdBy: [], milestoneId: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('milestone_id=');
        });

        it('should add a new plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'New Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            const payload: AddPlanPayload = {
                name: 'New Plan',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.addPlan(1, payload);
            expect(result).toEqual(mockPlan);
        });

        it('should close a plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Plan',
                is_completed: true,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.closePlan(1);
            expect(result).toEqual(mockPlan);
        });

        it('should delete a plan', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.plans.deletePlan(1);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should update a plan', async () => {
            const mockPlan: Plan = {
                id: 1,
                name: 'Updated Plan',
                description: 'Updated description',
                milestone_id: 2,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            const payload: UpdatePlanPayload = {
                name: 'Updated Plan',
                description: 'Updated description',
                milestone_id: 2,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.updatePlan(1, payload);
            expect(result).toEqual(mockPlan);
        });

        it('should throw validation error for invalid planId in updatePlan', async () => {
            await expect(client.plans.updatePlan(-1, { name: 'x' })).rejects.toThrow(
                'planId must be a positive integer',
            );
        });

        it('should propagate API error from updatePlan', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.updatePlan(1, { name: 'x' })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        // SPEC #2.1.6 — `add_plan` request body table lists `start_on` (timestamp, false)
        // and `due_on` (timestamp, false). Verify the typed payload reaches the wire.
        it('adds a plan with SPEC #2.1.6 fields (start_on, due_on)', async () => {
            const payload: AddPlanPayload = {
                name: 'Plan with dates',
                start_on: 1646058600,
                due_on: 1648650671,
            };
            const mockPlan: Plan = {
                id: 1,
                name: 'Plan with dates',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'url',
                start_on: 1646058600,
                due_on: 1648650671,
            };
            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.addPlan(1, payload);

            expect(result.start_on).toBe(1646058600);
            expect(result.due_on).toBe(1648650671);

            const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(init.body as string);
            expect(body).toMatchObject({
                name: 'Plan with dates',
                start_on: 1646058600,
                due_on: 1648650671,
            });
        });

        // SPEC #2.1.6 — `update_plan` "supports the same POST fields as `add_plan`"
        // (except `entries`), per the Plans API doc. So `start_on` / `due_on` are
        // valid on update_plan as well.
        it('updates a plan with SPEC #2.1.6 fields (start_on, due_on)', async () => {
            const payload: UpdatePlanPayload = {
                start_on: 1646058600,
                due_on: 1648650671,
            };
            const mockPlan: Plan = {
                id: 1,
                name: 'Updated Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'url',
                start_on: 1646058600,
                due_on: 1648650671,
            };
            mockFetch.mockResolvedValueOnce(mockOk(mockPlan));

            const result = await client.plans.updatePlan(1, payload);

            expect(result.start_on).toBe(1646058600);
            expect(result.due_on).toBe(1648650671);

            const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(init.body as string);
            expect(body).toMatchObject({
                start_on: 1646058600,
                due_on: 1648650671,
            });
        });

        it('parses get_plan response with all SPEC #2.1.6 fields (start_on, due_on, refs)', async () => {
            // Note: `custom_status*_count` fields are intentionally omitted — those are
            // covered by their own `.nullish()` happy/null cases elsewhere. This fixture
            // is scoped to SPEC #2.1.6 verification, hence the focused name.
            const planWithSpec216Fields: Plan = {
                id: 10,
                name: 'Release 1.0: Final (all browsers)',
                description: 'Release plan',
                milestone_id: 3,
                assignedto_id: 5,
                is_completed: false,
                completed_on: null,
                passed_count: 445,
                blocked_count: 99,
                untested_count: 473,
                retest_count: 107,
                failed_count: 56,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'https://example.testrail.io/index.php?/plans/view/10',
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-100, SAN-101',
            };
            mockFetch.mockResolvedValueOnce(mockOk(planWithSpec216Fields));
            const result = await client.plans.getPlan(10);
            // Field-specific assertions first so a single-field bug surfaces with a tight
            // error instead of a multi-page diff from toEqual on a deeply-populated plan.
            expect(result.start_on).toBe(1646058600);
            expect(result.due_on).toBe(1648650671);
            expect(result.refs).toBe('SAN-100, SAN-101');
            expect(result).toEqual(planWithSpec216Fields);
        });

        it('parses a pre-6.3 / unset plan response (all three SPEC #2.1.6 fields omitted)', async () => {
            // `refs` requires TestRail 6.3+; `start_on` / `due_on` emit only when set on
            // any version. Missing keys → undefined (not null) via `.nullish()`.
            const minimalPlan: Plan = {
                id: 1,
                name: 'Legacy Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };
            mockFetch.mockResolvedValueOnce(mockOk(minimalPlan));
            const result = await client.plans.getPlan(1);
            expect(result.start_on).toBeUndefined();
            expect(result.due_on).toBeUndefined();
            expect(result.refs).toBeUndefined();
            expect(result).toEqual(minimalPlan);
        });

        it('parses a plan response with all SPEC #2.1.6 fields explicitly null', async () => {
            const planWithNulls = {
                id: 1,
                name: 'Null-fields Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                start_on: null,
                due_on: null,
                refs: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(planWithNulls));
            const result = await client.plans.getPlan(1);
            expect(result.start_on).toBeNull();
            expect(result.due_on).toBeNull();
            expect(result.refs).toBeNull();
        });

        it('parses a partial-fields plan response with some SPEC #2.1.6 fields present, others omitted', async () => {
            const partial = {
                id: 1,
                name: 'Partial',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                refs: 'SAN-100',
                // start_on, due_on omitted
            };
            mockFetch.mockResolvedValueOnce(mockOk(partial));
            const result = await client.plans.getPlan(1);
            expect(result.refs).toBe('SAN-100');
            expect(result.start_on).toBeUndefined();
            expect(result.due_on).toBeUndefined();
        });

        // SPEC #2.1.6 — `start_on` and `due_on` are both `z.number().nullish()`, so wrong
        // types must be rejected symmetrically. Driven by `it.each` so a future field
        // addition (or schema slip) can't silently weaken one side of the pair.
        it.each([
            ['start_on', { start_on: '2026-05-22' }],
            ['due_on', { due_on: '2026-06-01' }],
            ['refs', { refs: 42 }],
        ])('rejects plan response when %s has the wrong type', async (_field, badField) => {
            const malformed = {
                id: 1,
                name: 'Bad Plan',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                ...badField,
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.plans.getPlan(1)).rejects.toThrow();
        });

        it('parses get_plan response with entries[] carrying SPEC #2.1.6 fields on each PlanEntry', async () => {
            // PlanEntry.start_on / due_on are documented as add_plan_entry / update_plan_entry
            // request fields; refs is visible in the documented entries[] response example.
            // TestRail echoes start_on / due_on on the response when set. Defensive .nullish().
            const planWithRichEntries: Plan = {
                id: 10,
                name: 'Plan with entries',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'url',
                entries: [
                    {
                        id: '75698796-61d5-46e8-9c14-d334351f12d0',
                        suite_id: 1,
                        name: 'Browser test',
                        description: null,
                        include_all: true,
                        runs: [],
                        start_on: 1646058600,
                        due_on: 1648650671,
                        refs: 'SAN-100',
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(planWithRichEntries));
            const result = await client.plans.getPlan(10);
            expect(result.entries?.[0]?.start_on).toBe(1646058600);
            expect(result.entries?.[0]?.due_on).toBe(1648650671);
            expect(result.entries?.[0]?.refs).toBe('SAN-100');
            expect(result).toEqual(planWithRichEntries);
        });

        it('parses a PlanEntry with all SPEC #2.1.6 fields explicitly null', async () => {
            const planWithNullEntryFields: Plan = {
                id: 11,
                name: 'Plan with null entry fields',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'url',
                entries: [
                    {
                        id: 'entry-guid-null',
                        suite_id: 1,
                        name: 'Null-fields entry',
                        include_all: true,
                        runs: [],
                        start_on: null,
                        due_on: null,
                        refs: null,
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(planWithNullEntryFields));
            const result = await client.plans.getPlan(11);
            expect(result.entries?.[0]?.start_on).toBeNull();
            expect(result.entries?.[0]?.due_on).toBeNull();
            expect(result.entries?.[0]?.refs).toBeNull();
        });

        // SPEC #2.1.6 — symmetric wrong-type rejection at the PlanEntry level. `start_on`
        // and `due_on` are both `z.number().nullish()` on PlanEntrySchema; `refs` is
        // `z.string().nullish()`. Driven by `it.each` so any future entry-level field
        // gets coverage parity by default.
        it.each([
            ['start_on', { start_on: '2026-05-22' }],
            ['due_on', { due_on: '2026-06-01' }],
            ['refs', { refs: 42 }],
        ])('rejects a PlanEntry where %s has the wrong type', async (_field, badField) => {
            const malformed = {
                id: 12,
                name: 'Bad entry',
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1646058671,
                created_by: 1,
                url: 'url',
                entries: [
                    {
                        id: 'entry-bad',
                        suite_id: 1,
                        name: 'Bad entry',
                        include_all: true,
                        runs: [],
                        ...badField,
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.plans.getPlan(12)).rejects.toThrow();
        });
    });

    describe('Plan Entries', () => {
        const mockEntry: PlanEntry = {
            id: 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56',
            suite_id: 2,
            name: 'Entry',
            include_all: true,
            runs: [],
        };

        it('should add a plan entry', async () => {
            const payload: AddPlanEntryPayload = { suite_id: 2 };
            mockFetch.mockResolvedValueOnce(mockOk(mockEntry));

            const result = await client.plans.addPlanEntry(1, payload);
            expect(result).toEqual(mockEntry);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_plan_entry/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        // SPEC #2.1.6 — Regression guard. `mockEntry` predates the SPEC #2.1.6 fields and
        // intentionally omits them; the schema must still accept this shape. Catches a
        // potential regression where someone tightens a SPEC field from `.nullish()` to
        // required without realising it would break legacy fixtures.
        it('accepts a PlanEntry response without SPEC #2.1.6 fields (legacy / pre-set)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockEntry));
            const result = await client.plans.addPlanEntry(1, { suite_id: 2 });
            expect(result.start_on).toBeUndefined();
            expect(result.due_on).toBeUndefined();
            expect(result.refs).toBeUndefined();
        });

        // SPEC #2.1.6 — write-side coverage: verify a payload carrying the new fields
        // round-trips through the client (POST body serialised, response parsed) and
        // that the fields appear in the JSON body sent to fetch.
        it('adds a plan entry with SPEC #2.1.6 fields (start_on, due_on, refs)', async () => {
            const payload: AddPlanEntryPayload = {
                suite_id: 2,
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-100',
            };
            const responseEntry: PlanEntry = {
                ...mockEntry,
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-100',
            };
            mockFetch.mockResolvedValueOnce(mockOk(responseEntry));

            const result = await client.plans.addPlanEntry(1, payload);

            expect(result.start_on).toBe(1646058600);
            expect(result.due_on).toBe(1648650671);
            expect(result.refs).toBe('SAN-100');

            const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(init.body as string);
            expect(body).toMatchObject({
                suite_id: 2,
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-100',
            });
        });

        it('should throw validation error for invalid planId in addPlanEntry', async () => {
            await expect(client.plans.addPlanEntry(-1, { suite_id: 2 })).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from addPlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.addPlanEntry(1, { suite_id: 2 })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should update a plan entry', async () => {
            const payload: UpdatePlanEntryPayload = { name: 'Updated Entry' };
            mockFetch.mockResolvedValueOnce(mockOk(mockEntry));

            const result = await client.plans.updatePlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', payload);
            expect(result).toEqual(mockEntry);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_plan_entry/1/e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        // SPEC #2.1.6 — write-side coverage mirroring the addPlanEntry case above.
        it('updates a plan entry with SPEC #2.1.6 fields (start_on, due_on, refs)', async () => {
            const payload: UpdatePlanEntryPayload = {
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-200',
            };
            const responseEntry: PlanEntry = {
                ...mockEntry,
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-200',
            };
            mockFetch.mockResolvedValueOnce(mockOk(responseEntry));

            const result = await client.plans.updatePlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', payload);

            expect(result.start_on).toBe(1646058600);
            expect(result.due_on).toBe(1648650671);
            expect(result.refs).toBe('SAN-200');

            const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
            const body = JSON.parse(init.body as string);
            expect(body).toMatchObject({
                start_on: 1646058600,
                due_on: 1648650671,
                refs: 'SAN-200',
            });
        });

        it('should throw validation error for invalid planId in updatePlanEntry', async () => {
            await expect(client.plans.updatePlanEntry(0, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', {})).rejects.toThrow(
                TestRailValidationError,
            );
        });

        it('should throw validation error for empty entryId in updatePlanEntry', async () => {
            await expect(client.plans.updatePlanEntry(1, '', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for whitespace-only entryId in updatePlanEntry', async () => {
            await expect(client.plans.updatePlanEntry(1, '   ', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for non-UUID entryId in updatePlanEntry (SEC #29)', async () => {
            await expect(client.plans.updatePlanEntry(1, 'not-a-uuid', {})).rejects.toThrow(TestRailValidationError);
            await expect(client.plans.updatePlanEntry(1, '../../admin', {})).rejects.toThrow(TestRailValidationError);
            await expect(client.plans.updatePlanEntry(1, 'entry-guid-1', {})).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from updatePlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.updatePlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', {})).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should delete a plan entry', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.plans.deletePlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_plan_entry/1/e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid planId in deletePlanEntry', async () => {
            await expect(client.plans.deletePlanEntry(0, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56')).rejects.toThrow(
                TestRailValidationError,
            );
        });

        it('should throw validation error for empty entryId in deletePlanEntry', async () => {
            await expect(client.plans.deletePlanEntry(1, '')).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for whitespace-only entryId in deletePlanEntry', async () => {
            await expect(client.plans.deletePlanEntry(1, '   ')).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for non-UUID entryId in deletePlanEntry (SEC #29)', async () => {
            await expect(client.plans.deletePlanEntry(1, '../../etc/passwd')).rejects.toThrow(TestRailValidationError);
            await expect(client.plans.deletePlanEntry(1, 'entry-guid-1')).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from deletePlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.deletePlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56')).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });
    });

    describe('Plan Entry Runs', () => {
        const mockRun: Run = {
            id: 5,
            suite_id: 2,
            name: 'Plan Entry Run',
            include_all: true,
            is_completed: false,
            passed_count: 0,
            blocked_count: 0,
            untested_count: 0,
            retest_count: 0,
            failed_count: 0,
            project_id: 1,
            created_on: 1234567890,
            created_by: 1,
            url: 'url',
        };

        it('should add a run to a plan entry', async () => {
            const payload: AddRunToPlanEntryPayload = { config_ids: [1, 2], description: 'Smoke' };
            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.plans.addRunToPlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', payload);
            expect(result).toEqual(mockRun);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_run_to_plan_entry/1/e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid planId in addRunToPlanEntry', async () => {
            await expect(
                client.plans.addRunToPlanEntry(-1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', { config_ids: [1] }),
            ).rejects.toThrow(TestRailValidationError);
        });

        it('should throw validation error for empty entryId in addRunToPlanEntry', async () => {
            await expect(client.plans.addRunToPlanEntry(1, '', { config_ids: [1] })).rejects.toThrow(
                TestRailValidationError,
            );
        });

        it('should throw validation error for whitespace-only entryId in addRunToPlanEntry', async () => {
            await expect(client.plans.addRunToPlanEntry(1, '   ', { config_ids: [1] })).rejects.toThrow(
                TestRailValidationError,
            );
        });

        it('should throw validation error for non-UUID entryId in addRunToPlanEntry (SEC #29)', async () => {
            await expect(client.plans.addRunToPlanEntry(1, 'not-a-uuid', { config_ids: [1] })).rejects.toThrow(
                TestRailValidationError,
            );
        });

        it('should propagate API error from addRunToPlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(
                client.plans.addRunToPlanEntry(1, 'e3c55bbb-1f02-4d4f-b38b-5a0eac3d7b56', { config_ids: [1] }),
            ).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should update a run in a plan entry', async () => {
            const payload: UpdateRunInPlanEntryPayload = { description: 'Updated' };
            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.plans.updateRunInPlanEntry(5, payload);
            expect(result).toEqual(mockRun);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_run_in_plan_entry/5'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid runId in updateRunInPlanEntry', async () => {
            await expect(client.plans.updateRunInPlanEntry(0, {})).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from updateRunInPlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.updateRunInPlanEntry(5, {})).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should delete a run from a plan entry', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.plans.deleteRunFromPlanEntry(5);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_run_from_plan_entry/5'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid runId in deleteRunFromPlanEntry', async () => {
            await expect(client.plans.deleteRunFromPlanEntry(-1)).rejects.toThrow(TestRailValidationError);
        });

        it('should propagate API error from deleteRunFromPlanEntry', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.plans.deleteRunFromPlanEntry(5)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Runs', () => {
        it('should get run by ID', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Test Run',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.runs.getRun(1);
            expect(result).toEqual(mockRun);
        });

        it('should get all runs for a project', async () => {
            const mockRuns: Run[] = [
                {
                    id: 1,
                    suite_id: 1,
                    name: 'Run 1',
                    include_all: true,
                    is_completed: false,
                    passed_count: 0,
                    blocked_count: 0,
                    untested_count: 0,
                    retest_count: 0,
                    failed_count: 0,
                    project_id: 1,
                    created_on: 1234567890,
                    created_by: 1,
                    url: 'url',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ runs: mockRuns }));

            const result = await client.runs.getRuns(1);
            expect(result).toEqual(mockRuns);
        });

        it('should handle empty runs list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.runs.getRuns(1);
            expect(result).toEqual([]);
        });

        it('should pass isCompleted=true filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            const options: GetRunsOptions = { isCompleted: true };
            await client.runs.getRuns(1, options);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('is_completed=1'), expect.anything());
        });

        it('should pass isCompleted=false filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { isCompleted: false });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('is_completed=0'), expect.anything());
        });

        it('should pass milestoneId filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { milestoneId: 5 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('milestone_id=5'), expect.anything());
        });

        it('should pass suiteId filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { suiteId: 3 });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('suite_id=3'), expect.anything());
        });

        it('should pass createdAfter and createdBefore filters', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { createdAfter: 1700000000, createdBefore: 1700086400 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(
                    /created_after=1700000000.*created_before=1700086400|created_before=1700086400.*created_after=1700000000/,
                ),
                expect.anything(),
            );
        });

        it('should pass createdBy filter as comma-separated list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { createdBy: [1, 2, 3] });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('created_by=1%2C2%2C3'), expect.anything());
        });

        it('should omit createdBy when empty array is provided', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { createdBy: [] });
            // Assert single-call count first so a false-positive cannot arise from
            // an extra fetch that happens to lack the substring; then assert the
            // single call's URL omits the param.
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
            expect(calledUrl).not.toContain('created_by=');
        });

        it('should pass refsFilter filter', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { refsFilter: 'TR-42' });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('refs_filter=TR-42'), expect.anything());
        });

        it('should pass limit and offset via options', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { limit: 10, offset: 20 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(/limit=10.*offset=20|offset=20.*limit=10/),
                expect.anything(),
            );
        });

        it('should omit undefined filter params from URL', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ runs: [] }));

            await client.runs.getRuns(1, { suiteId: 2 });
            // Pin call count to 1 so the omission assertions cannot pass
            // vacuously by matching some other fetch call.
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
            expect(calledUrl).not.toContain('is_completed');
            expect(calledUrl).not.toContain('milestone_id');
            expect(calledUrl).not.toContain('created_after');
        });

        it('should throw validation error for invalid projectId in getRuns', async () => {
            await expect(client.runs.getRuns(0)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should throw validation error for invalid limit in getRuns', async () => {
            await expect(client.runs.getRuns(1, { limit: -1 })).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw validation error for invalid suiteId in getRuns', async () => {
            await expect(client.runs.getRuns(1, { suiteId: 0 })).rejects.toThrow('suiteId must be a positive integer');
        });

        it('should throw validation error for invalid milestoneId in getRuns', async () => {
            await expect(client.runs.getRuns(1, { milestoneId: 0 })).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should throw validation error for invalid createdBy item in getRuns', async () => {
            await expect(client.runs.getRuns(1, { createdBy: [1, 0] })).rejects.toThrow(
                'createdBy must be a positive integer',
            );
        });

        it('should add a new run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'New Run',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            const payload: AddRunPayload = {
                name: 'New Run',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.runs.addRun(1, payload);
            expect(result).toEqual(mockRun);
        });

        it('should close a run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Run',
                include_all: true,
                is_completed: true,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.runs.closeRun(1);
            expect(result).toEqual(mockRun);
        });

        it('should delete a run', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await client.runs.deleteRun(1);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should update a run', async () => {
            const mockRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Updated Run',
                description: 'Updated description',
                include_all: false,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };

            const payload: UpdateRunPayload = {
                name: 'Updated Run',
                description: 'Updated description',
                include_all: false,
                case_ids: [1, 2, 3],
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockRun));

            const result = await client.runs.updateRun(1, payload);
            expect(result).toEqual(mockRun);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_run/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw on invalid runId for updateRun', async () => {
            await expect(client.runs.updateRun(0, {})).rejects.toThrow('runId must be a positive integer');
            await expect(client.runs.updateRun(-1, {})).rejects.toThrow('runId must be a positive integer');
            await expect(client.runs.updateRun(1.5, {})).rejects.toThrow('runId must be a positive integer');
        });

        it('should propagate API error from updateRun', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));

            await expect(client.runs.updateRun(1, { name: 'Run' })).rejects.toThrow();
        });

        it('parses get_run response with all SPEC #2.1.5 timestamp fields (start_on, due_on, updated_on)', async () => {
            const fullRun: Run = {
                id: 81,
                suite_id: 4,
                name: 'File Formats',
                include_all: false,
                is_completed: false,
                passed_count: 2,
                blocked_count: 0,
                untested_count: 3,
                retest_count: 1,
                failed_count: 2,
                project_id: 1,
                plan_id: 80,
                milestone_id: 7,
                created_on: 1393845644,
                created_by: 1,
                url: 'http://example.testrail.io/index.php?/runs/view/81',
                refs: 'SAN-1',
                start_on: 1393845000,
                due_on: 1393932044,
                updated_on: 1393900000,
            };
            mockFetch.mockResolvedValueOnce(mockOk(fullRun));
            const result = await client.runs.getRun(81);
            // Field-specific assertions first so a single-field bug surfaces with a tight
            // error instead of a multi-page diff from toEqual on the deeply-populated run.
            expect(result.start_on).toBe(1393845000);
            expect(result.due_on).toBe(1393932044);
            expect(result.updated_on).toBe(1393900000);
            expect(result).toEqual(fullRun);
        });

        it('parses a run-inside-plan-entry response with entry_id (GUID) and entry_index', async () => {
            // `entry_id` / `entry_index` are not documented on the `get_run` response in
            // the current TestRail API reference; they appear when this Run object is
            // returned inside `get_plan` entries. `entry_id` matches `PlanEntry.id` (a
            // string GUID); `entry_index` is the run's index within that entry. Schema
            // must accept both whether they appear standalone or alongside the other
            // SPEC #2.1.5 fields.
            const planEntryRun: Run = {
                id: 81,
                suite_id: 4,
                name: 'File Formats — Firefox',
                include_all: false,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 5,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                plan_id: 80,
                created_on: 1393845644,
                created_by: 1,
                url: 'http://example.testrail.io/index.php?/runs/view/81',
                entry_id: '3933d74b-4282-43a2-9f1a-d72a85b4c2a3',
                entry_index: 0,
            };
            mockFetch.mockResolvedValueOnce(mockOk(planEntryRun));
            const result = await client.runs.getRun(81);
            expect(result.entry_id).toBe('3933d74b-4282-43a2-9f1a-d72a85b4c2a3');
            expect(result.entry_index).toBe(0);
            expect(result).toEqual(planEntryRun);
        });

        it('parses a standalone run response without any SPEC #2.1.5 fields', async () => {
            // Older TestRail servers (<6.5.2 for updated_on) and standalone runs not part
            // of a plan entry omit every new field. Missing keys (Zod `.nullish()` with
            // absent input) resolve to `undefined`, not `null`.
            const minimalRun: Run = {
                id: 1,
                suite_id: 1,
                name: 'Standalone',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
            };
            mockFetch.mockResolvedValueOnce(mockOk(minimalRun));
            const result = await client.runs.getRun(1);
            expect(result.start_on).toBeUndefined();
            expect(result.due_on).toBeUndefined();
            expect(result.updated_on).toBeUndefined();
            expect(result.entry_id).toBeUndefined();
            expect(result.entry_index).toBeUndefined();
            expect(result).toEqual(minimalRun);
        });

        it('parses a run response with all SPEC #2.1.5 fields explicitly null', async () => {
            const runWithNulls = {
                id: 1,
                suite_id: 1,
                name: 'Null-fields',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                start_on: null,
                due_on: null,
                updated_on: null,
                entry_id: null,
                entry_index: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(runWithNulls));
            const result = await client.runs.getRun(1);
            expect(result.start_on).toBeNull();
            expect(result.due_on).toBeNull();
            expect(result.updated_on).toBeNull();
            expect(result.entry_id).toBeNull();
            expect(result.entry_index).toBeNull();
        });

        it('parses a partial-fields response with some SPEC #2.1.5 fields present, others omitted', async () => {
            // Defensive-design cross-product: `.nullish()` per-field must accept any
            // combination of present/absent independently. Regressions to `.optional()`
            // (no null) or `.nullable()` (no missing key) would fail here.
            const partial = {
                id: 1,
                suite_id: 1,
                name: 'Partial',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                start_on: 1393845000,
                entry_index: 2,
                // due_on, updated_on, entry_id omitted
            };
            mockFetch.mockResolvedValueOnce(mockOk(partial));
            const result = await client.runs.getRun(1);
            expect(result.start_on).toBe(1393845000);
            expect(result.entry_index).toBe(2);
            expect(result.due_on).toBeUndefined();
            expect(result.updated_on).toBeUndefined();
            expect(result.entry_id).toBeUndefined();
        });

        it('rejects entry_id when wire delivers a number instead of a GUID string (no coercion)', async () => {
            const malformed = {
                id: 1,
                suite_id: 1,
                name: 'Bad',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                entry_id: 42,
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.runs.getRun(1)).rejects.toThrow();
        });

        it('rejects entry_index when wire delivers a string instead of a number (no coercion)', async () => {
            const malformed = {
                id: 1,
                suite_id: 1,
                name: 'Bad',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                entry_index: '0',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.runs.getRun(1)).rejects.toThrow();
        });

        it('rejects start_on when wire delivers an ISO date string instead of a numeric Unix timestamp', async () => {
            // TestRail emits Unix integers, not ISO strings. Zod must NOT coerce.
            const malformed = {
                id: 1,
                suite_id: 1,
                name: 'Bad',
                include_all: true,
                is_completed: false,
                passed_count: 0,
                blocked_count: 0,
                untested_count: 0,
                retest_count: 0,
                failed_count: 0,
                project_id: 1,
                created_on: 1234567890,
                created_by: 1,
                url: 'url',
                start_on: '2026-05-22T10:00:00Z',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.runs.getRun(1)).rejects.toThrow();
        });
    });

    describe('Tests', () => {
        it('should get test by ID', async () => {
            const mockTest: Test = {
                id: 1,
                case_id: 1,
                status_id: 1,
                run_id: 1,
                title: 'Test',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockTest));

            const result = await client.tests.getTest(1);
            expect(result).toEqual(mockTest);
        });

        it('should get all tests for a run', async () => {
            const mockTests: Test[] = [
                {
                    id: 1,
                    case_id: 1,
                    status_id: 1,
                    run_id: 1,
                    title: 'Test 1',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ tests: mockTests }));

            const result = await client.tests.getTests(1);
            expect(result).toEqual(mockTests);
        });

        it('should handle empty tests list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.tests.getTests(1);
            expect(result).toEqual([]);
        });

        it('should get tests filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.tests.getTests(1, { status_id: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should get tests with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.tests.getTests(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getTests', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.tests.getTests(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id');
            expect(url).not.toContain('limit');
        });

        it('should omit empty status_id filter for getTests', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));

            await client.tests.getTests(1, { status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id=');
        });

        it('should accept camelCase statusId and produce same URL as snake_case for getTests', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));
            await client.tests.getTests(1, { statusId: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should preserve deprecated status_id for getTests (snake_case still works)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));
            await client.tests.getTests(1, { status_id: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_tests/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should omit empty statusId filter for getTests (camelCase)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ tests: [] }));
            await client.tests.getTests(1, { statusId: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id=');
        });

        it('parses get_test response with the SPEC #2.1.7 labels[] array (id + title shape)', async () => {
            // Inner shape per the documented `get_test` example: `{ id, title }`.
            const testWithLabels: Test = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Verify line spacing on multi-page document',
                priority_id: 2,
                type_id: 4,
                labels: [
                    { id: 1, title: 'label1' },
                    { id: 2, title: 'label2' },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(testWithLabels));
            const result = await client.tests.getTest(100);
            expect(result.labels).toHaveLength(2);
            expect(result.labels?.[0]?.id).toBe(1);
            expect(result.labels?.[0]?.title).toBe('label1');
            expect(result.labels?.[1]?.title).toBe('label2');
            expect(result).toEqual(testWithLabels);
        });

        it('parses a get_test response with no labels[] key (older servers / tests without labels)', async () => {
            const testWithoutLabels: Test = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'No labels',
            };
            mockFetch.mockResolvedValueOnce(mockOk(testWithoutLabels));
            const result = await client.tests.getTest(100);
            expect(result.labels).toBeUndefined();
            expect(result).toEqual(testWithoutLabels);
        });

        it('parses a get_test response with labels: null', async () => {
            const testWithNullLabels = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Null labels',
                labels: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(testWithNullLabels));
            const result = await client.tests.getTest(100);
            expect(result.labels).toBeNull();
        });

        it('parses an empty labels[] array (test has no labels assigned)', async () => {
            const testWithEmptyLabels: Test = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Empty labels',
                labels: [],
            };
            mockFetch.mockResolvedValueOnce(mockOk(testWithEmptyLabels));
            const result = await client.tests.getTest(100);
            expect(result.labels).toEqual([]);
        });

        it('parses labels[] carrying the richer Case-embedded fields (created_by / created_on)', async () => {
            // Mirroring CaseSchema.labels: even though the documented get_test
            // example only emits { id, title }, the inner schema accepts the
            // richer Case-embedded shape so callers carrying a Label object
            // between Case and Test endpoints don't lose typing.
            const testWithRichLabels: Test = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Rich labels',
                labels: [{ id: 1, title: 'label1', created_by: 2, created_on: 1646058600 }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(testWithRichLabels));
            const result = await client.tests.getTest(100);
            expect(result.labels?.[0]?.created_by).toBe(2);
            expect(result.labels?.[0]?.created_on).toBe(1646058600);
        });

        it('rejects labels when wire delivers a non-array value', async () => {
            const malformed = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Bad labels',
                labels: 'release-2.0',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.tests.getTest(100)).rejects.toThrow();
        });

        it('rejects a labels[] inner object where id is a string instead of a number (no coercion)', async () => {
            const malformed = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Bad inner id',
                labels: [{ id: 'one', title: 'release' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.tests.getTest(100)).rejects.toThrow();
        });

        it('rejects a labels[] inner object that is missing id entirely', async () => {
            // `id` is required on the inner label shape — a label without it
            // is a malformed response and must not parse silently.
            const malformed = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Missing inner id',
                labels: [{ title: 'no-id' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.tests.getTest(100)).rejects.toThrow();
        });

        it('rejects a labels[] inner object where created_by is a string instead of a number (no coercion)', async () => {
            // Comment specifically calls out `created_by` as a meaningful inner
            // field; the schema must not coerce string → number.
            const malformed = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Bad inner created_by',
                labels: [{ id: 1, title: 'release', created_by: 'alice' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.tests.getTest(100)).rejects.toThrow();
        });

        it('rejects a labels[] inner object where created_on is an ISO date string', async () => {
            // TestRail emits Unix integers for timestamps; ISO strings must be
            // rejected rather than parsed as opaque strings.
            const malformed = {
                id: 100,
                case_id: 1,
                status_id: 5,
                run_id: 1,
                title: 'Bad inner created_on',
                labels: [{ id: 1, title: 'release', created_on: '2024-01-01' }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.tests.getTest(100)).rejects.toThrow();
        });
    });

    describe('Results', () => {
        it('should get results for a test', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.results.getResults(1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.results.getResults(1);
            expect(result).toEqual([]);
        });

        it('should treat null results list as empty', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: null }));

            const result = await client.results.getResults(1);
            expect(result).toEqual([]);
        });

        it('should get results for a case', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.results.getResultsForCase(1, 1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results for case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.results.getResultsForCase(1, 1);
            expect(result).toEqual([]);
        });

        it('should get results for a run', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ results: mockResults }));

            const result = await client.results.getResultsForRun(1);
            expect(result).toEqual(mockResults);
        });

        it('should handle empty results for run', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.results.getResultsForRun(1);
            expect(result).toEqual([]);
        });

        it('should get results filtered by created_after and created_before', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1, { created_after: 1000000, created_before: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should get results filtered by created_by', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1, { created_by: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get results filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1, { status_id: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should get results with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should get results for case filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForCase(1, 2, { status_id: [1] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_case/1/2&status_id=1'),
                expect.any(Object),
            );
        });

        it('should get results for case with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForCase(1, 2, { limit: 5, offset: 10 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_case/1/2&limit=5&offset=10'),
                expect.any(Object),
            );
        });

        it('should get results for run filtered by status_id', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForRun(1, { status_id: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_run/1&status_id=1%2C2'),
                expect.any(Object),
            );
        });

        it('should get results for run with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForRun(1, { limit: 20, offset: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_run/1&limit=20&offset=0'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getResults', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('status_id');
            expect(url).not.toContain('created_after');
            expect(url).not.toContain('limit');
        });

        it('should omit empty array filters for getResults', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResults(1, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should omit empty array filters for getResultsForCase', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForCase(1, 2, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should omit empty array filters for getResultsForRun', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));

            await client.results.getResultsForRun(1, { created_by: [], status_id: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should accept camelCase createdAfter/createdBefore for getResults and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, { createdAfter: 1000000, createdBefore: 2000000 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_after=1000000&created_before=2000000'),
                expect.any(Object),
            );
        });

        it('should accept camelCase createdBy for getResults and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, { createdBy: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&created_by=1%2C2'),
                expect.any(Object),
            );
        });

        it('should accept camelCase statusId for getResults and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, { statusId: [1, 5] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&status_id=1%2C5'),
                expect.any(Object),
            );
        });

        it('should accept camelCase defectsFilter for getResults and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, { defectsFilter: 'JIRA-123' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results/1&defects_filter=JIRA-123'),
                expect.any(Object),
            );
        });

        it('should preserve deprecated snake_case keys for getResults', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, {
                created_after: 1000000,
                created_before: 2000000,
                created_by: [1],
                status_id: [1],
                defects_filter: 'JIRA-1',
            });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(
                    'get_results/1&created_after=1000000&created_before=2000000&created_by=1&status_id=1&defects_filter=JIRA-1',
                ),
                expect.any(Object),
            );
        });

        it('should accept camelCase statusId for getResultsForCase and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResultsForCase(1, 2, { statusId: [1] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_case/1/2&status_id=1'),
                expect.any(Object),
            );
        });

        it('should accept camelCase statusId for getResultsForRun and produce same URL as snake_case', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResultsForRun(1, { statusId: [1, 2] });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_results_for_run/1&status_id=1%2C2'),
                expect.any(Object),
            );
        });

        it('should omit empty array filters for getResults with camelCase', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ results: [] }));
            await client.results.getResults(1, { createdBy: [], statusId: [] });
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('created_by=');
            expect(url).not.toContain('status_id=');
        });

        it('should add a result for a test', async () => {
            const mockResult: Result = {
                id: 1,
                test_id: 1,
                status_id: 1,
                comment: 'Test passed',
            };

            const payload: AddResultPayload = {
                status_id: 1,
                comment: 'Test passed',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResult));

            const result = await client.results.addResult(1, payload);
            expect(result).toEqual(mockResult);
        });

        it('should add a result for a case', async () => {
            const mockResult: Result = {
                id: 1,
                test_id: 1,
                status_id: 1,
            };

            const payload: AddResultPayload = {
                status_id: 1,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResult));

            const result = await client.results.addResultForCase(1, 1, payload);
            expect(result).toEqual(mockResult);
        });

        it('should add multiple results for cases', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 1,
                    status_id: 1,
                },
            ];

            const payload: AddResultsForCasesPayload = {
                results: [
                    {
                        case_id: 1,
                        status_id: 1,
                    },
                ],
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResults));

            const result = await client.results.addResultsForCases(1, payload);
            expect(result).toEqual(mockResults);
        });

        it('should add multiple results by test_id', async () => {
            const mockResults: Result[] = [
                {
                    id: 1,
                    test_id: 42,
                    status_id: 1,
                },
            ];

            const payload: AddResultsPayload = {
                results: [
                    {
                        test_id: 42,
                        status_id: 1,
                        comment: 'passed',
                    },
                ],
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockResults));

            const result = await client.results.addResults(7, payload);
            expect(result).toEqual(mockResults);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_results/7'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should reject invalid run ID for addResults', async () => {
            await expect(client.results.addResults(0, { results: [] })).rejects.toThrow(TestRailValidationError);
        });
    });

    describe('Milestones', () => {
        it('should get milestone by ID', async () => {
            const mockMilestone: Milestone = {
                id: 1,
                name: 'Milestone',
                is_completed: false,
                project_id: 1,
                url: 'url',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.milestones.getMilestone(1);
            expect(result).toEqual(mockMilestone);
        });

        it('should get all milestones for a project', async () => {
            const mockMilestones: Milestone[] = [
                {
                    id: 1,
                    name: 'Milestone 1',
                    is_completed: false,
                    project_id: 1,
                    url: 'url',
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk({ milestones: mockMilestones }));

            const result = await client.milestones.getMilestones(1);
            expect(result).toEqual(mockMilestones);
        });

        it('should handle empty milestones list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));

            const result = await client.milestones.getMilestones(1);
            expect(result).toEqual([]);
        });

        it('should get milestones filtered by is_completed', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.milestones.getMilestones(1, { is_completed: 1 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should serialize isCompleted: true as is_completed=1', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.milestones.getMilestones(1, { isCompleted: true });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&is_completed=1'),
                expect.any(Object),
            );
        });

        it('should preserve deprecated is_completed=0 for getMilestones (snake_case zero still works)', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.milestones.getMilestones(1, { is_completed: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&is_completed=0'),
                expect.any(Object),
            );
        });

        it('should get milestones with limit and offset', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.milestones.getMilestones(1, { limit: 10, offset: 5 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_milestones/1&limit=10&offset=5'),
                expect.any(Object),
            );
        });

        it('should not include undefined filters in URL for getMilestones', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ milestones: [] }));

            await client.milestones.getMilestones(1);
            const [[url]] = mockFetch.mock.calls as [[string, unknown]];
            expect(url).not.toContain('is_completed');
            expect(url).not.toContain('limit');
        });

        it('should add a milestone', async () => {
            const mockMilestone: Milestone = {
                id: 5,
                name: 'v1.0 Release',
                description: 'First stable release',
                is_completed: false,
                project_id: 1,
                url: 'url5',
            };
            const payload: AddMilestonePayload = {
                name: 'v1.0 Release',
                description: 'First stable release',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.milestones.addMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should add a milestone with all optional fields', async () => {
            const mockMilestone: Milestone = {
                id: 6,
                name: 'v2.0 Release',
                description: 'Second release',
                due_on: 1700000000,
                start_on: 1699000000,
                parent_id: 2,
                refs: 'TR-42',
                is_completed: false,
                project_id: 1,
                url: 'url6',
            };
            const payload: AddMilestonePayload = {
                name: 'v2.0 Release',
                description: 'Second release',
                due_on: 1700000000,
                start_on: 1699000000,
                parent_id: 2,
                refs: 'TR-42',
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.milestones.addMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
        });

        it('should throw validation error for invalid projectId in addMilestone', async () => {
            await expect(client.milestones.addMilestone(0, { name: 'v1.0' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should propagate API error from addMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.milestones.addMilestone(1, { name: 'v1.0' })).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should update a milestone', async () => {
            const mockMilestone: Milestone = {
                id: 1,
                name: 'Updated Milestone',
                description: 'Updated description',
                is_completed: true,
                project_id: 1,
                url: 'url1',
            };
            const payload: UpdateMilestonePayload = {
                name: 'Updated Milestone',
                description: 'Updated description',
                is_completed: true,
            };

            mockFetch.mockResolvedValueOnce(mockOk(mockMilestone));

            const result = await client.milestones.updateMilestone(1, payload);
            expect(result).toEqual(mockMilestone);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid milestoneId in updateMilestone', async () => {
            await expect(client.milestones.updateMilestone(-1, { name: 'x' })).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should propagate API error from updateMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'Milestone not found'));

            await expect(client.milestones.updateMilestone(1, { name: 'x' })).rejects.toThrow(
                'TestRail API error: 404 Not Found',
            );
        });

        it('should delete a milestone', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());

            await expect(client.milestones.deleteMilestone(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_milestone/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw validation error for invalid milestoneId in deleteMilestone', async () => {
            await expect(client.milestones.deleteMilestone(0)).rejects.toThrow(
                'milestoneId must be a positive integer',
            );
        });

        it('should propagate API error from deleteMilestone', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.milestones.deleteMilestone(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('parses get_milestone response with SPEC #2.1.9 is_started: true', async () => {
            const startedMilestone: Milestone = {
                id: 1,
                name: 'Release 2.0',
                project_id: 1,
                is_completed: false,
                is_started: true,
                start_on: 1646058600,
                started_on: 1646058700,
                url: 'https://example.testrail.io/milestones/view/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(startedMilestone));
            const result = await client.milestones.getMilestone(1);
            expect(result.is_started).toBe(true);
            expect(result).toEqual(startedMilestone);
        });

        it('parses get_milestone response with is_started: false', async () => {
            const notStartedMilestone: Milestone = {
                id: 1,
                name: 'Future Release',
                project_id: 1,
                is_completed: false,
                is_started: false,
                url: 'https://example.testrail.io/milestones/view/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(notStartedMilestone));
            const result = await client.milestones.getMilestone(1);
            expect(result.is_started).toBe(false);
        });

        it('parses pre-5.3 get_milestone response without is_started', async () => {
            // TestRail < 5.3 omits the key entirely. `.optional()` resolves
            // missing keys to `undefined`.
            const legacyMilestone: Milestone = {
                id: 1,
                name: 'Legacy Milestone',
                project_id: 1,
                is_completed: false,
                url: 'url',
            };
            mockFetch.mockResolvedValueOnce(mockOk(legacyMilestone));
            const result = await client.milestones.getMilestone(1);
            expect(result.is_started).toBeUndefined();
            expect(result).toEqual(legacyMilestone);
        });

        it.each([
            ['string', 'true'],
            ['number 1', 1],
            ['number 0', 0],
            ['explicit null', null],
            ['empty object', {}],
            ['empty array', []],
        ])('rejects is_started when the wire delivers %s (strict boolean, no coercion)', async (_label, value) => {
            // `.optional()` (not `.nullish()`) — accepts undefined / true / false
            // and rejects everything else, matching the sibling `is_completed:
            // z.boolean()` shape on the same schema and the doc's "plain boolean"
            // contract.
            const malformed = {
                id: 1,
                name: 'Bad is_started',
                project_id: 1,
                is_completed: false,
                url: 'url',
                is_started: value,
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.milestones.getMilestone(1)).rejects.toThrow();
        });
    });

    describe('Users', () => {
        const mockUser: User = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            is_active: true,
        };

        it('should get user by ID', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.users.getUser(1);
            expect(result).toEqual(mockUser);
        });

        it('should get user by email', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.users.getUserByEmail('test@example.com');
            expect(result).toEqual(mockUser);
        });

        it('should get all users (global endpoint)', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.users.getUsers();
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_users'), expect.anything());
        });

        it('should handle empty users list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.users.getUsers();
            expect(result).toEqual([]);
        });

        it('should treat null users list as empty', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ users: null }));
            const result = await client.users.getUsers();
            expect(result).toEqual([]);
        });

        it('should get users with pagination params', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.users.getUsers(10, 20);
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_users&limit=10&offset=20'),
                expect.anything(),
            );
        });

        it('should get users scoped to a project', async () => {
            const mockUsers: User[] = [mockUser];
            mockFetch.mockResolvedValueOnce(mockOk({ users: mockUsers }));
            const result = await client.users.getUsers(undefined, undefined, 5);
            expect(result).toEqual(mockUsers);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_users/5'), expect.anything());
        });

        it('should throw for invalid projectId in getUsers', async () => {
            await expect(client.users.getUsers(undefined, undefined, -1)).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should throw validation error for invalid pagination in getUsers', async () => {
            await expect(client.users.getUsers(0)).rejects.toThrow('limit must be a positive integer');
        });

        it('should get current user', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockUser));
            const result = await client.users.getCurrentUser();
            expect(result).toEqual(mockUser);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_current_user'), expect.anything());
        });

        it('should propagate API error from getCurrentUser', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.users.getCurrentUser()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('parses user response with all 7.3+ fields present (email_notifications, is_admin, group_ids, mfa_required)', async () => {
            const proUser: User = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                role_id: 3,
                role: 'Tester',
                email_notifications: true,
                is_admin: false,
                group_ids: [1, 2, 3],
                mfa_required: false,
            };
            mockFetch.mockResolvedValueOnce(mockOk(proUser));
            const result = await client.users.getUser(1);
            // Field-specific assertions first so a single-field bug surfaces with a tight error
            // instead of a multi-page object diff from toEqual.
            expect(result.email_notifications).toBe(true);
            expect(result.is_admin).toBe(false);
            expect(result.group_ids).toEqual([1, 2, 3]);
            expect(result.mfa_required).toBe(false);
            expect(result).toEqual(proUser);
        });

        it('parses user response with all 7.3+ fields plus Enterprise-only sso_enabled and assigned_projects', async () => {
            const enterpriseUser: User = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                role_id: 3,
                role: 'Tester',
                email_notifications: true,
                is_admin: false,
                group_ids: [1, 2, 3],
                mfa_required: false,
                sso_enabled: true,
                assigned_projects: [1, 3],
            };
            mockFetch.mockResolvedValueOnce(mockOk(enterpriseUser));
            const result = await client.users.getUser(1);
            expect(result.sso_enabled).toBe(true);
            expect(result.assigned_projects).toEqual([1, 3]);
            expect(result).toEqual(enterpriseUser);
        });

        it('parses the reduced get_current_user response (all 7.3+ fields omitted)', async () => {
            const minimalUser: User = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                role_id: 3,
                role: 'Tester',
            };
            mockFetch.mockResolvedValueOnce(mockOk(minimalUser));
            const result = await client.users.getCurrentUser();
            // Missing keys (Zod `.nullish()` with absent input) → undefined, not null.
            expect(result.email_notifications).toBeUndefined();
            expect(result.is_admin).toBeUndefined();
            expect(result.group_ids).toBeUndefined();
            expect(result.mfa_required).toBeUndefined();
            expect(result.sso_enabled).toBeUndefined();
            expect(result.assigned_projects).toBeUndefined();
            expect(result).toEqual(minimalUser);
        });

        it('parses a partial-fields response where some 7.3+ fields are present and others omitted', async () => {
            // Defensive-design check: even though the TestRail spec never emits such a mixed
            // shape, `.nullish()` per-field must accept the cross-product of present/absent
            // independently. Regressions to `.optional()` (no `null` accepted) or
            // `.nullable()` (no missing key accepted) would fail here.
            const partial = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                email_notifications: true,
                group_ids: [5],
                // is_admin, mfa_required, sso_enabled, assigned_projects all omitted
            };
            mockFetch.mockResolvedValueOnce(mockOk(partial));
            const result = await client.users.getUser(1);
            expect(result.email_notifications).toBe(true);
            expect(result.group_ids).toEqual([5]);
            expect(result.is_admin).toBeUndefined();
            expect(result.mfa_required).toBeUndefined();
            expect(result.sso_enabled).toBeUndefined();
            expect(result.assigned_projects).toBeUndefined();
        });

        it('parses user response with all 7.3+ fields explicitly set to null', async () => {
            // `.nullish()` must accept `null` from the wire as well as missing keys.
            // This is not an "older server" scenario (older servers omit the keys
            // entirely); it covers TestRail emitting an explicit null where a value
            // is unknown or unset.
            const userWithNulls = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                email_notifications: null,
                is_admin: null,
                group_ids: null,
                mfa_required: null,
                sso_enabled: null,
                assigned_projects: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(userWithNulls));
            const result = await client.users.getUser(1);
            expect(result.email_notifications).toBeNull();
            expect(result.is_admin).toBeNull();
            expect(result.group_ids).toBeNull();
            expect(result.mfa_required).toBeNull();
            expect(result.sso_enabled).toBeNull();
            expect(result.assigned_projects).toBeNull();
        });

        it('rejects group_ids when the wire delivers a string instead of an array', async () => {
            const malformed = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                group_ids: '1,2,3',
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.users.getUser(1)).rejects.toThrow();
        });

        it('rejects group_ids when the array contains non-number elements', async () => {
            const malformed = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                group_ids: [1, '2', 3],
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.users.getUser(1)).rejects.toThrow();
        });

        it('rejects assigned_projects when the wire delivers a non-array value', async () => {
            const malformed = {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@gurock.io',
                is_active: true,
                assigned_projects: 42,
            };
            mockFetch.mockResolvedValueOnce(mockOk(malformed));
            await expect(client.users.getUser(1)).rejects.toThrow();
        });
    });

    describe('Statuses', () => {
        it('should get all statuses', async () => {
            const mockStatuses: Status[] = [
                {
                    id: 1,
                    name: 'passed',
                    label: 'Passed',
                    color_dark: 12709313,
                    color_medium: 14250867,
                    color_bright: 15790320,
                    is_system: true,
                    is_untested: false,
                    is_final: true,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockStatuses));

            const result = await client.metadata.getStatuses();
            expect(result).toEqual(mockStatuses);
        });

        it('should get all case statuses', async () => {
            const mockCaseStatuses: CaseStatus[] = [
                {
                    case_status_id: 1,
                    name: 'Approved',
                    abbreviation: 'APP',
                    is_default: true,
                    is_approved: true,
                    is_untested: false,
                },
                {
                    case_status_id: 2,
                    name: 'Draft',
                    abbreviation: 'DR',
                    is_default: false,
                    is_approved: false,
                    is_untested: true,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockCaseStatuses));

            const result = await client.metadata.getCaseStatuses();
            expect(result).toEqual(mockCaseStatuses);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_statuses'), expect.anything());
        });
    });

    describe('Priorities', () => {
        it('should get all priorities', async () => {
            const mockPriorities: Priority[] = [
                {
                    id: 1,
                    name: 'Low',
                    short_name: 'low',
                    is_default: false,
                    priority: 1,
                },
            ];

            mockFetch.mockResolvedValueOnce(mockOk(mockPriorities));

            const result = await client.metadata.getPriorities();
            expect(result).toEqual(mockPriorities);
        });
    });

    describe('Result Fields', () => {
        const mockResultField: ResultField = {
            id: 1,
            system_name: 'custom_defects',
            label: 'Defects',
            name: 'defects',
            type_id: 1,
            display_order: 1,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
            is_active: true,
            include_all: true,
            template_ids: [],
        };

        it('should get all result fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockResultField]));

            const result = await client.metadata.getResultFields();
            expect(result).toEqual([mockResultField]);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_result_fields'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('should return an empty array when no result fields exist', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));

            const result = await client.metadata.getResultFields();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getResultFields', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden', 'No access'));

            await expect(client.metadata.getResultFields()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should include optional description when present', async () => {
            const fieldWithDescription: ResultField = {
                ...mockResultField,
                id: 2,
                description: 'Custom field for tracking defect IDs',
            };

            mockFetch.mockResolvedValueOnce(mockOk([fieldWithDescription]));

            const result = await client.metadata.getResultFields();
            expect(result[0]).toHaveProperty('description', 'Custom field for tracking defect IDs');
        });
    });

    describe('Case Fields & Types', () => {
        const mockCaseField: CaseField = {
            id: 1,
            system_name: 'custom_steps',
            label: 'Steps',
            name: 'steps',
            type_id: 7,
            display_order: 1,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { is_required: false, default_value: '' },
                },
            ],
            is_active: true,
            include_all: true,
            template_ids: [],
        };

        it('should get all case fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockCaseField]));
            const result = await client.metadata.getCaseFields();
            expect(result).toEqual([mockCaseField]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_fields'), expect.anything());
        });

        it('should return empty array for case fields', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.metadata.getCaseFields();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getCaseFields', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.metadata.getCaseFields()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });

        it('should include optional description when present', async () => {
            const fieldWithDescription: CaseField = { ...mockCaseField, description: 'Step-by-step instructions' };
            mockFetch.mockResolvedValueOnce(mockOk([fieldWithDescription]));
            const result = await client.metadata.getCaseFields();
            expect(result[0]).toHaveProperty('description', 'Step-by-step instructions');
        });

        describe('addCaseField', () => {
            const validPayload: AddCaseFieldPayload = {
                type: 'String',
                name: 'preconds',
                label: 'Preconditions',
                configs: [
                    {
                        context: { is_global: true, project_ids: [] },
                        options: { is_required: false, default_value: '' },
                    },
                ],
            };

            // SPEC #2.1.12 — the POST response shape diverges from
            // `get_case_fields` GET: `configs` arrives as a JSON-encoded
            // string (not a parsed array), and boolean-style fields surface
            // as 0/1 integers. Mirrors the upstream-doc example verbatim.
            const createdFieldResponse: AddCaseFieldResponse = {
                id: 99,
                name: 'preconds',
                system_name: 'custom_preconds',
                entity_id: 1,
                label: 'Preconditions',
                description: 'pre-conditions for the test case',
                type_id: 1,
                location_id: 2,
                display_order: 7,
                configs:
                    '[{"context":{"is_global":true,"project_ids":""},"options":{"is_required":false,"default_value":""},"id":"9f105ba2-1ed0-45e0-b459-18d890bad86e"}]',
                is_multi: 0,
                is_active: 1,
                status_id: 1,
                is_system: 0,
                include_all: 1,
                template_ids: [],
            };

            it('POSTs to add_case_field with the payload and parses the response as AddCaseFieldResponse', async () => {
                mockFetch.mockResolvedValueOnce(mockOk(createdFieldResponse));
                const result = await client.metadata.addCaseField(validPayload);
                expect(result).toEqual(createdFieldResponse);
                expect(mockFetch).toHaveBeenCalledTimes(1);
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_case_field'), expect.anything());
                const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
                expect(init.method).toBe('POST');
                expect(JSON.parse(init.body as string)).toEqual(validPayload);
            });

            it('returns configs as a JSON-encoded string that callers can JSON.parse (SPEC #2.1.12)', async () => {
                // The POST response shape: `configs` is a string, not an array.
                // Callers that need the structured form must JSON.parse it.
                mockFetch.mockResolvedValueOnce(mockOk(createdFieldResponse));
                const result = await client.metadata.addCaseField(validPayload);
                expect(typeof result.configs).toBe('string');
                const parsedConfigs = JSON.parse(result.configs) as Array<Record<string, unknown>>;
                expect(Array.isArray(parsedConfigs)).toBe(true);
                expect(parsedConfigs[0]).toHaveProperty('context');
                expect(parsedConfigs[0]).toHaveProperty('options');
                expect(parsedConfigs[0]).toHaveProperty('id');
            });

            it('returns integer 0/1 for is_active / include_all (SPEC #2.1.12; GET returns booleans)', async () => {
                mockFetch.mockResolvedValueOnce(mockOk(createdFieldResponse));
                const result = await client.metadata.addCaseField(validPayload);
                expect(typeof result.is_active).toBe('number');
                expect(result.is_active).toBe(1);
                expect(typeof result.include_all).toBe('number');
                expect(result.include_all).toBe(1);
            });

            it('rejects when configs comes back as an array (mis-modeled GET-shape response)', async () => {
                // Defensive: ensures the POST response schema does NOT accept
                // the GET-shape `configs: array`. If TestRail ever changes the
                // server to return the structured form, this test must be
                // updated alongside the schema.
                const wrongShape = {
                    ...createdFieldResponse,
                    configs: [
                        {
                            context: { is_global: true, project_ids: [] },
                            options: { is_required: false, default_value: '' },
                        },
                    ],
                };
                mockFetch.mockResolvedValueOnce(mockOk(wrongShape));
                await expect(client.metadata.addCaseField(validPayload)).rejects.toThrow();
            });

            it('propagates 403 Forbidden (admin-only endpoint)', async () => {
                mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
                await expect(client.metadata.addCaseField(validPayload)).rejects.toThrow(
                    'TestRail API error: 403 Forbidden',
                );
            });

            it('propagates 400 from the server on invalid field-type-specific payload', async () => {
                // TestRail rejects `items` on Steps fields server-side; client does
                // not pre-empt this — we surface the upstream 400.
                mockFetch.mockResolvedValueOnce(mockErr(400, 'Bad Request'));
                await expect(
                    client.metadata.addCaseField({
                        ...validPayload,
                        type: 'Steps',
                        configs: [
                            {
                                context: { is_global: true, project_ids: [] },
                                options: { is_required: false, default_value: '', items: 'illegal-on-steps' },
                            },
                        ],
                    }),
                ).rejects.toThrow('TestRail API error: 400 Bad Request');
            });
        });

        const mockCaseType: CaseType = { id: 1, name: 'Functional', is_default: true };

        it('should get all case types', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockCaseType]));
            const result = await client.metadata.getCaseTypes();
            expect(result).toEqual([mockCaseType]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_case_types'), expect.anything());
        });

        it('should return empty array for case types', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.metadata.getCaseTypes();
            expect(result).toEqual([]);
        });

        it('should propagate API error from getCaseTypes', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.metadata.getCaseTypes()).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Templates', () => {
        const mockTemplate: Template = { id: 1, name: 'Test Case (Steps)', is_default: true };

        it('should get templates for a project', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockTemplate]));
            const result = await client.metadata.getTemplates(1);
            expect(result).toEqual([mockTemplate]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_templates/1'), expect.anything());
        });

        it('should return empty array when no templates', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([]));
            const result = await client.metadata.getTemplates(1);
            expect(result).toEqual([]);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.metadata.getTemplates(-1)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should propagate API error from getTemplates', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.metadata.getTemplates(1)).rejects.toThrow('TestRail API error: 403 Forbidden');
        });
    });

    describe('Configurations', () => {
        const mockConfig: Configuration = { id: 10, name: 'Windows 10', group_id: 1 };
        const mockConfigGroup: ConfigurationGroup = {
            id: 1,
            name: 'Operating Systems',
            project_id: 1,
            configs: [mockConfig],
        };

        it('should get configurations for a project', async () => {
            mockFetch.mockResolvedValueOnce(mockOk([mockConfigGroup]));
            const result = await client.configurations.getConfigurations(1);
            expect(result).toEqual([mockConfigGroup]);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_configs/1'), expect.anything());
        });

        it('should throw for invalid projectId in getConfigurations', async () => {
            await expect(client.configurations.getConfigurations(0)).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should propagate API error from getConfigurations', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(403, 'Forbidden'));
            await expect(client.configurations.getConfigurations(1)).rejects.toThrow(
                'TestRail API error: 403 Forbidden',
            );
        });

        it('should add a configuration group', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockConfigGroup));
            const result = await client.configurations.addConfigurationGroup(1, { name: 'Operating Systems' });
            expect(result).toEqual(mockConfigGroup);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_config_group/1'), expect.anything());
        });

        it('should throw for invalid projectId in addConfigurationGroup', async () => {
            await expect(client.configurations.addConfigurationGroup(-1, { name: 'OS' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });

        it('should update a configuration group', async () => {
            const updated: ConfigurationGroup = { ...mockConfigGroup, name: 'OS Versions' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.configurations.updateConfigurationGroup(1, { name: 'OS Versions' });
            expect(result.name).toBe('OS Versions');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('update_config_group/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in updateConfigurationGroup', async () => {
            await expect(client.configurations.updateConfigurationGroup(0, { name: 'OS' })).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should delete a configuration group', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.configurations.deleteConfigurationGroup(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('delete_config_group/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in deleteConfigurationGroup', async () => {
            await expect(client.configurations.deleteConfigurationGroup(-1)).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should add a configuration', async () => {
            mockFetch.mockResolvedValueOnce(mockOk(mockConfig));
            const result = await client.configurations.addConfiguration(1, { name: 'Windows 10' });
            expect(result).toEqual(mockConfig);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('add_config/1'), expect.anything());
        });

        it('should throw for invalid configGroupId in addConfiguration', async () => {
            await expect(client.configurations.addConfiguration(-1, { name: 'Win' })).rejects.toThrow(
                'configGroupId must be a positive integer',
            );
        });

        it('should update a configuration', async () => {
            const updated: Configuration = { ...mockConfig, name: 'Windows 11' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.configurations.updateConfiguration(10, { name: 'Windows 11' });
            expect(result.name).toBe('Windows 11');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('update_config/10'), expect.anything());
        });

        it('should throw for invalid configId in updateConfiguration', async () => {
            await expect(client.configurations.updateConfiguration(0, { name: 'Win' })).rejects.toThrow(
                'configId must be a positive integer',
            );
        });

        it('should delete a configuration', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.configurations.deleteConfiguration(10)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('delete_config/10'), expect.anything());
        });

        it('should throw for invalid configId in deleteConfiguration', async () => {
            await expect(client.configurations.deleteConfiguration(-5)).rejects.toThrow(
                'configId must be a positive integer',
            );
        });
    });

    describe('Security & Validation', () => {
        it('should throw when using HTTP protocol without allowInsecure', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'http://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'key',
                    }),
            ).toThrow('baseUrl must use HTTPS');
        });

        it('should allow HTTP when allowInsecure is true', () => {
            expect(
                () =>
                    new TestRailClient({
                        baseUrl: 'http://example.testrail.io',
                        email: 'test@example.com',
                        apiKey: 'key',
                        allowInsecure: true,
                        allowPrivateHosts: true,
                    }),
            ).not.toThrow();
        });

        it('should throw error for invalid IDs (negative)', async () => {
            await expect(client.projects.getProject(-1)).rejects.toThrow('projectId must be a positive integer');
        });

        it('should throw error for invalid IDs (zero)', async () => {
            await expect(client.cases.getCase(0)).rejects.toThrow('caseId must be a positive integer');
        });

        it('should throw error for invalid IDs (float)', async () => {
            await expect(client.runs.getRun(1.5)).rejects.toThrow('runId must be a positive integer');
        });

        it('should throw error for invalid IDs (non-number disguised as any)', async () => {
            // Feed a string to a number-typed param to exercise runtime ID validation.
            await expect(client.sections.getSection('1' as never)).rejects.toThrow(
                'sectionId must be a positive integer',
            );
        });
    });

    describe('Pagination', () => {
        it('should pass limit and offset to getProjects', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ projects: [] }));
            await client.projects.getProjects(10, 20);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_projects&limit=10&offset=20'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getCases', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { limit: 5, offset: 10 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_cases/1&limit=5&offset=10'),
                expect.anything(),
            );
        });

        it('should pass suiteId, limit, and offset to getCases', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ cases: [] }));
            await client.cases.getCases(1, { suiteId: 2, limit: 5, offset: 0 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('suite_id=2&limit=5&offset=0'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getSections', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ sections: [] }));
            await client.sections.getSections(1, { limit: 25, offset: 50 });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_sections/1&limit=25&offset=50'),
                expect.anything(),
            );
        });

        it('should throw for invalid limit (negative)', async () => {
            await expect(client.projects.getProjects(-1)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid limit (zero)', async () => {
            await expect(client.projects.getProjects(0)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid limit (float)', async () => {
            await expect(client.projects.getProjects(1.5)).rejects.toThrow('limit must be a positive integer');
        });

        it('should throw for invalid offset (negative)', async () => {
            await expect(client.projects.getProjects(10, -1)).rejects.toThrow('offset must be a non-negative integer');
        });

        it('should throw for invalid offset (float)', async () => {
            await expect(client.projects.getProjects(10, 0.5)).rejects.toThrow('offset must be a non-negative integer');
        });

        it('should allow offset of zero', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ projects: [] }));
            await expect(client.projects.getProjects(10, 0)).resolves.toEqual([]);
        });
    });

    // ── TASK-024: User Management ─────────────────────────────────────────────

    describe('addUser', () => {
        it('should add a new user', async () => {
            const newUser = { id: 5, email: 'new@example.com', name: 'New User', is_active: true };
            mockFetch.mockResolvedValueOnce(mockOk(newUser));
            const result = await client.users.addUser({
                email: 'new@example.com',
                name: 'New User',
                password: 's3cr3t',
            });
            expect(result).toEqual(newUser);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_user'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should add a user with optional fields', async () => {
            const newUser = { id: 6, email: 'role@example.com', name: 'Role User', is_active: true, role_id: 2 };
            mockFetch.mockResolvedValueOnce(mockOk(newUser));
            const result = await client.users.addUser({
                email: 'role@example.com',
                name: 'Role User',
                password: 'p@ssword',
                is_active: true,
                role_id: 2,
            });
            expect(result).toEqual(newUser);
        });
    });

    describe('updateUser', () => {
        it('should update an existing user', async () => {
            const updated = { id: 1, name: 'Updated Name', email: 'user@example.com', is_active: true };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.users.updateUser(1, { name: 'Updated Name' });
            expect(result).toEqual(updated);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_user/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid userId', async () => {
            await expect(client.users.updateUser(0, {})).rejects.toThrow('userId must be a positive integer');
            await expect(client.users.updateUser(-1, {})).rejects.toThrow('userId must be a positive integer');
        });
    });

    // ── TASK-025: Roles ───────────────────────────────────────────────────────

    describe('getRoles', () => {
        it('should return all roles from the paginated wrapper', async () => {
            const roles = [
                { id: 1, name: 'Admin', is_default: false },
                { id: 2, name: 'Tester', is_default: true },
            ];
            // TestRail 7.3+ returns get_roles as a paginated wrapper, never a
            // bare array. The wrapper carries offset/limit/size/_links alongside
            // the `roles` array; the client must unwrap `roles`.
            mockFetch.mockResolvedValueOnce(
                mockOk({ offset: 0, limit: 250, size: roles.length, _links: { next: null, prev: null }, roles }),
            );
            const result = await client.metadata.getRoles();
            expect(result).toEqual(roles);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_roles'), expect.anything());
        });

        it('should return [] for an empty roles wrapper', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ offset: 0, limit: 250, size: 0, _links: {}, roles: [] }));
            expect(await client.metadata.getRoles()).toEqual([]);
        });

        it('should return [] when the roles key is omitted (pagination keys present)', async () => {
            // Represents a wrapper whose `roles` key is absent rather than `[]`
            // — the pagination envelope is still present, exercising the
            // `undefined ?? []` branch on a realistic server shape.
            mockFetch.mockResolvedValueOnce(mockOk({ offset: 0, limit: 250, size: 0, _links: { next: null } }));
            expect(await client.metadata.getRoles()).toEqual([]);
        });

        it('should return [] when roles is explicitly null (.nullish() contract)', async () => {
            // `.nullish()` accepts `null` as well as omitted; `null ?? []` → [].
            // Mirrors the getUsers/getGroups paginated-wrapper behavior.
            mockFetch.mockResolvedValueOnce(mockOk({ offset: 0, limit: 250, size: 0, _links: {}, roles: null }));
            expect(await client.metadata.getRoles()).toEqual([]);
        });

        it('should reject a bare-array response (regression: get_roles is never a bare array)', async () => {
            // Guards the PR #200-class bug: a bare array is NOT a valid get_roles
            // response shape, so parsing must fail rather than silently pass.
            mockFetch.mockResolvedValueOnce(mockOk([{ id: 1, name: 'Admin', is_default: false }]));
            await expect(client.metadata.getRoles()).rejects.toThrow(TestRailValidationError);
        });
    });

    // ── TASK-026: Groups ──────────────────────────────────────────────────────

    describe('getGroup', () => {
        it('should return a group by ID', async () => {
            const group = { id: 1, name: 'QA Team', user_ids: [1, 2] };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.users.getGroup(1);
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_group/1'), expect.anything());
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.users.getGroup(0)).rejects.toThrow('groupId must be a positive integer');
        });
    });

    describe('getGroups', () => {
        it('should return all groups', async () => {
            const groups = [
                { id: 1, name: 'QA Team' },
                { id: 2, name: 'Dev Team' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ groups }));
            const result = await client.users.getGroups();
            expect(result).toEqual(groups);
        });

        it('should handle empty groups list', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.users.getGroups();
            expect(result).toEqual([]);
        });
    });

    describe('addGroup', () => {
        it('should create a new group', async () => {
            const group = { id: 3, name: 'New Group', user_ids: [1] };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.users.addGroup({ name: 'New Group', user_ids: [1] });
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_group'),
                expect.objectContaining({ method: 'POST' }),
            );
        });
    });

    describe('updateGroup', () => {
        it('should update a group', async () => {
            const group = { id: 1, name: 'Renamed Group' };
            mockFetch.mockResolvedValueOnce(mockOk(group));
            const result = await client.users.updateGroup(1, { name: 'Renamed Group' });
            expect(result).toEqual(group);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('update_group/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.users.updateGroup(0, {})).rejects.toThrow('groupId must be a positive integer');
        });
    });

    describe('deleteGroup', () => {
        it('should delete a group', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.users.deleteGroup(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_group/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid groupId', async () => {
            await expect(client.users.deleteGroup(-1)).rejects.toThrow('groupId must be a positive integer');
        });
    });

    // ── TASK-027: Attachments ─────────────────────────────────────────────────

    describe('getAttachmentsForCase', () => {
        it('should return attachments for a case', async () => {
            const attachments = [{ attachment_id: 1, name: 'screenshot.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.attachments.getAttachmentsForCase(1);
            expect(result).toEqual(attachments);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_attachments_for_case/1'),
                expect.anything(),
            );
        });

        it('should return empty array when no attachments', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [] }));
            expect(await client.attachments.getAttachmentsForCase(1)).toEqual([]);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.attachments.getAttachmentsForCase(1)).toEqual([]);
        });

        it('should throw for invalid caseId', async () => {
            await expect(client.attachments.getAttachmentsForCase(0)).rejects.toThrow(
                'caseId must be a positive integer',
            );
        });

        it('should append limit and offset query params when provided', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [] }));
            await client.attachments.getAttachmentsForCase(1, { limit: 25, offset: 50 });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('limit=25');
            expect(url).toContain('offset=50');
        });

        it('should reject non-positive limit', async () => {
            await expect(client.attachments.getAttachmentsForCase(1, { limit: 0 })).rejects.toThrow(
                TestRailValidationError,
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should reject negative offset', async () => {
            await expect(client.attachments.getAttachmentsForCase(1, { offset: -1 })).rejects.toThrow(
                TestRailValidationError,
            );
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('getAttachmentsForRun', () => {
        it('should return attachments for a run', async () => {
            const attachments = [{ attachment_id: 2, name: 'log.txt' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.attachments.getAttachmentsForRun(1);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.attachments.getAttachmentsForRun(1)).toEqual([]);
        });

        it('should throw for invalid runId', async () => {
            await expect(client.attachments.getAttachmentsForRun(0)).rejects.toThrow(
                'runId must be a positive integer',
            );
        });

        it('should append limit and offset query params when provided', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [] }));
            await client.attachments.getAttachmentsForRun(1, { limit: 10, offset: 5 });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('limit=10');
            expect(url).toContain('offset=5');
        });
    });

    describe('getAttachmentsForTest', () => {
        it('should return attachments for a test', async () => {
            const attachments = [{ attachment_id: 3, name: 'evidence.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.attachments.getAttachmentsForTest(5);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.attachments.getAttachmentsForTest(5)).toEqual([]);
        });

        it('should throw for invalid testId', async () => {
            await expect(client.attachments.getAttachmentsForTest(-1)).rejects.toThrow(
                'testId must be a positive integer',
            );
        });

        it('should append limit and offset query params when provided', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: [] }));
            await client.attachments.getAttachmentsForTest(5, { limit: 100, offset: 200 });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('limit=100');
            expect(url).toContain('offset=200');
        });
    });

    describe('getAttachmentsForPlan', () => {
        it('should return attachments for a plan', async () => {
            const attachments = [{ attachment_id: 4, name: 'plan-doc.pdf' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.attachments.getAttachmentsForPlan(1);
            expect(result).toEqual(attachments);
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.attachments.getAttachmentsForPlan(1)).toEqual([]);
        });

        it('should throw for invalid planId', async () => {
            await expect(client.attachments.getAttachmentsForPlan(0)).rejects.toThrow(
                'planId must be a positive integer',
            );
        });
    });

    describe('getAttachmentsForPlanEntry', () => {
        // Plan-entry ids are GUIDs (get_plan entries[].id), not integers.
        const ENTRY_ID = '3933d74b-4282-4c1f-be62-a641ab427063';

        it('should return attachments for a plan entry', async () => {
            const attachments = [{ attachment_id: 5, name: 'entry.png' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments }));
            const result = await client.attachments.getAttachmentsForPlanEntry(1, ENTRY_ID);
            expect(result).toEqual(attachments);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`get_attachments_for_plan_entry/1/${ENTRY_ID}`),
                expect.anything(),
            );
        });

        it('should return empty array when response has no attachments key', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            expect(await client.attachments.getAttachmentsForPlanEntry(1, ENTRY_ID)).toEqual([]);
        });

        it('should throw for invalid planId', async () => {
            await expect(client.attachments.getAttachmentsForPlanEntry(0, ENTRY_ID)).rejects.toThrow(
                'planId must be a positive integer',
            );
        });

        it('should throw for non-UUID entryId', async () => {
            await expect(client.attachments.getAttachmentsForPlanEntry(1, 'not-a-uuid')).rejects.toThrow(
                'entryId must be a UUID string',
            );
        });
    });

    // SPEC #2.1.14 — full field-completeness audit. `AttachmentSchema` now
    // covers the legacy `get_attachments_for_case`/`_test` shape, the
    // plan/run shape (with `entity_attachments_id` + `icon_name`), and the
    // cloud TestRail 7.1+ shape (UUID `id`, string `entity_id`, plus
    // `client_id`/`entity_type`/`data_id`/`filetype`/`legacy_id`/`is_image`/
    // `icon`). Regression coverage: a minimal legacy payload still parses.
    describe('SPEC #2.1.14 — AttachmentSchema field-completeness', () => {
        it('parses the legacy get_attachments_for_case shape (integer id + result_id: null)', async () => {
            // Verbatim from the doc's pre-7.1 example response.
            const legacy = [
                {
                    id: 1773,
                    name: 'image.jpg',
                    size: 21995,
                    created_on: 1585560521,
                    project_id: 33,
                    case_id: 57333,
                    user_id: 1,
                    result_id: null,
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: legacy }));
            const result = await client.attachments.getAttachmentsForCase(57333);
            expect(result).toEqual(legacy);
            expect(result[0]?.id).toBe(1773);
            expect(result[0]?.result_id).toBeNull();
        });

        it('parses the get_attachments_for_plan shape (entity_attachments_id + icon_name + case_id: null)', async () => {
            // Verbatim from the doc's plan example response — plan-level
            // attachments emit `case_id: null` and add two plan-only fields.
            const planAttachments = [
                {
                    id: 1900,
                    name: 'TR-2104.gif',
                    size: 3838070,
                    created_on: 1602178189,
                    project_id: 15,
                    case_id: null,
                    user_id: 1,
                    entity_attachments_id: 360,
                    icon_name: 'Gif Image',
                    result_id: null,
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: planAttachments }));
            const result = await client.attachments.getAttachmentsForPlan(7);
            expect(result).toEqual(planAttachments);
            expect(result[0]?.entity_attachments_id).toBe(360);
            expect(result[0]?.icon_name).toBe('Gif Image');
            expect(result[0]?.case_id).toBeNull();
        });

        it('parses the cloud TestRail 7.1+ shape (UUID id, string entity_id, full extra field set)', async () => {
            // Verbatim from the doc's "After TestRail 7.1 release (cloud)"
            // example — `id` is a UUID string, `entity_id` is a string, and
            // the response carries 7 extra fields the legacy schema would
            // have either rejected (entity_id as string) or dropped on the
            // floor (the rest).
            const cloud71 = [
                {
                    client_id: 614308,
                    project_id: 2,
                    entity_type: 'case',
                    id: '2ec27be4-812f-4806-9a5d-d39130d1691a',
                    created_on: 1631722975,
                    data_id: '63c82867-526d-43be-b1a5-9ddfcf581cf5',
                    entity_id: '3',
                    filename: 'msdia80.dll',
                    filetype: 'dll',
                    legacy_id: 0,
                    name: 'msdia80.dll',
                    size: 904704,
                    user_id: 1,
                    is_image: false,
                    icon: 'other',
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: cloud71 }));
            const result = await client.attachments.getAttachmentsForCase(3);
            expect(result).toEqual(cloud71);
            expect(result[0]?.id).toBe('2ec27be4-812f-4806-9a5d-d39130d1691a');
            expect(result[0]?.entity_id).toBe('3');
            expect(result[0]?.client_id).toBe(614308);
            expect(result[0]?.entity_type).toBe('case');
            expect(result[0]?.data_id).toBe('63c82867-526d-43be-b1a5-9ddfcf581cf5');
            expect(result[0]?.filetype).toBe('dll');
            expect(result[0]?.legacy_id).toBe(0);
            expect(result[0]?.is_image).toBe(false);
            expect(result[0]?.icon).toBe('other');
        });

        // The four list endpoints share `AttachmentSchema`; once the
        // case-scoped path accepts the 7.1+ payload, the rest must too.
        // Symmetric coverage so a future schema regression on one
        // endpoint can't slip past the others.
        const cloud71Sample = (): Attachment[] => [
            {
                client_id: 614308,
                project_id: 2,
                entity_type: 'case',
                id: 'aaaa-bbbb-cccc-dddd',
                created_on: 1700000000,
                data_id: 'eeee-ffff-0000-1111',
                entity_id: '42',
                filename: 'log.txt',
                filetype: 'txt',
                legacy_id: 0,
                name: 'log.txt',
                size: 1024,
                user_id: 1,
                is_image: false,
                icon: 'text',
            },
        ];

        it.each([
            [
                'get_attachments_for_test',
                (c: TestRailClient): Promise<Attachment[]> => c.attachments.getAttachmentsForTest(5),
            ] as const,
            [
                'get_attachments_for_run',
                (c: TestRailClient): Promise<Attachment[]> => c.attachments.getAttachmentsForRun(7),
            ] as const,
            [
                'get_attachments_for_plan_entry',
                (c: TestRailClient): Promise<Attachment[]> =>
                    c.attachments.getAttachmentsForPlanEntry(11, '3933d74b-4282-4c1f-be62-a641ab427063'),
            ] as const,
            [
                'get_attachments_for_plan',
                (c: TestRailClient): Promise<Attachment[]> => c.attachments.getAttachmentsForPlan(7),
            ] as const,
        ])('parses the cloud 7.1+ shape via %s', async (_endpoint, call) => {
            const cloud71 = cloud71Sample();
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: cloud71 }));
            const result = await call(client);
            expect(result).toEqual(cloud71);
        });

        it('accepts a list response with no SPEC #2.1.14 fields (legacy regression guard)', async () => {
            // Pre-existing tests fixtured with `{ attachment_id, name }`
            // pairs — neither field is in the doc's list responses, but the
            // schema relaxation must still accept that shape so a callers'
            // existing mocks don't break. This is the explicit
            // "no-new-fields" regression guard.
            const minimal = [{ attachment_id: 99, name: 'legacy.txt' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: minimal }));
            const result = await client.attachments.getAttachmentsForCase(1);
            expect(result).toEqual(minimal);
        });

        it('rejects a non-numeric `attachment_id` (no coercion)', async () => {
            // `attachment_id` is `z.number().nullish()` — string values are
            // rejected. Guards against silent type coercion from a future
            // API change that would mask a real wire-format incident.
            const malformed = [{ attachment_id: 'not-a-number', name: 'broken.txt' }];
            mockFetch.mockResolvedValueOnce(mockOk({ attachments: malformed }));
            await expect(client.attachments.getAttachmentsForCase(1)).rejects.toThrow(TestRailValidationError);
        });
    });

    describe('getAttachment', () => {
        it('should return binary content of an attachment (integer id)', async () => {
            const buffer = new ArrayBuffer(8);
            const response = new Response(buffer, {
                status: 200,
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            mockFetch.mockResolvedValueOnce(response);
            const result = await client.attachments.getAttachment(1);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_attachment/1'), expect.anything());
        });

        it('should return binary content of an attachment (UUID id — TestRail 7.1+)', async () => {
            const UUID_ID = '2ec27be4-812f-4806-9a5d-d39130d1691a';
            const buffer = new ArrayBuffer(4);
            const response = new Response(buffer, {
                status: 200,
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            mockFetch.mockResolvedValueOnce(response);
            const result = await client.attachments.getAttachment(UUID_ID);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`get_attachment/${UUID_ID}`),
                expect.anything(),
            );
        });

        it('should throw for invalid attachmentId (zero)', async () => {
            await expect(client.attachments.getAttachment(0)).rejects.toThrow(
                'attachmentId must be a positive integer or a UUID string',
            );
        });

        it('should throw for invalid attachmentId (non-UUID string)', async () => {
            await expect(client.attachments.getAttachment('not-a-uuid')).rejects.toThrow(
                'attachmentId must be a positive integer or a UUID string',
            );
        });
    });

    describe('addAttachmentToCase', () => {
        it('should upload a file to a case', async () => {
            const attachment = { attachment_id: 10, name: 'test.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['test content'], { type: 'image/png' });
            const result = await client.attachments.addAttachmentToCase(1, blob, 'test.png');
            expect(result).toEqual(attachment);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_attachment_to_case/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid caseId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToCase(0, blob, 'f.txt')).rejects.toThrow(
                'caseId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToResult', () => {
        it('should upload a file to a result', async () => {
            const attachment = { attachment_id: 11, name: 'result.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['result data']);
            const result = await client.attachments.addAttachmentToResult(1, blob, 'result.png');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid resultId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToResult(-1, blob, 'f.txt')).rejects.toThrow(
                'resultId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToRun', () => {
        it('should upload a file to a run', async () => {
            const attachment = { attachment_id: 12, name: 'run.log' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['log data']);
            const result = await client.attachments.addAttachmentToRun(1, blob, 'run.log');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid runId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToRun(0, blob, 'f.txt')).rejects.toThrow(
                'runId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToPlan', () => {
        it('should upload a file to a plan', async () => {
            const attachment = { attachment_id: 13, name: 'plan.pdf' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['pdf data']);
            const result = await client.attachments.addAttachmentToPlan(1, blob, 'plan.pdf');
            expect(result).toEqual(attachment);
        });

        it('should throw for invalid planId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToPlan(0, blob, 'f.txt')).rejects.toThrow(
                'planId must be a positive integer',
            );
        });
    });

    describe('addAttachmentToPlanEntry', () => {
        // Plan-entry ids are GUIDs (get_plan entries[].id), not integers.
        const ENTRY_ID = '3933d74b-4282-4c1f-be62-a641ab427063';

        it('should upload a file to a plan entry', async () => {
            const attachment = { attachment_id: 14, name: 'entry.png' };
            mockFetch.mockResolvedValueOnce(mockOk(attachment));
            const blob = new globalThis.Blob(['image']);
            const result = await client.attachments.addAttachmentToPlanEntry(1, ENTRY_ID, blob, 'entry.png');
            expect(result).toEqual(attachment);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`add_attachment_to_plan_entry/1/${ENTRY_ID}`),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid planId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToPlanEntry(0, ENTRY_ID, blob, 'f.txt')).rejects.toThrow(
                'planId must be a positive integer',
            );
        });

        it('should throw for non-UUID entryId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.attachments.addAttachmentToPlanEntry(1, 'not-a-uuid', blob, 'f.txt')).rejects.toThrow(
                'entryId must be a UUID string',
            );
        });
    });

    describe('deleteAttachment', () => {
        it('should delete an attachment (integer id)', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.attachments.deleteAttachment(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_attachment/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should delete an attachment (UUID id — TestRail 7.1+)', async () => {
            const UUID_ID = '2ec27be4-812f-4806-9a5d-d39130d1691a';
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.attachments.deleteAttachment(UUID_ID)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`delete_attachment/${UUID_ID}`),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid attachmentId (zero)', async () => {
            await expect(client.attachments.deleteAttachment(0)).rejects.toThrow(
                'attachmentId must be a positive integer or a UUID string',
            );
        });

        it('should throw for invalid attachmentId (non-UUID string)', async () => {
            await expect(client.attachments.deleteAttachment('garbage')).rejects.toThrow(
                'attachmentId must be a positive integer or a UUID string',
            );
        });
    });

    // ── TASK-028: Shared Steps ────────────────────────────────────────────────

    describe('getSharedStep', () => {
        it('should return a shared step by ID', async () => {
            const sharedStep = { id: 1, title: 'Login Steps', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(sharedStep));
            const result = await client.sharedSteps.getSharedStep(1);
            expect(result).toEqual(sharedStep);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_shared_step/1'), expect.anything());
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.sharedSteps.getSharedStep(0)).rejects.toThrow(
                'sharedStepId must be a positive integer',
            );
        });
    });

    describe('getSharedSteps', () => {
        it('should return all shared steps for a project', async () => {
            const sharedSteps = [
                { id: 1, title: 'Login' },
                { id: 2, title: 'Logout' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(sharedSteps));
            const result = await client.sharedSteps.getSharedSteps(1);
            expect(result).toEqual(sharedSteps);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.sharedSteps.getSharedSteps(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addSharedStep', () => {
        it('should create a shared step', async () => {
            const sharedStep = { id: 3, title: 'New Shared Step', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(sharedStep));
            const result = await client.sharedSteps.addSharedStep(1, { title: 'New Shared Step' });
            expect(result).toEqual(sharedStep);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_shared_step/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.sharedSteps.addSharedStep(-1, { title: 'x' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });
    });

    describe('updateSharedStep', () => {
        it('should update a shared step', async () => {
            const updated = { id: 1, title: 'Updated Steps' };
            mockFetch.mockResolvedValueOnce(mockOk(updated));
            const result = await client.sharedSteps.updateSharedStep(1, { title: 'Updated Steps' });
            expect(result).toEqual(updated);
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.sharedSteps.updateSharedStep(0, {})).rejects.toThrow(
                'sharedStepId must be a positive integer',
            );
        });
    });

    describe('deleteSharedStep', () => {
        it('should delete a shared step', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.sharedSteps.deleteSharedStep(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_shared_step/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid sharedStepId', async () => {
            await expect(client.sharedSteps.deleteSharedStep(-1)).rejects.toThrow(
                'sharedStepId must be a positive integer',
            );
        });
    });

    describe('SharedStepSchema SPEC #2.1.15 — doc parity', () => {
        // Verifies SharedStepSchema accepts every shape documented in the
        // TestRail Shared Steps API article (7077919815572) and that the
        // step-entry record permits the documented per-key `null` values.

        it('parses the full get_shared_step response from the doc example verbatim', async () => {
            // Doc example payload, copied 1:1 from the article's `get_shared_step`
            // "Example response" code block.
            const full = {
                id: 1,
                title: 'Default Login',
                project_id: 2,
                created_by: 1,
                created_on: 1612555977,
                updated_by: 1,
                updated_on: 1612555977,
                custom_steps_separated: [
                    {
                        content: 'Navigate to https://localhost/some_app',
                        additional_info: null,
                        expected: 'Login screen loads',
                        refs: 'TR-123',
                    },
                    {
                        content: 'Enter Valid Credentials',
                        additional_info: null,
                        expected: 'Logged in and redirected to dashboard',
                        refs: null,
                    },
                ],
                case_ids: [25],
            };
            mockFetch.mockResolvedValueOnce(mockOk(full));
            const result = await client.sharedSteps.getSharedStep(1);
            expect(result).toEqual(full);
            expect(result.custom_steps_separated?.[0]?.['additional_info']).toBeNull();
            expect(result.custom_steps_separated?.[1]?.['refs']).toBeNull();
        });

        it('parses the truncated get_shared_steps list-form entry (only id + title)', async () => {
            // Doc's `get_shared_steps` list response example shows entries
            // containing only `id` and `title`. `.nullish()` on every other
            // field accepts absence; the schema must not reject this shape.
            const truncated = [
                { id: 1, title: 'Shared Step 1' },
                { id: 2, title: 'Shared Step 2' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(truncated));
            const result = await client.sharedSteps.getSharedSteps(1);
            expect(result).toEqual(truncated);
        });

        it.each([
            ['additional_info', 'additional_info'],
            ['refs', 'refs'],
        ])('accepts step entry with %s explicitly null (doc-documented per-key nulls)', async (_label, key) => {
            const withNull = {
                id: 1,
                title: 'T',
                project_id: 1,
                created_by: 1,
                created_on: 1,
                updated_by: 1,
                updated_on: 1,
                case_ids: [],
                custom_steps_separated: [{ content: 'Step', expected: 'OK', [key]: null }],
            };
            mockFetch.mockResolvedValueOnce(mockOk(withNull));
            const result = await client.sharedSteps.getSharedStep(1);
            expect(result.custom_steps_separated?.[0]?.[key]).toBeNull();
        });

        it('accepts top-level fields as explicit null (defensive widening per PR #130)', async () => {
            // No doc example shows top-level nulls, but `.nullish()` permits
            // them for cross-version tolerance. This regression-guards the
            // schema against a future tightening that would break callers
            // hitting older TestRail servers.
            const nulledTopLevel = {
                id: 1,
                title: 'T',
                project_id: null,
                case_ids: null,
                created_by: null,
                created_on: null,
                updated_by: null,
                updated_on: null,
                custom_steps_separated: null,
            };
            mockFetch.mockResolvedValueOnce(mockOk(nulledTopLevel));
            const result = await client.sharedSteps.getSharedStep(1);
            expect(result.project_id).toBeNull();
            expect(result.custom_steps_separated).toBeNull();
        });

        it.each([
            ['id missing', { title: 'T' }],
            ['title missing', { id: 1 }],
            ['id as string', { id: '1', title: 'T' }],
            ['title as number', { id: 1, title: 42 }],
        ])('rejects malformed response where %s', async (_label, payload) => {
            // `id` and `title` are required-and-typed per the doc field table.
            // Strict checks ensure the schema doesn't silently widen these.
            mockFetch.mockResolvedValueOnce(mockOk(payload));
            await expect(client.sharedSteps.getSharedStep(1)).rejects.toThrow();
        });
    });

    describe('getSharedStepHistory', () => {
        it('should return history for a shared step', async () => {
            const mockHistory: HistoryEntry[] = [
                {
                    id: 10,
                    user_id: 5,
                    type_id: 2,
                    created_on: 1700000000,
                    changes: [{ field: 'title', type_id: 1, old_text: 'old', new_text: 'new' }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk({ history: mockHistory }));
            const result = await client.sharedSteps.getSharedStepHistory(42);
            expect(result).toEqual(mockHistory);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_shared_step_history/42'),
                expect.anything(),
            );
        });

        it('should pass limit and offset to getSharedStepHistory', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({ history: [] }));
            await client.sharedSteps.getSharedStepHistory(42, { limit: 25, offset: 50 });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('limit=25');
            expect(url).toContain('offset=50');
        });

        it('should return empty array when history envelope is missing', async () => {
            mockFetch.mockResolvedValueOnce(mockOk({}));
            const result = await client.sharedSteps.getSharedStepHistory(42);
            expect(result).toEqual([]);
        });

        it('should reject invalid sharedStepId', async () => {
            await expect(client.sharedSteps.getSharedStepHistory(0)).rejects.toThrow(
                'sharedStepId must be a positive integer',
            );
        });
    });

    // ── TASK-029: Variables ───────────────────────────────────────────────────

    describe('getVariables', () => {
        it('should return variables for a project', async () => {
            const variables = [
                { id: 1, name: 'env' },
                { id: 2, name: 'region' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(variables));
            const result = await client.variables.getVariables(1);
            expect(result).toEqual(variables);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_variables/1'), expect.anything());
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.variables.getVariables(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addVariable', () => {
        it('should create a variable', async () => {
            const variable = { id: 3, name: 'platform' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.variables.addVariable(1, { name: 'platform' });
            expect(result).toEqual(variable);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_variable/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.variables.addVariable(-1, { name: 'x' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });
    });

    describe('updateVariable', () => {
        it('should update a variable', async () => {
            const variable = { id: 1, name: 'environment' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.variables.updateVariable(1, { name: 'environment' });
            expect(result).toEqual(variable);
        });

        it('should throw for invalid variableId', async () => {
            await expect(client.variables.updateVariable(0, {})).rejects.toThrow(
                'variableId must be a positive integer',
            );
        });
    });

    describe('deleteVariable', () => {
        it('should delete a variable', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.variables.deleteVariable(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_variable/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid variableId', async () => {
            await expect(client.variables.deleteVariable(-1)).rejects.toThrow('variableId must be a positive integer');
        });
    });

    // ── TASK-030: Datasets ────────────────────────────────────────────────────

    describe('getDataset', () => {
        it('should return a dataset by ID', async () => {
            const dataset = { id: 1, name: 'Smoke Dataset', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.getDataset(1);
            expect(result).toEqual(dataset);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_dataset/1'), expect.anything());
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.datasets.getDataset(0)).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    describe('getDatasets', () => {
        it('should return all datasets for a project', async () => {
            const datasets = [
                { id: 1, name: 'Smoke' },
                { id: 2, name: 'Regression' },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(datasets));
            const result = await client.datasets.getDatasets(1);
            expect(result).toEqual(datasets);
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.datasets.getDatasets(-1)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('addDataset', () => {
        it('should create a dataset', async () => {
            const dataset = { id: 3, name: 'Performance', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.addDataset(1, { name: 'Performance' });
            expect(result).toEqual(dataset);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_dataset/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.datasets.addDataset(0, { name: 'x' })).rejects.toThrow(
                'projectId must be a positive integer',
            );
        });
    });

    describe('updateDataset', () => {
        it('should update a dataset', async () => {
            const dataset = { id: 1, name: 'Updated Dataset' };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.updateDataset(1, { name: 'Updated Dataset' });
            expect(result).toEqual(dataset);
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.datasets.updateDataset(-1, {})).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    describe('deleteDataset', () => {
        it('should delete a dataset', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await expect(client.datasets.deleteDataset(1)).resolves.toBeUndefined();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('delete_dataset/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw for invalid datasetId', async () => {
            await expect(client.datasets.deleteDataset(0)).rejects.toThrow('datasetId must be a positive integer');
        });
    });

    // ── TASK-031: Reports ─────────────────────────────────────────────────────

    describe('getReports', () => {
        it('should return reports for a project', async () => {
            const reports = [
                { id: 1, name: 'Test Run Summary', description: 'Summary report' },
                { id: 2, name: 'Milestone Report', is_shared: true },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(reports));
            const result = await client.reports.getReports(1);
            expect(result).toEqual(reports);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('get_reports/1'), expect.anything());
        });

        it('should throw for invalid projectId', async () => {
            await expect(client.reports.getReports(0)).rejects.toThrow('projectId must be a positive integer');
        });
    });

    describe('runReport', () => {
        it('should run a report and return URLs', async () => {
            const reportResult = {
                report_url: 'https://example.testrail.io/reports/1/html',
                user_report_url: 'https://example.testrail.io/reports/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(reportResult));
            const result = await client.reports.runReport(1);
            expect(result).toEqual(reportResult);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('run_report/1'), expect.anything());
        });

        it('should throw for invalid reportTemplateId', async () => {
            await expect(client.reports.runReport(-1)).rejects.toThrow('reportTemplateId must be a positive integer');
        });
    });

    // ── SPEC #2.1.16: Variables / Datasets / Reports nullability ──────────────

    describe('SPEC #2.1.16 — Variables schema parity', () => {
        it('parses the doc-canonical {id, name} shape (no extra fields)', async () => {
            // Per TestRail "Variables" API doc (support article 7077979742868),
            // the Variable response object has exactly id + name, both required
            // and non-nullable. Mirrors the doc's example response.
            const variable = { id: 611, name: 'd' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.variables.addVariable(1, { name: 'd' });
            expect(result).toEqual(variable);
        });

        it('passes through forward-compat keys without dropping them (zObject passthrough)', async () => {
            // `zObject()` uses `.passthrough()` so any future TestRail-added
            // key (e.g. `description`) survives a round-trip without breaking
            // the parse. Guards against the schema becoming brittle to
            // upstream additions.
            const variable = { id: 612, name: 'e', description: 'forward-compat' };
            mockFetch.mockResolvedValueOnce(mockOk(variable));
            const result = await client.variables.addVariable(1, { name: 'e' });
            expect(result).toEqual(variable);
        });

        it.each([
            ['missing id', { name: 'no_id' }],
            ['missing name', { id: 1 }],
            ['null id', { id: null, name: 'null_id' }],
            ['null name', { id: 1, name: null }],
            ['string id', { id: '1', name: 'string_id' }],
            ['number name', { id: 1, name: 42 }],
        ])('rejects %s (no nullability or coercion)', async (_label, wire) => {
            mockFetch.mockResolvedValueOnce(mockOk(wire));
            await expect(client.variables.addVariable(1, { name: 'x' })).rejects.toThrow();
        });
    });

    describe('SPEC #2.1.16 — Datasets schema parity', () => {
        it('parses get_dataset doc-canonical response with embedded variables[]', async () => {
            // Per TestRail "Datasets" API doc (support article 7077300491540),
            // a Dataset has id + name + variables[{id, name, value}].
            // Mirrors the doc's example response verbatim.
            const dataset = {
                id: 183,
                name: 'Default',
                variables: [
                    { id: 1171, name: 'age', value: '41' },
                    { id: 1170, name: 'birth_year', value: '1980' },
                    { id: 1172, name: 'browser', value: 'Chrome' },
                ],
            };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.getDataset(183);
            expect(result).toEqual(dataset);
            expect(result.variables).toHaveLength(3);
        });

        it('parses legacy get_dataset response without SPEC #2.1.16 variables field (regression guard)', async () => {
            // Pre-SPEC #2.1.16 callers and older TestRail revisions may omit
            // the `variables` key — `.nullish()` accepts absence without
            // forcing a defensive `|| []` at every call site.
            const legacy = { id: 1, name: 'Smoke Dataset', project_id: 1 };
            mockFetch.mockResolvedValueOnce(mockOk(legacy));
            const result = await client.datasets.getDataset(1);
            expect(result).toEqual(legacy);
            expect(result.variables).toBeUndefined();
        });

        it('parses get_dataset response with explicit null variables (defensive back-compat)', async () => {
            const dataset = { id: 2, name: 'Empty Dataset', variables: null };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.getDataset(2);
            expect(result.variables).toBeNull();
        });

        it('parses get_datasets response with array of variable-bearing datasets', async () => {
            const datasets = [
                {
                    id: 543,
                    name: 'Dataset_name_3',
                    variables: [
                        { id: 1171, name: 'age', value: '38' },
                        { id: 1169, name: 'name', value: 'Ringo' },
                    ],
                },
                {
                    id: 544,
                    name: 'New',
                    variables: [{ id: 1170, name: 'birth_year', value: 'n' }],
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(datasets));
            const result = await client.datasets.getDatasets(2);
            expect(result).toEqual(datasets);
            expect(result[0]?.variables?.[0]?.value).toBe('38');
        });

        it.each([
            ['missing variable id', { id: 1, name: 'D', variables: [{ name: 'v', value: '1' }] }],
            ['missing variable name', { id: 1, name: 'D', variables: [{ id: 1, value: '1' }] }],
            ['missing variable value', { id: 1, name: 'D', variables: [{ id: 1, name: 'v' }] }],
            [
                'variable value as number (no coercion)',
                { id: 1, name: 'D', variables: [{ id: 1, name: 'v', value: 42 }] },
            ],
        ])('rejects malformed embedded variable: %s', async (_label, wire) => {
            mockFetch.mockResolvedValueOnce(mockOk(wire));
            await expect(client.datasets.getDataset(1)).rejects.toThrow();
        });

        it('accepts embedded variable with value: null (unset/cleared on server side)', async () => {
            // SPEC #2.1.16 — value may be null for unset variables (review feedback)
            const dataset = { id: 1, name: 'D', variables: [{ id: 1, name: 'v', value: null }] };
            mockFetch.mockResolvedValueOnce(mockOk(dataset));
            const result = await client.datasets.getDataset(1);
            expect(result).toEqual(dataset);
            expect(result.variables?.[0]?.value).toBeNull();
        });
    });

    describe('SPEC #2.1.16 — Reports schema parity', () => {
        it('parses get_reports response with full SPEC #2.1.16 system-field set', async () => {
            // Per TestRail "Reports and Cross-Project Reports" API doc
            // (support article 7077825062036), the always-included system
            // fields are id, name, description, and six notify_* fields.
            // Mirrors the doc's example response.
            const reports = [
                {
                    id: 1,
                    name: 'Activity Summary (Cases) %date%',
                    description: null,
                    notify_user: true,
                    notify_link: false,
                    notify_link_recipients: null,
                    notify_attachment: false,
                    notify_attachment_html_format: false,
                    notify_attachment_pdf_format: false,
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(reports));
            const result = await client.reports.getReports(1);
            expect(result).toEqual(reports);
            expect(result[0]?.notify_user).toBe(true);
            expect(result[0]?.notify_link_recipients).toBeNull();
        });

        it('parses get_reports response with notify_link_recipients as string of emails', async () => {
            // Doc example shows the field can carry CRLF-separated emails.
            const reports = [
                {
                    id: 2,
                    name: 'Daily Digest',
                    notify_link_recipients: 'person1@example.com\r\nperson2@example.com',
                },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(reports));
            const result = await client.reports.getReports(1);
            expect(result[0]?.notify_link_recipients).toContain('person1@example.com');
        });

        it('parses legacy get_reports response without SPEC #2.1.16 notify_* fields (regression guard)', async () => {
            // Pre-SPEC #2.1.16 callers and older TestRail revisions may omit
            // every notify_* key — `.nullish()` accepts absence so the
            // existing legacy test fixture (id+name+is_shared) continues
            // to parse without modification.
            const legacy = [
                { id: 1, name: 'Test Run Summary', description: 'Summary report' },
                { id: 2, name: 'Milestone Report', is_shared: true },
            ];
            mockFetch.mockResolvedValueOnce(mockOk(legacy));
            const result = await client.reports.getReports(1);
            expect(result).toEqual(legacy);
            expect(result[0]?.notify_user).toBeUndefined();
        });

        it.each([
            ['notify_user', 'notify_user', 'truthy-string'],
            ['notify_link', 'notify_link', 1],
            ['notify_attachment', 'notify_attachment', 'yes'],
            ['notify_attachment_html_format', 'notify_attachment_html_format', 0],
            ['notify_attachment_pdf_format', 'notify_attachment_pdf_format', 'no'],
        ])('rejects non-boolean %s (strict, no coercion)', async (_label, field, value) => {
            const report = { id: 1, name: 'r', [field]: value };
            mockFetch.mockResolvedValueOnce(mockOk([report]));
            await expect(client.reports.getReports(1)).rejects.toThrow();
        });

        it('parses run_report doc-canonical response with report_html and report_pdf', async () => {
            // Per the current TestRail doc, run_report returns three URLs.
            // report_html and report_pdf were missing from ReportResultSchema
            // before SPEC #2.1.16.
            const result = {
                report_url: 'https://docs.testrail.com/index.php?/reports/view/383',
                report_html: 'https://docs.testrail.com/index.php?/reports/get_html/383',
                report_pdf: 'https://docs.testrail.com/index.php?/reports/get_pdf/383',
            };
            mockFetch.mockResolvedValueOnce(mockOk(result));
            const got = await client.reports.runReport(383);
            expect(got).toEqual(result);
            expect(got.report_html).toContain('get_html');
            expect(got.report_pdf).toContain('get_pdf');
        });

        it('parses legacy run_report response without SPEC #2.1.16 report_html/report_pdf (regression guard)', async () => {
            // Pre-5.7 (or any pre-SPEC #2.1.16 mock) callers may emit only
            // report_url + user_report_url. `.nullish()` accepts absence.
            const result = {
                report_url: 'https://example.testrail.io/reports/1/html',
                user_report_url: 'https://example.testrail.io/reports/1',
            };
            mockFetch.mockResolvedValueOnce(mockOk(result));
            const got = await client.reports.runReport(1);
            expect(got).toEqual(result);
            expect(got.report_html).toBeUndefined();
            expect(got.report_pdf).toBeUndefined();
        });

        it.each([
            ['null report_html', 'report_html', null],
            ['null report_pdf', 'report_pdf', null],
        ])('accepts %s (defensive back-compat)', async (_label, field, value) => {
            const result = {
                report_url: 'https://example.testrail.io/reports/1',
                [field]: value,
            };
            mockFetch.mockResolvedValueOnce(mockOk(result));
            const got = await client.reports.runReport(1);
            // Cast: `it.each` parametrizes `field` as a generic string, but the
            // interface keys are narrower. Go via `unknown` to access the
            // runtime wire-shape verbatim without weakening the parsed type.
            expect((got as unknown as Record<string, unknown>)[field]).toBeNull();
        });

        it.each([
            ['report_html as number', 'report_html', 42],
            ['report_pdf as boolean', 'report_pdf', true],
            ['report_url missing', 'report_url', undefined],
        ])('rejects malformed run_report response (%s)', async (_label, field, value) => {
            const result: Record<string, unknown> = {
                report_url: 'https://example.testrail.io/reports/1',
            };
            if (value === undefined) {
                delete result[field];
            } else {
                result[field] = value;
            }
            mockFetch.mockResolvedValueOnce(mockOk(result));
            await expect(client.reports.runReport(1)).rejects.toThrow();
        });
    });

    // ── BDDs (Gherkin .feature) ───────────────────────────────────────────────

    describe('getBdd', () => {
        it('should return the BDD content as raw Gherkin text (not JSON)', async () => {
            const gherkin = 'Feature: Login\n  Scenario: Valid credentials\n    Given a user\n';
            // text/plain — must NOT be parsed as JSON.
            mockFetch.mockResolvedValueOnce(
                new Response(gherkin, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' },
                }),
            );
            const result = await client.bdd.getBdd(1);
            expect(result).toBe(gherkin);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('get_bdd/1'),
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('should return an empty string when the case has no BDD content', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
            );
            const result = await client.bdd.getBdd(1);
            expect(result).toBe('');
        });

        it('should throw for invalid caseId', async () => {
            await expect(client.bdd.getBdd(0)).rejects.toThrow('caseId must be a positive integer');
        });

        it('should propagate API errors with structured body', async () => {
            mockFetch.mockResolvedValueOnce(mockErr(404, 'Not Found', 'no such case'));
            await expect(client.bdd.getBdd(1)).rejects.toThrow();
        });
    });

    describe('addBdd', () => {
        it('should upload a .feature file and return the updated Case', async () => {
            const updatedCase = {
                id: 1,
                title: 'BDD case',
                section_id: 1,
                suite_id: 1,
                created_by: 1,
                created_on: 0,
                updated_by: 1,
                updated_on: 0,
            };
            mockFetch.mockResolvedValueOnce(mockOk(updatedCase));
            const blob = new globalThis.Blob(['Feature: x\n'], { type: 'text/plain' });
            const result = await client.bdd.addBdd(1, blob, 'login.feature');
            expect(result).toEqual(updatedCase);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('add_bdd/1'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should accept Uint8Array as file content', async () => {
            const updatedCase = {
                id: 2,
                title: 'BDD case 2',
                section_id: 1,
                suite_id: 1,
                created_by: 1,
                created_on: 0,
                updated_by: 1,
                updated_on: 0,
            };
            mockFetch.mockResolvedValueOnce(mockOk(updatedCase));
            const bytes = new globalThis.TextEncoder().encode('Feature: y\n');
            const result = await client.bdd.addBdd(2, bytes, 'y.feature');
            expect(result.id).toBe(2);
        });

        it('should throw for invalid caseId', async () => {
            const blob = new globalThis.Blob(['data']);
            await expect(client.bdd.addBdd(0, blob, 'x.feature')).rejects.toThrow('caseId must be a positive integer');
        });
    });

    /**
     * Soft-delete mode for the 4 single-entity endpoints that support it
     * (`delete_case`, `delete_run`, `delete_section`, `delete_suite`).
     * Mirrors the existing `deleteCases({soft:true})` coverage:
     *   - URL gains `soft=1` only when options.soft === true
     *   - response is parsed through SoftDeletePreviewSchema (passthrough on
     *     unknown counters)
     *   - default (hard) call shape unchanged
     */
    describe('Single-entity soft-delete mode', () => {
        it('deleteCase: hard delete omits soft=', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await client.cases.deleteCase(42);
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_case/42');
            expect(url).not.toContain('soft=');
        });

        it('deleteCase: soft=true adds soft=1 and returns parsed preview', async () => {
            const preview = { affected_tests: 7 };
            mockFetch.mockResolvedValueOnce(mockOk(preview));
            const result = await client.cases.deleteCase(42, { soft: true });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_case/42');
            expect(url).toContain('soft=1');
            expect(result).toEqual(preview);
        });

        it('deleteCase: passthrough preserves unknown counters', async () => {
            const preview = { affected_tests: 1, some_new_counter: 99 };
            mockFetch.mockResolvedValueOnce(mockOk(preview));
            const result = await client.cases.deleteCase(42, { soft: true });
            expect(result).toEqual(preview);
        });

        it('deleteCase: rejects non-positive id under soft mode too', async () => {
            await expect(client.cases.deleteCase(-1, { soft: true })).rejects.toThrow(
                'caseId must be a positive integer',
            );
        });

        it('deleteRun: hard delete omits soft=', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await client.runs.deleteRun(17);
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_run/17');
            expect(url).not.toContain('soft=');
        });

        it('deleteRun: soft=true adds soft=1 and returns parsed preview', async () => {
            const preview = { affected_tests: 12 };
            mockFetch.mockResolvedValueOnce(mockOk(preview));
            const result = await client.runs.deleteRun(17, { soft: true });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_run/17');
            expect(url).toContain('soft=1');
            expect(result).toEqual(preview);
        });

        it('deleteRun: rejects non-positive id under soft mode too', async () => {
            await expect(client.runs.deleteRun(0, { soft: true })).rejects.toThrow('runId must be a positive integer');
        });

        it('deleteSection: hard delete omits soft=', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await client.sections.deleteSection(9);
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_section/9');
            expect(url).not.toContain('soft=');
        });

        it('deleteSection: soft=true returns parsed preview with affected counts', async () => {
            const preview = { affected_cases: 3, affected_tests: 5 };
            mockFetch.mockResolvedValueOnce(mockOk(preview));
            const result = await client.sections.deleteSection(9, { soft: true });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('soft=1');
            expect(result).toEqual(preview);
        });

        it('deleteSection: rejects non-positive id under soft mode too', async () => {
            await expect(client.sections.deleteSection(-2, { soft: true })).rejects.toThrow(
                'sectionId must be a positive integer',
            );
        });

        it('deleteSuite: hard delete omits soft=', async () => {
            mockFetch.mockResolvedValueOnce(mockEmpty());
            await client.suites.deleteSuite(5);
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('delete_suite/5');
            expect(url).not.toContain('soft=');
        });

        it('deleteSuite: soft=true returns parsed preview with multi-entity counts', async () => {
            const preview = {
                affected_sections: 8,
                affected_cases: 99,
                affected_runs: 4,
                affected_plans: 2,
                affected_tests: 200,
            };
            mockFetch.mockResolvedValueOnce(mockOk(preview));
            const result = await client.suites.deleteSuite(5, { soft: true });
            const url = mockFetch.mock.calls[0]?.[0] as string;
            expect(url).toContain('soft=1');
            expect(result).toEqual(preview);
        });

        it('deleteSuite: rejects non-positive id under soft mode too', async () => {
            await expect(client.suites.deleteSuite(0, { soft: true })).rejects.toThrow(
                'suiteId must be a positive integer',
            );
        });

        /**
         * Regression for the PR-71 review: callers building a
         * `SoftDeleteOptions` value with a dynamically-computed `soft`
         * (boolean, not a literal) must type-check against every delete
         * overload. The literal-true / literal-false overloads still give
         * precise return types when `soft` is statically known; the
         * general boolean overload returns the union for the dynamic case.
         */
        it('accepts a dynamic SoftDeleteOptions variable (boolean soft) on every delete overload', async () => {
            const dyn: import('../src/types.js').SoftDeleteOptions = { soft: Math.random() > 2 }; // always false
            mockFetch.mockResolvedValueOnce(mockEmpty());
            // Each call below must type-check despite the boolean (non-literal) `soft`.
            const a = await client.cases.deleteCase(1, dyn);
            mockFetch.mockResolvedValueOnce(mockEmpty());
            const b = await client.runs.deleteRun(1, dyn);
            mockFetch.mockResolvedValueOnce(mockEmpty());
            const c = await client.sections.deleteSection(1, dyn);
            mockFetch.mockResolvedValueOnce(mockEmpty());
            const d = await client.suites.deleteSuite(1, dyn);
            mockFetch.mockResolvedValueOnce(mockEmpty());
            const e = await client.cases.deleteCases(1, 1, { case_ids: [1] }, dyn);
            // All return the union — under dyn={soft:false} the runtime
            // value is undefined; under {soft:true} it would be a
            // SoftDeletePreview. The point is the call site compiles.
            expect(a).toBeUndefined();
            expect(b).toBeUndefined();
            expect(c).toBeUndefined();
            expect(d).toBeUndefined();
            expect(e).toBeUndefined();
        });
    });
});
