import { FastURL } from 'srvx';
import { MethodName } from '../constants.ts';
import type { MethodNameLike } from '../constants.ts';
import type { AppError } from '../error/module.ts';
import type { AppEventRoute, AppRequest, AppResponse } from '../event/types.ts';
import type { Handler } from '../handler/module.ts';
import type { Route } from '../types.ts';
import type { AppOptions } from './types.ts';

/**
 * The `event.route` value of each route, built on the first read and
 * shared by every later request, so the walk only assigns the route.
 */
const EVENT_ROUTES = new WeakMap<Route, AppEventRoute>();

/**
 * The frozen `event.route` value of a method-bound route.
 */
export function toEventRoute(route: Route): AppEventRoute {
    let output = EVENT_ROUTES.get(route);

    if (!output) {
        const pathPrefix = route.pathPrefix ?? '/';

        output = Object.freeze({
            path: route.path ?? pathPrefix,
            pathPrefix,
            method: route.method!,
        });

        EVENT_ROUTES.set(route, output);
    }

    return output;
}

/**
 * Request-scoped state of one `App.fetch()` call: what the match walk
 * and the handlers share while a request moves through the pipeline.
 */
export interface IPipelineState {
    readonly request: AppRequest;

    readonly method: MethodNameLike;

    /**
     * Request path. Fixed for the whole request: the match list is
     * looked up from it once.
     */
    readonly path: string;

    /**
     * Raw query string (`?a=1`, or empty); each handler event parses
     * it on its first `searchParams` read.
     */
    readonly search: string;

    readonly appOptions: Readonly<AppOptions>;

    /**
     * Route parameters accumulated over the matches walked so far.
     */
    params: Record<string, string | undefined>;

    /**
     * Prefix the running handler's route matched on. The walk sets it
     * per match and restores it when the handler returns.
     */
    mountPath: string;

    /**
     * Pending error. While set, the walk runs ERROR handlers only.
     */
    error?: AppError;

    /**
     * The last method-bound route the walk dispatched. Set by the walk
     * and never reset during the request.
     */
    dispatchedRoute?: Route<Handler>;

    /**
     * `event.route`: the value of `dispatchedRoute`, or `undefined`.
     */
    readonly route: AppEventRoute | undefined;

    /**
     * Whether a handler produced a response. Stops every walk of this
     * request.
     */
    dispatched: boolean;

    /**
     * Methods of the routes matching the path, for the synthesized
     * `Allow` response. Collected for `OPTIONS` requests only.
     */
    readonly methodsAllowed: Set<string> | undefined;

    readonly response: AppResponse;

    readonly store: Record<string | symbol, unknown>;

    /**
     * Signal handlers inherit: the request's own, unless a
     * request-wide deadline replaced it.
     */
    signal: AbortSignal;
}

export class PipelineState implements IPipelineState {
    readonly request: AppRequest;

    readonly method: MethodNameLike;

    readonly path: string;

    readonly search: string;

    readonly appOptions: Readonly<AppOptions>;

    params: Record<string, string | undefined>;

    mountPath: string;

    error?: AppError;

    dispatchedRoute?: Route<Handler>;

    dispatched: boolean;

    readonly methodsAllowed: Set<string> | undefined;

    protected _response?: AppResponse;

    protected _store?: Record<string | symbol, unknown>;

    protected _signal?: AbortSignal;

    // ------------------------------------------------------------------------

    constructor(request: AppRequest, appOptions: Readonly<AppOptions> = {}) {
        // Taken from the srvx request when the adapter already holds a
        // parsed URL (`request._url` on Node.js): `request.url` would
        // serialize it to an absolute string that then needs a full
        // native parse again, on every request.
        const url = request._url ?? new FastURL(request.url);

        this.request = request;
        this.method = request.method;
        this.path = url.pathname;
        this.search = url.search;
        this.appOptions = appOptions;
        this.params = {};
        this.mountPath = '/';
        this.dispatched = false;
        this.methodsAllowed = request.method === MethodName.OPTIONS ?
            new Set() :
            undefined;
    }

    // ------------------------------------------------------------------------

    get response(): AppResponse {
        if (!this._response) {
            this._response = { status: 200, headers: new Headers() };
        }

        return this._response;
    }

    get store(): Record<string | symbol, unknown> {
        if (!this._store) {
            this._store = Object.create(null) as Record<string | symbol, unknown>;
        }

        return this._store;
    }

    get route(): AppEventRoute | undefined {
        if (!this.dispatchedRoute) {
            return undefined;
        }

        return toEventRoute(this.dispatchedRoute);
    }

    get signal(): AbortSignal {
        return this._signal ?? this.request.signal;
    }

    set signal(value: AbortSignal) {
        this._signal = value;
    }
}
