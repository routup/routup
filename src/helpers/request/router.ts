import type { NodeRequest } from '../../bridge';

const routerSymbol = Symbol.for('ReqRouterID');
export function setRequestRouterIds(req: NodeRequest, ids: number[]) {
    (req as Record<symbol | string, any>)[routerSymbol] = ids;
}

export function useRequestRouterIds(req: NodeRequest) : number[] | undefined {
    if (routerSymbol in req) {
        return (req as Record<symbol | string, any>)[routerSymbol];
    }

    return undefined;
}
