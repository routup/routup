/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ClassType } from '../type';
import { DecoratorMethodOptions } from './method';
import { DecoratorParameterOptions } from './parameter';

export type DecoratorMeta = {
    url: string,

    methods: {
        [key: string]: DecoratorMethodOptions
    },

    middlewares: ClassType[],

    parameters: {
        [key: string]: DecoratorParameterOptions[]
    }
};
