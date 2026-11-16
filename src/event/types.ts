import type { ServerRequest } from 'srvx';
import type { AppOptions } from '../app/types.ts';
import type { MethodNameLike } from '../constants.ts';

export type AppResponse = {
    status: number;
    headers: Headers;
};

export type AppRequest = ServerRequest;

export type NextFn = (error?: Error) => unknown | Promise<unknown>;

/**
 * A method-bound route as `event.route` names it. One frozen value per
 * registered route, shared by every request the route serves.
 */
export type AppEventRoute = {
    /**
     * The route's full pattern as the router holds it, composed over
     * every mount (e.g. `/api/notes/:id`).
     */
    readonly path: string;

    /**
     * Pattern prefix the route was mounted under: the part of `path`
     * that did not come from the route's own registration (the App's
     * `path` option and every mount path above it), `'/'` without any.
     * `path` is `pathPrefix` joined with the path given to `get()`,
     * `post()`, ... A pattern: a mount path may carry parameters.
     */
    readonly pathPrefix: string;

    /**
     * The method the route is bound to, as registered (`GET` also when
     * the route serves a `HEAD` request).
     */
    readonly method: string;
};

export interface IAppEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: AppRequest;

    /**
     * Route parameters extracted from the URL path pattern. Values
     * are `string` (or `undefined` for an optional param that
     * didn't match) — both the trie router (`extractTrieParams`)
     * and the linear router (path-to-regexp output) only ever
     * produce string values.
     */
    readonly params: Record<string, string | undefined>;

    /**
     * Path of the request URL (its pathname, without the query
     * string). The full path at every handler, also inside a mounted
     * App; strip `mountPath` off it for a mount-relative path.
     */
    readonly path: string;

    /**
     * HTTP method (GET, POST, PUT, etc.). Typed as the canonical
     * `MethodName` set with an open-enum escape hatch — non-
     * standard methods (`PROPFIND`, custom verbs) still type-check
     * while standard ones autocomplete.
     */
    readonly method: MethodNameLike;

    /**
     * Prefix the active route was matched on (the substring of the
     * request path the matcher consumed). Set per dispatched handler
     * and restored when the handler returns; useful for static-asset
     * / mount-aware helpers that need to strip this off `path` to
     * recover a mount-relative path. Concrete and per handler, unlike
     * `route.pathPrefix`, the pattern prefix of the endpoint's route,
     * per request.
     */
    readonly mountPath: string;

    /**
     * The last method-bound route dispatched in this request (its
     * pattern, mount prefix and method). Request-wide: every event
     * of the request reads the current value, so a middleware sees
     * the route that answered after `await event.next()`.
     *
     * `undefined` until a method-bound route ran: before
     * `event.next()` in a middleware, for a request only middleware
     * or method-less mounts handled (a 404), and for an `OPTIONS`
     * request answered without a route. Never reset during the
     * request: when a route throws and an error handler answers, it
     * names the route that threw.
     */
    readonly route?: AppEventRoute;

    /**
     * Web Standard Headers from the request.
     */
    readonly headers: Headers;

    /**
     * Lazily-parsed URL search parameters.
     *
     * For advanced query parsing (arrays, nesting), use `@routup/query`.
     */
    readonly searchParams: URLSearchParams;

    /**
     * Response accumulator — set status/headers before returning a plain value.
     *
     * If the handler returns a `Response` object directly, these values are
     * ignored. They only apply when returning plain values (string, object, etc.)
     * that go through `toResponse()`.
     */
    readonly response: AppResponse;

    /**
     * Per-request store for caching and plugin state.
     *
     * Use symbol keys (e.g., `Symbol.for('routup:body')`) to avoid collisions.
     * Data is garbage collected with the event when the request completes.
     */
    readonly store: Record<string | symbol, unknown>;

    /**
     * Pre-resolved router options for the current dispatch context.
     *
     * Contains merged options from the router path stack with defaults applied.
     */
    readonly appOptions: Readonly<AppOptions>;

    /**
     * Abort signal tied to the request lifecycle.
     *
     * When a `timeout` router option is set, this signal aborts after the
     * specified duration. Handlers performing long I/O (fetch, streams, DB queries)
     * can pass this signal to those operations for cooperative cancellation.
     */
    readonly signal: AbortSignal;

    /**
     * Call the next handler in the pipeline (onion model).
     *
     * The result is cached — calling `next()` multiple times returns the same response.
     * Returns the downstream `Response`, or `undefined` if no handler matched.
     */
    next(error?: Error): Promise<Response | undefined>;

    /**
     * Whether `next()` has been invoked on this event.
     *
     * Used by the dispatch pipeline to disambiguate an `undefined` return value:
     * a handler that returns `undefined` after calling `next()` is forwarding the
     * downstream result; one that returns `undefined` without calling `next()` is
     * unresolved and will wait on `signal` (timeout-bounded).
     */
    readonly nextCalled: boolean;

    /**
     * The cached promise returned by the first `next()` call on this event,
     * or `undefined` if `next()` has not been invoked.
     */
    readonly nextResult: Promise<Response | undefined> | undefined;

    /**
     * Returns a promise that resolves the first time `next()` is invoked on this event.
     *
     * If `next()` has already been called, the returned promise is already resolved.
     * Used by the dispatch pipeline so a handler that returns `undefined` and later
     * calls `next()` asynchronously (e.g. from a `setTimeout`) still propagates the
     * downstream response instead of hanging until `signal` aborts.
     */
    whenNextCalled(): Promise<void>;
}
