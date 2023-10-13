import { distinctArray } from 'smob';
import type { ErrorProxy } from '../error';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import {
    Handler,
    HandlerType, isHandler, isHandlerConfig,
} from '../handler';
import type { HandlerConfig } from '../handler';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
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
            const output = this.pathMatcher.exec(event.meta.path);
            if (typeof output !== 'undefined') {
                event.meta.mountPath = cleanDoubleSlashes(`${event.meta.mountPath}/${output.path}`);

                if (event.meta.path === output.path) {
                    event.meta.path = '/';
                } else {
                    event.meta.path = withLeadingSlash(event.meta.path.substring(output.path.length));
                }

                event.meta.params = {
                    ...event.meta.params,
                    ...output.params,
                };
            }
        }

        event.meta.routerPath.push(this.id);

        let err : ErrorProxy | undefined;
        let dispatched : boolean | undefined;

        try {
            dispatched = await this.hookManager.triggerEventHook(HookName.DISPATCH_START, event);
        } catch (e) {
            if (isError(e)) {
                err = e;
            }
        }

        if (dispatched) {
            await this.hookManager.triggerEventHook(HookName.DISPATCH_END, event);

            return true;
        }

        let item : Router | Handler | undefined;
        let itemMeta : DispatcherMeta;
        let match = false;
        let isLayer = false;

        for (let i = 0; i < this.stack.length; i++) {
            item = this.stack[i];

            if (isHandler(item)) {
                if (item.type !== HandlerType.ERROR && err) {
                    continue;
                }

                match = item.matchPath(event.meta.path);

                if (match && event.req.method) {
                    if (!item.matchMethod(event.req.method)) {
                        match = false;
                    }

                    if (item.method) {
                        allowedMethods.push(item.method);
                    }
                }

                if (match) {
                    dispatched = await this.hookManager.triggerMatchHook(
                        event,
                        {
                            type: 'handler',
                            method: item.method,
                            path: event.meta.path,
                            element: item,
                        },
                    );
                }

                isLayer = true;
            } else {
                match = item.matchPath(event.meta.path);

                if (match) {
                    dispatched = await this.hookManager.triggerMatchHook(
                        event,
                        {
                            type: 'router',
                            path: event.meta.path,
                            element: item,
                        },
                    );
                }

                isLayer = false;
            }

            if (!match) {
                continue;
            }

            if (dispatched) {
                await this.hookManager.triggerEventHook(HookName.DISPATCH_END, event);

                return true;
            }

            itemMeta = cloneDispatcherMeta(event.meta);
            if (err) {
                itemMeta.error = err;
            }

            try {
                if (isLayer) {
                    dispatched = await this.hookManager.triggerEventHook(HookName.HANDLER_BEFORE, event);
                }

                if (!dispatched) {
                    dispatched = await item.dispatch({
                        ...event,
                        meta: itemMeta,
                    });

                    if (isLayer) {
                        dispatched = (await this.hookManager.triggerEventHook(HookName.HANDLER_AFTER, event)) || dispatched;
                    }
                }
            } catch (e) {
                if (isError(e)) {
                    dispatched = await this.hookManager.triggerErrorHook(HookName.ERROR, event, e);

                    if (!dispatched) {
                        err = e;
                    }
                }
            }

            if (dispatched) {
                await this.hookManager.triggerEventHook(HookName.DISPATCH_END, event);

                return true;
            }
        }

        if (err) {
            dispatched = await this.hookManager.triggerErrorHook(HookName.DISPATCH_FAIL, event, err);
            if (!dispatched) {
                throw err;
            }
        }

        if (
            event.req.method &&
            event.req.method.toLowerCase() === MethodName.OPTIONS
        ) {
            if (allowedMethods.indexOf(MethodName.GET) !== -1) {
                allowedMethods.push(MethodName.HEAD);
            }

            distinctArray(allowedMethods);

            const options = allowedMethods
                .map((key) => key.toUpperCase())
                .join(',');

            if (!isResponseGone(event.res)) {
                event.res.setHeader(HeaderName.ALLOW, options);

                await send(event.res, options);
            }

            await this.hookManager.triggerEventHook(HookName.DISPATCH_END, event);

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
        method: `${MethodName}`,
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
            `${HookName.ERROR}` |
            `${HookName.HANDLER_AFTER}`,
        fn: HookDefaultListener
    ) : number;

    on(
        name: `${HookName.DISPATCH_FAIL}` |
            `${HookName.ERROR}`,
        fn: HookErrorListener
    ) : number;

    on(name: `${HookName}`, fn: HookListener) : number {
        return this.hookManager.addListener(name, fn);
    }

    /**
     * Remove single or all hook listeners.
     *
     * @param name
     */

    off(name: `${HookName}`) : this;

    off(name: `${HookName}`, fn: HookListener | number) : this;

    off(name: `${HookName}`, fn?: HookListener | number) : this {
        if (typeof fn === 'undefined') {
            this.hookManager.removeListener(name);

            return this;
        }

        this.hookManager.removeListener(name, fn);
        return this;
    }
}
