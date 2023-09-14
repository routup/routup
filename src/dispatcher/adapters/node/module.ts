import type { RequestListener } from 'node:http';
import { isResponseGone } from '../../../response';
import type { Router } from '../../../router';
import type { Request, Response } from '../../../types';

export async function dispatchNodeRequest(
    router: Router,
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const dispatched = await router.dispatch({ req, res });
        if (dispatched) {
            return;
        }

        if (!isResponseGone(res)) {
            res.statusCode = 404;
            res.end();
        }
    } catch (e) {
        if (!isResponseGone(res)) {
            res.statusCode = 500;
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
