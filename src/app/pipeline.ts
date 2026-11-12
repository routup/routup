import type { MethodName } from '../constants.ts';
import { createError } from '../error/create.ts';
import { AppEvent } from '../event/module.ts';
import { HandlerType } from '../handler/constants.ts';
import type { Handler } from '../handler/module.ts';
import { matchHandlerMethod } from '../handler/utils.ts';
import type { RouteMatch } from '../types.ts';
import type { IPipelineState } from './pipeline-state.ts';

/**
 * One handler invocation of the walk, as `Handler.dispatch` and the
 * walk see it. It says nothing about how the handler's event is
 * built.
 */
export interface IPipelineStep {
    readonly state: IPipelineState;

    /**
     * The event handed to the handler, once `createEvent()` built it.
     * The walk reads `event.nextCalled` to learn whether the handler
     * consumed its continuation.
     */
    readonly event?: AppEvent;

    /**
     * Set by `Handler.dispatch` when the handler settled with a
     * failure (a throw, or its deadline). The walk has moved on from
     * this step by then, so its continuation is inert.
     */
    failed: boolean;

    /**
     * Build the handler's event.
     *
     * @param signal - Handler-scoped signal (per-handler deadline).
     *                 Defaults to the signal of the request.
     */
    createEvent(signal?: AbortSignal): AppEvent;
}

/**
 * The step of the walk. `params` and `mountPath` are copied when the
 * walk reaches the match, so the handler's event keeps them however
 * far the walk moves on afterwards.
 */
export class PipelineStep implements IPipelineStep {
    readonly state: IPipelineState;

    event?: AppEvent;

    failed: boolean;

    protected params: Record<string, string | undefined>;

    protected mountPath: string;

    protected signal: AbortSignal;

    protected matches: readonly RouteMatch<Handler>[];

    protected index: number;

    // ------------------------------------------------------------------------

    constructor(
        state: IPipelineState,
        matches: readonly RouteMatch<Handler>[],
        index: number,
    ) {
        this.state = state;
        this.params = state.params;
        this.mountPath = state.mountPath;
        this.signal = state.signal;
        this.matches = matches;
        this.index = index;
        this.failed = false;
    }

    // ------------------------------------------------------------------------

    createEvent(signal?: AbortSignal): AppEvent {
        if (signal) {
            this.signal = signal;
        }

        const { state } = this;

        this.event = new AppEvent({
            request: state.request,
            params: this.params,
            path: state.path,
            method: state.method,
            mountPath: this.mountPath,
            headers: state.request.headers,
            search: state.search,
            response: state.response,
            store: state.store,
            appOptions: state.appOptions,
            signal: this.signal,
            next: (_event, error) => this.next(error),
        });

        return this.event;
    }

    /**
     * Continuation of this handler: walk the matches after it. Runs
     * at most once per step — `AppEvent.next()` is the guard and
     * caches the returned promise.
     */
    next(error?: Error): Promise<Response | undefined> {
        // A late call from a handler that already failed (typically
        // one that outlived its deadline) starts no walk: the walk is
        // past this step and may be inside an ERROR handler, which a
        // walk from `index + 1` would enter a second time.
        if (this.failed) {
            return Promise.resolve(undefined);
        }

        if (error) {
            this.state.error = createError(error);
        }

        return walkMatches(this.state, this.matches, this.index + 1);
    }
}

/**
 * Merge router-supplied path params into `state.params` only when
 * `matchParams` has keys. Skipping the object spread on the
 * empty-params path (every static route, every middleware match) saves
 * an allocation per match.
 */
function mergeMatchParams(
    state: IPipelineState,
    matchParams: Record<string, string | undefined>,
): void {
    // Cheap emptiness probe — short-circuits on the first own key.
    let hasKeys = false;

    // eslint-disable-next-line no-unreachable-loop
    for (const _k in matchParams) {
        hasKeys = true;

        break;
    }

    if (!hasKeys) {
        return;
    }

    state.params = {
        ...state.params,
        ...matchParams,
    };
}

/**
 * Walk the matched routes from `startIndex`, dispatching each handler
 * that fits the request method and the error state, until one
 * produces a response. A handler's `event.next()` re-enters the walk
 * at the match after it (`PipelineStep.next`).
 *
 * The match list is captured once per request — there is no mid-walk
 * path-rewrite refresh. `IAppEvent.path` is a snapshot on the
 * handler's event, so middleware cannot change the path the walk
 * runs on before calling `event.next()`. An API that lets middleware
 * rewrite paths end-to-end needs a per-call lookup and a
 * `methodsAllowed` reset here (see #913).
 */
export async function walkMatches(
    state: IPipelineState,
    matches: readonly RouteMatch<Handler>[],
    startIndex: number,
): Promise<Response | undefined> {
    for (let i = startIndex; !state.dispatched && i < matches.length; i++) {
        const match = matches[i]!;
        const handler = match.route.data;

        // Skip handlers that don't fit the current error state:
        // CORE handlers only run when no error is pending;
        // ERROR handlers only run when one is.
        if (
            state.error ?
                handler.type === HandlerType.CORE :
                handler.type === HandlerType.ERROR
        ) {
            continue;
        }

        const { method } = match.route;

        if (method && state.methodsAllowed) {
            state.methodsAllowed.add(method);
        }

        if (!matchHandlerMethod(method, state.method as MethodName)) {
            continue;
        }

        mergeMatchParams(state, match.params);

        // Surface the matched prefix as `event.mountPath` for the
        // duration of this handler so static-asset / mount-aware
        // helpers can strip it off `event.path`. Save and restore
        // around the dispatch so siblings see their own prefixes.
        const savedMountPath = state.mountPath;

        if (typeof match.path === 'string') {
            state.mountPath = match.path;
        }

        const step = new PipelineStep(state, matches, i);

        try {
            const response = await handler.dispatch(step);

            if (response) {
                return response;
            }

            // The handler consumed its continuation: the matches after
            // it were walked from its `event.next()` and produced no
            // response. Moving on to `i + 1` would walk that suffix
            // again — exponentially so for a chain of next()-calling
            // middlewares on a request nothing answers (#946). The
            // walk is complete; stop here.
            if (step.event && step.event.nextCalled) {
                return undefined;
            }
        } catch (e) {
            // `Handler.dispatch` records its failure on `state.error`
            // and rethrows that same error, which `createError`
            // returns unchanged; a dispatch that throws anything else
            // is recorded here.
            state.error = createError(e);

            // Move on to the next match, also when the handler threw
            // after calling `next()`: an error handler later in the
            // chain must see the error. Error flow is forward-only —
            // an ERROR handler registered before the failure point is
            // not revisited (#946).
        } finally {
            state.mountPath = savedMountPath;
        }
    }

    return undefined;
}
