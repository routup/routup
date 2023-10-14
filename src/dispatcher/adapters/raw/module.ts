import { createRequest } from '../../../request';
import { isError } from '../../../error';
import { createResponse } from '../../../response';
import type { Router } from '../../../router';
import { createDispatcherEvent } from '../../event';
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

    const createRawResponse = (input: Partial<RawResponse> = {}) : RawResponse => ({
        status: input.status || res.statusCode,
        statusMessage: input.statusMessage || res.statusMessage,
        headers: getHeaders(),
        body: (res as Record<string, any>).body,
    });

    try {
        const event = createDispatcherEvent({
            req,
            res,
            path: request.path,
        });

        const dispatched = await router.dispatch(event);

        if (dispatched) {
            return createRawResponse();
        }

        return createRawResponse({
            status: 404,
        });
    } catch (e) {
        if (options.throwOnError) {
            throw e;
        }

        if (isError(e)) {
            return createRawResponse({
                status: e.statusCode,
                statusMessage: e.statusMessage,
            });
        }

        return createRawResponse({
            status: 500,
        });
    }
}

export function createRawDispatcher(router: Router) {
    return async (request: RawRequest) => dispatchRawRequest(router, request);
}
