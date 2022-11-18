/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { RequestListener, createServer } from 'http';
import { isObject, merge, mergeArrays } from 'smob';
import { HeaderName, Method } from '../constants';
import { buildDecoratorMethodArguments } from '../decorators';
import { useDecoratorMeta } from '../decorators/utils';
import {
    ErrorHandler, Handler, createHandlerForClassType, processHandlerExecutionOutput,
} from '../handler';
import { PathMatcher } from '../path';
import {
    cleanDoubleSlashes,
    createResponseTimeout,
    isInstance,
    isPath,
    withLeadingSlash,
    withoutTrailingSlash,
} from '../utils';
import { Layer, isLayerInstance } from '../layer';
import { Route, isRouteInstance } from '../route';
import {
    ClassType,
    DispatcherMeta,
    Next,
    Path,
    Request,
    Response,
} from '../type';
import {
    send,
    useRequestPath,
} from '../helpers';
import { RouterOptions } from './type';

export function isRouterInstance(input: unknown) : input is Router {
    return isInstance(input, 'Router');
}

export class Router {
    readonly '@instanceof' = Symbol.for('Router');

    protected mountPath : Path | undefined;

    protected timeout: number | undefined;

    protected stack : (Router | Route | Layer)[] = [];

    protected pathMatcher : PathMatcher | undefined;

    /**
     * Is root instance?
     *
     * @protected
     */
    protected isRoot : boolean | undefined;

    // --------------------------------------------------

    constructor(options?: RouterOptions) {
        options = options || {};

        this.timeout = options.timeout;
        this.setMountPath(options.mountPath || '/');
    }

    // --------------------------------------------------

    setMountPath(value: Path) {
        if (value === '/' || !isPath(value)) {
            this.mountPath = '/';
            return;
        }

        if (typeof value === 'string') {
            this.mountPath = withLeadingSlash(withoutTrailingSlash(`${value}`));
        } else {
            this.mountPath = value;
        }

        this.pathMatcher = new PathMatcher(this.mountPath, { end: false });
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
            this.timeout
        ) {
            createResponseTimeout(res, this.timeout, done);
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
                res.statusCode = 400;
                res.statusMessage = err.message;

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

            res.statusCode = 404;
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

        if (!meta.mountPath) {
            meta.mountPath = '/';
        }

        const next = (err?: Error) : void => {
            if (index >= this.stack.length - 1) {
                fn(err);
                return;
            }

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
                fn(err);
                return;
            }

            const layerMeta : DispatcherMeta = {
                ...meta,
                path,
            };

            if (isLayerInstance(layer)) {
                const output = layer.exec(path);

                if (output) {
                    layerMeta.params = merge(output.params, layerMeta.params || {});
                    layerMeta.mountPath = cleanDoubleSlashes(`${layerMeta.mountPath || ''}/${output.path}`);
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
                    item.setMountPath(path);
                }
                this.stack.push(item);
                continue;
            }

            if (typeof item === 'function') {
                this.stack.push(new Layer(path || '/', { strict: false, end: false }, item));
            }
        }

        return this;
    }

    // --------------------------------------------------

    useController(input: (ClassType | Record<string, any>)) {
        let controller : Record<string, any>;

        if (isObject(input)) {
            controller = input;
        } else {
            controller = new (input as ClassType)();
        }

        const meta = useDecoratorMeta(controller);

        const router = new Router();

        for (let i = 0; i < meta.middlewares.length; i++) {
            const handler = createHandlerForClassType(meta.middlewares[i]);

            router.use(handler);
        }

        const propertyKeys = Object.keys(meta.methods);
        for (let i = 0; i < propertyKeys.length; i++) {
            const handler : Handler = (req, res, next) => {
                const output = controller[propertyKeys[i]].apply(controller, [
                    ...buildDecoratorMethodArguments(req, res, next, meta.parameters[propertyKeys[i]]),
                ]);

                processHandlerExecutionOutput(res, next, output);
            };

            const method = meta.methods[propertyKeys[i]];
            const handlers : Handler[] = [];
            if (method.middlewares) {
                for (let i = 0; i < method.middlewares.length; i++) {
                    handlers.push(createHandlerForClassType(method.middlewares[i]));
                }
            }

            (router as any)[method.method].apply(router, [
                method.url,
                ...handlers,
                handler,
            ]);
        }

        this.use(meta.url, router);
    }

    useControllers(input: (ClassType | Record<string, any>)[]) {
        for (let i = 0; i < input.length; i++) {
            this.useController(input[i]);
        }
    }
}
