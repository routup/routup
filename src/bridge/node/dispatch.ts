import type { Router } from '../../router';
import type { NodeRequest, NodeResponse } from './type';

export function dispatchNodeRequest(
    router: Router,
    req: NodeRequest,
    res: NodeResponse,
): Promise<void> {
    return router.dispatch({ req, res });
}
