import type { TestRailConfig } from '../types.js';

export interface AuthFlags {
    baseUrl: string | undefined;
    email: string | undefined;
    apiKey: string | undefined;
}

export interface AuthEnv {
    TESTRAIL_BASE_URL?: string;
    TESTRAIL_EMAIL?: string;
    TESTRAIL_API_KEY?: string;
}

export type AuthResolution = { ok: true; config: TestRailConfig } | { ok: false; error: string };

export const MISSING_AUTH_MESSAGE =
    'Missing auth. Set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, TESTRAIL_API_KEY or use --base-url, --email, --api-key flags.';

export function resolveAuth(flags: AuthFlags, env: AuthEnv): AuthResolution {
    const baseUrl = flags.baseUrl ?? env.TESTRAIL_BASE_URL;
    const email = flags.email ?? env.TESTRAIL_EMAIL;
    const apiKey = flags.apiKey ?? env.TESTRAIL_API_KEY;

    if (
        baseUrl === undefined ||
        baseUrl === '' ||
        email === undefined ||
        email === '' ||
        apiKey === undefined ||
        apiKey === ''
    ) {
        return { ok: false, error: MISSING_AUTH_MESSAGE };
    }

    return { ok: true, config: { baseUrl, email, apiKey } };
}
