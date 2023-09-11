import { hasOwnProperty, merge } from 'smob';
import type { NodeRequest } from '../../bridge';

const envSymbol = Symbol.for('ReqEnv');

export function setRequestEnv(req: NodeRequest, key: string, value: unknown) : void;
export function setRequestEnv(req: NodeRequest, record: Record<string, any>, append?: boolean) : void;
export function setRequestEnv(req: NodeRequest, key: Record<string, any> | string, value?: boolean | unknown) : void {
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

export function useRequestEnv(req: NodeRequest) : Record<string, any>;
export function useRequestEnv(req: NodeRequest, key: string) : unknown | undefined;
export function useRequestEnv(req: NodeRequest, key?: string) {
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

export function unsetRequestEnv(req: NodeRequest, key: string) {
    if (envSymbol in req) {
        if (hasOwnProperty((req as any)[envSymbol], key)) {
            delete (req as any)[envSymbol][key];
        }
    }
}
