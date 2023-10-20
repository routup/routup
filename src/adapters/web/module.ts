import { MethodName } from '../../constants';
import type { Router } from '../../router';
import type { WebRequest } from '../../types';
import { toMethodName } from '../../utils';
import { dispatchRawRequest, transformHeadersToTuples } from '../raw';

export async function dispatchWebRequest(
    router: Router,
    request: WebRequest,
) : Promise<Response> {
    const url = new URL(request.url);
    const headers : Record<string, string | string[]> = {};

    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    const method = toMethodName(request.method, MethodName.GET);

    const res = await dispatchRawRequest(
        router,
        {
            method,
            path: url.pathname + url.search,
            headers,
            body: request.body,
        },
    );

    let body : BodyInit | null | undefined;
    if (
        method === MethodName.HEAD ||
        res.status === 304 ||
        res.status === 101 ||
        res.status === 204 ||
        res.status === 205
    ) {
        body = null;
    } else {
        body = res.body;
    }

    return new Response(body, {
        headers: transformHeadersToTuples(res.headers),
        status: res.status,
        statusText: res.statusMessage,
    });
}

export function createWebDispatcher(router: Router) {
    return async (request: WebRequest) => dispatchWebRequest(router, request);
}
