/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { PathMatcherOptions } from '../path';
import type { Path } from '../type';

export type LayerOptions = {
    path: Path,

    pathMatcher: PathMatcherOptions
};
