import type { RequestListener } from 'node:http';
import { MethodName } from '../../constants';
import type { Request } from '../../request';
import { useRequestPath } from '../../request';
import type { Response } from '../../response';
import type { Router } from '../../router';
import { toMethodName } from '../../utils';
import { DispatchEvent } from '../../dispatcher';

export async function dispatchNodeRequest(
    router: Router,
    request: Request,
    response: Response,
): Promise<void> {
    const event = new DispatchEvent({
        request,
        response,
        path: useRequestPath(request),
        method: toMethodName(request.method, MethodName.GET),
    });

    await router.dispatch(event);

    if (event.dispatched) {
        return;
    }

    if (event.error) {
        event.response.statusCode = event.error.statusCode;
        if (event.error.statusMessage) {
            event.response.statusMessage = event.error.statusMessage;
        }

        event.response.end();

        return;
    }

    event.response.statusCode = 404;
    event.response.end();
}

export function createNodeDispatcher(router: Router): RequestListener {
    return (req: Request, res: Response) => {
        // eslint-disable-next-line no-void
        void dispatchNodeRequest(router, req, res);
    };
}
