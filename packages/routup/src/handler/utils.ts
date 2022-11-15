/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isObject } from 'smob';
import { send } from '../helpers';
import { ClassType, Next, Response } from '../type';
import { isPromise } from '../utils';
import { Handler, HandlerInterface } from './type';

export function isHandlerClassInstance(input: unknown) : input is HandlerInterface {
    return isObject(input) &&
        typeof (input as any).run === 'function';
}

export function createHandlerForClassType(item: ClassType) : Handler {
    return (req, res, next) => {
        try {
            const middle = new (item as ClassType)();

            if (isHandlerClassInstance(middle)) {
                middle.run(req, res, next);
            } else {
                /* istanbul ignore next */
                middle(req, res, next);
            }
        } catch (e) {
            /* istanbul ignore next */
            if (e instanceof Error) {
                next(e);
            }
        }
    };
}

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
