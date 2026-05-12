import { buildEtagFn, buildTrustProxyFn } from '../utils/index.ts';
import type { RouterOptions, RouterOptionsInput } from './types.ts';

/**
 * Framework-default router options, applied beneath any router-level
 * overrides. Frozen so accidental mutation (e.g. in a test) can't poison
 * the shared baseline used by every dispatcher event.
 *
 * Used as an identity sentinel by `Router.dispatch`: when
 * `event.resolvedOptions === DEFAULT_ROUTER_OPTIONS`, we know we're at
 * the root of the dispatch chain and can skip the per-request merge by
 * reusing the Router's precomputed `_resolvedRoot`.
 */
export const DEFAULT_ROUTER_OPTIONS: RouterOptions = Object.freeze({
    trustProxy: () => false,
    subdomainOffset: 2,
    etag: buildEtagFn(),
    proxyIpMax: 0,
}) as RouterOptions;

/**
 * Merge child options on top of parent, skipping `undefined` values so an
 * unset child key falls back to the parent. Used by `Router.dispatch` to
 * compose nested router options into a `resolvedOptions` snapshot,
 * replacing the previous per-request walk over `routerPath`.
 */
export function mergeRouterOptions(
    parent: RouterOptions,
    child: Partial<RouterOptions>,
): RouterOptions {
    const result: RouterOptions = { ...parent };
    for (const key in child) {
        const value = (child as Record<string, unknown>)[key];
        if (typeof value !== 'undefined') {
            (result as Record<string, unknown>)[key] = value;
        }
    }
    return result;
}

export function normalizeRouterOptions(input: RouterOptionsInput): Partial<RouterOptions> {
    if (typeof input.etag !== 'undefined' && input.etag !== null) {
        // Keep `false` (and `null` from already-normalized options being
        // re-spread, e.g. via Router.clone) as the literal `null`
        // sentinel so toResponse() can synchronously skip the ETag path.
        // A truthy no-op fn (the previous behavior) forced an
        // `await applyEtag(...)` microtask hop on every request.
        input.etag = input.etag === false ?
            null :
            buildEtagFn(input.etag);
    }

    if (typeof input.trustProxy !== 'undefined') {
        input.trustProxy = buildTrustProxyFn(input.trustProxy);
    }

    if (typeof input.timeout !== 'undefined') {
        if (
            typeof input.timeout !== 'number' ||
            !Number.isFinite(input.timeout) ||
            input.timeout <= 0
        ) {
            delete input.timeout;
        }
    }

    if (typeof input.handlerTimeout !== 'undefined') {
        if (
            typeof input.handlerTimeout !== 'number' ||
            !Number.isFinite(input.handlerTimeout) ||
            input.handlerTimeout <= 0
        ) {
            delete input.handlerTimeout;
        }
    }

    return input as Partial<RouterOptions>;
}
