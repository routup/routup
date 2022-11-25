/*
 * Copyright (c) 2021.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Config } from './module';
import { ConfigOptions, ConfigOptionsInput } from './type';
import { buildConfigDefaultOptions, buildConfigEtagOption, buildConfigTrustProxyOption } from './utils';

let instance : Config<ConfigOptions, ConfigOptionsInput> | undefined;

export function useConfig() : Config<ConfigOptions, ConfigOptionsInput> {
    if (typeof instance !== 'undefined') {
        return instance;
    }

    instance = new Config<ConfigOptions, ConfigOptionsInput>({
        defaults: buildConfigDefaultOptions(),
        transform: (key, value) => {
            switch (key) {
                /* istanbul ignore next */
                case 'etag':
                    return buildConfigEtagOption(value);
                /* istanbul ignore next */
                case 'trustProxy':
                    return buildConfigTrustProxyOption(value);
                default:
                    return value;
            }
        },
    });

    return instance;
}
