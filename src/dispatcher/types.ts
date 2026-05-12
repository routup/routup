import type { RoutupError } from '../error/module.ts';
import type { IRoutupEvent, NextFn } from '../event/types.ts';
import type { RoutupEvent } from '../event/module.ts';
import type { RouterPathNode } from '../router/types.ts';

/**
 * Internal dispatcher view of the request lifecycle.
 *
 * Extends the user-facing `IRoutupEvent` so the dispatcher can hand
 * the same event to handlers without a wrapper allocation (the fast
 * path), while also exposing the mutable internals (path mutation
 * across nested routers, pipeline state, error accumulation) that
 * user handlers don't need.
 */
export interface IDispatcherEvent extends Omit<IRoutupEvent, 'params'> {
    /**
     * Route parameters — mutable here (replaced during nested-router
     * mount-prefix stripping). User handlers receive this via the
     * read-only `IRoutupEvent.params` view.
     */
    params: Record<string, any>;

    /**
     * Current request path, adjusted relative to the mount point during router nesting.
     */
    path: string;

    /**
     * Accumulated mount path from nested routers.
     */
    mountPath: string;

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
     * Abort signal for cooperative cancellation. Settable (the global
     * timeout in `Router.fetch` substitutes a controller-backed signal).
     */
    signal: AbortSignal;

    /**
     * Collected allowed methods for the current path (used for OPTIONS / 405 responses).
     */
    methodsAllowed: Set<string>;

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
     *
     * @param signal - Optional AbortSignal override. When provided, the built event
     *                 uses this signal instead of the dispatcher event's own signal.
     *                 Used by per-handler timeout to provide a handler-scoped signal.
     */
    build(signal?: AbortSignal): RoutupEvent;
}

export interface IDispatcher {
    dispatch(event: IDispatcherEvent): Promise<Response | undefined>;
}
