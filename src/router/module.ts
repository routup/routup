import { distinctArray } from 'smob';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent } from '../dispatcher';
import {
    Handler,
    HandlerType, isHandler, isHandlerConfig,
} from '../handler';
import type { HandlerConfig } from '../handler';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,

    HookUnsubscribeFn,
} from '../hook';
import {
    HookManager,
    HookName,
} from '../hook';
import type { Path } from '../path';
import { PathMatcher, isPath } from '../path';
import { isPlugin } from '../plugin';
import { isResponseGone, send } from '../response';
import type { RouterOptionsInput } from '../router-options';
import { setRouterOptions } from '../router-options';
import { transformRouterOptions } from '../router-options/transform';
import { cleanDoubleSlashes, withLeadingSlash, withoutTrailingSlash } from '../utils';
import { RouterSymbol } from './constants';
import type { Plugin, PluginInstallContext } from '../plugin';
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

    async dispatch(
        event: DispatcherEvent,
    ) : Promise<boolean> {
        const allowedMethods : string[] = [];

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

        event.routerPath.push(this.id);

        let dispatched : boolean | undefined;

        try {
            dispatched = await this.hookManager.trigger(HookName.DISPATCH_START, event);
        } catch (e) {
            if (isError(e)) {
                event.error = e;
            }
        }

        if (dispatched) {
            await this.hookManager.trigger(HookName.DISPATCH_END, event);

            return true;
        }

        let item : Router | Handler | undefined;
        let match = false;
        let isLayer = false;

        for (let i = 0; i < this.stack.length; i++) {
            item = this.stack[i];

            if (isHandler(item)) {
                if (item.type !== HandlerType.ERROR && event.error) {
                    continue;
                }

                match = item.matchPath(event.path);

                if (match) {
                    if (!item.matchMethod(event.method)) {
                        match = false;
                    }

                    if (item.method) {
                        allowedMethods.push(item.method);
                    }
                }

                if (match) {
                    event.match = {
                        type: 'handler',
                        data: item,
                    };
                }

                isLayer = true;
            } else {
                match = item.matchPath(event.path);

                if (match) {
                    event.match = {
                        type: 'router',
                        data: item,
                    };
                }

                isLayer = false;
            }

            if (!match) {
                continue;
            }

            dispatched = await this.hookManager.trigger(HookName.MATCH, event);
            if (dispatched) {
                await this.hookManager.trigger(HookName.DISPATCH_END, event);

                return true;
            }

            try {
                if (isLayer) {
                    dispatched = await this.hookManager.trigger(HookName.HANDLER_BEFORE, event);
                }

                if (!dispatched) {
                    dispatched = await item.dispatch(event);

                    if (isLayer) {
                        dispatched = (await this.hookManager.trigger(HookName.HANDLER_AFTER, event)) || dispatched;
                    }
                }
            } catch (e) {
                if (isError(e)) {
                    event.error = e;

                    dispatched = await this.hookManager.trigger(HookName.ERROR, event);
                    if (dispatched) {
                        event.error = undefined;
                    }
                }
            }

            if (!isLayer) {
                event.routerPath.pop();
            }

            if (dispatched) {
                await this.hookManager.trigger(HookName.DISPATCH_END, event);

                return true;
            }
        }

        if (event.error) {
            dispatched = await this.hookManager.trigger(HookName.DISPATCH_FAIL, event);
            if (dispatched) {
                event.error = undefined;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-throw-literal
                throw event.error;
            }
        }

        if (event.method && event.method === MethodName.OPTIONS) {
            if (allowedMethods.indexOf(MethodName.GET) !== -1) {
                allowedMethods.push(MethodName.HEAD);
            }

            distinctArray(allowedMethods);

            const options = allowedMethods
                .map((key) => key.toUpperCase())
                .join(',');

            if (!isResponseGone(event.response)) {
                event.response.setHeader(HeaderName.ALLOW, options);

                await send(event.response, options);
            }

            await this.hookManager.trigger(HookName.DISPATCH_END, event);

            return true;
        }

        return false;
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
            `${HookName.HANDLER_BEFORE}` |
            `${HookName.HANDLER_AFTER}`,
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
