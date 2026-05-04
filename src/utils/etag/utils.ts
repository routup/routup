import { merge } from 'smob';
import { isObject } from '../object.ts';
import { createEtag } from './module.ts';
import type { EtagFn, EtagOptions } from './type.ts';

const textEncoder = /* @__PURE__ */ new TextEncoder();

export function buildEtagFn(input?: boolean | EtagOptions | EtagFn) : EtagFn {
    if (typeof input === 'function') {
        return input;
    }

    input = input ?? true;

    if (input === false) {
        return () => Promise.resolve(undefined);
    }

    let options : EtagOptions = { weak: true };

    if (isObject(input)) {
        options = merge(input, options);
    }

    return async (body: any, _encoding?: BufferEncoding, size?: number) => {
        const entity: string = typeof body === 'string' ?
            body :
            body?.toString?.('utf-8') ?? String(body);

        if (typeof options.threshold !== 'undefined') {
            const measured = size ?? textEncoder.encode(entity).byteLength;

            if (measured <= options.threshold) {
                return undefined;
            }
        }

        return createEtag(entity, options);
    };
}
