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

    // --------------------------------------------------

    constructor(options: RouterOptionsInput = {}) {
        this.id = generateRouterID();
        this.name = options.name;

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
        meta: DispatcherMeta,
    ) : Promise<boolean> {
        const allowedMethods : string[] = [];

        if (this.pathMatcher) {
            const output = this.pathMatcher.exec(meta.path);
            if (typeof output !== 'undefined') {
                meta.mountPath = cleanDoubleSlashes(`${meta.mountPath}/${output.path}`);

                if (meta.path === output.path) {
                    meta.path = '/';
                } else {
                    meta.path = withLeadingSlash(meta.path.substring(output.path.length));
                }

                meta.params = {
                    ...meta.params,
                    ...output.params,
                };
            }
        }

        meta.routerPath.push(this.id);

        let err : ErrorProxy | undefined;
        let item : Router | Layer | undefined;
        let itemMeta : DispatcherMeta;
        let match = false;

        for (let i = 0; i < this.stack.length; i++) {
            item = this.stack[i];

            if (isLayerInstance(item)) {
                if (
                    item.type !== HandlerType.ERROR &&
                    err
                ) {
                    continue;
                }

                match = item.matchPath(meta.path);

                if (match && event.req.method) {
                    if (!item.matchMethod(event.req.method)) {
                        match = false;
                    }

                    if (item.method) {
                        allowedMethods.push(item.method);
                    }
                }
            } else if (isRouterInstance(item)) {
                match = item.matchPath(meta.path);
            }

            if (!match) {
                continue;
            }

            itemMeta = cloneDispatcherMeta(meta);
            if (err) {
                itemMeta.error = err;
            }

            try {
                const dispatched = await item.dispatch(event, itemMeta);
                if (dispatched) {
                    return true;
                }
            } catch (e) {
                if (isError(e)) {
                    err = e;
                }
            }
        }

        if (err) {
            throw err;
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

            return true;
        }

        return false;
    }

    // --------------------------------------------------

    delete(handler: Handler) : this;

    delete(path: Path, handler: Handler) : this;

    delete(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.DELETE,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.DELETE,
        });

        return this;
    }

    get(handler: Handler) : this;

    get(path: Path, handler: Handler) : this;

    get(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.GET,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.GET,
        });

        return this;
    }

    post(handler: Handler) : this;

    post(path: Path, handler: Handler) : this;

    post(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.POST,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.POST,
        });
        return this;
    }

    put(handler: Handler) : this;

    put(path: Path, handler: Handler) : this;

    put(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.PUT,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.PUT,
        });

        return this;
    }

    patch(handler: Handler) : this;

    patch(path: Path, handler: Handler) : this;

    patch(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.PATCH,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.PATCH,
        });

        return this;
    }

    head(handler: Handler) : this;

    head(path: Path, handler: Handler) : this;

    head(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.HEAD,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.HEAD,
        });

        return this;
    }

    options(handler: Handler) : this;

    options(path: Path, handler: Handler) : this;

    options(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use({
                ...handler,
                method: MethodName.OPTIONS,
                path,
            });

            return this;
        }

        this.use({
            ...path,
            method: MethodName.OPTIONS,
        });

        return this;
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
}
