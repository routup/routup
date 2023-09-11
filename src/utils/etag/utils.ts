import { Buffer } from 'buffer';
import { merge } from 'smob';
import { isObject } from '../object';
import { createEtag } from './module';
import type { EtagFn, EtagOptions } from './type';

export function buildEtagFn(input?: boolean | EtagOptions | EtagFn) : EtagFn {
    if (typeof input === 'function') {
        return input;
    }

    input = input ?? true;

    if (input === false) {
        return () => Promise.resolve(undefined);
    }

    let options : EtagOptions = {
        weak: true,
    };

    if (isObject(input)) {
        options = merge(input, options);
    }

    return async (body: any, encoding?: BufferEncoding, size?: number) => {
        const buff = Buffer.isBuffer(body) ?
            body :
            Buffer.from(body, encoding);

        if (typeof options.threshold !== 'undefined') {
            size = size ?? Buffer.byteLength(buff);

            if (size <= options.threshold) {
                return undefined;
            }
        }

        return createEtag(buff, options);
    };
}
