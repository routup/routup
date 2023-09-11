import type { Router } from '../../router';
import type { NodeRequest, NodeResponse } from './type';

export async function dispatchNodeRequest(
    router: Router,
    req: NodeRequest,
    res: NodeResponse,
) {
    await router.dispatch({ req, res });
}
