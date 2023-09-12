import type { Router } from '../../router';
import { createNodeRequest, createNodeResponse } from '../node';
import type { DispatchRawRequestOptions, RawRequest, RawResponse } from './type';

export async function dispatchRawRequest(
    router: Router,
    request: RawRequest,
    options: DispatchRawRequestOptions = {},
) : Promise<RawResponse> {
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

    try {
        await router.dispatch({ req, res });

        return {
            status: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.getHeaders(),
            body: (res as Record<string, any>).body,
        };
    } catch (e) {
        if (options.throwOnError) {
            throw e;
        }

        return {
            status: 404,
            statusMessage: 'Not found',
            headers: res.getHeaders(),
            body: (res as Record<string, any>).body,
        };
    }
}

export function createRawRequestDispatcher(router: Router) {
    return async (request: RawRequest) => {
        await dispatchRawRequest(router, request);
    };
}
