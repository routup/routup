/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { DecoratorConfig } from '@trapi/swagger';
import { DecoratorID } from '@trapi/swagger';

export function buildClassDecoratorConfig() : DecoratorConfig[] {
    return [
        {
            id: DecoratorID.CONTROLLER,
            name: 'DController',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DController',
            properties: {
                value: {},
            },
        },
    ];
}
