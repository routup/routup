/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { URL } from 'node:url';
import type { Request } from '../../type';

const PathSymbol = Symbol.for('ReqPath');

export function useRequestPath(req: Request) : string {
    if ('path' in req) {
        return (req as any).path;
    }

    if (PathSymbol in req) {
        return (req as any)[PathSymbol];
    }

    if (typeof req.url === 'undefined') {
        return '/';
    }

    const parsed = new URL(req.url, 'http://localhost/');

    (req as any)[PathSymbol] = parsed.pathname;

    return (req as any)[PathSymbol];
}
