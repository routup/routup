import { send } from '../helpers';
import type { Request, Response } from '../type';
import { isPromise } from '../utils';

export function callHandler(
    handler: CallableFunction,
    req: Request,
    res: Response,
    next: (err?: Error) => Promise<void>,
    err?: Error,
) {
    if (handler.length !== 4 && err) {
        throw err;
    }

    return new Promise<void>((resolve, reject) => {
        let nextCalled = false;

        const unsubscribe = () => {
            res.off('close', nextPolyfill);
            res.off('error', nextPolyfill);
        };

        const nextPolyfill = (err?: Error) => {
            nextCalled = true;

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

            const handleOutput = (data: any) => {
                if (nextCalled) {
                    return;
                }

                if (typeof data !== 'undefined') {
                    unsubscribe();

                    send(res, data)
                        .then(() => resolve())
                        .catch((e) => reject(e));
                }
            };

            if (isPromise(output)) {
                output
                    .then((r) => handleOutput(r))
                    .catch((e) => reject(e));
            } else {
                handleOutput(output);
            }
        } catch (error) {
            nextPolyfill(error as Error);
        }
    });
}
