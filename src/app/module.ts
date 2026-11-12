import { markInstanceof } from '@ebec/core';
import { FastResponse } from 'srvx';
import { HeaderName, MethodName } from '../constants.ts';
import type { AppRequest } from '../event/index.ts';
import { createError } from '../error/index.ts';
import {
    Handler,
    type HandlerOptions,
    isHandler,
    isHandlerOptions,
} from '../handler/index.ts';
import type { Path } from '../path/index.ts';
import { isPath } from '../path/index.ts';
import type { Plugin, PluginInstallContext } from '../plugin/index.ts';
import { isPlugin } from '../plugin/index.ts';
import { PluginRegistry, buildPluginMountKey } from '../plugin/registry.ts';
import { normalizeAppOptions } from './options.ts';
import { walkMatches } from './pipeline.ts';
import { PipelineState } from './pipeline-state.ts';
import {
    Deadline,
    acceptsJson,
    addImpliedAllowedMethods,
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
import type { Route } from '../types.ts';

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
     * Registry of installed plugins on this App. Mount keys are the
     * joined `this._path` + install-time `path` (`buildPluginMountKey`).
     *
     * `flatten()` merges a child's registry into this one, so
     * `parent.hasPlugin('foo')` reflects plugins installed on mounted
     * children too.
     *
     * @protected
     */
    protected _pluginRegistry: PluginRegistry;

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

        this._pluginRegistry = new PluginRegistry();
        this.router = input.router ?? new LinearRouter<Handler>();

        this._options = Object.freeze(normalizeAppOptions(input.options ?? {}));

        // Brand the instance so `isAppInstance` can fast-path on
        // class-instance arguments before falling back to the
        // structural shape check.
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
        return this._pluginRegistry.entries;
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
        return this._pluginRegistry.singletons;
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
     * Public entry point, and the only one: looks up the matches of
     * the request, walks them under the global deadline, and returns
     * a Response (with the `Allow` / 404 / error fallbacks).
     */
    async fetch(request: AppRequest): Promise<Response> {
        const state = new PipelineState(request, this._options);

        let response: Response | undefined;

        try {
            const matches = this.router.lookup(state.path, state.method);
            const timeoutMs = this._options.timeout;

            if (timeoutMs) {
                // Not released: the signal stays linked to the request
                // signal after the response is built, so a body that
                // streams afterwards still sees the client going away.
                const deadline = new Deadline(timeoutMs, request.signal);

                state.signal = deadline.signal;

                response = await deadline.run(() => walkMatches(state, matches, 0));
            } else {
                response = await walkMatches(state, matches, 0);
            }

            // An `OPTIONS` request no handler answered, and none
            // failed on, gets the methods of the matched routes.
            if (
                !state.error &&
                !state.dispatched &&
                state.methodsAllowed
            ) {
                response = this.buildAllowResponse(state, state.methodsAllowed);
            }
        } catch (e) {
            state.error = createError(e);
        }

        if (response) {
            return response;
        }

        if (state.error) {
            return this.buildFallbackResponse(
                request,
                state,
                state.error.status || 500,
                state.error.message,
            );
        }

        return this.buildFallbackResponse(request, state, 404, 'Not Found');
    }

    protected buildAllowResponse(state: PipelineState, methods: Set<string>): Response {
        addImpliedAllowedMethods(methods);

        const options = [...methods]
            .map((key) => key.toUpperCase())
            .join(',');

        const headers = new Headers(state.response.headers);

        headers.set(HeaderName.ALLOW, options);

        return new FastResponse(options, {
            status: state.response.status || 200,
            headers,
        });
    }

    protected buildFallbackResponse(request: AppRequest, state: PipelineState, status: number, message: string): Response {
        const headers = new Headers(state.response.headers);

        if (acceptsJson(request)) {
            headers.set('content-type', 'application/json; charset=utf-8');

            return new FastResponse(JSON.stringify({ status, message }), {
                status,
                headers,
            });
        }

        headers.set('content-type', 'text/plain; charset=utf-8');

        return new FastResponse(message, {
            status,
            headers,
        });
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
    protected flatten(child: IApp, path: Path | undefined): void {
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

        // Merge the child's plugin registry under `this._path` + the
        // mount `path`. The child's state is read through its public
        // `plugins` / `pluginSingletons` getters — never the protected
        // fields, so any future custom `IApp` only has to honor the
        // public surface to be mountable.
        this._pluginRegistry.merge(child, this._path, path);
    }

    // --------------------------------------------------

    /**
     * Check if a plugin with the given name is installed on this App at
     * *any* mount path.
     */
    hasPlugin(name: string): boolean {
        return this._pluginRegistry.has(name);
    }

    /**
     * Check if a plugin with the given name is installed at the given
     * install-time `path`. `path` is interpreted the same way as the
     * argument to `app.use(path, plugin)` — relative to this App. Omit
     * `path` to check the root install.
     */
    hasPluginAt(name: string, path?: Path): boolean {
        return this._pluginRegistry.hasAt(name, buildPluginMountKey(this._path, path));
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
        return this._pluginRegistry.getVersion(name);
    }

    /**
     * Get the version of a plugin installed at the given install-time
     * `path`, or `undefined` when no install matches. `path` is
     * interpreted relative to this App (same convention as
     * `app.use(path, plugin)`); omit it to read the root install.
     */
    getPluginVersionAt(name: string, path?: Path): string | undefined {
        return this._pluginRegistry.getVersionAt(name, buildPluginMountKey(this._path, path));
    }

    /**
     * List every canonical mount path the named plugin is installed
     * at. Returns an empty array when the plugin is not installed.
     * Each path is the joined `app._path` + install-time path,
     * normalized to `'/'` for root mounts.
     */
    getPluginMountPaths(name: string): readonly string[] {
        return this._pluginRegistry.getMountPaths(name);
    }

    // --------------------------------------------------

    protected install(
        plugin: Plugin,
        context: PluginInstallContext = {},
    ): this {
        const mountKey = buildPluginMountKey(this._path, context.path);

        if (!this._pluginRegistry.canInstall(plugin, mountKey)) {
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

        this._pluginRegistry.record(plugin, mountKey);

        return this;
    }
}
