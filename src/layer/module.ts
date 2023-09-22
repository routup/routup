import { mergeDispatcherMetaParams } from '../dispatcher';
import type { Dispatcher, DispatcherEvent, DispatcherMeta } from '../dispatcher';
import { createError } from '../error';
import type { ErrorHandlerContext, HandlerContext } from '../handler';
import {
    HandlerType,
    isContextHandler,
    isErrorContextHandler,
    isErrorHandler,
    isHandler,
} from '../handler';
import { PathMatcher } from '../path';
import { setRequestMountPath, setRequestParams, setRequestRouterPath } from '../request';
import type { Response } from '../response';
import {
    send, sendStream, sendWebBlob, sendWebResponse,
} from '../response';
import { findRouterOption } from '../router-options';
import {
    isPromise,
    isStream,
    isWebBlob,
    isWebResponse,
} from '../utils';
import { LayerSymbol } from './constants';
import type { LayerOptions } from './type';

export class Layer implements Dispatcher {
    readonly '@instanceof' = LayerSymbol;

    protected handler : CallableFunction;

    protected handlerType : HandlerType;

    protected pathMatcher : PathMatcher | undefined;

    // --------------------------------------------------

    constructor(
        handler: CallableFunction,
        options: LayerOptions = {},
    ) {
        if (options.path) {
            this.pathMatcher = new PathMatcher(options.path, options.pathMatcher);
        }

        this.handler = handler;

        if (isHandler(handler)) {
            this.handlerType = HandlerType.DEFAULT;
            return;
        }

        if (isContextHandler(handler)) {
            this.handlerType = HandlerType.DEFAULT_CONTEXT;
            return;
        }

        if (isErrorHandler(handler)) {
            this.handlerType = HandlerType.ERROR;
            return;
        }

        if (isErrorContextHandler(handler)) {
            this.handlerType = HandlerType.ERROR_CONTEXT;
        }
    }

    // --------------------------------------------------

    isError() {
        return this.handlerType === HandlerType.ERROR ||
            this.handlerType === HandlerType.ERROR_CONTEXT;
    }

    // --------------------------------------------------

    dispatch(
        event: DispatcherEvent,
        meta: DispatcherMeta,
    ) : Promise<boolean> {
        if (this.pathMatcher) {
            const pathMatch = this.pathMatcher.exec(meta.path);
            if (pathMatch) {
                meta.params = mergeDispatcherMetaParams(meta.params, pathMatch.params);
            }
        }

        setRequestParams(event.req, meta.params);
        setRequestMountPath(event.req, meta.mountPath);
        setRequestRouterPath(event.req, meta.routerPath);

        const timeout = findRouterOption('timeout', meta.routerPath);

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
                    if (this.handlerType === HandlerType.ERROR_CONTEXT) {
                        output = this.handler({
                            request: event.req,
                            response: event.res,
                            next: onNext,
                            error: meta.error,
                        } satisfies ErrorHandlerContext);
                    } else {
                        output = this.handler(meta.error, event.req, event.res, onNext);
                    }
                } else if (this.handlerType === HandlerType.DEFAULT_CONTEXT) {
                    output = this.handler({
                        request: event.req,
                        response: event.res,
                        next: onNext,
                    } satisfies HandlerContext);
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
        if (!this.pathMatcher) {
            return false;
        }

        return this.pathMatcher.test(path);
    }
}
