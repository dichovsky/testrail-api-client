/**
 * Property-based fuzz tests for CLI arg parsing helpers.
 *
 * Opt-in: these tests only run when `RUN_FUZZ=1` is set in the environment.
 * Default `npm test` skips them to keep the test suite deterministic and fast.
 *
 * Run with:
 *   RUN_FUZZ=1 npx vitest run tests/cli-fuzz.test.ts
 *
 * Targets:
 *   - parseId   (src/cli/ids.ts)   — strict positive-integer parser
 *   - optInt    (src/cli/ids.ts)   — lenient non-negative parser, returns undefined on bad input
 *   - dispatch  (src/cli/dispatch.ts) — resource:action router
 *   - resolveAuth (src/cli/auth.ts) — credential resolution from flags + env
 *
 * Why property-based? Hand-written unit tests enumerate known edge cases.
 * fast-check generates hundreds of random inputs and shrinks failing ones to
 * the minimal counter-example — catching coercion holes (e.g. "1e2", "0x1",
 * "  5  ") that are hard to enumerate exhaustively by hand.
 */
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { parseId, optInt, IdParseError } from '../src/cli/ids.js';
import { dispatch, getRegisteredActions } from '../src/cli/dispatch.js';
import { resolveAuth } from '../src/cli/auth.js';
import type { AuthEnv } from '../src/cli/auth.js';

const RUN_FUZZ = process.env['RUN_FUZZ'] === '1';

// ── 1. parseId ───────────────────────────────────────────────────────────────
//
// Invariants:
//   A. Any string that is NOT a canonical positive integer → throws IdParseError.
//   B. Any canonical positive integer string (digits only, no leading zeros,
//      value >= 1) → returns the numeric value and never throws.
//
// "Canonical" means the string matches /^[1-9]\d*$/ exactly. Anything else —
// leading zeros, signs, whitespace, decimals, hex, scientific notation,
// Unicode digit lookalikes — must be rejected.

describe.skipIf(!RUN_FUZZ)('CLI fuzz: parseId', () => {
    const VALID_POSITIVE_INT = /^[1-9]\d*$/;

    it('rejects any string that is not a canonical positive integer', () => {
        // Sample from all possible strings; filter out the ones that ARE valid
        // so we only test the reject path. The vast majority of random strings
        // will fail the regex, so numRuns samples are almost entirely invalid.
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20 }).filter((s) => !VALID_POSITIVE_INT.test(s)),
                (invalidInput) => {
                    let threw = false;
                    try {
                        parseId(invalidInput, 'fuzz-id');
                    } catch (err) {
                        threw = true;
                        if (!(err instanceof IdParseError)) {
                            throw new Error(
                                `parseId threw unexpected error type for ${JSON.stringify(invalidInput)}: ${String(err)}`,
                                { cause: err },
                            );
                        }
                    }
                    if (!threw) {
                        throw new Error(`parseId('${invalidInput}') did not throw for a non-positive-integer string`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('rejects undefined (missing arg)', () => {
        let threw = false;
        try {
            parseId(undefined, 'fuzz-id');
        } catch (err) {
            threw = true;
            if (!(err instanceof IdParseError)) {
                throw new Error(`parseId(undefined) threw unexpected type: ${String(err)}`, { cause: err });
            }
        }
        if (!threw) {
            throw new Error('parseId(undefined) should always throw IdParseError');
        }
    });

    it('rejects negative integers (string form)', () => {
        fc.assert(
            fc.property(
                fc.integer({ max: -1 }).map((n) => String(n)),
                (negStr) => {
                    let threw = false;
                    try {
                        parseId(negStr, 'fuzz-id');
                    } catch (err) {
                        threw = true;
                        if (!(err instanceof IdParseError)) {
                            throw new Error(`Unexpected error type for ${negStr}: ${String(err)}`, { cause: err });
                        }
                    }
                    if (!threw) {
                        throw new Error(`parseId('${negStr}') should reject negative integers`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('rejects zero', () => {
        let threw = false;
        try {
            parseId('0', 'fuzz-id');
        } catch (err) {
            threw = true;
            if (!(err instanceof IdParseError)) {
                throw new Error(`Unexpected error type for '0': ${String(err)}`, { cause: err });
            }
        }
        if (!threw) {
            throw new Error("parseId('0') should always throw IdParseError");
        }
    });

    it('accepts any canonical positive integer string and returns the numeric value', () => {
        fc.assert(
            fc.property(
                // Integers in [1, 2^31-1] — within safe integer range and
                // typical TestRail API ID space. toString() always produces a
                // canonical decimal form (no leading zeros, no sign).
                fc.integer({ min: 1, max: 2147483647 }),
                (n) => {
                    const result = parseId(String(n), 'fuzz-id');
                    if (result !== n) {
                        throw new Error(`parseId('${n}') returned ${result}, expected ${n}`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('rejects strings with leading zeros (non-canonical form)', () => {
        fc.assert(
            fc.property(
                // "0" followed by at least one more digit: "01", "007", etc.
                fc
                    .integer({ min: 1, max: 9 })
                    .chain((leading) => fc.integer({ min: 0, max: 999 }).map((rest) => `0${leading}${String(rest)}`)),
                (leadingZeroStr) => {
                    let threw = false;
                    try {
                        parseId(leadingZeroStr, 'fuzz-id');
                    } catch (err) {
                        threw = true;
                        if (!(err instanceof IdParseError)) {
                            throw new Error(`Unexpected error type for '${leadingZeroStr}': ${String(err)}`, {
                                cause: err,
                            });
                        }
                    }
                    if (!threw) {
                        throw new Error(`parseId('${leadingZeroStr}') should reject leading zeros`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('never silently corrupts valid positive integer strings (round-trip identity)', () => {
        // For any string that IS a canonical positive integer, parseId must
        // return the same numeric value that Number() would return.
        // This pins the contract: no coercion, no truncation, no silent failure.
        const VALID_POSITIVE_INT_RE = /^[1-9]\d*$/;
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 15 }).filter((s) => VALID_POSITIVE_INT_RE.test(s)),
                (validStr) => {
                    const result = parseId(validStr, 'fuzz-id');
                    const expected = Number(validStr);
                    if (result !== expected) {
                        throw new Error(`parseId('${validStr}') returned ${result}, expected ${expected}`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });
});

// ── 2. optInt ────────────────────────────────────────────────────────────────
//
// Invariants:
//   A. undefined input → undefined output (always).
//   B. Any string that is NOT a canonical non-negative integer → undefined.
//   C. Any canonical non-negative integer string ("0" or /^[1-9]\d*$/) →
//      returns the numeric value.
//   D. Output is ALWAYS either undefined or a non-negative safe integer;
//      never a float, NaN, negative, or Infinity.

describe.skipIf(!RUN_FUZZ)('CLI fuzz: optInt', () => {
    const VALID_NON_NEG_INT = /^(0|[1-9]\d*)$/;

    it('returns undefined for undefined input', () => {
        const result = optInt(undefined);
        if (result !== undefined) {
            throw new Error(`optInt(undefined) returned ${result}, expected undefined`);
        }
    });

    it('returns undefined for any non-canonical non-negative integer string', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20 }).filter((s) => !VALID_NON_NEG_INT.test(s)),
                (invalidInput) => {
                    const result = optInt(invalidInput);
                    if (result !== undefined) {
                        throw new Error(
                            `optInt(${JSON.stringify(invalidInput)}) returned ${result}, expected undefined for non-canonical input`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('returns undefined for negative integer strings', () => {
        fc.assert(
            fc.property(
                fc.integer({ max: -1 }).map((n) => String(n)),
                (negStr) => {
                    const result = optInt(negStr);
                    if (result !== undefined) {
                        throw new Error(
                            `optInt('${negStr}') returned ${result}, expected undefined for negative input`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('accepts "0" and returns 0', () => {
        const result = optInt('0');
        if (result !== 0) {
            throw new Error(`optInt('0') returned ${result}, expected 0`);
        }
    });

    it('accepts canonical positive integer strings and returns the numeric value', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 2147483647 }), (n) => {
                const result = optInt(String(n));
                if (result !== n) {
                    throw new Error(`optInt('${n}') returned ${result}, expected ${n}`);
                }
            }),
            { numRuns: 200 },
        );
    });

    it('output is always undefined or a non-negative safe integer (never NaN, float, Infinity, or negative)', () => {
        fc.assert(
            fc.property(fc.oneof(fc.string({ minLength: 0, maxLength: 20 }), fc.constant(undefined)), (input) => {
                const result = optInt(input);
                if (result === undefined) return;
                if (!Number.isSafeInteger(result)) {
                    throw new Error(`optInt(${JSON.stringify(input)}) returned non-safe-integer: ${result}`);
                }
                if (result < 0) {
                    throw new Error(`optInt(${JSON.stringify(input)}) returned negative: ${result}`);
                }
            }),
            { numRuns: 200 },
        );
    });
});

// ── 3. dispatch ──────────────────────────────────────────────────────────────
//
// Invariants:
//   A. Every registered HANDLERS key → dispatch returns ok=true with a
//      function handler. No registered key may produce ok=false.
//   B. Any resource:action pair NOT in HANDLERS → dispatch returns ok=false
//      with a non-empty error string. Never silent failure, never wrong handler.
//   C. When ok=false, the error string is always a non-empty string.
//   D. When ok=true, handler is always a function.
//
// Prototype-key inputs (e.g. "toString", "__proto__", "constructor") are
// explicitly covered as a regression in tests/cli-helpers.test.ts after this
// fuzz suite uncovered an unguarded `RESOURCES[resource]` access. Both this
// suite and that one now exercise the post-fix `Object.hasOwn` guard.

describe.skipIf(!RUN_FUZZ)('CLI fuzz: dispatch', () => {
    const registeredKeys = getRegisteredActions();
    const registeredPairs = registeredKeys.map((key) => {
        const colonIdx = key.indexOf(':');
        return { resource: key.slice(0, colonIdx), action: key.slice(colonIdx + 1) };
    });

    it('resolves every registered resource:action pair to a function handler', () => {
        // Not random — verify all known pairs pass. This is a completeness check
        // complementing the invariant below.
        for (const { resource, action } of registeredPairs) {
            const result = dispatch(resource, action);
            if (!result.ok) {
                throw new Error(
                    `dispatch('${resource}', '${action}') returned ok=false for a registered key: ${result.error}`,
                );
            }
            if (typeof result.handler !== 'function') {
                throw new Error(
                    `dispatch('${resource}', '${action}') handler is not a function: ${typeof result.handler}`,
                );
            }
        }
    });

    it('returns ok=false with non-empty error for any unknown resource string', () => {
        const knownResources = new Set(registeredPairs.map((p) => p.resource));
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 30 })
                    // Exclude known registered resources. Object.prototype keys
                    // (toString, __proto__, etc.) are intentionally NOT excluded —
                    // the dispatch.ts `Object.hasOwn` guard now handles them
                    // (regression covered in tests/cli-helpers.test.ts).
                    .filter((s) => !knownResources.has(s)),
                fc.string({ minLength: 0, maxLength: 20 }),
                (unknownResource, anyAction) => {
                    const result = dispatch(unknownResource, anyAction);
                    if (result.ok) {
                        throw new Error(
                            `dispatch('${unknownResource}', '${anyAction}') returned ok=true for an unknown resource`,
                        );
                    }
                    if (typeof result.error !== 'string' || result.error.length === 0) {
                        throw new Error(
                            `dispatch('${unknownResource}', '${anyAction}') returned ok=false with empty/non-string error`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('returns ok=false with non-empty error for unknown action on a valid resource', () => {
        // For each registered resource, fuzz actions that are not registered for it.
        if (registeredPairs.length === 0) return;

        // Build resource → valid actions map
        const resourceActions = new Map<string, Set<string>>();
        for (const { resource, action } of registeredPairs) {
            const existing = resourceActions.get(resource);
            if (existing === undefined) {
                resourceActions.set(resource, new Set([action]));
            } else {
                existing.add(action);
            }
        }

        const resourceList = Array.from(resourceActions.keys());

        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: resourceList.length - 1 }).chain((idx) => {
                    const resource = resourceList[idx] as string;
                    const validActions = resourceActions.get(resource) ?? new Set<string>();
                    return fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter((a) => !validActions.has(a))
                        .map((unknownAction) => ({ resource, unknownAction }));
                }),
                ({ resource, unknownAction }) => {
                    const result = dispatch(resource, unknownAction);
                    if (result.ok) {
                        throw new Error(
                            `dispatch('${resource}', '${unknownAction}') returned ok=true for an unregistered action`,
                        );
                    }
                    if (typeof result.error !== 'string' || result.error.length === 0) {
                        throw new Error(
                            `dispatch('${resource}', '${unknownAction}') returned ok=false with empty/non-string error`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('never returns a wrong handler (ok=true handler must be stable across calls)', () => {
        // Verify that for each registered key, the handler returned is exactly
        // the same reference on successive calls (no random selection from pool).
        if (registeredPairs.length < 2) return;

        fc.assert(
            fc.property(fc.integer({ min: 0, max: registeredPairs.length - 1 }), (idx) => {
                const pair = registeredPairs[idx];
                if (pair === undefined) return;
                const r1 = dispatch(pair.resource, pair.action);
                const r2 = dispatch(pair.resource, pair.action);
                if (!r1.ok || !r2.ok) {
                    throw new Error(`dispatch for registered key ${pair.resource}:${pair.action} returned ok=false`);
                }
                if (r1.handler !== r2.handler) {
                    throw new Error(
                        `dispatch for ${pair.resource}:${pair.action} returned different handler refs on successive calls`,
                    );
                }
            }),
            { numRuns: 200 },
        );
    });

    it('output is always ok=true|false (never undefined, never throws) for any input', () => {
        // No filter on Object.prototype keys — the `Object.hasOwn` guard in
        // dispatch() now handles `toString`, `__proto__`, `constructor`, etc.
        // cleanly (regression pinned in tests/cli-helpers.test.ts).
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20 }),
                fc.string({ minLength: 0, maxLength: 20 }),
                (resource, action) => {
                    let result: ReturnType<typeof dispatch> | undefined;
                    try {
                        result = dispatch(resource, action);
                    } catch (err) {
                        throw new Error(`dispatch('${resource}', '${action}') threw unexpectedly: ${String(err)}`, {
                            cause: err,
                        });
                    }
                    if (result === undefined) {
                        throw new Error(`dispatch('${resource}', '${action}') returned undefined`);
                    }
                    const { ok } = result;
                    if (ok !== true && ok !== false) {
                        throw new Error(
                            `dispatch('${resource}', '${action}') returned unexpected ok value: ${String(ok)}`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });
});

// ── 4. resolveAuth ───────────────────────────────────────────────────────────
//
// Invariants:
//   A. When ok=true, config has non-empty baseUrl, email, apiKey strings.
//   B. When ok=false, error is a non-empty string.
//   C. Result is always ok=true OR ok=false; never undefined or throws.
//   D. Flags take precedence over env for each field independently.
//   E. If any of the three fields is empty/undefined from both flags and env,
//      result must be ok=false.
//   F. If all three fields are non-empty (from flags, env, or mix), result
//      must be ok=true.

describe.skipIf(!RUN_FUZZ)('CLI fuzz: resolveAuth', () => {
    // Arbitrary string generators: non-empty and optional
    const nonEmptyStr = fc.string({ minLength: 1, maxLength: 50 });
    const maybeStr = fc.option(nonEmptyStr, { nil: undefined });

    // Build an AuthEnv object omitting keys when values are undefined,
    // satisfying `exactOptionalPropertyTypes: true`.
    function makeAuthEnv(url: string | undefined, email: string | undefined, key: string | undefined): AuthEnv {
        const env: AuthEnv = {};
        if (url !== undefined) env.TESTRAIL_BASE_URL = url;
        if (email !== undefined) env.TESTRAIL_EMAIL = email;
        if (key !== undefined) env.TESTRAIL_API_KEY = key;
        return env;
    }

    it('never throws for any combination of flag/env inputs', () => {
        fc.assert(
            fc.property(
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                (flagUrl, flagEmail, flagKey, envUrl, envEmail, envKey) => {
                    try {
                        resolveAuth(
                            { baseUrl: flagUrl, email: flagEmail, apiKey: flagKey },
                            makeAuthEnv(envUrl, envEmail, envKey),
                        );
                    } catch (err) {
                        throw new Error(`resolveAuth threw unexpectedly: ${String(err)}`, { cause: err });
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('returns ok=true with non-empty config fields when all three fields are resolvable', () => {
        fc.assert(
            fc.property(
                // Flags: any combination of set/unset
                maybeStr,
                maybeStr,
                maybeStr,
                // Env: fallback; ensures at least one source is non-empty per field
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                (flagUrl, flagEmail, flagKey, envUrl, envEmail, envKey) => {
                    const result = resolveAuth(
                        { baseUrl: flagUrl, email: flagEmail, apiKey: flagKey },
                        makeAuthEnv(envUrl, envEmail, envKey),
                    );
                    // With non-empty env fallbacks, all three fields always resolve
                    if (!result.ok) {
                        throw new Error(`resolveAuth returned ok=false when all fields resolvable: ${result.error}`);
                    }
                    if (
                        result.config.baseUrl.length === 0 ||
                        result.config.email.length === 0 ||
                        result.config.apiKey.length === 0
                    ) {
                        throw new Error(
                            `resolveAuth returned ok=true but config has empty fields: ${JSON.stringify(result.config)}`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('returns ok=false when baseUrl is absent from both flags and env', () => {
        // Force baseUrl to be missing (undefined or empty string) from both sources.
        // email and apiKey are present to isolate the missing-baseUrl case.
        fc.assert(
            fc.property(
                fc.oneof(fc.constant(''), fc.constant(undefined)),
                fc.oneof(fc.constant(''), fc.constant(undefined)),
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                (flagUrl, envUrl, flagEmail, flagKey, envEmail, envKey) => {
                    const result = resolveAuth(
                        { baseUrl: flagUrl, email: flagEmail, apiKey: flagKey },
                        makeAuthEnv(envUrl, envEmail, envKey),
                    );
                    if (result.ok) {
                        throw new Error(`resolveAuth returned ok=true when baseUrl is absent from both sources`);
                    }
                    if (typeof result.error !== 'string' || result.error.length === 0) {
                        throw new Error('resolveAuth returned ok=false with empty/non-string error');
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('flags take precedence over env for each field', () => {
        fc.assert(
            fc.property(
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                nonEmptyStr,
                (flagUrl, flagEmail, flagKey, envUrl, envEmail, envKey) => {
                    const result = resolveAuth(
                        { baseUrl: flagUrl, email: flagEmail, apiKey: flagKey },
                        makeAuthEnv(envUrl, envEmail, envKey),
                    );
                    if (!result.ok) {
                        throw new Error(`resolveAuth returned ok=false when all fields set: ${result.error}`);
                    }
                    // Flags win: each config field must equal the flag value
                    if (result.config.baseUrl !== flagUrl) {
                        throw new Error(
                            `baseUrl precedence: expected flag='${flagUrl}' but got '${result.config.baseUrl}'`,
                        );
                    }
                    if (result.config.email !== flagEmail) {
                        throw new Error(
                            `email precedence: expected flag='${flagEmail}' but got '${result.config.email}'`,
                        );
                    }
                    if (result.config.apiKey !== flagKey) {
                        throw new Error(
                            `apiKey precedence: expected flag='${flagKey}' but got '${result.config.apiKey}'`,
                        );
                    }
                },
            ),
            { numRuns: 200 },
        );
    });

    it('output is always ok=true|false, never undefined', () => {
        fc.assert(
            fc.property(
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                maybeStr,
                (flagUrl, flagEmail, flagKey, envUrl, envEmail, envKey) => {
                    const result = resolveAuth(
                        { baseUrl: flagUrl, email: flagEmail, apiKey: flagKey },
                        makeAuthEnv(envUrl, envEmail, envKey),
                    );
                    if (result === undefined) {
                        throw new Error('resolveAuth returned undefined');
                    }
                    const { ok } = result;
                    if (ok !== true && ok !== false) {
                        throw new Error(`resolveAuth returned unexpected ok value: ${String(ok)}`);
                    }
                },
            ),
            { numRuns: 200 },
        );
    });
});
