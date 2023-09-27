import { distinctArray } from 'smob';
import type { ErrorProxy } from '../error';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import {
    HandlerType, isCoreHandler, isErrorHandler, isHandlerConfig, toHandlerConfig,
} from '../handler';
import type { Handler, HandlerConfig } from '../handler';
import { Layer, isLayerInstance } from '../layer';
import type { Path } from '../path';
import { PathMatcher, isPath } from '../path';
import { isResponseGone, send } from '../response';
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

    delete(handler: Handler | HandlerConfig) : this;

    delete(path: Path, handler: Handler | HandlerConfig) : this;

    delete(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.DELETE,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.DELETE,
        }));

        return this;
    }

    get(handler: Handler | HandlerConfig) : this;

    get(path: Path, handler: Handler | HandlerConfig) : this;

    get(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.GET,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.GET,
        }));

        return this;
    }

    post(handler: Handler | HandlerConfig) : this;

    post(path: Path, handler: Handler | HandlerConfig) : this;

    post(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.POST,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.POST,
        }));
        return this;
    }

    put(handler: Handler | HandlerConfig) : this;

    put(path: Path, handler: Handler | HandlerConfig) : this;

    put(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.PUT,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.PUT,
        }));

        return this;
    }

    patch(handler: Handler | HandlerConfig) : this;

    patch(path: Path, handler: Handler | HandlerConfig) : this;

    patch(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.PATCH,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.PATCH,
        }));

        return this;
    }

    head(handler: Handler | HandlerConfig) : this;

    head(path: Path, handler: Handler | HandlerConfig) : this;

    head(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.HEAD,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.HEAD,
        }));

        return this;
    }

    options(handler: Handler | HandlerConfig) : this;

    options(path: Path, handler: Handler | HandlerConfig) : this;

    options(path: any, handler?: any) : this {
        if (isPath(path)) {
            this.use(toHandlerConfig(handler, {
                method: MethodName.OPTIONS,
                path,
            }));

            return this;
        }

        this.use(toHandlerConfig(path, {
            method: MethodName.OPTIONS,
        }));

        return this;
    }

    // --------------------------------------------------

    use(router: Router) : this;

    use(handler: HandlerConfig | Handler) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: HandlerConfig | Handler) : this;

    use(...input: unknown[]) : this {
        /* istanbul ignore next */
        if (input.length === 0) {
            return this;
        }

        let path : Path | undefined;
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            if (isPath(item)) {
                if (typeof item === 'string') {
                    if (item.length > 0) {
                        path = withLeadingSlash(item);
                    } else {
                        path = '/';
                    }
                } else {
                    path = item;
                }
                continue;
            }

            if (isRouterInstance(item)) {
                if (path) {
                    item.setPath(path);
                }
                this.stack.push(item);
                continue;
            }

            if (isCoreHandler(item)) {
                this.stack.push(new Layer({
                    type: HandlerType.CORE,
                    fn: item,
                }));

                continue;
            }

            if (isErrorHandler(item)) {
                this.stack.push(new Layer({
                    type: HandlerType.ERROR,
                    fn: item,
                }));

                continue;
            }

            if (isHandlerConfig(item)) {
                item.path = path || item.path;
                this.stack.push(new Layer(item));
            }
        }

        return this;
    }
}
