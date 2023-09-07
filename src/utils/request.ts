import { GatewayTimeoutErrorOptions } from '@ebec/http';
import type { DispatcherNext, NodeResponse } from '../type';

// todo: this should be applied on every handler call
/* istanbul ignore next */
export function createRequestTimeout(res: NodeResponse, timeout: number, done?: DispatcherNext) {
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
