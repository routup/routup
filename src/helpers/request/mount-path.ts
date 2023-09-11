import type { NodeRequest } from '../../bridge';

const ReqMountPathSymbol = Symbol.for('ReqMountPath');

export function useRequestMountPath(req: NodeRequest) : string {
    if (ReqMountPathSymbol in req) {
        return (req as any)[ReqMountPathSymbol];
    }

    return '/';
}

export function setRequestMountPath(req: NodeRequest, basePath: string) {
    (req as any)[ReqMountPathSymbol] = basePath;
}
