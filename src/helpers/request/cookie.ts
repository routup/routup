/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { CookieParseOptions, parse } from 'cookie';
import { Request } from '../../type';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(req: Request, options?: CookieParseOptions) {
    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    const output = parse(req.headers.cookie || '', options || {});

    (req as any)[CookieSymbol] = output;

    return output;
}

export function useRequestCookie(req: Request, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}
