import type { Request } from '../types';

const routerSymbol = Symbol.for('ReqRouterID');
export function setRequestRouterPath(req: Request, path: number[]) {
    (req as Record<symbol | string, any>)[routerSymbol] = path;
}

export function useRequestRouterPath(req: Request) : number[] | undefined {
    if (routerSymbol in req) {
        return (req as Record<symbol | string, any>)[routerSymbol];
    }

    return undefined;
}
