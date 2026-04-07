import type { ServerRequest } from 'srvx';
import type { RoutupError } from '../error/module.ts';
import type { RouterPathNode } from '../router/types.ts';

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
     * Router stack for nesting tracking.
     * Used internally by router options resolution.
     */
    routerPath: RouterPathNode[];

    /**
     * Collected allowed methods for the current path (used for OPTIONS / 405 responses).
     */
    methodsAllowed: string[];

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
     * Per-request store for caching and plugin state.
     *
     * Use symbol keys (e.g., `Symbol.for('routup:body')`) to avoid collisions.
     * Data is garbage collected with the event when the request completes.
     */
    readonly store: Record<string | symbol, unknown>;

    /**
     * Call the next handler in the pipeline (onion model).
     *
     * The result is cached — calling `next()` multiple times returns the same response.
     * Returns the downstream `Response`, or `undefined` if no handler matched.
     */
    next(error?: Error): Promise<Response | undefined>;

    /**
     * Set the continuation function for this event.
     *
     * The provided function receives an optional error and may return any value —
     * it will be converted to a `Response` via `toResponse()`.
     *
     * When `withFallback` is true (default), the previous `next` is called
     * as a fallback if `fn` returns no response or throws an error.
     * When false, the previous `next` is discarded entirely.
     *
     * Passing `undefined` as `fn` clears the continuation function.
     */
    setNext(fn?: NextFn, withFallback?: boolean): void;
}
