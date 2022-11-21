/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ClassType } from '../type';

export type DecoratorMethodOptions = {
    method: string;
    url: string;
    middlewares: ClassType[];
};
