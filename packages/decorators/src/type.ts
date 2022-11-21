/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Next, Request, Response } from 'routup';
import { DecoratorMethodOptions } from './method';
import { DecoratorParameterOptions } from './parameter';

export interface ClassType extends Function {
    new(...args: any[]): any;
}

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

export interface HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void;
}
