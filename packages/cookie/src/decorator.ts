/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createParameterDecorator } from 'routup';
import { useRequestCookie, useRequestCookies } from './module';

export function DCookies() : ParameterDecorator {
    return createParameterDecorator((req) => useRequestCookies(req))();
}

export function DCookie(name: string) : ParameterDecorator {
    return createParameterDecorator((req) => useRequestCookie(req, name))(name);
}
