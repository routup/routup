/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createParameterDecorator } from 'routup';
import { useRequestQuery } from './module';

export function DQuery(property?: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next, key) => {
        if (typeof key === 'string') {
            return useRequestQuery(req, key);
        }

        return useRequestQuery(req);
    })(property);
}
