import type { IncomingHttpHeaders } from 'node:http';
import type { NodeRequest } from '../../type';

export function getRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: NodeRequest,
    name: K,
) : IncomingHttpHeaders[K] {
    return req.headers[name];
}

export function setRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: NodeRequest,
    name: K,
    value: IncomingHttpHeaders[K],
) {
    req.headers[name] = value;
}
