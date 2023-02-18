/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import type {
    Next, Request, Response,
} from 'routup';
import type { DecoratorParameterOptions } from '../parameter';

export function buildDecoratorMethodArguments(
    req: Request,
    res: Response,
    next: Next,
    parameters: DecoratorParameterOptions[],
): any[] {
    /* istanbul ignore next */
    if (parameters.length === 0) {
        return [req, res, next];
    }

    const items: any[] = [];

    for (let i = 0; i < parameters.length; i++) {
        const parameter = parameters[i];

        if (typeof parameter.property === 'string') {
            items[parameter.index] = parameter.build(req, res, next, parameter.property);
        } else {
            items[parameter.index] = parameter.build(req, res, next);
        }
    }

    return items;
}
