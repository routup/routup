import { merge } from 'smob';
import type { NodeRequest } from '../../bridge';
import { isObject } from '../../utils';

const BodySymbol = Symbol.for('ReqBody');

export function useRequestBody(req: NodeRequest) : Record<string, any>;
export function useRequestBody(req: NodeRequest, key: string) : any | undefined;
export function useRequestBody(req: NodeRequest, key?: string) {
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

export function hasRequestBody(req: NodeRequest) : boolean {
    return 'body' in req || BodySymbol in req;
}

export function setRequestBody(req: NodeRequest, key: string, value: unknown) : void;
export function setRequestBody(req: NodeRequest, record: Record<string, any>) : void;
export function setRequestBody(req: NodeRequest, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[BodySymbol] = key;
        return;
    }

    (req as any)[BodySymbol] = {
        [key]: value,
    };
}

export function extendRequestBody(req: NodeRequest, key: string, value: unknown) : void;
export function extendRequestBody(req: NodeRequest, record: Record<string, any>) : void;
export function extendRequestBody(req: NodeRequest, key: Record<string, any> | string, value?: unknown) : void {
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
