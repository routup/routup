import { extendsClientError, extendsServerError } from '@ebec/http';
import type { RequestListener } from 'node:http';
import { isResponseGone } from '../../helpers';
import type { Router } from '../../router';
import { dispatchNodeRequest } from './dispatch';
import type { NodeRequest, NodeResponse } from './type';

export function createNodeListener(router: Router): RequestListener {
    return (req: NodeRequest, res: NodeResponse) => {
        dispatchNodeRequest(router, req, res)
            .catch((err) => {
                res.statusCode = 400;

                if (extendsClientError(err) || extendsServerError(err)) {
                    const statusCode = err.getOption('statusCode');
                    if (typeof statusCode === 'number') {
                        res.statusCode = statusCode;
                    }
                }

                if (!isResponseGone(res)) {
                    res.end();
                }
            });
    };
}
