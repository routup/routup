/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isInstance } from '../utils';
import { Route } from './module';

export function isRouteInstance(input: unknown) : input is Route {
    return isInstance(input, 'Route');
}
