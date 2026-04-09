import type { RouterOptions } from '../router/types.ts';
import type {
    IRoutupEvent,
    RoutupRequest,
    RoutupResponse,
} from './types.ts';

export type RoutupEventCreateContext = {
    request: RoutupRequest;
    params: Record<string, any>;
    path: string;
    method: string;
    mountPath: string;
    headers: Headers;
    searchParams: URLSearchParams;
    response: RoutupResponse;
    store: Record<string | symbol, unknown>;
    signal: AbortSignal;
    routerOptions: () => RouterOptions;
    next: (event: IRoutupEvent, error?: Error) => Promise<Response | undefined>;
};

export class RoutupEvent implements IRoutupEvent {
    readonly request: RoutupRequest;

    readonly params: Record<string, any>;

    readonly path: string;

    readonly method: string;

    readonly mountPath: string;

    readonly headers: Headers;

    readonly searchParams: URLSearchParams;

    readonly response: RoutupResponse;

    readonly store: Record<string | symbol, unknown>;

    readonly signal: AbortSignal;

    protected _context: RoutupEventCreateContext;

    protected _routerOptions?: RouterOptions;

    constructor(context: RoutupEventCreateContext) {
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
    }

    get routerOptions(): RouterOptions {
        if (!this._routerOptions) {
            this._routerOptions = this._context.routerOptions();
        }

        return this._routerOptions;
    }

    async next(error?: Error): Promise<Response | undefined> {
        return this._context.next(this, error);
    }
}
