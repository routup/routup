import type { RequestListener } from 'http';
import type { CoreHandlerFn } from '../src';

export function createRequestListener(handler: CoreHandlerFn) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
