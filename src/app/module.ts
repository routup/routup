import { markInstanceof } from '@ebec/core';
import { HeaderName, MethodName } from '../constants.ts';
import { DispatcherEvent } from '../dispatcher/index.ts';
import type { IDispatcherEvent } from '../dispatcher/index.ts';
import type { AppRequest } from '../event/index.ts';
import { createError } from '../error/index.ts';
import {
    Handler,
    type HandlerOptions,
    HandlerType,
    isHandler,
    isHandlerOptions,
    matchHandlerMethod,
} from '../handler/index.ts';
import type { Path } from '../path/index.ts';
import { isPath } from '../path/index.ts';
import type { Plugin, PluginInstallContext } from '../plugin/index.ts';
import { isPlugin } from '../plugin/index.ts';
import { normalizeAppOptions } from './options.ts';
import {
    acceptsJson,
    joinPaths,
    withLeadingSlash,
} from '../utils/index.ts';
import { AppSymbol } from './constants.ts';
import { LinearRouter } from '../router/linear/index.ts';
import type { IRouter } from '../router/types.ts';
import type {
    AppContext,
    AppOptions,
    IApp,
} from './types.ts';
import { isAppInstance } from './check.ts';
import type { Route, RouteMatch } from '../types.ts';

/**
 * Merge resolver-supplied path params into `event.params` *only* when
 * `match.params` actually has keys. Skipping the object spread on the
 * empty-params path (every static route, every middleware match) saves
 * an allocation per match — the hottest path in static-route apps.
 */
function mergeMatchParams(
    event: IDispatcherEvent,
    matchParams: Record<string, string | undefined>,
): void {
    // Cheap emptiness probe — short-circuits on the first own key.
    let hasKeys = false;
    // eslint-disable-next-line no-unreachable-loop
    for (const _k in matchParams) {
        hasKeys = true;
        break;
    }
    if (!hasKeys) {
        return;
    }
    event.params = {
        ...event.params,
        ...matchParams,
    };
}

export class App implements IApp {
    /**
     * A label for the App instance.
     */
    readonly name?: string;

    /**
     * Registration-time path prefix for entries registered on this
     * App. Local to this instance — never inherited from a parent.
     *
     * @protected
     */
    protected _path?: Path;

    /**
     * Pluggable router (route table) — owns the "which entries match
     * this path?" lookup. Defaults to `LinearRouter` (walks entries
     * linearly per request); swap in via `AppContext.router`
     * for a radix/trie implementation on apps with many routes.
     *
     * @protected
     */
    protected router: IRouter<Handler>;

    /**
     * Normalized options for this App instance.
     *
     * Frozen on construction — once published to `event.appOptions`
     * it is shared across all requests, and a handler must not be
     * able to mutate router-global state.
     */
    protected _options: Readonly<AppOptions>;

    /**
     * Registry of installed plugins on this App, keyed by plugin name
     * then by canonical mount key (the joined `this._path` +
     * install-time `path`, falling back to `'/'` for a root install).
     * Inner-map value is the plugin version (or `undefined`).
     *
     * Per-path keying lets `hasPluginAt` answer "is plugin X mounted at
     * /api?" precisely. By default `install()` is permissive and
     * appends — same `(name, key)` writes the latest version. Plugins
     * opt into deduplication via `singleton` (any-path) or
     * `singletonByPath` (same-path) flags.
     *
     * Read by `flatten()` when merging a child's registry into this
     * one, so `parent.hasPlugin('foo')` reflects plugins installed on
     * mounted children too.
     *
     * @protected
     */
    protected _plugins: Map<string, Map<string, string | undefined>>;

    /**
     * Names of plugins installed with `singleton: true`. Re-installing
     * any of these names — even at a different mount path — is a
     * silent no-op. The claim is sticky: once a name is in here, it
     * stays for the lifetime of the App. Propagated through
     * `flatten()` so a child's singleton claim survives the mount.
     *
     * @protected
     */
    protected _pluginSingletons: Set<string>;

    /**
     * Every route registered on this App, in registration order.
     *
     * Read by `use(otherApp)` to snapshot routes at flatten time.
     * Late mutations to `_routes` after a flatten do not propagate.
     */
    protected _routes: Route<Handler>[] = [];

    // --------------------------------------------------

    constructor(input: AppContext = {}) {
        this.name = input.name;
        this._path = input.path;

        this._plugins = new Map();
        this._pluginSingletons = new Set();
        this.router = input.router ?? new LinearRouter<Handler>();

        this._options = Object.freeze(normalizeAppOptions(input.options ?? {}));

        markInstanceof(this, AppSymbol);
    }

    // --------------------------------------------------

    /**
     * Public read of the canonical route list. Used by `use(child)`
     * to snapshot the child's routes at flatten time. Returned
     * as `readonly` — callers must not mutate.
     */
    get routes(): readonly Route<Handler>[] {
        return this._routes;
    }

    /**
     * Public read of the installed-plugin registry. Used by `flatten()`
     * to merge a child's plugins into this App without reaching into
     * the child's protected fields.
     *
     * Outer key: plugin name. Inner key: canonical mount path (`'/'`
     * for root mounts). Inner value: installed version (or `undefined`).
     *
     * Returned as nested `ReadonlyMap` — callers must not mutate; go
     * through `app.use(plugin)` to install.
     */
    get plugins(): ReadonlyMap<string, ReadonlyMap<string, string | undefined>> {
        return this._plugins;
    }

    /**
     * Public read of the sticky singleton-claim set. Once a plugin
     * name is claimed singleton on an App, every subsequent install
     * of that name is a silent no-op. Used by `flatten()` to
     * propagate child claims forward at mount time.
     *
     * Returned as `ReadonlySet` — callers must not mutate.
     */
    get pluginSingletons(): ReadonlySet<string> {
        return this._pluginSingletons;
    }

    /**
     * Register a route with the active router and record it on the
     * App so `setRouter` / `use(child)` can read the canonical list
     * back.
     *
     * @protected
     */
    protected register(route: Route<Handler>): void {
        this.router.add(route);
        this._routes.push(route);
    }

    /**
     * Swap the active router. Replays every previously-registered
     * route onto the new router so lookups stay correct.
     *
     * Useful for picking a router after route shape is known (e.g.
     * a SmartRouter-style decision), or for testing alternatives
     * mid-flight without rebuilding the App. Any cache the previous
     * router carried is dropped along with it.
     */
    setRouter(router: IRouter<Handler>): void {
        for (const route of this._routes) {
            router.add(route);
        }
        this.router = router;
    }

    // --------------------------------------------------

    /**
     * Public entry point — creates a DispatcherEvent from the request,
     * runs the pipeline, and returns a Response (with 404/500 fallbacks).
     */
    async fetch(request: AppRequest): Promise<Response> {
        const event = new DispatcherEvent(request);

        let response: Response | undefined;

        try {
            const timeoutMs = this._options.timeout;

            if (timeoutMs) {
                const controller = new AbortController();
                event.signal = controller.signal;

                let timerId: ReturnType<typeof setTimeout> | undefined;

                try {
                    response = await Promise.race([
                        this.dispatch(event),
                        new Promise<never>((_, reject) => {
                            timerId = setTimeout(() => {
                                controller.abort();
                                reject(createError({
                                    status: 408,
                                    message: 'Request Timeout',
                                }));
                            }, timeoutMs);
                        }),
                    ]);
                } finally {
                    clearTimeout(timerId);
                }
            } else {
                response = await this.dispatch(event);
            }
        } catch (e) {
            event.error = createError(e);
        }

        if (response) {
            return response;
        }

        if (event.error) {
            return this.buildFallbackResponse(
                request,
                event,
                event.error.status || 500,
                event.error.message,
            );
        }

        return this.buildFallbackResponse(request, event, 404, 'Not Found');
    }

    protected buildFallbackResponse(request: AppRequest, event: IDispatcherEvent, status: number, message: string): Response {
        const headers = new Headers(event.response.headers);

        if (acceptsJson(request)) {
            headers.set('content-type', 'application/json; charset=utf-8');
            return new Response(JSON.stringify({ status, message }), {
                status,
                headers,
            });
        }

        headers.set('content-type', 'text/plain; charset=utf-8');
        return new Response(message, {
            status,
            headers,
        });
    }

    // --------------------------------------------------

    async dispatch(
        event: IDispatcherEvent,
    ): Promise<Response | undefined> {
        const savedPath = event.path;
        const savedMountPath = event.mountPath;
        const savedParams = event.params;
        const savedAppOptions = event.appOptions;
        const wasDispatching = event.isDispatching;

        const isRoot = !wasDispatching;

        event.appOptions = this._options;
        event.isDispatching = true;

        let response: Response | undefined;

        try {
            const matches = this.router.lookup(event.path, event.method);
            response = await this.runMatches(event, matches, event.path, 0);

            // OPTIONS auto-Allow synthesis — runs only on the root and
            // only when no handler produced a response or an error.
            if (
                !event.error &&
                !event.dispatched &&
                isRoot &&
                event.method === MethodName.OPTIONS
            ) {
                if (event.methodsAllowed.has(MethodName.GET)) {
                    event.methodsAllowed.add(MethodName.HEAD);
                }

                const options = [...event.methodsAllowed]
                    .map((key) => key.toUpperCase())
                    .join(',');

                const optionsHeaders = new Headers(event.response.headers);
                optionsHeaders.set(HeaderName.ALLOW, options);
                response = new Response(options, {
                    status: event.response.status || 200,
                    headers: optionsHeaders,
                });

                event.dispatched = true;
            }
        } finally {
            event.appOptions = savedAppOptions;
            event.isDispatching = wasDispatching;

            // Restore routing state when this App did not produce a
            // response, so a re-entrant dispatch caller (anyone
            // invoking another App's `dispatch` on the same event
            // afterwards) sees its own pre-dispatch state.
            if (!event.dispatched) {
                event.path = savedPath;
                event.mountPath = savedMountPath;
                event.params = savedParams;
            }
        }

        return response;
    }

    /**
     * Walk the matched routes for the current event, dispatching each
     * handler in order. Re-entered (recursively) from the `setNext`
     * continuation so `event.next()` resumes from the next match.
     */
    protected async runMatches(
        event: IDispatcherEvent,
        matches: readonly RouteMatch<Handler>[],
        matchesPath: string,
        startIndex: number,
    ): Promise<Response | undefined> {
        let i = startIndex;
        let response: Response | undefined;

        while (!event.dispatched && i < matches.length) {
            const match = matches[i]!;
            const handler = match.route.data;

            // Skip handlers that don't fit the current error state:
            // CORE handlers only run when no error is pending;
            // ERROR handlers only run when one is.
            if (
                (event.error && handler.type === HandlerType.CORE) ||
                (!event.error && handler.type === HandlerType.ERROR)
            ) {
                i++;
                continue;
            }

            const { method } = match.route;

            if (method) {
                event.methodsAllowed.add(method);
            }

            if (!matchHandlerMethod(method, event.method as MethodName)) {
                i++;
                continue;
            }

            mergeMatchParams(event, match.params);

            // Surface the matched prefix as `event.mountPath` for the
            // duration of this handler so static-asset / mount-aware
            // helpers can strip it off `event.path`. Save and restore
            // around the dispatch so siblings see their own prefixes.
            const savedMountPath = event.mountPath;
            if (typeof match.path === 'string') {
                event.mountPath = match.path;
            }

            const capturedMatches = matches;
            const capturedMatchesPath = matchesPath;
            const nextIndex = i + 1;

            event.setNext(async (error?: Error) => {
                if (error) {
                    event.error = createError(error);
                }

                // If the handler mutated `event.path` before calling
                // next(), the captured matches are stale — refresh on
                // the new path. Otherwise resume from the next match.
                const pathChanged = event.path !== capturedMatchesPath;
                const nextMatches = pathChanged ?
                    this.router.lookup(event.path, event.method) :
                    capturedMatches;
                const nextMatchesPath = pathChanged ? event.path : capturedMatchesPath;
                const nextStart = pathChanged ? 0 : nextIndex;

                return this.runMatches(event, nextMatches, nextMatchesPath, nextStart);
            });

            try {
                const dispatchResponse = await handler.dispatch(event);

                if (dispatchResponse) {
                    response = dispatchResponse;
                    event.dispatched = true;
                }
            } catch (e) {
                event.error = createError(e);
                // Fall through to the next match — could be an error
                // handler registered later in the chain.
            } finally {
                event.mountPath = savedMountPath;
            }

            i++;
        }

        return response;
    }

    // --------------------------------------------------

    delete(...handlers: (Handler | HandlerOptions)[]): this;

    delete(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    delete(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.DELETE, ...input);

        return this;
    }

    get(...handlers: (Handler | HandlerOptions)[]): this;

    get(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    get(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.GET, ...input);

        return this;
    }

    post(...handlers: (Handler | HandlerOptions)[]): this;

    post(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    post(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.POST, ...input);

        return this;
    }

    put(...handlers: (Handler | HandlerOptions)[]): this;

    put(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    put(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.PUT, ...input);

        return this;
    }

    patch(...handlers: (Handler | HandlerOptions)[]): this;

    patch(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    patch(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.PATCH, ...input);

        return this;
    }

    head(...handlers: (Handler | HandlerOptions)[]): this;

    head(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    head(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.HEAD, ...input);

        return this;
    }

    options(...handlers: (Handler | HandlerOptions)[]): this;

    options(path: Path, ...handlers: (Handler | HandlerOptions)[]): this;

    options(...input: (Path | Handler | HandlerOptions)[]): this {
        this.useForMethod(MethodName.OPTIONS, ...input);

        return this;
    }

    // --------------------------------------------------

    protected useForMethod(
        method: MethodName,
        ...input: (Path | Handler | HandlerOptions)[]
    ) {
        let path: Path | undefined;

        for (const element of input) {
            if (isPath(element)) {
                path = element;
                continue;
            }

            let handler: Handler;
            // Check isHandler (instanceof brand) BEFORE isHandlerOptions
            // (structural). Handler exposes `fn` and `type` as fields and
            // would otherwise match the structural check and get wrapped
            // into a fresh Handler with an empty config.
            if (isHandler(element)) {
                handler = element;
            } else if (isHandlerOptions(element)) {
                // Construct a fresh Handler from a copy of the options so the
                // user's options object is never mutated.
                handler = new Handler({
                    ...element,
                    method,
                });
            } else {
                continue;
            }

            this.register({
                path: joinPaths(this._path, path, handler.path),
                method,
                data: handler,
            });
        }
    }

    // --------------------------------------------------

    use(app: IApp): this;

    use(handler: Handler | HandlerOptions): this;

    use(plugin: Plugin): this;

    use(path: Path, app: IApp): this;

    use(path: Path, handler: Handler | HandlerOptions): this;

    use(path: Path, plugin: Plugin): this;

    use(...input: unknown[]): this {
        let path: Path | undefined;
        for (const item of input) {
            if (isPath(item)) {
                path = withLeadingSlash(item);
                continue;
            }

            if (isAppInstance(item)) {
                this.flatten(item, path);
                continue;
            }

            // Check isHandler (instanceof brand) BEFORE isHandlerOptions
            // (structural) — see useForMethod for the same reasoning.
            if (isHandler(item)) {
                this.register({
                    path: joinPaths(this._path, path, item.path),
                    method: item.method,
                    data: item,
                });
                continue;
            }

            if (isHandlerOptions(item)) {
                const handler = new Handler({ ...item });

                this.register({
                    path: joinPaths(this._path, path, handler.path),
                    method: handler.method,
                    data: handler,
                });
                continue;
            }

            if (isPlugin(item)) {
                if (path) {
                    this.install(item, { path });
                } else {
                    this.install(item);
                }
            }
        }

        return this;
    }

    /**
     * Snapshot a child App's routes and plugin registry into this
     * one. Each route's path is prefixed with `this._path`, the
     * supplied mount `path`, and the route's own path (in that
     * order); the resulting entry is registered on this App's
     * router. The child app is not retained — late mutations on it
     * after this call do not propagate.
     *
     * @protected
     */
    protected flatten(child: App, path: Path | undefined): void {
        // Routes always propagate — the child's plugin-registry
        // bookkeeping is independent of which routes physically land on
        // this App's router.
        for (const route of child.routes) {
            this.register({
                path: joinPaths(this._path, path, route.path),
                method: route.method,
                data: route.data,
            });
        }

        // Merge the child's plugin registry. Each child key is in the
        // child's canonical path space; composing with `this._path` +
        // the mount `path` lifts it into our canonical space. The
        // child's state is read through its public `plugins` /
        // `pluginSingletons` getters — never the protected fields, so
        // any future custom `IApp` only has to honor the public
        // surface to be mountable.
        for (const [name, childPaths] of child.plugins) {
            // Sticky claim on this side blocks the merge of child's
            // entries for that name. The claim is forward-looking; we
            // don't drop the child's routes (registered above) — only
            // the registry record so `hasPluginAt` reflects the locked
            // namespace.
            if (this._pluginSingletons.has(name)) {
                continue;
            }
            let entry = this._plugins.get(name);
            for (const [childKey, version] of childPaths) {
                const composedKey = joinPaths(this._path, path, childKey) ?? '/';
                // Silent dedup — first writer wins for the same
                // composed key, mirroring `install()`'s silent skip.
                if (entry && entry.has(composedKey)) {
                    continue;
                }
                if (!entry) {
                    entry = new Map();
                    this._plugins.set(name, entry);
                }
                entry.set(composedKey, version);
            }
        }

        // Propagate sticky singleton claims so a child's contract
        // survives the mount. Forward-looking only — pre-existing
        // entries on this side stay; future installs are blocked.
        for (const name of child.pluginSingletons) {
            this._pluginSingletons.add(name);
        }
    }

    // --------------------------------------------------

    /**
     * Check if a plugin with the given name is installed on this App at
     * *any* mount path.
     */
    hasPlugin(name: string): boolean {
        const entry = this._plugins.get(name);
        return !!entry && entry.size > 0;
    }

    /**
     * Check if a plugin with the given name is installed at the given
     * install-time `path`. `path` is interpreted the same way as the
     * argument to `app.use(path, plugin)` — relative to this App. Omit
     * `path` to check the root install.
     */
    hasPluginAt(name: string, path?: Path): boolean {
        const entry = this._plugins.get(name);
        if (!entry) {
            return false;
        }
        const key = joinPaths(this._path, path) ?? '/';
        return entry.has(key);
    }

    /**
     * Get the version of an installed plugin by name, or `undefined`
     * when the plugin is not installed. When the plugin is mounted at
     * several paths, returns the version of an arbitrary mount —
     * typical usage installs the same plugin object at every mount, so
     * the version is identical. Use `getPluginVersionAt` to read the
     * version of a specific mount.
     */
    getPluginVersion(name: string): string | undefined {
        const entry = this._plugins.get(name);
        if (!entry) {
            return undefined;
        }
        const first = entry.values().next();
        return first.done ? undefined : first.value;
    }

    /**
     * Get the version of a plugin installed at the given install-time
     * `path`, or `undefined` when no install matches. `path` is
     * interpreted relative to this App (same convention as
     * `app.use(path, plugin)`); omit it to read the root install.
     */
    getPluginVersionAt(name: string, path?: Path): string | undefined {
        const entry = this._plugins.get(name);
        if (!entry) {
            return undefined;
        }
        return entry.get(joinPaths(this._path, path) ?? '/');
    }

    /**
     * List every canonical mount path the named plugin is installed
     * at. Returns an empty array when the plugin is not installed.
     * Each path is the joined `app._path` + install-time path,
     * normalized to `'/'` for root mounts.
     */
    getPluginMountPaths(name: string): readonly string[] {
        const entry = this._plugins.get(name);
        if (!entry) {
            return [];
        }
        return Array.from(entry.keys());
    }

    // --------------------------------------------------

    protected install(
        plugin: Plugin,
        context: PluginInstallContext = {},
    ): this {
        const mountKey = joinPaths(this._path, context.path) ?? '/';
        const existing = this._plugins.get(plugin.name);

        // Sticky claim: a previous successful `singleton: true` install
        // locked this name. Every further install is a silent no-op so
        // an idempotent `app.use(plugin)` is safe to call from setup
        // code that doesn't know whether the plugin is already mounted.
        if (this._pluginSingletons.has(plugin.name)) {
            return this;
        }

        // This install opts into singleton but the name is already
        // mounted at some path. Silent skip — we do *not* retroactively
        // claim the name singleton, so a later non-flagged install of
        // the same name can still succeed (first-install-wins).
        if (plugin.singleton && existing && existing.size > 0) {
            return this;
        }

        // SingletonByPath: silently skip a second install at the same
        // canonical mount path. Installs at other paths still proceed.
        if (plugin.singletonByPath && existing && existing.has(mountKey)) {
            return this;
        }

        // Give the plugin its own App to install into so it can
        // freely call `app.use(...)` / `app.get(...)` etc. without
        // having to know whether the caller passed a path. We then
        // mount this scratch app, which flattens its routes onto
        // `this` and discards it.
        const scratch = new App({ name: plugin.name });
        plugin.install(scratch);

        if (context.path) {
            this.use(context.path, scratch);
        } else {
            this.use(scratch);
        }

        let entry = this._plugins.get(plugin.name);
        if (!entry) {
            entry = new Map();
            this._plugins.set(plugin.name, entry);
        }
        entry.set(mountKey, plugin.version);

        if (plugin.singleton) {
            this._pluginSingletons.add(plugin.name);
        }

        return this;
    }
}
