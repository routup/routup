import type { Request } from '../types';
import { getRequestHeader } from './header';

export function isRequestHTTP2(req: Request) {
    return (
        typeof getRequestHeader(req, ':path') !== 'undefined' &&
        typeof getRequestHeader(req, ':method') !== 'undefined'
    );
}
