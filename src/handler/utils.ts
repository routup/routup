import type { Next, Response } from '../type';
import { send } from '../helpers';
import { isPromise } from '../utils';

export function processHandlerExecutionOutput(res: Response, next: Next, output?: unknown) {
    if (isPromise(output)) {
        output
            .then((r) => {
                if (typeof r !== 'undefined') {
                    send(res, r);
                }

                return r;
            })
            .catch(next);
        return;
    }

    if (typeof output !== 'undefined') {
        send(res, output);
    }
}
