/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ConfigOptions } from '../type';
import { buildConfigEtagOption } from './etag';

export function buildConfigDefaultOptions() : ConfigOptions {
    return {
        env: process.env.NODE_ENV || 'development',
        trustProxy: () => false,
        subdomainOffset: 2,
        etag: buildConfigEtagOption(),
        proxyIpHeader: 'X-Forwarded-For',
        caseSensitive: true,
        requestIdHeader: 'request-id',
    };
}
