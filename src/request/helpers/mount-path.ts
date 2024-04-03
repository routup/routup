import { getProperty, setProperty } from '../../utils';
import type { Request } from '../types';

const symbol = Symbol.for('ReqMountPath');

export function useRequestMountPath(req: Request) : string {
    return getProperty<string>(req, symbol) || '/';
}

export function setRequestMountPath(req: Request, basePath: string) {
    setProperty(req, symbol, basePath);
}
