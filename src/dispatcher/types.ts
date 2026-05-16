import type { AppError } from '../error/module.ts';
import type {
    AppRequest,
    AppResponse,
    IAppEvent,
    NextFn,
} from '../event/types.ts';
import type { AppOptions } from '../app/types.ts';
import type { MethodNameLike } from '../constants.ts';

export interface IDispatcherEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: AppRequest;

    /**
     * Route parameters extracted from the URL path pattern. Values
     * are `string` (or `undefined` for an optional param that
     * didn't match).
     */
    params: Record<string, string | undefined>;

    /**
     * Current request path, adjusted relative to the mount point during router nesting.
     */
    path: string;

    /**
     * HTTP method (GET, POST, PUT, etc.). See `IAppEvent.method`
     * for the open-enum typing rationale.
     */
    readonly method: MethodNameLike;

    /**
     * Prefix the active route was matched on. Set per dispatched
     * handler to the resolver's `match.path` (the substring of the
     * request path the matcher consumed) and restored to the prior
     * value when the handler returns. Static-asset / mount-aware
     * helpers strip this off `event.path` to recover a mount-relative
     * path.
     */
    mountPath: string;

    /**
     * Response accumulator — set status/headers before returning a plain value.
     */
    readonly response: AppResponse;

    /**
     * Whether a response has been produced.
     */
    dispatched: boolean;

    /**
     * Error that occurred during dispatch, if any.
     */
    error?: AppError;

    /**
     * Options of the App currently dispatching this event. Set on
     * entry to `App.dispatch`; restored on exit so that re-entering
     * `App.dispatch` for the same event (programmatic use of the
     * `IDispatcher` interface) leaves the caller's view intact.
     */
    appOptions: Readonly<AppOptions>;

    /**
     * `true` while an `App.dispatch` call is on the stack for this
     * event. Used by `App.dispatch` to derive whether the current
     * call is the root (and so should drive root-only behaviour like
     * OPTIONS auto-Allow synthesis). Saved/restored around the
     * dispatch body so re-entrant calls behave correctly.
     */
    isDispatching: boolean;

    /**
     * Abort signal for cooperative cancellation.
     *
     * When a `timeout` router option is set, this signal aborts after the
     * specified duration. Handlers can pass it to fetch(), streams, or other
     * AbortSignal-aware APIs.
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
     * Build a public AppEvent from the current dispatch state.
     *
     * Creates a lightweight snapshot with shared references (store, response, headers)
     * and the current App's options. This is the event passed to handler functions.
     *
     * @param signal - Optional AbortSignal override. When provided, the built event
     *                 uses this signal instead of the dispatcher event's own signal.
     *                 Used by per-handler timeout to provide a handler-scoped signal.
     */
    build(signal?: AbortSignal): IAppEvent;
}

export interface IDispatcher {
    dispatch(event: IDispatcherEvent): Promise<Response | undefined>;
}
