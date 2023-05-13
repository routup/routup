/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { IncomingMessage } from 'node:http';
import { merge } from 'smob';
import { isObject } from '../../utils';
import type { RequestFn } from '../type';

const CookieSymbol = Symbol.for('ReqCookie');

let requestFn : undefined | RequestFn;

export function setRequestCookieFn(fn: RequestFn) {
    requestFn = fn;
}

export function useRequestCookies(
    req: IncomingMessage,
) : Record<string, string> {
    if (
        !(CookieSymbol in req) &&
        typeof requestFn !== 'undefined'
    ) {
        (req as any)[CookieSymbol] = requestFn(req);
    }

    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    return {};
}

export function hasRequestCookies(req: IncomingMessage) {
    return CookieSymbol in req && isObject((req as any)[CookieSymbol]);
}

export function useRequestCookie(req: IncomingMessage, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setRequestCookies(
    req: IncomingMessage,
    record: Record<string, any>,
    mergeIt?: boolean,
) : void {
    if (CookieSymbol in req) {
        if (mergeIt) {
            (req as any)[CookieSymbol] = merge((req as any)[CookieSymbol], record);
        }

        return;
    }

    (req as any)[CookieSymbol] = record;
}
