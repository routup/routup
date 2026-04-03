import type { ServerRequest } from 'srvx';
import { FastURL } from 'srvx';
import type { RoutupError } from '../../error/module.ts';

export type DispatchEventResponse = {
    status: number;
    headers: Headers;
};

export class DispatchEvent {
    /**
     * The srvx ServerRequest (extends Web Standard Request).
     */
    readonly request: ServerRequest;

    /**
     * Route parameters — populated by PathMatcher during dispatch.
     */
    params: Record<string, any>;

    /**
     * Request path (adjusted during router nesting).
     */
    path: string;

    /**
     * HTTP method.
     */
    readonly method: string;

    /**
     * Accumulated mount path from nested routers.
     */
    mountPath: string;

    /**
     * Error that occurred during dispatch.
     */
    error?: RoutupError;

    /**
     * Router ID stack for nesting tracking.
     */
    routerPath: number[];

    /**
     * Collected allowed methods (for OPTIONS).
     */
    methodsAllowed: string[];

    /**
     * Whether a response has been produced.
     */
    protected _dispatched: boolean;

    /**
     * Lazy response accumulator for status/headers.
     *
     * NOTE: If the handler returns a `Response` object directly, these
     * values are ignored. They only apply when returning plain values
     * (string, object, etc.) that go through `toResponse()`.
     */
    protected _response?: DispatchEventResponse;

    /**
     * Cached parsed URL (avoids double-parsing).
     */
    protected _url: FastURL;

    /**
     * Cached parsed search params.
     */
    protected _searchParams?: URLSearchParams;

    /**
     * Continuation function for middleware onion model.
     */
    _next?: () => Promise<Response | undefined>;

    /**
     * Whether _next has already been called (guard against double-invocation).
     */
    _nextCalled: boolean;

    constructor(request: ServerRequest) {
        this.request = request;
        this._url = new FastURL(request.url);
        this.method = request.method;
        this.path = this._url.pathname;
        this.mountPath = '/';
        this.params = {};
        this.routerPath = [];
        this.methodsAllowed = [];
        this._dispatched = false;
        this._nextCalled = false;
    }

    /**
     * Web Standard Headers from the request.
     */
    get headers(): Headers {
        return this.request.headers;
    }

    /**
     * Lazily-parsed URL search params (cached after first access).
     *
     * For advanced query parsing (arrays, nesting), use `@routup/query`.
     */
    get searchParams(): URLSearchParams {
        if (!this._searchParams) {
            this._searchParams = new URLSearchParams(this._url.search);
        }
        return this._searchParams;
    }

    /**
     * Response accumulator — set status/headers before returning a plain value.
     *
     * NOTE: If the handler returns a `Response` object directly, these
     * values are ignored. They only apply when returning plain values
     * (string, object, etc.) that go through `toResponse()`.
     */
    get response(): DispatchEventResponse {
        if (!this._response) {
            this._response = { status: 200, headers: new Headers() };
        }
        return this._response;
    }

    get dispatched(): boolean {
        return this._dispatched;
    }

    set dispatched(value: boolean) {
        this._dispatched = value;
    }

    /**
     * Call the next handler in the pipeline (onion model).
     *
     * Can only be called once per handler. A second call throws.
     * Returns the downstream `Response`, or `undefined` if no handler matched.
     */
    async next(): Promise<Response | undefined> {
        if (this._nextCalled) {
            throw new Error('event.next() can only be called once per handler.');
        }
        this._nextCalled = true;

        if (this._next) {
            return this._next();
        }
        return undefined;
    }
}
