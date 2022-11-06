/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { RequestListener, createServer } from 'http';
import { merge } from 'smob';
import { PathMatcher } from '../path';
import {
    createResponseTimeout,
    isInstance,
    withLeadingSlash,
    withoutTrailingSlash,
} from '../utils';
import { Layer, isLayerInstance } from '../layer';
import { Route, isRouteInstance } from '../route';
import {
    DispatcherMeta,
    ErrorHandler,
    Handler,
    Next,
    Request,
    Response,

} from '../type';
import {
    setRequestMountPath,
    useRequestPath,
} from '../helpers';
import { RouterOptions } from './type';

export function isRouterInstance(input: unknown) : input is Router {
    return isInstance(input, 'Router');
}

export class Router {
    readonly '@instanceof' = Symbol.for('Router');

    protected options: RouterOptions;

    protected stack : (Router | Route | Layer)[] = [];

    protected pathMatcher : PathMatcher | undefined;

    /**
     * Is root router instance?
     *
     * @protected
     */
    protected isRoot : boolean | undefined;

    // --------------------------------------------------

    constructor(options?: RouterOptions) {
        options = options || {};
        options.timeout = options.timeout || 60_000;
        options.mountPath = options.mountPath || '/';

        this.options = options;

        this.setOption('mountPath', this.options.mountPath);
    }

    // --------------------------------------------------

    setOption<T extends keyof RouterOptions>(key: T, value: RouterOptions[T]) {
        if (key === 'mountPath') {
            if (value === '/') {
                this.options.mountPath = '/';
                return;
            }

            this.options.mountPath = withLeadingSlash(withoutTrailingSlash(`${value}`));
            this.pathMatcher = new PathMatcher(this.options.mountPath, { end: false });

            return;
        }

        this.options[key] = value;
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
        const server = createServer(this.createListener);
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

        if (this.isRoot) {
            createResponseTimeout(res, this.options.timeout || 60_000, done);
        }

        const fn = (err?: Error) => {
            /* istanbul ignore if */
            if (!this.isRoot) {
                if (typeof done !== 'undefined') {
                    done(err);
                }

                return;
            }

            if (typeof err !== 'undefined') {
                res.statusCode = 500;
                res.statusMessage = err.message;

                res.end();

                return;
            }

            res.statusCode = 404;
            res.end();
        };

        let path = meta.path || useRequestPath(req);

        if (this.pathMatcher) {
            const output = this.pathMatcher.exec(path);
            if (typeof output !== 'undefined') {
                if (path === output.path) {
                    path = '/';
                } else {
                    path = withLeadingSlash(path.substring(output.path.length));
                }

                meta.params = merge(meta.params || {}, output.params);
            }
        }

        const next = (err?: Error) : void => {
            if (index >= this.stack.length - 1) {
                fn(err);
                return;
            }

            setRequestMountPath(req, this.options.mountPath || '/');

            let layer : Route | Router | Layer | undefined;
            let match = false;

            while (!match && index < this.stack.length) {
                index++;

                layer = this.stack[index];

                if (isLayerInstance(layer)) {
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
                    }
                }
            }

            if (!match || !layer) {
                fn(err);
                return;
            }

            let layerMeta : DispatcherMeta = {
                ...meta,
                path,
            };

            if (isLayerInstance(layer)) {
                const output = layer.exec(path);

                if (output) {
                    layerMeta = {
                        params: output.params,
                    };
                }
            }

            if (err) {
                if (isLayerInstance(layer) && layer.isError()) {
                    layer.dispatch(req, res, layerMeta, next, err);
                    return;
                }

                /* istanbul ignore next */
                next(err);
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

    use(router: Router) : this;

    use(handler: Handler) : this;

    use(handler: ErrorHandler) : this;

    use(path: string, router: Router) : this;

    use(path: string, handler: Handler) : this;

    use(path: string, handler: ErrorHandler) : this;

    use(key: string | Router | Handler | ErrorHandler, value?: Router | Handler | ErrorHandler) : this {
        if (typeof value === 'undefined') {
            if (isRouterInstance(key)) {
                this.stack.push(key);
            } else if (typeof key !== 'string') {
                this.stack.push(new Layer('/', { strict: false, end: false }, key));
            }

            return this;
        }

        if (typeof key === 'string') {
            if (isRouterInstance(value)) {
                value.setOption('mountPath', key);

                this.stack.push(value);
            } else {
                const layer = new Layer(key, { strict: false, end: false }, value);
                this.stack.push(layer);
            }
        }

        return this;
    }

    // --------------------------------------------------

    route(
        path: string,
    ) : Route {
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

    delete(path: string, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.delete(...handlers);

        return this;
    }

    get(path: string, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.get(...handlers);

        return this;
    }

    post(path: string, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.post(...handlers);

        return this;
    }

    put(path: string, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.put(...handlers);

        return this;
    }

    patch(path: string, ...handlers: Handler[]) : this {
        const route = this.route(path);
        route.patch(...handlers);

        return this;
    }
}
