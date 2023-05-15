/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import type { Request } from '../../type';
import { isObject } from '../../utils';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(
    req: Request,
) : Record<string, string> {
    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    return {};
}

export function hasRequestCookies(req: Request) {
    return CookieSymbol in req && isObject((req as any)[CookieSymbol]);
}

export function useRequestCookie(req: Request, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setRequestCookies(
    req: Request,
    record: Record<string, any>,
) : void {
    (req as any)[CookieSymbol] = record;
}

export function extendRequestCookies(
    req: Request,
    record: Record<string, any>,
) {
    if (CookieSymbol in req) {
        (req as any)[CookieSymbol] = merge((req as any)[CookieSymbol], record);

        return;
    }

    (req as any)[CookieSymbol] = record;
}
