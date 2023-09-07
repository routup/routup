import { setRequestMountPath, setRequestParams } from '../helpers';
import type {
    DispatcherMeta, NodeRequest,
    NodeResponse,
} from '../type';
import { callHandler } from '../handler';
import { PathMatcher } from '../path';
import type { LayerOptions } from './type';

export class Layer {
    readonly '@instanceof' = Symbol.for('Layer');

    protected fn : CallableFunction;

    protected pathMatcher : PathMatcher;

    // --------------------------------------------------

    constructor(
        options: LayerOptions,
        fn: CallableFunction,
    ) {
        this.pathMatcher = new PathMatcher(options.path, options.pathMatcher);
        this.fn = fn;
    }

    // --------------------------------------------------

    isError() {
        return this.fn.length === 4;
    }

    // --------------------------------------------------

    dispatch(
        req: NodeRequest,
        res: NodeResponse,
        meta: DispatcherMeta,
        next: (err?: Error) => Promise<any>
    ) : Promise<any>;

    dispatch(
        req: NodeRequest,
        res: NodeResponse,
        meta: DispatcherMeta,
        next: (err?: Error) => Promise<any>,
        err: Error,
    ) : Promise<any>;

    dispatch(
        req: NodeRequest,
        res: NodeResponse,
        meta: DispatcherMeta,
        next: (err?: Error) => Promise<any>,
        err?: Error,
    ) : Promise<any> {
        setRequestParams(req, meta.params || {});
        setRequestMountPath(req, meta.mountPath || '/');

        return callHandler(this.fn, req, res, next, err);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    exec(path: string) {
        return this.pathMatcher.exec(path);
    }
}
