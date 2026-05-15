import type { AppOptions } from '../app/types.ts';
import type { MethodNameLike } from '../constants.ts';
import type {
    AppRequest,
    AppResponse,
    IAppEvent,
} from './types.ts';

export type AppEventCreateContext = {
    request: AppRequest;
    params: Record<string, string | undefined>;
    path: string;
    method: MethodNameLike;
    mountPath: string;
    headers: Headers;
    searchParams: URLSearchParams;
    response: AppResponse;
    store: Record<string | symbol, unknown>;
    signal: AbortSignal;
    appOptions: Readonly<AppOptions>;
    next: (event: IAppEvent, error?: Error) => Promise<Response | undefined>;
};

export class AppEvent implements IAppEvent {
    readonly request: AppRequest;

    readonly params: Record<string, string | undefined>;

    readonly path: string;

    readonly method: MethodNameLike;

    readonly mountPath: string;

    readonly headers: Headers;

    readonly searchParams: URLSearchParams;

    readonly response: AppResponse;

    readonly store: Record<string | symbol, unknown>;

    readonly signal: AbortSignal;

    readonly appOptions: Readonly<AppOptions>;

    protected _context: AppEventCreateContext;

    protected _nextCalled = false;

    protected _nextResult: Promise<Response | undefined> | undefined;

    protected _nextCalledDeferred: {
        promise: Promise<void>,
        resolve: () => void,
    } | undefined;

    constructor(context: AppEventCreateContext) {
        this._context = context;
        this.request = context.request;
        this.params = context.params;
        this.path = context.path;
        this.method = context.method;
        this.mountPath = context.mountPath;
        this.headers = context.headers;
        this.searchParams = context.searchParams;
        this.response = context.response;
        this.store = context.store;
        this.signal = context.signal;
        this.appOptions = context.appOptions;
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

    async next(error?: Error): Promise<Response | undefined> {
        if (this._nextCalled) {
            return this._nextResult;
        }

        this._nextCalled = true;
        this._nextResult = this._context.next(this, error);

        if (this._nextCalledDeferred) {
            this._nextCalledDeferred.resolve();
        }

        return this._nextResult;
    }
}
