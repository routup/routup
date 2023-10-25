import { createError } from '../../error';
import { setRequestMountPath, setRequestParams, setRequestRouterPath } from '../../request';
import {
    send,
} from '../../response';
import {
    isPromise,
} from '../../utils';
import type { DispatchEvent } from './module';

type DispatchTargetFn = (next: (err?: Error) => any) => unknown;
export function dispatch(
    event: DispatchEvent,
    target: DispatchTargetFn,
): Promise<boolean> {
    setRequestParams(event.request, event.params);
    setRequestMountPath(event.request, event.mountPath);
    setRequestRouterPath(event.request, event.routerPath);

    return new Promise<boolean>((resolve, reject) => {
        let handled = false;

        const unsubscribe = () => {
            event.response.off('close', done);
            event.response.off('error', done);
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

        event.response.once('close', done);
        event.response.once('error', done);

        const handle = async (data: unknown): Promise<boolean> => {
            if (typeof data === 'undefined' || handled) {
                return false;
            }

            handled = true;
            unsubscribe();

            if (!event.dispatched) {
                await send(event.response, data);
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
