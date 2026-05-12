import { FastURL } from 'srvx';
import type { RoutupError } from '../error/module.ts';
import { RoutupEvent } from '../event/module.ts';
import type {
    IRoutupEvent,
    NextFn,
    RoutupRequest,
    RoutupResponse,
} from '../event/types.ts';
import { toResponse } from '../response/index.ts';
import type { RouterOptions, RouterPathNode } from '../router/types.ts';
import { buildEtagFn } from '../utils/index.ts';
import type { IDispatcherEvent } from './types.ts';

// Framework defaults applied beneath any router-level overrides. Hoisted
// to module scope so resolveOptions() doesn't allocate a fresh defaults
// object — including a new `etag` closure via buildEtagFn() — per request.
const DEFAULT_ROUTER_OPTIONS: RouterOptions = {
    trustProxy: () => false,
    subdomainOffset: 2,
    etag: buildEtagFn(),
    proxyIpMax: 0,
};

export class DispatcherEvent implements IDispatcherEvent, IRoutupEvent {
    readonly request: RoutupRequest;

    params: Record<string, any>;

    path: string;

    readonly method: string;

    /**
     * Collected allowed methods (for OPTIONS).
     */
    methodsAllowed: Set<string>;

    mountPath: string;

    error?: RoutupError;

    routerPath: RouterPathNode[];

    protected _dispatched: boolean;

    protected _response?: RoutupResponse;

    protected _store?: Record<string | symbol, unknown>;

    /**
     * Cached parsed URL (avoids double-parsing).
     */
    protected _url: InstanceType<typeof FastURL>;

    /**
     * Continuation function for middleware onion model.
     */
    protected _next?: (event: IRoutupEvent, error?: Error) => Promise<Response | undefined>;

    protected _signal?: AbortSignal;

    protected _signalCleanup?: () => void;

    /**
     * Whether _next has already been called (guard against double-invocation).
     */
    protected _nextCalled: boolean;

    /**
     * The cached result of the next handler.
     */
    protected _nextResult?: Promise<Response | undefined>;

    /**
     * Lazily-computed search params (most handlers don't read them).
     */
    protected _searchParams?: URLSearchParams;

    /**
     * Cached resolved router options.
     */
    protected _routerOptions?: RouterOptions;

    /**
     * Deferred resolver used by whenNextCalled().
     */
    protected _nextCalledDeferred?: {
        promise: Promise<void>,
        resolve: () => void,
    };

    // ------------------------------------------------------------------------

    constructor(request: RoutupRequest) {
        this.request = request;
        this._url = new FastURL(request.url);
        this.method = request.method;
        this.path = this._url.pathname;
        this.mountPath = '/';
        this.params = {};
        this.routerPath = [];
        this.methodsAllowed = new Set();
        this._dispatched = false;
        this._nextCalled = false;
    }

    // ------------------------------------------------------------------------
    // IRoutupEvent compatibility — exposed so the Router fast path can
    // hand user handlers the dispatcher event directly without first
    // allocating a RoutupEvent wrapper via build().

    get headers(): Headers {
        return this.request.headers;
    }

    get searchParams(): URLSearchParams {
        if (!this._searchParams) {
            this._searchParams = new URLSearchParams(this._url.search);
        }
        return this._searchParams;
    }

    get routerOptions(): RouterOptions {
        if (!this._routerOptions) {
            this._routerOptions = this.resolveOptions();
        }
        return this._routerOptions;
    }

    get store(): Record<string | symbol, unknown> {
        if (!this._store) {
            this._store = Object.create(null) as Record<string | symbol, unknown>;
        }
        return this._store!;
    }

    get nextCalled(): boolean {
        return this._nextCalled;
    }

    get nextResult(): Promise<Response | undefined> | undefined {
        return this._nextResult;
    }

    whenNextCalled(): Promise<void> {
        if (!this._nextCalledDeferred) {
            let resolve!: () => void;
            const promise = new Promise<void>((r) => { resolve = r; });
            this._nextCalledDeferred = { promise, resolve };
            if (this._nextCalled) {
                resolve();
            }
        }
        return this._nextCalledDeferred.promise;
    }

    /**
     * IRoutupEvent.next() — public continuation.
     *
     * Forwards to the internal _invokeNext (renamed to avoid colliding
     * with the protected next(event, error) signature kept for the
     * chain dispatcher path, which still needs to thread the per-handler
     * RoutupEvent into _next).
     */
    next(error?: Error): Promise<Response | undefined> {
        return this._invokeNext(this, error);
    }

    // ------------------------------------------------------------------------

    get response(): RoutupResponse {
        if (!this._response) {
            this._response = { status: 200, headers: new Headers() };
        }

        return this._response;
    }

    get signal(): AbortSignal {
        if (!this._signal) {
            this._signal = this.request.signal;
        }

        return this._signal;
    }

    set signal(value: AbortSignal) {
        // Clean up listeners from a previous merge
        if (this._signalCleanup) {
            this._signalCleanup();
            this._signalCleanup = undefined;
        }

        if (value === this.request.signal) {
            this._signal = value;
            return;
        }

        const controller = new AbortController();
        const abort = (e?: Event) => {
            const reason = e?.target instanceof AbortSignal ?
                e.target.reason :
                undefined;
            this.request.signal.removeEventListener('abort', abort);
            value.removeEventListener('abort', abort);
            controller.abort(reason);
        };

        if (this.request.signal.aborted || value.aborted) {
            const reason = this.request.signal.aborted ?
                this.request.signal.reason :
                value.reason;
            controller.abort(reason);
        } else {
            this.request.signal.addEventListener('abort', abort, { once: true });
            value.addEventListener('abort', abort, { once: true });
            this._signalCleanup = () => {
                this.request.signal.removeEventListener('abort', abort);
                value.removeEventListener('abort', abort);
            };
        }

        this._signal = controller.signal;
    }

    get dispatched(): boolean {
        return this._dispatched;
    }

    set dispatched(value: boolean) {
        this._dispatched = value;
    }

    // ------------------------------------------------------------------------

    protected _invokeNext(event: IRoutupEvent, error?: Error): Promise<Response | undefined> {
        if (this._nextCalled) {
            return this._nextResult ?? Promise.resolve(undefined);
        }
        this._nextCalled = true;

        if (this._next) {
            this._nextResult = this._next(event, error);
        }

        if (this._nextCalledDeferred) {
            this._nextCalledDeferred.resolve();
        }

        return this._nextResult ?? Promise.resolve(undefined);
    }

    setNext(fn?: NextFn): void {
        if (fn) {
            this._next = async (event, error?: Error) => {
                const result = await fn(error);
                return toResponse(result, event);
            };
        } else {
            this._next = undefined;
        }

        this._nextCalled = false;
        this._nextResult = undefined;
        this._nextCalledDeferred = undefined;
    }

    // ------------------------------------------------------------------------

    build(signal?: AbortSignal): RoutupEvent {
        return new RoutupEvent({
            request: this.request,
            params: this.params,
            path: this.path,
            method: this.method,
            mountPath: this.mountPath,
            headers: this.request.headers,
            searchParams: new URLSearchParams(this._url.search),
            response: this.response,
            store: this.store,
            signal: signal ?? this.signal,
            routerOptions: () => this.resolveOptions(),
            next: (event: IRoutupEvent, error?: Error) => this._invokeNext(event, error),
        });
    }

    // ------------------------------------------------------------------------

    protected resolveOptions(): RouterOptions {
        const resolved: RouterOptions = { ...DEFAULT_ROUTER_OPTIONS };

        for (let i = 0; i < this.routerPath.length; i++) {
            const options = this.routerPath[i]!.options;
            for (const key in options) {
                const value = (options as Record<string, unknown>)[key];
                if (typeof value !== 'undefined') {
                    (resolved as Record<string, unknown>)[key] = value;
                }
            }
        }

        return resolved;
    }
}
