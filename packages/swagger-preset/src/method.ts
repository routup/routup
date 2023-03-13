/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { DecoratorConfig } from '@trapi/swagger';
import { DecoratorID } from '@trapi/swagger';

export function buildMethodDecoratorConfig() : DecoratorConfig[] {
    return [
        {
            id: DecoratorID.ALL,
            name: 'DAll',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DAll',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.DELETE,
            name: 'DDelete',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DDelete',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.GET,
            name: 'DGet',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DGet',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.HEAD,
            name: 'DHead',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DHead',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.OPTIONS,
            name: 'DOptions',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DOptions',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.PATCH,
            name: 'DPatch',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DPatch',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.POST,
            name: 'DPost',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DPost',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.PUT,
            name: 'DPut',
            properties: {},
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DPut',
            properties: {
                value: {},
            },
        },
    ];
}
