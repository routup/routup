/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { DecoratorConfig } from '@trapi/swagger';
import { DecoratorID } from '@trapi/swagger';

export function buildSwaggerDecoratorConfig() : DecoratorConfig[] {
    return [
        {
            id: DecoratorID.CONSUMES,
            name: 'DConsumes',
            properties: {
                value: {
                    amount: -1, strategy: 'merge',
                },
            },
        },
        {
            id: DecoratorID.DEPRECATED,
            name: 'DDeprecated',
        },
        {
            id: DecoratorID.DESCRIPTION,
            name: 'DDescription',
            properties: {
                type: { isType: true },
                payload: { index: 2 },
                statusCode: { index: 0 },
                description: { index: 1 },
            },
        },
        {
            id: DecoratorID.EXAMPLE,
            name: 'DExample',
            properties: {
                type: { isType: true },
                payload: {},
            },
        },
        {
            id: DecoratorID.HIDDEN,
            name: 'DHidden',
        },
        {
            id: DecoratorID.SECURITY,
            name: 'DSecurity',
            properties: {
                key: { index: 1 },
                value: { index: 0 },
            },
        },
        {
            id: DecoratorID.TAGS,
            name: 'DTags',
            properties: {
                value: { amount: -1, strategy: 'merge' },
            },
        },
    ];
}
