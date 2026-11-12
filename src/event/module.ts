import type { AppOptions } from '../app/types.ts';
import type { MethodNameLike } from '../constants.ts';
import type {
    AppRequest,
    AppResponse,
    IAppEvent,
} from './types.ts';

export type AppEventContext = {
    request: AppRequest;
    params: Record<string, string | undefined>;
    path: string;
    method: MethodNameLike;
    mountPath: string;
    headers: Headers;
    /**
     * Parsed query string. Omit it and pass `search` to have the event
     * parse lazily, on the first `event.searchParams` read.
     */
    searchParams?: URLSearchParams;
    /**
     * Raw query string (`?a=1`, or empty). Ignored when `searchParams`
     * is given.
     */
    search?: string;
    response: AppResponse;
    store: Record<string | symbol, unknown>;
    signal: AbortSignal;
    appOptions: Readonly<AppOptions>;
    next: (event: IAppEvent, error?: Error) => Promise<Response | undefined>;
};

/**
 * @deprecated Use `AppEventContext`.
 */
export type AppEventCreateContext = AppEventContext;

export class AppEvent implements IAppEvent {
    readonly request: AppRequest;

    readonly params: Record<string, string | undefined>;

    readonly path: string;

    readonly method: MethodNameLike;

    readonly mountPath: string;

    readonly headers: Headers;

    readonly response: AppResponse;

    readonly store: Record<string | symbol, unknown>;

    readonly signal: AbortSignal;

    readonly appOptions: Readonly<AppOptions>;

    protected _context: AppEventContext;

    protected _searchParams: URLSearchParams | undefined;

    protected _nextCalled = false;

    protected _nextResult: Promise<Response | undefined> | undefined;

    protected _nextCalledDeferred: {
        promise: Promise<void>,
        resolve: () => void,
    } | undefined;

    constructor(context: AppEventContext) {
        this._context = context;
        this.request = context.request;
        this.params = context.params;
        this.path = context.path;
        this.method = context.method;
        this.mountPath = context.mountPath;
        this.headers = context.headers;
        this._searchParams = context.searchParams;
        this.response = context.response;
        this.store = context.store;
        this.signal = context.signal;
        this.appOptions = context.appOptions;
    }

    /**
     * Parsed on first read — most handlers never look at the query
     * string. Each event owns its instance, so a handler mutating it
     * does not affect the next one.
     */
    get searchParams(): URLSearchParams {
        if (!this._searchParams) {
            this._searchParams = new URLSearchParams(this._context.search);
        }

        return this._searchParams;
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
            const promise = new Promise<void>((r) => {
                resolve = r;
            });

            this._nextCalledDeferred = { promise, resolve };

            if (this._nextCalled) {
                resolve();
            }
        }

        return this._nextCalledDeferred.promise;
    }

    /**
     * The one guard of the continuation: the first call starts it and
     * caches its promise, every later call returns that promise.
     */
    next(error?: Error): Promise<Response | undefined> {
        if (this._nextCalled) {
            return this._nextResult!;
        }

        this._nextCalled = true;

        try {
            // `Promise.resolve` hands a native promise back as is, so
            // the walk's promise is cached without an extra hop; a
            // hand-built context returning a plain value still yields
            // a promise.
            this._nextResult = Promise.resolve(this._context.next(this, error));
        } catch (e) {
            this._nextResult = Promise.reject(e);
        }

        if (this._nextCalledDeferred) {
            this._nextCalledDeferred.resolve();
        }

        return this._nextResult;
    }
}
