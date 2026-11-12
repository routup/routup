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
 * A single matched route returned by `IRouter.lookup`. The App walks
 * these in list order — `params` are pre-extracted at lookup time so
 * the matcher does not run again, and `path` (when set) becomes the
 * handler's `event.mountPath`.
 */
export type RouteMatch<T extends ObjectLiteral = ObjectLiteral> = {
    route: Route<T>;
    /**
     * Registration index in the router: the position of the route in
     * `add()` order. Ascending across a lookup result. The App walks
     * the result by list position and does not read it; `TrieRouter`
     * sorts and deduplicates its candidates by it.
     */
    index: number;
    /**
     * Path params extracted from the route's matcher. Values are
     * `string` (or `undefined` for an optional param that didn't
     * match). Empty object when the route has no path or no params.
     */
    params: Record<string, string | undefined>;
    /**
     * For routes with a matcher: the path prefix the matcher
     * consumed. The App sets it as `event.mountPath` while the
     * matched handler runs. Undefined for routes without a matcher.
     */
    path?: string;
};
