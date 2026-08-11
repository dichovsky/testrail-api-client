import { TestRailValidationError } from '../errors.js';
import { UserSchema, GroupSchema } from '../schemas.js';
import type { AddGroupPayload, Group, UpdateGroupPayload, UserAddPayload, UserUpdatePayload } from '../schemas.js';
import { TestRailClientCore } from '../client-core.js';
import type { User } from '../types.js';
import { validateId, validatePaginationParams } from '../validation.js';
import { buildEndpoint } from '../url.js';
import { collectAllPages, decodePage } from '../pagination.js';
import type { Page, PaginationRequest, PaginationSafetyOptions } from '../pagination.js';
import { listOf, pageOf, unwrapList } from './list.js';

export type GetAllGroupsOptions = PaginationSafetyOptions;

type PaginationFetchControls = Partial<Pick<PaginationRequest, 'bypassCache' | 'remainingTimeMs'>> & {
    pageProjection?: boolean;
};

interface GroupPaginationControls {
    limit?: number;
    offset?: number;
}

// Lightweight sanity guard for the get_user_by_email lookup input: exactly one
// '@' with non-empty, whitespace-free local and domain parts. Deliberately does
// NOT require a dotted (FQDN) domain — RFC 5321 permits single-label domains
// (admin@localhost, user@corp) and domain-literals (user@[192.168.1.1]), which
// self-hosted / LDAP / AD / SSO instances legitimately store, so they must reach
// the API rather than being rejected client-side (#236). Authoritative format
// validation is TestRail's responsibility.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

export class UsersModule {
    constructor(private readonly client: TestRailClientCore) {}

    /** @testrail GET get_user/{user_id} */
    async getUser(userId: number): Promise<User> {
        validateId(userId, 'userId');
        return this.client.request<User>({
            method: 'GET',
            endpoint: `get_user/${userId}`,
            schema: UserSchema,
        });
    }

    /** @testrail GET get_user_by_email */
    async getUserByEmail(email: string): Promise<User> {
        if (!EMAIL_REGEX.test(email)) {
            throw new TestRailValidationError('Invalid email format');
        }

        const endpoint = buildEndpoint('get_user_by_email', { email });
        return this.client.request<User>({ method: 'GET', endpoint, schema: UserSchema });
    }

    /** @testrail GET get_users */
    async getUsers(limit?: number, offset?: number, projectId?: number): Promise<User[]> {
        validatePaginationParams(limit, offset);
        if (projectId !== undefined) {
            validateId(projectId, 'projectId');
        }

        const endpoint = buildEndpoint(projectId !== undefined ? `get_users/${projectId}` : 'get_users', {
            limit,
            offset,
        });

        // `get_users` is the one bulk endpoint whose documentation shows a bare
        // top-level array and lists no `limit`/`offset` parameters, while
        // projects/groups/roles/labels all document the envelope. #248 proved
        // this exact wrapper-only assumption wrong for six other methods, so
        // accept both shapes rather than betting on the doc.
        // SPEC #1.5 — `{ users: null }` is a valid empty wrapper, hence `.nullable()`.
        const raw = await this.client.request<User[] | { users?: User[] }>({
            method: 'GET',
            endpoint,
            schema: listOf('users', UserSchema),
        });
        return unwrapList('users', raw);
    }

    /** @testrail GET get_current_user */
    async getCurrentUser(): Promise<User> {
        return this.client.request<User>({
            method: 'GET',
            endpoint: 'get_current_user',
            schema: UserSchema,
        });
    }

    /** @testrail POST add_user */
    async addUser(payload: UserAddPayload): Promise<User> {
        return this.client.request<User>({
            method: 'POST',
            endpoint: 'add_user',
            schema: UserSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_user/{user_id} */
    async updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
        validateId(userId, 'userId');
        return this.client.request<User>({
            method: 'POST',
            endpoint: `update_user/${userId}`,
            schema: UserSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail GET get_group/{group_id} */
    async getGroup(groupId: number): Promise<Group> {
        validateId(groupId, 'groupId');
        return this.client.request<Group>({
            method: 'GET',
            endpoint: `get_group/${groupId}`,
            schema: GroupSchema,
        });
    }

    /** @testrail GET get_groups */
    async getGroups(): Promise<Group[]> {
        return unwrapList<Group>('groups', await this.requestGroups());
    }

    /** Get one response page without sending undocumented request controls. */
    async getGroupsPage(): Promise<Page<Group>> {
        return decodePage<Group>('groups', await this.requestGroups(undefined, { pageProjection: true }));
    }

    /** Get every group under the configured pagination safety bounds. */
    async getAllGroups(options?: GetAllGroupsOptions): Promise<Group[]> {
        return collectAllPages<Group>({
            ...(options ?? {}),
            requestControls: false,
            fetchPage: (request) =>
                this.requestGroups(
                    {
                        ...(request.limit === undefined ? {} : { limit: request.limit }),
                        ...(request.offset === undefined ? {} : { offset: request.offset }),
                    },
                    {
                        bypassCache: request.bypassCache,
                        remainingTimeMs: request.remainingTimeMs,
                    },
                ).then((raw) => decodePage<Group>('groups', raw)),
        });
    }

    private async requestGroups(
        pagination?: GroupPaginationControls,
        controls?: PaginationFetchControls,
    ): Promise<unknown> {
        validatePaginationParams(pagination?.limit, pagination?.offset);
        const endpoint = buildEndpoint('get_groups', {
            limit: pagination?.limit,
            offset: pagination?.offset,
        });
        const pageProjection = controls?.pageProjection === true || controls?.bypassCache === true;
        return this.client.request<unknown>({
            method: 'GET',
            endpoint,
            schema: pageProjection ? pageOf('groups', GroupSchema) : listOf('groups', GroupSchema),
            ...(pageProjection && { cacheVariant: 'page' as const }),
            ...(controls?.bypassCache !== undefined && { bypassCache: controls.bypassCache }),
            ...(controls?.remainingTimeMs !== undefined && { remainingTimeMs: controls.remainingTimeMs }),
        });
    }

    /** @testrail POST add_group */
    async addGroup(payload: AddGroupPayload): Promise<Group> {
        return this.client.request<Group>({
            method: 'POST',
            endpoint: 'add_group',
            schema: GroupSchema,
            body: { kind: 'json', data: payload },
        });
    }

    /** @testrail POST update_group/{group_id} */
    async updateGroup(groupId: number, payload: UpdateGroupPayload): Promise<Group> {
        validateId(groupId, 'groupId');
        // Live-instance audit: TestRail requires `group_id` in the BODY (not just
        // the path) — a body without it is rejected with HTTP 400 "Field :group_id
        // is a required field". Inject the path id (caller's payload cannot override it).
        return this.client.request<Group>({
            method: 'POST',
            endpoint: `update_group/${groupId}`,
            schema: GroupSchema,
            body: { kind: 'json', data: { ...payload, group_id: groupId } },
        });
    }

    /** @testrail POST delete_group/{group_id} */
    async deleteGroup(groupId: number): Promise<void> {
        validateId(groupId, 'groupId');
        await this.client.request<void>({
            method: 'POST',
            endpoint: `delete_group/${groupId}`,
        });
    }
}
