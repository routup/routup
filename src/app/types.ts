import type { IDispatcher } from '../dispatcher/index.ts';
import type { AppRequest } from '../event/index.ts';
import type {
    Handler,
    HandlerOptions,
} from '../handler/index.ts';

import type { Path } from '../path/index.ts';
import type { Plugin } from '../plugin/index.ts';
import type {
    EtagFn,
    EtagInput,
    TrustProxyFn,
    TrustProxyInput,
} from '../utils/index.ts';
import type { IRouter } from '../router/types.ts';

// --------------------------------------------------
// App Options
// --------------------------------------------------

export type AppOptions = {
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

    /**
     * Number of trailing labels in the request hostname that make up
     * the registrable domain (e.g. `example.com` → 2). Subdomain
     * helpers strip this many labels from the right before returning
     * the subdomain portion.
     */
    subdomainOffset?: number,

    /**
     * Maximum number of proxy IPs to walk when resolving the client
     * IP from `X-Forwarded-For`. Caps how far back the chain is
     * trusted, regardless of `trustProxy`.
     */
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

    /**
     * Predicate that decides whether a given upstream address is a
     * trusted proxy when resolving the client IP / protocol /
     * hostname from forwarding headers.
     */
    trustProxy?: TrustProxyFn,
};

/**
 * User-facing input variant of `AppOptions`.
 *
 * Accepts looser shapes for `etag` and `trustProxy` (string,
 * boolean, list-of-CIDRs, …) which `normalizeAppOptions` lowers to
 * the resolved `EtagFn | null` / `TrustProxyFn` shape stored on the
 * App.
 */
export type AppOptionsInput = Omit<AppOptions, 'etag' | 'trustProxy'> & {
    /**
     * ETag input — accepts an `EtagFn`, `false`/`null` to disable,
     * or other shapes accepted by `buildEtagFn`. Normalized to
     * `EtagFn | null` on the App.
     */
    etag?: EtagInput,

    /**
     * Trust-proxy input — accepts a predicate, a list of trusted
     * CIDRs, `'loopback'`, etc., as accepted by `buildTrustProxyFn`.
     * Normalized to `TrustProxyFn` on the App.
     */
    trustProxy?: TrustProxyInput,
};

/**
 * Constructor input for `App`.
 *
 * Splits true runtime options (which propagate to mounted children
 * via mount-time inheritance) from App-local identity (`name`,
 * `path`) and the `router` injectable. Keeping these separate
 * prevents identity from leaking across the mount boundary — e.g. a
 * parent's `path: '/api'` would otherwise propagate into a child
 * whose own `path` is unset and silently double-prefix on
 * registration.
 */
export type AppContext = {
    /**
     * Optional label for the App instance.
     */
    name?: string,

    /**
     * Registration-time path prefix for entries registered on this
     * App.
     *
     * When set, every entry registered via `use`, `get`, `post`, …
     * has this prefix prepended to its mount path.
     * `new App({ path: '/api' })` followed by `app.get('/users', h)`
     * is equivalent to `app.get('/api/users', h)` on an App without
     * a `path`.
     *
     * Path matching itself still happens inside the active `IRouter`
     * — this only affects how entries are registered, not how
     * lookup is performed. Local to this App; not propagated to
     * mounted children.
     */
    path?: Path,

    /**
     * Runtime options that propagate to mounted children via
     * mount-time inheritance.
     */
    options?: AppOptionsInput,

    /**
     * Pluggable router (route table). Defaults to `LinearRouter` —
     * walks registered entries linearly per request. Swap in an
     * alternative (e.g. `TrieRouter`) on apps with many routes.
     */
    router?: IRouter<Handler>,
};

// --------------------------------------------------

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
     * Swap the active `IRouter`. Every previously-registered route
     * is replayed onto the new router so lookups stay correct. Any
     * cache the previous router carried is dropped along with it.
     *
     * Useful when the right router family is only known after
     * routes are registered (a SmartRouter-style decision), or for
     * comparing implementations mid-flight without rebuilding the
     * App.
     */
    setRouter(router: IRouter<Handler>): void;

    /**
     * Check if a plugin with the given name is installed on this App
     * at *any* mount path. Plugins installed on a mounted child are
     * merged into the parent at mount time, so this reflects the
     * flattened view.
     */
    hasPlugin(name: string): boolean;

    /**
     * Check if a plugin with the given name is installed at the given
     * install-time `path`. `path` is interpreted relative to this App
     * — the same way `app.use(path, plugin)` takes it. Omit `path` to
     * check the root install.
     */
    hasPluginAt(name: string, path?: Path): boolean;

    /**
     * Get the version of an installed plugin by name, or `undefined`
     * if the plugin is not installed. When the plugin is mounted at
     * several paths, returns the version of an arbitrary mount —
     * typical usage installs the same plugin object at every mount,
     * so the version is identical. Use `getPluginVersionAt` to read
     * the version of a specific mount.
     */
    getPluginVersion(name: string): string | undefined;

    /**
     * Get the version of a plugin installed at the given install-time
     * `path`, or `undefined` when no install matches. `path` is
     * interpreted relative to this App; omit it to read the root
     * install.
     */
    getPluginVersionAt(name: string, path?: Path): string | undefined;

    /**
     * List every canonical mount path the named plugin is installed
     * at. Returns an empty array when the plugin is not installed.
     */
    getPluginMountPaths(name: string): readonly string[];

    /**
     * Register a handler, App, or plugin.
     *
     * When another App is passed, its routes are snapshotted, the
     * mount path is prefixed onto each, and the entries are
     * registered on this App's router. The child's plugin registry
     * is merged into this one. The child is discarded post-mount —
     * later mutations on it do **not** propagate.
     */
    use(app: IApp): this;
    use(handler: Handler | HandlerOptions): this;
    use(plugin: Plugin): this;
    use(path: Path, app: IApp): this;
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
}
