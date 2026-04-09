import { getStatusText } from '@ebec/http';
import { HeaderName, MethodName } from '../constants.ts';
import { DispatcherEvent } from '../dispatcher/index.ts';
import type { IDispatcherEvent } from '../dispatcher/index.ts';
import type { RoutupRequest } from '../event/index.ts';
import { createError } from '../error/index.ts';
import {
    Handler,
    type HandlerOptions,
    HandlerType,
    isHandler,
    isHandlerOptions,
} from '../handler/index.ts';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookUnsubscribeFn,
} from '../hook/index.ts';
import { HookManager, HookName } from '../hook/index.ts';
import type { Path } from '../path/index.ts';
import { PathMatcher, isPath } from '../path/index.ts';
import type { Plugin, PluginInstallContext } from '../plugin/index.ts';
import { isPlugin } from '../plugin/index.ts';
import { normalizeRouterOptions } from './options.ts';
import {
    cleanDoubleSlashes,
    withLeadingSlash,
    withoutTrailingSlash,
} from '../utils/index.ts';
import { RouterPipelineStep, RouterSymbol } from './constants.ts';
import type {
    IRouter,
    RouterOptions,
    RouterOptionsInput,
    RouterPipelineContext,
} from './types.ts';
import { acceptsJson, isRouterInstance } from './utils.ts';

export class Router implements IRouter {
    readonly '@instanceof' = RouterSymbol;

    /**
     * A label for the router instance.
     */
    readonly name?: string;

    /**
     * Array of mounted layers, routes & routers.
     *
     * @protected
     */
    protected stack: (Router | Handler)[] = [];

    /**
     * Path matcher for the current mount path.
     *
     * @protected
     */
    protected pathMatcher: PathMatcher | undefined;

    /**
     * A hook manager.
     *
     * @protected
     */
    protected hookManager: HookManager;

    /**
     * Normalized options for this router instance.
     */
    protected _options: Partial<RouterOptions>;

    // --------------------------------------------------

    constructor(input: RouterOptionsInput = {}) {
        this.name = input.name;

        this.hookManager = new HookManager();
        this._options = normalizeRouterOptions(input);

        this.setPath(input.path);
    }

    // --------------------------------------------------

    matchPath(path: string): boolean {
        if (this.pathMatcher) {
            return this.pathMatcher.test(path);
        }

        return true;
    }

    setPath(value?: Path) {
        if (value === '/' || typeof value === 'undefined') {
            this.pathMatcher = undefined;
            return;
        }

        this.pathMatcher = new PathMatcher(
            withLeadingSlash(withoutTrailingSlash(`${value}`)),
            { end: false },
        );
    }

    // --------------------------------------------------

    /**
     * Public entry point — creates a DispatcherEvent from the request,
     * runs the pipeline, and returns a Response (with 404/500 fallbacks).
     */
    async fetch(request: RoutupRequest): Promise<Response> {
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
                                    statusMessage: 'Request Timeout',
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
            const status = event.error.status || 500;
            const message = event.error.statusMessage || getStatusText(status) || 'Unknown Error';
            return this.buildFallbackResponse(request, event, status, message);
        }

        return this.buildFallbackResponse(request, event, 404, 'Not Found');
    }

    protected buildFallbackResponse(request: RoutupRequest, event: IDispatcherEvent, status: number, message: string): Response {
        const headers = new Headers(event.response.headers);
        const statusText = getStatusText(status) || 'Unknown Error';

        if (acceptsJson(request)) {
            headers.set('content-type', 'application/json; charset=utf-8');
            return new Response(JSON.stringify({ status, message }), {
                status,
                statusText,
                headers,
            });
        }

        headers.set('content-type', 'text/plain; charset=utf-8');
        return new Response(message, {
            status,
            statusText,
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
        await this.hookManager.trigger(HookName.REQUEST, context.event);

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
            const item = this.stack[context.stackIndex]!;

            if (isHandler(item)) {
                if (
                    (context.event.error && item.type === HandlerType.CORE) ||
                    (!context.event.error && item.type === HandlerType.ERROR)
                ) {
                    context.stackIndex++;
                    continue;
                }

                const match = item.matchPath(context.event.path);

                if (match) {
                    if (item.method) {
                        context.event.methodsAllowed.add(item.method);
                    }

                    if (item.matchMethod(context.event.method as `${MethodName}`)) {
                        await this.hookManager.trigger(HookName.CHILD_MATCH, context.event);

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

            const match = item.matchPath(context.event.path);

            if (match) {
                await this.hookManager.trigger(HookName.CHILD_MATCH, context.event);

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
        await this.hookManager.trigger(HookName.CHILD_DISPATCH_BEFORE, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.CHILD_DISPATCH;
        }
    }

    protected async executePipelineStepChildAfter(context: RouterPipelineContext): Promise<void> {
        await this.hookManager.trigger(HookName.CHILD_DISPATCH_AFTER, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.LOOKUP;
        }
    }

    protected async executePipelineStepChildDispatch(context: RouterPipelineContext): Promise<void> {
        if (
            context.event.dispatched ||
            typeof this.stack[context.stackIndex] === 'undefined'
        ) {
            context.step = RouterPipelineStep.FINISH;
            return;
        }

        const item = this.stack[context.stackIndex]!;
        const { event } = context;

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

            const response = await item.dispatch(event);

            if (response) {
                context.response = response;
                event.dispatched = true;
            }
        } catch (e) {
            event.error = createError(e);

            await this.hookManager.trigger(HookName.ERROR, event);
        }

        context.stackIndex++;
        context.step = RouterPipelineStep.CHILD_AFTER;
    }

    protected async executePipelineStepFinish(context: RouterPipelineContext): Promise<void> {
        if (context.event.error || context.event.dispatched) {
            return this.hookManager.trigger(HookName.RESPONSE, context.event);
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
                statusText: context.event.response.statusText,
                headers: optionsHeaders,
            });

            context.event.dispatched = true;
        }

        return this.hookManager.trigger(HookName.RESPONSE, context.event);
    }

    // --------------------------------------------------

    async dispatch(
        event: IDispatcherEvent,
    ): Promise<Response | undefined> {
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

            if (isHandlerOptions(element)) {
                if (path) {
                    element.path = path;
                }

                element.method = method;

                this.use(element);

                continue;
            }

            if (isHandler(element)) {
                if (path) {
                    element.setPath(path);
                }

                element.setMethod(method);

                this.use(element);
            }
        }
    }

    // --------------------------------------------------

    use(router: Router): this;

    use(handler: Handler | HandlerOptions): this;

    use(plugin: Plugin): this;

    use(path: Path, router: Router): this;

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
                if (path) {
                    item.setPath(path);
                }
                this.stack.push(item);
                continue;
            }

            if (isHandlerOptions(item)) {
                item.path = path || item.path;

                this.stack.push(new Handler(item));
                continue;
            }

            if (isHandler(item)) {
                item.setPath(path || item.path);

                this.stack.push(item);
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
    protected install(
        plugin: Plugin,
        context: PluginInstallContext = {},
    ): this {
        const name = context.name || plugin.name;

        const router = new Router({ name });
        plugin.install(router);

        if (context.path) {
            this.use(context.path, router);
        } else {
            this.use(router);
        }

        return this;
    }

    //---------------------------------------------------------------------------------

    /**
     * Add a hook listener.
     *
     * @param name
     * @param fn
     */
    on(
        name: `${HookName.REQUEST}` |
            `${HookName.RESPONSE}` |
            `${HookName.CHILD_DISPATCH_BEFORE}` |
            `${HookName.CHILD_DISPATCH_AFTER}`,
        fn: HookDefaultListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(
        name: `${HookName.CHILD_MATCH}`,
        fn: HookDefaultListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(
        name: `${HookName.ERROR}`,
        fn: HookErrorListener,
        priority?: number,
    ): HookUnsubscribeFn;

    on(name: `${HookName}`, fn: HookListener, priority?: number): HookUnsubscribeFn {
        return this.hookManager.addListener(name, fn, priority);
    }

    /**
     * Remove single or all hook listeners.
     *
     * @param name
     */
    off(name: `${HookName}`): this;

    off(name: `${HookName}`, fn: HookListener): this;

    off(name: `${HookName}`, fn?: HookListener): this {
        if (typeof fn === 'undefined') {
            this.hookManager.removeListener(name);

            return this;
        }

        this.hookManager.removeListener(name, fn);
        return this;
    }
}
