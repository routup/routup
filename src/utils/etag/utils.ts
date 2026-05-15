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

/**
 * Default `EtagFn` used by `toResponse()` when `appOptions.etag` is
 * undefined. Module-scoped so we don't allocate per-request and so
 * all consumers share the same closure.
 *
 * `appOptions.etag === null` (explicitly disabled by the user)
 * remains distinct: consumers must check `=== undefined`, not
 * `== null`, before falling back to this default.
 */
export const DEFAULT_ETAG_FN: EtagFn = buildEtagFn();
