import { createRequest } from '../../request';
import { createResponse } from '../../response';
import type { Router } from '../../router';
import type { DispatchRawRequestOptions, RawRequest, RawResponse } from './type';

export async function dispatchRawRequest(
    router: Router,
    request: RawRequest,
    options: DispatchRawRequestOptions = {},
) : Promise<RawResponse> {
    const req = createRequest({
        url: request.path,
        method: request.method,
        body: request.body,
    });
    const res = createResponse(req);

    const headers = new Headers(request.headers);
    headers.forEach((value, key) => {
        req.headers[key] = value;
    });

    try {
        const dispatched = await router.dispatch({ req, res });
        if (dispatched) {
            return {
                status: res.statusCode,
                statusMessage: res.statusMessage,
                headers: res.getHeaders(),
                body: (res as Record<string, any>).body,
            };
        }

        return {
            status: 404,
            headers: res.getHeaders(),
            body: (res as Record<string, any>).body,
        };
    } catch (e) {
        if (options.throwOnError) {
            throw e;
        }

        return {
            status: 500,
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
