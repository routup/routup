import type { RequestListener } from 'http';
import type { NodeHandler } from '../src';

export function createHandler(handler: NodeHandler) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
