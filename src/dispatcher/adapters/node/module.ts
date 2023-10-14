import type { RequestListener } from 'node:http';
import { MethodName } from '../../../constants';
import { isError } from '../../../error';
import type { Request } from '../../../request';
import { useRequestPath } from '../../../request';
import type { Response } from '../../../response';
import { isResponseGone } from '../../../response';
import type { Router } from '../../../router';
import { toMethodName } from '../../../utils';
import { createDispatcherEvent } from '../../event';

export async function dispatchNodeRequest(
    router: Router,
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const event = createDispatcherEvent({
            request: req,
            response: res,
            path: useRequestPath(req),
            method: toMethodName(req.method, MethodName.GET),
        });

        const dispatched = await router.dispatch(event);

        if (dispatched) {
            return;
        }

        if (!isResponseGone(res)) {
            res.statusCode = 404;
            res.end();
        }
    } catch (e) {
        if (!isResponseGone(res)) {
            if (isError(e)) {
                res.statusCode = e.statusCode;
                if (e.statusMessage) {
                    res.statusMessage = e.statusMessage;
                }
            } else {
                res.statusCode = 500;
            }

            res.end();
        }
    }
}

export function createNodeDispatcher(router: Router): RequestListener {
    return (req: Request, res: Response) => {
        // eslint-disable-next-line no-void
        void dispatchNodeRequest(router, req, res);
    };
}
