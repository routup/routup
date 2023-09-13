import {
    BadRequestError,
    NotFoundError,
    extendsClientError,
    extendsServerError,
} from '@ebec/http';
import { distinctArray, merge } from 'smob';
import type {
    Dispatcher, DispatcherEvent, DispatcherMeta, DispatcherNext,
} from '../dispatcher';
import {
    HeaderName,
    MethodName,
} from '../constants';
import { cloneDispatcherMeta, mergeDispatcherMetaParams } from '../dispatcher/utils';
import {
    isResponseGone,
    send,
} from '../response';
import { useRequestPath } from '../request';
import type { ErrorHandler, Handler } from '../types';
import {
    cleanDoubleSlashes,
    isInstance,
    withLeadingSlash,
    withoutTrailingSlash,
} from '../utils';
import type { Path, PathMatcherOptions } from '../path';
import { PathMatcher, isPath } from '../path';
import { Layer, isLayerInstance } from '../layer';
import { Route, isRouteInstance } from '../route';
import { setRouterOptions } from '../router-options';
import type { RouterOptionsInput } from '../router-options';
import { generateRouterID } from './utils';

export function isRouterInstance(input: unknown) : input is Router {
    if (input instanceof Router) {
        return true;
    }

    return isInstance(input, 'Router');
}

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

        setRouterOptions(this.id, options);
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

    dispatch(
        event: DispatcherEvent,
        meta?: DispatcherMeta,
        done?: DispatcherNext,
    ) : Promise<void> {
        meta = meta || {};

        let index = -1;

        let allowedMethods : string[] = [];
        const check = (err?: Error) : Promise<void> => {
            if (typeof done !== 'undefined') {
                return done(err);
            }

            if (typeof err !== 'undefined') {
                if (extendsClientError(err) || extendsServerError(err)) {
                    return Promise.reject(err);
                }

                return Promise.reject(new BadRequestError());
            }

            if (
                event.req.method &&
                event.req.method.toLowerCase() === MethodName.OPTIONS
            ) {
                const options = allowedMethods
                    .map((key) => key.toUpperCase())
                    .join(',');

                event.res.setHeader(HeaderName.ALLOW, options);

                return send(event.res, options);
            }

            if (isResponseGone(event.res)) {
                return Promise.resolve();
            }

            return Promise.reject(new NotFoundError());
        };

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

        const next : DispatcherNext = (err?: Error) : Promise<void> => {
            if (index >= this.stack.length) {
                if (err) {
                    return Promise.reject(err);
                }

                return Promise.resolve();
            }

            let layer : Route | Router | Layer | undefined;
            let match = false;

            while (!match && index < this.stack.length) {
                index++;

                layer = this.stack[index];

                if (layer instanceof Layer) {
                    if (!layer.isError() && err) {
                        continue;
                    }

                    match = layer.matchPath(path);
                }

                if (isRouterInstance(layer)) {
                    match = layer.matchPath(path);
                }

                if (isRouteInstance(layer)) {
                    match = layer.matchPath(path);

                    if (
                        event.req.method &&
                            !layer.matchMethod(event.req.method)
                    ) {
                        match = false;

                        if (event.req.method.toLowerCase() === MethodName.OPTIONS) {
                            allowedMethods = distinctArray(merge(
                                allowedMethods,
                                layer.getMethods(),
                            ));
                        }
                    }
                }
            }

            if (!match || !layer) {
                if (err) {
                    return Promise.reject(err);
                }

                return Promise.resolve();
            }

            const layerMeta = cloneDispatcherMeta(meta);
            if (isLayerInstance(layer)) {
                const output = layer.exec(path);

                if (output) {
                    layerMeta.params = mergeDispatcherMetaParams(layerMeta.params, output.params);
                    layerMeta.mountPath = cleanDoubleSlashes(`${layerMeta.mountPath || ''}/${output.path}`);
                }

                if (layer.isError()) {
                    if (err) {
                        layerMeta.error = err;
                        return layer.dispatch(event, layerMeta, next);
                    }

                    return next(err);
                }
            }

            if (err) {
                return next(err);
            }

            return layer.dispatch(event, layerMeta, next);
        };

        return next()
            .then(() => check())
            .catch((e) => check(e));
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

        if (isPath(input[0])) {
            path = input.shift() as Path;
        }

        for (let i = 0; i < input.length; i++) {
            const item = input[i];
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
