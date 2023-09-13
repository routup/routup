import type { Router } from '../../router';
import type { Request, Response } from '../../types';

export function dispatchNodeRequest(
    router: Router,
    req: Request,
    res: Response,
): Promise<void> {
    return router.dispatch({ req, res });
}
