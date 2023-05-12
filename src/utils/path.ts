/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Path } from '../type';

export function isPath(input: unknown) : input is Path {
    return typeof input === 'string' || input instanceof RegExp;
}
