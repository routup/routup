import type { RequestListener } from 'http';
import type { Handler } from '../src';

export function createHandler(handler: Handler) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
