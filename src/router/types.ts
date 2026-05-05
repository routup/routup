import type { IDispatcher, IDispatcherEvent } from '../dispatcher/index.ts';
import type { RoutupRequest } from '../event/index.ts';
import type {
    Handler,
    HandlerOptions,
} from '../handler/index.ts';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookName,
    HookUnsubscribeFn,
} from '../hook/index.ts';

import type { Path } from '../path/index.ts';
import type { Plugin } from '../plugin/index.ts';
import type {
    EtagFn,
    EtagInput,
    TrustProxyFn,
    TrustProxyInput,
} from '../utils/index.ts';
import type { RouterPipelineStep, RouterStackEntryType  } from './constants.ts';

// --------------------------------------------------
// Router Options
// --------------------------------------------------

export type RouterOptions = {
    path?: Path,
    name?: string,

    /**
     * Global request timeout in milliseconds.
     *
     * Applies to the entire dispatch pipeline in `fetch()`. When exceeded,
     * the request is aborted and a 408 response is returned. The AbortSignal
     * on the event is also aborted for cooperative cancellation.
     */
    timeout?: number,

    /**
     * Default per-handler timeout in milliseconds.
     *
     * Applies individually to each handler's `fn()` execution. Handlers can
     * override this value via their own `timeout` option — see
     * `handlerTimeoutOverridable` to control whether overrides can extend
     * or only narrow this default.
     */
    handlerTimeout?: number,

    /**
     * Whether handlers can extend the `handlerTimeout` default.
     *
     * When `false` (default), a handler's `timeout` is clamped to
     * `Math.min(handlerTimeout, handler.timeout)`. When `true`, the
     * handler's `timeout` fully replaces the router default.
     */
    handlerTimeoutOverridable?: boolean,

    subdomainOffset: number,
    proxyIpMax: number,
    etag: EtagFn,
    trustProxy: TrustProxyFn,
};

export type RouterOptionsInput = Omit<Partial<RouterOptions>, 'etag' | 'trustProxy'> & {
    etag?: EtagInput,
    trustProxy?: TrustProxyInput,
};

export type RouterPathNode = {
    readonly name?: string;
    readonly options: Partial<RouterOptions>;
};

// --------------------------------------------------
// Stack
// --------------------------------------------------

export type StackRouterEntry = {
    type: typeof RouterStackEntryType.ROUTER,
    data: IRouter,
};

export type StackHandlerEntry = {
    type: typeof RouterStackEntryType.HANDLER,
    data: Handler,
};

export type StackEntry = StackRouterEntry | StackHandlerEntry;

// --------------------------------------------------
// Pipeline
// --------------------------------------------------

export type RouterPipelineContext = {
    step: RouterPipelineStep,
    event: IDispatcherEvent,
    stackIndex: number,
    response?: Response,
};

export interface IRouter extends IDispatcher {
    /**
     * Optional label for the router instance.
     */
    readonly name?: string;

    /**
     * Public entry point — processes a request through the pipeline
     * and returns a Response (with 404/500 fallbacks).
     */
    fetch(request: RoutupRequest): Promise<Response>;

    /**
     * Test if a path matches this router's mount path.
     */
    matchPath(path: string): boolean;

    /**
     * Set or clear the router's mount path.
     */
    setPath(value?: Path): void;

    /**
     * Check if a plugin with the given name is installed on this router.
     */
    hasPlugin(name: string): boolean;

    /**
     * Get the version of an installed plugin by name on this router,
     * or `undefined` if the plugin is not installed here.
     */
    getPluginVersion(name: string): string | undefined;

    /**
     * Register a handler, router, or plugin.
     * When a path is provided, the item is mounted at that path.
     */
    use(router: IRouter): this;
    use(handler: Handler | HandlerOptions): this;
    use(plugin: Plugin): this;
    use(path: Path, router: IRouter): this;
    use(path: Path, handler: Handler | HandlerOptions): this;
    use(path: Path, plugin: Plugin): this;

    /** Register GET handler(s). */
    get(...handlers: (Handler | HandlerOptions)[]): this;
    get(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register POST handler(s). */
    post(...handlers: (Handler | HandlerOptions)[]): this;
    post(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register PUT handler(s). */
    put(...handlers: (Handler | HandlerOptions)[]): this;
    put(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register PATCH handler(s). */
    patch(...handlers: (Handler | HandlerOptions)[]): this;
    patch(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register DELETE handler(s). */
    delete(...handlers: (Handler | HandlerOptions)[]): this;
    delete(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register HEAD handler(s). */
    head(...handlers: (Handler | HandlerOptions)[]): this;
    head(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /** Register OPTIONS handler(s). */
    options(...handlers: (Handler | HandlerOptions)[]): this;
    options(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    /**
     * Add a hook listener.
     */
    on(
        name: typeof HookName.REQUEST |
            typeof HookName.RESPONSE |
            typeof HookName.CHILD_DISPATCH_BEFORE |
            typeof HookName.CHILD_DISPATCH_AFTER,
        fn: HookDefaultListener,
    ): HookUnsubscribeFn;
    on(
        name: typeof HookName.CHILD_MATCH,
        fn: HookDefaultListener,
    ): HookUnsubscribeFn;
    on(
        name: typeof HookName.ERROR,
        fn: HookErrorListener,
    ): HookUnsubscribeFn;

    /**
     * Remove a specific or all hook listeners for the given hook name.
     */
    off(name: HookName): this;
    off(name: HookName, fn: HookListener): this;
}
