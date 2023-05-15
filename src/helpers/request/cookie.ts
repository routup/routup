/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { IncomingMessage } from 'node:http';
import { merge } from 'smob';
import type { Request } from '../../type';
import { isObject } from '../../utils';

const CookieSymbol = Symbol.for('ReqCookie');

type RequestCookieFn = (req: Request) => Record<string, string>;

let requestFn : undefined | RequestCookieFn;

export function setRequestCookieFn(fn: RequestCookieFn) {
    requestFn = fn;
}

export function useRequestCookies(
    req: IncomingMessage,
) : Record<string, string> {
    if (
        !(CookieSymbol in req) &&
        typeof requestFn === 'function'
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
) : void {
    (req as any)[CookieSymbol] = record;
}

export function extendRequestCookies(
    req: IncomingMessage,
    record: Record<string, any>,
) {
    if (CookieSymbol in req) {
        (req as any)[CookieSymbol] = merge((req as any)[CookieSymbol], record);

        return;
    }

    (req as any)[CookieSymbol] = record;
}
