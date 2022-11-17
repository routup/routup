/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import fs from 'fs';
import path from 'path';
import {
    Next,
    Request,
    Response,
    send,
    useRequestMountPath,
    useRequestPath,
} from 'routup';
import serveStatic from 'serve-static';
import { merge } from 'smob';
import swaggerUi from 'swagger-ui-dist';
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
    const staticMiddleware = serveStatic(swaggerUi.getAbsoluteFSPath(), {
        index: false,
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
        if (typeof req.url !== 'string') {
            next();
            return;
        }

        if (req.url.includes('/package.json')) {
            res.statusCode = 404;
            send(res);

            return;
        }

        const mountPath = useRequestMountPath(req);
        let requestPath = useRequestPath(req);
        if (requestPath.startsWith(mountPath)) {
            requestPath = requestPath.substring(mountPath.length);
        }

        req.url = requestPath;

        staticMiddleware(req, res, () => {
            send(res, template);
        });
    };
}
