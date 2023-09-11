import { MethodName } from '../../constants';
import type { Router } from '../../router';
import { transformHeadersToTuples } from '../../utils';
import { dispatchRawRequest } from '../raw';

export async function dispatchWebRequest(
    router: Router,
    request: Request,
) : Promise<Response> {
    const url = new URL(request.url);
    const res = await dispatchRawRequest(router, {
        method: request.method,
        path: url.pathname + url.search,
        headers: request.headers,
        body: request.body,
    });

    let body : BodyInit | null | undefined;
    if (request.method === MethodName.HEAD) {
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
