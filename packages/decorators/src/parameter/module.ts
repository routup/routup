/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    useRequestBody,
    useRequestCookie,
    useRequestCookies,
    useRequestParam,
    useRequestParams,
    useRequestQuery,
} from 'routup';
import { useDecoratorMeta } from '../utils';
import type { DecoratorParameterBuildFn } from './type';

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

export function DPaths() : ParameterDecorator {
    return createParameterDecorator((req, res, next) => useRequestParams(req))();
}

export function DPath(property: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next) => useRequestParam(req, property))(property);
}

export function DHeaders() : ParameterDecorator {
    return createParameterDecorator((req, res, next) => req.headers)();
}

export function DHeader(property: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next) => req.headers[property])(property);
}

export function DBody(property?: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next, key) => {
        if (typeof key === 'string') {
            return useRequestBody(req, key);
        }

        return useRequestBody(req);
    })(property);
}

export function DQuery(property?: string) : ParameterDecorator {
    return createParameterDecorator((req, res, next, key) => {
        if (typeof key === 'string') {
            return useRequestQuery(req, key);
        }

        return useRequestQuery(req);
    })(property);
}

export function DCookies() : ParameterDecorator {
    return createParameterDecorator((req) => useRequestCookies(req))();
}

export function DCookie(name: string) : ParameterDecorator {
    return createParameterDecorator((req) => useRequestCookie(req, name))(name);
}
