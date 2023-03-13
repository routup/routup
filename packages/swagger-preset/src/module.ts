/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { DecoratorConfig } from '@trapi/swagger';
import { buildClassDecoratorConfig } from './class';
import { buildMethodDecoratorConfig } from './method';
import { buildParameterDecoratorConfig } from './parameter';
import { buildSwaggerDecoratorConfig } from './swagger';

export function buildDecoratorConfig() : DecoratorConfig[] {
    return [
        ...buildSwaggerDecoratorConfig(),
        ...buildMethodDecoratorConfig(),
        ...buildClassDecoratorConfig(),
        ...buildParameterDecoratorConfig(),
    ];
}
