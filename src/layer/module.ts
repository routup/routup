import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { createError } from '../error';
import { isErrorHandler } from '../handler';
import { HandlerType } from '../handler/constants';
import { PathMatcher } from '../path';
import { setRequestMountPath, setRequestParams, setRequestRouterIds } from '../request';
import type { Response } from '../response';
import {
    send, sendStream, sendWebBlob, sendWebResponse,
} from '../response';
import { findRouterOption } from '../router-options';
import {
    isPromise, isStream, isWebBlob, isWebResponse,
} from '../utils';
import type { LayerOptions } from './type';

export class Layer implements Dispatcher {
    readonly '@instanceof' = Symbol.for('Layer');

    protected handler : CallableFunction;

    protected handlerType : HandlerType;

    protected pathMatcher : PathMatcher;

    // --------------------------------------------------

    constructor(
        options: LayerOptions,
        fn: CallableFunction,
    ) {
        this.pathMatcher = new PathMatcher(options.path, options.pathMatcher);
        this.handler = fn;
        this.handlerType = isErrorHandler(this.handler) ?
            HandlerType.ERROR :
            HandlerType.DEFAULT;
    }

    // --------------------------------------------------

    isError() {
        return this.handlerType === HandlerType.ERROR;
    }

    isDefault() {
        return this.handlerType === HandlerType.DEFAULT;
    }

    // --------------------------------------------------

    dispatch(
        event: DispatcherEvent,
        meta: DispatcherMeta,
    ) : Promise<boolean> {
        setRequestParams(event.req, meta.params || {});
        setRequestMountPath(event.req, meta.mountPath || '/');
        setRequestRouterIds(event.req, meta.routerIds || []);

        if (
            (this.isDefault() && meta.error) ||
            (this.isError() && !meta.error)
        ) {
            return Promise.reject(meta.error);
        }

        const timeout = findRouterOption('timeout', meta.routerIds);

        return new Promise<boolean>((resolve, reject) => {
            let timeoutInstance : ReturnType<typeof setTimeout> | undefined;
            let handled = false;

            const unsubscribe = () => {
                if (timeoutInstance) {
                    clearTimeout(timeoutInstance);
                }

                event.res.off('close', onFinished);
                event.res.off('error', onFinished);
            };

            const shutdown = (dispatched: boolean, err?: Error) => {
                if (handled) {
                    return;
                }

                handled = true;
                unsubscribe();

                if (err) {
                    reject(createError(err));
                } else {
                    resolve(dispatched);
                }
            };

            const onFinished = (err?: Error) => shutdown(true, err);
            const onNext = (err?: Error) => shutdown(false, err);

            event.res.once('close', onFinished);
            event.res.once('error', onFinished);

            if (timeout) {
                timeoutInstance = setTimeout(() => {
                    handled = true;
                    unsubscribe();

                    event.res.statusCode = 504;
                    event.res.statusMessage = 'Gateway Timeout';
                    event.res.end();
                }, timeout);
            }

            try {
                let output: any;

                if (meta.error) {
                    output = this.handler(meta.error, event.req, event.res, onNext);
                } else {
                    output = this.handler(event.req, event.res, onNext);
                }

                const handle = (data: any): Promise<void> => {
                    if (typeof data === 'undefined' || handled) {
                        return Promise.resolve();
                    }

                    handled = true;
                    unsubscribe();

                    return this.sendOutput(event.res, data)
                        .then(() => resolve(true))
                        .catch((e) => reject(createError(e)));
                };

                if (isPromise(output)) {
                    output
                        .then((r) => handle(r))
                        .catch((e) => reject(createError(e)));

                    return;
                }

                Promise.resolve()
                    .then(() => handle(output))
                    .catch((e) => reject(createError(e)));
            } catch (error) {
                onNext(error as Error);
            }
        });
    }

    protected sendOutput(res: Response, input: unknown) : Promise<any> {
        if (input instanceof Error) {
            return Promise.reject(input);
        }

        if (isStream(input)) {
            return sendStream(res, input);
        }

        if (isWebBlob(input)) {
            return sendWebBlob(res, input);
        }

        if (isWebResponse(input)) {
            return sendWebResponse(res, input);
        }

        return send(res, input);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    exec(path: string) {
        return this.pathMatcher.exec(path);
    }
}
