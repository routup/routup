import { markInstanceof } from '@ebec/core';
import { HeaderName, MethodName } from '../constants.ts';
import { DispatcherEvent } from '../dispatcher/index.ts';
import type { IDispatcherEvent } from '../dispatcher/index.ts';
import type { RoutupRequest } from '../event/index.ts';
import { createError } from '../error/index.ts';
import {
    Handler,
    type HandlerOptions,
    HandlerType,
    buildHandlerPathMatcher,
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
import type { Path, PathMatcher } from '../path/index.ts';
import { isPath } from '../path/index.ts';
import type { Plugin, PluginInstallContext } from '../plugin/index.ts';
import {
    PluginAlreadyInstalledError,
    isPlugin,
} from '../plugin/index.ts';
import { toResponse } from '../response/index.ts';
import { normalizeRouterOptions } from './options.ts';
import {
    cleanDoubleSlashes,
    withLeadingSlash,
} from '../utils/index.ts';
import { RouterPipelineStep, RouterStackEntryType, RouterSymbol } from './constants.ts';
import type {
    IRouter,
    RouterOptions,
    RouterOptionsInput,
    RouterPipelineContext,
    StackEntry,
    StackHandlerEntry,
} from './types.ts';
import { acceptsJson, buildRouterPathMatcher, isRouterInstance } from './utils.ts';

const METHOD_TO_REGISTER = {
    [MethodName.GET]: 'get',
    [MethodName.POST]: 'post',
    [MethodName.PUT]: 'put',
    [MethodName.PATCH]: 'patch',
    [MethodName.DELETE]: 'delete',
    [MethodName.HEAD]: 'head',
    [MethodName.OPTIONS]: 'options',
} as const satisfies Record<MethodName, keyof Router>;

export class Router implements IRouter {
    /**
     * A label for the router instance.
     */
    readonly name?: string;

    /**
     * Array of mounted layers, routes & routers, each tagged by kind so the
     * dispatch loop can discriminate without `isRouterInstance`/`isHandler`
     * runtime checks.
     *
     * @protected
     */
    protected stack: StackEntry[] = [];

    /**
     * Path matcher for the current mount path.
     *
     * @protected
     */
    protected pathMatcher: PathMatcher | undefined;

    /**
     * Lifecycle hook registry.
     *
     * @protected
     */
    protected hooks: IHooks;

    /**
     * Normalized options for this router instance.
     */
    protected _options: Partial<RouterOptions>;

    /**
     * Registry of installed plugins (name → version) on this router.
     *
     * @protected
     */
    protected plugins: Map<string, string | undefined> = new Map();

    // --------------------------------------------------

    constructor(input: RouterOptionsInput = {}) {
        this.name = input.name;

        const {
            hooks = new Hooks(),
            plugins = new Map<string, string | undefined>(),
            ...options
        } = input;

        this.hooks = hooks;
        this.plugins = new Map<string, string | undefined>(plugins);

        this._options = normalizeRouterOptions(options);
        this.pathMatcher = buildRouterPathMatcher(options.path);

        markInstanceof(this, RouterSymbol);
    }

    // --------------------------------------------------

    matchPath(path: string): boolean {
        if (this.pathMatcher) {
            return this.pathMatcher.test(path);
        }

        return true;
    }

    // --------------------------------------------------

    /**
     * Public entry point — creates a DispatcherEvent from the request,
     * runs the pipeline, and returns a Response (with 404/500 fallbacks).
     */
    async fetch(request: RoutupRequest): Promise<Response> {
        // Fast path: a single CORE handler bound directly to this root
        // router with no hooks, no timeouts, no mount path, and no
        // per-handler hooks. Skips the pipeline state machine, the
        // routerPath push/pop, and all hook-trigger awaits.
        if (
            this.stack.length === 1 &&
            this.pathMatcher === undefined &&
            this._options.timeout === undefined &&
            this._options.handlerTimeout === undefined &&
            this.hooks.isEmpty()
        ) {
            const entry = this.stack[0]!;
            if (
                entry.type === RouterStackEntryType.HANDLER &&
                entry.data.canFastPath()
            ) {
                return this.fetchFast(request, entry as StackHandlerEntry);
            }
        }

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

    /**
     * Single-handler fast path. Preconditions checked by the caller.
     *
     * Skips the dispatch pipeline state machine, hook triggers,
     * routerPath chain, RouterPipelineContext allocation, and the
     * Handler.dispatch wrapper. Pushes router options into the
     * routerPath so toResponse() sees configured `etag`, `trustProxy`,
     * etc. instead of framework defaults.
     */
    protected async fetchFast(request: RoutupRequest, entry: StackHandlerEntry): Promise<Response> {
        const event = new DispatcherEvent(request);
        event.routerPath.push({ name: this.name, options: this._options });

        const method = entry.method ?? entry.data.method;
        if (!matchHandlerMethod(method, event.method as MethodName)) {
            return this.buildFallbackResponse(request, event, 404, 'Not Found');
        }

        if (entry.pathMatcher) {
            const m = entry.pathMatcher.exec(event.path);
            if (!m) {
                return this.buildFallbackResponse(request, event, 404, 'Not Found');
            }
            if (m.params && Object.keys(m.params).length > 0) {
                event.params = m.params;
            }
        }

        if (method) {
            event.methodsAllowed.add(method);
        }

        try {
            // canFastPath() guarantees a CORE handler, so fn has the
            // single-argument signature.
            const fn = entry.data.fn as (event: IDispatcherEvent) => unknown;
            const result = await fn(event);
            if (typeof result === 'undefined') {
                return this.buildFallbackResponse(request, event, 404, 'Not Found');
            }
            const response = await toResponse(result, event);
            return response ?? this.buildFallbackResponse(request, event, 404, 'Not Found');
        } catch (e) {
            const err = createError(e);
            return this.buildFallbackResponse(request, event, err.status || 500, err.message);
        }
    }

    protected buildFallbackResponse(request: RoutupRequest, event: IDispatcherEvent, status: number, message: string): Response {
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

    protected async executePipelineStep(context: RouterPipelineContext): Promise<void> {
        while (context.step !== RouterPipelineStep.FINISH) {
            switch (context.step) {
                case RouterPipelineStep.START:
                    await this.executePipelineStepStart(context); break;
                case RouterPipelineStep.LOOKUP:
                    await this.executePipelineStepLookup(context); break;
                case RouterPipelineStep.CHILD_BEFORE:
                    await this.executePipelineStepChildBefore(context); break;
                case RouterPipelineStep.CHILD_DISPATCH:
                    await this.executePipelineStepChildDispatch(context); break;
                case RouterPipelineStep.CHILD_AFTER:
                    await this.executePipelineStepChildAfter(context); break;
                default:
                    context.step = RouterPipelineStep.FINISH; break;
            }
        }

        await this.executePipelineStepFinish(context);
    }

    protected async executePipelineStepStart(context: RouterPipelineContext): Promise<void> {
        await this.hooks.trigger(HookName.REQUEST, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.LOOKUP;
        }
    }

    protected async executePipelineStepLookup(context: RouterPipelineContext): Promise<void> {
        while (
            !context.event.dispatched &&
            context.stackIndex < this.stack.length
        ) {
            const entry = this.stack[context.stackIndex]!;

            if (entry.type === RouterStackEntryType.HANDLER) {
                const handler = entry.data;

                if (
                    (context.event.error && handler.type === HandlerType.CORE) ||
                    (!context.event.error && handler.type === HandlerType.ERROR)
                ) {
                    context.stackIndex++;
                    continue;
                }

                const match = entry.pathMatcher ?
                    entry.pathMatcher.test(context.event.path) :
                    handler.matchPath(context.event.path);

                if (match) {
                    const method = entry.method ?? handler.method;

                    if (method) {
                        context.event.methodsAllowed.add(method);
                    }

                    if (matchHandlerMethod(method, context.event.method as MethodName)) {
                        await this.hooks.trigger(HookName.CHILD_MATCH, context.event);

                        if (context.event.dispatched) {
                            context.step = RouterPipelineStep.FINISH;
                        } else {
                            context.step = RouterPipelineStep.CHILD_BEFORE;
                        }

                        return;
                    }
                }

                context.stackIndex++;
                continue;
            }

            const match = entry.pathMatcher ?
                entry.pathMatcher.test(context.event.path) :
                entry.data.matchPath(context.event.path);

            if (match) {
                await this.hooks.trigger(HookName.CHILD_MATCH, context.event);

                if (context.event.dispatched) {
                    context.step = RouterPipelineStep.FINISH;
                } else {
                    context.step = RouterPipelineStep.CHILD_BEFORE;
                }

                return;
            }

            context.stackIndex++;
        }

        context.step = RouterPipelineStep.FINISH;
    }

    protected async executePipelineStepChildBefore(context: RouterPipelineContext): Promise<void> {
        await this.hooks.trigger(HookName.CHILD_DISPATCH_BEFORE, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.CHILD_DISPATCH;
        }
    }

    protected async executePipelineStepChildAfter(context: RouterPipelineContext): Promise<void> {
        await this.hooks.trigger(HookName.CHILD_DISPATCH_AFTER, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.LOOKUP;
        }
    }

    protected async executePipelineStepChildDispatch(context: RouterPipelineContext): Promise<void> {
        const entry = this.stack[context.stackIndex];

        if (context.event.dispatched || typeof entry === 'undefined') {
            context.step = RouterPipelineStep.FINISH;
            return;
        }

        const { event } = context;

        // Snapshot routing state so we can restore it if the entry yields no
        // response. Without this, a child router that walks past its last
        // handler (e.g. its tail middleware calls next()) would leave the
        // event's path stripped of this entry's mount prefix, and subsequent
        // siblings in the parent's stack would fail to match.
        const savedPath = event.path;
        const savedMountPath = event.mountPath;
        const savedParams = event.params;

        if (entry.type === RouterStackEntryType.ROUTER && entry.pathMatcher) {
            // Router mount: strip the matched prefix off event.path so the
            // child router's pipeline sees a mount-relative path. The child
            // router's intrinsic pathMatcher (if any) is applied on top
            // inside its own dispatch.
            const output = entry.pathMatcher.exec(event.path);
            if (typeof output !== 'undefined') {
                event.mountPath = cleanDoubleSlashes(`${event.mountPath}/${output.path}`);

                if (event.path === output.path) {
                    event.path = '/';
                } else {
                    event.path = withLeadingSlash(event.path.substring(output.path.length));
                }

                event.params = {
                    ...event.params,
                    ...output.params,
                };
            }
        } else if (entry.type === RouterStackEntryType.HANDLER && entry.pathMatcher) {
            // Handler mount: extract route params from the mount matcher.
            // Handlers don't strip the path — they're leaves.
            const output = entry.pathMatcher.exec(event.path);
            if (typeof output !== 'undefined') {
                event.params = {
                    ...event.params,
                    ...output.params,
                };
            }
        }

        try {
            event.setNext(async (error?: Error) => {
                if (error) {
                    event.error = createError(error);
                }

                // Continue pipeline from the next stack item
                const nextContext: RouterPipelineContext = {
                    step: RouterPipelineStep.LOOKUP,
                    event,
                    stackIndex: context.stackIndex + 1,
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

            await this.hooks.trigger(HookName.ERROR, event);
        }

        if (!event.dispatched) {
            event.path = savedPath;
            event.mountPath = savedMountPath;
            event.params = savedParams;
        }

        context.stackIndex++;
        context.step = RouterPipelineStep.CHILD_AFTER;
    }

    protected async executePipelineStepFinish(context: RouterPipelineContext): Promise<void> {
        if (context.event.error || context.event.dispatched) {
            return this.hooks.trigger(HookName.RESPONSE, context.event);
        }

        if (
            !context.event.dispatched &&
            context.event.routerPath.length === 1 &&
            context.event.method &&
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

        return this.hooks.trigger(HookName.RESPONSE, context.event);
    }

    // --------------------------------------------------

    async dispatch(
        event: IDispatcherEvent,
    ): Promise<Response | undefined> {
        const savedPath = event.path;
        const savedMountPath = event.mountPath;
        const savedParams = event.params;

        if (this.pathMatcher) {
            const output = this.pathMatcher.exec(event.path);
            if (typeof output !== 'undefined') {
                event.mountPath = cleanDoubleSlashes(`${event.mountPath}/${output.path}`);

                if (event.path === output.path) {
                    event.path = '/';
                } else {
                    event.path = withLeadingSlash(event.path.substring(output.path.length));
                }

                event.params = {
                    ...event.params,
                    ...output.params,
                };
            }
        }

        const context: RouterPipelineContext = {
            step: RouterPipelineStep.START,
            event,
            stackIndex: 0,
        };

        event.routerPath.push({ name: this.name, options: this._options });

        try {
            await this.executePipelineStep(context);
        } finally {
            event.routerPath.pop();

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
                    path: path ?? element.path,
                });
            } else {
                continue;
            }

            this.stack.push({
                type: RouterStackEntryType.HANDLER,
                data: handler,
                method,
                path,
                pathMatcher: buildHandlerPathMatcher(path ?? handler.path, true),
            });
        }
    }

    // --------------------------------------------------

    use(router: IRouter): this;

    use(handler: Handler | HandlerOptions): this;

    use(plugin: Plugin): this;

    use(path: Path, router: IRouter): this;

    use(path: Path, handler: Handler | HandlerOptions): this;

    use(path: Path, plugin: Plugin): this;

    use(...input: unknown[]): this {
        let path: Path | undefined;
        for (const item of input) {
            if (isPath(item)) {
                path = withLeadingSlash(item);
                continue;
            }

            if (isRouterInstance(item)) {
                this.stack.push({
                    type: RouterStackEntryType.ROUTER,
                    data: item,
                    path,
                    pathMatcher: buildRouterPathMatcher(path),
                });
                continue;
            }

            // Check isHandler (instanceof brand) BEFORE isHandlerOptions
            // (structural) — see useForMethod for the same reasoning.
            if (isHandler(item)) {
                this.stack.push({
                    type: RouterStackEntryType.HANDLER,
                    data: item,
                    path,
                    pathMatcher: buildHandlerPathMatcher(path, !!item.method),
                });
                continue;
            }

            if (isHandlerOptions(item)) {
                const handler = new Handler({
                    ...item,
                    path: path ?? item.path,
                });

                this.stack.push({
                    type: RouterStackEntryType.HANDLER,
                    data: handler,
                    path,
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

        const router = new Router({ name: plugin.name });
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
     * Return a new `Router` that mirrors this one but owns independent
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
    clone(): IRouter {
        const next = new Router({
            ...this._options,
            hooks: this.hooks.clone(),
            plugins: this.plugins,
        });

        for (const entry of this.stack) {
            if (entry.type === RouterStackEntryType.ROUTER) {
                const data = entry.data.clone();
                if (entry.path) {
                    next.use(entry.path, data);
                } else {
                    next.use(data);
                }
                continue;
            }

            if (entry.method) {
                const register = METHOD_TO_REGISTER[entry.method];
                if (entry.path) {
                    next[register](entry.path, entry.data);
                } else {
                    next[register](entry.data);
                }
                continue;
            }

            if (entry.path) {
                next.use(entry.path, entry.data);
            } else {
                next.use(entry.data);
            }
        }

        return next;
    }

    //---------------------------------------------------------------------------------

    /**
     * Add a hook listener.
     *
     * @param name
     * @param fn
     */
    on(
        name: typeof HookName.REQUEST |
            typeof HookName.RESPONSE |
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
