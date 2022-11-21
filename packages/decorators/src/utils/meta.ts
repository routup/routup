/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { DecoratorMeta } from '../type';

const symbol = Symbol.for('DecoratorMeta');

export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    if (symbol in target) {
        return (target as any)[symbol];
    }

    (target as any)[symbol] = {
        url: '',
        middlewares: [],
        methods: {},
        parameters: {},
    } as DecoratorMeta;

    return (target as any)[symbol];
}
