import { send } from '../helpers';
import type { NodeRequest, NodeResponse } from '../type';
import { isPromise } from '../utils';

export function callHandler(
    handler: CallableFunction,
    req: NodeRequest,
    res: NodeResponse,
    next: (err?: Error) => Promise<void>,
    err?: Error,
) : Promise<void> {
    if (
        (handler.length !== 4 && err) ||
        (handler.length === 4 && !err)
    ) {
        return Promise.reject(err);
    }

    return new Promise<void>((resolve, reject) => {
        let handled = false;

        const unsubscribe = () => {
            res.off('close', nextPolyfill);
            res.off('error', nextPolyfill);
        };

        const nextPolyfill = (err?: Error) => {
            if (handled) {
                return;
            }

            handled = true;
            unsubscribe();

            next(err)
                .then(() => resolve())
                .catch((e) => reject(e));
        };

        res.once('close', nextPolyfill);
        res.once('error', nextPolyfill);

        try {
            let output: any;

            if (err) {
                output = handler(err, req, res, nextPolyfill);
            } else {
                output = handler(req, res, nextPolyfill);
            }

            const handle = (data: any) : Promise<void> => {
                if (typeof data === 'undefined' || handled) {
                    return Promise.resolve();
                }

                handled = true;
                unsubscribe();

                return send(res, data)
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
