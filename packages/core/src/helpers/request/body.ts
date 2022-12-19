/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import { Request } from '../../type';

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

export function setRequestBody(req: Request, key: string, value: unknown) : void;
export function setRequestBody(req: Request, record: Record<string, any>, append?: boolean) : void;
export function setRequestBody(req: Request, key: Record<string, any> | string, value?: boolean | unknown) : void {
    if (BodySymbol in req) {
        if (typeof key === 'object') {
            if (value) {
                (req as any)[BodySymbol] = merge((req as any)[BodySymbol], key);
            } else {
                (req as any)[BodySymbol] = key;
            }
        } else {
            (req as any)[BodySymbol][key] = value;
        }

        return;
    }

    if (typeof key === 'object') {
        (req as any)[BodySymbol] = key;
        return;
    }

    (req as any)[BodySymbol] = {
        [key]: value,
    };
}
