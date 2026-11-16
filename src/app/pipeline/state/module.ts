import { FastURL } from 'srvx';
import { MethodName } from '../../../constants.ts';
import type { MethodNameLike } from '../../../constants.ts';
import type { AppError } from '../../../error/module.ts';
import type { AppEventRoute, AppRequest, AppResponse } from '../../../event/types.ts';
import type { Handler } from '../../../handler/module.ts';
import type { Route } from '../../../types.ts';
import type { AppOptions } from '../../types.ts';
import type { IPipelineState } from './types.ts';

export class PipelineState implements IPipelineState {
    readonly request: AppRequest;

    readonly method: MethodNameLike;

    readonly path: string;

    readonly search: string;

    readonly appOptions: Readonly<AppOptions>;

    params: Record<string, string | undefined>;

    mountPath: string;

    error?: AppError;

    // The `event.route` fields are declared only: they emit no
    // initialiser, so a request pays nothing for them until a
    // method-bound route is dispatched or `event.route` is read.
    declare dispatchedRoute?: Route<Handler>;

    dispatched: boolean;

    readonly methodsAllowed: Set<string> | undefined;

    protected _response?: AppResponse;

    protected _store?: Record<string | symbol, unknown>;

    protected _signal?: AbortSignal;

    protected declare _route?: AppEventRoute;

    protected declare _routeOf?: Route<Handler>;

    protected declare _readRoute?: () => AppEventRoute | undefined;

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

    get readRoute(): () => AppEventRoute | undefined {
        if (!this._readRoute) {
            this._readRoute = () => this.route;
        }

        return this._readRoute;
    }

    get route(): AppEventRoute | undefined {
        const route = this.dispatchedRoute;

        if (!route) {
            return undefined;
        }

        if (this._routeOf !== route) {
            this._route = this.buildRoute(route);
            this._routeOf = route;
        }

        return this._route;
    }

    /**
     * Build the `event.route` value of a dispatched method-bound route.
     */
    protected buildRoute(route: Route<Handler>): AppEventRoute {
        const pathPrefix = route.pathPrefix ?? '/';

        return {
            path: route.path ?? pathPrefix,
            pathPrefix,
            method: route.method!,
        };
    }

    get signal(): AbortSignal {
        return this._signal ?? this.request.signal;
    }

    set signal(value: AbortSignal) {
        this._signal = value;
    }
}
