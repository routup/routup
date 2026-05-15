import type { IDispatcher, IDispatcherEvent } from '../dispatcher/index.ts';
import type { AppRequest } from '../event/index.ts';
import type {
    Handler,
    HandlerOptions,
} from '../handler/index.ts';
import {
    type HookDefaultListener,
    type HookErrorListener,
    type HookListener,
    type HookName,
    type HookUnsubscribeFn,
    type IHooks,
} from '../hook/index.ts';

import type { Path } from '../path/index.ts';
import type { Plugin } from '../plugin/index.ts';
import type {
    EtagFn,
    EtagInput,
    TrustProxyFn,
    TrustProxyInput,
} from '../utils/index.ts';
import type { AppPipelineStep, RouteEntryType  } from './constants.ts';
import type { IRouter } from '../router/types.ts';
import type { RouteMatch } from '../types.ts';

// --------------------------------------------------
// App Options
// --------------------------------------------------

export type AppOptions = {
    /**
     * Registration-time path prefix.
     *
     * When set, every entry registered on this router (via `use`,
     * `get`, `post`, …) has this prefix prepended to its mount path.
     * `new App({ path: '/api' })` followed by `router.get('/users',
     * h)` is equivalent to `router.get('/api/users', h)` on a router
     * without an `options.path`.
     *
     * Path matching itself still happens inside the active
     * `IRouter` — this option only affects how entries are
     * registered, not how lookup is performed.
     */
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

    subdomainOffset?: number,

    proxyIpMax?: number,

    /**
     * ETag generator, or `null` to disable ETag/304 entirely.
     *
     * - `undefined` (the default): consumers fall back to a
     *   framework-provided `EtagFn`.
     * - `null`: explicit opt-out — the response pipeline branches
     *   synchronously and skips the `await applyEtag(...)` microtask hop.
     * - `EtagFn`: the user's own generator.
     */
    etag?: EtagFn | null,

    trustProxy?: TrustProxyFn,
};

export type AppOptionsInput = Omit<AppOptions, 'etag' | 'trustProxy'> & {
    etag?: EtagInput,
    trustProxy?: TrustProxyInput,

    hooks?: IHooks,
    plugins?: Map<string, string | undefined>,
    /**
     * Pluggable router (route table). Defaults to `LinearRouter` —
     * walks registered entries linearly per request. Swap in an
     * alternative (e.g. `TrieRouter`) on apps with many routes.
     */
    router?: IRouter<RouteEntry>,
};

export type AppPathNode = {
    readonly name?: string;
    readonly options: AppOptions;
};

// --------------------------------------------------
// Route entry
// --------------------------------------------------

/**
 * App-internal data that gets stored as `Route.data` in the active
 * router. Tagged union — the discriminator `type` (HANDLER / APP)
 * tells the dispatch loop which branch of the union to read.
 *
 * `path` and `method` are not part of this type — they live on
 * `Route<RouteEntry>` itself (the router's routing-relevant fields),
 * and App resolves the handler's intrinsic method into `Route.method`
 * at registration time.
 */
export type AppRouteEntry = {
    type: typeof RouteEntryType.APP,
    data: IApp,
};

export type HandlerRouteEntry = {
    type: typeof RouteEntryType.HANDLER,
    data: Handler,
};

export type RouteEntry = AppRouteEntry | HandlerRouteEntry;

// --------------------------------------------------
// Pipeline
// --------------------------------------------------

export type AppPipelineContext = {
    step: AppPipelineStep,
    event: IDispatcherEvent,
    /**
     * `true` when this dispatch is the outermost App on the call
     * stack (the root). Captured in `App.dispatch` from the event's
     * pre-overwrite `appOptions` and used to gate root-only
     * behaviour like OPTIONS auto-Allow.
     */
    isRoot: boolean,
    /**
     * Position within `matches`. Replaces the old "raw stack index" —
     * the dispatch loop now iterates the resolved-matches list rather
     * than the unfiltered registration order.
     */
    matchIndex: number,
    /**
     * Resolved matches for the current `event.path`, populated on the
     * first LOOKUP entry and threaded through `setNext` recursion so
     * we don't re-run `IRouter.lookup` per cycle. Invalidated
     * automatically when `event.path` changes (a hook mutating the
     * path between entries triggers a refresh).
     */
    matches?: readonly RouteMatch<RouteEntry>[],
    /**
     * The `event.path` that was used to compute `matches`. Stored so
     * we can detect a mid-walk path mutation and refresh the cache.
     */
    matchesPath?: string,
    response?: Response,
};

export interface IApp extends IDispatcher {
    /**
     * Optional label for the router instance.
     */
    readonly name?: string;

    /**
     * Public entry point — processes a request through the pipeline
     * and returns a Response (with 404/500 fallbacks).
     */
    fetch(request: AppRequest): Promise<Response>;

    /**
     * Return a new router that mirrors this one but owns independent
     * mountable state — fresh stack of shallow-copied entries (handlers and
     * child routers shared by reference), fresh `Hooks` seeded with the
     * current listeners, shallow copy of options, and a fresh plugins map.
     *
     * Intended for mounting the same logical router under multiple paths
     * without sharing mutable state across mount points.
     */
    clone(): IApp;

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
    use(router: IApp): this;
    use(handler: Handler | HandlerOptions): this;
    use(plugin: Plugin): this;
    use(path: Path, router: IApp): this;
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
        name: typeof HookName.START |
            typeof HookName.END |
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
