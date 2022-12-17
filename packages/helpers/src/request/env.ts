/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import { hasOwnProperty, merge } from 'smob';

const envSymbol = Symbol.for('ReqEnv');

export function setRequestEnv(req: IncomingMessage, key: string, value: unknown) : void;
export function setRequestEnv(req: IncomingMessage, record: Record<string, any>, append?: boolean) : void;
export function setRequestEnv(req: IncomingMessage, key: Record<string, any> | string, value?: boolean | unknown) : void {
    if (envSymbol in req) {
        if (typeof key === 'object') {
            if (value) {
                (req as any)[envSymbol] = merge((req as any)[envSymbol], key);
            } else {
                (req as any)[envSymbol] = key;
            }
        } else {
            (req as any)[envSymbol][key] = value;
        }

        return;
    }

    if (typeof key === 'object') {
        (req as any)[envSymbol] = key;
        return;
    }

    (req as any)[envSymbol] = {
        [key]: value,
    };
}

export function useRequestEnv(req: IncomingMessage) : Record<string, any>;
export function useRequestEnv(req: IncomingMessage, key: string) : unknown | undefined;
export function useRequestEnv(req: IncomingMessage, key?: string) {
    if (envSymbol in req) {
        if (typeof key === 'string') {
            return (req as any)[envSymbol][key];
        }

        return (req as any)[envSymbol];
    }

    if (typeof key === 'string') {
        return undefined;
    }

    return {};
}

export function unsetRequestEnv(req: IncomingMessage, key: string) {
    if (envSymbol in req) {
        if (hasOwnProperty((req as any)[envSymbol], key)) {
            delete (req as any)[envSymbol][key];
        }
    }
}
