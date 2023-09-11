import type {
    Dispatcher, DispatcherEvent, DispatcherMeta, DispatcherNext,
} from '../dispatcher';
import { send, setRequestMountPath, setRequestParams } from '../helpers';
import { PathMatcher } from '../path';
import { isPromise } from '../utils';
import type { LayerOptions } from './type';

export class Layer implements Dispatcher {
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
        event: DispatcherEvent,
        meta: DispatcherMeta,
        done: DispatcherNext,
    ) : Promise<any> {
        setRequestParams(event.req, meta.params || {});
        setRequestMountPath(event.req, meta.mountPath || '/');

        if (
            (this.fn.length !== 4 && meta.error) ||
            (this.fn.length === 4 && !meta.error)
        ) {
            return Promise.reject(meta.error);
        }

        return new Promise<void>((resolve, reject) => {
            let timeout : ReturnType<typeof setTimeout> | undefined;
            let handled = false;

            const unsubscribe = () => {
                if (timeout) {
                    clearTimeout(timeout);
                }

                event.res.off('close', nextPolyfill);
                event.res.off('error', nextPolyfill);
            };

            const nextPolyfill = (err?: Error) => {
                if (handled) {
                    return;
                }

                handled = true;
                unsubscribe();

                done(err)
                    .then(() => resolve())
                    .catch((e) => reject(e));
            };

            event.res.once('close', nextPolyfill);
            event.res.once('error', nextPolyfill);

            if (meta.timeout) {
                timeout = setTimeout(() => {
                    handled = true;
                    unsubscribe();

                    event.res.statusCode = 504;
                    event.res.statusMessage = 'Gateway Timeout';
                    event.res.end();
                }, meta.timeout);
            }

            try {
                let output: any;

                if (meta.error) {
                    output = this.fn(meta.error, event.req, event.res, nextPolyfill);
                } else {
                    output = this.fn(event.req, event.res, nextPolyfill);
                }

                const handle = (data: any): Promise<void> => {
                    if (typeof data === 'undefined' || handled) {
                        return Promise.resolve();
                    }

                    handled = true;
                    unsubscribe();

                    return send(event.res, data)
                        .then(() => resolve())
                        .catch((e) => reject(e));
                };

                if (isPromise(output)) {
                    output
                        .then((r) => handle(r))
                        .catch((e) => reject(e));

                    return;
                }

                Promise.resolve()
                    .then(() => handle(output))
                    .catch((e) => reject(e));
            } catch (error) {
                nextPolyfill(error as Error);
            }
        });
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    exec(path: string) {
        return this.pathMatcher.exec(path);
    }
}
