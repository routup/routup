import type { Request } from '../../types';

const routerSymbol = Symbol.for('ReqRouterID');
export function setRequestRouterIds(req: Request, ids: number[]) {
    (req as Record<symbol | string, any>)[routerSymbol] = ids;
}

export function useRequestRouterIds(req: Request) : number[] | undefined {
    if (routerSymbol in req) {
        return (req as Record<symbol | string, any>)[routerSymbol];
    }

    return undefined;
}
