import { MethodName } from '../constants';
import type {
    Dispatcher, DispatcherEvent, DispatcherMeta,
} from '../dispatcher';
import { mergeDispatcherMetaParams } from '../dispatcher';
import { isError } from '../error';
import type { Handler } from '../handler';
import { Layer } from '../layer';
import type { Path } from '../path';
import { PathMatcher } from '../path';
import { RouteSymbol } from './constants';

export class Route implements Dispatcher {
    readonly '@instanceof' = RouteSymbol;

    public readonly path : Path;

    protected pathMatcher : PathMatcher;

    protected layers : Record<string, Layer[]> = {};

    // --------------------------------------------------

    constructor(path: Path) {
        this.path = path;
        this.pathMatcher = new PathMatcher(this.path);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    matchMethod(method: string) : boolean {
        let name = method.toLowerCase();

        if (
            name === MethodName.HEAD &&
            typeof this.layers[name] === 'undefined'
        ) {
            name = MethodName.GET;
        }

        return typeof this.layers[name] !== 'undefined';
    }

    // --------------------------------------------------

    getMethods() : string[] {
        const keys = Object.keys(this.layers);

        if (
            typeof this.layers[MethodName.GET] !== 'undefined' &&
            typeof this.layers[MethodName.HEAD] === 'undefined'
        ) {
            keys.push(MethodName.HEAD);
        }

        return keys;
    }

    // --------------------------------------------------

    async dispatch(
        event: DispatcherEvent,
        meta: DispatcherMeta,
    ) : Promise<boolean> {
        /* istanbul ignore next */
        if (!event.req.method) {
            return false;
        }

        let name = event.req.method.toLowerCase();

        if (
            name === MethodName.HEAD &&
            typeof this.layers[name] === 'undefined'
        ) {
            name = MethodName.GET;
        }

        /* istanbul ignore next */
        if (
            typeof this.layers[name] === 'undefined' ||
            this.layers[name].length === 0
        ) {
            return false;
        }

        const output = this.pathMatcher.exec(meta.path);
        if (output) {
            meta.params = mergeDispatcherMetaParams(meta.params, output.params);
        }

        let err : Error | undefined;
        for (let i = 0; i < this.layers[name].length; i++) {
            const layer = this.layers[name][i];
            if (err && !layer.isError()) {
                continue;
            }

            try {
                const dispatched = await layer.dispatch(event, meta);

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

        return false;
    }

    // --------------------------------------------------

    register(method: `${MethodName}`, ...handlers: Handler[]) {
        this.layers[method] = [];

        for (let i = 0; i < handlers.length; i++) {
            const layer = new Layer(handlers[i]);

            this.layers[method].push(layer);
        }
    }

    get(...handlers: Handler[]) {
        return this.register(MethodName.GET, ...handlers);
    }

    post(...handlers: Handler[]) {
        return this.register(MethodName.POST, ...handlers);
    }

    put(...handlers: Handler[]) {
        return this.register(MethodName.PUT, ...handlers);
    }

    patch(...handlers: Handler[]) {
        return this.register(MethodName.PATCH, ...handlers);
    }

    delete(...handlers: Handler[]) {
        return this.register(MethodName.DELETE, ...handlers);
    }

    head(...handlers: Handler[]) {
        return this.register(MethodName.HEAD, ...handlers);
    }

    options(...handlers: Handler[]) {
        return this.register(MethodName.OPTIONS, ...handlers);
    }
}
