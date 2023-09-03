import type { Request } from '../../type';

const PathSymbol = Symbol.for('ReqPath');

export function useRequestPath(req: Request) : string {
    if ('path' in req) {
        return (req as any).path;
    }

    if (PathSymbol in req) {
        return (req as any)[PathSymbol];
    }

    if (typeof req.url === 'undefined') {
        return '/';
    }

    const parsed = new URL(req.url, 'http://localhost/');

    (req as any)[PathSymbol] = parsed.pathname;

    return (req as any)[PathSymbol];
}
