/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    CookieParseOptions, CookieSerializeOptions, parse, serialize,
} from 'cookie';
import { IncomingMessage } from 'http';
import { HeaderName, Response, appendResponseHeaderDirective } from 'sapir';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(req: IncomingMessage, options?: CookieParseOptions) {
    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    const output = parse(req.headers.cookie || '', options || {});

    (req as any)[CookieSymbol] = output;

    return output;
}

export function useRequestCookie(req: IncomingMessage, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setResponseCookie(res: Response, name: string, value: string, options?: CookieSerializeOptions) {
    appendResponseHeaderDirective(res, HeaderName.COOKIE, serialize(name, value, {
        path: '/',
        ...(options || {}),
    }));
}

export function unsetResponseCookie(res: Response, name: string, options?: CookieSerializeOptions) {
    setResponseCookie(res, name, '', {
        ...(options || {}),
        maxAge: 0,
    });
}
