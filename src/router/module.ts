import { distinctArray } from 'smob';
import type { ErrorProxy } from '../error';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import type {
    ContextHandler,
    ErrorContextHandler,
    ErrorHandler,
    Handler,
} from '../handler';
import { Layer, isLayerInstance } from '../layer';
import type { Path } from '../path';
import { PathMatcher, isPath } from '../path';
import { isResponseGone, send } from '../response';
import { Route, isRouteInstance } from '../route';
import type { RouterOptionsInput } from '../router-options';
import { setRouterOptions } from '../router-options';
import { transformRouterOptions } from '../router-options/transform';
import { cleanDoubleSlashes, withLeadingSlash, withoutTrailingSlash } from '../utils';
import { RouterSymbol } from './constants';
import { generateRouterID, isRouterInstance } from './utils';

export class Router implements Dispatcher {
    readonly '@instanceof' = RouterSymbol;

    /**
     * An identifier for the router instance.
     */
    readonly id : number;

    /**
     * Array of mounted layers, routes & routers.
     *
     * @protected
     */
    protected stack : (Router | Route | Layer)[] = [];

    /**
     * Path matcher for the current mount path.
     *
     * @protected
     */
    protected pathMatcher : PathMatcher | undefined;

    // --------------------------------------------------

    constructor(options: RouterOptionsInput = {}) {
        this.id = generateRouterID();

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
        let item : Route | Router | Layer | undefined;
        let itemMeta : DispatcherMeta;
        let match = false;

        for (let i = 0; i < this.stack.length; i++) {
            item = this.stack[i];

            if (isLayerInstance(item)) {
                if (!item.isError() && err) {
                    continue;
                }

                match = item.matchPath(meta.path);
            } else if (isRouteInstance(item)) {
                if (err) {
                    continue;
                }

                match = item.matchPath(meta.path);

                if (
                    event.req.method &&
                    !item.matchMethod(event.req.method)
                ) {
                    match = false;

                    if (event.req.method.toLowerCase() === MethodName.OPTIONS) {
                        allowedMethods.push(...item.getMethods());
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
            const options = distinctArray(allowedMethods)
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

    route(
        path: Path,
    ) : Route {
        if (
            typeof path === 'string' &&
            path.length > 0
        ) {
            path = withLeadingSlash(path);
        }

        const index = this.stack.findIndex(
            (item) => isRouteInstance(item) && item.path === path,
        );

        if (index !== -1) {
            return this.stack[index] as Route;
        }

        const route = new Route(path);
        this.stack.push(route);

        return route;
    }

    delete(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.delete(...handlers);

        return this;
    }

    get(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.get(...handlers);

        return this;
    }

    post(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.post(...handlers);

        return this;
    }

    put(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.put(...handlers);

        return this;
    }

    patch(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.patch(...handlers);

        return this;
    }

    head(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.head(...handlers);

        return this;
    }

    options(path: Path, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.options(...handlers);

        return this;
    }

    // --------------------------------------------------

    use(router: Router) : this;

    use(handler: Handler | ContextHandler) : this;

    use(handler: ErrorHandler | ErrorContextHandler) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: Handler | ContextHandler) : this;

    use(path: Path, handler: ErrorHandler | ErrorContextHandler) : this;

    use(...input: unknown[]) : this {
        /* istanbul ignore next */
        if (input.length === 0) {
            return this;
        }

        let path : Path | undefined;
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            if (isPath(item)) {
                path = item;
                continue;
            }

            if (isRouterInstance(item)) {
                if (path) {
                    item.setPath(path);
                }
                this.stack.push(item);
                continue;
            }

            if (typeof item === 'function') {
                this.stack.push(new Layer(item, {
                    path: path || '/',
                    pathMatcher: {
                        end: false,
                    },
                }));
            }
        }

        return this;
    }
}
