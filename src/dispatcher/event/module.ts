import { createError } from '../../error';
import { setRequestMountPath, setRequestParams, setRequestRouterPath } from '../../request';
import {
    isResponseGone,
    send, sendStream, sendWebBlob, sendWebResponse,
} from '../../response';
import {
    isPromise, isStream, isWebBlob, isWebResponse,
} from '../../utils';
import type { DispatcherEvent } from './types';

async function sendData(event: DispatcherEvent, chunk: unknown) {
    if (chunk instanceof Error) {
        return Promise.reject(createError(chunk));
    }

    if (isStream(chunk)) {
        await sendStream(event.res, chunk);
        return Promise.resolve();
    }

    if (isWebBlob(chunk)) {
        await sendWebBlob(event.res, chunk);
        return Promise.resolve();
    }

    if (isWebResponse(chunk)) {
        await sendWebResponse(event.res, chunk);
        return Promise.resolve();
    }

    return send(event.res, chunk);
}

type DispatchTargetFn = (next: (err?: Error) => any) => unknown;
export function dispatch(
    event: DispatcherEvent,
    target: DispatchTargetFn,
): Promise<boolean> {
    setRequestParams(event.req, event.meta.params);
    setRequestMountPath(event.req, event.meta.mountPath);
    setRequestRouterPath(event.req, event.meta.routerPath);

    return new Promise<boolean>((resolve, reject) => {
        let handled = false;

        const unsubscribe = () => {
            event.res.off('close', done);
            event.res.off('error', done);
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

        const done = (err?: Error) => shutdown(true, err);
        const next = (err?: Error) => shutdown(false, err);

        event.res.once('close', done);
        event.res.once('error', done);

        const handle = async (data: unknown): Promise<boolean> => {
            if (typeof data === 'undefined' || handled) {
                return false;
            }

            handled = true;
            unsubscribe();

            if (!isResponseGone(event.res)) {
                await sendData(event, data);
            }

            return true;
        };

        try {
            const output = target(next);

            if (isPromise(output)) {
                output
                    .then((r) => handle(r))
                    .then((resolved) => {
                        if (resolved) {
                            resolve(true);
                        }
                    })
                    .catch((e) => reject(createError(e)));

                return;
            }

            Promise.resolve()
                .then(() => handle(output))
                .then((resolved) => {
                    if (resolved) {
                        resolve(true);
                    }
                })
                .catch((e) => reject(createError(e)));
        } catch (error) {
            next(error as Error);
        }
    });
}
