/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';

export function useRequestPath(req: IncomingMessage) : string {
    if ('path' in req) {
        return (req as any).path;
    }

    if (typeof req.url === 'undefined') {
        return '/';
    }

    const parsed = new URL(req.url, 'http://localhost/');

    return parsed.pathname;
}

const RelativePathSymbol = Symbol.for('ReqRelativePath');

export function setRequestRelativePath(req: IncomingMessage, path: string) {
    (req as any)[RelativePathSymbol] = path;
}

export function useRequestRelativePath(req: IncomingMessage) {
    if (RelativePathSymbol in req) {
        return (req as any)[RelativePathSymbol];
    }

    return '/';
}
