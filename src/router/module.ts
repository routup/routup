import type { RequestListener } from 'node:http';
import { distinctArray, merge } from 'smob';
import type {
    DispatcherMeta,
    ErrorHandler,
    Handler,
    Path,

    Request,
    Response,
} from '../type';
import {
    HeaderName,
    MethodName,
} from '../constants';
import {
    isResponseGone,
    send,
    useRequestPath,
} from '../helpers';
import {
    cleanDoubleSlashes,
    createRequestTimeout,
    isInstance,

    isPath,
    withLeadingSlash,
    withoutTrailingSlash,

} from '../utils';
import type { PathMatcherOptions } from '../path';
import { PathMatcher } from '../path';
import { Layer, isLayerInstance } from '../layer';
import { Route, isRouteInstance } from '../route';
import type { RouterOptions } from './type';

export function isRouterInstance(input: unknown) : input is Router {
    if (input instanceof Router) {
        return true;
    }

    return isInstance(input, 'Router');
}

export class Router {
    readonly '@instanceof' = Symbol.for('Router');

    /**
     * Array of mounted layers, routes & routers.
     *
     * @protected
     */
    protected stack : (Router | Route | Layer)[] = [];

    /**
     * Mount path of instance
     *
     * @protected
     */
    protected path : Path | undefined;

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
    protected pathMatcherOptions : PathMatcherOptions;

    /**
     * Timeout before the router decides to abort the request.
     *
     * @protected
     */
    protected timeout: number | undefined;

    // --------------------------------------------------

    constructor(ctx?: RouterOptions) {
        ctx = ctx || {};

        this.pathMatcherOptions = {
            end: false,
            sensitive: true,
            ...(ctx.pathMatcher || {}),
        };

        this.timeout = ctx.timeout;

        this.setPath(ctx.path || '/');
    }

    // --------------------------------------------------

    setPathMatcherOptions(input: PathMatcherOptions) {
        this.pathMatcherOptions = input;

        if (this.pathMatcher) {
            this.pathMatcher.regexpOptions = this.pathMatcherOptions;
        }
    }

    setPath(value: Path) {
        if (value === '/' || !isPath(value)) {
            this.path = '/';
            return;
        }

        if (typeof value === 'string') {
            this.path = withLeadingSlash(withoutTrailingSlash(`${value}`));
        } else {
            this.path = value;
        }

        this.pathMatcher = new PathMatcher(this.path, this.pathMatcherOptions);
    }

    // --------------------------------------------------

    createListener() : RequestListener {
        return (req, res) => {
            if (this.timeout) {
                createRequestTimeout(res, this.timeout);
            }

            Promise.resolve()
                .then(() => this.dispatch(req, res));
        };
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
        req: Request,
        res: Response,
        meta?: DispatcherMeta,
        done?: (err?: Error) => Promise<any>,
    ) : Promise<void> {
        meta = meta || {};

        let index = -1;

        let allowedMethods : string[] = [];
        const check = (err?: Error) : Promise<void> => {
            if (typeof done !== 'undefined') {
                return done(err);
            }

            if (typeof err !== 'undefined') {
                if (!isResponseGone(res)) {
                    res.statusCode = 400;
                    res.end();
                }

                return Promise.resolve();
            }

            if (
                req.method &&
                req.method.toLowerCase() === MethodName.OPTIONS
            ) {
                const options = allowedMethods
                    .map((key) => key.toUpperCase())
                    .join(',');

                res.setHeader(HeaderName.ALLOW, options);

                return send(res, options);
            }

            if (!isResponseGone(res)) {
                res.statusCode = 404;
                res.end();
            }

            return Promise.resolve();
        };

        let path = meta.path || useRequestPath(req);

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

        if (!meta.mountPath) {
            meta.mountPath = '/';
        }

        const next = (err?: Error) : Promise<void> => {
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

                if (isLayerInstance(layer)) {
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
                        req.method &&
                            !layer.matchMethod(req.method)
                    ) {
                        match = false;

                        if (req.method.toLowerCase() === MethodName.OPTIONS) {
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

            const layerMeta : DispatcherMeta = { ...meta };

            if (isLayerInstance(layer)) {
                const output = layer.exec(path);

                if (output) {
                    layerMeta.params = merge(output.params, layerMeta.params || {});
                    layerMeta.mountPath = cleanDoubleSlashes(`${layerMeta.mountPath || ''}/${output.path}`);
                }
            }

            if (err) {
                if (isLayerInstance(layer) && layer.isError()) {
                    return layer.dispatch(req, res, layerMeta, next, err);
                }

                return next(err);
            }

            return layer.dispatch(req, res, layerMeta, next);
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
                sensitive: this.pathMatcherOptions.sensitive,
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
                item.setPathMatcherOptions(this.pathMatcherOptions);
                this.stack.push(item);
                continue;
            }

            if (typeof item === 'function') {
                this.stack.push(new Layer({
                    path: path || '/',
                    pathMatcher: {
                        strict: false,
                        end: false,
                        sensitive: this.pathMatcherOptions.sensitive,
                    },
                }, item));
            }
        }

        return this;
    }
}
