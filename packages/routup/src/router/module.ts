/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    BadRequestErrorOptions,
    NotFoundErrorOptions,
} from '@ebec/http';
import { RequestListener, createServer } from 'node:http';
import { merge, mergeArrays } from 'smob';
import {
    ErrorHandler,
    Handler,
    HeaderName,
    Method,
    Next,
    Request,
    Response,
    cleanDoubleSlashes,
    send,
    useRequestPath,
    withLeadingSlash,
    withoutTrailingSlash,
} from '@routup/core';
import { PathMatcher, PathMatcherOptions } from '../path';
import {
    createRequestTimeout,
    isInstance,
    isPath,

} from '../utils';
import { Layer, isLayerInstance } from '../layer';
import { Route, isRouteInstance } from '../route';
import {
    DispatcherMeta,
    Path,
} from '../type';
import { RouterOptions } from './type';

export function isRouterInstance(input: unknown) : input is Router {
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
     * Is this the root instance?
     *
     * @protected
     */
    protected isRoot : boolean | undefined;

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
        this.isRoot = true;

        return (req, res) => {
            this.dispatch(req, res);
        };
    }

    /* istanbul ignore next */
    listen(port: number) {
        const server = createServer(this.createListener());
        return server.listen(port);
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
        done?: Next,
    ) : void {
        let index = -1;

        meta = meta || {};

        let allowedMethods : string[] = [];

        if (
            this.isRoot &&
            typeof this.timeout === 'number'
        ) {
            createRequestTimeout(res, this.timeout, done);
        }

        const fn = (err?: Error) => {
            /* istanbul ignore if */
            if (!this.isRoot) {
                if (typeof done !== 'undefined') {
                    setImmediate(() => done(err));
                }

                return;
            }

            if (typeof err !== 'undefined') {
                res.statusCode = BadRequestErrorOptions.statusCode;
                res.statusMessage = BadRequestErrorOptions.message;

                res.end();

                return;
            }

            if (
                req.method &&
                req.method.toLowerCase() === Method.OPTIONS
            ) {
                const options = allowedMethods
                    .map((key) => key.toUpperCase())
                    .join(',');

                res.setHeader(HeaderName.ALLOW, options);
                send(res, options);

                return;
            }

            res.statusCode = NotFoundErrorOptions.statusCode;
            res.end();
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

        const next = (err?: Error) : void => {
            if (index >= this.stack.length) {
                setImmediate(fn, err);
                return;
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

                        if (req.method.toLowerCase() === Method.OPTIONS) {
                            allowedMethods = mergeArrays(
                                allowedMethods,
                                layer.getMethods(),
                                true,
                            );
                        }
                    }
                }
            }

            if (!match || !layer) {
                setImmediate(fn, err);
                return;
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
                if (
                    isLayerInstance(layer) &&
                    layer.isError()
                ) {
                    layer.dispatch(req, res, layerMeta, next, err);
                    return;
                }

                /* istanbul ignore next */
                setImmediate(next, err);
                return;
            }

            layer.dispatch(req, res, layerMeta, next);
        };

        next();
    }

    /* istanbul ignore next */
    dispatchAsync(
        req: Request,
        res: Response,
    ) : Promise<void> {
        return new Promise((resolve, reject) => {
            this.dispatch(req, res, {}, (err?: Error) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
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
