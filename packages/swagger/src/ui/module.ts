/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    cleanDoubleSlashes,
    send,
    useRequestMountPath,
    withLeadingSlash,
    withTrailingSlash,
    withoutLeadingSlash,
} from '@routup/core';
import fs from 'node:fs';
import path from 'node:path';
import type {
    Next,
    Request,
    Response,
} from '@routup/core';
import { createHandler } from '@routup/static';
import { merge } from 'smob';
import { getAssetsPath } from '../utils';
import type { UIOptions } from './type';

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

    let template : string | undefined;
    const templateRaw = fs.readFileSync(path.join(getAssetsPath(), 'template.tpl'), {
        encoding: 'utf-8',
    });

    const compileTemplate = (context: {url?: string, mountPath: string}) : void => {
        let href = '/';
        if (context.url) {
            let pathName : string;
            if (context.url.startsWith('http')) {
                pathName = new URL(context.url).pathname;
            } else {
                pathName = context.url;
            }

            const mountPathIndex = pathName.indexOf(context.mountPath);
            if (mountPathIndex !== -1) {
                href = pathName.substring(0, mountPathIndex + context.mountPath.length);
            } else {
                href = pathName;
            }

            if (initOptions.baseUrl) {
                href = new URL(withoutLeadingSlash(href), initOptions.baseUrl).href;
            } else if (initOptions.basePath) {
                href = withLeadingSlash(cleanDoubleSlashes(`${initOptions.basePath}/${href}`));
            }

            href = withTrailingSlash(href);
        } else if (initOptions.baseUrl) {
            href = withTrailingSlash(initOptions.baseUrl);
        } else if (initOptions.basePath) {
            href = withTrailingSlash(withLeadingSlash(initOptions.basePath));
        }

        template = templateRaw
            .replace('<% title %>', 'Swagger UI')
            .replace('<% swaggerOptions %>', stringify(initOptions))
            .replace('<% baseHref %>', href);
    };

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

        handler(req, res, async () => {
            if (typeof template === 'undefined') {
                compileTemplate({ url: req.url, mountPath: useRequestMountPath(req) });
            }

            send(res, template);
        });
    };
}
