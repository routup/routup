import { getProperty, setProperty } from '../../utils';
import type { Request } from '../types';

const symbol = Symbol.for('ReqParams');

export function useRequestParams(req: Request) : Record<string, any> {
    return getProperty(req, symbol) ||
        getProperty(req, 'params') ||
        {};
}

export function useRequestParam(req: Request, key: string) : any {
    return useRequestParams(req)[key];
}

export function setRequestParams(
    req: Request,
    data: Record<string, any>,
) {
    setProperty(req, symbol, data);
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
