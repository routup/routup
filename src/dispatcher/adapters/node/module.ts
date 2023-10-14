import type { RequestListener } from 'node:http';
import { isError } from '../../../error';
import { useRequestPath } from '../../../request';
import type { Request } from '../../../request';
import type { Response } from '../../../response';
import { isResponseGone } from '../../../response';
import type { Router } from '../../../router';
import { createDispatcherEvent } from '../../event';

export async function dispatchNodeRequest(
    router: Router,
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const event = createDispatcherEvent({
            req,
            res,
            path: useRequestPath(req),
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
