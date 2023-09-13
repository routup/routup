import { extendsClientError, extendsServerError } from '@ebec/http';
import type { RequestListener } from 'node:http';
import { isResponseGone } from '../../response';
import type { Router } from '../../router';
import type { Request, Response } from '../../types';
import { dispatchNodeRequest } from './dispatch';

export function createNodeListener(router: Router): RequestListener {
    return (req: Request, res: Response) => {
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
