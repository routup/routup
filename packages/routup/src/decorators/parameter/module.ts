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

export const DRequest = createParameterDecorator((req) => req);

export const DResponse = createParameterDecorator((req, res) => res);

export const DNext = createParameterDecorator((req, res, next) => next);

export const DParams = createParameterDecorator((req, res, next, key) => {
    if (typeof key === 'string') {
        return useRequestParam(req, key);
    }

    return useRequestParams(req);
});

export const DHeaders = createParameterDecorator((req, res, next, key) => {
    if (typeof key === 'string') {
        return req.headers[key.toLowerCase()];
    }

    return req.headers;
});
