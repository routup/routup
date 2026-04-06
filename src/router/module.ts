import { distinctArray } from 'smob';
import { HeaderName, MethodName } from '../constants.ts';
import { RoutupEvent } from '../event/index.ts';
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
import type { RouterOptionsInput } from '../router-options/index.ts';
import { setRouterOptions } from '../router-options/index.ts';
import { normalizeRouterOptions } from '../router-options/normalize.ts';
import { cleanDoubleSlashes, withLeadingSlash, withoutTrailingSlash } from '../utils/index.ts';
import { RouterPipelineStep, RouterSymbol } from './constants.ts';
import type { IRouter, RouterPipelineContext } from './types.ts';
import { acceptsJson, generateRouterID, isRouterInstance } from './utils.ts';

export class Router implements IRouter {
    readonly '@instanceof' = RouterSymbol;

    /**
     * An identifier for the router instance.
     */
    readonly id: number;

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

    // --------------------------------------------------

    constructor(options: RouterOptionsInput = {}) {
        this.id = generateRouterID();
        this.name = options.name;

        this.hookManager = new HookManager();

        this.setPath(options.path);

        setRouterOptions(this.id, normalizeRouterOptions(options));
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
     * Public entry point — creates a RoutupEvent from the request,
     * runs the pipeline, and returns a Response (with 404/500 fallbacks).
     */
    async fetch(request: RoutupRequest): Promise<Response> {
        const event = new RoutupEvent(request);

        let response: Response | undefined;

        try {
            response = await this.dispatch(event);
        } catch (e) {
            event.error = createError(e);
        }

        if (response) {
            return response;
        }

        if (event.error) {
            const status = event.error.statusCode || 500;
            const message = event.error.statusMessage || 'Internal Server Error';
            return this.buildFallbackResponse(request, event, status, message);
        }

        return this.buildFallbackResponse(request, event, 404, 'Not Found');
    }

    protected buildFallbackResponse(request: RoutupRequest, event: RoutupEvent, status: number, message: string): Response {
        const headers = new Headers(event.response.headers);

        if (acceptsJson(request)) {
            headers.set('content-type', 'application/json; charset=utf-8');
            return new Response(JSON.stringify({ status, message }), {
                status,
                statusText: message,
                headers,
            });
        }

        headers.set('content-type', 'text/plain; charset=utf-8');
        return new Response(message, {
            status,
            statusText: message,
            headers,
        });
    }

    // --------------------------------------------------

    protected async executePipelineStep(context: RouterPipelineContext): Promise<void> {
        switch (context.step) {
            case RouterPipelineStep.START: {
                return this.executePipelineStepStart(context);
            }
            case RouterPipelineStep.LOOKUP: {
                return this.executePipelineStepLookup(context);
            }
            case RouterPipelineStep.CHILD_BEFORE: {
                return this.executePipelineStepChildBefore(context);
            }
            case RouterPipelineStep.CHILD_DISPATCH: {
                return this.executePipelineStepChildDispatch(context);
            }
            case RouterPipelineStep.CHILD_AFTER: {
                return this.executePipelineStepChildAfter(context);
            }
            case RouterPipelineStep.FINISH:
            default: {
                return this.executePipelineStepFinish(context);
            }
        }
    }

    protected async executePipelineStepStart(context: RouterPipelineContext): Promise<void> {
        await this.hookManager.trigger(HookName.REQUEST, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.LOOKUP;
        }

        return this.executePipelineStep(context);
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
                        context.event.methodsAllowed.push(item.method);
                    }

                    if (item.matchMethod(context.event.method as `${MethodName}`)) {
                        await this.hookManager.trigger(HookName.CHILD_MATCH, context.event);

                        if (context.event.dispatched) {
                            context.step = RouterPipelineStep.FINISH;
                        } else {
                            context.step = RouterPipelineStep.CHILD_BEFORE;
                        }

                        return this.executePipelineStep(context);
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

                return this.executePipelineStep(context);
            }

            context.stackIndex++;
        }

        context.step = RouterPipelineStep.FINISH;
        return this.executePipelineStep(context);
    }

    protected async executePipelineStepChildBefore(context: RouterPipelineContext): Promise<void> {
        await this.hookManager.trigger(HookName.CHILD_DISPATCH_BEFORE, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.CHILD_DISPATCH;
        }

        return this.executePipelineStep(context);
    }

    protected async executePipelineStepChildAfter(context: RouterPipelineContext): Promise<void> {
        await this.hookManager.trigger(HookName.CHILD_DISPATCH_AFTER, context.event);

        if (context.event.dispatched) {
            context.step = RouterPipelineStep.FINISH;
        } else {
            context.step = RouterPipelineStep.LOOKUP;
        }

        return this.executePipelineStep(context);
    }

    protected async executePipelineStepChildDispatch(context: RouterPipelineContext): Promise<void> {
        if (
            context.event.dispatched ||
            typeof this.stack[context.stackIndex] === 'undefined'
        ) {
            context.step = RouterPipelineStep.FINISH;
            return this.executePipelineStep(context);
        }

        const item = this.stack[context.stackIndex]!;
        const { event } = context;

        // Save next state before wiring up onion model
        const savedNext = event._next;
        const savedNextCalled = event._nextCalled;

        try {
            event._nextCalled = false;
            event._next = async () => {
                // Continue pipeline from the next stack item
                const nextContext: RouterPipelineContext = {
                    step: RouterPipelineStep.LOOKUP,
                    event,
                    stackIndex: context.stackIndex + 1,
                    response: undefined,
                };

                event.routerPath.push(this.id);
                try {
                    await this.executePipelineStep(nextContext);
                } finally {
                    event.routerPath.pop();
                }

                return nextContext.response;
            };

            const response = await item.dispatch(event);

            if (response) {
                context.response = response;
                event.dispatched = true;
            }
        } catch (e) {
            event.error = createError(e);

            await this.hookManager.trigger(HookName.ERROR, event);
        } finally {
            // Restore next state regardless of success or failure
            event._next = savedNext;
            event._nextCalled = savedNextCalled;
        }

        context.stackIndex++;
        context.step = RouterPipelineStep.CHILD_AFTER;

        return this.executePipelineStep(context);
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
            if (context.event.methodsAllowed.includes(MethodName.GET)) {
                context.event.methodsAllowed.push(MethodName.HEAD);
            }

            distinctArray(context.event.methodsAllowed);

            const options = context.event.methodsAllowed
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
        event: RoutupEvent,
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

        event.routerPath.push(this.id);

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
        fn: HookDefaultListener
    ): HookUnsubscribeFn;

    on(
        name: `${HookName.CHILD_MATCH}`,
        fn: HookDefaultListener
    ): HookUnsubscribeFn;

    on(
        name: `${HookName.ERROR}`,
        fn: HookErrorListener
    ): HookUnsubscribeFn;

    on(name: `${HookName}`, fn: HookListener): HookUnsubscribeFn {
        return this.hookManager.addListener(name, fn);
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
