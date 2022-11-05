/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { GatewayTimeoutErrorOptions, NotImplementedErrorOptions } from '@ebec/http';
import { RequestListener } from 'http';
import { pathToRegexp } from 'path-to-regexp';
import {cleanDoubleSlashes, isInstance, withLeadingSlash, withoutTrailingSlash} from './utils';
import { Layer, isLayerInstance } from './layer';
import { Route, isRouteInstance } from './route';
import {
    ErrorHandler,
    Next,
    Request, Response, RouteHandler, RouterOptions,
} from './type';
import {setRequestMountPath, setRequestRelativePath, useRequestPath} from './helpers';

export function isRouterInstance(input: unknown) : input is Router {
    return isInstance(input, 'Router');
}

export class Router {
    readonly '@instanceof' = Symbol.for('Router');

    protected options: RouterOptions;

    protected stack : (Router | Route | Layer)[] = [];

    protected regexp : RegExp;

    // --------------------------------------------------

    constructor(options?: RouterOptions) {
        options = options || {};
        options.timeout = options.timeout || 60_000;
        options.mountPath = options.mountPath || '/';
        options.root = options.root ?? true;

        this.options = options;

        this.setOption('mountPath', options.mountPath);
    }

    // --------------------------------------------------

    setOption<T extends keyof RouterOptions>(key: T, value: RouterOptions[T]) {
        if(key === 'mountPath') {
            if(value === '/') {
                this.options.mountPath = '/';
            } else {
                this.options.mountPath = withLeadingSlash(withoutTrailingSlash(`${value}`));
            }

            this.regexp = pathToRegexp(this.options.mountPath, [], { end: false });

            return;
        }

        this.options[key] = value;
    }

    // --------------------------------------------------

    listener() : RequestListener {
        return (req, res) => {
            this.dispatch(req, res);
        };
    }

    matchPath(path: string) : boolean {
        if (path === '/') {
            return true;
        }

        return this.regexp.test(path);
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        done?: Next,
    ) : void {
        let index = -1;

        let timeout : ReturnType<typeof setTimeout> | undefined;

        if (this.options.root) {
            timeout = setTimeout(() => {
                res.statusCode = GatewayTimeoutErrorOptions.statusCode;
                res.statusMessage = GatewayTimeoutErrorOptions.message;

                res.end();
            }, this.options.timeout);

            res.once('close', () => {
                clearTimeout(timeout);

                if (
                    this.options.root &&
                    typeof done === 'function'
                ) {
                    done();
                }
            });

            res.once('error', (e) => {
                clearTimeout(timeout);

                if (
                    this.options.root &&
                    typeof done === 'function'
                ) {
                    done(e);
                }
            });
        }

        const fn = (err?: Error) => {
            if (!this.options.root) {
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

            res.statusCode = NotImplementedErrorOptions.statusCode;
            res.statusMessage = NotImplementedErrorOptions.message;

            res.end();
        };

        const path = useRequestPath(req);

        const next = (err?: Error) : void => {
            if (index >= this.stack.length) {
                setImmediate(() => fn(err));
            }

            const relativePath = this.withoutMountPath(path);
            setRequestRelativePath(req, relativePath);
            setRequestMountPath(req, this.options.mountPath);

            let layer : Route | Router | Layer;
            let match = false;

            while (match !== true && index < this.stack.length) {
                index++;
                layer = this.stack[index];

                if (isLayerInstance(layer)) {
                    match = layer.exec(relativePath);
                }

                if (isRouterInstance(layer)) {
                    match = layer.matchPath(relativePath);
                }

                if (isRouteInstance(layer)) {
                    match = layer.matchPath(relativePath) && layer.matchMethod(req.method);
                }
            }

            if (!match) {
                fn(err);
                return;
            }

            if (err) {
                if (
                    isLayerInstance(layer) &&
                    layer.isError()
                ) {
                    layer.dispatch(req, res, next, err);

                    return;
                }

                next(err);

                return;
            }

            layer.dispatch(req, res, next);
        };

        next();
    }

    dispatchAsync(
        req: Request,
        res: Response,
    ) : Promise<void> {
        return new Promise((resolve, reject) => {
            this.dispatch(req, res, (err?: Error) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    // --------------------------------------------------

    use(router: Router | RouteHandler | ErrorHandler) : this;

    use(path: string, router: Router | RouteHandler | ErrorHandler) : this;

    use(key: Router | RouteHandler | ErrorHandler | string, value?: Router | RouteHandler | ErrorHandler) : this {
        if (typeof value === 'undefined') {
            if (isRouterInstance(key)) {
                key.setOption('root', false);
                this.stack.push(key);
            } else if (typeof key !== 'string') {
                this.stack.push(new Layer('/', { strict: false, end: false}, key));
            }

            return this;
        }

        if(typeof key === 'string') {
            if (isRouterInstance(value)) {
                value.setOption('mountPath', key);
                value.setOption('root', false);

                this.stack.push(value);
            } else {
                const layer = new Layer(key, {strict: false, end: false}, value);
                this.stack.push(layer);
            }
        }

        return this;
    }

    // --------------------------------------------------

    protected route(
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

    delete(path: string, fn: RouteHandler) : this {
        const route = this.route(path);
        route.delete(fn);

        return this;
    }

    get(path: string, fn: RouteHandler) : this {
        const route = this.route(path);
        route.get(fn);

        return this;
    }

    post(path: string, fn: RouteHandler) : this {
        const route = this.route(path);
        route.post(fn);

        return this;
    }

    put(path: string, fn: RouteHandler) : this {
        const route = this.route(path);
        route.put(fn);

        return this;
    }

    patch(path: string, fn: RouteHandler) : this {
        const route = this.route(path);
        route.patch(fn);

        return this;
    }

    // --------------------------------------------------

    private withoutMountPath(path: string) {
        if(typeof this.options.mountPath === 'undefined') {
            return path;
        }

        if(path.startsWith(this.options.mountPath)) {
            path = path.substring(this.options.mountPath.length);
        }

        return cleanDoubleSlashes(withLeadingSlash(path));
    }
}
