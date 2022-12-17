/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { merge } from 'smob';

const BodySymbol = Symbol.for('ReqBody');

export function useRequestBody(req: IncomingMessage) : Record<string, any>;
export function useRequestBody(req: IncomingMessage, key: string) : any | undefined;
export function useRequestBody(req: IncomingMessage, key?: string) {
    /* istanbul ignore next */
    if ('body' in req) {
        if (typeof key === 'string') {
            return (req as any).body[key];
        }

        return (req as any).body;
    }

    if (BodySymbol in req) {
        if (typeof key === 'string') {
            return (req as any)[BodySymbol][key];
        }

        return (req as any)[BodySymbol];
    }

    if (typeof key === 'string') {
        return undefined;
    }

    return {};
}

export function setRequestBody(req: ServerResponse, key: string, value: unknown) : void;
export function setRequestBody(req: ServerResponse, record: Record<string, any>, append?: boolean) : void;
export function setRequestBody(req: ServerResponse, key: Record<string, any> | string, value?: boolean | unknown) : void {
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
