import { distinctArray, merge } from 'smob';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import type { ErrorHandler, Handler } from '../handler';
import { Layer, isLayerInstance } from '../layer';
import type { Path, PathMatcherOptions } from '../path';
import { PathMatcher, isPath } from '../path';
import { useRequestPath } from '../request';
import { isResponseGone, send } from '../response';
import { Route, isRouteInstance } from '../route';
import type { RouterOptionsInput } from '../router-options';
import { setRouterOptions } from '../router-options';
import { transformRouterOptions } from '../router-options/transform';
import { cleanDoubleSlashes, withLeadingSlash, withoutTrailingSlash } from '../utils';
import { generateRouterID, isRouterInstance } from './utils';

export class Router implements Dispatcher {
    readonly '@instanceof' = Symbol.for('Router');

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

    /**
     * Path matcher options.
     *
     * @protected
     */
    protected pathMatcherOptions : PathMatcherOptions | undefined;

    // --------------------------------------------------

    constructor(options: RouterOptionsInput = {}) {
        this.id = generateRouterID();
        this.pathMatcherOptions = options.pathMatcher;

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
            sensitive: false,
            ...(this.pathMatcherOptions ? this.pathMatcherOptions : {}),
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
        meta: DispatcherMeta = {},
    ) : Promise<boolean> {
        const allowedMethods : string[] = [];

        let path = meta.path || useRequestPath(event.req);

        if (this.pathMatcher) {
            const output = this.pathMatcher.exec(path);
            if (typeof output !== 'undefined') {
                meta.mountPath = cleanDoubleSlashes(`${meta.mountPath || ''}/${output.path}`);

                if (path === output.path) {
                    path = '/';
                } else {
                    path = withLeadingSlash(path.substring(output.path.length));
                }

                meta.params = merge(meta.params || {}, output.params);
            }
        }

        meta.path = path;

        if (meta.routerIds) {
            meta.routerIds.push(this.id);
        } else {
            meta.routerIds = [this.id];
        }

        if (!meta.mountPath) {
            meta.mountPath = '/';
        }

        let err : Error | undefined;
        let layer : Route | Router | Layer | undefined;
        let match = false;

        for (let i = 0; i < this.stack.length; i++) {
            layer = this.stack[i];

            if (isLayerInstance(layer)) {
                if (!layer.isError() && err) {
                    continue;
                }

                match = layer.matchPath(path);
            } else if (isRouteInstance(layer)) {
                if (err) {
                    continue;
                }

                match = layer.matchPath(path);

                if (
                    event.req.method &&
                    !layer.matchMethod(event.req.method)
                ) {
                    match = false;

                    if (event.req.method.toLowerCase() === MethodName.OPTIONS) {
                        allowedMethods.push(...layer.getMethods());
                    }
                }
            } else if (isRouterInstance(layer)) {
                match = layer.matchPath(path);
            }

            if (!match) {
                continue;
            }

            const layerMeta = cloneDispatcherMeta(meta);
            if (err) {
                layerMeta.error = err;
            }

            try {
                const dispatched = await layer.dispatch(event, layerMeta);
                if (dispatched) {
                    return true;
                }
            } catch (e) {
                if (e instanceof Error) {
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

        const route = new Route({
            path,
            pathMatcher: {
                ...(this.pathMatcherOptions ? { sensitive: this.pathMatcherOptions.sensitive } : {}),
            },
        });
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

    use(handler: Handler) : this;

    use(handler: ErrorHandler) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: Handler) : this;

    use(path: Path, handler: ErrorHandler) : this;

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
                this.stack.push(new Layer({
                    path: path || '/',
                    pathMatcher: {
                        strict: false,
                        end: false,
                        ...(this.pathMatcherOptions ? { sensitive: this.pathMatcherOptions.sensitive } : {}),
                    },
                }, item));
            }
        }

        return this;
    }
}
