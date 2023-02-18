/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import type { Request } from '../../type';

const ParamsSymbol = Symbol.for('ReqParams');

export function useRequestParams(req: Request) : Record<string, any> {
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
