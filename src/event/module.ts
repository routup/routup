import { FastURL } from 'srvx';
import type { RoutupError } from '../error/module.ts';
import type { RouterPathNode } from '../router/types.ts';
import { toResponse } from '../response/index.ts';
import type {
    IRoutupEvent,
    NextFn,
    RoutupRequest,
    RoutupResponse,
} from './types.ts';

export class RoutupEvent implements IRoutupEvent {
    readonly request: RoutupRequest;

    params: Record<string, any>;

    path: string;

    readonly method: string;

    mountPath: string;

    error?: RoutupError;

    routerPath: RouterPathNode[];

    /**
     * Collected allowed methods (for OPTIONS).
     */
    methodsAllowed: string[];

    readonly store: Record<string | symbol, unknown>;

    protected _dispatched: boolean;

    protected _response?: RoutupResponse;

    /**
     * Cached parsed URL (avoids double-parsing).
     */
    protected _url: InstanceType<typeof FastURL>;

    protected _searchParams?: URLSearchParams;

    /**
     * Continuation function for middleware onion model.
     */
    protected _next?: (error?: Error) => Promise<Response | undefined>;

    /**
     * Whether _next has already been called (guard against double-invocation).
     */
    protected _nextCalled: boolean;

    /**
     * The cached result of the next handler.
     */
    protected _nextResult?: Promise<Response | undefined>;

    constructor(request: RoutupRequest) {
        this.request = request;
        this._url = new FastURL(request.url);
        this.method = request.method;
        this.path = this._url.pathname;
        this.mountPath = '/';
        this.params = {};
        this.routerPath = [];
        this.methodsAllowed = [];
        this.store = Object.create(null);
        this._dispatched = false;
        this._nextCalled = false;
    }

    get headers(): Headers {
        return this.request.headers;
    }

    get searchParams(): URLSearchParams {
        if (!this._searchParams) {
            this._searchParams = new URLSearchParams(this._url.search);
        }
        return this._searchParams;
    }

    get response(): RoutupResponse {
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

    async next(error?: Error): Promise<Response | undefined> {
        if (this._nextCalled) {
            return this._nextResult;
        }
        this._nextCalled = true;

        if (this._next) {
            this._nextResult = this._next(error);
        }

        return this._nextResult;
    }

    setNext(fn?: NextFn, withFallback = true): void {
        const savedNext = this._next;

        if (fn) {
            this._next = async (error?: Error) => {
                try {
                    const result = await fn(error);
                    const response = await toResponse(result, this);
                    if (response || !withFallback) {
                        return response;
                    }
                } catch (e) {
                    if (withFallback) {
                        return savedNext?.(e as Error);
                    }

                    throw e;
                }

                return savedNext?.(error);
            };
        } else {
            this._next = undefined;
        }

        this._nextCalled = false;
        this._nextResult = undefined;
    }
}
