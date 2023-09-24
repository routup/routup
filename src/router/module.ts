import { distinctArray } from 'smob';
import type { ErrorProxy } from '../error';
import { isError } from '../error';
import { HeaderName, MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { cloneDispatcherMeta } from '../dispatcher';
import type { HandlerVariants } from '../handler';
import type { LayerOptions } from '../layer';
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
                if (!item.isError() && err) {
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

    route(options: LayerOptions) : this {
        if (typeof options.path === 'string') {
            if (options.path.length > 0) {
                options.path = withLeadingSlash(options.path);
            } else {
                options.path = '/';
            }
        }

        const layer = new Layer(options);
        this.stack.push(layer);

        return this;
    }

    delete(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.DELETE,
        });

        return this;
    }

    get(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.GET,
        });

        return this;
    }

    post(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.POST,
        });

        return this;
    }

    put(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.PUT,
        });

        return this;
    }

    patch(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.PATCH,
        });

        return this;
    }

    head(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.HEAD,
        });

        return this;
    }

    options(path: Path, handler: HandlerVariants) : this {
        this.route({
            path,
            handler,
            method: MethodName.OPTIONS,
        });

        return this;
    }

    // --------------------------------------------------

    use(router: Router) : this;

    use(handler: HandlerVariants) : this;

    use(path: Path, router: Router) : this;

    use(path: Path, handler: HandlerVariants) : this;

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
                    handler: item as HandlerVariants,
                    path: path || '/',
                }));
            }
        }

        return this;
    }
}
