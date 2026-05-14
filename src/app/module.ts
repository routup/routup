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
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookUnsubscribeFn,
    IHooks,
} from '../hook/index.ts';
import { HookName, Hooks } from '../hook/index.ts';
import type { Path } from '../path/index.ts';
import { isPath } from '../path/index.ts';
import type { Plugin, PluginInstallContext } from '../plugin/index.ts';
import {
    PluginAlreadyInstalledError,
    isPlugin,
} from '../plugin/index.ts';
import { normalizeAppOptions } from './options.ts';
import {
    acceptsJson,
    cleanDoubleSlashes,
    joinPaths,
    withLeadingSlash,
} from '../utils/index.ts';
import { AppPipelineStep, AppStackEntryType, AppSymbol } from './constants.ts';
import { LinearRouter } from '../router/linear/index.ts';
import type { IRouter } from '../router/types.ts';
import type {
    AppOptions,
    AppOptionsInput,
    AppPipelineContext,
    IApp,
} from './types.ts';
import { isAppInstance } from './check.ts';

/**
 * Merge resolver-supplied path params into `event.params` *only* when
 * `match.params` actually has keys. Skipping the object spread on the
 * empty-params path (every static route, every middleware match) saves
 * an allocation per match — the hottest path in static-route apps.
 */
function mergeMatchParams(
    event: IDispatcherEvent,
    matchParams: Record<string, unknown>,
): void {
    // Cheap emptiness probe — short-circuits on the first own key.
    // `for...in` is fine here: resolver params are always plain
    // objects (or `Object.create(null)`), so prototype keys aren't a
    // concern.
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
     * A label for the router instance.
     */
    readonly name?: string;

    /**
     * Pluggable router (route table) — owns the "which entries match
     * this path?" lookup. Defaults to `LinearRouter` (walks entries
     * linearly per request); swap in via `AppOptionsInput.router`
     * for a radix/trie implementation on apps with many routes.
     *
     * @protected
     */
    protected router: IRouter;

    /**
     * Lifecycle hook registry.
     *
     * @protected
     */
    protected hooks: IHooks;

    /**
     * Normalized options for this router instance.
     */
    protected _options: Partial<AppOptions>;

    /**
     * Registry of installed plugins (name → version) on this router.
     *
     * @protected
     */
    protected plugins: Map<string, string | undefined> = new Map();

    // --------------------------------------------------

    constructor(input: AppOptionsInput = {}) {
        this.name = input.name;

        const {
            hooks = new Hooks(),
            plugins = new Map<string, string | undefined>(),
            router = new LinearRouter(),
            ...options
        } = input;

        this.hooks = hooks;
        this.plugins = new Map<string, string | undefined>(plugins);
        this.router = router;

        this._options = normalizeAppOptions(options);

        markInstanceof(this, AppSymbol);
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


    protected async executePipelineStep(context: AppPipelineContext): Promise<void> {
        while (context.step !== AppPipelineStep.FINISH) {
            switch (context.step) {
                case AppPipelineStep.START:
                    await this.executePipelineStepStart(context); break;
                case AppPipelineStep.LOOKUP:
                    await this.executePipelineStepLookup(context); break;
                case AppPipelineStep.CHILD_BEFORE:
                    await this.executePipelineStepChildBefore(context); break;
                case AppPipelineStep.CHILD_DISPATCH:
                    await this.executePipelineStepChildDispatch(context); break;
                case AppPipelineStep.CHILD_AFTER:
                    await this.executePipelineStepChildAfter(context); break;
                default:
                    context.step = AppPipelineStep.FINISH; break;
            }
        }

        await this.executePipelineStepFinish(context);
    }

    protected async executePipelineStepStart(context: AppPipelineContext): Promise<void> {
        if (this.hooks.hasListeners(HookName.START)) {
            await this.hooks.trigger(HookName.START, context.event);
        }

        if (context.event.dispatched) {
            context.step = AppPipelineStep.FINISH;
        } else {
            context.step = AppPipelineStep.LOOKUP;
        }
    }

    protected async executePipelineStepLookup(context: AppPipelineContext): Promise<void> {
        // Resolve matches on first entry, or refresh if a hook mutated
        // `event.path` since the last LOOKUP (rare but supported).
        if (
            typeof context.matches === 'undefined' ||
            context.matchesPath !== context.event.path
        ) {
            context.matches = this.router.lookup(context.event.path);
            context.matchesPath = context.event.path;
        }

        const { matches } = context;

        while (
            !context.event.dispatched &&
            context.matchIndex < matches.length
        ) {
            const match = matches[context.matchIndex]!;
            const { entry } = match;

            if (entry.type === AppStackEntryType.HANDLER) {
                const handler = entry.data;

                if (
                    (context.event.error && handler.type === HandlerType.CORE) ||
                    (!context.event.error && handler.type === HandlerType.ERROR)
                ) {
                    context.matchIndex++;
                    continue;
                }

                const method = entry.method ?? handler.method;

                if (method) {
                    context.event.methodsAllowed.add(method);
                }

                if (!matchHandlerMethod(method, context.event.method as MethodName)) {
                    context.matchIndex++;
                    continue;
                }
            }

            if (this.hooks.hasListeners(HookName.CHILD_MATCH)) {
                await this.hooks.trigger(HookName.CHILD_MATCH, context.event);
            }

            // `dispatched` wins over a path rewrite — a hook that
            // produced a response *and* rewrote the path is finished;
            // restarting LOOKUP would discard the response.
            if (context.event.dispatched) {
                context.step = AppPipelineStep.FINISH;
                return;
            }

            // Otherwise, if the hook rewrote `event.path`, the current
            // `match` is stale; restart LOOKUP so the next dispatch
            // sees a match that corresponds to the new path.
            if (context.event.path !== context.matchesPath) {
                context.matches = undefined;
                context.matchIndex = 0;
                context.step = AppPipelineStep.LOOKUP;
                return;
            }

            context.step = AppPipelineStep.CHILD_BEFORE;
            return;
        }

        context.step = AppPipelineStep.FINISH;
    }

    protected async executePipelineStepChildBefore(context: AppPipelineContext): Promise<void> {
        if (this.hooks.hasListeners(HookName.CHILD_DISPATCH_BEFORE)) {
            await this.hooks.trigger(HookName.CHILD_DISPATCH_BEFORE, context.event);
        }

        // `dispatched` wins over a path rewrite — see CHILD_MATCH.
        if (context.event.dispatched) {
            context.step = AppPipelineStep.FINISH;
            return;
        }

        if (context.event.path !== context.matchesPath) {
            context.matches = undefined;
            context.matchIndex = 0;
            context.step = AppPipelineStep.LOOKUP;
            return;
        }

        context.step = AppPipelineStep.CHILD_DISPATCH;
    }

    protected async executePipelineStepChildAfter(context: AppPipelineContext): Promise<void> {
        if (this.hooks.hasListeners(HookName.CHILD_DISPATCH_AFTER)) {
            await this.hooks.trigger(HookName.CHILD_DISPATCH_AFTER, context.event);
        }

        if (context.event.dispatched) {
            context.step = AppPipelineStep.FINISH;
        } else {
            context.step = AppPipelineStep.LOOKUP;
        }
    }

    protected async executePipelineStepChildDispatch(context: AppPipelineContext): Promise<void> {
        const match = context.matches?.[context.matchIndex];

        if (context.event.dispatched || typeof match === 'undefined') {
            context.step = AppPipelineStep.FINISH;
            return;
        }

        const { entry } = match;
        const { event } = context;

        // Snapshot routing state so we can restore it if the entry yields no
        // response. Without this, a child router that walks past its last
        // handler (e.g. its tail middleware calls next()) would leave the
        // event's path stripped of this entry's mount prefix, and subsequent
        // siblings in the parent's stack would fail to match.
        const savedPath = event.path;
        const savedMountPath = event.mountPath;
        const savedParams = event.params;

        if (entry.type === AppStackEntryType.APP && typeof match.matchedPath === 'string') {
            // App mount: strip the matched prefix off event.path so the
            // child router's pipeline sees a mount-relative path. The child
            // router's intrinsic pathMatcher (if any) is applied on top
            // inside its own dispatch.
            event.mountPath = cleanDoubleSlashes(`${event.mountPath}/${match.matchedPath}`);

            if (event.path === match.matchedPath) {
                event.path = '/';
            } else {
                event.path = withLeadingSlash(event.path.substring(match.matchedPath.length));
            }

            mergeMatchParams(event, match.params);
        } else if (entry.type === AppStackEntryType.HANDLER && typeof match.matchedPath === 'string') {
            // Handler mount: merge route params from the resolver match.
            // Handlers don't strip the path — they're leaves.
            mergeMatchParams(event, match.params);
        }

        try {
            const parentMatches = context.matches;
            const parentMatchesPath = context.matchesPath;
            const nextMatchIndex = context.matchIndex + 1;

            event.setNext(async (error?: Error) => {
                if (error) {
                    event.error = createError(error);
                }

                // Continue pipeline from the next matched entry. RESPONSE
                // is not fired here — `App.dispatch` owns that firing,
                // so nested re-entry naturally skips it.
                //
                // If `event.path` changed since this entry was matched
                // (e.g. the handler mutated it before invoking next()),
                // the captured `nextMatchIndex` is into a stale matches
                // array. Reset to a fresh walk on the new path.
                const pathChanged = event.path !== parentMatchesPath;

                const nextContext: AppPipelineContext = {
                    step: AppPipelineStep.LOOKUP,
                    event,
                    matchIndex: pathChanged ? 0 : nextMatchIndex,
                    matches: pathChanged ? undefined : parentMatches,
                    matchesPath: pathChanged ? undefined : parentMatchesPath,
                    response: undefined,
                };

                await this.executePipelineStep(nextContext);

                return nextContext.response;
            });

            const response = await entry.data.dispatch(event);

            if (response) {
                context.response = response;
                event.dispatched = true;
            }
        } catch (e) {
            event.error = createError(e);

            if (this.hooks.hasListeners(HookName.ERROR)) {
                await this.hooks.trigger(HookName.ERROR, event);
            }
        }

        if (!event.dispatched) {
            event.path = savedPath;
            event.mountPath = savedMountPath;
            event.params = savedParams;
        }

        context.matchIndex++;
        context.step = AppPipelineStep.CHILD_AFTER;
    }

    protected async executePipelineStepFinish(context: AppPipelineContext): Promise<void> {
        if (
            !context.event.error &&
            !context.event.dispatched &&
            context.event.appPath.length === 1 &&
            context.event.method === MethodName.OPTIONS
        ) {
            if (context.event.methodsAllowed.has(MethodName.GET)) {
                context.event.methodsAllowed.add(MethodName.HEAD);
            }

            const options = [...context.event.methodsAllowed]
                .map((key) => key.toUpperCase())
                .join(',');

            const optionsHeaders = new Headers(context.event.response.headers);
            optionsHeaders.set(HeaderName.ALLOW, options);
            context.response = new Response(options, {
                status: context.event.response.status || 200,
                headers: optionsHeaders,
            });

            context.event.dispatched = true;
        }
    }

    // --------------------------------------------------

    async dispatch(
        event: IDispatcherEvent,
    ): Promise<Response | undefined> {
        const savedPath = event.path;
        const savedMountPath = event.mountPath;
        const savedParams = event.params;

        const context: AppPipelineContext = {
            step: AppPipelineStep.START,
            event,
            matchIndex: 0,
        };

        event.appPath.push({ name: this.name, options: this._options });

        try {
            await this.executePipelineStep(context);

            // Fire END here (not inside the pipeline) so it runs exactly
            // once per `App.dispatch` call. The setNext recursion only
            // re-enters `executePipelineStep`, never `dispatch`, so nested
            // middleware walks naturally skip this. Nested routers get
            // their own END firing via their own `dispatch()` invocation.
            if (this.hooks.hasListeners(HookName.END)) {
                await this.hooks.trigger(HookName.END, event);
            }
        } finally {
            event.appPath.pop();

            // Restore routing state when this router did not produce a
            // response, so the caller's pipeline (a parent router) sees its
            // own pre-dispatch path/mountPath/params for subsequent siblings.
            if (!event.dispatched) {
                event.path = savedPath;
                event.mountPath = savedMountPath;
                event.params = savedParams;
            }
        }

        return context.response;
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

            this.router.add({
                type: AppStackEntryType.HANDLER,
                data: handler,
                method,
                path: joinPaths(this._options.path, path, handler.path),
            });
        }
    }

    // --------------------------------------------------

    use(router: IApp): this;

    use(handler: Handler | HandlerOptions): this;

    use(plugin: Plugin): this;

    use(path: Path, router: IApp): this;

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
                this.router.add({
                    type: AppStackEntryType.APP,
                    data: item,
                    path: joinPaths(this._options.path, path),
                });
                continue;
            }

            // Check isHandler (instanceof brand) BEFORE isHandlerOptions
            // (structural) — see useForMethod for the same reasoning.
            if (isHandler(item)) {
                this.router.add({
                    type: AppStackEntryType.HANDLER,
                    data: item,
                    path: joinPaths(this._options.path, path, item.path),
                });
                continue;
            }

            if (isHandlerOptions(item)) {
                const handler = new Handler({ ...item });

                this.router.add({
                    type: AppStackEntryType.HANDLER,
                    data: handler,
                    path: joinPaths(this._options.path, path, handler.path),
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

    // --------------------------------------------------

    /**
     * Check if a plugin with the given name is installed on this router.
     */
    hasPlugin(name: string): boolean {
        return this.plugins.has(name);
    }

    /**
     * Get the version of an installed plugin by name on this router,
     * or `undefined` if the plugin is not installed here.
     */
    getPluginVersion(name: string): string | undefined {
        return this.plugins.get(name);
    }

    // --------------------------------------------------

    protected install(
        plugin: Plugin,
        context: PluginInstallContext = {},
    ): this {
        if (this.plugins.has(plugin.name)) {
            throw new PluginAlreadyInstalledError(plugin.name);
        }

        // Carry the parent's router family forward so plugin sub-apps
        // don't silently downgrade to LinearRouter.
        const router = new App({
            name: plugin.name,
            router: this.router.clone(),
        });
        plugin.install(router);

        if (context.path) {
            this.use(context.path, router);
        } else {
            this.use(router);
        }

        this.plugins.set(plugin.name, plugin.version);

        return this;
    }

    //---------------------------------------------------------------------------------

    /**
     * Return a new `App` that mirrors this one but owns independent
     * mountable state.
     *
     * The new router has:
     * - a fresh `stack` array of shallow-copied entries (handlers and child
     *   routers are shared by reference; only the wrapping entries are new)
     * - the same `pathMatcher` reference (it is stateless)
     * - a fresh `Hooks` instance seeded with the current listeners
     * - a shallow copy of `_options`
     * - a fresh `plugins` map with the same entries
     *
     * Use this when the same logical router needs to be mounted under
     * multiple paths — each mount can receive its own clone so subsequent
     * mutations on one mount do not bleed into the others.
     */
    clone(): IApp {
        const next = new App({
            ...this._options,
            hooks: this.hooks.clone(),
            plugins: this.plugins,
            // Preserve the active router family on the clone — a clone
            // of an app configured with TrieRouter should still use
            // TrieRouter, not silently downgrade to LinearRouter.
            router: this.router.clone(),
        });

        // Re-register entries directly on the cloned resolver. The
        // entries already carry the canonical combined `path` produced
        // by mount-time `joinPaths` — going back through the public
        // `use` / verb shortcuts would re-concat each handler's
        // intrinsic path on top of that and produce `/users/list/list`.
        for (const entry of this.router.entries) {
            if (entry.type === AppStackEntryType.APP) {
                next.router.add({
                    type: AppStackEntryType.APP,
                    data: entry.data.clone() as App,
                    path: entry.path,
                });
                continue;
            }

            next.router.add({
                type: AppStackEntryType.HANDLER,
                data: entry.data,
                method: entry.method,
                path: entry.path,
            });
        }

        return next;
    }

    //---------------------------------------------------------------------------------

    /**
     * Add a hook listener.
     *
     * @param name
     * @param fn
     * @param priority
     */
    on(
        name: typeof HookName.START |
            typeof HookName.END |
            typeof HookName.CHILD_DISPATCH_BEFORE |
            typeof HookName.CHILD_DISPATCH_AFTER,
        fn: HookDefaultListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(
        name: typeof HookName.CHILD_MATCH,
        fn: HookDefaultListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(
        name: typeof HookName.ERROR,
        fn: HookErrorListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(name: HookName, fn: HookListener, priority?: number): HookUnsubscribeFn {
        return this.hooks.addListener(name, fn, priority);
    }

    /**
     * Remove single or all hook listeners.
     *
     * @param name
     */
    off(name: HookName): this;

    off(name: HookName, fn: HookListener): this;

    off(name: HookName, fn?: HookListener): this {
        if (typeof fn === 'undefined') {
            this.hooks.removeListener(name);

            return this;
        }

        this.hooks.removeListener(name, fn);
        return this;
    }
}
