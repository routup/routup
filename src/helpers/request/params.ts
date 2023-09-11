import type { NodeRequest } from '../../bridge';

const ParamsSymbol = Symbol.for('ReqParams');

export function useRequestParams(req: NodeRequest) : Record<string, any> {
    /* istanbul ignore next */
    if ('params' in req) {
        return (req as any).params;
    }

    if (ParamsSymbol in req) {
        return (req as any)[ParamsSymbol];
    }

    return {};
}

export function useRequestParam(req: NodeRequest, key: string) : any {
    return useRequestParams(req)[key];
}

export function setRequestParams(
    req: NodeRequest,
    data: Record<string, any>,
) {
    (req as any)[ParamsSymbol] = data;
}

export function setRequestParam(
    req: NodeRequest,
    key: string,
    value: any,
) {
    const params = useRequestParams(req);
    params[key] = value;

    setRequestParams(req, params);
}
