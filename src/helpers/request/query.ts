/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import { isObject } from '../../utils';
import type { Request } from '../../type';

type RequestQueryFn = (req: Request) => Record<string, any>;

const QuerySymbol = Symbol.for('ReqQuery');

let requestFn : undefined | RequestQueryFn;

export function setRequestQueryFn(fn: RequestQueryFn) {
    requestFn = fn;
}

export function useRequestQuery(req: Request) : Record<string, any>;
export function useRequestQuery(req: Request, key: string) : any;
export function useRequestQuery(req: Request, key?: string) {
    /* istanbul ignore if  */
    if ('query' in req) {
        if (typeof key === 'string') {
            return (req as any).query[key];
        }

        return (req as any).query;
    }

    if (
        !(QuerySymbol in req) &&
        typeof requestFn !== 'undefined'
    ) {
        (req as any)[QuerySymbol] = requestFn(req);
    }

    if (QuerySymbol in req) {
        if (typeof key === 'string') {
            return (req as any)[QuerySymbol][key];
        }

        return (req as any)[QuerySymbol];
    }

    return {};
}

export function hasRequestQuery(req: Request) : boolean {
    return (QuerySymbol in req) && isObject((req as any)[QuerySymbol]);
}

export function setRequestQuery(req: Request, key: string, value: unknown) : void;
export function setRequestQuery(req: Request, record: Record<string, any>) : void;
export function setRequestQuery(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[QuerySymbol] = key;
        return;
    }

    (req as any)[QuerySymbol] = {
        [key]: value,
    };
}

export function extendRequestQuery(req: Request, key: string, value: unknown) : void;
export function extendRequestQuery(req: Request, record: Record<string, any>) : void;
export function extendRequestQuery(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (QuerySymbol in req) {
        if (isObject(key)) {
            (req as any)[QuerySymbol] = merge((req as any)[QuerySymbol], key);
        } else {
            (req as any)[QuerySymbol][key] = value;
        }

        return;
    }

    if (isObject(key)) {
        setRequestQuery(req, key);
        return;
    }

    setRequestQuery(req, key, value);
}
