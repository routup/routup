import type { Readable } from 'node:stream';
import type { Response } from '../../type';

export function sendStream(res: Response, stream: Readable, fn?: CallableFunction) {
    stream.on('open', () => {
        stream.pipe(res);
    });

    /* istanbul ignore next */
    stream.on('error', (err) => {
        if (typeof fn === 'function') {
            fn(err);
        } else {
            res.statusCode = 400;
            res.end();
        }
    });

    stream.on('close', () => {
        if (typeof fn === 'function') {
            fn();
        } else {
            res.end();
        }
    });
}
