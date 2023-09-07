import { merge } from 'smob';
import type { NodeRequest } from '../../type';
import { isObject } from '../../utils';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(
    req: NodeRequest,
) : Record<string, string> {
    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    return {};
}

export function hasRequestCookies(req: NodeRequest) {
    return CookieSymbol in req &&
        isObject((req as any)[CookieSymbol]);
}

export function useRequestCookie(req: NodeRequest, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setRequestCookies(req: NodeRequest, key: string, value: unknown) : void;
export function setRequestCookies(req: NodeRequest, record: Record<string, any>) : void;
export function setRequestCookies(req: NodeRequest, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[CookieSymbol] = key;
        return;
    }

    (req as any)[CookieSymbol] = {
        [key]: value,
    };
}

export function extendRequestCookies(req: NodeRequest, key: string, value: string) : void;
export function extendRequestCookies(req: NodeRequest, record: Record<string, any>) : void;
export function extendRequestCookies(
    req: NodeRequest,
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
