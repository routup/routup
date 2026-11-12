import { MethodName } from '../constants.ts';

/**
 * Request method → the route method its request also matches. This
 * table is the single place that says "HEAD falls through to GET":
 * route matching, the trie's method buckets and the OPTIONS `Allow`
 * header all derive from it.
 */
const METHOD_FALLBACKS: ReadonlyMap<string, MethodName> = new Map([
    [MethodName.HEAD, MethodName.GET],
]);

/**
 * The route method a request method falls through to, if any.
 */
export function getMethodFallback(requestMethod: string): MethodName | undefined {
    return METHOD_FALLBACKS.get(requestMethod);
}

/**
 * Whether a route bound to `routeMethod` matches a request with
 * `requestMethod`. A route without a method matches every request; a
 * method-bound route matches its own method and every request method
 * that falls through to it.
 */
export function matchesRouteMethod(
    routeMethod: string | undefined,
    requestMethod: string,
): boolean {
    return !routeMethod ||
        routeMethod === requestMethod ||
        routeMethod === METHOD_FALLBACKS.get(requestMethod);
}

/**
 * Whether a lookup for `requestMethod` must see routes of every
 * method: `OPTIONS` (to build the `Allow` header) and a lookup
 * without a method.
 */
export function seesEveryMethod(requestMethod: string | undefined): boolean {
    return typeof requestMethod === 'undefined' ||
        requestMethod === MethodName.OPTIONS;
}

/**
 * Add to `allowed` every request method that falls through to an
 * allowed route method (`HEAD` when `GET` is allowed).
 */
export function addImpliedAllowedMethods(allowed: Set<string>): void {
    for (const [requestMethod, routeMethod] of METHOD_FALLBACKS) {
        if (allowed.has(routeMethod)) {
            allowed.add(requestMethod);
        }
    }
}
