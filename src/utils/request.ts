import { GatewayTimeoutErrorOptions } from '@ebec/http';
import type { Next, Response } from '../type';

/* istanbul ignore next */
export function createRequestTimeout(res: Response, timeout: number, done?: Next) {
    const instance = setTimeout(() => {
        res.statusCode = GatewayTimeoutErrorOptions.statusCode;
        res.statusMessage = GatewayTimeoutErrorOptions.message;

        res.end();
    }, timeout);

    res.once('close', () => {
        clearTimeout(instance);

        /* istanbul ignore next */
        if (typeof done === 'function') {
            done();
        }
    });

    /* istanbul ignore next */
    res.once('error', (e) => {
        clearTimeout(instance);

        if (typeof done === 'function') {
            done(e);
        }
    });
}
