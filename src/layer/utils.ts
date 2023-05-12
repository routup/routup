/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isInstance } from '../utils';
import type { Layer } from './module';

export function isLayerInstance(input: unknown) : input is Layer {
    return isInstance(input, 'Layer');
}
