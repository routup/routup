import type { Readable as NodeReadable } from 'stream';
import type { NodeReadableStream, WebReadableStream } from '../../types';
import { isWebStream } from '../../utils';
import type { Response } from '../types';

export async function sendStream(
    res: Response,
    stream: NodeReadableStream | WebReadableStream,
    next?: (err?: Error) => Promise<unknown> | unknown,
) : Promise<unknown> {
    if (isWebStream(stream)) {
        return stream
            .pipeTo(
                new WritableStream({
                    write(chunk) {
                        res.write(chunk);
                    },
                }),
            )
            .then(() => {
                if (next) {
                    return next();
                }

                res.end();
                return Promise.resolve();
            })
            .catch((err) => {
                if (next) {
                    return next(err);
                }

                return Promise.reject(err);
            });
    }

    return new Promise<void>((resolve, reject) => {
        stream.on('open', () => {
            (stream as NodeReadable).pipe(res);
        });

        /* istanbul ignore next */
        stream.on('error', (err) => {
            if (next) {
                Promise.resolve()
                    .then(() => next(err))
                    .then(() => resolve())
                    .catch((e) => reject(e));

                return;
            }

            res.end();

            reject(err);
        });

        stream.on('close', () => {
            if (next) {
                Promise.resolve()
                    .then(() => next())
                    .then(() => resolve())
                    .catch((e) => reject(e));

                return;
            }

            res.end();

            resolve();
        });
    });
}
