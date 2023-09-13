import type { IncomingHttpHeaders } from 'node:http';

import type { Request } from '../../types';

export function getRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
) : IncomingHttpHeaders[K] {
    return req.headers[name];
}

export function setRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
    value: IncomingHttpHeaders[K],
) {
    req.headers[name] = value;
}
