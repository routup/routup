/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request } from 'routup';
import type { RateLimitInfo } from './type';

const symbol = Symbol.for('ReqRateLimit');
export function useRequestRateLimitInfo(req: Request) : RateLimitInfo;
export function useRequestRateLimitInfo<K extends keyof RateLimitInfo>(req: Request, key: K) : RateLimitInfo[K];
export function useRequestRateLimitInfo(req: Request, key?: string) {
    if (symbol in req) {
        if (typeof key === 'string') {
            return (req as any)[symbol][key];
        }

        return (req as any)[symbol];
    }

    return {};
}

export function setRequestRateLimitInfo<K extends keyof RateLimitInfo>(
    req: Request,
    key: K,
    value: RateLimitInfo[K]
) : void;
export function setRequestRateLimitInfo(req: Request, record: RateLimitInfo) : void;
export function setRequestRateLimitInfo(req: Request, key: RateLimitInfo | string, value?: unknown) : void {
    if (symbol in req) {
        if (typeof key === 'object') {
            (req as any)[symbol] = key;
        } else {
            (req as any)[symbol][key] = value;
        }

        return;
    }

    if (typeof key === 'object') {
        (req as any)[symbol] = key;
        return;
    }

    (req as any)[symbol] = {
        [key]: value,
    };
}
