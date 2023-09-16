import type { Request } from '../types';

const ReqMountPathSymbol = Symbol.for('ReqMountPath');

export function useRequestMountPath(req: Request) : string {
    if (ReqMountPathSymbol in req) {
        return (req as any)[ReqMountPathSymbol];
    }

    return '/';
}

export function setRequestMountPath(req: Request, basePath: string) {
    (req as any)[ReqMountPathSymbol] = basePath;
}
