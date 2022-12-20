/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isObject, merge } from 'smob';
import { Request } from '../../type';
import { RequestFn } from '../type';

const QuerySymbol = Symbol.for('ReqQuery');

let requestFn : undefined | RequestFn;

export function setRequestQueryFn(fn: RequestFn) {
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
export function setRequestQuery(req: Request, record: Record<string, any>, append?: boolean) : void;
export function setRequestQuery(req: Request, key: Record<string, any> | string, value?: boolean | unknown) : void {
    if (QuerySymbol in req) {
        if (typeof key === 'object') {
            if (value) {
                (req as any)[QuerySymbol] = merge((req as any)[QuerySymbol], key);
            } else {
                (req as any)[QuerySymbol] = key;
            }
        } else {
            (req as any)[QuerySymbol][key] = value;
        }

        return;
    }

    if (typeof key === 'object') {
        (req as any)[QuerySymbol] = key;
        return;
    }

    (req as any)[QuerySymbol] = {
        [key]: value,
    };
}
