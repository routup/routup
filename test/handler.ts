import type { RequestListener } from 'http';
import type { CoreHandler } from '../src';

export function createRequestListener(handler: CoreHandler) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
