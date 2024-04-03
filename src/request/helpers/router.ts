import { getProperty, setProperty } from '../../utils';
import type { Request } from '../types';

const routerSymbol = Symbol.for('ReqRouterID');
export function setRequestRouterPath(req: Request, path: number[]) {
    setProperty(req, routerSymbol, path);
}

export function useRequestRouterPath(req: Request) : number[] | undefined {
    return getProperty(req, routerSymbol);
}
