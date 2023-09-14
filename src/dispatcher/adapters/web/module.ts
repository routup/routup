import { MethodName } from '../../../constants';
import type { Router } from '../../../router';
import type { WebRequest } from '../../../types';
import { transformHeadersToTuples } from '../../../utils';
import { dispatchRawRequest } from '../raw';
import type { DispatchWebRequestOptions } from './type';

export async function dispatchWebRequest(
    router: Router,
    request: WebRequest,
    options: DispatchWebRequestOptions = {},
) : Promise<Response> {
    const url = new URL(request.url);
    const headers : Record<string, string | string[]> = {};

    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    const res = await dispatchRawRequest(
        router,
        {
            method: request.method,
            path: url.pathname + url.search,
            headers,
            body: request.body,
        },
        options,
    );

    let body : BodyInit | null | undefined;
    if (
        request.method === MethodName.HEAD ||
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
