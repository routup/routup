/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Request } from '../../type';

export function useRequestPath(req: Request) : string {
    if ('path' in req) {
        return (req as any).path;
    }

    if (typeof req.url === 'undefined') {
        return '/';
    }

    const parsed = new URL(req.url, 'http://localhost/');

    return parsed.pathname;
}
