import { distinctArray } from 'smob';
import type { ErrorProxy } from '../error';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import {
    HandlerType, isHandler,
} from '../handler';
import type { Handler } from '../handler';
import type {
    HookErrorFn,
    HookEventFn,
    HookFn,
} from '../hook';
import {
    HookManager,
    HookName,
} from '../hook';
import { Layer, isLayerInstance } from '../layer';
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
    protected stack : (Router | Layer)[] = [];

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

    setPath(value?: Path) {
        if (value === '/' || !isPath(value)) {
            return;
        }

        let path : Path;
        if (typeof value === 'string') {
            path = withLeadingSlash(withoutTrailingSlash(`${value}`));
        } else {
            path = value;
        }

        this.pathMatcher = new PathMatcher(path, {
            end: false,
        });
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        if (this.pathMatcher) {
            return this.pathMatcher.test(path);
        }

        return true;
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
            dispatched = await this.hookManager.callEventHook(HookName.DISPATCH_START, event);
        } catch (e) {
            if (isError(e)) {
                err = e;
            }
        }

        if (dispatched) {
            await this.hookManager.callEventHook(HookName.DISPATCH_END, event);

            return true;
        }

        let item : Router | Layer | undefined;
        let itemMeta : DispatcherMeta;
        let match = false;
        let isLayer = false;

        for (let i = 0; i < this.stack.length; i++) {
            item = this.stack[i];

            if (isLayerInstance(item)) {
                if (
                    item.type !== HandlerType.ERROR &&
                    err
                ) {
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

                isLayer = true;
            } else if (isRouterInstance(item)) {
                match = item.matchPath(event.meta.path);

                isLayer = false;
            }

            if (!match) {
                continue;
            }

            itemMeta = cloneDispatcherMeta(event.meta);
            if (err) {
                itemMeta.error = err;
            }

            try {
                if (isLayer) {
                    dispatched = await this.hookManager.callEventHook(HookName.HANDLER_BEFORE, event);
                }

                if (!dispatched) {
                    dispatched = await item.dispatch({
                        ...event,
                        meta: itemMeta,
                    });

                    if (isLayer) {
                        if (dispatched) {
                            await this.hookManager.callEventHook(HookName.HANDLER_AFTER, event);
                        } else {
                            dispatched = await this.hookManager.callEventHook(HookName.HANDLER_AFTER, event);
                        }
                    }
                }
            } catch (e) {
                if (isError(e)) {
                    dispatched = await this.hookManager.callErrorHook(HookName.ERROR, event, e);

                    if (!dispatched) {
                        err = e;
                    }
                }
            }

            if (dispatched) {
                await this.hookManager.callEventHook(HookName.DISPATCH_END, event);

                return true;
            }
        }

        if (err) {
            dispatched = await this.hookManager.callErrorHook(HookName.DISPATCH_FAIL, event, err);
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

            await this.hookManager.callEventHook(HookName.DISPATCH_END, event);

            return true;
        }

        return false;
    }

    // --------------------------------------------------

    delete(...handlers: Handler[]) : this;

    delete(path: Path, ...handlers: Handler[]) : this;

    delete(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.DELETE, ...input);

        return this;
    }

    get(...handlers: Handler[]) : this;

    get(path: Path, ...handlers: Handler[]) : this;

    get(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.GET, ...input);

        return this;
    }

    post(...handlers: Handler[]) : this;

    post(path: Path, ...handlers: Handler[]) : this;

    post(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.POST, ...input);

        return this;
    }

    put(...handlers: Handler[]) : this;

    put(path: Path, ...handlers: Handler[]) : this;

    put(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.PUT, ...input);

        return this;
    }

    patch(...handlers: Handler[]) : this;

    patch(path: Path, ...handlers: Handler[]) : this;

    patch(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.PATCH, ...input);

        return this;
    }

    head(...handlers: Handler[]) : this;

    head(path: Path, ...handlers: Handler[]) : this;

    head(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.HEAD, ...input);

        return this;
    }

    options(...handlers: Handler[]) : this;

    options(path: Path, ...handlers: Handler[]) : this;

    options(...input: (Path | Handler)[]) : this {
        this.useForMethod(MethodName.OPTIONS, ...input);

        return this;
    }

    // --------------------------------------------------

    protected useForMethod(
        method: `${MethodName}`,
        ...input: (Path | Handler)[]
    ) {
        const base : Partial<Handler> = {
            method,
        };

        for (let i = 0; i < input.length; i++) {
            const element = input[i];
            if (isPath(element)) {
                base.path = element;
                continue;
            }

            this.use({
                ...base,
                ...element,
            });
        }
    }

    // --------------------------------------------------

    use(router: Router) : this;

    use(handler: Handler) : this;

    use(plugin: Plugin) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: Handler) : this;

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

            if (isHandler(item)) {
                item.path = path || modifyPath(item.path);
                this.stack.push(new Layer(item));
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
        fn: HookEventFn
    ) : number;

    on(
        name: `${HookName.DISPATCH_FAIL}` |
            `${HookName.ERROR}`,
        fn: HookErrorFn
    ) : number;

    on(name: `${HookName}`, fn: HookFn) : number {
        return this.hookManager.addListener(name, fn);
    }

    /**
     * Remove single or all hook listeners.
     *
     * @param name
     */

    off(name: `${HookName}`) : this;

    off(name: `${HookName}`, fn: HookFn | number) : this;

    off(name: `${HookName}`, fn?: HookFn | number) : this {
        if (typeof fn === 'undefined') {
            this.hookManager.removeListener(name);

            return this;
        }

        this.hookManager.removeListener(name, fn);
        return this;
    }
}
