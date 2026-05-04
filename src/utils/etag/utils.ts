import { merge } from 'smob';
import { isObject } from '../object.ts';
import { createEtag } from './module.ts';
import type { EtagFn, EtagOptions } from './types.ts';

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

    return async (body: string, size?: number) => {
        if (typeof options.threshold !== 'undefined') {
            const measured = size ?? textEncoder.encode(body).byteLength;

            if (measured <= options.threshold) {
                return undefined;
            }
        }

        return createEtag(body, options);
    };
}
