/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ClassType } from '../../type';
import { useDecoratorMeta } from '../utils';

export function createClassDecorator(
    url: string,
    middlewares?: ClassType[],
) : ClassDecorator {
    return (target: any) : void => {
        const meta = useDecoratorMeta(target.prototype);

        meta.url = url;
        meta.middlewares = [];

        if (Array.isArray(middlewares)) {
            meta.middlewares = [
                ...meta.middlewares,
                ...middlewares,
            ];
        }
    };
}

export function DController(
    url: string,
    middlewares?: ClassType[],
) : ClassDecorator {
    return createClassDecorator(url, middlewares);
}
