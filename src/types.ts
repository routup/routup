import type { MethodName } from './constants.ts';
import type { Path } from './path/index.ts';

/**
 * Constraint on `IRouter<T>`'s data slot — routers store object-shaped
 * per-route data (handlers, child apps, custom records). Primitives
 * (`string`, `number`) aren't supported as route data; if you need to
 * carry a primitive, wrap it in an object.
 */
export type ObjectLiteral = Record<string, any>;

/**
 * A registered route — what `IRouter.add` consumes. Only `path` and
 * `method` are routing-relevant; `data` is opaque to the router and
 * returned as-is on match. Apps store their own discrimination
 * (e.g. handler-vs-nested-app) inside `data`.
 *
 * **Match-semantics convention:**
 * - `method !== undefined` → router treats the entry as method-bound
 *   and matches the path **exactly**.
 * - `method === undefined` → entry is method-agnostic (middleware /
 *   nested app) and matches by **prefix**.
 *
 * Custom `IRouter` implementations should honor this convention so
 * apps can swap routers transparently.
 */
export type Route<T extends ObjectLiteral = ObjectLiteral> = {
    /**
     * Mount path.
     * - `undefined` means "no path" (route matches every request).
     * - `'/'` behaves like "no path" for method-agnostic prefix routes
     *   (middleware / mount-less nested apps).
     * - Method-bound `'/'` is treated as an exact root match
     *   (`app.get('/', …)` matches only the root).
     */
    path?: Path;
    /**
     * Bound HTTP method. When set, the router treats this route as an
     * exact match; when undefined, the route matches by prefix.
     */
    method?: MethodName;
    /**
     * Opaque to the router. Returned via `RouteMatch.route.data` on
     * match; consumers (typically `App`) decide what's inside.
     */
    data: T;
};

/**
 * A single matched route returned by `IRouter.lookup`. The dispatch
 * loop consumes these instead of walking the raw routes — `params`
 * are pre-extracted at lookup time so we don't re-run the matcher
 * later, and `path` (when set) tells the loop how much of
 * `event.path` to strip when recursing into a child app.
 */
export type RouteMatch<T extends ObjectLiteral = ObjectLiteral> = {
    route: Route<T>;
    /**
     * Registration index in the router. Used by the dispatch loop's
     * `setNext` continuation ("resume from index + 1") and by
     * `App.clone()` to re-register routes in their original order.
     */
    index: number;
    /**
     * Path params extracted from the route's matcher. Empty object
     * when the route has no path or no params.
     */
    params: Record<string, any>;
    /**
     * For routes with a matcher: the path substring the matcher
     * consumed. Used by `executePipelineStepChildDispatch` to strip
     * the matched prefix off `event.path` before dispatching into a
     * child app. Undefined for routes without a matcher.
     */
    path?: string;
};
