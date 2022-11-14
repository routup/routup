/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { useRequestParam, useRequestParams } from '../../helpers';
import { useDecoratorMeta } from '../utils';
import { DecoratorParameterBuildFn } from './type';

export function createParameterDecorator(
    build: DecoratorParameterBuildFn,
) : ((property?: string) => ParameterDecorator) {
    return (property?: string) => (
        target: any,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        /* istanbul ignore next */
        if (typeof propertyKey !== 'string') {
            return;
        }

        const meta = useDecoratorMeta(target);
        if (typeof meta.parameters[propertyKey] === 'undefined') {
            meta.parameters[propertyKey] = [];
        }

        meta.parameters[propertyKey].push({
            index: parameterIndex,
            property,
            build,
        });
    };
}

export function DRequest() : ParameterDecorator {
    return createParameterDecorator((req) => req)();
}

export function DResponse() : ParameterDecorator {
    return createParameterDecorator((req, res) => res)();
}

export function DNext() : ParameterDecorator {
    return createParameterDecorator((req, res, next) => next)();
}

export function DParams() : ParameterDecorator {
    return createParameterDecorator((req, res, next) => useRequestParams(req))();
}

export function DParam(property: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next) => useRequestParam(req, property))(property);
}

export function DHeaders() : ParameterDecorator {
    return createParameterDecorator((req, res, next) => req.headers)();
}

export function DHeader(property: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next) => req.headers[property])(property);
}
