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
    return CookieSymbol in req &&
        isObject((req as any)[CookieSymbol]);
}

export function useRequestCookie(req: Request, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setRequestCookies(req: Request, key: string, value: unknown) : void;
export function setRequestCookies(req: Request, record: Record<string, any>) : void;
export function setRequestCookies(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[CookieSymbol] = key;
        return;
    }

    (req as any)[CookieSymbol] = {
        [key]: value,
    };
}

export function extendRequestCookies(req: Request, key: string, value: string) : void;
export function extendRequestCookies(req: Request, record: Record<string, any>) : void;
export function extendRequestCookies(
    req: Request,
    key: string | Record<string, any>,
    value?: string,
) {
    if (hasRequestCookies(req)) {
        const cookies = useRequestCookies(req);

        if (isObject(key)) {
            (req as any)[CookieSymbol] = merge({}, key, cookies);
        } else {
            cookies[key] = value as string;
            (req as any)[CookieSymbol] = cookies;
        }

        (req as any)[CookieSymbol] = merge((req as any)[CookieSymbol], cookies);

        return;
    }

    if (isObject(key)) {
        setRequestCookies(req, key);

        return;
    }

    setRequestCookies(req, key, value);
}
