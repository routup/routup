/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Next, Request, Response } from 'routup';

export type DecoratorParameterBuildFn = (
    req: Request,
    res: Response,
    next: Next,
    property?: string
) => any;

export type DecoratorParameterOptions = {
    index: number,
    build: DecoratorParameterBuildFn,
    property?: string,
};
