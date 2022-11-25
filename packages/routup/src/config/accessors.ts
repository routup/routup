/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { useConfig } from './singleton';
import { ConfigOptions, ConfigOptionsInput } from './type';

/**
 * Fast set config option accessor.
 *
 * @param key
 * @param value
 */
export function setConfigOption<K extends keyof ConfigOptionsInput>(key: K, value: ConfigOptionsInput[K]) {
    const config = useConfig();

    config.set(key, value);
}

/**
 * Fast get config option accessor.
 *
 * @param key
 */
export function getConfigOption<K extends keyof ConfigOptions>(key: K) : ConfigOptions[K] {
    const config = useConfig();

    return config.get(key);
}
