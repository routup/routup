import type { RequestListener } from 'node:http';
import type { Router } from '../../router';
import { dispatchNodeRequest } from './dispatch';
import type { NodeRequest, NodeResponse } from './type';

export function createNodeListener(router: Router): RequestListener {
    return (req: NodeRequest, res: NodeResponse) => {
        Promise.resolve()
            .then(() => dispatchNodeRequest(router, req, res));
    };
}
