/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import type { Request } from '../../type';
import { isObject } from '../../utils';

const BodySymbol = Symbol.for('ReqBody');

export function useRequestBody(req: Request) : Record<string, any>;
export function useRequestBody(req: Request, key: string) : any | undefined;
export function useRequestBody(req: Request, key?: string) {
    let body : Record<string, any> | undefined;

    /* istanbul ignore next */
    if ('body' in req) {
        body = (req as any).body;
    }

    if (BodySymbol in req) {
        if (body) {
            body = merge(
                {},
                (req as any)[BodySymbol],
                body,
            );
        } else {
            body = (req as any)[BodySymbol];
        }
    }

    if (body) {
        if (typeof key === 'string') {
            return body[key];
        }

        return body;
    }

    return typeof key === 'string' ?
        undefined :
        {};
}

export function hasRequestBody(req: Request) : boolean {
    return 'body' in req || BodySymbol in req;
}

export function setRequestBody(req: Request, key: string, value: unknown) : void;
export function setRequestBody(req: Request, record: Record<string, any>) : void;
export function setRequestBody(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[BodySymbol] = key;
        return;
    }

    (req as any)[BodySymbol] = {
        [key]: value,
    };
}

export function extendRequestBody(req: Request, key: string, value: unknown) : void;
export function extendRequestBody(req: Request, record: Record<string, any>) : void;
export function extendRequestBody(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (hasRequestBody(req)) {
        const body = useRequestBody(req);

        // body can not be merged :/
        if (!isObject(body)) {
            return;
        }

        if (isObject(key)) {
            (req as any)[BodySymbol] = merge({}, key, body);
        } else {
            body[key] = value;
            (req as any)[BodySymbol] = body;
        }

        return;
    }

    if (isObject(key)) {
        setRequestBody(req, key);

        return;
    }

    setRequestBody(req, key, value);
}
