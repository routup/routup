import type { RoutupError } from '../error/module.ts';
import type { NextFn, RoutupRequest, RoutupResponse } from '../event/types.ts';
import type { RoutupEvent } from '../event/module.ts';
import type { RouterPathNode } from '../router/types.ts';

export interface IDispatcherEvent {
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
     * Response accumulator — set status/headers before returning a plain value.
     */
    readonly response: RoutupResponse;

    /**
     * Whether a response has been produced.
     */
    dispatched: boolean;

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
     * Set the continuation function for this event.
     *
     * Replaces the current continuation. The provided function receives
     * an optional error and may return any value — it will be converted
     * to a `Response` via `toResponse()`.
     *
     * Passing `undefined` clears the continuation function.
     */
    setNext(fn?: NextFn): void;

    /**
     * Build a public RoutupEvent from the current dispatch state.
     *
     * Creates a lightweight snapshot with shared references (store, response, headers)
     * and pre-resolved router options. This is the event passed to handler functions.
     */
    build(): RoutupEvent;
}

export interface IDispatcher {
    dispatch(event: IDispatcherEvent): Promise<Response | undefined>;
}
