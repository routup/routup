import { distinctArray } from 'smob';
import { HeaderName, MethodName } from '../constants';
import type { DispatchEvent, Dispatcher } from '../dispatcher';
import type { RoutupError } from '../error';
import type { HandlerConfig } from '../handler';
import {
    Handler, HandlerType, isHandler, isHandlerConfig,
} from '../handler';
import type {
    HookDefaultListener, HookErrorListener, HookListener, HookUnsubscribeFn,
} from '../hook';
import { HookManager, HookName } from '../hook';
import type { Path } from '../path';
import { PathMatcher, isPath } from '../path';
import type { Plugin, PluginInstallContext } from '../plugin';
import { isPlugin } from '../plugin';
import { send } from '../response';
import type { RouterOptionsInput } from '../router-options';
import { setRouterOptions } from '../router-options';
import { transformRouterOptions } from '../router-options/transform';
import { cleanDoubleSlashes, withLeadingSlash, withoutTrailingSlash } from '../utils';
import { RouterPipelineStep, RouterSymbol } from './constants';
import type { RouterPipelineContext } from './types';
import { generateRouterID, isRouterInstance } from './utils';

export class Router implements Dispatcher {
    readonly '@instanceof' = RouterSymbol;

    /**
     * An identifier for the router instance.
     */
    readonly id : number;

    /**
     * A label for the router instance.
     */
    readonly name?: string;

    /**
     * Array of mounted layers, routes & routers.
     *
     * @protected
     */
    protected stack : (Router | Handler)[] = [];

    /**
     * Path matcher for the current mount path.
     *
     * @protected
     */
    protected pathMatcher : PathMatcher | undefined;

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

        setRouterOptions(this.id, transformRouterOptions(options));
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
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

        if (typeof value === 'string') {
            this.pathMatcher = new PathMatcher(
                withLeadingSlash(withoutTrailingSlash(`${value}`)),
                {
                    end: false,
                },
            );
        } else {
            this.pathMatcher = new PathMatcher(
                value,
                {
                    end: false,
                },
            );
        }
    }

    // --------------------------------------------------

    protected async executePipelineStep(context: RouterPipelineContext) : Promise<void> {
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

    protected async executePipelineStepStart(context: RouterPipelineContext) : Promise<void> {
        return this.hookManager.trigger(HookName.DISPATCH_START, context.event)
            .then(() => {
                if (context.event.dispatched) {
                    context.step = RouterPipelineStep.FINISH;
                } else {
                    context.step++;
                }

                return this.executePipelineStep(context);
            });
    }

    protected async executePipelineStepLookup(context: RouterPipelineContext) : Promise<void> {
        if (
            context.event.dispatched ||
            context.stackIndex >= this.stack.length
        ) {
            context.step = RouterPipelineStep.FINISH;
            return this.executePipelineStep(context);
        }

        let match : boolean;

        const item = this.stack[context.stackIndex];

        if (isHandler(item)) {
            if (
                (context.event.error && item.type === HandlerType.CORE) ||
                (!context.event.error && item.type === HandlerType.ERROR)
            ) {
                context.stackIndex++;
                return this.executePipelineStepLookup(context);
            }

            match = item.matchPath(context.event.path);

            if (match) {
                if (item.method) {
                    context.event.methodsAllowed.push(item.method);
                }

                if (item.matchMethod(context.event.method)) {
                    await this.hookManager.trigger(HookName.MATCH, context.event);

                    context.step++;

                    return this.executePipelineStep(context);
                }
            }

            context.stackIndex++;
            return this.executePipelineStepLookup(context);
        }

        match = item.matchPath(context.event.path);

        if (match) {
            await this.hookManager.trigger(HookName.MATCH, context.event);

            context.step++;

            return this.executePipelineStep(context);
        }

        context.stackIndex++;
        return this.executePipelineStepLookup(context);
    }

    protected async executePipelineStepChildBefore(context: RouterPipelineContext) : Promise<void> {
        return this.hookManager.trigger(HookName.CHILD_BEFORE, context.event)
            .then(() => {
                if (context.event.dispatched) {
                    context.step = RouterPipelineStep.FINISH;
                } else {
                    context.step++;
                }

                return this.executePipelineStep(context);
            });
    }

    protected async executePipelineStepChildAfter(context: RouterPipelineContext) : Promise<void> {
        return this.hookManager.trigger(HookName.CHILD_AFTER, context.event)
            .then(() => {
                if (context.event.dispatched) {
                    context.step = RouterPipelineStep.FINISH;
                } else {
                    context.step = RouterPipelineStep.LOOKUP;
                }

                return this.executePipelineStep(context);
            });
    }

    protected async executePipelineStepChildDispatch(context: RouterPipelineContext) : Promise<void> {
        if (
            context.event.dispatched ||
            typeof this.stack[context.stackIndex] === 'undefined'
        ) {
            context.step = RouterPipelineStep.FINISH;
            return this.executePipelineStep(context);
        }

        try {
            await this.stack[context.stackIndex].dispatch(context.event);
        } catch (e) {
            context.event.error = e as RoutupError;

            await this.hookManager.trigger(HookName.ERROR, context.event);
        }

        context.stackIndex++;
        context.step++;

        return this.executePipelineStep(context);
    }

    protected async executePipelineStepFinish(context: RouterPipelineContext) : Promise<void> {
        if (context.event.error) {
            await this.hookManager.trigger(HookName.DISPATCH_FAIL, context.event);
        }

        if (context.event.error || context.event.dispatched) {
            return this.hookManager.trigger(HookName.DISPATCH_END, context.event);
        }

        if (
            !context.event.dispatched &&
            context.event.method &&
            context.event.method === MethodName.OPTIONS
        ) {
            if (context.event.methodsAllowed.indexOf(MethodName.GET) !== -1) {
                context.event.methodsAllowed.push(MethodName.HEAD);
            }

            distinctArray(context.event.methodsAllowed);

            const options = context.event.methodsAllowed
                .map((key) => key.toUpperCase())
                .join(',');

            context.event.response.setHeader(HeaderName.ALLOW, options);

            await send(context.event.response, options);

            context.event.dispatched = true;
        }

        return this.hookManager.trigger(HookName.DISPATCH_END, context.event);
    }

    // --------------------------------------------------

    async dispatch(
        event: DispatchEvent,
    ) : Promise<void> {
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

        const context : RouterPipelineContext = {
            step: RouterPipelineStep.START,
            event,
            stackIndex: 0,
        };

        event.routerPath.push(this.id);

        return this.executePipelineStepStart(context)
            .then(() => {
                context.event.routerPath.pop();
            });
    }

    // --------------------------------------------------

    delete(...handlers: (Handler | HandlerConfig)[]) : this;

    delete(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    delete(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.DELETE, ...input);

        return this;
    }

    get(...handlers: (Handler | HandlerConfig)[]) : this;

    get(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    get(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.GET, ...input);

        return this;
    }

    post(...handlers: (Handler | HandlerConfig)[]) : this;

    post(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    post(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.POST, ...input);

        return this;
    }

    put(...handlers: (Handler | HandlerConfig)[]) : this;

    put(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    put(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.PUT, ...input);

        return this;
    }

    patch(...handlers: (Handler | HandlerConfig)[]) : this;

    patch(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    patch(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.PATCH, ...input);

        return this;
    }

    head(...handlers: (Handler | HandlerConfig)[]) : this;

    head(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    head(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.HEAD, ...input);

        return this;
    }

    options(...handlers: (Handler | HandlerConfig)[]) : this;

    options(path: Path, ...handlers: (Handler | HandlerConfig)[]) : this;

    options(...input: (Path | Handler | HandlerConfig)[]) : this {
        this.useForMethod(MethodName.OPTIONS, ...input);

        return this;
    }

    // --------------------------------------------------

    protected useForMethod(
        method: MethodName,
        ...input: (Path | Handler | HandlerConfig)[]
    ) {
        let path : Path | undefined;

        for (let i = 0; i < input.length; i++) {
            const element = input[i];
            if (isPath(element)) {
                path = element;
                continue;
            }

            if (isHandlerConfig(element)) {
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

    use(router: Router) : this;

    use(handler: Handler | HandlerConfig) : this;

    use(plugin: Plugin) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: Handler | HandlerConfig) : this;

    use(path: Path, plugin: Plugin) : this;

    use(...input: unknown[]) : this {
        const modifyPath = (input?: Path) => {
            if (typeof input === 'string') {
                return withLeadingSlash(input);
            }

            return input;
        };

        let path : Path | undefined;
        for (let i = 0; i < input.length; i++) {
            const item = input[i];

            if (isPath(item)) {
                path = modifyPath(item);
                continue;
            }

            if (isRouterInstance(item)) {
                if (path) {
                    item.setPath(path);
                }
                this.stack.push(item);
                continue;
            }

            if (isHandlerConfig(item)) {
                item.path = path || modifyPath(item.path);

                this.stack.push(new Handler(item));
                continue;
            }

            if (isHandler(item)) {
                if (path) {
                    item.setPath(path);
                }

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
    ) : this {
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
        name: `${HookName.DISPATCH_START}` |
            `${HookName.DISPATCH_END}` |
            `${HookName.CHILD_BEFORE}` |
            `${HookName.CHILD_AFTER}`,
        fn: HookDefaultListener
    ) : HookUnsubscribeFn;

    on(
        name: `${HookName.MATCH}`,
        fn: HookErrorListener
    ) : HookUnsubscribeFn;

    on(
        name: `${HookName.DISPATCH_FAIL}` |
            `${HookName.ERROR}`,
        fn: HookErrorListener
    ) : HookUnsubscribeFn;

    on(name: `${HookName}`, fn: HookListener) : HookUnsubscribeFn {
        return this.hookManager.addListener(name, fn);
    }

    /**
     * Remove single or all hook listeners.
     *
     * @param name
     */

    off(name: `${HookName}`) : this;

    off(name: `${HookName}`, fn: HookListener) : this;

    off(name: `${HookName}`, fn?: HookListener) : this {
        if (typeof fn === 'undefined') {
            this.hookManager.removeListener(name);

            return this;
        }

        this.hookManager.removeListener(name, fn);
        return this;
    }
}
