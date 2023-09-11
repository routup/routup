import type { Router } from '../../router';
import { createNodeRequest, createNodeResponse } from '../node';
import type { RawRequest, RawResponse } from './type';

export async function dispatchRawRequest(router: Router, request: RawRequest) : Promise<RawResponse> {
    const req = createNodeRequest({
        url: request.path,
        method: request.method,
        body: request.body,
    });
    const res = createNodeResponse(req);

    const headers = new Headers(request.headers);
    headers.forEach((value, key) => {
        req.headers[key] = value;
    });

    await router.dispatch({ req, res });

    return {
        status: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.getHeaders(),
        body: (res as Record<string, any>).body,
    };
}

export function createRawRequestDispatcher(router: Router) {
    return async (request: RawRequest) => {
        await dispatchRawRequest(router, request);
    };
}
