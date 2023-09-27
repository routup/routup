import { MethodName } from '../constants';
import { createError } from '../error';
import { mergeDispatcherMetaParams } from '../dispatcher';
import type {
    Dispatcher, DispatcherEvent, DispatcherMeta,
} from '../dispatcher';
import type { HandlerConfig } from '../handler';
import {
    HandlerType,
} from '../handler';
import { PathMatcher } from '../path';
import { setRequestMountPath, setRequestParams, setRequestRouterPath } from '../request';
import type { Response } from '../response';
import {
    send, sendStream, sendWebBlob, sendWebResponse,
} from '../response';
import {
    isPromise,
    isStream,
    isWebBlob,
    isWebResponse,
} from '../utils';
import { LayerSymbol } from './constants';

export class Layer implements Dispatcher {
    readonly '@instanceof' = LayerSymbol;

    protected handler : HandlerConfig;

    protected pathMatcher : PathMatcher | undefined;

    // --------------------------------------------------

    constructor(handler: HandlerConfig) {
        this.handler = handler;

        if (handler.path) {
            this.pathMatcher = new PathMatcher(handler.path, {
                end: !!handler.method,
            });
        }
    }

    // --------------------------------------------------

    get type() {
        return this.handler.type;
    }

    get path() {
        return this.handler.path;
    }

    get method() {
        return this.handler.method ?
            this.handler.method.toLowerCase() :
            undefined;
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

            try {
                let output: unknown;

                if (
                    this.handler.type === HandlerType.ERROR
                ) {
                    if (meta.error) {
                        output = this.handler.fn(meta.error, event.req, event.res, onNext);
                    }
                } else {
                    output = this.handler.fn(event.req, event.res, onNext);
                }

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
            return Promise.reject(createError(input));
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
            return true;
        }

        return this.pathMatcher.test(path);
    }

    matchMethod(method: string) : boolean {
        if (!this.method) {
            return true;
        }

        const name = method.toLowerCase();
        if (name === this.method) {
            return true;
        }

        return name === MethodName.HEAD &&
            this.method === MethodName.GET;
    }
}
