import type { Request } from '../../types';

const ParamsSymbol = Symbol.for('ReqParams');

export function useRequestParams(req: Request) : Record<string, any> {
    /* istanbul ignore next */
    if ('params' in req) {
        return (req as any).params;
    }

    if (ParamsSymbol in req) {
        return (req as any)[ParamsSymbol];
    }

    return {};
}

export function useRequestParam(req: Request, key: string) : any {
    return useRequestParams(req)[key];
}

export function setRequestParams(
    req: Request,
    data: Record<string, any>,
) {
    (req as any)[ParamsSymbol] = data;
}

export function setRequestParam(
    req: Request,
    key: string,
    value: any,
) {
    const params = useRequestParams(req);
    params[key] = value;

    setRequestParams(req, params);
}
