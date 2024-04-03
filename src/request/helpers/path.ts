import { getProperty, setProperty } from '../../utils';
import type { Request } from '../types';

const PathSymbol = Symbol.for('ReqPath');

export function useRequestPath(req: Request) : string {
    const path = getProperty(req, 'path') ||
        getProperty(req, PathSymbol);

    if (path) {
        return path;
    }

    if (typeof req.url === 'undefined') {
        return '/';
    }

    const parsed = new URL(req.url, 'http://localhost/');
    setProperty(req, PathSymbol, parsed.pathname);

    return parsed.pathname;
}
