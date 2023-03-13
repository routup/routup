/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { DecoratorID } from '@trapi/swagger';
import type { DecoratorConfig } from '@trapi/swagger';

export function buildParameterDecoratorConfig() : DecoratorConfig[] {
    return [
        {
            id: DecoratorID.CONTEXT,
            name: 'DRequest',
            properties: {},
        },
        {
            id: DecoratorID.CONTEXT,
            name: 'DResponse',
            properties: {},
        },
        {
            id: DecoratorID.CONTEXT,
            name: 'DNext',
            properties: {},
        },
        {
            id: DecoratorID.QUERY,
            name: 'DQuery',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.BODY,
            name: 'DBody',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.HEADER,
            name: 'DHeader',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.HEADERS,
            name: 'DHeaders',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.COOKIE,
            name: 'DCookie',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.COOKIES,
            name: 'DCookies',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.PATH,
            name: 'DPath',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.PATHS,
            name: 'DPaths',
            properties: {
                value: {},
            },
        },
    ];
}
