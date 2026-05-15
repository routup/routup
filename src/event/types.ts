import type { ServerRequest } from 'srvx';
import type { AppOptions } from '../app/types.ts';

export type AppResponse = {
    status: number;
    headers: Headers;
};

export type AppRequest = ServerRequest;

export type NextFn = (error?: Error) => unknown | Promise<unknown>;

export interface IAppEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: AppRequest;

    /**
     * Route parameters extracted from the URL path pattern.
     */
    readonly params: Record<string, any>;

    /**
     * Current request path, adjusted relative to the mount point during router nesting.
     */
    readonly path: string;

    /**
     * HTTP method (GET, POST, PUT, etc.).
     */
    readonly method: string;

    /**
     * Accumulated mount path from nested routers.
     */
    readonly mountPath: string;

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
