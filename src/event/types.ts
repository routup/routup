import type { ServerRequest } from 'srvx';
import type { RoutupError } from '../error/module.ts';

export type RoutupResponse = {
    status: number;
    headers: Headers;
    statusText?: string
};

export type RoutupRequest = ServerRequest;

export interface IRoutupEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: RoutupRequest;

    /**
     * Route parameters extracted from the URL path pattern.
     */
    params: Record<string, any>;

    /**
     * Current request path, adjusted relative to the mount point during router nesting.
     */
    path: string;

    /**
     * HTTP method (GET, POST, PUT, etc.).
     */
    readonly method: string;

    /**
     * Accumulated mount path from nested routers.
     */
    mountPath: string;

    /**
     * Error that occurred during dispatch, if any.
     */
    error?: RoutupError;

    /**
     * Router ID stack for nesting tracking.
     * Used internally by router options resolution.
     */
    routerPath: number[];

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
     * Whether a response has been produced.
     */
    dispatched: boolean;

    /**
     * Call the next handler in the pipeline (onion model).
     *
     * The result is cached — calling `next()` multiple times returns the same response.
     * Returns the downstream `Response`, or `undefined` if no handler matched.
     */
    next(): Promise<Response | undefined>;
}
