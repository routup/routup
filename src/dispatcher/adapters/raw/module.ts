import { createRequest, useRequestPath } from '../../../request';
import { createResponse } from '../../../response';
import type { Router } from '../../../router';
import { buildDispatcherMeta } from '../../utils';
import type {
    DispatchRawRequestOptions, RawRequest, RawResponse, RawResponseHeaders,
} from './type';

export async function dispatchRawRequest(
    router: Router,
    request: RawRequest,
    options: DispatchRawRequestOptions = {},
) : Promise<RawResponse> {
    const req = createRequest({
        url: request.path,
        method: request.method,
        body: request.body,
        headers: request.headers,
    });
    const res = createResponse(req);

    const getHeaders = () : RawResponseHeaders => {
        const output : RawResponseHeaders = {};

        const headers = res.getHeaders();
        const keys = Object.keys(headers);
        for (let i = 0; i < keys.length; i++) {
            const header = headers[keys[i]];
            if (typeof header === 'number') {
                output[keys[i]] = `${header}`;
            } else if (header) {
                output[keys[i]] = header;
            }
        }

        return output;
    };

    try {
        const dispatched = await router.dispatch(
            { req, res },
            buildDispatcherMeta({
                path: useRequestPath(req),
            }),
        );
        if (dispatched) {
            return {
                status: res.statusCode,
                statusMessage: res.statusMessage,
                headers: getHeaders(),
                body: (res as Record<string, any>).body,
            };
        }

        return {
            status: 404,
            headers: getHeaders(),
            body: (res as Record<string, any>).body,
        };
    } catch (e) {
        if (options.throwOnError) {
            throw e;
        }

        return {
            status: 500,
            headers: getHeaders(),
            body: (res as Record<string, any>).body,
        };
    }
}

export function createRawDispatcher(router: Router) {
    return async (request: RawRequest) => dispatchRawRequest(router, request);
}
