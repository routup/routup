import type { ServerRequest } from 'srvx';
import type { RouterOptions } from '../router/types.ts';

export type RoutupResponse = {
    status: number;
    headers: Headers;
    statusText?: string
};

export type RoutupRequest = ServerRequest;

export type NextFn = (error?: Error) => unknown | Promise<unknown>;

export interface IRoutupEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: RoutupRequest;

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
    readonly response: RoutupResponse;

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
    readonly routerOptions: RouterOptions;

    /**
     * Call the next handler in the pipeline (onion model).
     *
     * The result is cached — calling `next()` multiple times returns the same response.
     * Returns the downstream `Response`, or `undefined` if no handler matched.
     */
    next(error?: Error): Promise<Response | undefined>;
}
