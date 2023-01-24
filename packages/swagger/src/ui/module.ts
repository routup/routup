/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
    Next,
    Request,
    Response,
    send,
} from '@routup/core';
import { createHandler } from '@routup/static';
import { merge } from 'smob';
import { UIOptions } from './type';

/* istanbul ignore next */
const stringify = (obj: Record<string, any>) => {
    const placeholder = '____FUNCTION_PLACEHOLDER____';
    const fns : CallableFunction[] = [];

    let json = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') {
            fns.push(value);
            return placeholder;
        }

        return value;
    }, 2);

    json = json.replace(new RegExp(`"${placeholder}"`, 'g'), (_) => fns.shift() as any);

    return `var options = ${json};`;
};

export function createUIHandler(
    document: Record<string, any> | string,
    options?: UIOptions,
) {
    const handler = createHandler(path.dirname(require.resolve('swagger-ui-dist')), {
        extensions: [],
    });

    const initOptions : UIOptions = merge(
        {},
        options || {},
        {
            spec: typeof document !== 'string' ? document : undefined,
            url: typeof document === 'string' ? document : undefined,
            urls: undefined,
        },
    );

    const template = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'template.tpl'), {
        encoding: 'utf-8',
    })
        .replace('<% title %>', 'Swagger UI')
        .replace('<% swaggerOptions %>', stringify(initOptions));

    return (req: Request, res: Response, next: Next) => {
        /* istanbul ignore next */
        if (typeof req.url === 'undefined') {
            next();
            return;
        }

        if (req.url.includes('/package.json')) {
            res.statusCode = 404;
            send(res);

            return;
        }

        handler(req, res, () => {
            send(res, template);
        });
    };
}
